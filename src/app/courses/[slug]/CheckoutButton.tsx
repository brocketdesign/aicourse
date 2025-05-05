"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  courseId: string;
  price: number;
  priceId?: string;
}

export default function CheckoutButton({ courseId, price, priceId }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isSignedIn } = useUser();
  const router = useRouter();
  
  const handleCheckout = async () => {
    setErrorMessage(null);
    if (!isSignedIn) {
      const currentPath = window.location.pathname;
      return router.push(`/sign-in?redirectUrl=${encodeURIComponent(currentPath)}`);
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, requestedPriceId: priceId }),
      });
      const data = await response.json();
      if (response.status === 409 && data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.message || data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <svg 
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </>
        ) : (
          <>Enroll for ${price / 100}</>
        )}
      </button>
      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}