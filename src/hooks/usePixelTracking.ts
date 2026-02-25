declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
export function loadFacebookPixel(pixelId: string) {
  if (typeof window === "undefined") return;
  if (window.fbq) return;

  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = (f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
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
      "Contact",
      "StartTrial",
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
