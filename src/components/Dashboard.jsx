import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database, isDemoMode } from '../firebase/config';
import { seedDummyData, addHistoryEntry } from '../firebase/seedData';
import BedCard from './BedCard';
import HistoryTable from './HistoryTable';
import PredictionBox from './PredictionBox';
import { getEffectiveBedStatus, checkAndUnassignExpiredPatients } from '../firebase/bedManager';
import { BED_STATUSES, WARD_TYPES, WARD_COLORS } from '../utils/bedUtils';

const filterOptions = [
  { value: 'all', label: 'All Beds' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'available', label: 'Available' },
  { value: 'unoccupied', label: 'Unoccupied' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'group', group: 'By Ward' },
  { value: 'ward-icu', label: 'ICU Ward' },
  { value: 'ward-maternity', label: 'Maternity Ward' },
  { value: 'ward-general', label: 'General Ward' }
];

const Dashboard = ({ onNavigate }) => {
  const [beds, setBeds] = useState({});
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const handleNavigate = (page) => {
    onNavigate(page);
  };
  const [showSeedButton, setShowSeedButton] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // For triggering re-renders
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [wardExpanded, setWardExpanded] = useState(false);
  const [maternityExpanded, setMaternityExpanded] = useState(false);
  const [generalExpanded, setGeneralExpanded] = useState(false);

  // Demo data for when Firebase is not configured
  const demoData = {
    beds: {
      bed1: {
        status: 'unoccupied',
        ward: 'ICU',
        lastUpdate: '2025-09-02T14:00:00',
        assignedNurse: '',
        cleaningStaff: ''
      },
      bed2: {
        status: 'occupied',
        ward: 'ICU',
        lastUpdate: '2025-09-02T13:30:00',
        assignedNurse: 'NURSE45',
        cleaningStaff: ''
      },
      bed3: {
        status: 'occupied-cleaning',
        ward: 'Maternity',
        lastUpdate: '2025-09-02T12:45:00',
        assignedNurse: 'NURSE23',
        cleaningStaff: 'CLEAN01'
      },
      bed4: {
        status: 'unoccupied-cleaning',
        ward: 'Maternity',
        lastUpdate: '2025-09-02T11:15:00',
        assignedNurse: '',
        cleaningStaff: 'CLEAN02'
      },
      bed5: {
        status: 'occupied',
        ward: 'General',
        lastUpdate: '2025-09-02T10:30:00',
        assignedNurse: 'NURSE67',
        cleaningStaff: ''
      },
      bed6: {
        status: 'unoccupied',
        ward: 'General',
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
    const historyRef = ref(database, 'bedHistory');
    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray = Object.values(data).sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
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

  // Timer to check for expired patient assignments every minute
  useEffect(() => {
    const checkExpiredAssignments = async () => {
      if (Object.keys(beds).length > 0) {
        await checkAndUnassignExpiredPatients(beds, updateLocalHistory, setBeds);
      }
    };

    // Check immediately
    checkExpiredAssignments();

    // Set up interval to check every minute
    const interval = setInterval(checkExpiredAssignments, 60000);

    return () => clearInterval(interval);
  }, [beds]); // Re-run when beds data changes

  // Function to trigger data refresh after bed operations
  const handleBedUpdate = () => {
    setRefreshKey(prev => prev + 1);
    
    // In demo mode, we might need to manually refresh data
    if (isDemoMode || !database) {
      // Force a re-render to show updated states
      // In a real implementation, this would trigger a Firebase refresh
      console.log('Bed update triggered in demo mode');
    }
  };

  // Function to update local history in demo mode
  const updateLocalHistory = (historyEntry) => {
    if (isDemoMode || !database) {
      setHistory(prev => [historyEntry, ...prev]);
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
      Object.entries(beds).filter(([bedId, bedData]) => {
        const effectiveStatus = getEffectiveBedStatus(bedData);
        const bedWard = bedData.ward || 'General';
        
        switch (filter) {
          case 'available':
            // Only truly unoccupied beds without cleaning are available
            return effectiveStatus === BED_STATUSES.UNOCCUPIED;
          case 'occupied':
            return bedData.status === 'occupied' || bedData.status === 'occupied-cleaning';
          case 'unoccupied':
            return bedData.status === 'unoccupied' || bedData.status === 'unoccupied-cleaning';
          case 'cleaning':
            return bedData.status === 'occupied-cleaning' || bedData.status === 'unoccupied-cleaning';
          case 'ward-icu':
            return bedWard === 'ICU';
          case 'ward-maternity':
            return bedWard === 'Maternity';
          case 'ward-general':
            return bedWard === 'General';
          default:
            return true;
        }
      })
    );
  };

  const groupBedsByWard = (bedsData) => {
    const grouped = {};
    Object.entries(bedsData).forEach(([bedId, bedData]) => {
      const ward = bedData.ward || 'General'; // Default to General if no ward specified
      if (!grouped[ward]) {
        grouped[ward] = {};
      }
      grouped[ward][bedId] = bedData;
    });
    return grouped;
  };

  const getStatusCounts = () => {
    const counts = {
      total: Object.keys(beds).length,
      occupied: 0,
      unoccupied: 0,
      cleaning: 0,
      overridden: 0
    };

    Object.values(beds).forEach(bed => {
      const effectiveStatus = getEffectiveBedStatus(bed);
      
      // Count overrides
      if (bed.override && bed.override.active) {
        counts.overridden++;
      }
      
      // Count by effective status
      if (effectiveStatus === 'occupied' || effectiveStatus === 'occupied-cleaning') {
        counts.occupied++;
      }
      // Only count as unoccupied if it's truly available (not in cleaning)
      if (effectiveStatus === 'unoccupied') {
        counts.unoccupied++;
      }
      if (effectiveStatus === 'occupied-cleaning' || effectiveStatus === 'unoccupied-cleaning') {
        counts.cleaning++;
      }
    });

    return counts;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e9eae0' }}>
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
    <div className="min-h-screen" style={{ backgroundColor: '#e9eae0' }}>
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="p-4 rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 flex items-center justify-center min-h-[100px]" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
              <div className="mt-2" style={{ color: '#01796F' }}>Total Beds</div>
            </div>
          </div>
          <div className="p-4 rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 flex items-center justify-center min-h-[100px]" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-red-600">{statusCounts.occupied}</div>
              <div className="mt-2" style={{ color: '#01796F' }}>Occupied</div>
            </div>
          </div>
          <div className="p-4 rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 relative group flex items-center justify-center min-h-[100px]" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-green-600">{statusCounts.unoccupied}</div>
              <div className="mt-2" style={{ color: '#01796F' }}>Ready</div>
            </div>
            
            {/* Hover tooltip for Ready beds */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full 
                          p-3 rounded-lg shadow-lg z-10 w-48
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300
                          pointer-events-none border-2"
                 style={{ backgroundColor: '#e9eae0', borderColor: '#d6d7cd' }}>
              <div className="text-sm font-medium text-gray-900 mb-2">Ready Beds by Ward:</div>
              {Object.entries(groupBedsByWard(filteredBeds)).map(([ward, wardBeds]) => {
                const readyCount = Object.values(wardBeds).filter(bed => 
                  getEffectiveBedStatus(bed) === 'unoccupied'
                ).length;
                if (readyCount > 0) {
                  return (
                    <div key={ward} className="flex justify-between items-center mb-1">
                      <span style={{ color: '#01796F' }}>{ward}:</span>
                      <span className="font-medium text-green-600">{readyCount}</span>
                    </div>
                  );
                }
                return null;
              })}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div style={{ backgroundColor: '#e9eae0', borderColor: '#d6d7cd' }} className="w-3 h-3 border-l border-t transform rotate-45"></div>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }} className="p-4 rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 flex items-center justify-center min-h-[100px]">
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-orange-600">{statusCounts.cleaning}</div>
              <div className="mt-2" style={{ color: '#01796F' }}>Cleaning</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }} className="p-4 rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 flex items-center justify-center min-h-[100px]">
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.overridden}</div>
              <div className="mt-2" style={{ color: '#01796F' }}>Overridden</div>
            </div>
          </div>
          <div className="md:col-span-1">
            <PredictionBox onNavigateToAnalytics={() => handleNavigate('analytics')} />
          </div>
        </div>

        {/* System Information */}
        <div className="mb-8 border-2 rounded-lg p-4" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#01796F' }}>
                <span className="text-white text-sm font-medium">i</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium" style={{ color: '#01796F' }}>Hardware-Integrated Status</h3>
              <p className="text-sm" style={{ color: '#01796F' }}>
                Bed statuses are automatically updated by ESP8266 hardware sensors. 
                Use <span className="font-bold">Assign Patient</span> and <span className="font-bold">Supervisor Override</span> for manual management.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="filter" className="text-sm font-medium" style={{ color: '#01796F' }}>
              Filter by status:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ 
                backgroundColor: '#c9c7c0',
                color: '#01796F',
                borderColor: '#9a9890'
              }}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <option value="all" className="hover:scale-105">All Beds</option>
              <option value="occupied">Occupied</option>
              <option value="available">Available</option>
              <option value="unoccupied">Unoccupied</option>
              <option value="cleaning">Cleaning</option>
              <optgroup label="By Ward" style={{ color: '#01796F', backgroundColor: '#e9eae0' }}>
                <option value="ward-icu">ICU Ward</option>
                <option value="ward-maternity">Maternity Ward</option>
                <option value="ward-general">General Ward</option>
              </optgroup>
            </select>
          </div>
        </div>

        <style>{`
          select {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2301796F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 0.5rem center;
            background-size: 1em;
            padding-right: 2.5rem;
          }

          select::-ms-expand {
            display: none;
          }

          select option {
            background-color: #e9eae0 !important;
            color: #01796F;
            padding: 12px;
            transition: transform 0.3s ease;
            cursor: pointer;
            position: relative;
            z-index: 1;
          }
          
          select option:hover {
            transform: translateY(-2px);
            background-color: #e9eae0 !important;
          }

          select option:checked {
            background-color: #e9eae0 !important;
            font-weight: bold;
          }

          /* Custom styling for the optgroup */
          select optgroup {
            font-weight: bold;
            padding: 8px;
            color: #01796F;
            background-color: #c9c7c0;
          }
        `}</style>

        {/* Beds Grid - Grouped by Ward */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#01796F' }}>Bed Status Overview</h2>
          {Object.keys(filteredBeds).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No beds match the current filter.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupBedsByWard(filteredBeds)).map(([ward, wardBeds]) => {
                // Calculate status counts for this ward
                const wardStatusCounts = {
                  occupied: Object.values(wardBeds).filter(bed => 
                    getEffectiveBedStatus(bed) === 'occupied'
                  ).length,
                  occupied_cleaning: Object.values(wardBeds).filter(bed => 
                    getEffectiveBedStatus(bed) === 'occupied-cleaning'
                  ).length,
                  unoccupied: Object.values(wardBeds).filter(bed => 
                    getEffectiveBedStatus(bed) === 'unoccupied'
                  ).length,
                  cleaning: Object.values(wardBeds).filter(bed => 
                    getEffectiveBedStatus(bed) === 'unoccupied-cleaning'
                  ).length
                };

                if (ward === 'ICU') {
                  return (
                    <div key={ward} className={`rounded-lg border-2 overflow-hidden transition-all duration-300 ${WARD_COLORS[ward] || WARD_COLORS[WARD_TYPES.GENERAL]}`}>
                      <button
                        onClick={() => setWardExpanded(prev => !prev)}
                        className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-opacity-90"
                      >
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full mr-3 bg-red-500"></span>
                          <h3 className="text-xl font-semibold" style={{ color: '#01796F' }}>
                            ICU Ward
                            <span className="ml-2 text-sm font-normal" style={{ color: '#01796F' }}>
                              ({Object.keys(wardBeds).length} bed{Object.keys(wardBeds).length !== 1 ? 's' : ''})
                            </span>
                          </h3>
                        </div>
                        <div className="flex items-center space-x-4">
                          {wardStatusCounts.occupied > 0 && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>
                              <span style={{ color: '#01796F' }}>{wardStatusCounts.occupied}</span>
                            </div>
                          )}
                          {wardStatusCounts.unoccupied > 0 && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-[#2E8B57] mr-2"></span>
                              <span style={{ color: '#01796F' }}>{wardStatusCounts.unoccupied}</span>
                            </div>
                          )}
                          {wardStatusCounts.cleaning > 0 && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                              <span style={{ color: '#01796F' }}>{wardStatusCounts.cleaning}</span>
                            </div>
                          )}
                          <svg 
                            className={`w-5 h-5 transition-transform duration-300 ${wardExpanded ? 'transform rotate-180' : ''}`}
                            style={{ color: '#01796F' }}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      <div className={`transition-all duration-300 ${wardExpanded ? 'h-auto p-6' : 'h-0 p-0'} overflow-hidden`}>
                        <div className="flex flex-nowrap overflow-x-auto pb-4 space-x-4">
                          {Object.entries(wardBeds).map(([bedId, bedData]) => (
                            <div key={`${bedId}-${refreshKey}`} className="flex-none w-[300px]">
                              <BedCard
                                bedId={bedId}
                                bedData={bedData}
                                onUpdate={handleBedUpdate}
                                updateLocalHistory={updateLocalHistory}
                                updateBedsData={setBeds}
                                allBeds={beds}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const wardColor = ward === 'Maternity' ? '#ec4899' : '#3b82f6';
                  const showMaternityOccupiedCleaning = ward === 'Maternity' && wardStatusCounts.occupied_cleaning > 0;
                  return (
                    <div key={ward} className={`rounded-lg border-2 overflow-hidden transition-all duration-300 ${WARD_COLORS[ward] || WARD_COLORS[WARD_TYPES.GENERAL]}`}>
                      <button
                        onClick={() => ward === 'Maternity' ? setMaternityExpanded(prev => !prev) : setGeneralExpanded(prev => !prev)}
                        className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-opacity-90"
                      >
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full mr-3" 
                                style={{ backgroundColor: wardColor }}></span>
                          <h3 className="text-xl font-semibold" style={{ color: '#01796F' }}>
                            {ward} Ward
                            <span className="ml-2 text-sm font-normal" style={{ color: '#01796F' }}>
                              ({Object.keys(wardBeds).length} bed{Object.keys(wardBeds).length !== 1 ? 's' : ''})
                            </span>
                          </h3>
                        </div>
                        <div className="flex items-center space-x-4">
                          {wardStatusCounts.occupied > 0 && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>
                              <span style={{ color: '#01796F' }}>{wardStatusCounts.occupied}</span>
                            </div>
                          )}
                          {showMaternityOccupiedCleaning && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                              <span style={{ color: '#01796F' }}>{wardStatusCounts.occupied_cleaning}</span>
                            </div>
                          )}
                          {wardStatusCounts.unoccupied > 0 && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-[#2E8B57] mr-2"></span>
                              <span style={{ color: '#01796F' }}>{wardStatusCounts.unoccupied}</span>
                            </div>
                          )}
                          {wardStatusCounts.cleaning > 0 && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                              <span style={{ color: '#01796F' }}>{wardStatusCounts.cleaning}</span>
                            </div>
                          )}
                          <svg 
                            className={`w-5 h-5 transition-transform duration-300 ${
                              (ward === 'Maternity' ? maternityExpanded : generalExpanded) ? 'transform rotate-180' : ''
                            }`}
                            style={{ color: '#01796F' }}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      <div className={`transition-all duration-300 ${
                        (ward === 'Maternity' ? maternityExpanded : generalExpanded) ? 'h-auto p-6' : 'h-0 p-0'
                      } overflow-hidden`}>
                        <div className="flex flex-nowrap overflow-x-auto pb-4 space-x-4">
                          {Object.entries(wardBeds).map(([bedId, bedData]) => (
                            <div key={`${bedId}-${refreshKey}`} className="flex-none w-[300px]">
                              <BedCard
                                bedId={bedId}
                                bedData={bedData}
                                onUpdate={handleBedUpdate}
                                updateLocalHistory={updateLocalHistory}
                                updateBedsData={setBeds}
                                allBeds={beds}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
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
