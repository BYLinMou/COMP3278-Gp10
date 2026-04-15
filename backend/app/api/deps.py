from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import crud
from app.config import get_settings
from app.database import get_db
from app.security import verify_session_value

settings = get_settings()


def get_current_session_user(request: Request, db: Session = Depends(get_db)):
    session_value = request.cookies.get(settings.session_cookie_name)
    if not session_value:
        raise HTTPException(status_code=401, detail="Not logged in")

    username = verify_session_value(session_value, settings.session_secret)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid session")

    user = crud.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    return user

