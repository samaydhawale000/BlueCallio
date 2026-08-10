"use client";

import { useState } from "react";
import { Video, Phone } from "lucide-react";

import { api } from "../../lib/api";
import { useRequireAuth } from "../../hooks/useRequireAuth";

import Hero from "../../components/playground/Hero";
import DemoCard from "../../components/playground/DemoCard";
import PlaygroundDialog from "../../components/playground/PlaygroundDialog";

export default function PlaygroundPage() {
  useRequireAuth();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function startDemo(type) {
    try {
      setLoading(true);

const { data } = await api.post("/playground/create", { type });

      setSession({ ...data, type });
      setDialogOpen(true);
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Unable to create demo session."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch {
      alert("Unable to copy");
    }
  }

  function openCaller() {
    if (!session) return;

    window.open(
      session.callerUrl,
      "_blank",
      "width=1200,height=900"
    );
  }

  function openReceiver() {
    if (!session) return;

    window.open(
      session.receiverUrl,
      "_blank",
      "width=1200,height=900"
    );
  }

  function closeDialog() {
    setDialogOpen(false);
    setSession(null);
  }

return (
    <>
      <div className="flex flex-col gap-8">
        <main className="max-w-3xl">

          <Hero />

<div className="grid lg:grid-cols-2 gap-6">

            <DemoCard
              title="Video Calling"
              description="Experience HD video calls, screen sharing and WebRTC exactly like your users."
              icon={<Video color="#818CF8" />}
              buttonText={
                loading
                  ? "Creating Session..."
                  : "Start Demo"
              }
              onClick={() => startDemo('VIDEO')}
              disabled={loading}
            />

            <DemoCard
              title="Audio Calling"
              description="Crystal clear audio calling built on the same infrastructure."
              icon={<Phone color="#818CF8" />}
              buttonText={
                loading
                  ? "Creating Session..."
                  : "Start Demo"
              }
              onClick={() => startDemo('AUDIO')}
              disabled={loading}
            />

          </div>

        </main>
      </div>

      <PlaygroundDialog
        open={dialogOpen}
        session={session}
        onClose={closeDialog}
        onCopy={copy}
        onOpenCaller={openCaller}
        onOpenReceiver={openReceiver}
      />
    </>
  );
}