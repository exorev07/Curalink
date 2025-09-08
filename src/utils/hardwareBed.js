import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';

export const HARDWARE_BED_ID = 1;

// Constants from hardware
const FSR_THRESHOLD = 50;
const TEMP_THRESHOLD = 32;

export const subscribeToHardwareBed = (onUpdate) => {
  if (!database) return () => {};

  const bedRef = ref(database, `beds/bed${HARDWARE_BED_ID}`);
  
  const handleBedUpdate = (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Convert hardware data to dashboard format
    const bedStatus = getBedStatusFromHardware(data);
    const sensorData = {
      fsrValue: data.fsrValue || 0,
      temperature: data.temperature || 0,
      hasBodyTemp: data.hasBodyTemp || false,
      hasWeight: data.hasWeight || false,
      isOccupied: data.isOccupied || false,
      online: data.online || false,
      lastUpdate: data.lastUpdate || Date.now()
    };

    onUpdate(HARDWARE_BED_ID, {
      status: bedStatus,
      sensorData
    });
  };

  onValue(bedRef, handleBedUpdate);
  
  // Return unsubscribe function
  return () => off(bedRef);
};

const getBedStatusFromHardware = (data) => {
  // First check if status is explicitly set from hardware
  if (data.status) {
    // Convert directly from Firebase format (with +) to our format (with _)
    if (data.status === 'unoccupied+cleaning') return 'unoccupied_cleaning';
    if (data.status === 'occupied+cleaning') return 'occupied_cleaning';
    if (data.status === 'unoccupied') return 'unoccupied';
    if (data.status === 'occupied') return 'occupied';
    if (data.status === 'discharge') return data.isOccupied ? 'occupied' : 'unoccupied';
  }

  // If no specific status or unrecognized, determine from occupancy
  return data.isOccupied ? 'occupied' : 'unoccupied';
};
