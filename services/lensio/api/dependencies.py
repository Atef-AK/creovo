"""
API Dependencies

FastAPI dependency injection for authentication, rate limiting, etc.
"""

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from lensio.core import settings


# Security scheme
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    """
    Validate Firebase ID token and return user info.
    
    In production, this verifies the token with Firebase Admin SDK.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Missing authentication token"},
        )
    
    token = credentials.credentials
    
    try:
        # Verify token with Firebase Admin SDK
        if settings.firebase_project_id:
            from firebase_admin import auth
            
            decoded = auth.verify_id_token(token)
            return {
                "uid": decoded["uid"],
                "email": decoded.get("email"),
                "email_verified": decoded.get("email_verified", False),
            }
        
        # Development fallback - accept any token
        if settings.is_development:
            return {
                "uid": "dev_user_123",
                "email": "dev@example.com",
                "email_verified": True,
            }
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "CONFIG_ERROR", "message": "Firebase not configured"},
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": str(e)},
        )


async def require_credits(
    user: dict[str, Any] = Depends(get_current_user),
) -> bool:
    """
    Verify user has sufficient credits for the operation.
    
    Returns True if user has credits, raises HTTPException otherwise.
    """
    # TODO: Fetch actual credit balance from Firestore
    user_credits = 10  # Placeholder
    
    if user_credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "code": "INSUFFICIENT_CREDITS",
                "message": "You don't have enough credits. Please upgrade your plan or purchase more credits.",
            },
        )
    
    return True


async def require_role(required_role: str):
    """
    Factory for role-based access control dependency.
    """
    async def check_role(
        user: dict[str, Any] = Depends(get_current_user),
    ) -> bool:
        # TODO: Fetch user role from Firestore and compare
        user_role = "pro"  # Placeholder
        
        role_hierarchy = ["free", "starter", "pro", "agency", "admin"]
        
        try:
            user_index = role_hierarchy.index(user_role)
            required_index = role_hierarchy.index(required_role)
            
            if user_index < required_index:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "code": "FORBIDDEN",
                        "message": f"This feature requires {required_role} plan or higher",
                    },
                )
            
            return True
            
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "INVALID_ROLE", "message": "Invalid user role"},
            )
    
    return check_role


async def rate_limit(
    user: dict[str, Any] = Depends(get_current_user),
) -> bool:
    """
    Check rate limits for the current user.
    """
    if not settings.rate_limit_enabled:
        return True
    
    # TODO: Implement Redis-based rate limiting
    # For now, always allow
    
    return True
