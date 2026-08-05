"use client";

import { useState } from "react";
import { Video, Phone, Monitor } from "lucide-react";

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

  async function startVideoDemo() {
    try {
      setLoading(true);

      const { data } = await api.post("/playground/video");

      setSession(data);
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
      <div
        className="min-h-screen"
        style={{ background: "#060B18" }}
      >
        <main className="max-w-6xl mx-auto px-6 py-16">

          <Hero />

          <div className="grid lg:grid-cols-3 gap-6">

            <DemoCard
              title="Video Calling"
              description="Experience HD video calls, screen sharing and WebRTC exactly like your users."
              icon={<Video color="#818CF8" />}
              buttonText={
                loading
                  ? "Creating Session..."
                  : "Start Demo"
              }
              onClick={startVideoDemo}
              disabled={loading}
            />

            <DemoCard
              title="Audio Calling"
              description="Crystal clear audio calling built on the same infrastructure."
              icon={<Phone color="#818CF8" />}
              buttonText="Coming Soon"
              disabled
            />

            <DemoCard
              title="Screen Sharing"
              description="Share your entire screen or any application during calls."
              icon={<Monitor color="#818CF8" />}
              buttonText="Coming Soon"
              disabled
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