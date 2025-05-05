// Using CommonJS require syntax for better compatibility
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Course schema directly in the script
const LessonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  contentType: { 
    type: String, 
    required: true, 
    enum: ['text', 'video', 'audio', 'quiz', 'code', 'chat'] 
  },
  mediaUrl: { type: String },
  order: { type: Number, required: true },
  duration: { type: Number },
  isPublished: { type: Boolean, default: false }
});

const ModuleSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, required: true },
  lessons: [LessonSchema]
});

const CourseSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  coverImage: { type: String, required: true },
  price: { type: Number, required: true },
  stripePriceId: { type: String },
  stripeProductId: { type: String },
  authors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  modules: [ModuleSchema],
  isPublished: { type: Boolean, default: false },
  prerequisites: [{ type: String }],
  level: { 
    type: String, 
    required: true, 
    enum: ['beginner', 'intermediate', 'advanced'] 
  },
  duration: { type: Number },
  featured: { type: Boolean, default: false },
  enrollmentCount: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

// Sample course data
const aiCourse = {
  title: "AI Monetization Masterclass",
  slug: "ai-monetization",
  description: "Learn how to create profitable AI tools, content, and businesses in our comprehensive course led by industry experts.",
  coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
  price: 19900, // $199.00 in cents
  level: "intermediate",
  duration: 345, // Total minutes
  featured: true,
  enrollmentCount: 0,
  prerequisites: [
    "Understand the fundamentals of AI technologies",
    "Build profitable products with AI integration",
    "Create content that outperforms the competition",
    "Automate your business with AI agents",
    "Scale your AI products to maximize revenue",
    "Use real-world successful case studies"
  ],
  modules: [
    {
      title: "Introduction to AI Monetization",
      description: "Learn the fundamentals of AI monetization strategies",
      order: 1,
      lessons: [
        {
          title: "Understanding the AI Landscape",
          description: "An overview of current AI technologies and opportunities",
          content: "In this lesson, we'll explore the current state of AI technology...",
          contentType: "text",
          order: 1,
          duration: 10,
          isPublished: true
        },
        {
          title: "7 Business Models for AI",
          description: "Discover the most effective ways to monetize AI",
          content: "There are seven proven business models that work well with AI...",
          contentType: "video",
          mediaUrl: "https://example.com/videos/business-models.mp4",
          order: 2,
          duration: 15,
          isPublished: true
        },
        {
          title: "Market Research Strategies",
          description: "Finding profitable niches for AI products",
          content: "Before building any product, you need to validate the market...",
          contentType: "text",
          order: 3,
          duration: 20,
          isPublished: true
        }
      ]
    },
    {
      title: "Prompt Engineering",
      description: "Master the art of crafting effective prompts for AI systems",
      order: 2,
      lessons: [
        {
          title: "Principles of Effective Prompting",
          description: "Core concepts for creating powerful prompts",
          content: "The key to getting the best outputs from AI systems is...",
          contentType: "text",
          order: 1,
          duration: 25,
          isPublished: true
        },
        {
          title: "Advanced Prompt Patterns",
          description: "Templates and techniques for consistent results",
          content: "These advanced prompt patterns will help you achieve predictable outputs...",
          contentType: "video",
          mediaUrl: "https://example.com/videos/prompt-patterns.mp4",
          order: 2,
          duration: 30,
          isPublished: true
        },
        {
          title: "Prompt Engineering Workshop",
          description: "Hands-on practice creating effective prompts",
          content: "In this workshop, we'll walk through real examples of prompt engineering...",
          contentType: "chat",
          order: 3,
          duration: 45,
          isPublished: true
        }
      ]
    },
    {
      title: "Content Creation",
      description: "Create podcasts, videos, and written content with AI",
      order: 3,
      lessons: [
        {
          title: "AI-Assisted Writing Workflows",
          description: "Streamline your writing process with AI tools",
          content: "This workflow will help you create high-quality written content in half the time...",
          contentType: "text",
          order: 1,
          duration: 20,
          isPublished: true
        },
        {
          title: "Podcast Production with AI",
          description: "Using AI for script writing, editing, and production",
          content: "We'll cover the entire podcast creation process using AI tools...",
          contentType: "audio",
          mediaUrl: "https://example.com/audio/podcast-production.mp3",
          order: 2,
          duration: 35,
          isPublished: true
        },
        {
          title: "YouTube Script Generation",
          description: "Create engaging video scripts with AI assistance",
          content: "In this lesson, you'll learn my framework for creating compelling video scripts...",
          contentType: "video",
          mediaUrl: "https://example.com/videos/youtube-scripts.mp4",
          order: 3,
          duration: 25,
          isPublished: true
        }
      ]
    },
    {
      title: "AI Agent Automation",
      description: "Build autonomous AI agents to automate your workflow",
      order: 4,
      lessons: [
        {
          title: "Agent Architecture Fundamentals",
          description: "Understanding the structure of effective AI agents",
          content: "AI agents consist of several key components that work together...",
          contentType: "text",
          order: 1,
          duration: 15,
          isPublished: true
        },
        {
          title: "Building Your First Agent",
          description: "Step-by-step guide to creating an autonomous agent",
          content: "Follow along as we build a simple but powerful autonomous agent...",
          contentType: "code",
          order: 2,
          duration: 40,
          isPublished: true
        },
        {
          title: "Advanced Agent Techniques",
          description: "Taking your AI agents to the next level",
          content: "These advanced techniques will make your agents more robust and capable...",
          contentType: "video",
          mediaUrl: "https://example.com/videos/advanced-agents.mp4",
          order: 3,
          duration: 30,
          isPublished: true
        }
      ]
    }
  ]
};

async function seedCourse() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    console.log('Connecting to MongoDB at:', uri);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully');

    // Create the Course model directly in the script
    const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

    // Delete all existing courses
    console.log('Deleting all existing courses...');
    const deleteResult = await Course.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} courses`);

    // Create the new course
    const course = await Course.create(aiCourse);
    console.log('Course created successfully with ID:', course._id);

  } catch (error) {
    console.error('Error seeding course:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedCourse();