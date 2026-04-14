from sqlalchemy import select

from app.database import SessionLocal
from app.models import Comment, Like, Post, User


def seed() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(select(User.id).limit(1))
        if existing:
            return

        users = [
            User(username="tianxing", display_name="Tianxing", bio="Night photography enthusiast"),
            User(username="amelia", display_name="Amelia", bio="Visual storyteller"),
            User(username="sam", display_name="Sam", bio="Capturing campus moments"),
        ]
        db.add_all(users)
        db.flush()

        posts = [
            Post(
                user_id=users[0].id,
                description="Golden lights over the harbor after class.",
                image_url="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
            ),
            Post(
                user_id=users[1].id,
                description="A quiet table, good coffee, and project planning.",
                image_url="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
            ),
            Post(
                user_id=users[2].id,
                description="Studio textures and geometric shadows.",
                image_url="https://images.unsplash.com/photo-1517048676732-d65bc937f952",
            ),
        ]
        db.add_all(posts)
        db.flush()

        db.add_all(
            [
                Like(user_id=users[1].id, post_id=posts[0].id),
                Like(user_id=users[2].id, post_id=posts[0].id),
                Like(user_id=users[0].id, post_id=posts[1].id),
                Comment(user_id=users[2].id, post_id=posts[0].id, body="The reflections are excellent."),
            ]
        )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
