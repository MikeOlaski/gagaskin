import { isOfferId, type OfferId } from "@/lib/offers";

export type GateMode = "register" | "waitlist";
export type SourceOffer = OfferId | "unknown";
export type Platform = "java" | "bedrock" | "unsure";

const PLATFORMS: readonly Platform[] = ["java", "bedrock", "unsure"];

/** Capacity is decided server-side by registration_open(). A null means the
 *  check failed; a full waitlist is the safe direction to fail in, because the
 *  handle_new_user trigger would reject the signup anyway. */
export function resolveGateMode(open: boolean | null): GateMode {
  return open === true ? "register" : "waitlist";
}

export function parseOfferParam(raw: unknown): SourceOffer {
  return isOfferId(raw) ? raw : "unknown";
}

export function parsePlatform(raw: unknown): Platform {
  return PLATFORMS.includes(raw as Platform) ? (raw as Platform) : "unsure";
}

/** Shape passed as supabase.auth.signUp options.data, read by handle_new_user(). */
export function signupMetadata(offer: unknown, platform: unknown) {
  return {
    source_offer: parseOfferParam(offer),
    platform: parsePlatform(platform),
  };
}
