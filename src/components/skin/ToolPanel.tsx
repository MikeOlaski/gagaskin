import {
  Copy,
  Droplet,
  Eraser,
  type LucideIcon,
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
import { useEditorStore, useSelectedFace, type Tool } from "@/store/editorStore";

const TOOLS: Array<{ id: Tool; label: string; icon: LucideIcon }> = [
  { id: "pencil", label: "Pencil", icon: Pencil },
  { id: "eraser", label: "Eraser", icon: Eraser },
  { id: "fill", label: "Fill", icon: PaintBucket },
  { id: "eyedropper", label: "Picker", icon: Droplet },
];

export function ToolPanel() {
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
  const clearSelectedFace = useEditorStore((s) => s.clearSelectedFace);
  const showCoords = useEditorStore((s) => s.showCoords);
  const toggleCoords = useEditorStore((s) => s.toggleCoords);
  const selected = useSelectedFace();

  const opposite = selected ? OPPOSITE_PART[selected.part] : undefined;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Tools</h2>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={tool === id ? "default" : "outline"}
            size="sm"
            className="flex-col gap-1 py-4 text-[11px]"
            aria-pressed={tool === id}
            data-testid={`tool-${id}`}
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
