import React, { useState, useEffect } from 'react';
import { X, Download, Home, Wifi, Share, Plus } from 'lucide-react';
import AppImage from './AppImage';

const isIOS = () => {
  return /iphone|ipad|ipod/i?.test(navigator.userAgent) && !window.MSStream;
};

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true;
};

const PWAInstallPrompt = ({ showImmediately = false, onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installOutcome, setInstallOutcome] = useState(null);
  const [iosDevice, setIosDevice] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    setIosDevice(isIOS());

    const handler = (e) => {
      e?.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  useEffect(() => {
    if (isInstalled) return;
    if (showImmediately) {
      setShowPrompt(true);
    }
  }, [showImmediately, isInstalled]);

  const handleInstallClick = async () => {
    if (iosDevice) {
      // iOS: show instructions, don't close
      return;
    }

    if (!deferredPrompt) {
      // No deferred prompt available — browser may not support it
      // or it was already used. Close and let browser handle.
      handleClose();
      return;
    }

    setIsInstalling(true);
    try {
      // Show the native install prompt
      await deferredPrompt?.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt?.userChoice;
      setInstallOutcome(outcome);
      setDeferredPrompt(null);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        // User dismissed native dialog — keep our modal open so they can try again later
        setIsInstalling(false);
      }
    } catch (err) {
      console.error('Install prompt error:', err);
      setIsInstalling(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    onDismiss?.();
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-700 to-red-500 px-6 pt-8 pb-6 text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg p-2">
            <AppImage
              src="/assets/images/Untitled_design-1775296554870.png"
              alt="Sri Saraswathi Vidhya Mandir School Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-white font-bold text-xl">Add to Home Screen</h2>
          <p className="text-white/80 text-sm mt-1">Install SSVM Fees App for quick access</p>
        </div>

        {/* iOS Instructions */}
        {iosDevice ? (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700 text-center">To install on your iPhone/iPad:</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 font-bold text-sm">1</span>
              </div>
              <div className="flex items-center gap-2">
                <Share className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Tap the <span className="font-semibold">Share</span> button at the bottom of Safari</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 font-bold text-sm">2</span>
              </div>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="text-sm text-gray-700">Tap <span className="font-semibold">"Add"</span> to confirm</p>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={handleClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Got it
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Features */}
            <div className="px-6 py-5 space-y-3">
              {installOutcome === 'accepted' ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Home className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="text-green-700 font-semibold">App installed successfully!</p>
                  <p className="text-gray-500 text-sm mt-1">Find SSVM on your home screen</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Wifi className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Works Offline</p>
                      <p className="text-xs text-gray-500">Access fee info even without internet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Home Screen Access</p>
                      <p className="text-xs text-gray-500">Launch instantly like a native app</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Download className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">No App Store Needed</p>
                      <p className="text-xs text-gray-500">Install directly from your browser</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {installOutcome !== 'accepted' && (
              <div className="px-6 pb-6 flex flex-col gap-2">
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isInstalling ? 'Installing…' : 'Install App'}
                </button>
                <button
                  onClick={handleClose}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  Maybe Later
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;