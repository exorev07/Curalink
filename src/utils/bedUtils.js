// Utility functions for bed status management

export const BED_STATUSES = {
  UNASSIGNED: 'unassigned',
  UNOCCUPIED: 'unoccupied',
  OCCUPIED: 'occupied',
  OCCUPIED_CLEANING: 'occupied_cleaning',
  UNOCCUPIED_CLEANING: 'unoccupied_cleaning'
};

export const WARD_TYPES = {
  ICU: 'ICU',
  MATERNITY: 'Maternity',
  GENERAL: 'General'
};

export const WARD_COLORS = {
  [WARD_TYPES.ICU]: 'bg-red-50 border-red-200',
  [WARD_TYPES.MATERNITY]: 'bg-yellow-50 border-yellow-200',
  [WARD_TYPES.GENERAL]: 'bg-blue-50 border-blue-200'
};

export const STATUS_COLORS = {
  [BED_STATUSES.UNOCCUPIED]: 'bg-[#2E8B57]',
  [BED_STATUSES.OCCUPIED]: 'bg-red-600',
  [BED_STATUSES.OCCUPIED_CLEANING]: 'bg-orange-500',
  [BED_STATUSES.UNOCCUPIED_CLEANING]: 'bg-yellow-500',
  [BED_STATUSES.UNASSIGNED]: 'bg-gray-500'
};

export const STATUS_LABELS = {
  [BED_STATUSES.UNOCCUPIED]: 'Unoccupied',
  [BED_STATUSES.OCCUPIED]: 'Occupied',
  [BED_STATUSES.OCCUPIED_CLEANING]: 'Occupied+Cleaning',
  [BED_STATUSES.UNOCCUPIED_CLEANING]: 'Unoccupied+Cleaning',
  [BED_STATUSES.UNASSIGNED]: 'Unassigned'
};

export const STATUS_BADGE_COLORS = {
  [BED_STATUSES.UNOCCUPIED]: 'bg-green-100 text-green-800',
  [BED_STATUSES.OCCUPIED]: 'bg-red-100 text-red-800',
  [BED_STATUSES.OCCUPIED_CLEANING]: 'bg-orange-100 text-orange-800',
  [BED_STATUSES.UNOCCUPIED_CLEANING]: 'bg-yellow-100 text-yellow-800',
  [BED_STATUSES.UNASSIGNED]: 'bg-gray-100 text-gray-800'
};

/**
 * Get the color class for a bed status
 * @param {string} status - The bed status
 * @returns {string} The Tailwind color class
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || 'bg-gray-500';
};

/**
 * Get the display label for a bed status
 * @param {string} status - The bed status
 * @returns {string} The human-readable status label
 */
export const getStatusLabel = (status) => {
  switch (status) {
    case BED_STATUSES.UNASSIGNED:
      return 'Unassigned';
    case BED_STATUSES.UNOCCUPIED:
      return 'Unoccupied';
    case BED_STATUSES.OCCUPIED:
      return 'Occupied';
    case BED_STATUSES.OCCUPIED_CLEANING:
      return 'Occupied (Cleaning)';
    case BED_STATUSES.UNOCCUPIED_CLEANING:
      return 'Unoccupied (Cleaning)';
    default:
      return 'Unknown';
  }
};

/**
 * Get the badge color class for a bed status
 * @param {string} status - The bed status
 * @returns {string} The Tailwind badge color classes
 */
export const getStatusBadgeColor = (status) => {
  return STATUS_BADGE_COLORS[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Format a timestamp for display
 * @param {string|number} timestamp - Timestamp (ISO string, Unix timestamp, or Date object)
 * @returns {string} Formatted date and time
 */
export const formatTimestamp = (timestamp) => {
  try {
    // If no timestamp, throw error to use current time
    if (!timestamp) {
      throw new Error('No timestamp provided');
    }

    let date;
    // Handle ISO string format (e.g., "2024-01-21T13:39:20.000Z")
    if (typeof timestamp === 'string') {
      if (timestamp.includes('T')) {
        date = new Date(timestamp);
      } else {
        // Try to parse non-ISO string formats
        date = new Date(Date.parse(timestamp));
      }
    }
    // Handle Unix timestamp (in milliseconds)
    else if (typeof timestamp === 'number') {
      // Check if it's seconds instead of milliseconds
      if (timestamp < 2000000000) { // If less than year 2033
        date = new Date(timestamp * 1000);
      } else {
        date = new Date(timestamp);
      }
    }
    // Handle Date object
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    // Try to handle any other format as a last resort
    else {
      date = new Date(timestamp);
    }

    // Validate the date
    if (!date || isNaN(date.getTime()) || date.getFullYear() < 2020) {
      throw new Error('Invalid date value or too old');
    }

    // Format the valid date
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    const now = new Date();
    return now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
};

/**
 * Check if a bed is occupied (regardless of cleaning status)
 * @param {string} status - The bed status
 * @returns {boolean} True if bed is occupied
 */
export const isBedOccupied = (status) => {
  return status === BED_STATUSES.OCCUPIED || status === BED_STATUSES.OCCUPIED_CLEANING;
};

/**
 * Check if a bed needs cleaning
 * @param {string} status - The bed status
 * @returns {boolean} True if bed needs cleaning
 */
export const isBedCleaning = (status) => {
  return status === BED_STATUSES.OCCUPIED_CLEANING || status === BED_STATUSES.UNOCCUPIED_CLEANING;
};

/**
 * Filter beds by status category
 * @param {Object} beds - Object containing all beds
 * @param {string} filter - Filter type ('all', 'occupied', 'unoccupied', 'cleaning')
 * @returns {Object} Filtered beds object
 */
export const filterBeds = (beds, filter) => {
  if (filter === 'all') return beds;
  
  return Object.fromEntries(
    Object.entries(beds).filter(([_, bedData]) => {
      switch (filter) {
        case 'occupied':
          return isBedOccupied(bedData.status);
        case 'unoccupied':
          return !isBedOccupied(bedData.status);
        case 'cleaning':
          return isBedCleaning(bedData.status);
        default:
          return true;
      }
    })
  );
};

/**
 * Get the effective status of a bed (considering overrides)
 * @param {Object} bedData - The bed data object
 * @returns {string} The effective status
 */
export const getEffectiveBedStatus = (bedData) => {
  // If there's an active override, use that status
  if (bedData.override && bedData.override.active) {
    return bedData.override.status;
  }
  
  // If status is explicitly unassigned, return unassigned
  if (bedData.status === 'unassigned') {
    return BED_STATUSES.UNASSIGNED;
  }
  
  // Otherwise use the hardware-reported status or default to unassigned
  return bedData.status || BED_STATUSES.UNASSIGNED;
};

/**
 * Check if a bed has an active patient assignment
 * @param {Object} bedData - The bed data object
 * @returns {boolean} True if bed has active patient assignment
 */
export const hasActivePatientAssignment = (bedData) => {
  return bedData.assignment && bedData.assignment.status === 'active';
};
