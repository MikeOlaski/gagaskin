export const VALIDATION_EVENTS = [
  "landing_viewed",
  "offer_path_started",
  "ai_helper_brief_completed",
  "ai_helper_plan_requested",
  "ai_helper_plan_applied",
  "human_brief_completed",
  "build_your_own_started",
  "editor_opened",
  "reference_loaded",
  "skin_exported",
  "project_saved",
  "gallery_skin_published",
  "order_delivered",
  "order_released",
  "order_submitted",
  "waitlist_joined",
  "account_created",
] as const;

export type ValidationEventName = (typeof VALIDATION_EVENTS)[number];
export type ValidationProperties = Record<string, string | number | boolean | null | undefined>;

export type ValidationEvent = {
  name: ValidationEventName;
  timestamp: string;
  sessionId: string;
  properties: Record<string, string | number | boolean | null>;
};

const STORAGE_KEY = "gagaskin.validation.events.v1";
const SESSION_KEY = "gagaskin.validation.session.v1";
const MAX_EVENTS = 500;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function sessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "storage-unavailable";
  }
}

/**
 * Stores only compact, non-identifying product signals locally. If a host analytics
 * adapter is installed later, it can listen for the same browser event below.
 */
export function recordValidationEvent(
  name: ValidationEventName,
  properties: ValidationProperties = {},
) {
  if (typeof window === "undefined") return;
  const clean = Object.fromEntries(
    Object.entries(properties).filter(
      ([, value]) =>
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean",
    ),
  ) as ValidationEvent["properties"];
  const event: ValidationEvent = {
    name,
    timestamp: new Date().toISOString(),
    sessionId: sessionId(),
    properties: clean,
  };
  try {
    const existing = read<ValidationEvent[]>(STORAGE_KEY, []);
    const prior = existing.at(-1);
    // React development strict mode deliberately replays effects. A same-tick
    // duplicate must not inflate a product decision metric.
    if (
      prior &&
      prior.name === event.name &&
      JSON.stringify(prior.properties) === JSON.stringify(event.properties) &&
      Date.parse(event.timestamp) - Date.parse(prior.timestamp) < 1_000
    ) {
      return;
    }
    const events = [...existing, event].slice(-MAX_EVENTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Measurement must never block creation.
  }
  window.dispatchEvent(new CustomEvent("gagaskin:validation", { detail: event }));
}
