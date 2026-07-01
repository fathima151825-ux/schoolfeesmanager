import React, { useState, useEffect, useRef } from 'react';

const AdvertisementPreviewModal = ({ ad, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(ad?.duration || 10);
  const videoRef = useRef(null);

  useEffect(() => {
    if (timeLeft <= 0) { onClose(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, onClose]);

  useEffect(() => {
    if (videoRef?.current) {
      videoRef?.current?.play()?.catch(() => {});
    }
  }, []);

  const isVideo = !!ad?.video_url;
  const hasImage = !!ad?.imageUrl || !!ad?.image_url;
  const imageUrl = ad?.imageUrl || ad?.image_url;
  const videoUrl = ad?.videoUrl || ad?.video_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '9/16', maxHeight: '80vh' }}>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: (!hasImage && !isVideo) ? (ad?.bgColor || ad?.bg_color || 'linear-gradient(135deg, #c0392b, #f39c12)') : '#000' }}
        >
          {/* Full-cover image background */}
          {!isVideo && hasImage && (
            <img
              src={imageUrl}
              alt={ad?.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {/* Full-cover video background */}
          {isVideo && (
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />

          {/* Skip */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/50 text-white rounded-full px-3 py-1.5 text-xs font-medium"
          >
            Skip
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>

          {/* Timer */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-black/40 text-white rounded-full px-2 py-1 text-xs">
            <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/60" />
            </div>
            {timeLeft}s
          </div>

          {/* Title/Description overlay at bottom */}
          {(ad?.title || ad?.description) && (
            <div className="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center text-center px-6 gap-1">
              {ad?.title && <h2 className="text-xl font-bold text-white drop-shadow">{ad?.title}</h2>}
              {ad?.description && <p className="text-sm text-white/90 drop-shadow">{ad?.description}</p>}
            </div>
          )}

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
            <div
              className="h-full bg-white transition-all duration-1000"
              style={{ width: `${(((ad?.duration || 10) - timeLeft) / (ad?.duration || 10)) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

export default AdvertisementPreviewModal;
