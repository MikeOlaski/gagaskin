import { Download } from "lucide-react";
import { useState } from "react";

import { downloadSkin, skinDownloadUrl, type GallerySkin } from "@/lib/gallery";

/**
 * Downloads the skin PNG and counts it. Optimistic count so the visitor sees
 * their own download land; the authoritative number comes back on next load.
 */
export function SkinDownloadButton({
  skin,
  showCount = true,
}: {
  skin: GallerySkin;
  showCount?: boolean;
}) {
  const [extra, setExtra] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!skinDownloadUrl(skin)) return null;
  const count = skin.downloadCount + extra;

  async function run() {
    setBusy(true);
    setFailed(false);
    try {
      await downloadSkin(skin);
      setExtra((n) => n + 1);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="gs-dl"
      onClick={() => void run()}
      disabled={busy}
      aria-label={`Download the ${skin.title} skin PNG`}
    >
      <Download size={14} aria-hidden="true" />
      <span>{failed ? "Try again" : busy ? "Getting it…" : "Download"}</span>
      {showCount && count > 0 && <span className="gs-dl__count">{count}</span>}
    </button>
  );
}
