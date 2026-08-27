import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { SkinGrid } from "@/components/site/SkinGrid";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublishedSkins, type GallerySkin } from "@/lib/gallery";
import type { Platform } from "@/lib/gate";
import { submitOrder } from "@/lib/orders";
import { recordValidationEvent } from "@/lib/validation";

const PRICE_INTENTS = [
  { value: "exploring", label: "Just exploring" },
  { value: "5-10", label: "$5 – $10" },
  { value: "10-20", label: "$10 – $20" },
  { value: "20-plus", label: "$20 or more" },
] as const;

const PLATFORM_LABEL: Record<Platform, string> = {
  java: "Java",
  bedrock: "Bedrock",
  unsure: "Not sure",
};

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Human Creator Custom Orders — GagaSkin" },
      {
        name: "description",
        content:
          "Describe the skin you want and Grace makes it by hand. A person, not a generator.",
      },
    ],
  }),
  component: CustomPage,
});

function CustomPage() {
  const { user } = useSession();
  const [skins, setSkins] = useState<GallerySkin[]>([]);
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState<Platform>("unsure");
  const [priceIntent, setPriceIntent] = useState<string>("exploring");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchPublishedSkins()
      .then((all) => setSkins(all.filter((s) => s.madeWith === "custom")))
      .catch(() => setSkins([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let referencePath: string | null = null;
      if (file) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from("order-refs").upload(path, file);
        if (error) throw error;
        referencePath = path;
      }
      await submitOrder({ customerId: user.id, brief, referencePath, platform, priceIntent });
      recordValidationEvent("order_submitted", { platform, price_intent: priceIntent });
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell view="custom">
      <section className="gs-section gs-offer gs-offer--human">
        <div className="gs-offer__copy">
          <span className="gs-rule" aria-hidden="true" />
          <p className="gs-pixel">Do it for me</p>
          <h1>Tell Grace what you want. She makes it by hand.</h1>
          <p className="gs-lead">
            Grace is twelve, she has been making Minecraft skins for years, and she does this
            the slow way — pixel by pixel, reading what you wrote, until it looks like the
            thing you described.
          </p>
          <p>No generator. No template with your colours swapped in. A person.</p>
        </div>

        <aside className="gs-offer__aside">
          <p className="gs-pixel">How it works</p>
          <ol className="gs-steps">
            <li>You describe the character, and add a picture if you have one.</li>
            <li>Her dad reads every order before she sees it.</li>
            <li>Grace builds it by hand in the editor.</li>
            <li>It comes back to your account as a finished skin.</li>
          </ol>
          <p className="gs-hint">
            Nothing is charged on this site and no price is agreed here.
          </p>
        </aside>
      </section>

      <section className="gs-section" aria-labelledby="her-work">
        <div className="gs-section__head">
          <p className="gs-pixel">Her work</p>
          <h2 id="her-work">Skins she has made.</h2>
        </div>
        <SkinGrid skins={skins} />
      </section>

      <section className="gs-form-page" aria-labelledby="order-heading">
        <div className="gs-card">
        <h2 id="order-heading">Start an order</h2>

        {sent ? (
          <p>
            Your order is in. We read every one before Grace starts, so give us a little time
            and we will come back to you by email.
          </p>
        ) : !user ? (
          <>
            <p>You will need an account so we can send the finished skin back to you.</p>
            <Link
              to="/join"
              search={{ from: "custom" }}
              className="gs-cta"
              onClick={() =>
                recordValidationEvent("offer_path_started", {
                  offer: "custom",
                  location: "landing",
                })
              }
            >
              Create your account
            </Link>
          </>
        ) : (
          <form className="gs-form" onSubmit={submit}>
            <label htmlFor="brief">What do you want it to be?</label>
            <textarea
              id="brief"
              required
              minLength={20}
              rows={6}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="The character, the outfit, the colours, and the one detail that matters most."
            />

            <label htmlFor="ref">A picture to work from (optional)</label>
            <input
              id="ref"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="gs-hint">
              Use your own drawing or an image you have the right to share. Please do not
              upload photographs of children.
            </p>

            <fieldset>
              <legend>Where do you play?</legend>
              {(["java", "bedrock", "unsure"] as const).map((value) => (
                <label key={value} className="gs-choice">
                  <input
                    type="radio"
                    name="platform"
                    value={value}
                    checked={platform === value}
                    onChange={() => setPlatform(value)}
                  />
                  {PLATFORM_LABEL[value]}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>What were you thinking of paying?</legend>
              {PRICE_INTENTS.map((option) => (
                <label key={option.value} className="gs-choice">
                  <input
                    type="radio"
                    name="price"
                    value={option.value}
                    checked={priceIntent === option.value}
                    onChange={() => setPriceIntent(option.value)}
                  />
                  {option.label}
                </label>
              ))}
              <p className="gs-hint">
                Nothing is charged here and this does not agree a price. We are working out
                what is fair.
              </p>
            </fieldset>

            <Button type="submit" disabled={busy}>Send my order</Button>
          </form>
        )}
        </div>
      </section>
    </SiteShell>
  );
}
