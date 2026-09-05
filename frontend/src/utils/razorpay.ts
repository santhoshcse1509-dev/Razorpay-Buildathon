/**
 * Razorpay SDK Dynamic Loader & Helpers
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // If already loaded on window
  if (window.Razorpay) {
    return true;
  }

  // Check if script tag is already in DOM
  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    // Wait up to 3 seconds for it to initialize
    for (let i = 0; i < 30; i++) {
      if (window.Razorpay) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Dynamically inject script
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Failed to load Razorpay checkout script from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
