import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Heart, User, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-[#161616]/90 backdrop-blur-md border-b border-[#710014]/30 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="bg-gradient-to-r from-[#710014] to-[#838F6F] p-2 rounded-lg">
              <Heart className="h-8 w-8 text-[#F2F1ED]" />
            </div>
            <span className="text-2xl font-bold text-[#F2F1ED]">BloodDoc</span>
          </motion.div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[#F2F1ED]">
              {user?.role === 'hospital' ? (
                <Building2 className="h-5 w-5 text-[#838F6F]" />
              ) : (
                <User className="h-5 w-5 text-[#838F6F]" />
              )}
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs text-[#838F6F] capitalize">({user?.role})</span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="bg-[#710014] hover:bg-[#710014]/80 text-[#F2F1ED] px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;