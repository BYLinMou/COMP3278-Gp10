from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=schemas.AnalyticsOverview)
def get_analytics_overview(db: Session = Depends(get_db)):
    return crud.get_analytics_overview(db)

