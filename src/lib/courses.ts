import { notFound } from 'next/navigation';

// Mock database simulation
const coursesData = {
  "ai-monetization": {
    _id: "ai-monetization",
    slug: "ai-monetization",
    title: "AI Monetization Mastery",
    subtitle: "Build Profitable AI Applications & Generate Passive Income",
    description: "Learn how to create, launch, and scale AI-powered products that generate real revenue. This comprehensive course takes you from basic concepts to advanced techniques that are generating millions for today's AI entrepreneurs.",
    price: 299,
    salePrice: 199,
    stripePriceId: process.env.STRIPE_AI_MONETIZATION_PRICE_ID || 'price_placeholder_ai_monetization',
    discount: 33,
    features: [
      "6 comprehensive modules with 40+ lessons",
      "Step-by-step guides for building your AI product",
      "Lifetime access to course materials",
      "Private community of AI entrepreneurs",
      "Real case studies of successful AI businesses",
      "Templates and tools worth $2,000+"
    ],
    instructor: {
      name: "Alex Johnson",
      title: "AI Entrepreneur & Consultant",
      bio: "Alex has helped over 500 businesses implement AI solutions, generating $10M+ in revenue for his clients.",
      image: "/instructors/alex.jpg"
    },
    modules: [
       {
        id: "intro",
        title: "Introduction to AI Monetization",
        description: "Learn the fundamentals of AI monetization strategies",
        icon: "✨",
        lessons: [
          "Understanding the AI marketplace",
          "7 proven business models for AI",
          "Finding your profitable AI niche",
          "Required tools and resources",
          "Setting up for success"
        ]
      },
      {
        id: "prompt-eng",
        title: "Advanced Prompt Engineering",
        description: "Master the art of crafting effective prompts for AI systems",
        icon: "💬",
        lessons: [
          "Core prompt engineering principles",
          "Creating production-quality outputs",
          "Specialized prompting for code generation",
          "Building prompt templates",
          "Prompt chaining for complex workflows",
          "Few-shot learning techniques",
          "Fine-tuning for your use case"
        ]
      },
      {
        id: "content",
        title: "AI Content Creation & Monetization",
        description: "Create valuable content across multiple platforms",
        icon: "📝",
        lessons: [
          "Text-to-video monetization",
          "Podcast automation and distribution",
          "Blog content that ranks",
          "E-book and course creation",
          "Licensing AI-generated content",
          "Content repurposing strategies"
        ]
      },
      {
        id: "agent",
        title: "Building AI Agents & Automation",
        description: "Create autonomous systems that work for you",
        icon: "🤖",
        lessons: [
          "Agent architecture fundamentals",
          "Building your first autonomous agent",
          "Multi-agent systems for complex tasks",
          "Debugging and improving agent performance",
          "Monetization strategies for AI agents",
          "Case study: $50k/month agent business",
          "Scaling your agent operations",
          "Future-proofing your AI systems"
        ]
      },
      {
        id: "marketing",
        title: "Marketing & Selling AI Products",
        description: "Acquire customers and scale your AI business",
        icon: "📊",
        lessons: [
          "Positioning your AI product",
          "Pricing strategies that work",
          "Customer acquisition channels",
          "Building viral growth mechanisms",
          "Conversion optimization for AI products",
          "Creating recurring revenue"
        ]
      },
      {
        id: "case-studies",
        title: "Advanced Case Studies",
        description: "Real-world examples of successful AI businesses",
        icon: "🔍",
        lessons: [
          "Case study: $100K/month AI SaaS",
          "Case study: AI content subscription business",
          "Case study: AI consulting practice",
          "Case study: AI-powered agency",
          "Case study: B2B AI solutions"
        ]
      },
    ]
  },
  // Add other courses here if needed
};

// Simulate fetching course data by slug
export async function getCourseBySlug(slug: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50)); 
  
  const course = coursesData[slug];
  
  if (!course) {
    notFound(); // Trigger 404 page if course not found
  }
  
  if (!course.stripePriceId || course.stripePriceId.startsWith('price_placeholder')) {
    console.warn(`Missing or placeholder Stripe Price ID for course: ${slug}`);
  }

  return course;
}

// Function to get all course slugs (for generateStaticParams)
export async function getAllCourseSlugs() {
   // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  return Object.keys(coursesData).map(slug => ({ slug }));
}
