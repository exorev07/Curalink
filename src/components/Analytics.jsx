import React from 'react';

const Analytics = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e9eae0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: '#01796F' }}>Analytics & Prediction</h1>
        
        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Live Analytics Box */}
          <div className="border-2 rounded-lg p-6" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#01796F' }}>Live Analytics</h2>
            <div className="h-[400px] flex items-center justify-center border-2 rounded-lg" style={{ backgroundColor: '#e9eae0', borderColor: '#9a9890' }}>
              <p className="text-gray-500">Graph will be integrated here</p>
            </div>
          </div>

          {/* Hourly Prediction Box */}
          <div className="border-2 rounded-lg p-6" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#01796F' }}>Hourly Predictions</h2>
            <div className="h-[400px] flex items-center justify-center border-2 rounded-lg" style={{ backgroundColor: '#e9eae0', borderColor: '#9a9890' }}>
              <p className="text-gray-500">ML predictions will be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
