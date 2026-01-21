"""
Google AI Services Integration

Unified client for Google's AI services:
- Gemini (text generation, scripting)
- Veo (video generation)
- Imagen 3 / Nano Banana (image generation)
- Gemini TTS (voice/speech generation)
"""

import asyncio
import base64
from dataclasses import dataclass
from enum import Enum
from typing import Any
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from lensio.core import settings


class GoogleModel(str, Enum):
    """Available Google AI models."""
    # Text/Script Generation
    GEMINI_2_5_PRO = "gemini-2.5-pro-preview"
    GEMINI_2_5_FLASH = "gemini-2.5-flash-preview-05-20"
    
    # Image Generation (Nano Banana = Gemini 2.5 Flash Image)
    GEMINI_IMAGE = "gemini-2.5-flash-preview-native-audio-dialog"
    IMAGEN_3 = "imagen-3.0-generate-002"
    
    # Video Generation
    VEO_2 = "veo-2.0-generate-001"
    VEO_3 = "veo-3.0-generate-preview"
    
    # Text-to-Speech
    GEMINI_TTS_FLASH = "gemini-2.5-flash-preview-tts"
    GEMINI_TTS_PRO = "gemini-2.5-pro-preview-tts"


@dataclass
class GenerationResult:
    """Result from AI generation."""
    success: bool
    data: Any = None
    url: str | None = None
    raw_response: dict | None = None
    cost: float = 0.0
    latency_ms: float = 0.0
    error: str | None = None
    request_id: str = ""


class GoogleAIClient:
    """
    Unified Google AI client for all media generation.
    
    Uses Google AI Studio / Gemini API for all services.
    """
    
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.google_ai_api_key.get_secret_value()
        self.client = httpx.AsyncClient(timeout=300.0)  # 5 min timeout for video
    
    async def close(self):
        await self.client.aclose()
    
    # =========================================================================
    # TEXT GENERATION (Gemini)
    # =========================================================================
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def generate_text(
        self,
        prompt: str,
        system_prompt: str | None = None,
        model: GoogleModel = GoogleModel.GEMINI_2_5_FLASH,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> GenerationResult:
        """Generate text using Gemini."""
        import time
        start = time.time()
        
        url = f"{self.BASE_URL}/models/{model.value}:generateContent"
        
        contents = []
        if system_prompt:
            contents.append({
                "role": "user",
                "parts": [{"text": f"System: {system_prompt}"}]
            })
        contents.append({
            "role": "user", 
            "parts": [{"text": prompt}]
        })
        
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
            }
        }
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                params={"key": self.api_key},
            )
            response.raise_for_status()
            data = response.json()
            
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            
            # Estimate cost (Gemini 2.5 Flash pricing)
            usage = data.get("usageMetadata", {})
            input_tokens = usage.get("promptTokenCount", 0)
            output_tokens = usage.get("candidatesTokenCount", 0)
            cost = (input_tokens * 0.00001875) + (output_tokens * 0.000075)
            
            return GenerationResult(
                success=True,
                data=text,
                raw_response=data,
                cost=cost,
                latency_ms=(time.time() - start) * 1000,
            )
        except Exception as e:
            return GenerationResult(
                success=False,
                error=str(e),
                latency_ms=(time.time() - start) * 1000,
            )
    
    # =========================================================================
    # IMAGE GENERATION (Imagen 3 / Nano Banana)
    # =========================================================================
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=20))
    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str | None = None,
        aspect_ratio: str = "9:16",
        model: GoogleModel = GoogleModel.IMAGEN_3,
        number_of_images: int = 1,
    ) -> GenerationResult:
        """
        Generate image using Imagen 3 or Gemini native image generation.
        
        For Nano Banana (Gemini native), use GEMINI_IMAGE model.
        """
        import time
        start = time.time()
        
        # Use Vertex AI endpoint for Imagen 3
        url = f"{self.BASE_URL}/models/{model.value}:predict"
        
        payload = {
            "instances": [{
                "prompt": prompt,
            }],
            "parameters": {
                "sampleCount": number_of_images,
                "aspectRatio": aspect_ratio,
                "negativePrompt": negative_prompt or "",
                "personGeneration": "dont_allow",
                "safetySetting": "block_some",
            }
        }
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                params={"key": self.api_key},
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract generated images
            predictions = data.get("predictions", [])
            images = []
            for pred in predictions:
                if "bytesBase64Encoded" in pred:
                    images.append({
                        "base64": pred["bytesBase64Encoded"],
                        "mime_type": pred.get("mimeType", "image/png"),
                    })
            
            # Cost: ~$0.04 per image for Imagen 3
            cost = 0.04 * number_of_images
            
            return GenerationResult(
                success=True,
                data=images,
                raw_response=data,
                cost=cost,
                latency_ms=(time.time() - start) * 1000,
            )
        except Exception as e:
            return GenerationResult(
                success=False,
                error=str(e),
                latency_ms=(time.time() - start) * 1000,
            )
    
    # =========================================================================
    # VIDEO GENERATION (Veo)
    # =========================================================================
    
    @retry(stop=stop_after_attempt(2), wait=wait_exponential(min=5, max=30))
    async def generate_video(
        self,
        prompt: str,
        image_url: str | None = None,
        duration_seconds: int = 5,
        aspect_ratio: str = "9:16",
        model: GoogleModel = GoogleModel.VEO_2,
    ) -> GenerationResult:
        """
        Generate video using Google Veo.
        
        Supports:
        - Text-to-video (prompt only)
        - Image-to-video (prompt + reference image)
        """
        import time
        start = time.time()
        
        url = f"{self.BASE_URL}/models/{model.value}:generateVideo"
        
        payload = {
            "prompt": prompt,
            "generationConfig": {
                "aspectRatio": aspect_ratio,
                "durationSeconds": duration_seconds,
            }
        }
        
        # Add reference image for image-to-video
        if image_url:
            payload["referenceImages"] = [{
                "referenceType": "STYLE_REFERENCE",
                "referenceImage": {"imageUrl": image_url},
            }]
        
        try:
            # Veo generates asynchronously - start the job
            response = await self.client.post(
                url,
                json=payload,
                params={"key": self.api_key},
            )
            response.raise_for_status()
            data = response.json()
            
            # For Veo, we get an operation name to poll
            operation_name = data.get("name")
            
            if operation_name:
                # Poll for completion
                video_data = await self._poll_video_operation(operation_name)
                if video_data:
                    # Cost: ~$0.10-0.15 per second of video
                    cost = 0.12 * duration_seconds
                    return GenerationResult(
                        success=True,
                        data=video_data,
                        url=video_data.get("videoUrl"),
                        cost=cost,
                        latency_ms=(time.time() - start) * 1000,
                    )
            
            return GenerationResult(
                success=False,
                error="Video generation did not complete",
                latency_ms=(time.time() - start) * 1000,
            )
        except Exception as e:
            return GenerationResult(
                success=False,
                error=str(e),
                latency_ms=(time.time() - start) * 1000,
            )
    
    async def _poll_video_operation(
        self,
        operation_name: str,
        max_wait_seconds: int = 300,
        poll_interval: int = 10,
    ) -> dict | None:
        """Poll Veo operation until complete."""
        url = f"{self.BASE_URL}/{operation_name}"
        
        elapsed = 0
        while elapsed < max_wait_seconds:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
            
            try:
                response = await self.client.get(
                    url,
                    params={"key": self.api_key},
                )
                data = response.json()
                
                if data.get("done"):
                    if "response" in data:
                        return data["response"]
                    if "error" in data:
                        return None
            except Exception:
                continue
        
        return None
    
    # =========================================================================
    # TEXT-TO-SPEECH (Gemini TTS)
    # =========================================================================
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def generate_speech(
        self,
        text: str,
        voice_description: str = "A warm, professional male voice",
        model: GoogleModel = GoogleModel.GEMINI_TTS_FLASH,
        language: str = "en-US",
    ) -> GenerationResult:
        """
        Generate speech audio using Gemini TTS.
        
        Args:
            text: The text to convert to speech
            voice_description: Natural language description of voice style
            model: TTS model to use (Flash for speed, Pro for quality)
            language: Language code
        """
        import time
        start = time.time()
        
        url = f"{self.BASE_URL}/models/{model.value}:generateContent"
        
        # Gemini TTS uses a special prompt format
        prompt = f"""Voice: {voice_description}
Language: {language}

Please read the following text aloud:

{text}"""
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": {
                        "prebuiltVoiceConfig": {
                            "voiceName": "Aoede"  # Default voice
                        }
                    }
                }
            }
        }
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                params={"key": self.api_key},
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract audio data
            audio_data = None
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            for part in parts:
                if "inlineData" in part:
                    audio_data = {
                        "base64": part["inlineData"]["data"],
                        "mime_type": part["inlineData"]["mimeType"],
                    }
                    break
            
            # Cost: estimate ~$0.01 per 1000 characters
            cost = 0.00001 * len(text)
            
            return GenerationResult(
                success=True,
                data=audio_data,
                raw_response=data,
                cost=cost,
                latency_ms=(time.time() - start) * 1000,
            )
        except Exception as e:
            return GenerationResult(
                success=False,
                error=str(e),
                latency_ms=(time.time() - start) * 1000,
            )


# =========================================================================
# WHISK SERVICE (Image Remixing)
# =========================================================================

class WhiskService:
    """
    Google Whisk integration for image remixing.
    
    Whisk uses Gemini to generate captions from input images,
    then uses Imagen 3 to generate new images based on those captions.
    """
    
    def __init__(self, google_client: GoogleAIClient):
        self.client = google_client
    
    async def remix_images(
        self,
        subject_image_url: str | None = None,
        scene_image_url: str | None = None,
        style_image_url: str | None = None,
        additional_prompt: str = "",
    ) -> GenerationResult:
        """
        Remix images using Whisk-style approach.
        
        Combines subject, scene, and style from different images.
        """
        # Step 1: Generate captions for each input image
        captions = []
        
        if subject_image_url:
            caption = await self._describe_image(subject_image_url, "subject")
            captions.append(f"Subject: {caption}")
        
        if scene_image_url:
            caption = await self._describe_image(scene_image_url, "scene")
            captions.append(f"Scene: {caption}")
        
        if style_image_url:
            caption = await self._describe_image(style_image_url, "style")
            captions.append(f"Style: {caption}")
        
        # Step 2: Generate new image from combined description
        combined_prompt = " ".join(captions)
        if additional_prompt:
            combined_prompt += f" {additional_prompt}"
        
        return await self.client.generate_image(
            prompt=combined_prompt,
            aspect_ratio="9:16",
        )
    
    async def _describe_image(self, image_url: str, focus: str) -> str:
        """Use Gemini to describe an image."""
        prompt = f"Describe the {focus} of this image in detail for use in image generation."
        
        result = await self.client.generate_text(
            prompt=f"{prompt}\n\nImage URL: {image_url}",
            max_tokens=200,
        )
        
        return result.data if result.success else ""


# =========================================================================
# FLOW SERVICE (Video Workflow)
# =========================================================================

class FlowService:
    """
    Google Flow integration for video workflows.
    
    Flow provides advanced video generation with Veo 3.1,
    including extended duration and higher quality.
    """
    
    def __init__(self, google_client: GoogleAIClient):
        self.client = google_client
    
    async def generate_video_sequence(
        self,
        scenes: list[dict],
        style: str = "cinematic",
    ) -> list[GenerationResult]:
        """
        Generate a sequence of video clips for scenes.
        
        Args:
            scenes: List of scene dicts with 'description' and 'duration'
            style: Overall visual style
        """
        results = []
        
        for scene in scenes:
            prompt = f"{style} video: {scene['description']}"
            duration = min(scene.get('duration', 5), 8)  # Max 8s per clip
            
            result = await self.client.generate_video(
                prompt=prompt,
                duration_seconds=int(duration),
                model=GoogleModel.VEO_3,
            )
            results.append(result)
        
        return results
    
    async def extend_video(
        self,
        video_url: str,
        additional_seconds: int = 5,
        prompt: str = "",
    ) -> GenerationResult:
        """Extend an existing video using Veo."""
        # Veo 3.1 supports video extension
        return await self.client.generate_video(
            prompt=f"Continue this video: {prompt}",
            image_url=video_url,  # Use last frame as reference
            duration_seconds=additional_seconds,
            model=GoogleModel.VEO_3,
        )


# =========================================================================
# FACTORY FUNCTIONS
# =========================================================================

_google_client: GoogleAIClient | None = None


def get_google_client() -> GoogleAIClient:
    """Get or create singleton Google AI client."""
    global _google_client
    if _google_client is None:
        _google_client = GoogleAIClient()
    return _google_client


def get_whisk_service() -> WhiskService:
    """Get Whisk service instance."""
    return WhiskService(get_google_client())


def get_flow_service() -> FlowService:
    """Get Flow service instance."""
    return FlowService(get_google_client())
