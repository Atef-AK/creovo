"""
Google Drive Export Service

Handles OAuth flow and exports generated videos to user's Google Drive.
"""

import asyncio
import base64
from dataclasses import dataclass
from datetime import datetime
from typing import Any
import json

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
import io

from lensio.core import settings


# OAuth2 scopes for Google Drive
DRIVE_SCOPES = [
    "https://www.googleapis.com/auth/drive.file",  # Create/edit files created by app
    "https://www.googleapis.com/auth/drive.metadata.readonly",  # Read metadata
]


@dataclass
class ExportResult:
    """Result from Google Drive export."""
    success: bool
    file_id: str | None = None
    file_url: str | None = None
    folder_id: str | None = None
    error: str | None = None


@dataclass
class DriveConnection:
    """User's Google Drive connection."""
    user_id: str
    access_token: str
    refresh_token: str
    token_expiry: datetime
    connected_at: datetime
    email: str | None = None


class GoogleDriveService:
    """
    Google Drive integration service.
    
    Handles:
    - OAuth2 authorization flow
    - Folder structure creation
    - Video upload with metadata
    - Caption/hashtag files
    """
    
    def __init__(self):
        self.client_config = {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret.get_secret_value(),
                "redirect_uris": [settings.google_redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }
    
    # =========================================================================
    # OAUTH FLOW
    # =========================================================================
    
    def get_authorization_url(self, state: str) -> str:
        """
        Generate OAuth authorization URL.
        
        Args:
            state: State parameter for CSRF protection (encode user_id)
        
        Returns:
            Authorization URL to redirect user
        """
        flow = Flow.from_client_config(
            self.client_config,
            scopes=DRIVE_SCOPES,
            redirect_uri=settings.google_redirect_uri,
        )
        
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            state=state,
            prompt="consent",
        )
        
        return auth_url
    
    async def handle_callback(
        self,
        code: str,
        state: str,
    ) -> DriveConnection:
        """
        Handle OAuth callback and exchange code for tokens.
        
        Args:
            code: Authorization code from Google
            state: State parameter (contains user_id)
        
        Returns:
            DriveConnection with tokens
        """
        flow = Flow.from_client_config(
            self.client_config,
            scopes=DRIVE_SCOPES,
            redirect_uri=settings.google_redirect_uri,
        )
        
        # Exchange code for tokens
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Get user email
        email = None
        try:
            service = build("oauth2", "v2", credentials=credentials)
            user_info = service.userinfo().get().execute()
            email = user_info.get("email")
        except Exception:
            pass
        
        return DriveConnection(
            user_id=state,  # Decode user_id from state
            access_token=credentials.token,
            refresh_token=credentials.refresh_token or "",
            token_expiry=credentials.expiry or datetime.utcnow(),
            connected_at=datetime.utcnow(),
            email=email,
        )
    
    def get_credentials(self, connection: DriveConnection) -> Credentials:
        """Create Credentials object from stored connection."""
        credentials = Credentials(
            token=connection.access_token,
            refresh_token=connection.refresh_token,
            token_uri=self.client_config["web"]["token_uri"],
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret.get_secret_value(),
        )
        
        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        
        return credentials
    
    # =========================================================================
    # FOLDER MANAGEMENT
    # =========================================================================
    
    async def ensure_folder_structure(
        self,
        connection: DriveConnection,
    ) -> dict[str, str]:
        """
        Create Lensio folder structure in user's Drive.
        
        Structure:
        - Lensio/
          - Videos/
          - Drafts/
          - Exports/
        
        Returns:
            Dict mapping folder names to IDs
        """
        credentials = self.get_credentials(connection)
        service = build("drive", "v3", credentials=credentials)
        
        folder_ids = {}
        
        # Create or find root Lensio folder
        root_id = await self._find_or_create_folder(
            service, "Lensio", parent_id=None
        )
        folder_ids["root"] = root_id
        
        # Create subfolders
        for subfolder in ["Videos", "Drafts", "Exports"]:
            folder_id = await self._find_or_create_folder(
                service, subfolder, parent_id=root_id
            )
            folder_ids[subfolder.lower()] = folder_id
        
        return folder_ids
    
    async def _find_or_create_folder(
        self,
        service,
        name: str,
        parent_id: str | None,
    ) -> str:
        """Find existing folder or create new one."""
        # Search for existing folder
        query = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        if parent_id:
            query += f" and '{parent_id}' in parents"
        
        results = service.files().list(
            q=query,
            spaces="drive",
            fields="files(id, name)",
        ).execute()
        
        files = results.get("files", [])
        if files:
            return files[0]["id"]
        
        # Create new folder
        metadata = {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
        }
        if parent_id:
            metadata["parents"] = [parent_id]
        
        folder = service.files().create(
            body=metadata,
            fields="id",
        ).execute()
        
        return folder["id"]
    
    # =========================================================================
    # FILE UPLOAD
    # =========================================================================
    
    async def export_video(
        self,
        connection: DriveConnection,
        video_path: str,
        job_id: str,
        metadata: dict[str, Any],
    ) -> ExportResult:
        """
        Export video to user's Google Drive.
        
        Args:
            connection: User's Drive connection
            video_path: Local path to video file
            job_id: Job ID for naming
            metadata: Video metadata (captions, hashtags, etc.)
        
        Returns:
            ExportResult with file URL
        """
        try:
            credentials = self.get_credentials(connection)
            service = build("drive", "v3", credentials=credentials)
            
            # Ensure folder structure
            folders = await self.ensure_folder_structure(connection)
            
            # Generate filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            platform = metadata.get("platform", "video")
            title = metadata.get("title", "untitled")[:30]
            filename = f"{platform}_{title}_{timestamp}.mp4"
            
            # Upload video
            file_metadata = {
                "name": filename,
                "parents": [folders["videos"]],
                "description": f"Generated by Lensio - Job: {job_id}",
            }
            
            media = MediaFileUpload(
                video_path,
                mimetype="video/mp4",
                resumable=True,
            )
            
            video_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields="id, webViewLink",
            ).execute()
            
            # Upload metadata file
            await self._upload_metadata(
                service,
                folders["videos"],
                filename.replace(".mp4", "_metadata.json"),
                metadata,
            )
            
            # Upload captions file
            if metadata.get("captions"):
                await self._upload_text_file(
                    service,
                    folders["videos"],
                    filename.replace(".mp4", "_captions.txt"),
                    metadata["captions"],
                )
            
            return ExportResult(
                success=True,
                file_id=video_file["id"],
                file_url=video_file.get("webViewLink"),
                folder_id=folders["videos"],
            )
            
        except Exception as e:
            return ExportResult(
                success=False,
                error=str(e),
            )
    
    async def export_video_bytes(
        self,
        connection: DriveConnection,
        video_bytes: bytes,
        filename: str,
        metadata: dict[str, Any],
    ) -> ExportResult:
        """Export video from bytes (for in-memory videos)."""
        try:
            credentials = self.get_credentials(connection)
            service = build("drive", "v3", credentials=credentials)
            
            folders = await self.ensure_folder_structure(connection)
            
            file_metadata = {
                "name": filename,
                "parents": [folders["videos"]],
            }
            
            media = MediaIoBaseUpload(
                io.BytesIO(video_bytes),
                mimetype="video/mp4",
                resumable=True,
            )
            
            video_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields="id, webViewLink",
            ).execute()
            
            return ExportResult(
                success=True,
                file_id=video_file["id"],
                file_url=video_file.get("webViewLink"),
                folder_id=folders["videos"],
            )
            
        except Exception as e:
            return ExportResult(success=False, error=str(e))
    
    async def _upload_metadata(
        self,
        service,
        parent_id: str,
        filename: str,
        metadata: dict[str, Any],
    ) -> str | None:
        """Upload metadata JSON file."""
        try:
            content = json.dumps(metadata, indent=2)
            media = MediaIoBaseUpload(
                io.BytesIO(content.encode("utf-8")),
                mimetype="application/json",
            )
            
            file = service.files().create(
                body={
                    "name": filename,
                    "parents": [parent_id],
                },
                media_body=media,
                fields="id",
            ).execute()
            
            return file["id"]
        except Exception:
            return None
    
    async def _upload_text_file(
        self,
        service,
        parent_id: str,
        filename: str,
        content: str,
    ) -> str | None:
        """Upload text file."""
        try:
            media = MediaIoBaseUpload(
                io.BytesIO(content.encode("utf-8")),
                mimetype="text/plain",
            )
            
            file = service.files().create(
                body={
                    "name": filename,
                    "parents": [parent_id],
                },
                media_body=media,
                fields="id",
            ).execute()
            
            return file["id"]
        except Exception:
            return None


# Singleton
google_drive = GoogleDriveService()
