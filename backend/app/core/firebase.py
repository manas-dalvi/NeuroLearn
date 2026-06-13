## backend/app/core/firebase.py
import logging
from functools import lru_cache
from typing import Optional

import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()


@lru_cache(maxsize=1)
def _get_firebase_app() -> firebase_admin.App:
    """Initialize Firebase app singleton."""
    try:
        if settings.GOOGLE_APPLICATION_CREDENTIALS:
            cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        else:
            cred = credentials.ApplicationDefault()
        if not firebase_admin._apps:
            logger.info(f"FIREBASE_PROJECT_ID = {settings.FIREBASE_PROJECT_ID}")

            app = firebase_admin.initialize_app(
            cred,
        {"projectId": settings.FIREBASE_PROJECT_ID}
    )
        else:
            app = firebase_admin.get_app()

        logger.info("✅ Firebase Admin SDK initialized")
        return app
    except Exception as e:
        logger.error(f"❌ Firebase init failed: {e}")
        raise


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Verify Firebase JWT and return the user's UID."""
    token = credentials.credentials
    print("TOKEN RECEIVED:", token[:30])
    try:
        _get_firebase_app()
        decoded = auth.verify_id_token(token)
        print("DECODED UID:", decoded["uid"])
        return decoded["uid"]
    except firebase_admin.auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please sign in again.",
        )
    except firebase_admin.auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )
    except Exception as e:
        print("FULL AUTH ERROR:", str(e))
        logger.error(f"Auth verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
        )


# Convenience type alias for dependency injection
CurrentUser = Depends(get_current_user_id)
