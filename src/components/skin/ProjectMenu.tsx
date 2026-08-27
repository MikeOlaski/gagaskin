import { Download, Globe, Loader2, MoreHorizontal, Pencil, Save, SaveAll, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportSkinPng } from "@/domain/skin/importExport";
import type { SkinBuffer } from "@/domain/skin/skinBuffer";
import {
  fetchProjectGalleryEntry,
  publishProject,
  setProjectPublished,
  type ProjectGalleryEntry,
} from "@/lib/projectPublish";

export interface ProjectMenuProps {
  /** null while the current skin has never been saved. */
  projectId: string | null;
  name: string;
  skin: SkinBuffer;
  onSave?: () => void | Promise<void>;
  onSaveAsNew?: () => void | Promise<void>;
  onRename?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  align?: "start" | "end";
  label?: string;
}

export function ProjectMenu({
  projectId,
  name,
  skin,
  onSave,
  onSaveAsNew,
  onRename,
  onDelete,
  align = "end",
  label,
}: ProjectMenuProps) {
  const [entry, setEntry] = useState<ProjectGalleryEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshEntry = useCallback(async () => {
    if (!projectId) {
      setEntry(null);
      return;
    }
    try {
      setEntry(await fetchProjectGalleryEntry(projectId));
    } catch {
      setEntry(null);
    }
  }, [projectId]);

  useEffect(() => {
    void refreshEntry();
  }, [refreshEntry]);

  const run = async (fn: () => Promise<void> | void) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const onPublish = () =>
    run(async () => {
      if (!projectId) {
        toast.error("Save this project first, then publish it.");
        return;
      }
      await publishProject({ projectId, title: name, skin });
      await refreshEntry();
      toast.success(`“${name}” is live in the gallery`);
    });

  const onToggle = () =>
    run(async () => {
      if (!entry) return;
      await setProjectPublished(entry.id, !entry.published);
      await refreshEntry();
      toast.success(entry.published ? "Hidden from the gallery" : "Shown in the gallery");
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label ?? `Project options for ${name}`}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {onSave ? (
          <DropdownMenuItem onSelect={() => void run(onSave)}>
            <Save className="mr-2 size-3.5" /> Save
          </DropdownMenuItem>
        ) : null}
        {onSaveAsNew ? (
          <DropdownMenuItem onSelect={() => void run(onSaveAsNew)}>
            <SaveAll className="mr-2 size-3.5" /> Save as new
          </DropdownMenuItem>
        ) : null}
        {onRename ? (
          <DropdownMenuItem onSelect={() => void run(onRename)}>
            <Pencil className="mr-2 size-3.5" /> Rename…
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => exportSkinPng(skin, `${name || "minecraft-skin"}.png`)}>
          <Download className="mr-2 size-3.5" /> Export skin PNG
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
          Gallery
          {projectId
            ? entry
              ? entry.published
                ? " · published"
                : " · hidden"
              : " · not published"
            : " · save first"}
        </DropdownMenuLabel>
        <DropdownMenuItem disabled={!projectId} onSelect={() => void onPublish()}>
          <Globe className="mr-2 size-3.5" />
          {entry ? "Re-render & update gallery" : "Publish to gallery"}
        </DropdownMenuItem>
        {entry ? (
          <DropdownMenuItem onSelect={() => void onToggle()}>
            <Globe className="mr-2 size-3.5" />
            {entry.published ? "Unpublish (hide)" : "Publish (show)"}
          </DropdownMenuItem>
        ) : null}

        {onDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => void run(onDelete)}
            >
              <Trash2 className="mr-2 size-3.5" /> Delete project
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
