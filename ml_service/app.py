"""Microservicio ML (FastAPI). Expone POST /predict y GET /health."""
from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

MODEL_PATH = Path(__file__).parent / "model.joblib"
if not MODEL_PATH.exists():
    raise RuntimeError("Falta model.joblib. Ejecuta primero: python train.py")

model = joblib.load(MODEL_PATH)
app = FastAPI(title="ML Support Classifier")


class PredictIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(body: PredictIn):
    text = body.message.strip()
    if not text:
        raise HTTPException(status_code=422, detail="message vacío")
    probs = model.predict_proba([text])[0]
    i = int(probs.argmax())
    return {"category": str(model.classes_[i]), "confidence": round(float(probs[i]), 4)}
