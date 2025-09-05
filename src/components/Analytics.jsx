import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { PredictionService } from '../services/PredictionService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch analytics data
        const analyticsData = await PredictionService.getPredictions({
          timestamp: new Date().toISOString()
        });

        // Get recent data from analytics
        const recentData = analyticsData.actual?.slice(-2) || [];
        setHistoricalData(recentData);
        setPrediction(analyticsData.current);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: [
      '2 Hours Ago',
      '1 Hour Ago',
      'Next Hour (Predicted)'
    ],
    datasets: [
      {
        label: 'Patient Count',
        data: [
          ...historicalData,
          prediction
        ],
        fill: true,
        backgroundColor: 'rgba(1, 121, 111, 0.2)',
        borderColor: '#01796F',
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: (context) => {
          // Make the prediction point different
          return context.dataIndex === 2 ? '#FF6B6B' : '#01796F';
        },
        pointBorderColor: (context) => {
          return context.dataIndex === 2 ? '#FF6B6B' : '#01796F';
        },
        pointStyle: (context) => {
          return context.dataIndex === 2 ? 'star' : 'circle';
        }
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#01796F',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return context.dataIndex === 2 
              ? `${label}: ${value} (Predicted)`
              : `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(1, 121, 111, 0.1)'
        },
        ticks: {
          color: '#01796F',
          font: {
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(1, 121, 111, 0.1)'
        },
        ticks: {
          color: '#01796F',
          font: {
            weight: 'bold'
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e9eae0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: '#01796F' }}>Analytics & Prediction</h1>
        
        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Live Analytics Box */}
          <div className="border-2 rounded-lg p-6" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#01796F' }}>Patient Traffic Trend</h2>
            <div className="h-[400px] relative border-2 rounded-lg p-4" style={{ backgroundColor: '#e9eae0', borderColor: '#9a9890' }}>
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Hourly Prediction Box */}
          <div className="border-2 rounded-lg p-6" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#01796F' }}>Next Hour Prediction</h2>
            <div className="h-[400px] flex flex-col items-center justify-center border-2 rounded-lg" 
                 style={{ backgroundColor: '#e9eae0', borderColor: '#9a9890' }}>
              {loading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              ) : (
                <>
                  <div className="text-6xl font-bold mb-4" style={{ color: '#01796F' }}>
                    {prediction || '--'}
                  </div>
                  <div className="text-xl" style={{ color: '#01796F' }}>
                    Expected Patients
                  </div>
                  <div className="mt-8 text-sm text-gray-600">
                    Next Hour: {new Date(Date.now() + 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-sm text-gray-600">Confidence: High</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
