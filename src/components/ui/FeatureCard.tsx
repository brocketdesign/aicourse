"use client";

import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-200"
    >
      <div className="text-5xl mb-4 bg-gradient-to-br from-blue-600 to-purple-600 text-transparent bg-clip-text">{icon}</div>
      <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;