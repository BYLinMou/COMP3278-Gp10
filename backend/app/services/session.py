from fastapi import Response

from app.config import get_settings
from app.security import sign_session_value

settings = get_settings()


def set_session_cookie(response: Response, username: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=sign_session_value(username, settings.session_secret),
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.session_max_age_seconds,
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=settings.session_cookie_name, httponly=True, samesite="lax")

