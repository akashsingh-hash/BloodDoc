import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, AlertTriangle, FileText, Heart, Building2 } from 'lucide-react';
import { Hospital as HospitalType, SOSRequest } from '../../types';
import HospitalSearch from './HospitalSearch';
import SOSButton from './SOSButton';
import ReportAnalyzer from './ReportAnalyzer';
import { patientService } from '../../services/patientService';
import { useAuth } from '../../contexts/AuthContext';

const PatientDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Fallback mock data
  const fallbackHospitals: HospitalType[] = [
    {
      id: '1',
      name: 'City General Hospital',
      address: '123 Healthcare Ave',
      phone: '+1 (555) 123-4567',
      email: 'contact@citygeneralhosp.com',
      location: { lat: 40.7128, lng: -74.0060 },
      bloodInventory: [
        { id: '1', bloodType: 'O+', units: 45, expiryDate: '2024-12-15', lastUpdated: '2024-12-01' },
        { id: '2', bloodType: 'O-', units: 12, expiryDate: '2024-12-10', lastUpdated: '2024-12-01' },
      ],
      beds: [],
      staff: []
    },
    {
      id: '2',
      name: 'Metro Medical Center',
      address: '456 Emergency Blvd',
      phone: '+1 (555) 987-6543',
      email: 'info@metromedical.com',
      location: { lat: 40.7489, lng: -73.9857 },
      bloodInventory: [
        { id: '3', bloodType: 'A+', units: 38, expiryDate: '2024-12-18', lastUpdated: '2024-12-01' },
        { id: '4', bloodType: 'B+', units: 22, expiryDate: '2024-12-20', lastUpdated: '2024-12-01' },
      ],
      beds: [],
      staff: []
    }
  ];

  const [activeTab, setActiveTab] = useState<'search' | 'sos' | 'reports' | 'chat'>('reports');
  const [nearbyHospitals, setNearbyHospitals] = useState<HospitalType[]>([]); // Initialize as empty array to prevent flickering
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientSOSRequests, setPatientSOSRequests] = useState<SOSRequest[]>([]); // New state for patient SOS requests
  const [patientBloodTypeForSMS, setPatientBloodTypeForSMS] = useState<string>(''); // New state for blood type for SMS

  // Handler to send SMS for blood request
  const handleSendSMS = useCallback(async (hospitalPhone: string, hospitalName: string) => {
    if (!user || !user.name) {
      alert('You must be logged in to send a blood request SMS.');
      return;
    }
    if (!patientBloodTypeForSMS) {
      alert('Please enter a blood type to request via SMS.');
      return;
    }
    if (!hospitalPhone) {
      alert('Hospital phone number is missing. Cannot send SMS.');
      console.error('Attempted to send SMS without hospital phone number.');
      return;
    }

    const patientName = user.name;
    const message = `Dear ${hospitalName}, patient ${patientName} is urgently requesting blood type ${patientBloodTypeForSMS}. Please contact them on ${user.phone || 'their registered contact'} for further details.`;

    console.log('Preparing to send SMS:', {
      targetHospitalPhone: hospitalPhone,
      patientBloodType: patientBloodTypeForSMS,
      patientName: patientName,
      message: message
    });

    try {
      await patientService.sendBloodRequestSMS(hospitalPhone, patientBloodTypeForSMS, patientName, message);
      alert(`SMS request for ${patientBloodTypeForSMS} sent to ${hospitalName} (${hospitalPhone}). Check backend console for simulation details.`);
    } catch (err: any) {
      console.error('Error sending SMS:', err);
      alert(`Failed to send SMS to ${hospitalName}. Error: ${err.message || 'Unknown error'}. Please check console for details.`);
    }
  }, [user, patientBloodTypeForSMS]); // Dependencies for useCallback

  // Define fetchDashboardData outside useEffect to be callable from JSX
  const fetchDashboardData = useCallback(async (cityToFilter?: string) => {
    setDashboardLoading(true);
    setError(null);
    try {
      if (user) {
        // Fetch nearby hospitals
        const hospitals = await patientService.searchHospitals(undefined, undefined, cityToFilter); // Pass cityToFilter
        if (Array.isArray(hospitals)) {
          setNearbyHospitals(hospitals);
        } else {
          console.error('Invalid hospitals data received:', hospitals);
          throw new Error('Invalid data format received from server');
        }

        // Fetch patient SOS requests
        const sosRequests = await patientService.getPatientSOSRequests(user.id);
        setPatientSOSRequests(sosRequests);
      } else {
        // If not authenticated, use fallback data for hospitals
        setNearbyHospitals(fallbackHospitals);
        setPatientSOSRequests([]); // Clear SOS requests if not logged in
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setNearbyHospitals(fallbackHospitals); // Fallback even on error
      setPatientSOSRequests([]);
    } finally {
      setDashboardLoading(false);
    }
  }, [user]); // Add user as a dependency

  useEffect(() => {
    if (!dashboardLoading && user) { // Only fetch if not loading and user is authenticated
      fetchDashboardData(); // Initial fetch without city filter
    }
  }, [user, fetchDashboardData, dashboardLoading]); // Re-run effect when user, fetchDashboardData, or loading changes

  const tabs = [
    { id: 'search', label: 'Find Hospitals', icon: Search },
    { id: 'sos', label: 'Emergency SOS', icon: AlertTriangle },
    { id: 'reports', label: 'Report Analyzer', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#F2F1ED] mb-2">Patient Dashboard</h1>
          <p className="text-[#838F6F]">Welcome back, {user?.name}</p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-[#710014]/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#838F6F] text-sm">Nearby Hospitals</p>
                <p className="text-2xl font-bold text-[#F2F1ED]">{Array.isArray(nearbyHospitals) ? nearbyHospitals.length : fallbackHospitals.length}</p>
              </div>
              <div className="bg-[#710014]/20 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-[#710014]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-[#838F6F]/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#838F6F] text-sm">Available Blood Types</p>
                <p className="text-2xl font-bold text-[#F2F1ED]">8</p>
              </div>
              <div className="bg-[#838F6F]/20 p-3 rounded-lg">
                <Heart className="h-6 w-6 text-[#838F6F]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#838F6F] text-sm">Emergency Status</p>
                <p className="text-lg font-bold text-green-400">Available</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#161616]/60 backdrop-blur-md border border-[#710014]/30 rounded-xl p-2 mb-8">
          <div className="flex space-x-2">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#710014] text-[#F2F1ED]'
                      : 'text-[#838F6F] hover:text-[#F2F1ED] hover:bg-[#710014]/20'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:block font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>



        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#161616]/60 backdrop-blur-md border border-[#710014]/30 rounded-xl p-6"
        >
          {activeTab === 'search' && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchDashboardData('Chennai')}
                className="w-full bg-gradient-to-r from-[#710014] to-[#838F6F] hover:from-[#8a0018] hover:to-[#94a082] text-[#F2F1ED] py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-6"
              >
                <Search className="h-5 w-5 mr-2" />
                Filter
              </motion.button>
              <div className="mb-6 mt-4">
                <label htmlFor="blood-type-sms" className="block text-sm font-medium text-[#F2F1ED] mb-2">
                  Blood Type for SMS Request (e.g., O+)
                </label>
                <input
                  type="text"
                  id="blood-type-sms"
                  value={patientBloodTypeForSMS}
                  onChange={(e) => setPatientBloodTypeForSMS(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20"
                  placeholder="Enter blood type"
                />
              </div>
            </>
          )}
          {activeTab === 'search' && (
            <HospitalSearch 
              hospitals={Array.isArray(nearbyHospitals) ? nearbyHospitals : fallbackHospitals} 
              loading={dashboardLoading} 
              patientBloodTypeForSMS={patientBloodTypeForSMS}
              onSendSMS={handleSendSMS}
            />
          )}
          {activeTab === 'sos' && (
            <div className="space-y-6">
              <SOSButton />

              {/* Display Patient's SOS Requests and Responses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#161616]/40 border border-[#710014]/20 rounded-xl p-6 mt-6"
              >
                <h3 className="text-xl font-semibold text-[#F2F1ED] mb-4">Your SOS Request Status</h3>
                {dashboardLoading ? (
                  <p className="text-[#838F6F] text-sm">Loading SOS requests...</p>
                ) : patientSOSRequests.length > 0 ? (
                  patientSOSRequests.map((sos, index) => (
                    <motion.div
                      key={sos._id?.toString()}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[#1a1a1a]/60 border border-[#838F6F]/10 rounded-lg p-4 mb-4"
                    >
                      <p className="text-[#F2F1ED] font-medium mb-2">Request for {sos.bloodType} ({sos.urgency})</p>
                      <p className="text-[#838F6F] text-sm mb-2">{sos.message}</p>
                      <p className="text-[#838F6F] text-xs">Sent on: {new Date(sos.createdAt).toLocaleString()}</p>

                      {sos.hospitalResponses && sos.hospitalResponses.length > 0 ? (
                        <div className="mt-4 pt-3 border-t border-[#838F6F]/10">
                          <h4 className="text-md font-semibold text-[#F2F1ED] mb-2">Hospital Responses:</h4>
                          {sos.hospitalResponses.map((response, respIndex) => (
                            <div key={respIndex} className="flex items-center text-sm mb-1">
                              <span className={`font-medium capitalize ${response.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>
                                {response.status}:
                              </span>
                              <span className="ml-2 text-[#838F6F]">{response.responseMessage || 'No message provided.'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#838F6F] text-sm mt-4">No hospitals have responded yet.</p>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <p className="text-[#838F6F] text-sm">You have no active SOS requests.</p>
                )}
              </motion.div>
            </div>
          )}
          {activeTab === 'reports' && <ReportAnalyzer />}
        </motion.div>
      </div>
    </div>
  );
};

export default PatientDashboard;