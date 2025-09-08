import React, { useState, useEffect } from 'react';
import { BED_STATUSES, getStatusColor, getStatusLabel } from '../utils/bedUtils';
import { HARDWARE_BED_ID } from '../utils/hardwareBed';
import { 
  assignPatientToBed, 
  unassignPatientFromBed, 
  supervisorOverrideBedStatus,
  getEffectiveBedStatus,
  hasActivePatientAssignment,
  isPatientAssignmentExpired,
  getRemainingAssignmentTime
} from '../firebase/bedManager';

const BedCard = ({ bedId, bedData, onUpdate, updateLocalHistory, updateBedsData, allBeds }) => {
  const isHardwareBed = parseInt(bedId.replace('bed', '')) === HARDWARE_BED_ID;
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedOverrideStatus, setSelectedOverrideStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [patientIdError, setPatientIdError] = useState('');
  
  // New state for supervisor authentication
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [employeeIdError, setEmployeeIdError] = useState('');
  const [authError, setAuthError] = useState('');

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const handlePatientIdChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 6 characters
    if (/^\d{0,6}$/.test(value)) {
      setPatientId(value);
      setPatientIdError(''); // Clear error when user types valid input
    }
  };

  const handleEmployeeIdChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 6 characters
    if (/^\d{0,6}$/.test(value)) {
      setEmployeeId(value);
      setEmployeeIdError(''); // Clear error when user types valid input
      setAuthError(''); // Clear auth error when user types
    }
  };

  const effectiveStatus = getEffectiveBedStatus(bedData);
  const hasPatient = hasActivePatientAssignment(bedData);
  const hasOverride = bedData.override && bedData.override.active;

  // Update timer every minute
  useEffect(() => {
    if (hasPatient && effectiveStatus === BED_STATUSES.UNOCCUPIED) {
      const updateTimer = () => {
        const remaining = getRemainingAssignmentTime(bedData);
        setRemainingTime(remaining);
        setIsExpired(isPatientAssignmentExpired(bedData));
      };

      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(interval);
    } else {
      setRemainingTime(0);
      setIsExpired(false);
    }
  }, [hasPatient, effectiveStatus, bedData]);

  const formatRemainingTime = (minutes) => {
    if (minutes <= 0) return 'Expired';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleAssignPatient = async () => {
    // Validate patient ID is exactly 6 digits
    const patientIdTrimmed = patientId.trim();
    if (!patientIdTrimmed || !patientName.trim()) {
      alert('Please enter both Patient ID and Patient Name');
      return;
    }

    // Check if patient ID is exactly 6 digits
    if (!/^\d{6}$/.test(patientIdTrimmed)) {
      setPatientIdError('Patient ID must be exactly 6 digits');
      return;
    }

    setPatientIdError(''); // Clear error if validation passes
    setLoading(true);
    try {
      await assignPatientToBed(bedId, {
        patientId: patientIdTrimmed,
        patientName: patientName.trim(),
        assignedBy: 'current_user' // Replace with actual user ID
      }, updateLocalHistory, updateBedsData);
      
      setShowAssignModal(false);
      setPatientId('');
      setPatientName('');
      setPatientIdError('');
      onUpdate && onUpdate();
    } catch (error) {
      alert('Error assigning patient: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignPatient = async () => {
    const confirmed = window.confirm('Are you sure you want to unassign the patient from this bed?');
    if (!confirmed) return;

    setLoading(true);
    try {
      await unassignPatientFromBed(bedId, 'current_user', 'manual', updateLocalHistory, updateBedsData, allBeds); // Replace with actual user ID
      onUpdate && onUpdate();
    } catch (error) {
      alert('Error unassigning patient: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSupervisorOverride = async () => {
    // Validate Employee ID is exactly 6 digits
    if (!employeeId || employeeId.length !== 6) {
      setEmployeeIdError('Employee ID must be exactly 6 digits');
      return;
    }

    // Clear previous errors
    setEmployeeIdError('');
    setAuthError('');

    // Validate required fields
    if (!password.trim() || !selectedOverrideStatus) {
      setAuthError('Please fill in all required fields');
      return;
    }

    // Check authentication
    const validEmployeeIds = ['220306', '130506'];
    const validPassword = 'admin@123';

    if (!validEmployeeIds.includes(employeeId) || password !== validPassword) {
      setAuthError('Invalid Employee ID or password');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to override bed ${bedId} status to "${getStatusLabel(selectedOverrideStatus)}"?\n\nThis action will be logged for audit purposes.`
    );
    
    if (!confirmed) return;

    setLoading(true);
    try {
      await supervisorOverrideBedStatus(bedId, selectedOverrideStatus, {
        employeeId: employeeId,
        previousStatus: effectiveStatus,
        reason: overrideReason.trim() || 'No reason provided'
      }, updateLocalHistory, updateBedsData);
      
      setShowOverrideModal(false);
      // Clear all form fields
      setEmployeeId('');
      setPassword('');
      setOverrideReason('');
      setSelectedOverrideStatus('');
      setEmployeeIdError('');
      setAuthError('');
      onUpdate && onUpdate();
    } catch (error) {
      setAuthError('Error applying supervisor override: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`${getStatusColor(effectiveStatus)} rounded-lg shadow-lg p-6 text-white transition-all hover:shadow-xl relative flex flex-col h-full`}>
        {/* Override indicator */}
        {hasOverride && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
            OVERRIDE
          </div>
        )}
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{bedId.toUpperCase()}</h3>
            <p className="text-xs text-white text-opacity-80 mt-1">
              {bedData.ward || 'General'} Ward
            </p>
          </div>
          <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
            {getStatusLabel(effectiveStatus)}
          </span>
        </div>
        
        <div className="space-y-2 text-sm flex-grow">
          {isHardwareBed && bedData.sensorData ? (
            <>
              <div>
                <strong>Sensor Status:</strong>
                <br />
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  bedData.sensorData.online ? 'bg-green-500 bg-opacity-30' : 'bg-red-500 bg-opacity-30'
                }`}>
                  {bedData.sensorData.online ? '🟢 Connected' : '🔴 Offline'}
                </span>
              </div>
              <div>
                <strong>Temperature:</strong>
                <br />
                {bedData.sensorData.temperature.toFixed(1)}°C
                {bedData.sensorData.hasBodyTemp && 
                  <span className="ml-2 text-yellow-300">⚡ Body heat detected</span>
                }
              </div>
              <div>
                <strong>Pressure:</strong>
                <br />
                {bedData.sensorData.fsrValue}
                {bedData.sensorData.hasWeight && 
                  <span className="ml-2 text-yellow-300">⚡ Weight detected</span>
                }
              </div>
              <div>
                <strong>Last Updated:</strong>
                <br />
                {formatTimestamp(bedData.sensorData.lastUpdate)}
              </div>
            </>
          ) : (
            <div>
              <strong>Last Updated:</strong>
              <br />
              {formatTimestamp(bedData.lastUpdate)}
            </div>
          )}

          {/* Patient Assignment Info */}
          {hasPatient && (
            <div className="bg-white bg-opacity-20 p-2 rounded">
              <strong>Assigned Patient:</strong>
              <br />
              ID: {bedData.assignment.patientId}
              <br />
              Name: {bedData.assignment.patientName}
              <br />
              Assigned: {formatTimestamp(bedData.assignment.assignedAt)}
              
              {/* Timer display for unoccupied beds with patient assignments */}
              {effectiveStatus === BED_STATUSES.UNOCCUPIED && (
                <div className={`mt-2 p-2 rounded text-sm ${isExpired ? 'bg-red-500 text-white' : remainingTime <= 5 ? 'bg-yellow-500 text-black' : 'text-gray-800'}`}
                     style={!isExpired && remainingTime > 5 ? { backgroundColor: '#e0dcfc' } : {}}>
                  {isExpired ? (
                    <>
                      ⚠️ <strong>EXPIRED:</strong> Patient did not arrive
                    </>
                  ) : (
                    <>
                      ⏱️ <strong>Time remaining:</strong> {formatRemainingTime(remainingTime)}
                      {remainingTime <= 5 && (
                        <div className="text-xs mt-1">
                          Patient should arrive soon!
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Override Info */}
          {hasOverride && (
            <div className="bg-yellow-200 bg-opacity-30 p-2 rounded text-yellow-100">
              <strong>Override Active:</strong>
              <br />
              By Employee: {bedData.override.employeeId || bedData.override.supervisorId || 'Unknown'}
              <br />
              Reason: {bedData.override.reason}
            </div>
          )}
          
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

        {/* Action Buttons */}
        <div className="mt-auto pt-4 space-y-2">
          {/* Patient Management */}
          <div className="flex gap-2">
            {!hasPatient && effectiveStatus === BED_STATUSES.UNASSIGNED ? (
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={loading}
                className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                Assign Patient
              </button>
            ) : hasPatient ? (
              <button
                onClick={handleUnassignPatient}
                disabled={loading}
                className="flex-1 bg-red-500 bg-opacity-80 hover:bg-opacity-100 px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                Unassign Patient
              </button>
            ) : (
              <div className="flex-1 bg-gray-500 bg-opacity-50 px-3 py-2 rounded text-sm font-medium text-center cursor-not-allowed">
                Bed Unavailable
              </div>
            )}
          </div>

          {/* Supervisor Override */}
          <button
            onClick={() => setShowOverrideModal(true)}
            disabled={loading}
            className="w-full px-3 py-2 rounded text-sm font-medium disabled:opacity-50 text-gray-800 hover:text-gray-900"
            style={{ 
              backgroundColor: '#f7f2d2',
              ':hover': { backgroundColor: '#ede8c0' }
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#ede8c0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f7f2d2'}
          >
            Supervisor Override
          </button>
        </div>
      </div>

      {/* Patient Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Patient to {bedId.toUpperCase()}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={handlePatientIdChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                    patientIdError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter 6-digit patient ID"
                  maxLength="6"
                />
                {patientIdError && (
                  <p className="mt-1 text-sm text-red-600">{patientIdError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Must be exactly 6 digits</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter patient name"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPatient}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Assign Patient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Supervisor Override - {bedId.toUpperCase()}</h3>
            
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Current Status:</strong> {getStatusLabel(effectiveStatus)}
                <br />
                This override will be logged for audit purposes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={handleEmployeeIdChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                    employeeIdError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter 6-digit employee ID"
                  maxLength="6"
                />
                {employeeIdError && (
                  <p className="mt-1 text-sm text-red-600">{employeeIdError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Must be exactly 6 digits</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthError(''); // Clear auth error when user types
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select
                  value={selectedOverrideStatus}
                  onChange={(e) => setSelectedOverrideStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select new status</option>
                  {Object.values(BED_STATUSES).map(status => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Override (Optional)</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Explain why this override is necessary (optional)..."
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSupervisorOverride}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Applying...' : 'Apply Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BedCard;
