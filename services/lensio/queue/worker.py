"""
Job Worker

Background worker that processes video generation jobs from the queue.
"""

import asyncio
import signal
from datetime import datetime
from typing import Any

import structlog

from lensio.core import settings
from lensio.queue.job_queue import JobQueueService, QueuedJob, job_queue
from lensio.pipeline import GoogleVideoPipeline, PipelineContext, PipelineStep, NicheConfig
from lensio.models import Platform, JobStatus


logger = structlog.get_logger()


class JobWorker:
    """
    Background worker for processing video generation jobs.
    
    Consumes jobs from Redis queue and executes pipeline steps.
    """
    
    def __init__(
        self,
        queue: JobQueueService | None = None,
        concurrency: int = 2,
    ):
        self.queue = queue or job_queue
        self.concurrency = concurrency
        self.pipeline = GoogleVideoPipeline()
        self._running = False
        self._tasks: set[asyncio.Task] = set()
    
    async def start(self) -> None:
        """Start the worker."""
        self._running = True
        logger.info("Worker starting", concurrency=self.concurrency)
        
        # Handle graceful shutdown
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            try:
                loop.add_signal_handler(sig, lambda: asyncio.create_task(self.stop()))
            except NotImplementedError:
                pass  # Windows doesn't support add_signal_handler
        
        # Start worker tasks
        for i in range(self.concurrency):
            task = asyncio.create_task(self._worker_loop(i))
            self._tasks.add(task)
            task.add_done_callback(self._tasks.discard)
        
        # Wait for all tasks
        await asyncio.gather(*self._tasks, return_exceptions=True)
    
    async def stop(self) -> None:
        """Stop the worker gracefully."""
        logger.info("Worker stopping")
        self._running = False
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
        
        await self.queue.close()
    
    async def _worker_loop(self, worker_id: int) -> None:
        """Main worker loop."""
        logger.info("Worker loop started", worker_id=worker_id)
        
        while self._running:
            try:
                # Get next job from queue
                job = await self.queue.dequeue(timeout=5)
                
                if job:
                    await self._process_job(job, worker_id)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Worker error", worker_id=worker_id, error=str(e))
                await asyncio.sleep(5)
        
        logger.info("Worker loop stopped", worker_id=worker_id)
    
    async def _process_job(self, job: QueuedJob, worker_id: int) -> None:
        """Process a single job."""
        logger.info(
            "Processing job",
            job_id=job.job_id,
            step=job.step,
            worker_id=worker_id,
            attempt=job.attempt,
        )
        
        try:
            # Create pipeline context from job payload
            context = self._create_context(job)
            
            # Execute pipeline
            result = await self.pipeline.execute(
                context,
                on_progress=lambda step, progress: self._on_progress(job.job_id, step, progress),
            )
            
            # Check for errors
            if result.errors:
                non_recoverable = [e for e in result.errors if not e.get("recoverable", True)]
                if non_recoverable:
                    raise Exception(non_recoverable[0]["error"])
            
            # Mark complete
            await self.queue.complete(job.job_id, {
                "video_url": result.final_video_url,
                "cost": result.cost.total,
            })
            
            # Update Firestore
            await self._update_firestore(job.job_id, result)
            
            # Decrement user active jobs
            await self.queue.decrement_user_jobs(job.user_id)
            
            logger.info(
                "Job completed",
                job_id=job.job_id,
                duration_s=sum(result.step_timings.values()) / 1000,
                cost=result.cost.total,
            )
            
        except Exception as e:
            logger.error("Job failed", job_id=job.job_id, error=str(e))
            await self.queue.fail(job, str(e), retry=True)
    
    def _create_context(self, job: QueuedJob) -> PipelineContext:
        """Create pipeline context from job payload."""
        payload = job.payload
        
        niche = NicheConfig(
            id=payload.get("niche_id", ""),
            name=payload.get("niche_name", "Default"),
            content_style=payload.get("content_style", "educational"),
            target_audience=payload.get("target_audience", []),
            topics=payload.get("topics", []),
            hooks=payload.get("hooks", []),
            visual_styles=payload.get("visual_styles", []),
        )
        
        return PipelineContext(
            job_id=job.job_id,
            user_id=job.user_id,
            niche=niche,
            platform=Platform(payload.get("platform", "tiktok")),
            options=payload.get("options", {}),
        )
    
    async def _on_progress(
        self,
        job_id: str,
        step: PipelineStep,
        progress: int,
    ) -> None:
        """Handle pipeline progress updates."""
        await self.queue._set_job_status(job_id, "processing", {
            "step": step.value,
            "progress": progress,
        })
    
    async def _update_firestore(
        self,
        job_id: str,
        context: PipelineContext,
    ) -> None:
        """Update job document in Firestore."""
        try:
            from firebase_admin import firestore
            db = firestore.client()
            
            doc_ref = db.collection("jobs").document(job_id)
            doc_ref.update({
                "status": JobStatus.COMPLETED.value,
                "progress": 100,
                "final_video_url": context.final_video_url,
                "cost": context.cost.total,
                "completed_at": firestore.SERVER_TIMESTAMP,
                "step_timings": context.step_timings,
            })
        except Exception as e:
            logger.warning("Failed to update Firestore", job_id=job_id, error=str(e))


async def run_worker(concurrency: int = 2) -> None:
    """Run the job worker."""
    worker = JobWorker(concurrency=concurrency)
    await worker.start()


if __name__ == "__main__":
    asyncio.run(run_worker())
