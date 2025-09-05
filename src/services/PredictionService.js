// Prediction service for fetching ML model predictions
const API_URL = '/api';

export const PredictionService = {
    async getPredictions(data) {
        try {
            // Get both predictions and analytics data
            const [predictionResponse, analyticsResponse] = await Promise.all([
                fetch(`${API_URL}/predict`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                }),
                fetch(`${API_URL}/analytics`)
            ]);
            
            if (!predictionResponse.ok || !analyticsResponse.ok) {
                throw new Error('Network response was not ok');
            }
            
            const [predictionData, analyticsData] = await Promise.all([
                predictionResponse.json(),
                analyticsResponse.json()
            ]);
            
            // Combine the data
            return {
                ...predictionData,
                actual: analyticsData.actual?.slice(-2), // Get last 2 hours
                timestamps: analyticsData.timestamps?.slice(-2)
            };
        } catch (error) {
            console.error('Error fetching predictions:', error);
            throw error;
        }
    },

    async checkHealth() {
        try {
            const response = await fetch(`${API_URL}/health`);
            return await response.json();
        } catch (error) {
            console.error('Error checking model health:', error);
            throw error;
        }
    }
};
