import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { rpc, table } from "@/lib/db";
import {
  parseOfferParam,
  resolveGateMode,
  signupMetadata,
  type GateMode,
  type Platform,
} from "@/lib/gate";
import { recordValidationEvent } from "@/lib/validation";

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: parseOfferParam(search["from"]),
  }),
  head: () => ({
    meta: [
      { title: "Create your account — GagaSkin" },
      {
        name: "description",
        content:
          "Create a GagaSkin account to use the Minecraft skin editor and order a custom skin.",
      },
    ],
  }),
  component: JoinPage,
});

const PLATFORM_LABEL: Record<Platform, string> = {
  java: "Java",
  bedrock: "Bedrock",
  unsure: "Not sure yet",
};

function JoinPage() {
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const [mode, setMode] = useState<GateMode | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [platform, setPlatform] = useState<Platform>("unsure");
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/editor", replace: true });
  }, [user, navigate]);

  useEffect(() => {
    void Promise.resolve(rpc<boolean>("registration_open", {}))
      .then(({ data, error }) => setMode(resolveGateMode(error ? null : data)))
      .catch(() => setMode(resolveGateMode(null)));
  }, []);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: signupMetadata(from, platform),
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      recordValidationEvent("account_created", { offer: from, platform });
      setJoined(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-up failed.";
      // handle_new_user() rejects an over-cap signup even if the client missed it.
      if (message.includes("registration_closed")) {
        setMode("waitlist");
        toast.error("Registration just filled up. Join the waitlist instead.");
      } else {
        toast.error(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const joinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await table("waitlist").insert({ email, source_offer: from });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
      recordValidationEvent("waitlist_joined", { offer: from });
      setJoined(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join the waitlist.");
    } finally {
      setBusy(false);
    }
  };

  if (joined) {
    return (
      <SiteShell view="home">
        <section className="gs-join">
          <h1>{mode === "waitlist" ? "You are on the list." : "Check your email."}</h1>
          <p>
            {mode === "waitlist"
              ? "We will email you as soon as a place opens up."
              : "Confirm your address, then sign in and start building."}
          </p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell view="home">
      <section className="gs-join">
        <h1>{signingIn ? "Sign in" : "Create your account"}</h1>
        <p className="gs-trust">
          No ads. No redirects. Nothing sold. Every skin you make is yours to download and
          keep.
        </p>

        {mode === null && <p>Checking availability…</p>}

        {mode === "waitlist" && !signingIn && (
          <form onSubmit={joinWaitlist}>
            <p>
              We are keeping the group small while we build. Leave your email and we will
              open a place for you.
            </p>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={busy}>Join the waitlist</Button>
          </form>
        )}

        {mode === "register" && !signingIn && (
          <form onSubmit={register}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <fieldset>
              <legend>Where do you play?</legend>
              {(["java", "bedrock", "unsure"] as const).map((value) => (
                <label key={value}>
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
              <p className="gs-hint">
                Java and Bedrock accept different skin files. We use this so you do not build
                something your game will not take.
              </p>
            </fieldset>

            <label className="gs-attest">
              <input
                type="checkbox"
                required
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
              />
              I am 13 or older, or I am a parent or guardian creating this account for my
              child.
            </label>

            <Button type="submit" disabled={busy || !attested}>Create account</Button>
          </form>
        )}

        {signingIn && (
          <form onSubmit={signIn}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={busy}>Sign in</Button>
          </form>
        )}

        <button type="button" onClick={() => setSigningIn(!signingIn)}>
          {signingIn ? "Need an account?" : "Already have an account? Sign in"}
        </button>
      </section>
    </SiteShell>
  );
}
