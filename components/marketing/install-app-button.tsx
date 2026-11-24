"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Chrome and Edge raise `beforeinstallprompt` when the app can be installed. */
export function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return <p className="text-sm">The app is installed on this device.</p>;
  }
  if (!prompt) {
    return (
      <p className="text-sm text-muted-foreground">
        In Chrome or Edge, use the install icon in the address bar, or the browser menu and then
        Install app. On iPhone, open this page in Safari, tap Share, then Add to Home Screen.
      </p>
    );
  }
  return (
    <Button
      className="h-11 w-fit"
      onClick={async () => {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
        setPrompt(null);
      }}
    >
      Install on this device
    </Button>
  );
}
