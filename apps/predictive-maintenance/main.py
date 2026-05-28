from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from maintenance_model import MaintenancePredictor

load_dotenv()

app = FastAPI(
    title="Best Equipment OS - Predictive Maintenance",
    description="ML-powered predictive maintenance engine",
    version="1.0.0"
)

predictor = MaintenancePredictor()

class TelemetryData(BaseModel):
    vehicle_id: str
    fuel_level: Optional[float] = None
    engine_hours: Optional[float] = None
    speed: Optional[float] = None
    engine_temperature: Optional[float] = None
    oil_pressure: Optional[float] = None
    coolant_level: Optional[float] = None
    battery_voltage: Optional[float] = None
    timestamp: datetime

class MaintenancePrediction(BaseModel):
    vehicle_id: str
    failure_probability: float
    estimated_days_to_failure: Optional[int] = None
    recommended_actions: List[str]
    confidence_score: float

class HealthMetrics(BaseModel):
    engine_health: float
    fuel_system_health: float
    electrical_health: float
    cooling_system_health: float
    overall_health: float

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "predictive-maintenance"}

@app.post("/predict/vehicle/{vehicle_id}", response_model=MaintenancePrediction)
async def predict_maintenance(vehicle_id: str, telemetry: List[TelemetryData]):
    """Predict maintenance needs for a vehicle based on telemetry data."""
    try:
        if not telemetry:
            raise HTTPException(status_code=400, detail="No telemetry data provided")

        # Convert telemetry to features
        df = pd.DataFrame([t.dict() for t in telemetry])

        # Make prediction
        prediction = predictor.predict(df)

        return MaintenancePrediction(
            vehicle_id=vehicle_id,
            failure_probability=float(prediction['failure_probability']),
            estimated_days_to_failure=prediction.get('days_to_failure'),
            recommended_actions=prediction['recommended_actions'],
            confidence_score=float(prediction['confidence_score'])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/health/vehicle/{vehicle_id}", response_model=HealthMetrics)
async def get_vehicle_health(vehicle_id: str, telemetry: List[TelemetryData]):
    """Get detailed health metrics for a vehicle."""
    try:
        if not telemetry:
            raise HTTPException(status_code=400, detail="No telemetry data provided")

        df = pd.DataFrame([t.dict() for t in telemetry])

        # Calculate health metrics
        metrics = predictor.calculate_health_metrics(df)

        return HealthMetrics(
            engine_health=float(metrics['engine_health']),
            fuel_system_health=float(metrics['fuel_system_health']),
            electrical_health=float(metrics['electrical_health']),
            cooling_system_health=float(metrics['cooling_system_health']),
            overall_health=float(metrics['overall_health'])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train/model")
async def train_model(training_data: List[dict]):
    """Train the predictive model with historical data."""
    try:
        df = pd.DataFrame(training_data)
        predictor.train(df)
        return {"status": "success", "message": "Model trained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/status")
async def get_model_status():
    """Get the status of the trained model."""
    return {
        "is_trained": predictor.is_trained(),
        "model_version": "1.0.0",
        "features": predictor.get_feature_names(),
        "accuracy": predictor.get_accuracy() if predictor.is_trained() else None
    }

@app.get("/anomalies/vehicle/{vehicle_id}")
async def detect_anomalies(vehicle_id: str, telemetry: List[TelemetryData]):
    """Detect anomalies in vehicle telemetry data."""
    try:
        if not telemetry:
            raise HTTPException(status_code=400, detail="No telemetry data provided")

        df = pd.DataFrame([t.dict() for t in telemetry])
        anomalies = predictor.detect_anomalies(df)

        return {
            "vehicle_id": vehicle_id,
            "anomalies": anomalies,
            "count": len(anomalies)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3002))
    uvicorn.run(app, host="0.0.0.0", port=port)
