const CHANNEL = "grok-preview-bridge";
const VERSION = 1;
const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";

function isSafePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
  try {
    return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
  } catch {
    return false;
  }
}

function parentOrigin(): string | null {
  if (typeof window === "undefined" || window.parent === window) return null;
  const ancestor =
    typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0
      ? location.ancestorOrigins[0]
      : null;
  const ref = document.referrer;
  const host = window.location.hostname;
  const candidates = [ancestor, ref ? new URL(ref).origin : null].filter(Boolean) as string[];
  for (const origin of candidates) {
    try {
      const u = new URL(origin);
      if (u.hostname.endsWith(".grok.com") || u.hostname === "grok.com" || u.hostname === "localhost" || host.includes("grok")) {
        return origin;
      }
      if (u.protocol === "https:" || u.protocol === "http:") return origin;
    } catch {
      /* skip */
    }
  }
  return candidates[0] ?? null;
}

export function installPreviewBridge() {
  const origin = parentOrigin();
  if (!origin) return () => {};

  const post = (message: object) => window.parent.postMessage(message, origin);
  const reportLocation = () =>
    post({
      channel: CHANNEL,
      version: VERSION,
      type: "location",
      path: window.location.pathname || "/",
      search: window.location.search,
      hash: window.location.hash,
    });
  const announce = () => {
    reportLocation();
    post({
      channel: CHANNEL,
      version: VERSION,
      type: "routes",
      paths: ["/", "/app", "/app/people", "/app/meds", "/app/calendar", "/app/tasks", "/app/journal", "/app/team"],
    });
    post({ channel: CHANNEL, version: VERSION, type: "ready" });
  };

  try {
    const current = window.history.state;
    const alreadyTagged = current && typeof current === "object" && ROOT_STATE_KEY in current;
    if (!alreadyTagged) {
      const marked = current && typeof current === "object" ? { ...current, [ROOT_STATE_KEY]: window.history.length <= 1 } : { [ROOT_STATE_KEY]: true };
      window.history.replaceState(marked, "", window.location.href);
    }
  } catch {
    /* ignore */
  }

  const onMessage = (event: MessageEvent) => {
    if (event.source !== window.parent || event.origin !== origin) return;
    const data = event.data;
    if (!data || data.channel !== CHANNEL || data.version !== VERSION) return;
    if (data.type === "hello") {
      announce();
      return;
    }
    if (data.type === "navigate" && typeof data.path === "string" && isSafePath(data.path)) {
      window.history.pushState(window.history.state, "", data.path);
      window.dispatchEvent(new PopStateEvent("popstate"));
      queueMicrotask(reportLocation);
    }
    if (data.type === "history" && (data.delta === -1 || data.delta === 1)) {
      const state = window.history.state;
      if (data.delta === -1 && state && state[ROOT_STATE_KEY] === true) return;
      window.history.go(data.delta);
    }
  };

  window.addEventListener("message", onMessage);
  window.addEventListener("popstate", reportLocation);
  announce();
  return () => {
    window.removeEventListener("message", onMessage);
    window.removeEventListener("popstate", reportLocation);
  };
}
