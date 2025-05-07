"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { SignInButton, SignedOut } from '@clerk/nextjs';
import { ArrowRight, Clock, Calendar, DollarSign, Globe, Sparkles, Laptop, CheckCircle, Gift, Users, XCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// UI Components
import Testimonial from "@/components/ui/Testimonial";
import FeatureCard from "@/components/ui/FeatureCard";
import CourseModulePreview from "@/components/course/CourseModulePreview";

// Sample course modules based on our plan
const courseModules = [
  {
    id: "intro",
    title: "Introduction to AI Monetization",
    description: "Learn the fundamentals of AI monetization strategies",
    icon: "✨",
    lessons: 5,
    duration: 45,
  },
  {
    id: "prompt-eng",
    title: "Prompt Engineering",
    description: "Master the art of crafting effective prompts for AI systems",
    icon: "💬",
    lessons: 7,
    duration: 60,
  },
  {
    id: "content",
    title: "Content Creation",
    description: "Create podcasts, videos, and written content with AI",
    icon: "📝",
    lessons: 6,
    duration: 55,
  },
  {
    id: "agent",
    title: "AI Agent Automation",
    description: "Build autonomous AI agents to automate your workflow",
    icon: "🤖",
    lessons: 8,
    duration: 70,
  },
  {
    id: "marketing",
    title: "Marketing Strategies",
    description: "Learn how to market and sell AI products effectively",
    icon: "📊",
    lessons: 6,
    duration: 50,
  },
  {
    id: "case-studies",
    title: "Advanced Case Studies",
    description: "Real-world examples of successful AI businesses",
    icon: "🔍",
    lessons: 5,
    duration: 65,
  },
];

// Sample testimonials
const testimonials = [
  {
    name: "Alex Johnson",
    role: "Entrepreneur",
    image: "/testimonials/alex.jpg",
    content:
      "This course completely transformed my business. I've been able to create AI tools that generate $10K/month in passive income.",
  },
  {
    name: "Sarah Williams",
    role: "Content Creator",
    image: "/testimonials/sarah.jpg",
    content:
      "The AI content creation strategies I learned here have cut my production time in half while improving quality. Game changer!",
  },
  {
    name: "Michael Chen",
    role: "Developer",
    image: "/testimonials/michael.jpg",
    content:
      "As a developer, I was skeptical about AI tools, but this course showed me how to leverage them to build products faster than ever.",
  },
];

// Sample Bonus Data
const bonuses = [
  { title: "Private Community Access", description: "Network with fellow students, share wins, and get support in our exclusive Discord server.", icon: Users },
  { title: "Prompt Library Vault", description: "Get access to 100+ battle-tested prompts for various AI tasks (content, code, marketing).", icon: Sparkles },
  { title: "Monthly Live Q&A Calls", description: "Join live sessions with the instructor to ask questions and get personalized feedback.", icon: Calendar },
  { title: "Resource Toolkit", description: "A curated list of the best AI tools, platforms, and resources to accelerate your progress.", icon: Laptop },
];

export default function Home() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            <span className="text-sm md:text-base font-medium">Limited Time Offer: 30% Off Early Access - Launching May 15th!</span>
          </div>
          <div className="hidden md:flex items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center bg-white text-blue-600 hover:bg-blue-50 py-1 px-4 rounded-full text-sm font-medium cursor-pointer transition-all duration-300">
                  Sign In
                  <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <motion.section 
        ref={targetRef}
        style={{ opacity, scale }}
        className="relative h-[calc(100vh_+_100px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background to-background/80 pt-5"
      >
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6 text-5xl md:text-7xl font-extrabold"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Build & Monetize AI Applications
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-muted-foreground"
          >
            Stop dreaming, start building. Learn how to create profitable AI tools, content, and automated businesses in our comprehensive, hands-on course. Go from idea to income faster than you thought possible.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              href="/courses/ai-monetization" 
              className="btn-primary bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-transform hover:scale-105"
            >
              Enroll Now
            </Link>
            <Link 
              href="#curriculum" 
              className="btn-secondary border-2 border-gray-300 hover:border-gray-400 py-3 px-8 rounded-full font-bold transition-all"
            >
              View Curriculum
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
            className="mt-16"
          >
          </motion.div>
        </div>
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent -z-10" />
      </motion.section>

      {/* Features Section - "What You'll Learn" */}
      <section className="py-24 bg-background/95">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Unlock Your AI Potential</span>
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">Go from zero to building profitable AI applications with our step-by-step modules:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="💰"
              title="Monetization Models"
              description="Discover 7+ proven strategies to generate recurring revenue from your AI creations."
            />
            <FeatureCard
              icon="🧠"
              title="Expert Prompt Engineering"
              description="Master the art of crafting prompts that unlock AI's full potential for content, code, and more."
            />
            <FeatureCard
              icon="🚀"
              title="Rapid Product Development"
              description="Build & launch functional AI products in weeks, attracting your first paying customers quickly."
            />
            <FeatureCard
              icon="🔄"
              title="Autonomous AI Agents"
              description="Create 'set-and-forget' AI systems that automate tasks and run parts of your business 24/7."
            />
            <FeatureCard
              icon="📱"
              title="Multi-Platform Deployment"
              description="Reach a wider audience by deploying your AI solutions across web, mobile, and social channels."
            />
            <FeatureCard
              icon="📊"
              title="Data-Driven Optimization"
              description="Learn to analyze performance and continuously improve your AI tools for maximum profit."
            />
          </div>
        </div>
      </section>

      {/* Who Is This Course For? Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Is This Course Right For You?</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-12 rounded-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 text-green-800 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" /> This course is PERFECT for:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-green-700">
                <li>Aspiring Entrepreneurs wanting to build AI-powered businesses.</li>
                <li>Developers looking to integrate AI and build products faster.</li>
                <li>Content Creators seeking to automate and scale production.</li>
                <li>Marketers aiming to leverage AI for campaigns and growth.</li>
                <li>Freelancers wanting to offer high-value AI services.</li>
                <li>Anyone curious about making money with practical AI applications.</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 text-red-800 flex items-center">
                <XCircle className="w-6 h-6 mr-2 text-red-600" /> This course might NOT be for you if:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-red-700">
                <li>You're looking for a deep theoretical dive into AI research.</li>
                <li>You expect to get rich overnight without putting in the work.</li>
                <li>You're unwilling to experiment and learn new tools.</li>
                <li>You're only interested in using basic AI chatbots like ChatGPT.</li>
                <li>You need advanced enterprise-level AI implementation guidance.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* New Dream Life Section */}
      <section className="py-24 bg-gradient-to-b from-blue-900 via-purple-900 to-black text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">Imagine Your New Life, Powered by AI</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mb-16 rounded-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-black/80 backdrop-blur-lg p-8 rounded-xl border border-white/20 shadow-xl flex flex-col">
              <DollarSign className="w-10 h-10 mb-4 text-yellow-400" />
              <h3 className="text-2xl font-bold mb-3 text-white">$3K+ Monthly Passive Income</h3>
              <p className="text-gray-300 flex-grow">Build automated AI systems that generate revenue around the clock, even while you sleep.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-black/80 backdrop-blur-lg p-8 rounded-xl border border-white/20 shadow-xl flex flex-col">
              <Clock className="w-10 h-10 mb-4 text-green-400" />
              <h3 className="text-2xl font-bold mb-3 text-white">Reclaim Your Time</h3>
              <p className="text-gray-300 flex-grow">Let AI handle the grunt work. Spend your time on what truly matters – family, hobbies, or your next big idea.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-black/80 backdrop-blur-lg p-8 rounded-xl border border-white/20 shadow-xl flex flex-col">
              <Globe className="w-10 h-10 mb-4 text-blue-400" />
              <h3 className="text-2xl font-bold mb-3 text-white">Work From Anywhere</h3>
              <p className="text-gray-300 flex-grow">Your office is wherever your laptop is. Run your AI business from a beach, a mountain cabin, or your home.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-black/80 backdrop-blur-lg p-8 rounded-xl border border-white/20 shadow-xl flex flex-col">
              <Laptop className="w-10 h-10 mb-4 text-purple-400" />
              <h3 className="text-2xl font-bold mb-3 text-white">Master Future-Proof Skills</h3>
              <p className="text-gray-300 flex-grow">Acquire highly valuable AI development and monetization skills, positioning yourself as a leader in the new economy.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-black/80 backdrop-blur-lg p-8 rounded-xl border border-white/20 shadow-xl flex flex-col">
              <Calendar className="w-10 h-10 mb-4 text-orange-400" />
              <h3 className="text-2xl font-bold mb-3 text-white">Design Your Ideal Week</h3>
              <p className="text-gray-300 flex-grow">Escape the rigid 9-to-5. Structure your work around your life, priorities, and peak productivity times.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-black/80 backdrop-blur-lg p-8 rounded-xl border border-white/20 shadow-xl flex flex-col">
              <Sparkles className="w-10 h-10 mb-4 text-pink-400" />
              <h3 className="text-2xl font-bold mb-3 text-white">Focus on Creative Impact</h3>
              <p className="text-gray-300 flex-grow">Automate repetitive tasks and dedicate your energy to innovation, strategy, and building things you love.</p>
            </div>
          </div>
          <div className="text-center mt-16">
            <Link
              href="/courses/ai-monetization"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transform transition-transform hover:scale-105 inline-flex items-center text-lg"
            >
              Start Building Your Future Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="mt-4 text-gray-400 text-sm">Join hundreds of others transforming their lives with AI.</p>
          </div>
        </div>
      </section>

      {/* Curriculum Preview Section */}
      <section id="curriculum" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Course Curriculum</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-6 rounded-full"></div>
          <p className="text-center max-w-2xl mx-auto mb-12 text-muted-foreground text-lg">
            Our comprehensive 6-module course takes you from foundational concepts to advanced AI monetization strategies.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courseModules.map((module) => (
              <CourseModulePreview
                key={module.id}
                title={module.title}
                description={module.description}
                icon={module.icon}
                lessons={module.lessons}
                duration={module.duration}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive Bonuses Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Enroll Today & Get These Exclusive Bonuses</span>
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">Valued at over $497, yours free when you join now!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {bonuses.map((bonus, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-border text-center flex flex-col items-center">
                <bonus.icon className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{bonus.title}</h3>
                <p className="text-muted-foreground text-sm flex-grow">{bonus.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-background/95">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Real Results from Real Students</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-12 rounded-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Testimonial
                key={index}
                name={testimonial.name}
                role={testimonial.role}
                content={testimonial.content}
                image={testimonial.image}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-900 via-blue-900 to-black text-white">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Stop Waiting, Start Creating Your AI Future</h2>
          <p className="text-xl max-w-3xl mx-auto mb-10 text-gray-300">
            Enroll today and gain instant access to the tools, knowledge, community, and bonuses you need to build profitable AI applications.
          </p>
          <div className="flex flex-col items-center">
            <Link
              href="/courses/ai-monetization"
              className="btn-primary bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-12 rounded-full shadow-xl transform transition-transform hover:scale-105 mb-8 text-lg"
            >
              Enroll Now & Get 30% Off + Bonuses
            </Link>
            <div className="bg-white/10 border border-green-400 rounded-lg p-6 max-w-md mx-auto shadow-lg backdrop-blur-sm">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400" />
              <h4 className="text-xl font-semibold mb-2 text-white">Our 30-Day Money-Back Guarantee</h4>
              <p className="text-sm text-gray-300">
                Try the entire course for 30 days. If you're not completely satisfied with the value and results, simply email us, and we'll issue a full, prompt refund. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
