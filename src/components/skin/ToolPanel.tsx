import {
  Copy,
  Droplet,
  Eraser,
  FlipHorizontal2,
  FlipVertical2,
  Hand,
  type LucideIcon,
  MousePointer2,
  PaintBucket,
  Pencil,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { OPPOSITE_PART, PART_LABELS } from "@/domain/skin/faceRegistry";
import { cn } from "@/lib/utils";
import { useEditorStore, useSelectedFace, type Tool } from "@/store/editorStore";

export const TOOLS: Array<{ id: Tool; label: string; icon: LucideIcon; shortcut: string }> = [
  { id: "select", label: "Select", icon: MousePointer2, shortcut: "V" },
  { id: "pencil", label: "Pencil", icon: Pencil, shortcut: "B" },
  { id: "eraser", label: "Eraser", icon: Eraser, shortcut: "E" },
  { id: "fill", label: "Fill", icon: PaintBucket, shortcut: "G" },
  { id: "eyedropper", label: "Picker", icon: Droplet, shortcut: "I" },
  { id: "hand", label: "Hand", icon: Hand, shortcut: "H" },
];

/** `bare` drops the card chrome for use inside a wrapper that already provides it (e.g. FloatingPanel). */
export function ToolPanel({ bare = false }: { bare?: boolean } = {}) {
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const color = useEditorStore((s) => s.color);
  const setColor = useEditorStore((s) => s.setColor);
  const alpha = useEditorStore((s) => s.alpha);
  const setAlpha = useEditorStore((s) => s.setAlpha);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const undoCount = useEditorStore((s) => s.undoStack.length);
  const redoCount = useEditorStore((s) => s.redoStack.length);
  const copyToOppositeLimb = useEditorStore((s) => s.copyToOppositeLimb);
  const flipSelectedFaceHorizontal = useEditorStore((s) => s.flipSelectedFaceHorizontal);
  const flipSelectedFaceVertical = useEditorStore((s) => s.flipSelectedFaceVertical);
  const clearSelectedFace = useEditorStore((s) => s.clearSelectedFace);
  const showCoords = useEditorStore((s) => s.showCoords);
  const toggleCoords = useEditorStore((s) => s.toggleCoords);
  const selected = useSelectedFace();

  const opposite = selected ? OPPOSITE_PART[selected.part] : undefined;

  return (
    <section className={cn("p-4", !bare && "rounded-xl border border-border bg-card shadow-sm")}>
      <h2 className="text-sm font-semibold text-foreground">Tools</h2>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {TOOLS.map(({ id, label, icon: Icon, shortcut }) => (
          <Button
            key={id}
            variant={tool === id ? "default" : "outline"}
            size="sm"
            className="h-auto flex-col gap-1.5 py-5 text-[11px]"
            aria-pressed={tool === id}
            data-testid={`tool-${id}`}
            title={`${label} (${shortcut})`}
            onClick={() => setTool(id)}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <Label htmlFor="color" className="w-16 text-xs text-muted-foreground">
            Color
          </Label>
          <input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-border bg-background p-0.5"
          />
          <span className="font-mono text-xs text-muted-foreground">{color.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-3">
          <Label className="w-16 text-xs text-muted-foreground">Alpha</Label>
          <Slider
            className="flex-1"
            aria-label="Alpha"
            min={0}
            max={1}
            step={0.05}
            value={[alpha]}
            onValueChange={(v) => setAlpha(v[0] ?? alpha)}
          />
          <span className="w-8 font-mono text-xs text-muted-foreground">
            {Math.round(alpha * 100)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={undo} disabled={undoCount === 0}>
          <Undo2 className="mr-1 size-3.5" /> Undo
        </Button>
        <Button variant="outline" size="sm" onClick={redo} disabled={redoCount === 0}>
          <Redo2 className="mr-1 size-3.5" /> Redo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="col-span-2"
          onClick={copyToOppositeLimb}
          disabled={!opposite}
          title={
            opposite
              ? `Copy to ${PART_LABELS[opposite]} ${selected?.face}`
              : "Only arms and legs can be mirrored"
          }
        >
          <Copy className="mr-1 size-3.5" />
          {opposite ? `Copy to ${PART_LABELS[opposite]}` : "Copy to opposite limb"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={flipSelectedFaceHorizontal}
          disabled={!selected}
          title="Flip the selected surface left-to-right"
        >
          <FlipHorizontal2 className="mr-1 size-3.5" /> Flip H
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={flipSelectedFaceVertical}
          disabled={!selected}
          title="Flip the selected surface top-to-bottom"
        >
          <FlipVertical2 className="mr-1 size-3.5" /> Flip V
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="col-span-2"
          onClick={clearSelectedFace}
          disabled={!selected}
        >
          <Trash2 className="mr-1 size-3.5" /> Clear selected face
        </Button>
      </div>

      <button
        type="button"
        onClick={toggleCoords}
        className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        {showCoords ? "Hide" : "Show"} atlas coordinates
      </button>
    </section>
  );
}
