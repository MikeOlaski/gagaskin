import { Download, FileImage, FilePlus2, TestTube2, User } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { ProjectMenu } from "@/components/skin/ProjectMenu";
import { Button } from "@/components/ui/button";
import {
  exportSkinPng,
  imageToSkinBuffer,
  loadImageFromFile,
  SkinImportError,
} from "@/domain/skin/importExport";
import { useEditorStore } from "@/store/editorStore";

export function SkinFileBar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const skin = useEditorStore((s) => s.skin);
  const loadSkin = useEditorStore((s) => s.loadSkin);
  const newBlankSkin = useEditorStore((s) => s.newBlankSkin);
  const loadDemoSkin = useEditorStore((s) => s.loadDemoSkin);
  const loadDiagnosticSkin = useEditorStore((s) => s.loadDiagnosticSkin);
  const projectId = useEditorStore((s) => s.currentProjectId);
  const projectName = useEditorStore((s) => s.currentProjectName);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      loadSkin(imageToSkinBuffer(img));
      toast.success("Skin imported");
    } catch (error) {
      toast.error(
        error instanceof SkinImportError ? error.message : "That skin could not be imported.",
      );
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(e) => {
          void onImport(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button variant="outline" size="sm" onClick={newBlankSkin}>
        <FilePlus2 className="mr-1 size-3.5" /> Blank
      </Button>
      <Button variant="outline" size="sm" onClick={loadDemoSkin}>
        <User className="mr-1 size-3.5" /> Demo skin
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={loadDiagnosticSkin}
        title="FRONT red · BACK blue · LEFT green · RIGHT yellow · TOP white · BOTTOM black"
      >
        <TestTube2 className="mr-1 size-3.5" /> Orientation test
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <FileImage className="mr-1 size-3.5" /> Import 64×64 PNG
      </Button>
      <Button size="sm" onClick={() => exportSkinPng(skin)} data-testid="export-button">
        <Download className="mr-1 size-3.5" /> Export skin PNG
      </Button>
      <ProjectMenu
        projectId={projectId}
        name={projectName}
        skin={skin}
        label="Project settings"
      />
    </div>
  );
}
