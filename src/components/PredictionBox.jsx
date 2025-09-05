import React, { useState, useEffect } from 'react';
import { PredictionService } from '../services/PredictionService';

const PredictionBox = ({ onNavigateToAnalytics }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        // You can customize this data based on your model's requirements
        const data = {
          timestamp: new Date().toISOString(),
          current_occupancy: 75, // Example value
          day_of_week: new Date().getDay(),
          hour: new Date().getHours()
        };

        const result = await PredictionService.getPredictions(data);
        setPrediction(result);
        setLoading(false);
      } catch (err) {
        setError('Failed to load prediction');
        setLoading(false);
      }
    };

    fetchPrediction();
    // Refresh predictions every 5 minutes
    const interval = setInterval(fetchPrediction, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      onClick={onNavigateToAnalytics}
      className="border-2 rounded-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
      style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold" style={{ color: '#01796F' }}>Hourly Prediction</h3>
        <span className="text-sm" style={{ color: '#01796F' }}>Next Hour</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          {loading ? (
            <p className="text-sm" style={{ color: '#01796F' }}>Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <>
              <p className="text-2xl font-bold" style={{ color: '#01796F' }}>
                {prediction?.current || '--'}
              </p>
              <p className="text-sm" style={{ color: '#01796F' }}>Expected Patients</p>
            </>
          )}
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" 
             style={{ backgroundColor: '#01796F' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PredictionBox;
