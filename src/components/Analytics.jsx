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

const Analytics = ({ onBack }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to convert backend alert colors to CSS classes
  const getAlertColorClass = (alertColor) => {
    switch(alertColor) {
      case 'red':
        return 'text-red-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'green':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Helper function to get background colors for confidence indicator
  const getAlertBgClass = (alertColor) => {
    switch(alertColor) {
      case 'red':
        return 'bg-red-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

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
        setAlertInfo(analyticsData.alert);
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="border-2 rounded-lg px-4 py-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex items-center space-x-2"
              style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890', color: '#01796F' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-center mb-8" style={{ color: '#01796F' }}>Analytics & Prediction</h1>
        </div>
        
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
                  <div className={`text-6xl font-bold mb-4 ${getAlertColorClass(alertInfo?.color)}`}>
                    {prediction || '--'}
                  </div>
                  <div className="text-xl" style={{ color: '#01796F' }}>
                    Expected Patients
                  </div>
                  <div className="mt-8 text-sm text-gray-600">
                    Next Hour: {new Date(Date.now() + 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {alertInfo && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${getAlertBgClass(alertInfo.color)}`}></span>
                      <span className="text-sm text-gray-600">
                        Alert Level: {alertInfo.level.charAt(0).toUpperCase() + alertInfo.level.slice(1)}
                      </span>
                    </div>
                  )}
                  {alertInfo && alertInfo.level !== 'normal' && (
                    <div className={`mt-2 text-sm font-medium ${getAlertColorClass(alertInfo.color)}`}>
                      {alertInfo.message}
                    </div>
                  )}
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
