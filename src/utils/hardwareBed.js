import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';

export const HARDWARE_BED_ID = 1;

// Constants from hardware
const FSR_THRESHOLD = 50;
const TEMP_THRESHOLD = 32;

import { logBedAction } from '../firebase/bedManager';

let lastKnownStatus = null;
let isLoggingStatus = false;
let lastLogTime = 0;
const LOG_DEBOUNCE_TIME = 3000; // 3 second debounce to prevent rapid duplicate logs
let lastLoggedTransition = null; // Track the exact transition to prevent duplicates

export const subscribeToHardwareBed = (onUpdate) => {
  if (!database) return () => {};

  const bedRef = ref(database, `beds/bed${HARDWARE_BED_ID}`);
  let connectionTimeout;
  
  const handleBedUpdate = async (snapshot) => {
    const data = snapshot.val();
    
    console.log('🔧 Hardware bed Firebase data received:', data);
    
    // Clear any existing timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
    
    if (!data) {
      console.log('❌ No Firebase data for hardware bed');
      // No data means hardware is not connected
      onUpdate(HARDWARE_BED_ID, {
        status: 'unoccupied',
        sensorData: {
          fsrValue: 0,
          temperature: 0,
          hasBodyTemp: false,
          hasWeight: false,
          isOccupied: false,
          online: false,
          lastUpdate: Date.now()
        }
      });
      return;
    }

    // Calculate data age for debugging
    const dataAge = Date.now() - (data.lastUpdate || 0);
    const isDataFresh = dataAge < 10000; // 10 seconds
    
    // If we're receiving Firebase data right now and online=true, hardware is connected
    // The fact that Firebase listener triggered means we got recent data
    const isHardwareOnline = data.online === true;
    
    console.log('🔍 Hardware connection check:', {
      hasData: !!data,
      dataAge: Math.round(dataAge / 1000) + ' seconds',
      isDataFresh,
      rawOnline: data.online,
      isHardwareOnline
    });

    // Convert hardware data to dashboard format
    const bedStatus = getBedStatusFromHardware(data);
    
    // Log if status has changed and prevent duplicate logging
    const now = Date.now();
    const isComingBackOnline = lastKnownStatus === 'hardware offline' && isHardwareOnline;
    const currentTransition = `${lastKnownStatus || 'unknown'}->${bedStatus}`;
    
    // Enhanced duplicate prevention: check status change, logging state, debounce time, and exact transition
    const shouldLog = (
      (lastKnownStatus !== bedStatus || isComingBackOnline) && 
      !isLoggingStatus && 
      (now - lastLogTime) >= LOG_DEBOUNCE_TIME &&
      lastLoggedTransition !== currentTransition // Prevent exact same transition
    );
    
    if (shouldLog) {
      try {
        isLoggingStatus = true;
        
        let logDetails;
        if (isComingBackOnline) {
          logDetails = `hardware reconnected - ${bedStatus}`;
        } else {
          logDetails = `${lastKnownStatus || 'unknown'} to ${bedStatus}`;
        }
        
        console.log('📝 Logging bed status change:', currentTransition);
        
        await logBedAction(`bed${HARDWARE_BED_ID}`, 'status_change', {
          previousStatus: lastKnownStatus || 'unknown',
          newStatus: bedStatus,
          staffId: data.lastStaffId || null,
          source: isHardwareOnline ? 'hardware' : 'hardware_stale',
          details: logDetails
        });
        
        // Update tracking variables
        lastKnownStatus = bedStatus;
        lastLogTime = now;
        lastLoggedTransition = currentTransition;
        
      } catch (error) {
        console.error('Error logging bed action:', error);
      } finally {
        isLoggingStatus = false;
      }
    } else if (lastKnownStatus !== bedStatus) {
      // Status changed but we're not logging due to debounce/duplicate prevention
      console.log('⏭️ Skipping duplicate log for transition:', currentTransition, {
        timeSinceLastLog: now - lastLogTime,
        isLogging: isLoggingStatus,
        isDuplicateTransition: lastLoggedTransition === currentTransition
      });
      // Still update the status for next comparison
      lastKnownStatus = bedStatus;
    }

    const sensorData = {
      fsrValue: data.fsrValue || 0,
      temperature: data.temperature || 0,
      hasBodyTemp: data.hasBodyTemp || false,
      hasWeight: data.hasWeight || false,
      isOccupied: data.isOccupied || false,
      online: isHardwareOnline,
      lastUpdate: Date.now() // Always use current time since we just received this data
    };

    console.log('✅ Updating bed with sensor data:', { bedStatus, online: isHardwareOnline });

    onUpdate(HARDWARE_BED_ID, {
      status: bedStatus,
      sensorData
    });
    
    // Set a timeout to mark as offline if no updates received (fast response)
    connectionTimeout = setTimeout(async () => {
      console.log('⏰ Hardware timeout - marking as offline after 12 seconds');
      
      // Log the hardware going offline with enhanced duplicate prevention
      const offlineTransition = `${lastKnownStatus}->${'hardware offline'}`;
      const now = Date.now();
      
      if (lastKnownStatus && 
          lastKnownStatus !== 'hardware offline' &&
          !isLoggingStatus &&
          (now - lastLogTime) >= LOG_DEBOUNCE_TIME &&
          lastLoggedTransition !== offlineTransition) {
        try {
          isLoggingStatus = true;
          await logBedAction(`bed${HARDWARE_BED_ID}`, 'status_change', {
            previousStatus: lastKnownStatus,
            newStatus: 'hardware offline',
            staffId: null,
            source: 'hardware_timeout',
            details: `${lastKnownStatus} to hardware offline`
          });
          lastKnownStatus = 'hardware offline';
          lastLogTime = now;
          lastLoggedTransition = offlineTransition;
        } catch (error) {
          console.error('Error logging offline status:', error);
        } finally {
          isLoggingStatus = false;
        }
      }
      
      onUpdate(HARDWARE_BED_ID, {
        status: 'unoccupied',
        sensorData: {
          fsrValue: 0,
          temperature: 0,
          hasBodyTemp: false,
          hasWeight: false,
          isOccupied: false,
          online: false,
          lastUpdate: Date.now()
        }
      });
    }, 12000); // 12 seconds timeout
  };

  onValue(bedRef, handleBedUpdate);
  
  // Return unsubscribe function
  return () => off(bedRef);
};

const getBedStatusFromHardware = (data) => {
  // First check if status is explicitly set from hardware
  if (data.status) {
    // Convert directly from Firebase format (with +) to our format (with _)
    if (data.status === 'unassigned') return 'unassigned';
    if (data.status === 'unoccupied+cleaning') return 'unoccupied_cleaning';
    if (data.status === 'occupied+cleaning') return 'occupied_cleaning';
    if (data.status === 'unoccupied') return 'unoccupied';
    if (data.status === 'occupied') return 'occupied';
    if (data.status === 'discharge') return data.isOccupied ? 'occupied' : 'unoccupied';
  }

  // If no specific status or unrecognized, determine from occupancy
  return data.isOccupied ? 'occupied' : 'unoccupied';
};
