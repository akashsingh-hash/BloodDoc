import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Phone, Heart, Bed, Clock, Building2 } from 'lucide-react';
import { Hospital } from '../../types';

interface HospitalSearchProps {
  hospitals: Hospital[];
  loading: boolean;
  patientBloodTypeForSMS: string; // New prop for patient's requested blood type
  onSendSMS: (hospitalPhone: string, hospitalName: string) => void; // New prop for SMS handler
}

const HospitalSearch: React.FC<HospitalSearchProps> = ({ hospitals, loading, patientBloodTypeForSMS, onSendSMS }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState('');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Ensure hospitals is always an array
  const safeHospitals = Array.isArray(hospitals) ? hospitals : [];

  const filteredHospitals = safeHospitals.filter(hospital => {
    // Safety check for each hospital object
    if (!hospital || typeof hospital !== 'object') {
      console.error('Invalid hospital object:', hospital);
      return false;
    }
    
    const matchesSearch = hospital.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBloodType = !selectedBloodType || 
                           hospital.bloodInventory?.some(blood => 
                             blood.bloodType === selectedBloodType && blood.units > 0
                           );

    return matchesSearch && matchesBloodType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#710014]"></div>
        <span className="ml-3 text-[#838F6F]">Loading hospitals...</span>
      </div>
    );
  }

  if (safeHospitals.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-[#838F6F] mx-auto mb-4" />
        <p className="text-[#838F6F] text-lg">No hospitals available</p>
        <p className="text-[#838F6F] text-sm">Please try again later or contact support</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[#F2F1ED] flex items-center">
          <Search className="h-6 w-6 text-[#838F6F] mr-2" />
          Find Hospitals
        </h3>
      </div>

      {/* Search Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
            Search Hospitals
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#838F6F]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20"
              placeholder="Search by name or location..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
            Blood Type Filter
          </label>
          <select
            value={selectedBloodType}
            onChange={(e) => setSelectedBloodType(e.target.value)}
            className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20"
          >
            <option value="">All Blood Types</option>
            {bloodTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hospital Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHospitals.map((hospital, index) => (
          <motion.div
            key={hospital.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#161616]/40 border border-[#710014]/20 rounded-xl p-6 hover:border-[#710014]/40 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-[#F2F1ED] mb-1">{hospital.name}</h4>
                <div className="flex items-center text-[#838F6F] text-sm mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{hospital.address}</span>
                </div>
                <div className="flex items-center text-[#838F6F] text-sm">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{hospital.phone}</span>
                </div>
              </div>
              <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                Available
              </div>
            </div>

            {/* Blood Availability */}
            <div className="mb-4">
              <p className="text-sm font-medium text-[#F2F1ED] mb-2">Blood Availability</p>
              <div className="grid grid-cols-4 gap-2">
                {hospital.bloodInventory.slice(0, 8).map(blood => (
                  <div
                    key={blood.id}
                    className={`text-center p-2 rounded-lg border ${
                      blood.units > 0
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    <div className="text-xs font-medium">{blood.bloodType}</div>
                    <div className="text-xs">{blood.units} units</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSendSMS(hospital.phone, hospital.name)}
                className="flex-1 bg-[#710014] hover:bg-[#710014]/80 text-[#F2F1ED] py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Contact Hospital
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#838F6F] hover:bg-[#838F6F]/80 text-[#F2F1ED] py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                View Details
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredHospitals.length === 0 && !loading && safeHospitals.length > 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-[#838F6F] mx-auto mb-4" />
          <p className="text-[#838F6F] text-lg">No hospitals found</p>
          <p className="text-[#838F6F] text-sm">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default HospitalSearch;