
// Script to clear supervisor overrides for bed2 and bed3
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update, get } from 'firebase/database';

// Firebase configuration (matching your project)
const firebaseConfig = {
  apiKey: "AIzaSyB9_UqNfJekvzTaqv_LgGraFdyP0LmWuGo",
  databaseURL: "https://curalink-6a722-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "curalink-6a722"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function clearBedOverrides() {
  console.log('Starting to clear overrides for bed2 and bed3...');
  
  try {
    // Get current bed data to find original statuses
    const bed2Ref = ref(database, 'beds/bed2');
    const bed3Ref = ref(database, 'beds/bed3');
    
    const [bed2Snapshot, bed3Snapshot] = await Promise.all([
      get(bed2Ref),
      get(bed3Ref)
    ]);
    
    const bed2Data = bed2Snapshot.val();
    const bed3Data = bed3Snapshot.val();
    
    const updates = {};
    
    // Clear bed2 override and restore original status
    if (bed2Data && bed2Data.override) {
      updates['beds/bed2/override'] = null;
      if (bed2Data.override.previousStatus) {
        updates['beds/bed2/status'] = bed2Data.override.previousStatus;
        console.log(`Restoring bed2 to status: ${bed2Data.override.previousStatus}`);
      } else {
        updates['beds/bed2/status'] = 'available'; // Default fallback
        console.log('Restoring bed2 to default status: available');
      }
    }
    
    // Clear bed3 override and restore original status
    if (bed3Data && bed3Data.override) {
      updates['beds/bed3/override'] = null;
      if (bed3Data.override.previousStatus) {
        updates['beds/bed3/status'] = bed3Data.override.previousStatus;
        console.log(`Restoring bed3 to status: ${bed3Data.override.previousStatus}`);
      } else {
        updates['beds/bed3/status'] = 'available'; // Default fallback
        console.log('Restoring bed3 to default status: available');
      }
    }
    
    // Apply all updates atomically
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
      console.log('✅ Successfully cleared overrides for bed2 and bed3');
      console.log('Updated fields:', Object.keys(updates));
    } else {
      console.log('No overrides found for bed2 and bed3');
    }
    
  } catch (error) {
    console.error('❌ Error clearing overrides:', error);
  }
}

// Run the function with additional cleanup
async function forceCleanup() {
  await clearBedOverrides();
  
  console.log('Performing additional cleanup...');
  
  // Force remove any residual override data completely
  const forceUpdates = {};
  forceUpdates['beds/bed2/override'] = null;
  forceUpdates['beds/bed3/override'] = null;
  forceUpdates['beds/bed2/supervisorOverride'] = null; // Legacy field cleanup
  forceUpdates['beds/bed3/supervisorOverride'] = null; // Legacy field cleanup
  
  try {
    await update(ref(database), forceUpdates);
    console.log('✅ Force cleanup completed');
  } catch (error) {
    console.error('❌ Force cleanup failed:', error);
  }
}

forceCleanup().then(() => {
  console.log('All cleanup completed');
  process.exit(0);
}).catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
