import { ImagePlus, Palette, Wand2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PART_LABELS } from "@/domain/skin/faceRegistry";
import { loadImageFromFile } from "@/domain/skin/importExport";
import { extractPalette } from "@/domain/skin/palette";
import { rgbaToHex } from "@/domain/skin/skinBuffer";
import { useEditorStore, useSelectedFace } from "@/store/editorStore";

export function ReferencePanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [sampleMode, setSampleMode] = useState(false);
  const reference = useEditorStore((s) => s.reference);
  const setReference = useEditorStore((s) => s.setReference);
  const palette = useEditorStore((s) => s.palette);
  const setPalette = useEditorStore((s) => s.setPalette);
  const fitMode = useEditorStore((s) => s.fitMode);
  const setFitMode = useEditorStore((s) => s.setFitMode);
  const fitReference = useEditorStore((s) => s.fitReferenceToSelectedFace);
  const setColor = useEditorStore((s) => s.setColor);
  const selected = useSelectedFace();

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      setReference({
        url: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        element: img,
      });
      toast.success("Reference image loaded");
    } catch {
      toast.error("That file could not be read as an image.");
    }
  };

  const onExtract = () => {
    if (!reference) return;
    const colors = extractPalette(reference.element, 12);
    setPalette(colors);
    if (colors.length === 0) toast.error("No opaque colors found in that image.");
  };

  const onSample = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!sampleMode || !reference) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * reference.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * reference.height);
    const canvas = document.createElement("canvas");
    canvas.width = reference.width;
    canvas.height = reference.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(reference.element, 0, 0);
    const d = ctx.getImageData(Math.min(x, reference.width - 1), Math.min(y, reference.height - 1), 1, 1).data;
    setColor(rgbaToHex({ r: d[0]!, g: d[1]!, b: d[2]!, a: 255 }));
  };

  const onFit = () => {
    if (!selected) {
      toast.error("Select a face in the editor first.");
      return;
    }
    if (!reference) return;
    fitReference();
    toast.success(`Reference fitted to ${PART_LABELS[selected.part]} ${selected.face}`);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Reference image</h2>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          void onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="mr-1 size-3.5" /> Upload image
        </Button>
        {reference ? (
          <Button variant="outline" size="icon" aria-label="Remove reference" onClick={() => setReference(null)}>
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {reference ? (
        <>
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-checker">
            <img
              ref={imgRef}
              src={reference.url}
              alt="Reference"
              onClick={onSample}
              className="mx-auto max-h-44 w-auto"
              style={{ cursor: sampleMode ? "crosshair" : "default" }}
            />
          </div>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {reference.width} × {reference.height} px · stays in your browser
          </p>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Fit mode</Label>
              <div className="flex gap-1">
                {(["cover", "contain"] as const).map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={fitMode === mode ? "default" : "outline"}
                    className="h-7 px-2 text-[11px] capitalize"
                    onClick={() => setFitMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={onFit} disabled={!selected}>
              <Wand2 className="mr-1 size-3.5" />
              {selected
                ? `Fit to ${PART_LABELS[selected.part]} ${selected.face}`
                : "Select a face to fit"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={sampleMode ? "default" : "outline"}
                onClick={() => setSampleMode(!sampleMode)}
              >
                Sample color
              </Button>
              <Button size="sm" variant="outline" onClick={onExtract}>
                <Palette className="mr-1 size-3.5" /> Palette
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Upload a PNG, JPG or WebP to sample colors, extract a palette, or map it onto a face.
        </p>
      )}

      {palette.length > 0 ? (
        <div className="mt-4">
          <Label className="text-xs text-muted-foreground">Palette</Label>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {palette.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                aria-label={`Use ${hex}`}
                onClick={() => setColor(hex)}
                className="aspect-square rounded border border-border transition-transform hover:scale-110"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
