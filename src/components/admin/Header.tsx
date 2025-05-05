"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminHeader() {
  const { user } = useUser();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="border-b border-black/10 dark:border-white/10 bg-background">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            {/* Mobile menu button would go here */}
          </div>

          <div className="relative">
            <div className="flex items-center rounded-md border border-black/10 dark:border-white/10 focus-within:border-blue-500 px-3 py-1.5 bg-background">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground/60 mr-2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="search"
                placeholder="Search..."
                className="bg-transparent border-none focus:outline-none w-full text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="inline-flex items-center justify-center rounded-full w-8 h-8 hover:bg-foreground/5 transition-colors"
            >
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-background border border-black/10 dark:border-white/10 rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Notifications</h3>
                      <Link
                        href="/admin/notifications"
                        className="text-xs text-blue-500 hover:text-blue-600"
                      >
                        View all
                      </Link>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    <div className="p-4 border-b border-black/10 dark:border-white/10 bg-foreground/5">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <div>
                          <p className="text-xs">
                            <span className="font-medium">New enrollment</span> - Michael
                            Chen just enrolled in "AI Monetization"
                          </p>
                          <span className="text-xs text-foreground/60 mt-1">
                            Just now
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-b border-black/10 dark:border-white/10">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                        <div>
                          <p className="text-xs">
                            <span className="font-medium">Course update</span> - Prompt
                            Engineering module was published successfully
                          </p>
                          <span className="text-xs text-foreground/60 mt-1">
                            2 hours ago
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5"></div>
                        <div>
                          <p className="text-xs">
                            <span className="font-medium">Subscription ending</span> - 3
                            student subscriptions will expire this week
                          </p>
                          <span className="text-xs text-foreground/60 mt-1">
                            1 day ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User button */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.firstName || "Admin"}</p>
              <p className="text-xs text-foreground/60">Administrator</p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}