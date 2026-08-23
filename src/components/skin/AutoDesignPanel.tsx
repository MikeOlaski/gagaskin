import { Check, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FACE_BY_ID, PART_LABELS } from "@/domain/skin/faceRegistry";
import { useEditorStore } from "@/store/editorStore";

/**
 * Ingests the uploaded reference image and produces a full-skin paint plan —
 * either deterministic (offline geometry + palette) or AI-designed — which the
 * user reviews before it is applied to the canonical 64x64 buffer.
 */
export function AutoDesignPanel() {
  const [style, setStyle] = useState("");
  const reference = useEditorStore((s) => s.reference);
  const plan = useEditorStore((s) => s.plan);
  const planLoading = useEditorStore((s) => s.planLoading);
  const planError = useEditorStore((s) => s.planError);
  const buildAutoPlan = useEditorStore((s) => s.buildAutoPlan);
  const requestAiPlan = useEditorStore((s) => s.requestAiPlan);
  const applyCurrentPlan = useEditorStore((s) => s.applyCurrentPlan);
  const clearPlan = useEditorStore((s) => s.clearPlan);

  const onApply = () => {
    if (!plan) return;
    applyCurrentPlan();
    toast.success(`Painted ${plan.faces.length} faces from "${plan.title}"`);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Auto-design from image</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Turns the reference into a plan for every one of the 36 faces, then paints it as a single
        undoable step.
      </p>

      {!reference ? (
        <p className="mt-3 text-xs text-muted-foreground">Upload a reference image first.</p>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            <Label htmlFor="auto-style" className="text-xs text-muted-foreground">
              Style guidance (AI only, optional)
            </Label>
            <Input
              id="auto-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g. keep the hoodie, dark denim legs"
              className="h-8 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={buildAutoPlan} disabled={planLoading}>
                <Wand2 className="mr-1 size-3.5" /> Auto-map
              </Button>
              <Button
                size="sm"
                onClick={() => void requestAiPlan(style.trim() || undefined)}
                disabled={planLoading}
              >
                {planLoading ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 size-3.5" />
                )}
                AI plan
              </Button>
            </div>
          </div>

          {planError ? (
            <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {planError}
            </p>
          ) : null}

          {plan ? (
            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">{plan.title}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {plan.origin === "ai" ? "AI designed" : "Deterministic"} · {plan.faces.length}{" "}
                    faces
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Discard plan" onClick={clearPlan}>
                  <X className="size-4" />
                </Button>
              </div>
              {plan.summary ? (
                <p className="mt-2 text-xs text-muted-foreground">{plan.summary}</p>
              ) : null}

              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
                {plan.faces.map((fp) => {
                  const face = FACE_BY_ID[fp.faceId];
                  return (
                    <li key={fp.faceId} className="flex items-center gap-2 font-mono text-[11px]">
                      <span
                        className="size-3 shrink-0 rounded-sm border border-border"
                        style={{ background: fp.color ?? "transparent" }}
                      />
                      <span className="text-foreground">
                        {face ? `${PART_LABELS[face.part]} ${face.face}` : fp.faceId}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {fp.source
                          ? `crop ${fp.source.x.toFixed(2)},${fp.source.y.toFixed(2)} ${fp.source.w.toFixed(2)}×${fp.source.h.toFixed(2)}`
                          : `flat ${fp.color}`}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Button size="sm" className="mt-3 w-full" onClick={onApply}>
                <Check className="mr-1 size-3.5" /> Apply plan to skin
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
