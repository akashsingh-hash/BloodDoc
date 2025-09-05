import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Building2, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'hospital' | 'patient'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password, role);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] via-[#1a1a1a] to-[#710014]/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#161616]/80 backdrop-blur-xl border border-[#710014]/30 rounded-2xl p-8 shadow-2xl">
          <motion.div 
            className="text-center mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="bg-gradient-to-r from-[#710014] to-[#838F6F] p-3 rounded-2xl inline-block mb-4">
              <Heart className="h-12 w-12 text-[#F2F1ED]" />
            </div>
            <h1 className="text-3xl font-bold text-[#F2F1ED] mb-2">BloodDoc</h1>
            <p className="text-[#838F6F] text-sm">Smart Blood Aggregator & Hospital Platform</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRole('patient')}
                className={`p-4 rounded-xl border transition-all ${
                  role === 'patient'
                    ? 'bg-[#710014] border-[#710014] text-[#F2F1ED]'
                    : 'bg-[#161616]/50 border-[#838F6F]/30 text-[#838F6F] hover:border-[#838F6F]'
                }`}
              >
                <User className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Patient</span>
              </motion.button>
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRole('hospital')}
                className={`p-4 rounded-xl border transition-all ${
                  role === 'hospital'
                    ? 'bg-[#710014] text-[#F2F1ED]'
                    : 'bg-[#161616]/50 border-[#838F6F]/30 text-[#838F6F] hover:border-[#838F6F]'
                }`}
              >
                <Building2 className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Hospital</span>
              </motion.button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 transition-all"
                placeholder="Enter your email"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 transition-all pr-12"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#838F6F] hover:text-[#F2F1ED] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-[#710014] to-[#838F6F] text-[#F2F1ED] py-3 px-4 rounded-xl font-medium hover:from-[#8a0018] hover:to-[#94a082] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F2F1ED]"></div>
                  <span className="ml-2">Signing In...</span>
                </div>
              ) : (
                `Sign In as ${role === 'hospital' ? 'Hospital' : 'Patient'}`
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-[#838F6F] text-sm">
              Demo Credentials: hospital@test.com / patient@test.com (password: demo123)
            </p>
            <p className="text-[#838F6F] text-sm">
              Don't have an account?{' '}
              <a href="/signup" className="text-[#710014] hover:text-[#838F6F] transition-colors font-medium">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;