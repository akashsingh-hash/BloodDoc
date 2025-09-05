import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Building2, User, Eye, EyeOff, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'patient' as 'hospital' | 'patient',
    address: '',
    phone: '',
    city: '', // Added city field
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signup } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.role === 'hospital' && (!formData.address || !formData.phone || !formData.city)) {
      setError('Hospital address, phone, and city are required');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        ...(formData.role === 'hospital' && {
          address: formData.address,
          phone: formData.phone,
          city: formData.city // Pass city for hospitals
        })
      };

      await signup(userData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
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
            <p className="text-[#838F6F] text-sm">Create Your Account</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormData(prev => ({ ...prev, role: 'patient' }))}
                className={`p-4 rounded-xl border transition-all ${
                  formData.role === 'patient'
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
                onClick={() => setFormData(prev => ({ ...prev, role: 'hospital' }))}
                className={`p-4 rounded-xl border transition-all ${
                  formData.role === 'hospital'
                    ? 'bg-[#710014] border-[#710014] text-[#F2F1ED]'
                    : 'bg-[#161616]/50 border-[#838F6F]/30 text-[#838F6F] hover:border-[#838F6F]'
                }`}
              >
                <Building2 className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Hospital</span>
              </motion.button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#838F6F]" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 transition-all"
                  placeholder={formData.role === 'hospital' ? 'Hospital Name' : 'Your Full Name'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#838F6F]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 transition-all"
                  placeholder="Enter your email"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {formData.role === 'hospital' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#838F6F]" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 transition-all"
                      placeholder="Hospital Address"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#838F6F]" />
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 transition-all"
                      required
                    >
                      <option value="">Select City</option>
                      {['Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad'].map(cityOption => (
                        <option key={cityOption} value={cityOption}>{cityOption}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#838F6F]" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 transition-all"
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 transition-all pr-12"
                  placeholder="Create a password"
                  required
                  autoComplete="new-password"
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

            <div>
              <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 transition-all pr-12"
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#838F6F] hover:text-[#F2F1ED] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                  <span className="ml-2">Creating Account...</span>
                </div>
              ) : (
                `Sign Up as ${formData.role === 'hospital' ? 'Hospital' : 'Patient'}`
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#838F6F] text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-[#710014] hover:text-[#838F6F] transition-colors font-medium">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupForm;
