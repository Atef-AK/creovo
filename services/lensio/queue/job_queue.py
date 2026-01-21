"""
Job Queue Service

Redis-based job queue for async video generation processing.
"""

import json
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Awaitable
from dataclasses import dataclass, asdict

import redis.asyncio as redis
from redis.asyncio import Redis

from lensio.core import settings
from lensio.models import JobStatus, JobPriority


class QueueName(str, Enum):
    """Available job queues."""
    HIGH_PRIORITY = "lensio:queue:high"
    NORMAL = "lensio:queue:normal"
    LOW_PRIORITY = "lensio:queue:low"
    DEAD_LETTER = "lensio:queue:dead"


@dataclass
class QueuedJob:
    """Job message in the queue."""
    job_id: str
    user_id: str
    step: str
    payload: dict[str, Any]
    priority: int
    created_at: str
    expires_at: str
    attempt: int = 1
    max_attempts: int = 3


class JobQueueService:
    """
    Redis-based job queue for video generation.
    
    Features:
    - Priority queues (high/normal/low)
    - Dead letter queue for failed jobs
    - Job status tracking
    - Retry with exponential backoff
    - Job deduplication
    """
    
    def __init__(self, redis_url: str | None = None):
        self.redis_url = redis_url or settings.redis_url
        self.prefix = settings.redis_prefix
        self._client: Redis | None = None
    
    async def get_client(self) -> Redis:
        """Get or create Redis client."""
        if self._client is None:
            self._client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._client
    
    async def close(self) -> None:
        """Close Redis connection."""
        if self._client:
            await self._client.close()
            self._client = None
    
    # =========================================================================
    # QUEUE OPERATIONS
    # =========================================================================
    
    async def enqueue(
        self,
        job_id: str,
        user_id: str,
        step: str,
        payload: dict[str, Any],
        priority: JobPriority = JobPriority.NORMAL,
        delay_seconds: int = 0,
    ) -> bool:
        """
        Add job to queue.
        
        Args:
            job_id: Unique job identifier
            user_id: User who owns the job  
            step: Pipeline step to execute
            payload: Job data
            priority: Queue priority
            delay_seconds: Optional delay before processing
        """
        client = await self.get_client()
        
        # Create queue message
        job = QueuedJob(
            job_id=job_id,
            user_id=user_id,
            step=step,
            payload=payload,
            priority=priority.value,
            created_at=datetime.utcnow().isoformat(),
            expires_at=(datetime.utcnow() + timedelta(hours=24)).isoformat(),
        )
        
        # Select queue based on priority
        queue = self._get_queue_for_priority(priority)
        
        # Add to queue (LPUSH for FIFO with BRPOP)
        if delay_seconds > 0:
            # Use sorted set for delayed jobs
            score = datetime.utcnow().timestamp() + delay_seconds
            await client.zadd(
                f"{self.prefix}delayed",
                {json.dumps(asdict(job)): score}
            )
        else:
            await client.lpush(queue, json.dumps(asdict(job)))
        
        # Track job status
        await self._set_job_status(job_id, "queued")
        
        return True
    
    async def dequeue(
        self,
        timeout: int = 30,
    ) -> QueuedJob | None:
        """
        Get next job from queue (blocking).
        
        Checks queues in priority order: high -> normal -> low
        """
        client = await self.get_client()
        
        # First, move any ready delayed jobs
        await self._process_delayed_jobs()
        
        # Try each queue in priority order
        queues = [
            QueueName.HIGH_PRIORITY.value,
            QueueName.NORMAL.value,
            QueueName.LOW_PRIORITY.value,
        ]
        
        result = await client.brpop(queues, timeout=timeout)
        
        if result:
            _, job_data = result
            job_dict = json.loads(job_data)
            job = QueuedJob(**job_dict)
            
            # Mark as processing
            await self._set_job_status(job.job_id, "processing")
            
            return job
        
        return None
    
    async def complete(self, job_id: str, result: dict[str, Any] | None = None) -> None:
        """Mark job as completed."""
        await self._set_job_status(job_id, "completed", result)
    
    async def fail(
        self,
        job: QueuedJob,
        error: str,
        retry: bool = True,
    ) -> None:
        """
        Mark job as failed.
        
        If retry=True and attempts remaining, re-queue with backoff.
        Otherwise, move to dead letter queue.
        """
        client = await self.get_client()
        
        if retry and job.attempt < job.max_attempts:
            # Retry with exponential backoff
            delay = 2 ** job.attempt * 5  # 10s, 20s, 40s
            job.attempt += 1
            
            await self.enqueue(
                job_id=job.job_id,
                user_id=job.user_id,
                step=job.step,
                payload=job.payload,
                priority=JobPriority(job.priority),
                delay_seconds=delay,
            )
            
            await self._set_job_status(job.job_id, "retrying", {"error": error, "attempt": job.attempt})
        else:
            # Move to dead letter queue
            await client.lpush(
                QueueName.DEAD_LETTER.value,
                json.dumps(asdict(job) | {"error": error})
            )
            await self._set_job_status(job.job_id, "failed", {"error": error})
    
    # =========================================================================
    # STATUS TRACKING
    # =========================================================================
    
    async def get_status(self, job_id: str) -> dict[str, Any] | None:
        """Get job status."""
        client = await self.get_client()
        data = await client.hgetall(f"{self.prefix}job:{job_id}")
        return data if data else None
    
    async def get_queue_stats(self) -> dict[str, int]:
        """Get queue statistics."""
        client = await self.get_client()
        
        return {
            "high_priority": await client.llen(QueueName.HIGH_PRIORITY.value),
            "normal": await client.llen(QueueName.NORMAL.value),
            "low_priority": await client.llen(QueueName.LOW_PRIORITY.value),
            "delayed": await client.zcard(f"{self.prefix}delayed"),
            "dead_letter": await client.llen(QueueName.DEAD_LETTER.value),
        }
    
    async def get_user_active_jobs(self, user_id: str) -> int:
        """Get count of active jobs for user."""
        client = await self.get_client()
        count = await client.get(f"{self.prefix}user:{user_id}:active")
        return int(count or 0)
    
    async def increment_user_jobs(self, user_id: str) -> int:
        """Increment active job count for user."""
        client = await self.get_client()
        key = f"{self.prefix}user:{user_id}:active"
        count = await client.incr(key)
        await client.expire(key, 86400)  # 24 hour TTL
        return count
    
    async def decrement_user_jobs(self, user_id: str) -> int:
        """Decrement active job count for user."""
        client = await self.get_client()
        key = f"{self.prefix}user:{user_id}:active"
        count = await client.decr(key)
        if count <= 0:
            await client.delete(key)
            return 0
        return count
    
    # =========================================================================
    # HELPERS
    # =========================================================================
    
    def _get_queue_for_priority(self, priority: JobPriority) -> str:
        """Get queue name for priority level."""
        if priority.value >= JobPriority.HIGH.value:
            return QueueName.HIGH_PRIORITY.value
        elif priority.value <= JobPriority.LOW.value:
            return QueueName.LOW_PRIORITY.value
        return QueueName.NORMAL.value
    
    async def _set_job_status(
        self,
        job_id: str,
        status: str,
        data: dict[str, Any] | None = None,
    ) -> None:
        """Update job status in Redis."""
        client = await self.get_client()
        key = f"{self.prefix}job:{job_id}"
        
        value = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
            **(data or {}),
        }
        
        await client.hset(key, mapping=value)
        await client.expire(key, 86400 * 7)  # 7 day TTL
    
    async def _process_delayed_jobs(self) -> int:
        """Move ready delayed jobs to active queues."""
        client = await self.get_client()
        key = f"{self.prefix}delayed"
        
        now = datetime.utcnow().timestamp()
        
        # Get jobs that are ready
        ready = await client.zrangebyscore(key, 0, now)
        
        for job_data in ready:
            job_dict = json.loads(job_data)
            priority = JobPriority(job_dict.get("priority", JobPriority.NORMAL.value))
            queue = self._get_queue_for_priority(priority)
            
            # Move to active queue
            await client.lpush(queue, job_data)
            await client.zrem(key, job_data)
        
        return len(ready)


# Singleton
job_queue = JobQueueService()
