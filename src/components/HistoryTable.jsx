import React from 'react';
import { getStatusBadgeColor, getStatusLabel, formatTimestamp } from '../utils/bedUtils';

const HistoryTable = ({ historyData }) => {

  // Helper function to format action display
  const getActionDisplay = (entry) => {
    if (entry.action) {
      // New format with action and data
      switch (entry.action) {
        case 'patient_assigned':
          const assignedPatientName = entry.data?.patientName || 'Unknown Patient';
          const assignedPatientId = entry.data?.patientId;
          const assignedDetails = assignedPatientId ? `${assignedPatientName} (${assignedPatientId})` : assignedPatientName;
          return {
            label: 'Patient Assigned',
            color: 'bg-blue-100 text-blue-800',
            details: assignedDetails
          };
        case 'patient_unassigned':
          const reasonText = entry.data?.reason === 'assignment_expired' ? 'Timer Expired' : 'Manual Unassignment';
          const unassignedPatientName = entry.data?.patientInfo?.patientName || 'Unknown Patient';
          const unassignedPatientId = entry.data?.patientInfo?.patientId;
          const unassignedDetails = unassignedPatientId ? `${unassignedPatientName} (${unassignedPatientId})` : unassignedPatientName;
          return {
            label: reasonText,
            color: entry.data?.reason === 'assignment_expired' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800',
            details: unassignedDetails
          };
        case 'supervisor_override':
          return {
            label: 'Supervisor Override',
            color: 'bg-purple-100 text-purple-800',
            details: `${entry.data?.previousStatus || 'Unknown'} → ${entry.data?.newStatus || 'Unknown'}`
          };
        case 'assignment_expired':
          const expiredPatientName = entry.data?.patientName || 'Unknown Patient';
          const expiredPatientId = entry.data?.patientId;
          const expiredDetails = expiredPatientId ? `${expiredPatientName} (${expiredPatientId}) - Auto-unassigned` : `${expiredPatientName} - Auto-unassigned`;
          return {
            label: 'Assignment Expired',
            color: 'bg-red-100 text-red-800',
            details: expiredDetails
          };
        case 'override_cleared':
          return {
            label: 'Override Cleared',
            color: 'bg-green-100 text-green-800',
            details: entry.data?.clearedBy || 'System'
          };
        default:
          return {
            label: entry.action.replace('_', ' ').toUpperCase(),
            color: 'bg-gray-100 text-gray-800',
            details: ''
          };
      }
    } else {
      // Skip legacy status-based entries to keep history clean
      return null;
    }
  };

  // Sort history by timestamp (newest first) and filter out legacy entries
  const sortedHistory = [...historyData]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(entry => ({ entry, actionDisplay: getActionDisplay(entry) }))
    .filter(({ actionDisplay }) => actionDisplay !== null);

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
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
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
              sortedHistory.map(({ entry, actionDisplay }, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.bedId?.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${actionDisplay.color}`}>
                      {actionDisplay.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {actionDisplay.details || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.data?.assignedBy || entry.data?.supervisorName || entry.assignedNurse || entry.cleaningStaff || '-'}
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
