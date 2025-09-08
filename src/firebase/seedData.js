import { ref, set, push, serverTimestamp } from 'firebase/database';
import { database, isDemoMode } from './config';

// Dummy data for testing
const dummyBeds = {
  bed1: {
    status: 'unoccupied',
    lastUpdate: '2025-09-02T14:00:00',
    assignedNurse: '',
    cleaningStaff: ''
  },
  bed2: {
    status: 'occupied',
    lastUpdate: '2025-09-02T13:30:00',
    assignedNurse: 'NURSE45',
    cleaningStaff: ''
  },
  bed3: {
    status: 'occupied-cleaning',
    lastUpdate: '2025-09-02T12:45:00',
    assignedNurse: 'NURSE23',
    cleaningStaff: 'CLEAN01'
  },
  bed4: {
    status: 'unoccupied-cleaning',
    lastUpdate: '2025-09-02T11:15:00',
    assignedNurse: '',
    cleaningStaff: 'CLEAN02'
  },
  bed5: {
    status: 'occupied',
    lastUpdate: '2025-09-02T10:30:00',
    assignedNurse: 'NURSE67',
    cleaningStaff: ''
  },
  bed6: {
    status: 'unoccupied',
    lastUpdate: '2025-09-02T09:45:00',
    assignedNurse: '',
    cleaningStaff: ''
  }
};

// Function to seed dummy data to Firebase
export const seedDummyData = async () => {
  if (isDemoMode || !database) {
    console.log('Demo mode: Cannot seed data to Firebase');
    return;
  }

  try {
    const bedsRef = ref(database, 'beds');
    await set(bedsRef, dummyBeds);
    
    // Add some history entries
    const historyRef = ref(database, 'bedHistory');
    const historyEntries = [
      {
        bedId: 'bed1',
        status: 'unoccupied',
        assignedNurse: '',
        cleaningStaff: '',
        timestamp: '2025-09-02T14:00:00'
      },
      {
        bedId: 'bed2',
        status: 'occupied',
        assignedNurse: 'NURSE45',
        cleaningStaff: '',
        timestamp: '2025-09-02T13:30:00'
      },
      {
        bedId: 'bed3',
        status: 'occupied-cleaning',
        assignedNurse: 'NURSE23',
        cleaningStaff: 'CLEAN01',
        timestamp: '2025-09-02T12:45:00'
      }
    ];
    
    for (const entry of historyEntries) {
      await push(historyRef, entry);
    }
    
    console.log('Dummy data seeded successfully!');
  } catch (error) {
    console.error('Error seeding dummy data:', error);
  }
};

// Function to add history entry
export const addHistoryEntry = async (bedId, status, assignedNurse = '', cleaningStaff = '') => {
  if (isDemoMode || !database) {
    console.log('Demo mode: Cannot add history entry to Firebase');
    return;
  }

  try {
    const historyRef = ref(database, 'bedHistory');
    await push(historyRef, {
      bedId,
      status,
      assignedNurse,
      cleaningStaff,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding history entry:', error);
  }
};
