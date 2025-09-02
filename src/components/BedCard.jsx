import React from 'react';
import { BED_STATUSES, getStatusColor, getStatusLabel } from '../utils/bedUtils';

const BedCard = ({ bedId, bedData, onStatusChange }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const statusOptions = Object.values(BED_STATUSES);

  return (
    <div className={`${getStatusColor(bedData.status)} rounded-lg shadow-lg p-6 text-white transition-all hover:shadow-xl`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{bedId.toUpperCase()}</h3>
        <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
          {getStatusLabel(bedData.status)}
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
              {getStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BedCard;
