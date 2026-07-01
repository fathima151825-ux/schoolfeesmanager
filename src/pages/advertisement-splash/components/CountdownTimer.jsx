import React from 'react';

const CountdownTimer = ({ timeLeft, totalSeconds = 10 }) => {
  return (
    <div className="absolute top-4 left-4 z-20">
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
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - timeLeft / totalSeconds)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{timeLeft}</span>
        </div>
        <span className="text-white text-xs font-medium">sec</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
