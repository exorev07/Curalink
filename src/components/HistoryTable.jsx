import React from 'react';

const HistoryTable = ({ historyData }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'unoccupied':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'occupied-cleaning':
        return 'bg-orange-100 text-orange-800';
      case 'unoccupied-cleaning':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'unoccupied':
        return 'Unoccupied';
      case 'occupied':
        return 'Occupied';
      case 'occupied-cleaning':
        return 'Occupied + Cleaning';
      case 'unoccupied-cleaning':
        return 'Unoccupied + Cleaning';
      default:
        return 'Unknown';
    }
  };

  // Sort history by timestamp (newest first)
  const sortedHistory = [...historyData].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="bg-white shadow-lg rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Changes</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bed ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nurse
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cleaning Staff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedHistory.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No history data available
                </td>
              </tr>
            ) : (
              sortedHistory.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.bedId?.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(entry.status)}`}>
                      {getStatusText(entry.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.assignedNurse || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.cleaningStaff || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;
