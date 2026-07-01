import React from 'react';

const AdContent = ({ ad, fadeIn, loading, totalAds, currentIndex }) => {
  if (loading) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="mt-4 text-white/80 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center w-full h-full px-6 py-16"
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      {/* Ad Image */}
      {ad?.image_url && (
        <div className="mb-6 flex items-center justify-center">
          <img
            src={ad?.image_url}
            alt={ad?.title || 'Advertisement'}
            className="max-w-xs md:max-w-sm lg:max-w-md max-h-64 object-contain rounded-2xl shadow-2xl"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      {/* Ad Text */}
      <div className="text-center max-w-2xl">
        {ad?.title && (
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
            {ad?.title}
          </h1>
        )}
        {ad?.description && (
          <p className="text-base md:text-lg text-white/90 leading-relaxed drop-shadow">
            {ad?.description}
          </p>
        )}
      </div>
      {/* Dots indicator for multiple ads */}
      {totalAds > 1 && (
        <div className="absolute bottom-8 flex gap-2">
          {Array.from({ length: totalAds })?.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'bg-white w-6' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdContent;
