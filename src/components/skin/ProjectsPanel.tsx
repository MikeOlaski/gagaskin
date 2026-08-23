import { Link } from "@tanstack/react-router";
import { FolderOpen, Loader2, LogOut, Save, SaveAll, Trash2, Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import {
  createProject,
  decodeSkin,
  deleteProject,
  imageToDataUrl,
  listProjects,
  loadImageFromDataUrl,
  renameProject,
  updateProject,
  type ProjectSnapshot,
  type SkinProjectRow,
} from "@/lib/projects";
import { useEditorStore } from "@/store/editorStore";

export function ProjectsPanel() {
  const { user, loading } = useSession();
  const [projects, setProjects] = useState<SkinProjectRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("Untitled skin");

  const refresh = useCallback(async () => {
    setFetching(true);
    try {
      setProjects(await listProjects());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load projects.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setCurrentId(null);
      return;
    }
    void refresh();
  }, [user, refresh]);

  const snapshot = (): ProjectSnapshot => {
    const state = useEditorStore.getState();
    return {
      name: name.trim() || "Untitled skin",
      skin: state.skin,
      referenceDataUrl: state.reference ? imageToDataUrl(state.reference.element) : null,
      palette: state.palette,
      plan: state.plan,
      viewState: {
        selectedFaceId: state.selectedFaceId,
        cellSize: state.cellSize,
        color: state.color,
        tool: state.tool,
      },
    };
  };

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const onSave = () =>
    withBusy(async () => {
      const snap = snapshot();
      const row = currentId ? await updateProject(currentId, snap) : await createProject(snap);
      setCurrentId(row.id);
      setName(row.name);
      await refresh();
      toast.success(`Saved “${row.name}”`);
    });

  const onSaveAsNew = () =>
    withBusy(async () => {
      const row = await createProject(snapshot());
      setCurrentId(row.id);
      setName(row.name);
      await refresh();
      toast.success(`Created “${row.name}”`);
    });

  const onOpen = (row: SkinProjectRow) =>
    withBusy(async () => {
      const state = useEditorStore.getState();
      state.loadSkin(decodeSkin(row.skin_png));
      if (row.reference_data_url) {
        const img = await loadImageFromDataUrl(row.reference_data_url);
        state.setReference({
          url: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          element: img,
        });
      } else {
        state.setReference(null);
      }
      useEditorStore.setState({
        palette: Array.isArray(row.palette) ? row.palette : [],
        plan: row.plan ?? null,
        planError: null,
        selectedFaceId: row.view_state?.selectedFaceId ?? "head.front",
        ...(row.view_state?.cellSize ? { cellSize: row.view_state.cellSize } : {}),
        ...(row.view_state?.color ? { color: row.view_state.color } : {}),
      });
      setCurrentId(row.id);
      setName(row.name);
      toast.success(`Opened “${row.name}”`);
    });

  const onRename = (row: SkinProjectRow) =>
    withBusy(async () => {
      const next = window.prompt("Project name", row.name);
      if (!next || next.trim() === row.name) return;
      await renameProject(row.id, next.trim());
      if (row.id === currentId) setName(next.trim());
      await refresh();
    });

  const onDelete = (row: SkinProjectRow) =>
    withBusy(async () => {
      if (!window.confirm(`Delete “${row.name}”? This cannot be undone.`)) return;
      await deleteProject(row.id);
      if (row.id === currentId) setCurrentId(null);
      await refresh();
      toast.success("Project deleted");
    });

  const onSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Projects</h2>
        {user ? (
          <Button variant="ghost" size="sm" onClick={() => void onSignOut()}>
            <LogOut className="mr-1 size-3.5" /> Sign out
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-3 text-xs text-muted-foreground">Checking your session…</p>
      ) : !user ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Sign in to save skins as named projects and reopen them on any device.
          </p>
          <Button asChild size="sm" className="w-full">
            <Link to="/auth">Sign in to save projects</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-2 truncate text-xs text-muted-foreground">{user.email}</p>

          <div className="mt-3 space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              aria-label="Project name"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" disabled={busy} onClick={() => void onSave()}>
                <Save className="mr-1 size-3.5" /> {currentId ? "Save" : "Save project"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void onSaveAsNew()}
              >
                <SaveAll className="mr-1 size-3.5" /> Save as new
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            {fetching ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Loading projects…
              </p>
            ) : projects.length === 0 ? (
              <p className="text-xs text-muted-foreground">No saved projects yet.</p>
            ) : (
              projects.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 ${
                    row.id === currentId ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    disabled={busy}
                    onClick={() => void onOpen(row)}
                  >
                    <span className="block truncate text-xs font-medium text-foreground">
                      {row.name}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {new Date(row.updated_at).toLocaleString()}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Open ${row.name}`}
                    disabled={busy}
                    onClick={() => void onOpen(row)}
                  >
                    <FolderOpen className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Rename ${row.name}`}
                    disabled={busy}
                    onClick={() => void onRename(row)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${row.name}`}
                    disabled={busy}
                    onClick={() => void onDelete(row)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
