/** The three public offers. AI Helper and Awesome Editor are two positioning
 *  gates to the same product — the editor. Not separate features, not a test:
 *  each argues for the editor in the language of a different visitor. */
export type OfferId = "ai-helper" | "custom" | "build";
export type EditorStart = "ai-helper" | "build";

export interface Offer {
  id: OfferId;
  route: `/${string}`;
  name: string;
  levelOfHelp: string;
  /** Which editor entry mode this offer sold. Null when it does not lead to the editor. */
  editorStart: EditorStart | null;
  tone: "assist" | "human" | "build";
}

export const OFFERS: readonly Offer[] = [
  {
    id: "ai-helper",
    route: "/ai-helper",
    name: "AI Helper",
    levelOfHelp: "Help me do it",
    editorStart: "ai-helper",
    tone: "assist",
  },
  {
    id: "custom",
    route: "/custom",
    name: "Human Creator Custom Orders",
    levelOfHelp: "Do it for me",
    editorStart: null,
    tone: "human",
  },
  {
    id: "build",
    route: "/build",
    name: "Awesome Editor",
    levelOfHelp: "Let me do it",
    editorStart: "build",
    tone: "build",
  },
] as const;

export function isOfferId(value: unknown): value is OfferId {
  return typeof value === "string" && OFFERS.some((o) => o.id === value);
}

export function getOffer(id: OfferId): Offer {
  const offer = OFFERS.find((o) => o.id === id);
  if (!offer) throw new Error(`Unknown offer: ${id}`);
  return offer;
}
