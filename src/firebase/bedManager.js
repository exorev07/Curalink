// Firebase utilities for bed management and supervisor overrides
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { database, isDemoMode } from './config';

// Patient assignment functions
export const assignPatientToBed = async (bedId, patientData, updateLocalHistory = null, updateBedsData = null) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
  
  if (isDemoMode || !database) {
    console.log('Demo mode: Would assign patient to bed', bedId, patientData);
    
    // In demo mode, update the local bed data if callback provided
    if (updateBedsData) {
      updateBedsData(prevBeds => ({
        ...prevBeds,
        [bedId]: {
          ...prevBeds[bedId],
          assignment: {
            patientId: patientData.patientId,
            patientName: patientData.patientName,
            assignedBy: patientData.assignedBy,
            assignedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            status: 'active'
          }
        }
      }));
    }
    
    // In demo mode, call the logging function with local history callback
    await logBedAction(bedId, 'patient_assigned', {
      patientId: patientData.patientId,
      patientName: patientData.patientName,
      assignedBy: patientData.assignedBy,
      expiresAt: expiresAt.toISOString()
    }, updateLocalHistory);
    return;
  }

  try {
    const bedRef = ref(database, `beds/${bedId}/assignment`);
    await set(bedRef, {
      patientId: patientData.patientId,
      patientName: patientData.patientName,
      assignedBy: patientData.assignedBy,
      assignedAt: serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
      status: 'active'
    });

    // Log the assignment
    await logBedAction(bedId, 'patient_assigned', {
      patientId: patientData.patientId,
      patientName: patientData.patientName,
      assignedBy: patientData.assignedBy
    });
  } catch (error) {
    console.error('Error assigning patient:', error);
    throw error;
  }
};

export const unassignPatientFromBed = async (bedId, unassignedBy, reason = 'manual', updateLocalHistory = null, updateBedsData = null, beds = null) => {
  // Get patient info before unassigning (for logging purposes)
  let patientInfo = null;
  if (beds && beds[bedId] && hasActivePatientAssignment(beds[bedId])) {
    patientInfo = {
      patientId: beds[bedId].assignment.patientId,
      patientName: beds[bedId].assignment.patientName
    };
  }

  if (isDemoMode || !database) {
    console.log('Demo mode: Would unassign patient from bed', bedId);
    
    // In demo mode, update the local bed data if callback provided
    if (updateBedsData) {
      updateBedsData(prevBeds => ({
        ...prevBeds,
        [bedId]: {
          ...prevBeds[bedId],
          assignment: {
            status: 'unassigned',
            unassignedBy,
            unassignedAt: new Date().toISOString(),
            reason
          }
        }
      }));
    }
    
    // In demo mode, call the logging function with local history callback
    await logBedAction(bedId, 'patient_unassigned', {
      unassignedBy,
      reason,
      patientInfo
    }, updateLocalHistory);
    return;
  }

  try {
    const bedRef = ref(database, `beds/${bedId}/assignment`);
    await set(bedRef, {
      status: 'unassigned',
      unassignedBy,
      unassignedAt: serverTimestamp(),
      reason
    });

    // Log the unassignment
    await logBedAction(bedId, 'patient_unassigned', {
      unassignedBy,
      reason,
      patientInfo
    });
  } catch (error) {
    console.error('Error unassigning patient:', error);
    throw error;
  }
};

// Supervisor override functions
export const supervisorOverrideBedStatus = async (bedId, newStatus, supervisorData, updateLocalHistory = null, updateBedsData = null) => {
  if (isDemoMode || !database) {
    console.log('Demo mode: Would override bed status', bedId, newStatus, supervisorData);
    
    // In demo mode, update the local bed data if callback provided
    if (updateBedsData) {
      updateBedsData(prevBeds => ({
        ...prevBeds,
        [bedId]: {
          ...prevBeds[bedId],
          override: {
            status: newStatus,
            employeeId: supervisorData.employeeId,
            previousStatus: supervisorData.previousStatus,
            reason: supervisorData.reason,
            timestamp: new Date().toISOString(),
            active: true
          }
        }
      }));
    }
    
    // In demo mode, call the logging function with local history callback
    await logBedAction(bedId, 'supervisor_override', {
      newStatus,
      previousStatus: supervisorData.previousStatus,
      employeeId: supervisorData.employeeId,
      reason: supervisorData.reason
    }, updateLocalHistory);
    return;
  }

  try {
    // Set the override status
    const overrideRef = ref(database, `beds/${bedId}/override`);
    await set(overrideRef, {
      status: newStatus,
      employeeId: supervisorData.employeeId,
      previousStatus: supervisorData.previousStatus,
      reason: supervisorData.reason,
      timestamp: serverTimestamp(),
      active: true
    });

    // Log the override in the overrides collection
    const overrideLogRef = ref(database, 'bedOverrides');
    await push(overrideLogRef, {
      bedId,
      newStatus,
      previousStatus: supervisorData.previousStatus,
      employeeId: supervisorData.employeeId,
      reason: supervisorData.reason,
      timestamp: serverTimestamp()
    });

    // Log the action
    await logBedAction(bedId, 'supervisor_override', {
      newStatus,
      previousStatus: supervisorData.previousStatus,
      employeeId: supervisorData.employeeId,
      reason: supervisorData.reason
    });
  } catch (error) {
    console.error('Error applying supervisor override:', error);
    throw error;
  }
};

export const clearSupervisorOverride = async (bedId, supervisorId) => {
  if (isDemoMode || !database) {
    console.log('Demo mode: Would clear supervisor override for bed', bedId);
    return;
  }

  try {
    const overrideRef = ref(database, `beds/${bedId}/override`);
    await set(overrideRef, {
      active: false,
      clearedBy: supervisorId,
      clearedAt: serverTimestamp()
    });

    await logBedAction(bedId, 'override_cleared', {
      clearedBy: supervisorId
    });
  } catch (error) {
    console.error('Error clearing supervisor override:', error);
    throw error;
  }
};

// Helper function to log bed actions
export const logBedAction = async (bedId, action, data, updateLocalHistory = null) => {
  if (isDemoMode || !database) {
    console.log('Demo mode: Would log action', bedId, action, data);
    
    // In demo mode, update local history if callback provided
    if (updateLocalHistory) {
      const historyEntry = {
        bedId,
        action,
        data,
        timestamp: new Date().toISOString()
      };
      updateLocalHistory(historyEntry);
    }
    return;
  }

  try {
    const historyRef = ref(database, 'bedHistory');
    await push(historyRef, {
      bedId,
      action,
      data,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging bed action:', error);
  }
};

// Get effective bed status (considering overrides)
export const getEffectiveBedStatus = (bedData) => {
  // If there's an active override, use that status
  if (bedData.override && bedData.override.active) {
    return bedData.override.status;
  }
  
  // First check for unassigned status
  if (bedData.assignment && bedData.assignment.status === 'unassigned') {
    return 'unassigned';
  }

  // Then map hardware-reported status to correct format
  if (bedData.status) {
    if (bedData.status === 'unoccupied+cleaning') return 'unoccupied_cleaning';
    if (bedData.status === 'occupied+cleaning') return 'occupied_cleaning';
    if (bedData.status === 'unoccupied') return 'unoccupied';
    if (bedData.status === 'occupied') return 'occupied';
    if (bedData.status === 'unassigned') return 'unassigned';
  }
  
  // Fallback to unassigned if no valid status
  return 'unassigned';
};

// Check if bed has active patient assignment
export const hasActivePatientAssignment = (bedData) => {
  return bedData.assignment && bedData.assignment.status === 'active';
};

// Check if patient assignment has expired
export const isPatientAssignmentExpired = (bedData) => {
  if (!hasActivePatientAssignment(bedData) || !bedData.assignment.expiresAt) {
    return false;
  }
  
  const now = new Date();
  const expiresAt = new Date(bedData.assignment.expiresAt);
  return now > expiresAt;
};

// Get remaining time for patient assignment in minutes
export const getRemainingAssignmentTime = (bedData) => {
  if (!hasActivePatientAssignment(bedData) || !bedData.assignment.expiresAt) {
    return 0;
  }
  
  const now = new Date();
  const expiresAt = new Date(bedData.assignment.expiresAt);
  const remainingMs = expiresAt.getTime() - now.getTime();
  
  return Math.max(0, Math.ceil(remainingMs / (1000 * 60))); // Return minutes
};

// Auto-unassign expired patient assignments
export const checkAndUnassignExpiredPatients = async (beds, updateLocalHistory = null, updateBedsData = null) => {
  if (!beds) return;
  
  const currentTime = new Date();
  
  for (const [bedId, bedData] of Object.entries(beds)) {
    // Only check beds that have patient assignments but are still unoccupied
    if (hasActivePatientAssignment(bedData) && 
        bedData.assignment.expiresAt && 
        getEffectiveBedStatus(bedData) === 'unoccupied') {
      
      const expiresAt = new Date(bedData.assignment.expiresAt);
      
      if (currentTime > expiresAt) {
        console.log(`Patient assignment expired for bed ${bedId}, auto-unassigning...`);
        
        try {
          await unassignPatientFromBed(bedId, 'system', 'assignment_expired', updateLocalHistory, updateBedsData, beds);
          
          // Log the expiration (this is now handled inside unassignPatientFromBed)
        } catch (error) {
          console.error(`Error auto-unassigning expired patient from bed ${bedId}:`, error);
        }
      }
    }
  }
};
