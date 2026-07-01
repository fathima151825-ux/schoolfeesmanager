import React from 'react';

const SkipButton = ({ timeLeft, onSkip }) => {
  return (
    <button
      onClick={onSkip}
      className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 border border-white/20"
      aria-label="Skip advertisement"
    >
      <span>Skip</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 4 15 12 5 20 5 4" />
        <line x1="19" y1="5" x2="19" y2="19" />
      </svg>
    </button>
  );
};

export default SkipButton;
