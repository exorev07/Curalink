import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database, isDemoMode } from '../firebase/config';
import { seedDummyData, addHistoryEntry } from '../firebase/seedData';
import BedCard from './BedCard';
import HistoryTable from './HistoryTable';

const Dashboard = () => {
  const [beds, setBeds] = useState({});
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showSeedButton, setShowSeedButton] = useState(false);

  // Demo data for when Firebase is not configured
  const demoData = {
    beds: {
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
    },
    history: [
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
    ]
  };

  useEffect(() => {
    if (isDemoMode || !database) {
      // Use demo data when Firebase is not configured
      setBeds(demoData.beds);
      setHistory(demoData.history);
      setLoading(false);
      return;
    }

    // Listen for beds data
    const bedsRef = ref(database, 'beds');
    const unsubscribeBeds = onValue(bedsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBeds(data);
        setShowSeedButton(false);
      } else {
        setBeds({});
        setShowSeedButton(true);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase beds error:', error);
      // Fallback to demo data on error
      setBeds(demoData.beds);
      setHistory(demoData.history);
      setLoading(false);
    });

    // Listen for history data
    const historyRef = ref(database, 'history');
    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray = Object.values(data);
        setHistory(historyArray);
      } else {
        setHistory([]);
      }
    }, (error) => {
      console.error('Firebase history error:', error);
      setHistory(demoData.history);
    });

    return () => {
      unsubscribeBeds();
      unsubscribeHistory();
    };
  }, []);

  const handleStatusChange = async (bedId, newStatus) => {
    if (isDemoMode || !database) {
      // Update local state in demo mode
      const updatedBed = {
        ...beds[bedId],
        status: newStatus,
        lastUpdate: new Date().toISOString()
      };
      
      setBeds(prev => ({
        ...prev,
        [bedId]: updatedBed
      }));
      
      // Add to local history
      const newHistoryEntry = {
        bedId,
        status: newStatus,
        assignedNurse: updatedBed.assignedNurse,
        cleaningStaff: updatedBed.cleaningStaff,
        timestamp: new Date().toISOString()
      };
      
      setHistory(prev => [newHistoryEntry, ...prev]);
      return;
    }

    try {
      const bedRef = ref(database, `beds/${bedId}`);
      const updatedBed = {
        ...beds[bedId],
        status: newStatus,
        lastUpdate: new Date().toISOString()
      };
      
      await set(bedRef, updatedBed);
      
      // Add to history
      await addHistoryEntry(
        bedId, 
        newStatus, 
        updatedBed.assignedNurse, 
        updatedBed.cleaningStaff
      );
    } catch (error) {
      console.error('Error updating bed status:', error);
    }
  };

  const handleSeedData = async () => {
    if (isDemoMode || !database) {
      // In demo mode, just use the demo data
      setBeds(demoData.beds);
      setHistory(demoData.history);
      setShowSeedButton(false);
      return;
    }

    try {
      await seedDummyData();
      setShowSeedButton(false);
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  };

  const getFilteredBeds = () => {
    if (filter === 'all') return beds;
    
    return Object.fromEntries(
      Object.entries(beds).filter(([_, bedData]) => {
        switch (filter) {
          case 'occupied':
            return bedData.status === 'occupied' || bedData.status === 'occupied-cleaning';
          case 'unoccupied':
            return bedData.status === 'unoccupied' || bedData.status === 'unoccupied-cleaning';
          case 'cleaning':
            return bedData.status === 'occupied-cleaning' || bedData.status === 'unoccupied-cleaning';
          default:
            return true;
        }
      })
    );
  };

  const getStatusCounts = () => {
    const counts = {
      total: Object.keys(beds).length,
      occupied: 0,
      unoccupied: 0,
      cleaning: 0
    };

    Object.values(beds).forEach(bed => {
      if (bed.status === 'occupied' || bed.status === 'occupied-cleaning') {
        counts.occupied++;
      }
      if (bed.status === 'unoccupied' || bed.status === 'unoccupied-cleaning') {
        counts.unoccupied++;
      }
      if (bed.status === 'occupied-cleaning' || bed.status === 'unoccupied-cleaning') {
        counts.cleaning++;
      }
    });

    return counts;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredBeds = getFilteredBeds();
  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isDemoMode && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">ℹ</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Demo Mode Active</h3>
                <p className="text-sm text-blue-700">
                  Firebase not configured. Using sample data. Changes won't persist after refresh.
                </p>
              </div>
            </div>
          </div>
        )}

        {showSeedButton && !isDemoMode && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-yellow-800">No Data Found</h3>
                <p className="text-yellow-700">Would you like to seed the database with sample data?</p>
              </div>
              <button
                onClick={handleSeedData}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Seed Sample Data
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
            <div className="text-gray-600">Total Beds</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{statusCounts.occupied}</div>
            <div className="text-gray-600">Occupied</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{statusCounts.unoccupied}</div>
            <div className="text-gray-600">Available</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{statusCounts.cleaning}</div>
            <div className="text-gray-600">Cleaning</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="filter" className="text-sm font-medium text-gray-700">
              Filter by status:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Beds</option>
              <option value="occupied">Occupied</option>
              <option value="unoccupied">Available</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
        </div>

        {/* Beds Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bed Status Overview</h2>
          {Object.keys(filteredBeds).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No beds match the current filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.entries(filteredBeds).map(([bedId, bedData]) => (
                <BedCard
                  key={bedId}
                  bedId={bedId}
                  bedData={bedData}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* History Table */}
        <div>
          <HistoryTable historyData={history} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
