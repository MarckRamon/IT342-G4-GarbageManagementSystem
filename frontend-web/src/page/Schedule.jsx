import React, { useState } from 'react';
import { Calendar, Clock, Home, MapPin, User, Mail, Phone, Briefcase, LogOut, ChevronLeft, ChevronRight, Plus, X, Trash2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
export default function VermigoSchedule() {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [schedules, setSchedules] = useState([
    { id: 1, date: '2025-04-15', area: 'North District', type: 'General Waste', time: '08:00 AM', truck: 'Truck-01' },
    { id: 2, date: '2025-04-18', area: 'East District', type: 'Recyclables', time: '09:30 AM', truck: 'Truck-03' },
    { id: 3, date: '2025-04-22', area: 'South District', type: 'Organic Waste', time: '07:00 AM', truck: 'Truck-02' },
    { id: 4, date: '2025-04-25', area: 'West District', type: 'General Waste', time: '08:30 AM', truck: 'Truck-04' },
    { id: 5, date: '2025-04-29', area: 'Central District', type: 'Hazardous Waste', time: '10:00 AM', truck: 'Truck-05' }
  ]);
  
  const [newSchedule, setNewSchedule] = useState({
    date: '',
    area: '',
    type: 'General Waste',
    time: '',
    truck: ''
  });

  const profileData = {
    name: "Primo Christian",
    email: "primoMontejo@gmail.com",
    role: "Waste Collection Manager",
    phone: "+1 (555) 123-4567",
    address: "123 Green Street, Eco City, EC 12345",
    joinDate: "January 15, 2021",
    department: "Field Operations"
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
    
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };
  
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDayOfMonth = getFirstDayOfMonth(selectedMonth, selectedYear);
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-10 md:h-12"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasSchedule = schedules.some(schedule => schedule.date === currentDate);
      
      calendarDays.push(
        <div key={day} className={`h-10 md:h-12 flex flex-col items-center justify-center rounded ${hasSchedule ? 'bg-green-100 text-green-700 font-medium relative' : ''}`}>
          <span>{day}</span>
          {hasSchedule && <span className="text-xs text-green-700 absolute -bottom-1">Pickup</span>}
        </div>
      );
    }
    
    return calendarDays;
  };
  
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule({
      ...newSchedule,
      [name]: value
    });
  };

  const handleAddSchedule = () => {
    const newId = schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + 1 : 1;
    const updatedSchedules = [...schedules, { ...newSchedule, id: newId }];
    setSchedules(updatedSchedules);
    setNewSchedule({
      date: '',
      area: '',
      type: 'General Waste',
      time: '',
      truck: ''
    });
    setShowAddScheduleModal(false);
  };

  const handleDeleteSchedule = (id) => {
    const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
    setSchedules(updatedSchedules);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed w-60 h-full bg-white border-r border-gray-200 shadow-sm z-10">
        <div className="p-5 border-b border-gray-200">
        <div className="text-2xl font-bold text-[#5da646]">Vermigo Admin</div>
        </div>
        
        <div className="py-5">
          <ul>  <Link to="/dashboard" className="flex items-center no-underline text-inherit">
            <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer hover:bg-green-50 transition-colors">
          
              <Home className="mr-3 w-5 h-5" />
              Dashboard
          
            </li>    </Link>
            <Link to="/complaints" className="flex items-center no-underline text-inherit">
            <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer hover:bg-green-50 transition-colors">
              <MapPin className="mr-3 w-5 h-5" />
              Complaints
            </li></Link>
            <Link to="/schedule" className="flex items-center no-underline text-inherit">
            <li className="flex items-center px-5 py-3 text-green-600 font-medium cursor-pointer bg-green-50 hover:bg-green-50 transition-colors">
              <Calendar className="mr-3 w-5 h-5" />
              Collection Schedule
            </li>
            </Link>
          </ul>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-4 flex items-center border-t border-gray-200 bg-white cursor-pointer" onClick={() => setShowProfilePopup(!showProfilePopup)}>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium">P</div>
          <div className="ml-3">
            <div className="text-sm font-medium">Primo Christian</div>
            <div className="text-xs text-gray-500">primoMontejo@gmail.com</div>
          </div>
        </div>
        
        {/* Profile Popup */}
        {showProfilePopup && (
          <div className="absolute bottom-16 left-4 w-52 bg-white shadow-lg rounded-lg border border-gray-200 z-30 overflow-hidden">
            <div className="p-3 flex items-center cursor-pointer hover:bg-green-50" onClick={() => {
              setShowProfilePopup(false);
              setShowProfileModal(true);
            }}>
              <User className="w-4.5 h-4.5 text-gray-500 mr-3" />
              <div className="text-sm text-gray-700">View Profile</div>
            </div>
            <div className="h-px bg-gray-200"></div>
            <div className="p-3 flex items-center cursor-pointer hover:bg-green-50">
            <Link to="/login" className="flex items-center no-underline text-inherit">
              <LogOut className="w-4.5 h-4.5 text-gray-500 mr-3" />
              <div className="text-sm text-gray-700">Logout</div>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-60 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Collection Schedule</h1>
          <button 
            onClick={() => setShowAddScheduleModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </button>
        </div>

        {/* Schedule List */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Collections</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Area</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Waste Type</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Truck ID</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(schedule => (
                  <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{new Date(schedule.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{schedule.time}</td>
                    <td className="py-3 px-4">{schedule.area}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        schedule.type === 'General Waste' ? 'bg-gray-100 text-gray-700' :
                        schedule.type === 'Recyclables' ? 'bg-blue-100 text-blue-700' :
                        schedule.type === 'Organic Waste' ? 'bg-green-100 text-green-700' :
                        schedule.type === 'Hazardous Waste' ? 'bg-red-100 text-red-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {schedule.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{schedule.truck}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-gray-500 hover:text-gray-700 mr-2">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteSchedule(schedule.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Calendar View */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="text-xl font-semibold mr-2">{monthNames[selectedMonth]}</div>
              <div className="text-xl text-gray-500">{selectedYear}</div>
            </div>
            <div className="flex">
              <button 
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700 ml-1"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(day => (
              <div key={day} className="text-xs text-gray-500 text-center py-2">{day}</div>
            ))}
            {generateCalendarDays()}
          </div>
        </div>
      </div>
      
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Profile Information</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowProfileModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-2xl">P</div>
                <div className="ml-4">
                  <div className="text-lg font-semibold">{profileData.name}</div>
                  <div className="text-sm text-gray-500">{profileData.role}</div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Contact Information</div>
                <div className="flex items-center mb-3">
                  <Phone className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                  <div className="text-sm">{profileData.phone}</div>
                </div>
                <div className="flex items-center mb-3">
                  <Mail className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                  <div className="text-sm">{profileData.email}</div>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                  <div className="text-sm">{profileData.address}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-2">Work Information</div>
                <div className="flex items-center mb-3">
                  <Briefcase className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                  <div className="text-sm">{profileData.department}</div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                  <div className="text-sm">Joined on {profileData.joinDate}</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-5 border-t border-gray-200">
              <button 
                className="px-4 py-2 border border-gray-200 rounded-lg mr-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowAddScheduleModal(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Add Collection Schedule</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAddScheduleModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  name="date"
                  value={newSchedule.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input 
                  type="time" 
                  name="time"
                  value={newSchedule.time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <select 
                  name="area"
                  value={newSchedule.area}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select an area</option>
                  <option value="North District">North District</option>
                  <option value="South District">South District</option>
                  <option value="East District">East District</option>
                  <option value="West District">West District</option>
                  <option value="Central District">Central District</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
                <select 
                  name="type"
                  value={newSchedule.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="General Waste">General Waste</option>
                  <option value="Recyclables">Recyclables</option>
                  <option value="Organic Waste">Organic Waste</option>
                  <option value="Hazardous Waste">Hazardous Waste</option>
                  <option value="Bulky Items">Bulky Items</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Truck ID</label>
                <select 
                  name="truck"
                  value={newSchedule.truck}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a truck</option>
                  <option value="Truck-01">Truck-01</option>
                  <option value="Truck-02">Truck-02</option>
                  <option value="Truck-03">Truck-03</option>
                  <option value="Truck-04">Truck-04</option>
                  <option value="Truck-05">Truck-05</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end p-5 border-t border-gray-200">
              <button 
                className="px-4 py-2 border border-gray-200 rounded-lg mr-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setShowAddScheduleModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                onClick={handleAddSchedule}
                disabled={!newSchedule.date || !newSchedule.time || !newSchedule.area || !newSchedule.truck}
              >
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}