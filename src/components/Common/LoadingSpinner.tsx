import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{ 
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }}
        className="bg-gradient-to-r from-[#710014] to-[#838F6F] p-4 rounded-full mb-4"
      >
        <Heart className="h-8 w-8 text-[#F2F1ED]" />
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[#838F6F] text-lg"
      >
        {message}
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;