// Comprehensive cleanup script to remove all override data for bed2 and bed3
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update, remove, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB9_UqNfJekvzTaqv_LgGraFdyP0LmWuGo",
  databaseURL: "https://curalink-6a722-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "curalink-6a722"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function comprehensiveCleanup() {
  console.log('🧹 Starting comprehensive override cleanup for bed2 and bed3...');
  
  try {
    // First, let's see what data currently exists
    console.log('📊 Checking current bed data...');
    const bed2Ref = ref(database, 'beds/bed2');
    const bed3Ref = ref(database, 'beds/bed3');
    
    const [bed2Snapshot, bed3Snapshot] = await Promise.all([
      get(bed2Ref),
      get(bed3Ref)
    ]);
    
    console.log('Current bed2 data:', JSON.stringify(bed2Snapshot.val(), null, 2));
    console.log('Current bed3 data:', JSON.stringify(bed3Snapshot.val(), null, 2));
    
    // Comprehensive cleanup - remove ALL possible override-related properties
    const updates = {};
    
    // For bed2
    updates['beds/bed2/override'] = null;
    updates['beds/bed2/supervisorOverride'] = null;
    updates['beds/bed2/originalStatus'] = null;
    
    // For bed3  
    updates['beds/bed3/override'] = null;
    updates['beds/bed3/supervisorOverride'] = null;
    updates['beds/bed3/originalStatus'] = null;
    
    // Also reset to clean states
    updates['beds/bed2/status'] = 'unoccupied_cleaning';
    updates['beds/bed3/status'] = 'unassigned';
    
    console.log('🔧 Applying comprehensive cleanup updates...');
    await update(ref(database), updates);
    
    console.log('✅ Comprehensive cleanup completed successfully!');
    console.log('Updated fields:', Object.keys(updates));
    
    // Verify cleanup
    console.log('🔍 Verifying cleanup...');
    const [bed2After, bed3After] = await Promise.all([
      get(bed2Ref),
      get(bed3Ref)
    ]);
    
    console.log('Bed2 after cleanup:', JSON.stringify(bed2After.val(), null, 2));
    console.log('Bed3 after cleanup:', JSON.stringify(bed3After.val(), null, 2));
    
  } catch (error) {
    console.error('❌ Comprehensive cleanup failed:', error);
    throw error;
  }
}

comprehensiveCleanup().then(() => {
  console.log('🎉 All cleanup operations completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Cleanup failed:', error);
  process.exit(1);
});