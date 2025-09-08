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
    // Convert hyphenated status to match BED_STATUSES format
    switch (data.status) {
      case 'unoccupied-cleaning':
        return 'unoccupied_cleaning';  // Match BED_STATUSES.UNOCCUPIED_CLEANING
      case 'occupied-cleaning':
        return 'occupied_cleaning';    // Match BED_STATUSES.OCCUPIED_CLEANING
      case 'discharge':
        return data.isOccupied ? 'occupied' : 'unoccupied';
      case 'unoccupied':
      case 'occupied':
        return data.status;
    }
  }

  // If no specific status or unrecognized, determine from occupancy
  return data.isOccupied ? 'occupied' : 'unoccupied';
};
