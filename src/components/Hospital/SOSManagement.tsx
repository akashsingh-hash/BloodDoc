import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, User, Phone, Check, X } from 'lucide-react';
import { SOSRequest } from '../../types';
import { hospitalService } from '../../services/hospitalService'; // Corrected import path
import { useAuth } from '../../contexts/AuthContext'; // Corrected import path
// Removed: import { Button } from "@/components/ui/button";
// Removed: import { Textarea } from "@/components/ui/textarea";
// Removed: import { toast } from "react-toastify";

interface SOSManagementProps {
  sosRequests: SOSRequest[];
  onSOSResponse: () => void; // Callback to refresh SOS requests in parent
}

const SOSManagement: React.FC<SOSManagementProps> = ({ sosRequests, onSOSResponse }) => {
  const { user } = useAuth(); // Use the auth context to get the current user

  const handleSOSResponse = async (sosId: string, status: 'accepted' | 'denied', message?: string) => {
    if (!window.confirm(`Are you sure you want to ${status} this SOS request?`)) {
      return;
    }
    try {
      await hospitalService.respondToSOS(sosId, status, message);
      onSOSResponse(); // Refresh SOS requests after response
    } catch (error) {
      console.error('Error responding to SOS:', error);
      // Optionally, show an error message to the user
      // toast.error(error.response?.data?.message || 'Failed to respond to SOS.');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'urgent': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'moderate': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-[#838F6F] bg-[#838F6F]/10 border-[#838F6F]/30';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[#F2F1ED] flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-400 mr-2" />
          Emergency SOS Requests
        </h3>
        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
          {sosRequests.filter(sos => sos.hospitalResponses.some(hr => hr.status === 'pending')).length} Pending Responses
        </span>
      </div>

      <div className="space-y-4">
        {sosRequests.length > 0 ? (
          sosRequests.map((sos, index) => {
            // Find the response specific to the current hospital
            const hospitalResponse = sos.hospitalResponses.find(hr => hr.hospitalId === user?.id);
            
            return (
              <motion.div
                key={sos._id?.toString()}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#161616]/40 border border-[#710014]/20 rounded-xl p-6 hover:border-[#710014]/40 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center text-[#F2F1ED]">
                        <User className="h-4 w-4 mr-2 text-[#838F6F]" />
                        <span className="font-medium">Patient: {sos.patientId}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getUrgencyColor(sos.urgency)}`}>
                        {sos.urgency.toUpperCase()}
                      </span>
                      <div className="bg-[#710014]/20 text-[#710014] px-2 py-1 rounded-full text-xs font-medium">
                        {sos.bloodType}
                      </div>
                    </div>

                    <p className="text-[#F2F1ED] mb-3">{sos.message}</p>

                    <div className="flex flex-col sm:flex-row gap-2 text-sm text-[#838F6F]">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{new Date(sos.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Location: {sos.location.coordinates[1].toFixed(4)}, {sos.location.coordinates[0].toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                  {hospitalResponse?.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSOSResponse(sos._id!.toString(), 'accepted', 'We can help immediately')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSOSResponse(sos._id!.toString(), 'denied', 'Unable to assist at this time')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Deny
                      </motion.button>
                    </div>
                  )}

                  {hospitalResponse && hospitalResponse.status !== 'pending' && (
                    <div className="flex items-center text-sm font-medium p-2 rounded-md">
                      Status: <span className={`ml-1 capitalize ${hospitalResponse.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>{hospitalResponse.status}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-[#838F6F] mx-auto mb-4" />
            <p className="text-[#838F6F] text-lg">No active SOS requests</p>
            <p className="text-[#838F6F]/60 text-sm">Emergency requests will appear here when received</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSManagement;
