from __future__ import annotations

import os
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Barrier
from typing import Callable, TypeVar

from sqlalchemy import func, select

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

TMP_DB = ROOT / "tmp_concurrency_check.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TMP_DB.as_posix()}"

from app import models  # noqa: E402
from app.crud.posts import set_like  # noqa: E402
from app.crud.users import set_follow  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.services.bootstrap import initialize_database  # noqa: E402
from scripts.seed import seed  # noqa: E402

T = TypeVar("T")


def reset_database() -> None:
    engine.dispose()
    Base.metadata.drop_all(bind=engine)
    initialize_database()
    seed()


def user_id_for(username: str) -> int:
    with SessionLocal() as db:
        user = db.scalar(select(models.User).where(models.User.username == username))
        if not user:
            raise AssertionError(f"Missing seeded user: {username}")
        return user.id


def post_id_for(description: str) -> int:
    with SessionLocal() as db:
        post = db.scalar(select(models.Post).where(models.Post.description == description))
        if not post:
            raise AssertionError(f"Missing seeded post: {description}")
        return post.id


def like_count(post_id: int) -> int:
    with SessionLocal() as db:
        return db.scalar(select(func.count(models.Like.id)).where(models.Like.post_id == post_id)) or 0


def follow_count(followee_id: int) -> int:
    with SessionLocal() as db:
        return db.scalar(select(func.count(models.Follow.id)).where(models.Follow.followee_id == followee_id)) or 0


def duplicate_like_rows(post_id: int, user_id: int) -> int:
    with SessionLocal() as db:
        return db.scalar(
            select(func.count(models.Like.id)).where(
                models.Like.post_id == post_id,
                models.Like.user_id == user_id,
            )
        ) or 0


def duplicate_follow_rows(follower_id: int, followee_id: int) -> int:
    with SessionLocal() as db:
        return db.scalar(
            select(func.count(models.Follow.id)).where(
                models.Follow.follower_id == follower_id,
                models.Follow.followee_id == followee_id,
            )
        ) or 0


def run_concurrently(task_a: Callable[[], T], task_b: Callable[[], T]) -> tuple[T, T]:
    barrier = Barrier(2)

    def wrap(task: Callable[[], T]) -> T:
        barrier.wait()
        return task()

    with ThreadPoolExecutor(max_workers=2) as executor:
        future_a = executor.submit(wrap, task_a)
        future_b = executor.submit(wrap, task_b)
        return future_a.result(), future_b.result()


def test_same_user_duplicate_like() -> str:
    reset_database()
    username = "luna"
    post_description = "Golden lights over the harbor after class."
    user_id = user_id_for(username)
    post_id = post_id_for(post_description)

    before = like_count(post_id)

    results = run_concurrently(
        lambda: _set_like(post_id, user_id, True),
        lambda: _set_like(post_id, user_id, True),
    )

    after = like_count(post_id)
    duplicates = duplicate_like_rows(post_id, user_id)

    if after != before + 1:
        raise AssertionError(f"Expected like count {before + 1}, got {after}; results={results}")
    if duplicates != 1:
        raise AssertionError(f"Expected exactly one like row for user/post, got {duplicates}")

    return f"same-user duplicate like: pass (count {before} -> {after}, rows={duplicates})"


def test_two_users_like_same_post() -> str:
    reset_database()
    post_description = "Bronze reflections in the arcade right before midnight."
    post_id = post_id_for(post_description)
    user_ids = [user_id_for("tianxing"), user_id_for("noah")]

    before = like_count(post_id)

    run_concurrently(
        lambda: _set_like(post_id, user_ids[0], True),
        lambda: _set_like(post_id, user_ids[1], True),
    )

    after = like_count(post_id)

    if after != before + 2:
        raise AssertionError(f"Expected like count {before + 2}, got {after}")

    return f"two-user concurrent like: pass (count {before} -> {after})"


def test_same_user_duplicate_follow() -> str:
    reset_database()
    follower_id = user_id_for("luna")
    followee_username = "sam"
    followee_id = user_id_for(followee_username)

    before = follow_count(followee_id)

    results = run_concurrently(
        lambda: _set_follow(follower_id, followee_username, True),
        lambda: _set_follow(follower_id, followee_username, True),
    )

    after = follow_count(followee_id)
    duplicates = duplicate_follow_rows(follower_id, followee_id)

    if after != before + 1:
        raise AssertionError(f"Expected follower count {before + 1}, got {after}; results={results}")
    if duplicates != 1:
        raise AssertionError(f"Expected exactly one follow row for follower/followee, got {duplicates}")

    return f"same-user duplicate follow: pass (count {before} -> {after}, rows={duplicates})"


def _set_like(post_id: int, user_id: int, liked: bool):
    with SessionLocal() as db:
        return set_like(db, post_id=post_id, user_id=user_id, liked=liked)


def _set_follow(follower_user_id: int, followee_username: str, is_following: bool):
    with SessionLocal() as db:
        return set_follow(
            db,
            follower_user_id=follower_user_id,
            followee_username=followee_username,
            is_following=is_following,
        )


def main() -> None:
    results = [
        test_same_user_duplicate_like(),
        test_two_users_like_same_post(),
        test_same_user_duplicate_follow(),
    ]
    print("Concurrency checks passed:")
    for result in results:
        print(f"- {result}")


if __name__ == "__main__":
    main()
