from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.query_engine import (
    SCHEMA_CONTEXT,
    execute_read_only_sql,
    list_supported_questions,
    text_to_sql,
)

router = APIRouter(prefix="/query", tags=["query"])


@router.get("/schema")
def get_query_schema() -> dict[str, object]:
    return {
        "tables": SCHEMA_CONTEXT,
        "supported_questions": list_supported_questions(),
    }


@router.post("/sql", response_model=schemas.SqlQueryResponse)
def run_sql_query(payload: schemas.SqlQueryRequest, db: Session = Depends(get_db)):
    try:
        return execute_read_only_sql(db, payload.sql, payload.params)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/text-to-sql", response_model=schemas.TextToSqlResponse)
def run_text_to_sql_query(payload: schemas.TextToSqlRequest, db: Session = Depends(get_db)):
    try:
        generated = text_to_sql(payload.prompt)
        result = execute_read_only_sql(db, generated.sql, generated.params)
        return schemas.TextToSqlResponse(
            title=generated.title,
            sql=" ".join(generated.sql.split()),
            params=generated.params,
            columns=result["columns"],
            row_count=result["row_count"],
            rows=result["rows"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

