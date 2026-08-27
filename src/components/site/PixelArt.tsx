/**
 * Pure-SVG pixel art for the public pages.
 *
 * Deliberately not images: the product IS a 64x64 pixel grid, so the marketing
 * surface draws itself the same way. It costs no network request, never shifts
 * layout, and renders identically before Grace has published a single skin.
 */

const PALETTE: Record<string, string> = {
  h: "#3A2A1E", // hair
  s: "#C99A6B", // skin
  e: "#2B2320", // eye
  w: "#F4EFE6", // eye white
  m: "#8A5B44", // mouth
  t: "#3C8527", // shirt — the accent, used as fill only
  v: "#33701F", // sleeve — a shade down so arms separate from the torso
  a: "#2F6A1C", // shirt detail
  p: "#3A4A6B", // trousers
  b: "#2B2320", // boots
};

const HEAD = [
  "hhhhhhhh",
  "hhhhhhhh",
  "hssssssh",
  "hssssssh",
  "sewsswes",
  "ssssssss",
  "ssmmmmss",
  "ssssssss",
];
const TORSO = [
  "tttttttt", "tttttttt",
  "ttaaaatt", "ttaaaatt", "ttaaaatt", "ttaaaatt",
  "tttttttt", "tttttttt", "tttttttt", "tttttttt", "tttttttt", "tttttttt",
];
const SLEEVE = "vvvv";
const HAND = "ssss";
const LEGS = ["pppppppp", "bbbbbbbb"];

function rows(): string[] {
  const out: string[] = [];
  for (const r of HEAD) out.push(`....${r}....`);
  TORSO.forEach((r, i) => {
    const arm = i < 8 ? SLEEVE : HAND;
    out.push(`${arm}${r}${arm}`);
  });
  for (let i = 0; i < 12; i++) out.push(`....${LEGS[i < 8 ? 0 : 1]}....`);
  return out;
}

const ROWS = rows();

/** A front-facing Minecraft character, 16 x 32 pixels, drawn as rects. */
export function PixelSkin({ animate = true }: { animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 32"
      width="100%"
      style={{ maxWidth: 260, height: "auto", display: "block", imageRendering: "pixelated" }}
      shapeRendering="crispEdges"
      role="img"
      aria-label="A Minecraft character skin drawn pixel by pixel"
    >
      {ROWS.map((row, y) =>
        [...row].map((ch, x) => {
          const fill = PALETTE[ch];
          if (!fill) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1.02}
              height={1.02}
              fill={fill}
              style={
                animate
                  ? { opacity: 0, animation: `gsPixelIn 380ms ease-out forwards`, animationDelay: `${y * 26}ms` }
                  : undefined
              }
            />
          );
        }),
      )}
    </svg>
  );
}

/** An idea before it is a skin: soft, unresolved colour. */
export function IdeaBlob() {
  return (
    <svg viewBox="0 0 64 48" width="100%" style={{ display: "block" }} aria-hidden="true">
      <defs>
        <filter id="gsBlur"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <g filter="url(#gsBlur)">
        <circle cx="24" cy="20" r="13" fill="#C99A6B" />
        <circle cx="38" cy="28" r="14" fill="#3C8527" />
        <circle cx="30" cy="34" r="9" fill="#3A4A6B" />
      </g>
    </svg>
  );
}

/** The palette pulled out of that idea. */
export function PaletteRow() {
  const swatches = ["#C99A6B", "#3A2A1E", "#3C8527", "#F4EFE6", "#3A4A6B", "#2B2320"];
  return (
    <svg viewBox="0 0 64 48" width="100%" style={{ display: "block" }} aria-hidden="true">
      {swatches.map((c, i) => (
        <rect key={c} x={5 + (i % 3) * 18} y={8 + Math.floor(i / 3) * 18} width={14} height={14} rx={1.5} fill={c} />
      ))}
    </svg>
  );
}

/** The UV grid: every face of the model, addressable. */
export function PixelGrid() {
  const cells = [] as { x: number; y: number; on: boolean }[];
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) cells.push({ x, y, on: (x * 3 + y * 5) % 4 === 0 });
  return (
    <svg viewBox="0 0 64 48" width="100%" style={{ display: "block" }} aria-hidden="true">
      {cells.map(({ x, y, on }) => (
        <rect
          key={`${x}-${y}`}
          x={4 + x * 7}
          y={5 + y * 7}
          width={6}
          height={6}
          rx={0.8}
          fill={on ? "#3C8527" : "#FFFFFF"}
          stroke="#E6E0D8"
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}

/** The finished thing, worn. */
export function InWorld() {
  return (
    <svg viewBox="0 0 64 48" width="100%" shapeRendering="crispEdges" style={{ display: "block" }} aria-hidden="true">
      <rect x="0" y="30" width="64" height="18" fill="#7FA65B" />
      <rect x="0" y="30" width="64" height="3" fill="#8FB86A" />
      <g transform="translate(26 12) scale(0.38)">
        {ROWS.map((row, y) =>
          [...row].map((ch, x) => {
            const fill = PALETTE[ch];
            return fill ? <rect key={`${x}-${y}`} x={x} y={y} width={1.05} height={1.05} fill={fill} /> : null;
          }),
        )}
      </g>
    </svg>
  );
}
