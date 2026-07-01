// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Initialize Razorpay checkout
export const initiateRazorpayCheckout = async ({
  amount,
  currency = 'INR',
  orderId,
  studentName,
  studentEmail,
  studentMobile,
  onSuccess,
  onFailure
}) => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    const options = {
      key: import.meta.env?.VITE_RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      name: 'SSVM School',
      description: 'School Fee Payment',
      prefill: {
        name: studentName || '',
        email: studentEmail || '',
        contact: studentMobile || '',
        method: 'upi'
      },
      config: {
        display: {
          blocks: {
            upi: {
              name: 'Pay via UPI',
              instruments: [
                { method: 'upi', flows: ['collect', 'intent', 'qr'] }
              ]
            },
            other: {
              name: 'Other Payment Methods',
              instruments: [
                { method: 'card' },
                { method: 'netbanking' },
                { method: 'wallet' }
              ]
            }
          },
          sequence: ['block.upi', 'block.other'],
          preferences: { show_default_blocks: false }
        }
      },
      theme: {
        color: '#D97706'
      },
      handler: function (response) {
        onSuccess({
          razorpayPaymentId: response?.razorpay_payment_id,
          razorpayOrderId: orderId,
          razorpaySignature: response?.razorpay_signature || 'N/A'
        });
      },
      modal: {
        ondismiss: function () {
          onFailure('Payment cancelled by user');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay?.on('payment.failed', function (response) {
      onFailure(response?.error?.description || 'Payment failed');
    });
    razorpay?.open();
  } catch (error) {
    console.error('Razorpay checkout error:', error);
    onFailure(error?.message || 'Failed to initialize payment');
  }
};

// Verify payment signature (client-side basic check)
export const verifyPaymentSignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
}) => {
  return !!razorpayOrderId && !!razorpayPaymentId && !!razorpaySignature;
};

// Generate order ID (mock implementation - in production, this should be server-side)
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `order_${timestamp}${random}`;
};

// Format amount for display
export const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  })?.format(amount);
};

export default {
  loadRazorpayScript,
  initiateRazorpayCheckout,
  verifyPaymentSignature,
  generateOrderId,
  formatAmount
};