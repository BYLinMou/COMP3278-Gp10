from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.config import get_settings
from app.database import Base, engine, get_db

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/users", response_model=schemas.UserRead, status_code=201)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_user(db, payload)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already exists") from exc


@app.get("/feed", response_model=list[schemas.PostRead])
def get_feed(
    sort_by: str = Query(default="recent", pattern="^(recent|popular)$"),
    db: Session = Depends(get_db),
):
    return crud.list_feed(db, sort_by=sort_by)


@app.post("/posts", status_code=201)
def create_post(payload: schemas.PostCreate, db: Session = Depends(get_db)):
    user = db.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    post = crud.create_post(db, payload)
    return {"id": post.id}


@app.post("/posts/{post_id}/like", response_model=schemas.LikeToggleResponse)
def toggle_like(post_id: int, user_id: int, db: Session = Depends(get_db)):
    post = db.get(models.Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.toggle_like(db, post_id=post_id, user_id=user_id)


@app.post("/posts/{post_id}/comments", response_model=schemas.CommentRead, status_code=201)
def create_comment(post_id: int, payload: schemas.CommentCreate, db: Session = Depends(get_db)):
    post = db.get(models.Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    user = db.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_comment(db, post_id=post_id, payload=payload)


@app.get("/users/{username}/posts", response_model=list[schemas.PostRead])
def get_user_posts(username: str, db: Session = Depends(get_db)):
    return crud.list_user_posts(db, username)
