import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import json
import sys

class SalesPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
    
    def train(self, historical_data):
        if len(historical_data) < 3:
            return {"error": "Pas assez de données"}
        
        X = np.array(range(len(historical_data))).reshape(-1, 1)
        y = np.array(historical_data)
        
        self.model.fit(X, y)
        
        predictions = []
        last_idx = len(historical_data)
        for i in range(1, 7):
            pred = self.model.predict([[last_idx + i]])
            predictions.append(float(pred[0]))
        
        return {
            "predictions": predictions,
            "coefficient": float(self.model.coef_[0]),
            "intercept": float(self.model.intercept_),
            "trend": "up" if self.model.coef_[0] > 0 else "down"
        }
    
    def detect_anomalies(self, data):
        if len(data) < 3:
            return []
        
        mean = np.mean(data)
        std = np.std(data)
        threshold = 2 * std
        
        anomalies = []
        for i, val in enumerate(data):
            if abs(val - mean) > threshold:
                anomalies.append({"index": i, "value": val, "deviation": abs(val - mean)})
        
        return anomalies

if __name__ == "__main__":
    input_data = json.loads(sys.argv[1])
    predictor = SalesPredictor()
    
    if input_data.get("action") == "predict":
        result = predictor.train(input_data.get("data", []))
    elif input_data.get("action") == "anomalies":
        result = predictor.detect_anomalies(input_data.get("data", []))
    else:
        result = {"error": "Action non reconnue"}
    
    print(json.dumps(result))
