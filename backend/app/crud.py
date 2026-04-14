from sqlalchemy import Select, desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas


def create_user(db: Session, payload: schemas.UserCreate) -> models.User:
    user = models.User(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_post(db: Session, payload: schemas.PostCreate) -> models.Post:
    post = models.Post(**payload.model_dump(mode="json"))
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def list_feed(db: Session, sort_by: str = "recent") -> list[schemas.PostRead]:
    like_count = func.count(func.distinct(models.Like.id)).label("like_count")
    comment_count = func.count(func.distinct(models.Comment.id)).label("comment_count")

    query: Select = (
        select(
            models.Post.id,
            models.Post.description,
            models.Post.image_url,
            models.Post.created_at,
            like_count,
            comment_count,
            models.User.username,
            models.User.display_name,
        )
        .join(models.User, models.User.id == models.Post.user_id)
        .outerjoin(models.Like, models.Like.post_id == models.Post.id)
        .outerjoin(models.Comment, models.Comment.post_id == models.Post.id)
        .group_by(models.Post.id, models.User.id)
    )

    if sort_by == "popular":
        query = query.order_by(desc(like_count), desc(models.Post.created_at))
    else:
        query = query.order_by(desc(models.Post.created_at))

    rows = db.execute(query).all()
    return [schemas.PostRead.model_validate(row._mapping) for row in rows]


def toggle_like(db: Session, post_id: int, user_id: int) -> schemas.LikeToggleResponse:
    existing = db.scalar(
        select(models.Like).where(models.Like.post_id == post_id, models.Like.user_id == user_id)
    )
    liked = False
    if existing:
        db.delete(existing)
        db.commit()
    else:
        db.add(models.Like(post_id=post_id, user_id=user_id))
        try:
            db.commit()
            liked = True
        except IntegrityError:
            db.rollback()

    count = db.scalar(select(func.count(models.Like.id)).where(models.Like.post_id == post_id)) or 0
    return schemas.LikeToggleResponse(post_id=post_id, liked=liked, like_count=count)


def create_comment(db: Session, post_id: int, payload: schemas.CommentCreate) -> models.Comment:
    comment = models.Comment(post_id=post_id, **payload.model_dump())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def list_user_posts(db: Session, username: str) -> list[schemas.PostRead]:
    user = db.scalar(select(models.User).where(models.User.username == username))
    if not user:
        return []
    return [
        post
        for post in list_feed(db, sort_by="recent")
        if post.username == username
    ]
