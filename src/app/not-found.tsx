import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">404</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-6"></div>
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full shadow-lg hover:shadow-xl transform transition-transform hover:scale-105"
        >
          <Home className="mr-2 h-5 w-5" />
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}
