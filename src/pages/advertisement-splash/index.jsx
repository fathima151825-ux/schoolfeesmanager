import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getActiveAdvertisements, trackAdView, trackAdSkip, trackAdEngagement } from '../../services/advertisementService';
import PWAInstallPrompt from '../../components/PWAInstallPrompt';

const TOTAL_SECONDS = 10;

const AdvertisementSplash = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(true);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const viewStartTimeRef = useRef(null);
  const trackedViewsRef = useRef(new Set());
  const timerActiveRef = useRef(false);
  const videoRef = useRef(null);

  const defaultAd = {
    id: 'default',
    title: 'Welcome to Sri Saraswathi Vidhya Mandir',
    description: 'Empowering students with quality education and holistic development.',
    imageUrl: '/assets/images/Untitled_design-1775296554870.png',
    bg_color: '#c0392b'
  };

  useEffect(() => {
    loadAds();
    // Show PWA prompt only on first visit
    const shown = localStorage.getItem('pwa-first-visit-shown');
    if (!shown) {
      setTimeout(() => setShowPWAPrompt(true), 500);
    }
  }, []);

  const loadAds = async () => {
    try {
      const ads = await getActiveAdvertisements();
      setAdvertisements(ads?.length > 0 ? ads : [defaultAd]);
    } catch {
      setAdvertisements([defaultAd]);
    } finally {
      setLoading(false);
      timerActiveRef.current = true;
    }
  };

  // Auto-play video when ad changes
  useEffect(() => {
    if (videoRef?.current) {
      videoRef?.current?.load();
      videoRef?.current?.play()?.catch(() => {});
    }
  }, [currentAdIndex]);

  // Track view when ad becomes visible
  useEffect(() => {
    if (loading || advertisements?.length === 0) return;
    const currentAd = advertisements?.[currentAdIndex];
    if (!currentAd || currentAd?.id === 'default') return;
    if (!trackedViewsRef?.current?.has(currentAd?.id)) {
      trackedViewsRef?.current?.add(currentAd?.id);
      trackAdView(currentAd?.id);
    }
    viewStartTimeRef.current = Date.now();
  }, [loading, currentAdIndex, advertisements]);

  const getEngagementSeconds = () => {
    if (!viewStartTimeRef?.current) return 0;
    return Math.round((Date.now() - viewStartTimeRef?.current) / 1000);
  };

  const handleSkip = useCallback(() => {
    const currentAd = advertisements?.[currentAdIndex];
    if (currentAd && currentAd?.id !== 'default') {
      trackAdSkip(currentAd?.id);
      trackAdEngagement(currentAd?.id, getEngagementSeconds());
    }
    navigate('/parent-dashboard');
  }, [navigate, advertisements, currentAdIndex]);

  const handleAutoComplete = useCallback(() => {
    const currentAd = advertisements?.[currentAdIndex];
    if (currentAd && currentAd?.id !== 'default') {
      trackAdEngagement(currentAd?.id, getEngagementSeconds());
    }
    navigate('/parent-dashboard');
  }, [navigate, advertisements, currentAdIndex]);

  // Countdown timer
  useEffect(() => {
    if (loading) return;
    if (timeLeft <= 0) {
      handleAutoComplete();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, loading, handleAutoComplete]);

  // Rotate ads if multiple
  useEffect(() => {
    if (advertisements?.length <= 1) return;
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentAdIndex(prev => (prev + 1) % advertisements?.length);
        setFadeIn(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [advertisements]);

  const currentAd = advertisements?.[currentAdIndex] || defaultAd;
  const progress = ((TOTAL_SECONDS - timeLeft) / TOTAL_SECONDS) * 100;
  const isVideo = !!currentAd?.video_url;

  return (
    <>
      <Helmet>
        <title>Advertisement - SSVM School</title>
      </Helmet>
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-hidden"
        style={{ background: currentAd?.bg_color ? `linear-gradient(135deg, ${currentAd?.bg_color}dd 0%, ${currentAd?.bg_color} 100%)` : 'linear-gradient(135deg, #c0392b 0%, #e74c3c 50%, #f39c12 100%)' }}
      >
        {/* Full-screen background image */}
        {!isVideo && currentAd?.imageUrl && (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${currentAd?.imageUrl})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: currentAd?.bg_color || '#c0392b'
            }}
          />
        )}

        {/* Decorative overlay */}
        <div className="absolute inset-0 z-[1] bg-black/40 pointer-events-none" />
        <div className="absolute inset-0 z-[1] opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Top Bar: Countdown + Skip */}
        <div className="relative z-20 flex items-center justify-between px-4 pt-safe pt-4 pb-2">
          {/* Countdown Timer */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <div className="relative w-7 h-7">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
                <circle
                  cx="14" cy="14" r="11"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - timeLeft / TOTAL_SECONDS)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{timeLeft}</span>
            </div>
            <span className="text-white text-xs font-medium">sec</span>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 border border-white/20"
          >
            <span>Skip</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>

        {/* Main Ad Content */}
        <div
          className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4"
          style={{ opacity: fadeIn ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-white/80 text-sm">Loading...</p>
            </div>
          ) : (
            <>
              {/* Video Ad */}
              {isVideo ? (
                <div className="w-full flex items-center justify-center mb-4">
                  <video
                    ref={videoRef}
                    src={currentAd?.video_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full max-w-sm md:max-w-md rounded-2xl shadow-2xl border-2 border-white/20 object-cover"
                    style={{ maxHeight: '55vh' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ) : null}

              {/* Ad Text overlay at bottom */}
              <div className="absolute bottom-20 left-0 right-0 px-6">
                <div className="text-center max-w-2xl mx-auto">
                  {currentAd?.title && (
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg leading-tight">
                      {currentAd?.title}
                    </h1>
                  )}
                  {currentAd?.description && (
                    <p className="text-base md:text-lg text-white/90 leading-relaxed drop-shadow">
                      {currentAd?.description}
                    </p>
                  )}
                </div>

                {/* Dots for multiple ads */}
                {advertisements?.length > 1 && (
                  <div className="flex gap-2 mt-4 justify-center">
                    {advertisements?.map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i === currentAdIndex ? 'bg-white w-6' : 'bg-white/40 w-2'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Progress Bar */}
        <div className="relative z-20 px-4 pb-safe pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-xs">Advertisement</span>
            <span className="text-white/70 text-xs">{Math.round(progress)}% watched</span>
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/50 text-xs text-center mt-3">Redirecting to dashboard in {timeLeft} second{timeLeft !== 1 ? 's' : ''}...</p>
        </div>
      </div>
      {/* PWA Install Prompt */}
      {showPWAPrompt && (
        <PWAInstallPrompt
          showImmediately={true}
          onDismiss={() => {
            setShowPWAPrompt(false);
            localStorage.setItem('pwa-first-visit-shown', 'true');
          }}
        />
      )}
    </>
  );
};

export default AdvertisementSplash;
