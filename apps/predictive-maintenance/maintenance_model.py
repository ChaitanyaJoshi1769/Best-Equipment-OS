import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score
import joblib
import os
from datetime import datetime, timedelta

class MaintenancePredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.is_model_trained = False
        self.accuracy = None
        self.model_path = 'models/maintenance_model.pkl'
        self.scaler_path = 'models/scaler.pkl'

        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)

        # Try to load existing model
        self.load_model()

    def get_feature_names(self):
        return [
            'fuel_level',
            'engine_hours',
            'speed',
            'engine_temperature',
            'oil_pressure',
            'coolant_level',
            'battery_voltage'
        ]

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare and engineer features from telemetry data."""
        features = df.copy()

        # Fill missing values with median
        for col in self.get_feature_names():
            if col in features.columns and features[col].isnull().any():
                features[col] = features[col].fillna(features[col].median())

        # Feature engineering
        if 'fuel_level' in features.columns:
            features['fuel_consumption_rate'] = features['fuel_level'].diff().abs()

        if 'engine_hours' in features.columns:
            features['engine_hours_rate'] = features['engine_hours'].diff()

        if 'speed' in features.columns and 'engine_hours' in features.columns:
            features['avg_load'] = features['speed'] / (features['engine_hours'] + 1)

        if 'engine_temperature' in features.columns:
            features['temp_deviation'] = (features['engine_temperature'] - 90).abs()

        if 'oil_pressure' in features.columns:
            features['oil_pressure_anomaly'] = (features['oil_pressure'] < 30) | (features['oil_pressure'] > 65)

        return features

    def train(self, X_train, y_train=None):
        """Train the predictive model."""
        try:
            # If y_train not provided, use synthetic labels for demo
            if y_train is None:
                # Create synthetic target based on health metrics
                y_train = (X_train[self.get_feature_names()].mean(axis=1) < 40).astype(int)

            # Prepare features
            X_processed = self.prepare_features(X_train[self.get_feature_names()])

            # Split data
            X_train_split, X_test_split, y_train_split, y_test_split = train_test_split(
                X_processed, y_train, test_size=0.2, random_state=42
            )

            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train_split)
            X_test_scaled = self.scaler.transform(X_test_split)

            # Train ensemble model
            self.model = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42
            )

            self.model.fit(X_train_scaled, y_train_split)

            # Evaluate
            y_pred = self.model.predict(X_test_scaled)
            self.accuracy = accuracy_score(y_test_split, y_pred)
            self.is_model_trained = True

            # Save model
            self.save_model()

            return {
                'status': 'success',
                'accuracy': self.accuracy,
                'precision': precision_score(y_test_split, y_pred, zero_division=0),
                'recall': recall_score(y_test_split, y_pred, zero_division=0)
            }
        except Exception as e:
            raise Exception(f"Model training failed: {str(e)}")

    def predict(self, df: pd.DataFrame) -> dict:
        """Predict maintenance needs."""
        if not self.is_model_trained:
            return self._fallback_prediction(df)

        try:
            X_processed = self.prepare_features(df[self.get_feature_names()])
            X_scaled = self.scaler.transform(X_processed)

            # Get prediction and probability
            prediction = self.model.predict(X_scaled)[-1]
            probability = self.model.predict_proba(X_scaled)[-1, 1]

            # Calculate health score
            health_score = 100 * (1 - probability)

            # Estimate days to failure
            days_to_failure = None
            if probability > 0.5:
                # Scale probability to days (0.5-1.0 -> 0-60 days)
                days_to_failure = int((probability - 0.5) * 120)

            # Generate recommendations
            recommendations = self._generate_recommendations(df, probability)

            return {
                'failure_probability': float(probability),
                'days_to_failure': days_to_failure,
                'recommended_actions': recommendations,
                'confidence_score': min(self.accuracy or 0.85, 1.0)
            }
        except Exception as e:
            return self._fallback_prediction(df)

    def _fallback_prediction(self, df: pd.DataFrame) -> dict:
        """Fallback prediction using rule-based logic."""
        # Simple rule-based prediction
        latest = df.iloc[-1] if len(df) > 0 else None

        if latest is None:
            return {
                'failure_probability': 0.2,
                'days_to_failure': None,
                'recommended_actions': ['No data available for prediction'],
                'confidence_score': 0.0
            }

        # Simple heuristics
        probability = 0.2
        issues = []

        if latest.get('fuel_level', 100) < 20:
            probability += 0.05
            issues.append('Low fuel level')

        if latest.get('engine_temperature', 90) > 100:
            probability += 0.1
            issues.append('High engine temperature')

        if latest.get('oil_pressure', 50) < 30 or latest.get('oil_pressure', 50) > 65:
            probability += 0.15
            issues.append('Abnormal oil pressure')

        if latest.get('battery_voltage', 13) < 11.5:
            probability += 0.1
            issues.append('Low battery voltage')

        probability = min(probability, 0.95)

        recommendations = [
            f"Address: {issue}" for issue in issues
        ] if issues else ["Vehicle operating normally"]

        return {
            'failure_probability': float(probability),
            'days_to_failure': int((probability - 0.2) * 150) if probability > 0.3 else None,
            'recommended_actions': recommendations,
            'confidence_score': 0.75
        }

    def _generate_recommendations(self, df: pd.DataFrame, failure_probability: float) -> list:
        """Generate maintenance recommendations based on prediction."""
        recommendations = []

        if failure_probability > 0.7:
            recommendations.append("URGENT: Schedule maintenance immediately")
        elif failure_probability > 0.5:
            recommendations.append("Schedule maintenance within 1-2 weeks")
        else:
            recommendations.append("Monitor vehicle health regularly")

        latest = df.iloc[-1] if len(df) > 0 else None
        if latest is not None:
            if latest.get('engine_temperature', 90) > 95:
                recommendations.append("Check cooling system")
            if latest.get('oil_pressure', 50) < 35:
                recommendations.append("Check oil level and quality")
            if latest.get('fuel_level', 100) < 25:
                recommendations.append("Refuel vehicle")

        return recommendations

    def calculate_health_metrics(self, df: pd.DataFrame) -> dict:
        """Calculate detailed health metrics."""
        latest = df.iloc[-1] if len(df) > 0 else {}

        # Engine health (based on temperature and pressure)
        engine_temp = latest.get('engine_temperature', 90)
        oil_pressure = latest.get('oil_pressure', 50)
        engine_health = 100 - abs(engine_temp - 90) - abs((oil_pressure - 50) / 2)
        engine_health = max(0, min(100, engine_health))

        # Fuel system health
        fuel_level = latest.get('fuel_level', 50)
        fuel_system_health = fuel_level + (50 - fuel_level) * 0.2

        # Electrical health
        battery_voltage = latest.get('battery_voltage', 13)
        electrical_health = max(0, min(100, battery_voltage * 8))

        # Cooling system health
        coolant_level = latest.get('coolant_level', 100)
        cooling_health = coolant_level

        # Overall health
        overall_health = (engine_health + fuel_system_health + electrical_health + cooling_health) / 4

        return {
            'engine_health': max(0, min(100, engine_health)),
            'fuel_system_health': max(0, min(100, fuel_system_health)),
            'electrical_health': max(0, min(100, electrical_health)),
            'cooling_system_health': max(0, min(100, cooling_health)),
            'overall_health': max(0, min(100, overall_health))
        }

    def detect_anomalies(self, df: pd.DataFrame) -> list:
        """Detect anomalies in telemetry data."""
        anomalies = []
        normal_ranges = {
            'fuel_level': (5, 100),
            'engine_temperature': (60, 110),
            'oil_pressure': (20, 70),
            'battery_voltage': (11.5, 14.5),
            'coolant_level': (50, 100),
            'speed': (0, 150)
        }

        for idx, row in df.iterrows():
            for param, (min_val, max_val) in normal_ranges.items():
                if param in row and (row[param] < min_val or row[param] > max_val):
                    anomalies.append({
                        'timestamp': row.get('timestamp', idx),
                        'parameter': param,
                        'value': row[param],
                        'normal_range': f"{min_val}-{max_val}"
                    })

        return anomalies

    def is_trained(self) -> bool:
        """Check if model is trained."""
        return self.is_model_trained

    def get_accuracy(self) -> Optional[float]:
        """Get model accuracy."""
        return self.accuracy

    def save_model(self):
        """Save model and scaler to disk."""
        if self.model:
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)

    def load_model(self):
        """Load model and scaler from disk."""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                self.is_model_trained = True
        except Exception as e:
            print(f"Could not load model: {e}")
