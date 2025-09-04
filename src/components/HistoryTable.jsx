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
    <div className="shadow-lg rounded-lg" style={{ backgroundColor: '#c9c7c0' }}>
      <div className="px-6 py-4 border-b border-black">
        <h2 className="text-lg font-semibold" style={{ color: '#01796F' }}>Recent Changes</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-black">
          <thead style={{ backgroundColor: '#c9c7c0' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#01796F' }}>
                Bed ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#01796F' }}>
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#01796F' }}>
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#01796F' }}>
                Staff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#01796F' }}>
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: '#c9c7c0' }} className="divide-y divide-black">
            {sortedHistory.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center" style={{ color: '#01796F' }}>
                  No history data available
                </td>
              </tr>
            ) : (
              sortedHistory.map(({ entry, actionDisplay }, index) => (
                <tr key={index} style={{ backgroundColor: '#c9c7c0' }} className="hover:bg-[#bab8b2] transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#01796F' }}>
                    {entry.bedId?.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full`} style={{ backgroundColor: '#01796F', color: 'white' }}>
                      {actionDisplay.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#01796F' }}>
                    {actionDisplay.details || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#01796F' }}>
                    {entry.data?.assignedBy || entry.data?.employeeId || entry.data?.supervisorName || entry.assignedNurse || entry.cleaningStaff || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#01796F' }}>
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
