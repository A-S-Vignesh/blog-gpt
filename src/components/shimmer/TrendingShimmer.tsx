"use client";

export default function TrendingShimmer() {
  const items = [0, 1, 2, 3,4]; // 4 shimmer cards (1 big + 3 small)

  return (
    <div className="mb-12">
      {/* Header shimmer */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg shimmer" />
          <div className="w-32 h-6 rounded shimmer" />
        </div>
        <div className="w-20 h-5 rounded shimmer" />
      </div>

      {/* Card shimmer grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((_, index) => (
          <div
            key={index}
            className={`${index === 0 ? "md:col-span-2" : ""} h-full`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow animate-pulse flex flex-col h-full">
              {/* Image shimmer */}
              <div
                className={`${
                  index === 0 ? "h-64" : "h-48"
                } bg-gray-200 dark:bg-gray-700 shimmer`}
              />

              <div className="p-6 flex flex-col gap-4">
                {/* Tags */}
                <div className="flex gap-2">
                  <div className="w-16 h-5 rounded-full shimmer" />
                  <div className="w-14 h-5 rounded-full shimmer" />
                  <div className="w-12 h-5 rounded-full shimmer" />
                </div>

                {/* Title */}
                <div className="w-3/4 h-6 rounded shimmer" />

                {/* Excerpt */}
                <div className="w-full h-4 rounded shimmer" />
                <div className="w-2/3 h-4 rounded shimmer" />

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full shimmer" />
                    <div className="flex flex-col gap-2">
                      <div className="w-20 h-4 rounded shimmer" />
                      <div className="w-14 h-4 rounded shimmer" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-6 h-4 rounded shimmer" />
                    <div className="w-6 h-4 rounded shimmer" />
                    <div className="w-6 h-4 rounded shimmer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
