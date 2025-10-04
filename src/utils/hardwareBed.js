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
const LOG_DEBOUNCE_TIME = 1000; // 1 second debounce

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
    
    // Log if status has changed and we're not already logging
    const now = Date.now();
    if (lastKnownStatus !== bedStatus && 
        !isLoggingStatus && 
        (now - lastLogTime) >= LOG_DEBOUNCE_TIME) {
      try {
        isLoggingStatus = true;
        await logBedAction(`bed${HARDWARE_BED_ID}`, 'status_change', {
          previousStatus: lastKnownStatus || 'unknown',
          newStatus: bedStatus,
          staffId: data.lastStaffId || null,  // Include staff ID if available
          source: isHardwareOnline ? 'hardware' : 'hardware_stale',
          details: `${lastKnownStatus || 'unknown'} to ${bedStatus}`
        });
        lastKnownStatus = bedStatus;
        lastLogTime = now;
      } finally {
        isLoggingStatus = false;
      }
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
    connectionTimeout = setTimeout(() => {
      console.log('⏰ Hardware timeout - marking as offline after 12 seconds');
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
