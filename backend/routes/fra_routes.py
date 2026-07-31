import csv
import io
import math
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
import numpy as np
from sqlalchemy import desc
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import FRAResult
from services.fra_model import analyze_fra
from services.ml_model import analyze_fra_ml

router = APIRouter()

SERIES_LIMIT = 500


def _parse_numeric_series(contents: str, ext: str) -> List[float]:
    series: List[float] = []
    if ext == "csv":
        reader = csv.DictReader(io.StringIO(contents))
        for row in reader:
            try:
                v = float(row["magnitude"])
            except Exception:
                continue
            if math.isfinite(v):
                series.append(v)
            if len(series) >= SERIES_LIMIT * 4:
                break
        return series

    # txt fallback: parse one numeric value per line/cell
    reader = csv.reader(io.StringIO(contents))
    for row in reader:
        if not row:
            continue
        for cell in row[:1]:
            try:
                v = float(str(cell).strip())
            except (TypeError, ValueError):
                continue
            if math.isfinite(v):
                series.append(v)
        if len(series) >= SERIES_LIMIT * 4:
            break
    return series


@router.post("/upload")
async def upload_fra_file(
    file: UploadFile = File(...),
    _user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = file.filename or "upload"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext not in {"csv", "txt"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .csv or .txt files are supported",
        )

    raw = await file.read()
    try:
        text = raw.decode("utf-8", errors="ignore")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode file")

    series = _parse_numeric_series(text, ext=ext)
    cleaned = [float(v) for v in series if math.isfinite(v)]
    if len(cleaned) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Need at least 50 valid magnitude points",
        )
    cleaned = cleaned[:SERIES_LIMIT]

    arr = np.asarray(cleaned, dtype=np.float64)
    print("Sample input:", cleaned[:10])
    print("Mean:", float(np.mean(arr)), "Std:", float(np.std(arr)))
    normalized = ((arr - float(np.mean(arr))) / (float(np.std(arr)) + 1e-6)).astype(np.float32).tolist()
    print("Sample input:", normalized[:10])
    print("Mean:", float(np.mean(normalized)), "Std:", float(np.std(normalized)))

    baseline = analyze_fra(cleaned)
    analysis = analyze_fra_ml(cleaned)
    metrics = baseline["metrics"]
    n = len(cleaned)
    result_id = str(uuid.uuid4())

    stored = {
        "filename": filename,
        "points": n,
        "mean": metrics["mean"],
        "max": metrics["max"],
        "min": metrics["min"],
        "std": metrics["std"],
        "peak_to_peak": metrics["peak_to_peak"],
        "energy": metrics["energy"],
        "spectral_energy": metrics.get("spectral_energy", 0.0),
        "classification": analysis["classification"],
        "confidence": float(analysis.get("confidence", 0.0)),
        "anomaly_score": float(analysis.get("anomaly_score", 0.0)),
        "probabilities": analysis.get("probabilities", {}),
        "signals": analysis.get("signals", baseline.get("signals", {})),
        "explanation": analysis.get("explanation", ""),
        "model_source": analysis.get("model_source", "rule"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "series": [float(x) for x in cleaned[:SERIES_LIMIT]],
    }
    db_result = FRAResult(
        id=result_id,
        filename=filename,
        classification=analysis["classification"],
        data=stored,
    )
    db.add(db_result)
    db.commit()

    return {"id": result_id, **stored}


@router.get("/results/{result_id}")
def get_result(result_id: str, _user=Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(FRAResult).filter(FRAResult.id == result_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Result not found")
    payload = row.data or {}
    return {"id": row.id, **payload}


@router.get("/history")
def get_history(
    limit: int = 10,
    classification: Optional[str] = None,
    days: Optional[int] = None,
    _user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    safe_limit = max(1, min(limit or 10, 100))
    query = db.query(FRAResult)
    if classification:
        query = query.filter(FRAResult.classification == classification)
    if days is not None and days > 0:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(FRAResult.created_at >= cutoff)

    rows = query.order_by(desc(FRAResult.created_at), desc(FRAResult.id)).limit(safe_limit).all()
    out = []
    for row in rows:
        timestamp = row.created_at.isoformat() if row.created_at else None
        out.append(
            {
                "id": row.id,
                "filename": row.filename,
                "classification": row.classification,
                "timestamp": timestamp,
            }
        )
    return out

