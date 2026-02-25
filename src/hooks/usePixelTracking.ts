declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPixelEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    const standardEvents = new Set([
      "PageView",
      "ViewContent",
      "Lead",
      "CompleteRegistration",
      "InitiateCheckout",
      "AddToCart",
      "Purchase",
    ]);

    if (standardEvents.has(eventName)) {
      // Evento padrão
      if (params) window.fbq("track", eventName, params);
      else window.fbq("track", eventName);
    } else {
      // Evento custom
      window.fbq("trackCustom", eventName, params || {});
    }
  }
}
