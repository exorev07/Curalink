// Script to create a test supervisor override for demonstration
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB9_UqNfJekvzTaqv_LgGraFdyP0LmWuGo",
  databaseURL: "https://curalink-6a722-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "curalink-6a722"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function createTestOverride() {
  console.log('🧪 Creating test supervisor override for bed3...');
  
  try {
    const updates = {};
    
    // Create override for bed3 for testing
    updates['beds/bed3/override'] = {
      active: true,
      status: 'occupied_cleaning',
      employeeId: '220306',
      previousStatus: 'unassigned',
      reason: 'Test override for demonstration',
      timestamp: new Date().toISOString()
    };
    updates['beds/bed3/status'] = 'occupied_cleaning';
    
    await update(ref(database), updates);
    
    console.log('✅ Test override created successfully for bed3!');
    console.log('- Status changed to: occupied_cleaning');
    console.log('- Previous status: unassigned');
    console.log('- Employee: 220306');
    console.log('- Reason: Test override for demonstration');
    
  } catch (error) {
    console.error('❌ Failed to create test override:', error);
    throw error;
  }
}

createTestOverride().then(() => {
  console.log('🎉 Test override setup completed!');
  console.log('You can now test the "Clear Override" functionality on bed3');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test setup failed:', error);
  process.exit(1);
});