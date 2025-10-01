from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Global variables to store model and data
model = None
synthetic_data = None
current_prediction = None

# Alert threshold configuration
PATIENT_THRESHOLD_HIGH = 40  # Red alert threshold
PATIENT_THRESHOLD_MEDIUM = 30  # Yellow alert threshold

def get_alert_level(patient_count):
    """Determine alert level based on patient count"""
    if patient_count >= PATIENT_THRESHOLD_HIGH:
        return {"level": "high", "color": "red", "message": "CRITICAL: High patient volume!"}
    elif patient_count >= PATIENT_THRESHOLD_MEDIUM:
        return {"level": "medium", "color": "yellow", "message": "WARNING: Elevated patient volume"}
    else:
        return {"level": "normal", "color": "green", "message": "Normal patient volume"}

def load_model():
    """Load the trained Random Forest model"""
    global model
    try:
        # Try the new Random Forest model first
        model_path = os.path.join(os.path.dirname(__file__), 'rf_best_model.joblib')
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            print("Random Forest model loaded successfully!")
            return True
        
        # Fallback to old model
        model_path = os.path.join(os.path.dirname(__file__), 'ml_model.pkl')
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            print("Legacy model loaded successfully!")
            return True
            
        print("No model file found!")
        return False
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return False

def generate_synthetic_data(hours=240):  # 10 days of hourly data
    """Generate comprehensive synthetic historical data with all model features"""
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)
    
    # Generate hourly timestamps
    dates = pd.date_range(start=start_time, end=end_time, freq='H')
    
    # Create DataFrame with basic features
    df = pd.DataFrame({
        'datetime': dates,
        'dayofweek': dates.dayofweek,
        'hour': dates.hour,
        'month': dates.month,
        'day': dates.day
    })
    
    # Generate realistic patient counts first
    base_patients = 25
    df['patients'] = (base_patients + 
                     12 * np.sin(2 * np.pi * df['hour'] / 24) +  # Daily cycle (peak afternoon)
                     8 * np.sin(2 * np.pi * df['dayofweek'] / 7) +  # Weekly cycle
                     5 * np.cos(2 * np.pi * df['month'] / 12) +  # Monthly variation
                     np.random.normal(0, 4, size=len(df)))  # Random variation
    
    # Ensure positive values
    df['patients'] = df['patients'].apply(lambda x: max(5, int(round(x))))
    
    # Add some test scenarios for alert demonstration (last few entries)
    if len(df) >= 5:
        df.iloc[-5, df.columns.get_loc('patients')] = 42  # High alert
        df.iloc[-4, df.columns.get_loc('patients')] = 35  # Medium alert  
        df.iloc[-3, df.columns.get_loc('patients')] = 25  # Normal
        df.iloc[-2, df.columns.get_loc('patients')] = 31  # Medium alert
        df.iloc[-1, df.columns.get_loc('patients')] = 27  # Normal (current)
    
    # Add holiday feature (simplified - weekends and some random holidays)
    df['holiday'] = ((df['dayofweek'] >= 5) | 
                    (np.random.random(len(df)) < 0.05)).astype(int)
    
    # Generate lag features (use patient counts)
    df['lag1'] = df['patients'].shift(1, fill_value=df['patients'].iloc[0])
    df['lag2'] = df['patients'].shift(2, fill_value=df['patients'].iloc[0])
    df['lag3'] = df['patients'].shift(3, fill_value=df['patients'].iloc[0])
    df['lag6'] = df['patients'].shift(6, fill_value=df['patients'].iloc[0])
    df['lag12'] = df['patients'].shift(12, fill_value=df['patients'].iloc[0])
    df['lag18'] = df['patients'].shift(18, fill_value=df['patients'].iloc[0])
    df['lag24'] = df['patients'].shift(24, fill_value=df['patients'].iloc[0])
    
    # Generate rolling averages
    df['rolling_3h'] = df['patients'].rolling(window=3, min_periods=1).mean()
    df['rolling_6h'] = df['patients'].rolling(window=6, min_periods=1).mean()
    df['rolling_12h'] = df['patients'].rolling(window=12, min_periods=1).mean()
    df['rolling_18h'] = df['patients'].rolling(window=18, min_periods=1).mean()
    df['rolling_24h'] = df['patients'].rolling(window=24, min_periods=1).mean()
    
    # Generate engineered features
    df['hour_sq'] = df['hour'] ** 2
    df['hour_holiday'] = df['hour'] * df['holiday']
    df['lag1_lag24'] = df['lag1'] * df['lag24']
    df['peak_hour'] = ((df['hour'] >= 10) & (df['hour'] <= 16)).astype(int)
    
    # Generate seasonal features (one-hot encoded)
    # Monsoon: June-September, Summer: March-May, Winter: October-February
    df['season_Monsoon'] = df['month'].apply(lambda x: 1 if x in [6, 7, 8, 9] else 0)
    df['season_Summer'] = df['month'].apply(lambda x: 1 if x in [3, 4, 5] else 0)
    df['season_Winter'] = df['month'].apply(lambda x: 1 if x in [10, 11, 12, 1, 2] else 0)
    
    return df

def get_next_hour_prediction():
    """Get prediction for the next hour using the new Random Forest model"""
    if model is None or synthetic_data is None:
        return None
        
    try:
        # Get next hour's datetime
        next_hour_time = datetime.now() + timedelta(hours=1)
        
        # Get the most recent data from synthetic_data for lag and rolling features
        recent_data = synthetic_data.tail(24).copy()  # Last 24 hours for lags
        
        if len(recent_data) < 24:
            print("Insufficient historical data for prediction")
            return None
        
        # Basic time features
        dayofweek = next_hour_time.weekday()
        hour = next_hour_time.hour
        month = next_hour_time.month
        
        # Holiday feature (simplified - weekend or random holiday)
        holiday = 1 if dayofweek >= 5 else 0
        
        # Lag features (from recent synthetic data)
        lag1 = recent_data['patients'].iloc[-1]
        lag2 = recent_data['patients'].iloc[-2]
        lag3 = recent_data['patients'].iloc[-3]
        lag6 = recent_data['patients'].iloc[-6]
        lag12 = recent_data['patients'].iloc[-12]
        lag18 = recent_data['patients'].iloc[-18]
        lag24 = recent_data['patients'].iloc[-24]
        
        # Rolling averages
        rolling_3h = recent_data['patients'].tail(3).mean()
        rolling_6h = recent_data['patients'].tail(6).mean()
        rolling_12h = recent_data['patients'].tail(12).mean()
        rolling_18h = recent_data['patients'].tail(18).mean()
        rolling_24h = recent_data['patients'].tail(24).mean()
        
        # Engineered features
        hour_sq = hour ** 2
        hour_holiday = hour * holiday
        lag1_lag24 = lag1 * lag24
        peak_hour = 1 if 10 <= hour <= 16 else 0
        
        # Seasonal features
        season_Monsoon = 1 if month in [6, 7, 8, 9] else 0
        season_Summer = 1 if month in [3, 4, 5] else 0
        season_Winter = 1 if month in [10, 11, 12, 1, 2] else 0
        
        # Create feature array in the correct order
        features = np.array([[
            dayofweek, hour, holiday, lag1, lag2, lag3, lag24, lag6, lag12, lag18,
            rolling_3h, rolling_6h, rolling_24h, rolling_12h, rolling_18h,
            hour_sq, hour_holiday, lag1_lag24, peak_hour,
            season_Monsoon, season_Summer, season_Winter
        ]])
        
        # Create DataFrame with proper column names for the model
        feature_names = ['dayofweek', 'hour', 'holiday', 'lag1', 'lag2', 'lag3', 'lag24', 
                        'lag6', 'lag12', 'lag18', 'rolling_3h', 'rolling_6h', 'rolling_24h', 
                        'rolling_12h', 'rolling_18h', 'hour_sq', 'hour_holiday', 'lag1_lag24', 
                        'peak_hour', 'season_Monsoon', 'season_Summer', 'season_Winter']
        
        features_df = pd.DataFrame(features, columns=feature_names)
        
        # Get prediction
        prediction = model.predict(features_df)[0]
        return max(0, int(round(prediction)))  # Ensure non-negative integer
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return None

# Initialize model and data on startup
if not load_model():
    print("Warning: Model failed to load. Some features may be unavailable.")

# Generate initial synthetic data (10 days)
synthetic_data = generate_synthetic_data(240)  # 10 days = 240 hours
current_prediction = get_next_hour_prediction()

@app.route('/predict', methods=['POST'])
def predict():
    """Prediction endpoint with alert information"""
    next_hour = (datetime.now() + timedelta(hours=1)).strftime('%I:00 %p')
    prediction = get_next_hour_prediction()
    
    # Get alert information for the prediction
    alert_info = get_alert_level(prediction) if prediction is not None else None
    
    response = {
        'current': prediction,  # Changed to match frontend expectation
        'next_hour': next_hour,
        'model_status': model is not None,
        'alert': alert_info,
        'threshold': {
            'high': PATIENT_THRESHOLD_HIGH,
            'medium': PATIENT_THRESHOLD_MEDIUM
        }
    }
    return jsonify(response)

@app.route('/')
def index():
    """Main dashboard endpoint"""
    return predict()

@app.route('/analytics')
def analytics():
    """Analytics endpoint with alert information"""
    if synthetic_data is None:
        return jsonify({'error': 'No data available'}), 500
    
    # Generate alert levels for all historical data
    alerts = [get_alert_level(count) for count in synthetic_data['patients'].tolist()]
    
    # Get alert info for next hour prediction
    next_hour_alert = get_alert_level(current_prediction) if current_prediction is not None else None
    
    # Prepare data for the chart
    chart_data = {
        'timestamps': synthetic_data['datetime'].dt.strftime('%Y-%m-%d %H:%M').tolist(),
        'actual': synthetic_data['patients'].tolist(),
        'alerts': alerts,  # Alert information for each data point
        'next_hour': {
            'timestamp': (datetime.now() + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M'),
            'prediction': current_prediction,
            'alert': next_hour_alert
        },
        'thresholds': {
            'high': PATIENT_THRESHOLD_HIGH,
            'medium': PATIENT_THRESHOLD_MEDIUM
        }
    }
    
    return jsonify(chart_data)

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'synthetic_data_available': synthetic_data is not None,
        'current_time': datetime.now().isoformat(),
        'alert_thresholds': {
            'high': PATIENT_THRESHOLD_HIGH,
            'medium': PATIENT_THRESHOLD_MEDIUM
        },
        'prediction_frequency': 'hourly'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)