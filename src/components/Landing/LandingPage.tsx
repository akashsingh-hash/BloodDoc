import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Heart, Droplets, Users, Shield, ArrowRight, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  const features = [
    {
      icon: Heart,
      title: 'Smart Blood Matching',
      description: 'AI-powered blood type compatibility and real-time inventory tracking.'
    },
    {
      icon: Shield,
      title: 'Emergency SOS System',
      description: 'Instant emergency alerts to nearby hospitals for critical blood requirements.'
    },
    {
      icon: Users,
      title: 'Hospital Network',
      description: 'Connect with verified hospitals and medical professionals in your area.'
    },
    {
      icon: Droplets,
      title: 'Blood Analytics',
      description: 'Advanced analytics and reporting for better blood management.'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Hospitals Connected' },
    { number: '50K+', label: 'Lives Saved' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#161616] to-[#1a1a1a] overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <motion.div
          style={{ y }}
          className="absolute inset-0 bg-gradient-to-b from-[#710014]/20 to-transparent"
        />
        
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="bg-gradient-to-r from-[#710014] to-[#838F6F] p-4 rounded-3xl inline-block mb-6"
            >
              <Heart className="h-16 w-16 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6"
            >
              <span className="bg-gradient-to-r from-[#710014] to-[#838F6F] bg-clip-text text-transparent">
                BloodDoc
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              The future of blood donation and emergency medical response. 
              Connecting hospitals, saving lives, one drop at a time.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-[#710014] to-[#838F6F] text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 hover:shadow-2xl transition-all duration-300"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border border-[#710014] text-[#710014] px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 hover:bg-[#710014] hover:text-white transition-all duration-300"
            >
              <Play className="h-5 w-5" />
              Watch Demo
            </motion.button>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 text-[#710014]/30"
        >
          <Heart className="h-8 w-8" />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-20 text-[#838F6F]/30"
        >
          <Droplets className="h-6 w-6" />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 left-20 text-[#710014]/20"
        >
          <Users className="h-10 w-10" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose <span className="text-[#710014]">BloodDoc</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with medical expertise.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="bg-gradient-to-br from-[#710014]/20 to-[#838F6F]/20 p-6 rounded-2xl border border-[#710014]/30 mb-6 mx-auto w-20 h-20 flex items-center justify-center group-hover:border-[#710014]/60 transition-all duration-300"
                >
                  <feature.icon className="h-10 w-10 text-[#710014] group-hover:text-[#838F6F] transition-colors duration-300" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#710014]/10 to-[#838F6F]/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-5xl font-bold text-[#710014] mb-2"
                >
                  {stat.number}
                </motion.div>
                <p className="text-gray-300 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Save Lives?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of hospitals and medical professionals who trust BloodDoc.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#710014] to-[#838F6F] text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 hover:shadow-2xl transition-all duration-300"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-[#710014] text-[#710014] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#710014] hover:text-white transition-all duration-300"
              >
                Contact Sales
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#710014]/30">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="bg-gradient-to-r from-[#710014] to-[#838F6F] p-2 rounded-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">BloodDoc</span>
          </motion.div>
          
          <p className="text-gray-400 mb-6">
            © 2024 BloodDoc. All rights reserved. Saving lives through technology.
          </p>
          
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-[#710014] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#710014] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#710014] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
