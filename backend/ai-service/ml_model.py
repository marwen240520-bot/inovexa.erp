import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import json
import sys
import warnings
warnings.filterwarnings('ignore')

class SalesPredictor:
    def __init__(self):
        self.model = Ridge(alpha=1.0)
        self.scaler = StandardScaler()
        self.trained = False
    
    def train(self, historical_data):
        if len(historical_data) < 4:
            return {"error": "Pas assez de données", "min_required": 4}
        
        # Créer des features (tendance, saisonnalité)
        X = []
        y = []
        
        for i in range(3, len(historical_data)):
            X.append([
                historical_data[i-3],
                historical_data[i-2],
                historical_data[i-1],
                i
            ])
            y.append(historical_data[i])
        
        if len(X) < 2:
            return {"error": "Pas assez de données pour l'entraînement"}
        
        X = np.array(X)
        y = np.array(y)
        
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.trained = True
        
        # Prédictions pour les 6 prochains mois
        predictions = []
        last_values = historical_data[-3:]
        
        for i in range(1, 7):
            features = [last_values[0], last_values[1], last_values[2], len(historical_data) + i]
            features_scaled = self.scaler.transform([features])
            pred = self.model.predict(features_scaled)[0]
            predictions.append(max(0, float(pred)))
            last_values = last_values[1:] + [pred]
        
        # Calcul de la confiance
        if len(y) > 2:
            y_pred = self.model.predict(X_scaled)
            r2 = r2_score(y, y_pred)
            confidence = max(50, min(95, r2 * 100))
        else:
            confidence = 70
        
        return {
            "predictions": predictions,
            "confidence": confidence,
            "trend": "up" if predictions[-1] > predictions[0] else "down",
            "growth_rate": ((predictions[-1] - predictions[0]) / predictions[0] * 100) if predictions[0] > 0 else 0
        }
    
    def recommend_stock(self, products):
        recommendations = []
        for product in products:
            if product.get("quantity", 0) < 10:
                recommendations.append({
                    "product_id": product.get("id"),
                    "product_name": product.get("name"),
                    "current_stock": product.get("quantity"),
                    "recommended_order": max(50, product.get("quantity", 0) * 2),
                    "priority": "high" if product.get("quantity", 0) < 5 else "medium"
                })
        return recommendations
    
    def detect_anomalies(self, data):
        if len(data) < 4:
            return []
        
        mean = np.mean(data)
        std = np.std(data)
        threshold = 2 * std
        
        anomalies = []
        for i, val in enumerate(data):
            if abs(val - mean) > threshold:
                anomalies.append({
                    "index": i,
                    "value": val,
                    "deviation": abs(val - mean),
                    "severity": "high" if abs(val - mean) > 3 * std else "medium"
                })
        
        return anomalies

if __name__ == "__main__":
    input_data = json.loads(sys.argv[1])
    predictor = SalesPredictor()
    
    if input_data.get("action") == "predict":
        result = predictor.train(input_data.get("data", []))
    elif input_data.get("action") == "recommend":
        result = predictor.recommend_stock(input_data.get("products", []))
    elif input_data.get("action") == "anomalies":
        result = predictor.detect_anomalies(input_data.get("data", []))
    else:
        result = {"error": "Action non reconnue"}
    
    print(json.dumps(result))
