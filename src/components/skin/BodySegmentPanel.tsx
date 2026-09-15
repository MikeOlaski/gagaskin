import { Eye, EyeOff, PaintBucket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PART_LABELS, PART_ORDER, type BodyPart } from "@/domain/skin/faceRegistry";
import { cn } from "@/lib/utils";
import { useEditorStore, useSelectedFace } from "@/store/editorStore";

/**
 * Additive body-part isolator for 3D edit mode. Selected parts stay in view and
 * paintable; deselected parts are hidden from the editor entirely so you can
 * reach inner surfaces. Also carries the classic/slim appendage width, which
 * changes both the model geometry and the atlas columns the arms sample.
 */
export function BodySegmentPanel({ bare = false }: { bare?: boolean } = {}) {
  const visibleParts = useEditorStore((s) => s.visibleParts);
  const togglePartVisibility = useEditorStore((s) => s.togglePartVisibility);
  const isolatePart = useEditorStore((s) => s.isolatePart);
  const showAllParts = useEditorStore((s) => s.showAllParts);
  const slimArms = useEditorStore((s) => s.slimArms);
  const setSlimArms = useEditorStore((s) => s.setSlimArms);
  const fillSelectedFace = useEditorStore((s) => s.fillSelectedFace);
  const selected = useSelectedFace();

  const visibleCount = PART_ORDER.filter((p) => visibleParts[p]).length;

  return (
    <section className={cn("p-4", !bare && "rounded-xl border border-border bg-card shadow-sm")}>
      <h2 className="text-sm font-semibold text-foreground">Body parts</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Click to add or remove parts. Hidden parts leave the editor view.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {PART_ORDER.map((part: BodyPart) => {
          const on = visibleParts[part];
          return (
            <div key={part} className="flex items-center gap-1">
              <Button
                variant={on ? "default" : "outline"}
                size="sm"
                className="flex-1 justify-start"
                aria-pressed={on}
                onClick={() => togglePartVisibility(part)}
                title={on ? `Hide ${PART_LABELS[part]}` : `Show ${PART_LABELS[part]}`}
              >
                {on ? <Eye className="mr-1 size-3.5" /> : <EyeOff className="mr-1 size-3.5" />}
                <span className="truncate text-xs">{PART_LABELS[part]}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-1.5 text-[10px]"
                onClick={() => isolatePart(part)}
                title={`Show only ${PART_LABELS[part]}`}
              >
                only
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={showAllParts} disabled={visibleCount === 6}>
          Show all
        </Button>
        <span className="text-xs text-muted-foreground">{visibleCount} of 6 in view</span>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <span className="text-xs font-semibold text-foreground">Arm &amp; leg width</span>
        <div className="mt-2 flex items-center rounded-md border border-border p-0.5">
          <Button
            variant={slimArms ? "ghost" : "default"}
            size="sm"
            className="flex-1"
            aria-pressed={!slimArms}
            onClick={() => setSlimArms(false)}
            title="Classic model — 4 pixel arms"
          >
            Classic (4px)
          </Button>
          <Button
            variant={slimArms ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            aria-pressed={slimArms}
            onClick={() => setSlimArms(true)}
            title="Slim model — 3 pixel arms"
          >
            Slim (3px)
          </Button>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!selected}
          onClick={fillSelectedFace}
          title="Fill the whole selected surface with the current colour"
        >
          <PaintBucket className="mr-1 size-3.5" />
          {selected ? `Fill ${PART_LABELS[selected.part]} ${selected.face.toLowerCase()}` : "Fill surface"}
        </Button>
      </div>
    </section>
  );
}
