import React, { useEffect } from 'react';
import HistoryTable from './HistoryTable';

const FullHistory = ({ onBack, historyData }) => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e9eae0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
            <div className="text-sm text-gray-600">
              Total Changes: {historyData.length}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center" style={{ color: '#01796F' }}>Complete Change History</h1>
        </div>

        {/* Info Banner */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">📋</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Complete History View</h3>
              <p className="text-sm text-blue-700">
                This view shows all bed status changes, patient assignments, and supervisor overrides in chronological order.
              </p>
            </div>
          </div>
        </div>

        {/* Full History Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">All Changes</h2>
            <p className="text-sm text-gray-600">Complete log of all bed management activities</p>
          </div>
          <div className="p-6">
            <HistoryTable historyData={historyData} showPagination={true} />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Changes</h3>
            <p className="text-2xl font-bold text-gray-900">{historyData.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Status Changes</h3>
            <p className="text-2xl font-bold text-blue-600">
              {historyData.filter(item => item.action === 'status_change').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Patient Assignments</h3>
            <p className="text-2xl font-bold text-green-600">
              {historyData.filter(item => item.action === 'patient_assigned').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Supervisor Overrides</h3>
            <p className="text-2xl font-bold text-purple-600">
              {historyData.filter(item => item.action === 'supervisor_override').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullHistory;