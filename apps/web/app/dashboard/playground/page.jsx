"use client";

import { useState } from "react";
import { Video, Phone, Monitor, ArrowRight, FlaskConical, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

export default function PlaygroundPage() {
  const [loading, setLoading] = useState(false);

  async function startVideoTest() {
    try {
      setLoading(true);
      const response = await api.post("/playground/video");
      const data = response.data;

      const callerWindow = window.open(data.callerUrl, "_blank", "width=1200,height=800");
      setTimeout(() => {
        window.open(data.receiverUrl, "_blank", "width=1200,height=800");
      }, 1000);

      if (!callerWindow) {
        alert("Please allow popups for BlueJoinet.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#060B18" }}>

      {/* Nav */}
      <header
        style={{ background: "rgba(6,11,24,0.9)", borderBottom: "1px solid #1A2642", backdropFilter: "blur(12px)" }}
        className="sticky top-0 z-40"
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-mono font-bold text-white tracking-tight text-sm">BlueJoinet</a>
            <span style={{ background: "#1A2642", width: 1, height: 18 }} />
            <a href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Dashboard</a>
            <span style={{ background: "#1A2642", width: 1, height: 18 }} />
            <span className="text-sm text-slate-400">Playground</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              <FlaskConical size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">BlueJoinet Playground</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Instantly experience BlueJoinet without writing a single line of code.
            Test video calls, audio, and screen sharing — two windows open automatically.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Video Call — active */}
          <div
            className="rounded-xl border p-6 flex flex-col"
            style={{ background: "#0D1421", borderColor: "#2A3D64" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              <Video size={18} style={{ color: "#818CF8" }} />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Video Call</h2>
            <p className="text-sm text-slate-400 flex-1 mb-6">
              Experience one-to-one HD video calling with WebRTC P2P — no third-party media servers.
            </p>
            <button
              onClick={startVideoTest}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating…</>
              ) : (
                <>Start Video Test <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {/* Audio Call — coming soon */}
          <div
            className="rounded-xl border p-6 flex flex-col opacity-40"
            style={{ background: "#0D1421", borderColor: "#1A2642" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "#121A2E", border: "1px solid #1A2642" }}
            >
              <Phone size={18} className="text-slate-500" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Audio Call</h2>
            <p className="text-sm text-slate-400 flex-1 mb-6">
              Voice-only calls with the same WebRTC infrastructure, lower bandwidth requirements.
            </p>
            <div
              className="w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-slate-500 border border-[#1A2642]"
              style={{ background: "#060B18" }}
            >
              Coming soon
            </div>
          </div>

          {/* Screen Sharing — coming soon */}
          <div
            className="rounded-xl border p-6 flex flex-col opacity-40"
            style={{ background: "#0D1421", borderColor: "#1A2642" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "#121A2E", border: "1px solid #1A2642" }}
            >
              <Monitor size={18} className="text-slate-500" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Screen Sharing</h2>
            <p className="text-sm text-slate-400 flex-1 mb-6">
              Share any window or screen mid-call. Available inside every video call today.
            </p>
            <div
              className="w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-slate-500 border border-[#1A2642]"
              style={{ background: "#060B18" }}
            >
              Coming soon
            </div>
          </div>

        </div>

        {/* Info strip */}
        <div
          className="mt-8 rounded-xl border px-5 py-4 flex items-start gap-3"
          style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.2)" }}
        >
          <svg className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-slate-400 leading-relaxed">
            Clicking <strong className="text-white">Start Video Test</strong> opens two browser windows — one as the caller, one as the receiver.
            Allow browser popups when prompted. Both participants connect automatically over WebRTC.
          </p>
        </div>

      </main>
    </div>
  );
}
