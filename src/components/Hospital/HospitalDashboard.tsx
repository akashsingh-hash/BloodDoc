import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Bed, Users, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { Hospital, SOSRequest, BloodInventory, BloodRequest } from '../../types';
import BloodInventoryChart from './BloodInventoryChart';
import BedOccupancyChart from './BedOccupancyChart';
import SOSManagement from './SOSManagement';
import { hospitalService } from '../../services/hospitalService';
import { useAuth } from '../../contexts/AuthContext';

const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [hospitalData, setHospitalData] = useState<Hospital | null>(null);
  const [sosRequests, setSOSRequests] = useState<SOSRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddEditBloodModal, setShowAddEditBloodModal] = useState(false);
  const [currentBloodEdit, setCurrentBloodEdit] = useState<BloodInventory | null>(null);
  const [bloodType, setBloodType] = useState('');
  const [units, setUnits] = useState<number | ''>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [bloodFormLoading, setBloodFormLoading] = useState(false);
  const [bloodFormError, setBloodFormError] = useState<string | null>(null);

  // States for blood requests
  const [showBloodRequestModal, setShowBloodRequestModal] = useState(false);
  const [targetHospital, setTargetHospital] = useState<Hospital | null>(null);
  const [requestBloodType, setRequestBloodType] = useState('');
  const [requestUnits, setRequestUnits] = useState<number | ''>('');
  const [requestFormLoading, setRequestFormLoading] = useState(false);
  const [requestFormError, setRequestFormError] = useState<string | null>(null);
  const [otherHospitals, setOtherHospitals] = useState<Hospital[]>([]);
  const [outgoingBloodRequests, setOutgoingBloodRequests] = useState<BloodRequest[]>([]);
  const [incomingBloodRequests, setIncomingBloodRequests] = useState<BloodRequest[]>([]);

  const refreshSOSRequests = async () => {
    if (user?.id) {
      try {
        const sos = await hospitalService.getSOSRequests(user.id);
        setSOSRequests(sos);
      } catch (error) {
        console.error('Error refreshing SOS requests:', error);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        try {
          const [hospital, sos] = await Promise.all([
            hospitalService.getHospitalData(user.id),
            hospitalService.getSOSRequests(user.id)
          ]);
          setHospitalData(hospital);
          setSOSRequests(sos);

          // Fetch other hospitals for blood requests
          const allHospitals = await hospitalService.getAllHospitals();
          setOtherHospitals(allHospitals.filter(h => h.userId !== user.id));

          // Fetch outgoing and incoming blood requests
          const [outgoing, incoming] = await Promise.all([
            hospitalService.getOutgoingBloodRequests(user.id),
            hospitalService.getIncomingBloodRequests(user.id)
          ]);
          setOutgoingBloodRequests(outgoing);
          setIncomingBloodRequests(incoming);

        } catch (error) {
          console.error('Error fetching hospital data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user?.id]);

  if (!hospitalData && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#710014]"></div>
      </div>
    );
  }

  if (!hospitalData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#1a1a1a] flex items-center justify-center">
        <p className="text-red-400">No hospital data available. Please ensure your hospital profile is created.</p>
      </div>
    );
  }

  const data = hospitalData; // Use actual hospitalData

  const refreshHospitalData = async () => {
    if (user?.id) {
      try {
        const [hospital, sos] = await Promise.all([
          hospitalService.getHospitalData(user.id),
          hospitalService.getSOSRequests(user.id)
        ]);
        setHospitalData(hospital);
        setSOSRequests(sos);
      } catch (error) {
        console.error('Error refreshing hospital data:', error);
      }
    }
  };

  const handleAddEditBloodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBloodFormLoading(true);
    setBloodFormError(null);

    if (!data?._id) {
      setBloodFormError('Hospital data not loaded. Cannot add/edit blood inventory.');
      setBloodFormLoading(false);
      return;
    }

    try {
      if (currentBloodEdit) {
        // Update existing blood type
        await hospitalService.updateSpecificBloodInventory(
          data._id.toString(),
          currentBloodEdit.id,
          { units: typeof units === 'number' ? units : undefined, expiryDate: expiryDate || undefined }
        );
      } else {
        // Add new blood type
        if (!bloodType || typeof units !== 'number') {
          setBloodFormError('Blood type and units are required.');
          setBloodFormLoading(false);
          return;
        }
        await hospitalService.addOrUpdateBloodInventory(
          data._id.toString(),
          { bloodType, units, expiryDate: expiryDate || undefined }
        );
      }
      setShowAddEditBloodModal(false);
      setCurrentBloodEdit(null);
      setBloodType('');
      setUnits('');
      setExpiryDate('');
      refreshHospitalData();
    } catch (err: any) {
      setBloodFormError(err.response?.data?.message || 'Failed to save blood inventory.');
    } finally {
      setBloodFormLoading(false);
    }
  };

  const handleEditClick = (blood: BloodInventory) => {
    setCurrentBloodEdit(blood);
    setBloodType(blood.bloodType);
    setUnits(blood.units);
    setExpiryDate(blood.expiryDate || '');
    setShowAddEditBloodModal(true);
  };

  const handleDeleteBlood = async (bloodInventoryId: string) => {
    if (!data?._id || !window.confirm('Are you sure you want to delete this blood type?')) {
      return;
    }
    setBloodFormLoading(true);
    try {
      await hospitalService.deleteBloodInventory(data._id.toString(), bloodInventoryId);
      refreshHospitalData();
    } catch (err: any) {
      setBloodFormError(err.response?.data?.message || 'Failed to delete blood type.');
    } finally {
      setBloodFormLoading(false);
    }
  };

  const handleSendBloodRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestFormLoading(true);
    setRequestFormError(null);

    if (!data?._id) {
      setRequestFormError('Hospital data not loaded. Cannot send blood request.');
      setRequestFormLoading(false);
      return;
    }

    if (!targetHospital || !requestBloodType || typeof requestUnits !== 'number' || requestUnits <= 0) {
      setRequestFormError('Please select a target hospital, blood type, and valid units.');
      setRequestFormLoading(false);
      return;
    }

    try {
      await hospitalService.createBloodRequest(
        targetHospital.userId, // Target hospital's userId
        requestBloodType,
        requestUnits
      );
      setShowBloodRequestModal(false);
      setTargetHospital(null);
      setRequestBloodType('');
      setRequestUnits('');
      // Refresh outgoing requests
      if (user?.id) {
        const outgoing = await hospitalService.getOutgoingBloodRequests(user.id);
        setOutgoingBloodRequests(outgoing);
      }
    } catch (err: any) {
      setRequestFormError(err.response?.data?.message || 'Failed to send blood request.');
    } finally {
      setRequestFormLoading(false);
    }
  };

  const handleRespondToBloodRequest = async (requestId: string, status: 'approved' | 'denied', message?: string) => {
    if (!window.confirm(`Are you sure you want to ${status} this request?`)) {
      return;
    }
    setRequestFormLoading(true); // Reusing this for simplicity, ideally a separate state
    try {
      await hospitalService.respondToBloodRequest(requestId, status, message);
      // Refresh both incoming requests and hospital's own data (inventory might change)
      if (user?.id) {
        const [incoming, hospital] = await Promise.all([
          hospitalService.getIncomingBloodRequests(user.id),
          hospitalService.getHospitalData(user.id)
        ]);
        setIncomingBloodRequests(incoming);
        setHospitalData(hospital);
      }
    } catch (err: any) {
      setRequestFormError(err.response?.data?.message || 'Failed to respond to request.');
    } finally {
      setRequestFormLoading(false);
    }
  };

  const totalBeds = data.beds.length;
  const occupiedBeds = data.beds.filter(bed => bed.occupied).length;
  const availableStaff = data.staff.filter(staff => staff.available).length;
  const lowStockBlood = data?.bloodInventory.filter(blood => blood.units < 10).length || 0;

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#1a1a1a] flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#710014]"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#F2F1ED] mb-2">Hospital Dashboard</h1>
          <p className="text-[#838F6F]">{data.name} - Emergency Management Center</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-[#710014]/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#838F6F] text-sm">Total Blood Units</p>
                <p className="text-2xl font-bold text-[#F2F1ED]">
                  {data.bloodInventory.reduce((sum, blood) => sum + blood.units, 0)}
                </p>
              </div>
              <div className="bg-[#710014]/20 p-3 rounded-lg">
                <Heart className="h-6 w-6 text-[#710014]" />
              </div>
            </div>
            {lowStockBlood > 0 && (
              <div className="mt-3 flex items-center text-yellow-400 text-xs">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>{lowStockBlood} blood types low in stock</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-[#838F6F]/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#838F6F] text-sm">Bed Occupancy</p>
                <p className="text-2xl font-bold text-[#F2F1ED]">{occupiedBeds}/{totalBeds}</p>
              </div>
              <div className="bg-[#838F6F]/20 p-3 rounded-lg">
                <Bed className="h-6 w-6 text-[#838F6F]" />
              </div>
            </div>
            <div className="mt-3">
              <div className="bg-[#161616] rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#838F6F] to-[#710014] h-2 rounded-full transition-all"
                  style={{ width: `${(occupiedBeds / totalBeds) * 100}%` }}
                ></div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-[#838F6F]/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#838F6F] text-sm">Available Staff</p>
                <p className="text-2xl font-bold text-[#F2F1ED]">{availableStaff}/{data.staff.length}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-red-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#838F6F] text-sm">Active SOS</p>
                <p className="text-2xl font-bold text-[#F2F1ED]">{sosRequests.length}</p>
              </div>
              <div className="bg-red-500/20 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-[#710014]/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#F2F1ED]">Blood Inventory</h3>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setCurrentBloodEdit(null); setBloodType(''); setUnits(''); setExpiryDate(''); setShowAddEditBloodModal(true); }}
                  className="bg-[#710014] text-[#F2F1ED] px-3 py-1 rounded-md text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Blood
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBloodRequestModal(true)}
                  className="bg-[#838F6F] text-[#F2F1ED] px-3 py-1 rounded-md text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Request Blood
                </motion.button>
                <TrendingUp className="h-5 w-5 text-[#838F6F]" />
              </div>
            </div>
            <BloodInventoryChart bloodInventory={data.bloodInventory} />

            {/* Blood Inventory List */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-[#F2F1ED] mb-3">Current Stock</h4>
              {data.bloodInventory && data.bloodInventory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-[#1a1a1a] rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-[#710014]/30 text-[#F2F1ED] text-left">
                        <th className="py-3 px-4 text-sm font-medium">Blood Type</th>
                        <th className="py-3 px-4 text-sm font-medium">Units</th>
                        <th className="py-3 px-4 text-sm font-medium">Expiry Date</th>
                        <th className="py-3 px-4 text-sm font-medium">Last Updated</th>
                        <th className="py-3 px-4 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bloodInventory.map(blood => (
                        <tr key={blood.id} className="border-t border-[#838F6F]/10 hover:bg-[#710014]/10 transition-colors">
                          <td className="py-3 px-4 text-[#F2F1ED] text-sm">{blood.bloodType}</td>
                          <td className="py-3 px-4 text-[#F2F1ED] text-sm">{blood.units}</td>
                          <td className="py-3 px-4 text-[#F2F1ED] text-sm">{blood.expiryDate ? new Date(blood.expiryDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-3 px-4 text-[#838F6F] text-xs">{new Date(blood.lastUpdated).toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditClick(blood)}
                                className="text-[#838F6F] hover:text-[#710014]"
                              >
                                Edit
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteBlood(blood.id)}
                                className="text-red-400 hover:text-red-500"
                              >
                                Delete
                              </motion.button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#838F6F] text-sm">No blood inventory recorded yet. Add some!</p>
              )}
            </div>
          </motion.div>

          {/* Add/Edit Blood Modal */}
          {showAddEditBloodModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#161616] p-6 rounded-xl shadow-lg border border-[#710014]/30 w-full max-w-md"
              >
                <h3 className="text-xl font-semibold text-[#F2F1ED] mb-4">
                  {currentBloodEdit ? 'Edit Blood Inventory' : 'Add Blood Type'}
                </h3>
                {bloodFormError && (
                  <p className="text-red-400 text-sm mb-4">{bloodFormError}</p>
                )}
                <form onSubmit={handleAddEditBloodSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="bloodType" className="block text-sm font-medium text-[#F2F1ED] mb-1">
                      Blood Type
                    </label>
                    <select
                      id="bloodType"
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      disabled={!!currentBloodEdit} // Disable editing blood type for existing entries
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#838F6F]/30 rounded-md text-[#F2F1ED] focus:outline-none focus:border-[#710014]"
                      required
                    >
                      <option value="">Select Blood Type</option>
                      {[ 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-' ].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="units" className="block text-sm font-medium text-[#F2F1ED] mb-1">
                      Units
                    </label>
                    <input
                      type="number"
                      id="units"
                      value={units}
                      onChange={(e) => setUnits(parseInt(e.target.value) || '')}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#838F6F]/30 rounded-md text-[#F2F1ED] focus:outline-none focus:border-[#710014]"
                      placeholder="Enter units available"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-[#F2F1ED] mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      id="expiryDate"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#838F6F]/30 rounded-md text-[#F2F1ED] focus:outline-none focus:border-[#710014]"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddEditBloodModal(false)}
                      className="px-4 py-2 bg-[#838F6F]/20 text-[#F2F1ED] rounded-md hover:bg-[#838F6F]/30 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={bloodFormLoading}
                      className="px-4 py-2 bg-[#710014] text-[#F2F1ED] rounded-md hover:bg-[#8a0018] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bloodFormLoading ? 'Saving...' : (currentBloodEdit ? 'Update' : 'Add')}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-[#838F6F]/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#F2F1ED]">Bed Occupancy by Ward</h3>
              <Bed className="h-5 w-5 text-[#838F6F]" />
            </div>
            <BedOccupancyChart beds={data.beds} />
          </motion.div>
        </div>

        {/* Blood Request Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Outgoing Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-[#710014]/30 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-[#F2F1ED] mb-4">Outgoing Blood Requests</h3>
            {requestFormLoading && <p className="text-[#838F6F] text-sm">Updating requests...</p>}
            {requestFormError && <p className="text-red-400 text-sm mb-4">{requestFormError}</p>}
            {outgoingBloodRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-[#1a1a1a] rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-[#710014]/30 text-[#F2F1ED] text-left">
                      <th className="py-3 px-4 text-sm font-medium">To Hospital</th>
                      <th className="py-3 px-4 text-sm font-medium">Blood Type</th>
                      <th className="py-3 px-4 text-sm font-medium">Units</th>
                      <th className="py-3 px-4 text-sm font-medium">Status</th>
                      <th className="py-3 px-4 text-sm font-medium">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outgoingBloodRequests.map(request => {
                      const targetHosp = otherHospitals.find(h => h.userId === request.targetHospitalId);
                      return (
                        <tr key={request._id?.toString()} className="border-t border-[#838F6F]/10 hover:bg-[#710014]/10 transition-colors">
                          <td className="py-3 px-4 text-[#F2F1ED] text-sm">{targetHosp?.name || 'Unknown Hospital'}</td>
                          <td className="py-3 px-4 text-[#F2F1ED] text-sm">{request.bloodType}</td>
                          <td className="py-3 px-4 text-[#F2F1ED] text-sm">{request.unitsRequested}</td>
                          <td className="py-3 px-4 text-sm font-medium capitalize" style={{ color: request.status === 'approved' ? '#34d399' : request.status === 'denied' ? '#ef4444' : '#f59e0b' }}>
                            {request.status}
                          </td>
                          <td className="py-3 px-4 text-[#838F6F] text-xs">{new Date(request.updatedAt).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[#838F6F] text-sm">No outgoing blood requests.</p>
            )}
          </motion.div>

          {/* Incoming Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-[#161616]/60 backdrop-blur-md border border-[#838F6F]/30 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-[#F2F1ED] mb-4">Incoming Blood Requests</h3>
            {requestFormLoading && <p className="text-[#838F6F] text-sm">Updating requests...</p>}
            {requestFormError && <p className="text-red-400 text-sm mb-4">{requestFormError}</p>}
            {incomingBloodRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-[#1a1a1a] rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-[#710014]/30 text-[#F2F1ED] text-left">
                      <th className="py-3 px-4 text-sm font-medium">From Hospital</th>
                      <th className="py-3 px-4 text-sm font-medium">Blood Type</th>
                      <th className="py-3 px-4 text-sm font-medium">Units</th>
                      <th className="py-3 px-4 text-sm font-medium">Status</th>
                      <th className="py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingBloodRequests.map(request => {
                      const requestingHosp = otherHospitals.find(h => h.userId === request.requestingHospitalId);
                      return (
                        <tr key={request._id?.toString()} className="border-t border-[#838F6F]/10 hover:bg-[#710014]/10 transition-colors">
                          <td className="py-3 px-4 text-[#F2F1ED] text-sm">{requestingHosp?.name || 'Unknown Hospital'}</td>
                          <td className="py-3 px-4 text-[#F2F1ED] text-sm">{request.bloodType}</td>
                          <td className="py-3 px-4 text-[#F2F1ED] text-sm">{request.unitsRequested}</td>
                          <td className="py-3 px-4 text-sm font-medium capitalize" style={{ color: request.status === 'approved' ? '#34d399' : request.status === 'denied' ? '#ef4444' : '#f59e0b' }}>
                            {request.status}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRespondToBloodRequest(request._id!.toString(), 'approved')}
                                  className="text-green-400 hover:text-green-500"
                                >
                                  Approve
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRespondToBloodRequest(request._id!.toString(), 'denied')}
                                  className="text-red-400 hover:text-red-500"
                                >
                                  Deny
                                </motion.button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[#838F6F] text-sm">No incoming blood requests.</p>
            )}
          </motion.div>
        </div>

        {/* Request Blood Modal */}
        {showBloodRequestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#161616] p-6 rounded-xl shadow-lg border border-[#710014]/30 w-full max-w-md"
            >
              <h3 className="text-xl font-semibold text-[#F2F1ED] mb-4">Request Blood from Other Hospitals</h3>
              {requestFormError && (
                <p className="text-red-400 text-sm mb-4">{requestFormError}</p>
              )}
              <form onSubmit={handleSendBloodRequest} className="space-y-4">
                <div>
                  <label htmlFor="targetHospital" className="block text-sm font-medium text-[#F2F1ED] mb-1">
                    Target Hospital
                  </label>
                  <select
                    id="targetHospital"
                    value={targetHospital?.userId || ''}
                    onChange={(e) => setTargetHospital(otherHospitals.find(h => h.userId === e.target.value) || null)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#838F6F]/30 rounded-md text-[#F2F1ED] focus:outline-none focus:border-[#710014]"
                    required
                  >
                    <option value="">Select a Hospital</option>
                    {otherHospitals.map(hosp => (
                      <option key={hosp._id?.toString()} value={hosp.userId}>{hosp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="requestBloodType" className="block text-sm font-medium text-[#F2F1ED] mb-1">
                    Blood Type
                  </label>
                  <select
                    id="requestBloodType"
                    value={requestBloodType}
                    onChange={(e) => setRequestBloodType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#838F6F]/30 rounded-md text-[#F2F1ED] focus:outline-none focus:border-[#710014]"
                    required
                  >
                    <option value="">Select Blood Type</option>
                    {[ 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-' ].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="requestUnits" className="block text-sm font-medium text-[#F2F1ED] mb-1">
                    Units Requested
                  </label>
                  <input
                    type="number"
                    id="requestUnits"
                    value={requestUnits}
                    onChange={(e) => setRequestUnits(parseInt(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#838F6F]/30 rounded-md text-[#F2F1ED] focus:outline-none focus:border-[#710014]"
                    placeholder="Enter units to request"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBloodRequestModal(false)}
                    className="px-4 py-2 bg-[#838F6F]/20 text-[#F2F1ED] rounded-md hover:bg-[#838F6F]/30 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={requestFormLoading}
                    className="px-4 py-2 bg-[#710014] text-[#F2F1ED] rounded-md hover:bg-[#8a0018] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requestFormLoading ? 'Sending...' : 'Send Request'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* SOS Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-[#161616]/60 backdrop-blur-md border border-red-500/30 rounded-xl p-6"
        >
          {/* Pass the refresh function as a prop */}
          <SOSManagement sosRequests={sosRequests} onSOSResponse={refreshSOSRequests} />
        </motion.div>
      </div>
    </div>
  );
};

export default HospitalDashboard;