"use client";

const RecentShimmer = () => {
  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg mr-3 shimmer" />
          <div className="h-6 w-40 rounded shimmer" />
        </div>
        <div className="h-4 w-20 rounded shimmer" />
      </div>

      {/* Cards */}
      <div className="space-y-6">
        {[1, 2, 3].map((_, i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 0.1}s` }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Content */}
              <div className="flex-1">
                {/* Author */}
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full mr-3 shimmer" />
                  <div>
                    <div className="h-4 w-32 rounded mb-2 shimmer" />
                    <div className="h-3 w-24 rounded shimmer" />
                  </div>
                </div>

                {/* Title */}
                <div className="h-6 w-3/4 rounded mb-3 shimmer" />

                {/* Excerpt */}
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-full rounded shimmer" />
                  <div className="h-4 w-5/6 rounded shimmer" />
                </div>

                {/* Tags */}
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-16 rounded-full shimmer" />
                  <div className="h-6 w-20 rounded-full shimmer" />
                  <div className="h-6 w-14 rounded-full shimmer" />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="h-4 w-12 rounded shimmer" />
                    <div className="h-4 w-12 rounded shimmer" />
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg shimmer" />
                    <div className="w-9 h-9 rounded-lg shimmer" />
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="hidden md:block w-48 h-48 rounded-xl shrink-0 shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      <div className="text-center mt-8">
        <div className="h-12 w-48 mx-auto rounded-xl shimmer" />
      </div>
    </div>
  );
};

export default RecentShimmer;
