import { TOOLS } from "@/components/skin/ToolPanel";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

const OTHER_SHORTCUTS: Array<{ label: string; keys: string }> = [
  { label: "Pan canvas", keys: "Space + drag" },
  { label: "Pan canvas", keys: "Middle-click drag" },
  { label: "Zoom canvas", keys: `${MOD} + scroll` },
  { label: "Undo", keys: `${MOD} + Z` },
  { label: "Redo", keys: `${MOD} + Shift + Z` },
  { label: "Exit focus mode", keys: "Esc" },
];

function ShortcutRow({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
        {keys}
      </kbd>
    </div>
  );
}

export function KeyboardShortcutsPanel() {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
      <div className="mt-3 space-y-1.5">
        {TOOLS.map((t) => (
          <ShortcutRow key={t.id} label={t.label} keys={t.shortcut} />
        ))}
        <div className="my-2 h-px bg-border" />
        {OTHER_SHORTCUTS.map((s) => (
          <ShortcutRow key={s.label + s.keys} label={s.label} keys={s.keys} />
        ))}
      </div>
    </section>
  );
}
