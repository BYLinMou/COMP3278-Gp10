from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api.deps import get_current_session_user
from app.database import get_db
from app.services.session import clear_session_cookie, set_session_cookie

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.UserRead)
def login(payload: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, payload)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    set_session_cookie(response, user.username)
    return user


@router.get("/session", response_model=schemas.UserRead)
def get_session(user=Depends(get_current_session_user)):
    return user


@router.post("/logout", status_code=204)
def logout(response: Response):
    clear_session_cookie(response)

