import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

function VermigoDashboard() {
    // Navigation hook
    const navigate = useNavigate();

    // State for profile popup and modal
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Static chart data based on the image
    const chartData = [
        { name: 'Jan', value: 3200 },
        { name: 'Feb', value: 4100 },
        { name: 'Mar', value: 3800 },
        { name: 'Apr', value: 2900 },
        { name: 'May', value: 5200 },
        { name: 'Jun', value: 3600 },
        { name: 'Jul', value: 4300 },
        { name: 'Aug', value: 3100 },
        { name: 'Sep', value: 5100 },
        { name: 'Oct', value: 4000 },
        { name: 'Nov', value: 4800 },
        { name: 'Dec', value: 5400 },
    ];

    // Top waste collection locations data
    const topLocationsData = [
        { name: 'Barrangu Lighting', value: 6239, color: '#FF6B6B' },
        { name: 'Therona', value: 4975, color: '#FF9E7A' },
        { name: 'Lineast B', value: 2385, color: '#FFBB94' },
    ];

    // Current month and year
    const [currentMonth, setCurrentMonth] = useState('March');
    const [currentYear, setCurrentYear] = useState('2021');

    // Profile data object
    const profileData = {
        name: "Primo Christian",
        email: "primoMontejo@gmail.com",
        role: "Waste Collection Manager",
        phone: "+1 (555) 123-4567",
        address: "123 Green Street, Eco City, EC 12345",
        joinDate: "January 15, 2021",
        department: "Field Operations"
    };

    // Handler functions
    const handleLogout = () => {
        // Here you would normally clear authentication tokens, etc.
        navigate('/login');
    };

    const toggleProfilePopup = () => {
        setShowProfilePopup(!showProfilePopup);
    };

    const openProfileModal = () => {
        setShowProfilePopup(false);
        setShowProfileModal(true);
    };

    // Calendar data for March 2021
    const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

    // Collection schedule data (for the calendar)
    const pickupDays = [2, 8, 12, 16, 19, 23, 26, 30];

    return (
        <div className="flex min-h-screen">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                
                :root {
                  --primary-color: #5da646;
                  --primary-hover: #40752f;
                  --text-dark: #1e293b;
                  --text-light: #64748b;
                  --background-color: #f8fafc;
                  --card-background: #ffffff;
                  --border-color: #e2e8f0;
                  --chart-color: #4F46E5;
                  --success-color: #22c55e;
                  --error-color: #ef4444;
                }
                
                /* Animation for popup modal */
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
        
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                }
        
                .profile-popup {
                    animation: fadeIn 0.3s forwards;
                }
        
                .profile-popup.fade-out {
                    animation: fadeOut 0.3s forwards;
                }
        
                .modal-container {
                    animation: fadeIn 0.3s forwards;
                }
        
                .modal-container.fade-out {
                    animation: fadeOut 0.3s forwards;
                }

                /* Calendar specific styling */
                .calendar-day.pickup {
                    background-color: rgba(93, 166, 70, 0.1);
                    color: var(--primary-color);
                    font-weight: 500;
                    position: relative;
                }
                
                .calendar-day.pickup:after {
                    content: 'Pickup Day';
                    position: absolute;
                    bottom: -0.1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.65rem;
                    color: var(--primary-color);
                    white-space: nowrap;
                }
                `}
            </style>

            {/* Sidebar */}
            <div className="fixed top-0 left-0 w-60 h-full bg-white border-r border-gray-200 shadow-sm z-10">
                <div className="p-5 border-b border-gray-200">
                    <div className="text-2xl font-bold text-[#5da646]">Vermigo Admin</div>
                </div>
                <div className="py-5">
                    <ul className="list-none">
                        <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 bg-[rgba(93,166,70,0.08)] text-[#5da646]">
                            <Link to="/dashboard" className="flex items-center no-underline text-inherit">
                                <span className="mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                    </svg>
                                </span>
                                Dashboard
                            </Link>
                        </li>
                        <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 hover:bg-[rgba(93,166,70,0.05)]">
                            <Link to="/complaints" className="flex items-center no-underline text-inherit">
                                <span className="mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </span>
                                Complaints
                            </Link>
                        </li>
                        <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 hover:bg-[rgba(93,166,70,0.05)]">
                            <Link to="/schedule" className="flex items-center no-underline text-inherit">
                                <span className="mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </span>
                                Collection Schedule
                            </Link>
                        </li>
                        <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 hover:bg-[rgba(93,166,70,0.05)]">
                            <Link to="/map" className="flex items-center no-underline text-inherit">
                                <span className="mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </span>
                                Collection Sites Map
                            </Link>
                        </li>
                    </ul>
                </div>
                {/* User Info with Clickable Profile */}
                <div className="fixed bottom-0 left-0 w-60 p-4 flex items-center border-t border-gray-200 bg-white cursor-pointer" onClick={toggleProfilePopup}>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium text-sm">P</div>
                    <div className="ml-3">
                        <div className="text-sm font-medium">Primo Christian</div>
                        <div className="text-xs text-gray-500">primoMontejo@gmail.com</div>
                    </div>
                </div>

                {/* Profile Popup */}
                {showProfilePopup && (
                    <div className="profile-popup absolute bottom-[70px] left-[10px] w-[220px] bg-white shadow-md rounded-lg z-30 border border-gray-200 overflow-hidden">
                        <div className="py-3 px-4 flex items-center cursor-pointer hover:bg-[rgba(93,166,70,0.05)]" onClick={openProfileModal}>
                            <div className="mr-3 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div className="text-sm text-gray-800">View Profile</div>
                        </div>
                        <div className="h-px bg-gray-200"></div>
                        <div className="py-3 px-4 flex items-center cursor-pointer hover:bg-[rgba(93,166,70,0.05)]" onClick={handleLogout}>
                            <div className="mr-3 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </div>
                            <div className="text-sm text-gray-800">Logout</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 ml-60 bg-[#f8fafc]">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
                </div>

                {/* Timeline Filter */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <span className="text-gray-500 mr-2">Timeline:</span>
                        <select className="bg-white border border-gray-200 rounded px-3 py-2 pr-8 font-sans text-gray-800 cursor-pointer focus:outline-none focus:border-[#5da646] focus:ring-2 focus:ring-[rgba(93,166,70,0.2)] appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.25rem]">
                            <option>All-time</option>
                            <option>This year</option>
                            <option>This quarter</option>
                            <option>This month</option>
                            <option>This week</option>
                        </select>
                    </div>
                </div>

                {/* Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">Active Users</div>
                        <div className="text-3xl font-bold">121</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">Total Pickup Trash</div>
                        <div className="text-3xl font-bold">3,298</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">Total Collection Points</div>
                        <div className="text-3xl font-bold">10,689</div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Top Locations */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Top Most Ordered Location Pickup</h3>
                        <div>
                            {topLocationsData.map((location, index) => (
                                <div key={index} className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-800">{location.name}</span>
                                        <span className="font-medium">{location.value.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(location.value / topLocationsData[0].value) * 100}%`,
                                                backgroundColor: location.color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Activity</h3>
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis hide={true} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="var(--chart-color)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <span className="text-xl font-semibold mr-2">{currentMonth}</span>
                            <span className="text-xl text-gray-500">{currentYear}</span>
                        </div>
                        <div className="flex">
                            <button className="bg-transparent border-none text-gray-500 cursor-pointer p-1 rounded hover:bg-gray-100 hover:text-gray-800 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button className="bg-transparent border-none text-gray-500 cursor-pointer p-1 rounded hover:bg-gray-100 hover:text-gray-800 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {/* Day headers */}
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                            <div key={`header-${index}`} className="text-xs text-gray-500 text-center py-2">
                                {day}
                            </div>
                        ))}

                        {/* Empty days before first day of month (Monday) */}
                        <div></div>

                        {/* Days of month */}
                        {calendarDays.map((day) => (
                            <div
                                key={`day-${day}`}
                                className={`h-10 flex items-center justify-center text-sm rounded ${pickupDays.includes(day) ? 'calendar-day pickup' : ''}`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowProfileModal(false)}>
                    <div className="modal-container bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <h3 className="text-xl font-semibold">Profile Information</h3>
                            <button className="bg-transparent border-none text-gray-500 cursor-pointer p-2 rounded hover:bg-gray-100 hover:text-gray-800 flex items-center justify-center" onClick={() => setShowProfileModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium text-2xl mr-4">P</div>
                                <div>
                                    <div className="text-xl font-semibold">{profileData.name}</div>
                                    <div className="text-sm text-gray-500">{profileData.role}</div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="text-sm text-gray-500 mb-2">Contact Information</div>
                                <div className="flex mb-3">
                                    <div className="text-gray-500 mr-3 flex-shrink-0 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                    </div>
                                    <div className="text-sm">{profileData.phone}</div>
                                </div>
                                <div className="flex mb-3">
                                    <div className="text-gray-500 mr-3 flex-shrink-0 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </div>
                                    <div className="text-sm">{profileData.email}</div>
                                </div>
                                <div className="flex mb-3">
                                    <div className="text-gray-500 mr-3 flex-shrink-0 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                    </div>
                                    <div className="text-sm">{profileData.address}</div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="text-sm text-gray-500 mb-2">Work Information</div>
                                <div className="flex mb-3">
                                    <div className="text-gray-500 mr-3 flex-shrink-0 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                        </svg>
                                    </div>
                                    <div className="text-sm">{profileData.department}</div>
                                </div>
                                <div className="flex mb-3">
                                    <div className="text-gray-500 mr-3 flex-shrink-0 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <div className="text-sm">Joined on {profileData.joinDate}</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-200 flex justify-end">
                            <button 
                                className="px-4 py-2 rounded-md text-sm font-medium border border-gray-200 bg-transparent text-gray-800 mr-3 cursor-pointer transition-all duration-200 hover:bg-gray-100" 
                                onClick={() => setShowProfileModal(false)}
                            >
                                Close
                            </button>
                            <button 
                                className="px-4 py-2 rounded-md text-sm font-medium bg-[#5da646] text-white border-none cursor-pointer transition-all duration-200 hover:bg-[#40752f]"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VermigoDashboard;