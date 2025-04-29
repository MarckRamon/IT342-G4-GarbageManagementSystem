import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, subDays } from 'date-fns';

const DashboardHistoryWidget = () => {
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get auth token
  const getAuthHeader = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchRecentHistory = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://it342-g4-garbagemanagementsystem-kflf.onrender.com/api/history', {
          headers: getAuthHeader()
        });

        // Handle different response formats
        let records = [];
        if (Array.isArray(response.data)) {
          // If API returns direct array of records
          records = response.data;
        } else if (response.data && response.data.success && Array.isArray(response.data.records)) {
          // If API returns {success: true, records: [...]}
          records = response.data.records;
        } else if (response.data && Array.isArray(response.data.data)) {
          // If API returns {data: [...]}
          records = response.data.data;
        }

        // Sort by date (newest first) and take the 5 most recent
        const sortedRecords = records
          .sort((a, b) => new Date(b.collectionDate) - new Date(a.collectionDate))
          .slice(0, 5);

        setRecentHistory(sortedRecords);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Error fetching recent history');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentHistory();
  }, []);

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

      {recentHistory.length > 0 ? (
        <div className="space-y-3">
          {recentHistory.map((record) => (
            <div key={record.historyId} className="border-b border-gray-100 pb-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {/* Format the date properly */}
                  {format(parseISO(record.collectionDate), 'MMM d, yyyy')}
                </span>
                <span className="text-sm text-gray-500">
                  {/* Show schedule ID with a label */}
                  Schedule: {record.scheduleId}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {record.notes || <span className="text-gray-400 italic">No notes provided</span>}
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
    </div>
  );
};

export default DashboardHistoryWidget;