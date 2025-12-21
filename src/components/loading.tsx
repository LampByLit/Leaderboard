export function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="material-card p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="ml-3 flex-1">
                <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Book Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="material-card p-6">
            <div className="flex items-start space-x-4">
              {/* Rank Badge Skeleton */}
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              
              {/* Book Cover Skeleton */}
              <div className="w-20 h-28 bg-gray-200 rounded-md animate-pulse"></div>
              
              {/* Book Info Skeleton */}
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse"></div>
                
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 