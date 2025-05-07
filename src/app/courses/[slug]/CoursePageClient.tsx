"use client"; // Mark this as a client component

import { useState, useEffect, useCallback } from "react"; // Import useCallback
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Award, Clock, BookOpen, ArrowRight, Star, ShieldCheck, Loader2, Lock } from "lucide-react"; // Added Lock
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { toast } from "sonner"; // Import toast for notifications

// Define the type for the course prop
interface Course {
  _id?: string; // Add _id if it comes from MongoDB
  slug: string;
  title: string;
  subtitle?: string; // Keep, potentially optional
  description: string;
  coverImage?: string; // Add from schema
  price: number; // Keep, represents original price in cents
  salePrice: number; // Keep, represents sale price in cents
  discount?: number; // Keep, potentially optional or calculated
  stripePriceId?: string; // Keep, optional in schema
  stripeProductId?: string; // Add from schema, optional
  authors?: string[]; // Add from schema (assuming populated as string IDs or User objects)
  features?: string[]; // Keep, present in seed data
  instructor?: { // Keep, present in component usage, potentially populated
    name: string;
    title: string;
    bio: string;
    image: string;
  };
  modules: { // Keep, represents populated modules
    id: string; // Corresponds to _id from ModuleSchema
    title: string;
    description: string;
    icon?: string; // Add icon if used, make optional
    // Update lessons to expect an array of objects with id and title
    lessons: {
      _id: string; // Use _id from LessonSchema
      title: string;
      // Add other lesson fields if needed by the client
    }[];
  }[];
  isPublished?: boolean; // Add from schema
  prerequisites?: string[]; // Add from schema
  level?: 'beginner' | 'intermediate' | 'advanced'; // Add from schema
  duration?: number; // Add from schema (total minutes)
  featured?: boolean; // Add from schema
  enrollmentCount?: number; // Add from schema
  createdAt?: string | Date; // Add from schema timestamps
  updatedAt?: string | Date; // Add from schema timestamps
}

// Re-use the testimonial and guarantee data (or fetch if needed)
const testimonials = [
  {
    name: "Michael Chen",
    role: "Software Developer",
    image: "/testimonials/michael.jpg",
    rating: 5,
    content: "Within 3 weeks of implementing what I learned, I built an AI tool that now generates $5,200/month in passive income. The ROI on this course is incredible."
  },
  {
    name: "Sarah Williams",
    role: "Content Creator",
    image: "/testimonials/sarah.jpg",
    rating: 5,
    content: "This course completely transformed my content business. I've automated 80% of my workflow and doubled my output while maintaining quality."
  },
  {
    name: "James Rodriguez",
    role: "Marketing Consultant",
    image: "/testimonials/james.jpg",
    rating: 5,
    content: "I've taken many AI courses, but this one is by far the most practical. I'm using these techniques to help my clients build AI-powered marketing systems."
  }
];

const guaranteeBenefits = [
  "Full refund if you're not satisfied within 30 days",
  "No questions asked, easy return process",
  "Keep access to module 1 even after refund"
];

export default function CoursePageClient({ course }: { course: Course }) {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'instructor'>('curriculum');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true); // Start checking immediately
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]); // State for completed lessons
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null); // Track which lesson is being updated
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  // Fetch enrollment status and progress
  const fetchEnrollmentAndProgress = useCallback(async () => {
    if (!isSignedIn || !user) {
      setCheckingEnrollment(false);
      return;
    }

    setCheckingEnrollment(true);
    try {
      // Fetch enrollment status (assuming this endpoint exists)
      const enrollmentRes = await fetch(`/api/courses/${course.slug}/check-enrollment`);
      const enrollmentData = await enrollmentRes.json();

      if (enrollmentRes.ok && enrollmentData.enrolled) {
        setIsAlreadyEnrolled(true);
        // Fetch progress only if enrolled
        const progressRes = await fetch(`/api/courses/${course.slug}/progress`);
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setCompletedLessonIds(progressData.completedLessonIds || []);
        } else {
          console.error('Failed to fetch progress:', await progressRes.text());
          toast.error("Could not load your course progress.");
        }
      } else {
        setIsAlreadyEnrolled(false);
        setCompletedLessonIds([]); // Reset progress if not enrolled
      }
    } catch (error) {
      console.error('Error checking enrollment or fetching progress:', error);
      toast.error("Error loading course details.");
      setIsAlreadyEnrolled(false); // Assume not enrolled on error
      setCompletedLessonIds([]);
    } finally {
      setCheckingEnrollment(false);
    }
  }, [isSignedIn, user, course.slug]); // Add dependencies

  useEffect(() => {
    fetchEnrollmentAndProgress();
  }, [fetchEnrollmentAndProgress]); // Use the memoized function

  const toggleModule = (moduleId: string) => {
    if (expandedModules.includes(moduleId)) {
      setExpandedModules(expandedModules.filter(id => id !== moduleId));
    } else {
      setExpandedModules([...expandedModules, moduleId]);
    }
  };

  // Function to handle marking a lesson complete
  const handleMarkLessonComplete = async (lessonId: string) => {
    if (!isAlreadyEnrolled || !lessonId) return;

    const isCompleted = completedLessonIds.includes(lessonId);
    // Optimistic UI update
    const originalCompletedIds = [...completedLessonIds];
    setUpdatingProgress(lessonId); // Show loader for this specific lesson

    if (isCompleted) {
      // Optimistically remove
      setCompletedLessonIds(prev => prev.filter(id => id !== lessonId));
    } else {
      // Optimistically add
      setCompletedLessonIds(prev => [...prev, lessonId]);
    }

    try {
      const response = await fetch(`/api/courses/${course.slug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }), // Send lessonId to mark/unmark
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const data = await response.json();
      // Update state with the actual response from the server
      setCompletedLessonIds(data.completedLessonIds || []);
      toast.success(`Lesson ${isCompleted ? 'marked incomplete' : 'marked complete'}!`);

    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error("Failed to update lesson progress.");
      // Revert optimistic update on error
      setCompletedLessonIds(originalCompletedIds);
    } finally {
      setUpdatingProgress(null); // Hide loader
    }
  };

  const handleEnroll = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // If user is already enrolled, take them to the dashboard instead
    if (isAlreadyEnrolled) {
      router.push('/dashboard');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.slug,
        }),
      });

      const data = await response.json();

      // If user is already enrolled (409 Conflict status)
      if (response.status === 409 && data.redirectUrl) {
        setIsAlreadyEnrolled(true);
        router.push(data.redirectUrl);
        return;
      }

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create Stripe session:', data.error);
        alert(`Error: ${data.error || 'Could not initiate checkout.'}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An unexpected error occurred during checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderActionButton = () => {
    if (checkingEnrollment) {
      return (
        <button className="inline-flex items-center justify-center bg-gray-200 text-gray-700 font-bold py-4 px-8 rounded-full">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Checking...
        </button>
      );
    }

    if (isAlreadyEnrolled) {
      return (
        <Link href="/dashboard" className="inline-flex items-center justify-center bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:bg-green-700 transition-colors">
          Continue Learning
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      );
    }

    return (
      <button
        onClick={handleEnroll}
        disabled={isLoading}
        className="inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          'Enroll Now - Start Building Today'
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-blue-400/30 mb-4 text-sm">
                Limited Time Offer: {course.discount}% Off
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
                {course.title}
              </h1>
              <p className="text-xl lg:text-2xl mb-6">{course.subtitle}</p>
              <p className="text-lg mb-8 text-blue-100">{course.description}</p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-300" />
                  <span>{course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0)}+ Lessons</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-300" />
                  <span>{course.modules.length} Modules</span>
                </div>
                <div className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-300" />
                  <span>Certificate</span>
                </div>
              </div>

              <div className="hidden md:block">
                {renderActionButton()}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video rounded-lg overflow-hidden shadow-2xl border-8 border-white/10">
                <Image
                  src="/course-preview.jpg"
                  alt="Course Preview"
                  width={1200}
                  height={675}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-3 px-6 rounded-lg shadow-lg transform rotate-6">
                <div className="transform -rotate-6">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <div className="text-sm mt-1">Rated 4.9/5 by 1,234 students</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile CTA */}
      <div className="md:hidden bg-white shadow-md py-4 px-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div>
            {/* Display original price as double the sale price */}
            <p className="text-sm text-gray-500 line-through">${((course.salePrice / 100) * 2).toFixed(2)}</p>
            {/* Display sale price converted from cents */}
            <p className="text-xl font-bold text-blue-600">${(course.salePrice / 100).toFixed(2)}</p>
          </div>
          {isAlreadyEnrolled ? (
            <Link href="/dashboard" className="inline-flex items-center justify-center bg-green-600 text-white font-bold py-2 px-6 rounded-full">
              Continue
            </Link>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={isLoading || checkingEnrollment}
              className="inline-flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-6 rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading || checkingEnrollment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLoading ? 'Processing...' : 'Checking...'}
                </>
              ) : (
                'Enroll Now'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex border-b mb-8">
              <button
                onClick={() => setActiveTab('curriculum')}
                className={`py-4 px-6 font-medium ${activeTab === 'curriculum' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                Curriculum
              </button>
              <button
                onClick={() => setActiveTab('instructor')}
                className={`py-4 px-6 font-medium ${activeTab === 'instructor' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                Instructor
              </button>
            </div>

            {/* Curriculum Content */}
            {activeTab === 'curriculum' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Course Curriculum</h2>
                <p className="text-lg mb-8">
                  Master the entire AI monetization process from initial concept to generating sustainable revenue.
                </p>

                {/* Course Modules */}
                <div className="space-y-4">
                  {course.modules.map((module) => {
                    // Calculate module progress
                    const moduleLessons = module.lessons || []; // Ensure lessons array exists
                    const completedInModule = moduleLessons.filter(lesson => completedLessonIds.includes(lesson._id)).length;
                    const totalInModule = moduleLessons.length;
                    const moduleProgress = totalInModule > 0 ? (completedInModule / totalInModule) * 100 : 0;

                    return (
                      // Add key prop using module.id
                      <div key={module.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mr-4">
                              {module.icon}
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold">{module.title}</h3>
                              <p className="text-gray-500 text-sm">{module.description}</p>
                              {isAlreadyEnrolled && totalInModule > 0 && (
                                <div className="mt-2 flex items-center text-xs text-gray-500">
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{ width: `${moduleProgress}%` }}
                                    ></div>
                                  </div>
                                  <span>{completedInModule}/{totalInModule} lessons</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-6 w-6 text-gray-500 transform transition-transform ${expandedModules.includes(module.id) ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {expandedModules.includes(module.id) && (
                          <div className="px-6 pb-6 border-t bg-gray-50/50">
                            <ul className="mt-4 space-y-3">
                              {/* Check if moduleLessons exists and has items */}
                              {moduleLessons && moduleLessons.length > 0 ? moduleLessons.map((lesson) => {
                                // Use lesson._id and lesson.title directly
                                const lessonId = lesson._id;
                                const lessonName = lesson.title; // Use the actual title
                                const isCompleted = completedLessonIds.includes(lessonId);
                                const isUpdating = updatingProgress === lessonId;

                                return (
                                  <li key={lessonId} className="flex items-center justify-between text-gray-700 group">
                                    <div className="flex items-center">
                                      <BookOpen className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
                                      {/* Display the actual lesson title */}
                                      <span className={`${isCompleted ? 'line-through text-gray-500' : ''}`}>{lessonName}</span>
                                      {isCompleted && <CheckCircle className="w-4 h-4 ml-2 text-green-500 flex-shrink-0" />}
                                    </div>
                                    {isAlreadyEnrolled ? (
                                      <button
                                        onClick={() => handleMarkLessonComplete(lessonId)}
                                        disabled={isUpdating}
                                        className={`ml-4 p-1 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-700 disabled:opacity-50 ${isUpdating ? 'cursor-wait' : ''}`}
                                        title={isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                                      >
                                        {isUpdating ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : isCompleted ? (
                                          <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                          <CheckCircle className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 group-hover:text-green-500" />
                                        )}
                                      </button>
                                    ) : (
                                      <Lock className="w-4 h-4 ml-4 text-gray-400 flex-shrink-0" aria-label="Enroll to access" />
                                    )}
                                  </li>
                                );
                              }) : (
                                <li className="text-gray-500 italic">No lessons in this module yet.</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instructor Content */}
            {activeTab === 'instructor' && (
              <div>
                {/* Add check for course.instructor before rendering */}
                {course.instructor ? (
                  <div className="bg-white rounded-lg shadow-sm p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                      <div className="relative w-40 h-40 flex-shrink-0">
                        <Image
                          src={course.instructor.image}
                          alt={course.instructor.name}
                          fill
                          className="rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold mb-2">{course.instructor.name}</h2>
                        <p className="text-blue-600 font-medium mb-4">{course.instructor.title}</p>
                        <p className="text-lg mb-6">{course.instructor.bio}</p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">500+</div>
                            <div className="text-gray-500">Companies Helped</div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">$10M+</div>
                            <div className="text-gray-500">Revenue Generated</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Instructor information is not available for this course.</p>
                )}
              </div>
            )}

            {/* Testimonials */}
            <section className="mt-16">
              <h2 className="text-3xl font-bold mb-8">Success Stories from Our Students</h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center mb-4">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={50}
                        height={50}
                        className="rounded-full mr-4"
                      />
                      <div>
                        <h4 className="font-bold">{testimonial.name}</h4>
                        <p className="text-gray-500 text-sm">{testimonial.role}</p>
                      </div>
                    </div>

                    <div className="flex mb-3">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>

                    <p className="text-gray-700">{testimonial.content}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Pricing Card */}
          <div className="lg:col-span-1">
            <div id="pricing" className="sticky top-24 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl font-bold">Course Price</div>
                  <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                    {course.discount}% OFF
                  </div>
                </div>
                <div className="flex items-center">
                  {/* Display original price as double the sale price */}
                  <div className="text-lg text-white/70 line-through mr-2">${((course.salePrice / 100) * 2).toFixed(2)}</div>
                  {/* Display sale price converted from cents */}
                  <div className="text-4xl font-bold">${(course.salePrice / 100).toFixed(2)}</div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">What's included:</h3>
                  <ul className="space-y-3">
                    {/* Add check for course.features before mapping */}
                    {(course.features || []).map((feature, index) => (
                      <li key={index} className="flex">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-1" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isAlreadyEnrolled ? (
                  <Link
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-colors"
                  >
                    Continue to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={isLoading || checkingEnrollment}
                    className="w-full inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-102 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading || checkingEnrollment ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isLoading ? 'Processing...' : 'Checking...'}
                      </>
                    ) : (
                      'Enroll Now'
                    )}
                  </button>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <ShieldCheck className="w-6 h-6 text-blue-600 mr-2" />
                    <h4 className="text-lg font-semibold">30-Day Money-Back Guarantee</h4>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {guaranteeBenefits.map((benefit, index) => (
                      <li key={index} className="flex">
                        <CheckCircle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-center items-center pt-2">
                  <div className="flex space-x-4">
                    <Image src="/payment/visa.svg" alt="Visa" width={40} height={25} />
                    <Image src="/payment/mastercard.svg" alt="Mastercard" width={40} height={25} />
                    <Image src="/payment/amex.svg" alt="American Express" width={40} height={25} />
                    <Image src="/payment/paypal.svg" alt="PayPal" width={40} height={25} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Build Your AI Business?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Join over 10,000 students who are already creating profitable AI applications
          </p>

          {isAlreadyEnrolled ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transform transition-all hover:scale-105"
            >
              Go to Your Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={isLoading || checkingEnrollment}
              className="inline-flex items-center justify-center bg-white text-blue-900 hover:bg-gray-100 font-bold py-4 px-10 rounded-full shadow-xl transform transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading || checkingEnrollment ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-900" />
                  {isLoading ? 'Processing...' : 'Checking...'}
                </>
              ) : (
                'Get Started Today'
              )}
            </button>
          )}
          <p className="mt-6 text-blue-200 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 mr-2" />
            30-Day Money-Back Guarantee
          </p>
        </div>
      </section>
    </div>
  );
}

