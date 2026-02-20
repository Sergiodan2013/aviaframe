export default function LoadingScreen() {
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      {/* Illustration */}
      <div className="mb-8">
        <div className="relative inline-block">
          {/* Background circles - decorative */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-blue-100 rounded-full opacity-30 animate-pulse"></div>
          </div>

          {/* Airplane animation */}
          <div className="relative z-10 py-12">
            <svg
              className="w-48 h-48 mx-auto animate-bounce"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Simplified airplane */}
              <path
                d="M100 40 L120 100 L180 110 L120 120 L100 180 L80 120 L20 110 L80 100 Z"
                fill="#3b82f6"
                opacity="0.8"
              />
              <circle cx="100" cy="100" r="8" fill="#1e40af" />
            </svg>
          </div>

          {/* Icons around - Hotel, Globe, Train */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center opacity-70">
            <span className="text-2xl">🏨</span>
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center opacity-70">
            <span className="text-2xl">🌍</span>
          </div>
          <div className="absolute top-1/4 left-0 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center opacity-70">
            <span className="text-2xl">🚆</span>
          </div>
        </div>
      </div>

      {/* Text */}
      <h3 className="text-2xl font-bold text-gray-800 mb-3">
        Searching flights
      </h3>
      <p className="text-gray-600 mb-6">
        Comparing offers from multiple airlines...
      </p>

      {/* Progress bar */}
      <div className="max-w-md mx-auto">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-progress-bar"></div>
        </div>
      </div>

      {/* Add keyframe animation in parent or global CSS */}
      <style>{`
        @keyframes progress-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress-bar {
          animation: progress-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
