import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, MapPin, Heart, Phone, Send } from 'lucide-react';
import { hospitalService } from '../../services/hospitalService'; // Changed from patientService
import { useAuth } from '../../contexts/AuthContext';

const SOSButton: React.FC = () => {
  const { user } = useAuth();
  const [isEmergency, setIsEmergency] = useState(false);
  const [bloodType, setBloodType] = useState('');
  const [urgency, setUrgency] = useState<'critical' | 'urgent' | 'moderate'>('urgent');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sosCreated, setSOSCreated] = useState(false);
  const [patientLat, setPatientLat] = useState<number | null>(null);
  const [patientLng, setPatientLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Placeholder location for now. We can add geolocation detection later.
  // const patientLat = 40.7128; // Example Latitude (e.g., New York City)
  // const patientLng = -74.0060; // Example Longitude (e.g., New York City)

  const handleSOSRequest = async () => {
    if (!bloodType || !message) return;
    if (!user?.id) { // Ensure user is logged in
      console.error("User not authenticated for SOS request.");
      return;
    }

    setLoading(true);
    setLocationError(null);

    // Try to get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setPatientLat(latitude);
          setPatientLng(longitude);

          try {
            await hospitalService.createSOSRequest(
              bloodType,
              urgency,
              message,
              latitude,
              longitude
            );
            setSOSCreated(true);
          } catch (error) {
            console.error('Error creating SOS request:', error);
            setLocationError(error.response?.data?.message || 'Failed to send SOS request.');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setLocationError("Unable to retrieve your location. Please ensure location services are enabled and permissions are granted.");
          setLoading(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  if (sosCreated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="bg-green-500/20 p-6 rounded-full inline-block mb-6">
          <Phone className="h-12 w-12 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-[#F2F1ED] mb-4">SOS Request Sent!</h3>
        <p className="text-[#838F6F] mb-6">
          Your emergency request has been sent to nearby hospitals. 
          They will respond as soon as possible.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSOSCreated(false);
            setMessage('');
            setBloodType('');
          }}
          className="bg-[#710014] hover:bg-[#710014]/80 text-[#F2F1ED] py-3 px-6 rounded-xl font-medium transition-colors"
        >
          Create Another Request
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[#F2F1ED] flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-400 mr-2" />
          Emergency SOS Request
        </h3>
      </div>

      {!isEmergency ? (
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsEmergency(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-8 rounded-full shadow-2xl transition-all transform"
            >
              <AlertTriangle className="h-16 w-16" />
            </motion.button>
          </motion.div>
          
          <h3 className="text-2xl font-bold text-[#F2F1ED] mb-4">Emergency SOS</h3>
          <p className="text-[#838F6F] mb-6 max-w-md mx-auto">
            Press the emergency button to send an immediate SOS request to nearby hospitals 
            for urgent blood requirements.
          </p>
          
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 max-w-md mx-auto">
            <p className="text-red-400 text-sm">
              ⚠️ Use only in genuine medical emergencies. Misuse may delay critical care for others.
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center text-red-400 mb-2">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-medium">Emergency Mode Activated</span>
              </div>
              <p className="text-red-300 text-sm">
                Fill out the form below to send an immediate SOS request to nearby hospitals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                  Blood Type Required *
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20"
                  required
                >
                  <option value="">Select Blood Type</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                  Urgency Level
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20"
                >
                  <option value="moderate">Moderate</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                Emergency Details *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 resize-none"
                placeholder="Describe the emergency situation and any specific requirements..."
                required
              />
            </div>

            {locationError && (
              <p className="text-red-400 text-sm mb-4">{locationError}</p>
            )}

            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEmergency(false)}
                className="flex-1 bg-[#838F6F] hover:bg-[#838F6F]/80 text-[#F2F1ED] py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Cancel
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSOSRequest}
                disabled={loading || !bloodType || !message}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send Emergency SOS
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSButton;