"""
Database Seeder

Seeds Firestore with initial data for development and production.
"""

import asyncio
from datetime import datetime
from typing import Any

from firebase_admin import firestore


# Sample niches for different content categories
SAMPLE_NICHES = [
    {
        "id": "niche_motivational",
        "slug": "motivational-quotes",
        "name": "Motivational Quotes",
        "version": 1,
        "description": "Inspiring quotes and life advice that resonate with viewers seeking motivation and personal growth.",
        "category": "lifestyle",
        "content_style": "inspirational",
        "target_audience": ["young_adults", "professionals", "students"],
        "platforms": {
            "tiktok": {
                "enabled": True,
                "duration": {"min": 15, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "mixed",
                "max_hashtags": 5,
            },
            "youtube_shorts": {
                "enabled": True,
                "duration": {"min": 15, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "specific",
                "max_hashtags": 3,
            },
            "instagram_reels": {
                "enabled": True,
                "duration": {"min": 15, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "trending",
                "max_hashtags": 30,
            },
        },
        "topics": [
            "morning mindset",
            "success habits",
            "overcoming failure",
            "self-discipline",
            "goal setting",
            "productivity tips",
            "mental strength",
            "positive thinking",
            "confidence building",
            "life lessons",
        ],
        "hooks": [
            "The secret nobody tells you about...",
            "Stop doing this if you want success...",
            "The 1% do this differently...",
            "Here's what changed my life...",
            "You're wasting time if you...",
        ],
        "visual_styles": [
            "cinematic nature",
            "urban city lights",
            "minimalist aesthetic",
            "sunrise/sunset",
            "abstract motion",
        ],
        "estimated_credit_cost": 3,
        "average_duration": 30,
        "is_active": True,
        "is_premium": False,
        "tags": ["motivation", "quotes", "inspiration", "mindset"],
    },
    {
        "id": "niche_tech_tips",
        "slug": "tech-tips",
        "name": "Tech Tips & Hacks",
        "version": 1,
        "description": "Quick technology tips, hidden features, and productivity hacks for smartphones and computers.",
        "category": "technology",
        "content_style": "educational",
        "target_audience": ["tech_enthusiasts", "professionals", "students"],
        "platforms": {
            "tiktok": {
                "enabled": True,
                "duration": {"min": 30, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "mixed",
                "max_hashtags": 5,
            },
            "youtube_shorts": {
                "enabled": True,
                "duration": {"min": 30, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "specific",
                "max_hashtags": 3,
            },
            "instagram_reels": {
                "enabled": True,
                "duration": {"min": 30, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "trending",
                "max_hashtags": 20,
            },
        },
        "topics": [
            "iPhone hidden features",
            "Android shortcuts",
            "Chrome extensions",
            "Windows tips",
            "Mac productivity",
            "AI tools",
            "app recommendations",
            "keyboard shortcuts",
            "screen recording tricks",
            "privacy settings",
        ],
        "hooks": [
            "Your phone can do this...",
            "Hidden feature you didn't know...",
            "This will save you hours...",
            "Stop using [app] wrong...",
            "The shortcut nobody uses...",
        ],
        "visual_styles": [
            "screen recording",
            "tech aesthetic",
            "clean minimal",
            "neon glow",
            "device closeup",
        ],
        "estimated_credit_cost": 4,
        "average_duration": 45,
        "is_active": True,
        "is_premium": False,
        "tags": ["tech", "tips", "productivity", "hacks"],
    },
    {
        "id": "niche_storytelling",
        "slug": "storytelling",
        "name": "Story Time",
        "version": 1,
        "description": "Engaging short stories, anecdotes, and narrative content that captivates audiences.",
        "category": "entertainment",
        "content_style": "narrative",
        "target_audience": ["general", "story_lovers", "casual_viewers"],
        "platforms": {
            "tiktok": {
                "enabled": True,
                "duration": {"min": 45, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "mixed",
                "max_hashtags": 4,
            },
            "youtube_shorts": {
                "enabled": True,
                "duration": {"min": 45, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "specific",
                "max_hashtags": 3,
            },
            "instagram_reels": {
                "enabled": True,
                "duration": {"min": 45, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "trending",
                "max_hashtags": 15,
            },
        },
        "topics": [
            "true scary stories",
            "plot twists",
            "life stories",
            "funny moments",
            "mysterious events",
            "revenge stories",
            "karma stories",
            "wholesome moments",
            "crazy coincidences",
            "travel stories",
        ],
        "hooks": [
            "So this happened to me...",
            "Nobody believed me but...",
            "Wait for the plot twist...",
            "This story still gives me chills...",
            "The craziest thing happened...",
        ],
        "visual_styles": [
            "atmospheric",
            "moody lighting",
            "cinematic",
            "dark aesthetic",
            "dreamlike",
        ],
        "estimated_credit_cost": 4,
        "average_duration": 55,
        "is_active": True,
        "is_premium": False,
        "tags": ["stories", "entertainment", "narrative", "storytime"],
    },
    {
        "id": "niche_fitness",
        "slug": "fitness-motivation",
        "name": "Fitness Motivation",
        "version": 1,
        "description": "Workout motivation, fitness tips, and gym content that inspires viewers to stay active.",
        "category": "health",
        "content_style": "motivational",
        "target_audience": ["fitness_enthusiasts", "gym_goers", "athletes"],
        "platforms": {
            "tiktok": {
                "enabled": True,
                "duration": {"min": 15, "max": 45},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "mixed",
                "max_hashtags": 5,
            },
            "youtube_shorts": {
                "enabled": True,
                "duration": {"min": 15, "max": 45},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "specific",
                "max_hashtags": 3,
            },
            "instagram_reels": {
                "enabled": True,
                "duration": {"min": 15, "max": 45},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "trending",
                "max_hashtags": 30,
            },
        },
        "topics": [
            "gym motivation",
            "workout tips",
            "form corrections",
            "progressive overload",
            "rest day importance",
            "nutrition basics",
            "transformation mindset",
            "discipline over motivation",
            "beginner tips",
            "recovery tips",
        ],
        "hooks": [
            "This exercise is the game changer...",
            "Why you're not seeing results...",
            "The workout that changed everything...",
            "Stop skipping this muscle...",
            "What 6 months of consistency looks like...",
        ],
        "visual_styles": [
            "gym aesthetic",
            "dynamic motion",
            "high energy",
            "dark gym",
            "outdoor fitness",
        ],
        "estimated_credit_cost": 3,
        "average_duration": 30,
        "is_active": True,
        "is_premium": False,
        "tags": ["fitness", "gym", "workout", "motivation"],
    },
    {
        "id": "niche_finance",
        "slug": "money-tips",
        "name": "Money & Finance Tips",
        "version": 1,
        "description": "Personal finance advice, money-saving tips, and wealth-building strategies.",
        "category": "finance",
        "content_style": "educational",
        "target_audience": ["young_adults", "professionals", "investors"],
        "platforms": {
            "tiktok": {
                "enabled": True,
                "duration": {"min": 30, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "mixed",
                "max_hashtags": 4,
            },
            "youtube_shorts": {
                "enabled": True,
                "duration": {"min": 30, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "specific",
                "max_hashtags": 3,
            },
            "instagram_reels": {
                "enabled": True,
                "duration": {"min": 30, "max": 60},
                "aspect_ratio": "9:16",
                "hashtag_strategy": "trending",
                "max_hashtags": 20,
            },
        },
        "topics": [
            "budgeting basics",
            "saving strategies",
            "investing 101",
            "side hustles",
            "debt payoff",
            "passive income",
            "money mistakes",
            "financial freedom",
            "credit score tips",
            "retirement planning",
        ],
        "hooks": [
            "The money rule that changed my life...",
            "Why rich people do this...",
            "Stop making this money mistake...",
            "How I saved $10K in 6 months...",
            "The investment nobody talks about...",
        ],
        "visual_styles": [
            "luxury aesthetic",
            "clean professional",
            "charts and graphs",
            "wealth visual",
            "minimalist money",
        ],
        "estimated_credit_cost": 4,
        "average_duration": 40,
        "is_active": True,
        "is_premium": True,
        "tags": ["finance", "money", "investing", "wealth"],
    },
]


async def seed_niches(db=None) -> int:
    """
    Seed niches collection.
    
    Returns number of niches seeded.
    """
    if db is None:
        db = firestore.client()
    
    batch = db.batch()
    count = 0
    
    for niche in SAMPLE_NICHES:
        doc_ref = db.collection("niches").document(niche["id"])
        niche_data = {
            **niche,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
        }
        batch.set(doc_ref, niche_data)
        count += 1
    
    batch.commit()
    return count


async def seed_subscription_tiers(db=None) -> int:
    """Seed subscription tiers for reference."""
    if db is None:
        db = firestore.client()
    
    tiers = [
        {
            "id": "free",
            "name": "Free",
            "price_monthly": 0,
            "price_yearly": 0,
            "credits_per_month": 5,
            "max_concurrent_jobs": 1,
            "max_resolution": "720p",
            "features": ["Basic niches", "Standard queue"],
        },
        {
            "id": "starter",
            "name": "Starter",
            "price_monthly": 19,
            "price_yearly": 190,
            "credits_per_month": 30,
            "max_concurrent_jobs": 2,
            "max_resolution": "1080p",
            "features": ["All niches", "Priority queue", "Google Drive export"],
        },
        {
            "id": "pro",
            "name": "Pro",
            "price_monthly": 49,
            "price_yearly": 490,
            "credits_per_month": 100,
            "max_concurrent_jobs": 5,
            "max_resolution": "1080p",
            "features": ["All niches", "Priority queue", "Google Drive export", "Custom topics", "API access"],
        },
        {
            "id": "agency",
            "name": "Agency",
            "price_monthly": 149,
            "price_yearly": 1490,
            "credits_per_month": 500,
            "max_concurrent_jobs": 10,
            "max_resolution": "4K",
            "features": ["All niches", "Highest priority", "Google Drive export", "Custom topics", "API access", "Team accounts", "White-label"],
        },
    ]
    
    batch = db.batch()
    count = 0
    
    for tier in tiers:
        doc_ref = db.collection("subscription_tiers").document(tier["id"])
        batch.set(doc_ref, {
            **tier,
            "created_at": firestore.SERVER_TIMESTAMP,
        })
        count += 1
    
    batch.commit()
    return count


async def run_seeder() -> dict[str, int]:
    """Run all seeders."""
    results = {
        "niches": await seed_niches(),
        "subscription_tiers": await seed_subscription_tiers(),
    }
    return results


if __name__ == "__main__":
    import firebase_admin
    from firebase_admin import credentials
    
    # Initialize Firebase
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    
    # Run seeder
    results = asyncio.run(run_seeder())
    print(f"Seeding complete: {results}")
