// Utility functions for bed status management

export const BED_STATUSES = {
  UNOCCUPIED: 'unoccupied',
  OCCUPIED: 'occupied',
  OCCUPIED_CLEANING: 'occupied-cleaning',
  UNOCCUPIED_CLEANING: 'unoccupied-cleaning'
};

export const STATUS_COLORS = {
  [BED_STATUSES.UNOCCUPIED]: 'bg-bed-unoccupied',
  [BED_STATUSES.OCCUPIED]: 'bg-bed-occupied',
  [BED_STATUSES.OCCUPIED_CLEANING]: 'bg-bed-occupied-cleaning',
  [BED_STATUSES.UNOCCUPIED_CLEANING]: 'bg-bed-unoccupied-cleaning'
};

export const STATUS_LABELS = {
  [BED_STATUSES.UNOCCUPIED]: 'Unoccupied',
  [BED_STATUSES.OCCUPIED]: 'Occupied',
  [BED_STATUSES.OCCUPIED_CLEANING]: 'Occupied + Cleaning',
  [BED_STATUSES.UNOCCUPIED_CLEANING]: 'Unoccupied + Cleaning'
};

export const STATUS_BADGE_COLORS = {
  [BED_STATUSES.UNOCCUPIED]: 'bg-green-100 text-green-800',
  [BED_STATUSES.OCCUPIED]: 'bg-red-100 text-red-800',
  [BED_STATUSES.OCCUPIED_CLEANING]: 'bg-orange-100 text-orange-800',
  [BED_STATUSES.UNOCCUPIED_CLEANING]: 'bg-yellow-100 text-yellow-800'
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
  return STATUS_LABELS[status] || 'Unknown';
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
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date and time
 */
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
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
