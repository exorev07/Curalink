import React from 'react';

const BedCard = ({ bedId, bedData, onStatusChange }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'unoccupied':
        return 'bg-bed-unoccupied';
      case 'occupied':
        return 'bg-bed-occupied';
      case 'occupied-cleaning':
        return 'bg-bed-occupied-cleaning';
      case 'unoccupied-cleaning':
        return 'bg-bed-unoccupied-cleaning';
      default:
        return 'bg-gray-500';
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

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const statusOptions = [
    'unoccupied',
    'occupied',
    'occupied-cleaning',
    'unoccupied-cleaning'
  ];

  return (
    <div className={`${getStatusColor(bedData.status)} rounded-lg shadow-lg p-6 text-white transition-all hover:shadow-xl`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{bedId.toUpperCase()}</h3>
        <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
          {getStatusText(bedData.status)}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Last Updated:</strong>
          <br />
          {formatTimestamp(bedData.lastUpdate)}
        </div>
        
        {bedData.assignedNurse && (
          <div>
            <strong>Nurse:</strong> {bedData.assignedNurse}
          </div>
        )}
        
        {bedData.cleaningStaff && (
          <div>
            <strong>Cleaning Staff:</strong> {bedData.cleaningStaff}
          </div>
        )}
      </div>

      <div className="mt-4">
        <select
          value={bedData.status}
          onChange={(e) => onStatusChange(bedId, e.target.value)}
          className="w-full bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
        >
          {statusOptions.map(status => (
            <option key={status} value={status} className="text-gray-800">
              {getStatusText(status)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BedCard;
