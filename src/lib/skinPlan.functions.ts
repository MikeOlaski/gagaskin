import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  /** downscaled reference image as a data URL (image/png or image/jpeg) */
  imageDataUrl: z.string().min(32).max(4_000_000),
  palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(24),
  faceIds: z.array(z.string()).min(1).max(64),
  style: z.string().max(200).optional(),
});

const SYSTEM = `You design Minecraft skin paint plans.
The skin is a 64x64 atlas made of 36 faces (6 body parts x 6 faces).
Given a reference image, decide for EVERY face id supplied either:
- "source": a normalized crop {x,y,w,h} (0..1, image space) whose content should be
  scaled into that face, or
- "color": a flat "#rrggbb" fill.
Also give each face a "brightness" multiplier (0.2-2, use ~1 for front faces,
0.8-0.9 for back/side faces, 1.05 for tops, 0.7 for bottoms) and a short "note".
Left and right limbs are independent: plan them separately and mirror crops when
the subject is symmetric. Keep wrapping continuous: a limb's LEFT/RIGHT/BACK crops
should come from near its FRONT crop. Reply with JSON only.`;

export interface AiPlanResult {
  ok: boolean;
  plan?: unknown;
  error?: string;
  status?: number;
}

export const generateSkinPlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AiPlanResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "AI is not configured for this project." };

    const userText = [
      `Face ids: ${data.faceIds.join(", ")}`,
      data.palette.length ? `Extracted palette: ${data.palette.join(", ")}` : "",
      data.style ? `Style guidance from the user: ${data.style}` : "",
      `Return JSON: {"title":string,"summary":string,"faces":[{"faceId":string,"source":{"x":number,"y":number,"w":number,"h":number},"color":"#rrggbb","brightness":number,"note":string}]}`,
    ]
      .filter(Boolean)
      .join("\n");

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                { type: "image_url", image_url: { url: data.imageDataUrl } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
    } catch {
      return { ok: false, error: "Could not reach the AI service. Try again." };
    }

    if (!response.ok) {
      const body = await response.text();
      let message = body.slice(0, 300);
      try {
        const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
        message = parsed.error?.message ?? parsed.message ?? message;
      } catch {
        /* keep raw text */
      }
      if (response.status === 429) {
        return { ok: false, status: 429, error: "AI is rate limited right now — try again shortly." };
      }
      if (response.status === 402) {
        return { ok: false, status: 402, error: message || "AI credits are exhausted for this workspace." };
      }
      if (response.status === 403) {
        return { ok: false, status: 403, error: message || "AI access is blocked by workspace policy." };
      }
      return { ok: false, status: response.status, error: message || "AI request failed." };
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    try {
      return { ok: true, plan: JSON.parse(content) };
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return { ok: true, plan: JSON.parse(match[0]) };
        } catch {
          /* fall through */
        }
      }
      return { ok: false, error: "The AI returned an unreadable plan. Try again." };
    }
  });
