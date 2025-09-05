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

def load_model():
    """Load the trained model using joblib"""
    global model
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'ml_model.pkl')
        model = joblib.load(model_path)
        print("Model loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return False

def generate_synthetic_data(hours=168):  # 7 days of hourly data
    """Generate synthetic historical data"""
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)
    
    # Generate hourly timestamps
    dates = pd.date_range(start=start_time, end=end_time, freq='H')
    
    # Create DataFrame with all features
    df = pd.DataFrame({
        'datetime': dates,
        'dayofweek': dates.dayofweek,
        'hour': dates.hour,
        'month': dates.month,
        'day': dates.day
    })
    
    # Generate synthetic patient counts based on time patterns
    base_patients = 30  # Base number of patients
    
    # Add time-based patterns
    df['patients'] = (base_patients + 
                     15 * np.sin(2 * np.pi * df['hour'] / 24) +  # Daily cycle
                     5 * np.sin(2 * np.pi * df['dayofweek'] / 7) +  # Weekly cycle
                     np.random.normal(0, 5, size=len(df)))  # Random variation
    
    # Ensure patient counts are positive integers
    df['patients'] = df['patients'].apply(lambda x: max(0, int(round(x))))
    
    return df

def get_next_hour_prediction():
    """Get prediction for the next hour"""
    if model is None:
        return None
        
    # Get next hour's datetime
    next_hour_time = datetime.now() + timedelta(hours=1)
    
    # Create features in the same format as training data
    features = np.array([[
        next_hour_time.weekday(),  # dayofweek
        next_hour_time.hour,       # hour
        next_hour_time.month,      # Adding month as a feature
        next_hour_time.day         # Adding day as a feature
    ]])
    
    # Get prediction
    try:
        prediction = int(round(model.predict(features)[0]))
        return max(0, prediction)  # Ensure non-negative
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return None

# Initialize model and data on startup
if not load_model():
    print("Warning: Model failed to load. Some features may be unavailable.")

# Generate initial synthetic data
synthetic_data = generate_synthetic_data()
current_prediction = get_next_hour_prediction()

@app.route('/predict', methods=['POST'])
def predict():
    """Prediction endpoint"""
    next_hour = (datetime.now() + timedelta(hours=1)).strftime('%I:00 %p')
    prediction = get_next_hour_prediction()
    
    response = {
        'current': prediction,  # Changed to match frontend expectation
        'next_hour': next_hour,
        'model_status': model is not None
    }
    return jsonify(response)

@app.route('/')
def index():
    """Main dashboard endpoint"""
    return predict()

@app.route('/analytics')
def analytics():
    """Analytics endpoint"""
    if synthetic_data is None:
        return jsonify({'error': 'No data available'}), 500
    
    # Prepare data for the chart
    chart_data = {
        'timestamps': synthetic_data['datetime'].dt.strftime('%Y-%m-%d %H:%M').tolist(),
        'actual': synthetic_data['patients'].tolist(),
        'next_hour': {
            'timestamp': (datetime.now() + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M'),
            'prediction': current_prediction
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
        'current_time': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)