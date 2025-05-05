"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface TestimonialProps {
  name: string;
  role: string;
  content: string;
  image: string;
  rating?: number;
}

const Testimonial: React.FC<TestimonialProps> = ({ name, role, content, image, rating = 5 }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="flex items-center mb-4">
        <div className="relative rounded-full mr-4 overflow-hidden border-2 border-blue-500/20 shadow-inner">
          <Image 
            src={image} 
            alt={name}
            width={60}
            height={60}
            className="rounded-full object-cover"
          />
        </div>
        <div>
          <h4 className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">{name}</h4>
          <p className="text-gray-600 text-sm">{role}</p>
        </div>
      </div>
      
      <div className="flex mb-3">
        {Array(5).fill(0).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        ))}
      </div>
      
      <p className="text-gray-700 flex-grow italic">{content}</p>
    </motion.div>
  );
};

export default Testimonial;