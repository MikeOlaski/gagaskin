import { useEffect, useRef } from "react";

import { IdeaBlob, InWorld, PaletteRow, PixelGrid } from "@/components/site/PixelArt";

const STEPS = [
  { art: <IdeaBlob />, title: "The idea", body: "A drawing, a character, an outfit you pictured." },
  { art: <PaletteRow />, title: "The colours", body: "Pulled out of it and made Minecraft-ready." },
  { art: <PixelGrid />, title: "The pixels", body: "Every face of the model, yours to change." },
  { art: <InWorld />, title: "In the game", body: "Exported clean, and worn." },
];

/** The one band on the site worth animating: it is the pitch, not decoration.
 *  Steps reveal on scroll, staggered. prefers-reduced-motion disables it in CSS. */
export function TransformBand() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".gs-step"));
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="gs-band" ref={ref}>
      {STEPS.map((step, i) => (
        <div className="gs-step" key={step.title} style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
          <div className="gs-step__art">{step.art}</div>
          <span className="gs-pixel gs-step__n" />
          <h3>{step.title}</h3>
          <p className="gs-hint">{step.body}</p>
        </div>
      ))}
    </div>
  );
}
