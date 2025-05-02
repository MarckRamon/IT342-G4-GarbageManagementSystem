import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';

const DashboardHistoryWidget = () => {
  const [pickupLocations, setPickupLocations] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('history');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get auth header
  const getAuthHeader = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // API endpoint
  const apiBaseUrl = 'https://it342-g4-garbagemanagementsystem-kflf.onrender.com/api';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel for better performance
        const [locationsResponse, historyResponse, schedulesResponse] = await Promise.all([
          axios.get(`${apiBaseUrl}/pickup-locations`, { headers: getAuthHeader() }),
          axios.get(`${apiBaseUrl}/history`, { headers: getAuthHeader() }),
          axios.get(`${apiBaseUrl}/schedule`, { headers: getAuthHeader() })
        ]);

        // Handle locations data
        let locations = [];
        if (Array.isArray(locationsResponse.data)) {
          locations = locationsResponse.data;
        } else if (locationsResponse.data && locationsResponse.data.locations) {
          locations = locationsResponse.data.locations;
        }
        setPickupLocations(locations);
        
        // Handle history data
        let historyRecords = [];
        if (Array.isArray(historyResponse.data)) {
          historyRecords = historyResponse.data;
        } else if (historyResponse.data && historyResponse.data.success && Array.isArray(historyResponse.data.records)) {
          historyRecords = historyResponse.data.records;
        } else if (historyResponse.data && Array.isArray(historyResponse.data.data)) {
          historyRecords = historyResponse.data.data;
        }

        // Handle schedules data
        let schedulesData = [];
        if (Array.isArray(schedulesResponse.data)) {
          schedulesData = schedulesResponse.data;
        } else if (schedulesResponse.data && schedulesResponse.data.schedules) {
          schedulesData = schedulesResponse.data.schedules;
        } else if (schedulesResponse.data && Array.isArray(schedulesResponse.data.data)) {
          schedulesData = schedulesResponse.data.data;
        }
        setSchedules(schedulesData);

        // Process history data with schedule references
        const sortedRecords = historyRecords
          .sort((a, b) => new Date(b.collectionDate) - new Date(a.collectionDate))
          .slice(0, 3)
          .map(record => {
            // Find the corresponding schedule to get locationId
            const relatedSchedule = schedulesData.find(s => s.scheduleId === record.scheduleId);
            return {
              ...record,
              locationId: relatedSchedule ? relatedSchedule.locationId : null
            };
          });

        setRecentHistory(sortedRecords);
        
        // Sort schedules by date (upcoming first) and filter only pending ones
        const sortedSchedules = schedulesData
          .filter(schedule => schedule.status !== 'COMPLETED' || 'CANCELLED') 
          .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
          .slice(0, 3);
          
        setSchedules(sortedSchedules);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to get location name by locationId
  const getLocationName = (locationId) => {
    if (!pickupLocations || pickupLocations.length === 0 || !locationId) return 'Unknown Location';
    
    const location = pickupLocations.find(loc => loc.locationId === locationId);
    return location ? location.siteName : 'Unknown Location';
  };
  
  // Function to get location address by locationId
  const getLocationAddress = (locationId) => {
    if (!pickupLocations || pickupLocations.length === 0 || !locationId) return 'Unknown Address';
    
    const location = pickupLocations.find(loc => loc.locationId === locationId);
    return location ? location.address : 'Unknown Address';
  };

  // Function to get locationId from scheduleId for history records
  const getLocationIdFromSchedule = (scheduleId) => {
    if (!schedules || schedules.length === 0 || !scheduleId) return null;
    
    const schedule = schedules.find(s => s.scheduleId === scheduleId);
    return schedule ? schedule.locationId : null;
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 h-64 flex items-center justify-center">
        <div className="flex items-center">
          <svg className="animate-spin h-5 w-5 mr-3 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500">Loading recent history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 h-64 flex items-center justify-center">
        <div className="text-red-500 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === 'history'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Recent Collections
        </button>
  
      </div>

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <>
          {recentHistory.length > 0 ? (
            <div className="space-y-3">
              {recentHistory.map((record) => {
                // Get the related locationId from the schedule
                const locationId = record.locationId || getLocationIdFromSchedule(record.scheduleId);
                
                return (
                  <div key={record.historyId} className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {format(parseISO(record.collectionDate), 'MMM d, yyyy')}
                      </span>
                      <span className="text-sm text-green-600 font-medium">
                        {getLocationName(locationId)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{getLocationAddress(locationId)}</span>
                    </div>
                   
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-gray-400">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>No recent collections found</span>
            </div>
          )}

          <div className="mt-4 text-right">
            <a href="/history" className="text-[#5da646] hover:text-[#4c8a3a] text-sm font-medium flex items-center justify-end">
              View all collections
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </>
      )}

      {/* Schedule Tab Content */}
      {activeTab === 'schedule' && (
        <>
          {schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.scheduleId} className="border-b border-gray-100 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {format(parseISO(schedule.pickupDate), 'MMM d, yyyy')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      schedule.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                      schedule.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 
                      schedule.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {schedule.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-green-600 font-medium">
                      {getLocationName(schedule.locationId)}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{schedule.pickupTime}</span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{getLocationAddress(schedule.locationId)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {schedule.title || <span className="text-gray-400 italic">No title provided</span>}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-gray-400">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>No upcoming pickups scheduled</span>
            </div>
          )}

          <div className="mt-4 text-right">
            <a href="/schedule" className="text-[#5da646] hover:text-[#4c8a3a] text-sm font-medium flex items-center justify-end">
              View all schedules
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHistoryWidget;