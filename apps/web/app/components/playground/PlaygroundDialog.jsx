"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Video,
  Mic,
  MonitorPlay,
  Rocket,
} from "lucide-react";

const STEPS = [
  { label: "Start call" },
  { label: "Open your first device" },
  { label: "Join from another device" },
  { label: "You're connected" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

export default function PlaygroundDialog({
  open,
  session,
  onClose,
  onCopy,
  onOpenCaller,
  onOpenReceiver,
}) {
const [callStatus, setCallStatus] = useState("RINGING");
  const [firstDeviceOpened, setFirstDeviceOpened] = useState(false);
  const [showLink, setShowLink] = useState(false);

  // Reset status whenever the dialog/session changes.
  useEffect(() => {
    if (open && session) {
      setCallStatus("RINGING");
      setFirstDeviceOpened(false);
    }
  }, [open, session]);

  // Poll the call status. The call is "connected" once both devices have
  // joined — the backend transitions RINGING → ACCEPTED when the second
  // participant accepts. This avoids exposing caller/receiver roles or URLs
  // and needs no socket-room changes.
  useEffect(() => {
    if (!open || !session || !session.callId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/calls/${session.callId}/details`, {
          headers: { Authorization: `Bearer ${session.callerToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.status) setCallStatus(data.status);
        }
      } catch {
        // Network hiccup — keep polling.
      }
    };

    poll();
    const id = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open, session]);

const connected = callStatus === "ACCEPTED";
  // The first device is "joined" only after the user has clicked
  // "Open Call on This Device". We track this locally rather than inferring
  // it from the call status, because the backend creates the call as RINGING
  // before any device has actually opened it.
  const firstDeviceJoined = firstDeviceOpened && !connected;
  const awaitingFirstDevice = !firstDeviceJoined && !connected;

  const isAudio = session?.type === "AUDIO";

  // Current step (1-indexed) for the progress indicator.
  const currentStep = connected ? 4 : firstDeviceJoined ? 3 : 2;

  return (
    <AnimatePresence>
      {open && session && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              background: "rgba(0,0,0,.78)",
              backdropFilter: "blur(14px)",
            }}
          />

          {/* Modal wrapper */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 30 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl my-6"
            >
              <div
                className="rounded-3xl border overflow-hidden flex flex-col max-h-[92vh]"
                style={{ background: "#0B1220", borderColor: "#223250" }}
              >
                {/* HEADER */}
                <div
                  className="flex justify-between items-start px-7 sm:px-8 py-6 shrink-0"
                  style={{
                    background: "linear-gradient(135deg,#5B5DDB,#895DF6)",
                  }}
                >
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                      Try BlueJoinet
                    </h2>
                    <p className="text-indigo-100 mt-1.5 text-sm sm:text-base">
                      Test a real-time video call in seconds.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <X size={26} />
                  </button>
                </div>

                {/* BODY */}
                <div className="overflow-y-auto px-7 sm:px-8 py-7">
                  {/* Progress steps */}
                  <div className="mb-8">
                    <div className="flex items-center">
                      {STEPS.map((s, i) => {
                        const stepNum = i + 1;
                        const done = connected || (stepNum < currentStep) || (stepNum === 4 && connected);
                        const active = stepNum === currentStep;
                        return (
                          <div
                            key={s.label}
                            className="flex items-center flex-1 last:flex-none"
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                                style={{
                                  background: done
                                    ? "linear-gradient(135deg,#5B5DDB,#895DF6)"
                                    : active
                                    ? "#1E293B"
                                    : "#111827",
                                  border: active && !done
                                    ? "1px solid #5B5DDB"
                                    : "1px solid #223250",
                                  color: done || active ? "#fff" : "#64748B",
                                }}
                              >
                                {done ? <Check size={15} /> : stepNum}
                              </div>
                              <span
                                className="text-[10px] mt-1.5 text-center leading-tight max-w-[70px]"
                                style={{
                                  color:
                                    done || active ? "#CBD5E1" : "#64748B",
                                }}
                              >
                                {s.label}
                              </span>
                            </div>
                            {stepNum < STEPS.length && (
                              <div
                                className="flex-1 h-px mx-2 mb-4"
                                style={{
                                  background:
                                    stepNum < currentStep || connected
                                      ? "#5B5DDB"
                                      : "#223250",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

{/* STEP CONTENT — only the current step renders */}
                  {connected ? (
                    /* STEP 4 — CONNECTED */
                    <motion.div
                      key="connected"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
<div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-white">
                          You're connected 🎉
                        </h3>
                        <p className="text-slate-400 mt-1.5">
                          Two devices are now on the same call.
                        </p>
                      </div>

                      <div
                        className="rounded-2xl p-6 mb-6 text-center"
                        style={{
                          background: "#111827",
                          border: "1px solid #1F8B4C",
                        }}
                      >
                        <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold mb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                          {isAudio ? "Audio Call Active" : "Video Call Active"}
                        </div>
                        <p className="text-white text-sm mb-4">
                          🟢 2 Participants
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 text-sm">
                          <span className="inline-flex items-center gap-1.5 text-emerald-400">
                            <Mic size={15} /> Audio
                          </span>
                          {!isAudio && (
                            <>
                              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                                <Video size={15} /> Video
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                                <MonitorPlay size={15} /> Screen
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl p-5 mb-6">
                        <p className="text-slate-300 font-medium mb-3 text-sm">
                          Try these features
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-400">
                          {isAudio ? (
                            <>
                              <div className="flex items-center gap-2">
                                🎙️ Mute / unmute
                              </div>
                              <div className="flex items-center gap-2">
                                📱 Join from another device
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                🎥 Turn camera on/off
                              </div>
                              <div className="flex items-center gap-2">
                                🎙️ Mute / unmute
                              </div>
                              <div className="flex items-center gap-2">
                                🖥️ Share your screen
                              </div>
                              <div className="flex items-center gap-2">
                                📱 Join from another device
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={onOpenCaller}
                        className="w-full py-3.5 rounded-xl text-white font-semibold transition hover:opacity-90 flex items-center justify-center gap-2"
                        style={{
                          background:
                            "linear-gradient(135deg,#5B5DDB,#895DF6)",
                        }}
                      >
                        Open Full Call Experience
                        <ExternalLink size={17} />
                      </button>
                    </motion.div>
                  ) : firstDeviceJoined ? (
                    /* STEP 3 — JOIN FROM ANOTHER DEVICE (second device only) */
                    <motion.div
                      key="second-device"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Smartphone size={18} color="#818CF8" />
                        <h3 className="text-white font-semibold">
                          Join from another device
                        </h3>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-5 items-center mb-6">
                        {/* QR */}
                        <div className="bg-white rounded-2xl p-4 flex-shrink-0">
                          <QRCode
                            value={session.receiverUrl}
                            size={168}
                          />
                        </div>

                        <div className="flex-1 w-full">
                          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                            Scan this QR code with your phone or another
                            device to join this call.
                          </p>

                          <div className="flex flex-col gap-2.5">
                            <button
                              onClick={() => onCopy(session.receiverUrl)}
                              className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90 flex items-center justify-center gap-2"
                              style={{ background: "#1F2937" }}
                            >
                              <Copy size={16} />
                              Copy Invite Link
                            </button>
                            <button
                              onClick={onOpenReceiver}
                              className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90 flex items-center justify-center gap-2"
                              style={{
                                background:
                                  "linear-gradient(135deg,#5B5DDB,#895DF6)",
                              }}
                            >
                              <ExternalLink size={16} />
                              Open on Another Device
                            </button>
                          </div>

                          {/* Show/hide raw link */}
                          <button
                            onClick={() => setShowLink((s) => !s)}
                            className="mt-3 text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                          >
                            {showLink ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                            {showLink ? "Hide link" : "Show link"}
                          </button>
                          {showLink && (
                            <div
                              className="mt-2 break-all text-[11px] text-slate-500 rounded-lg px-3 py-2"
                              style={{
                                background: "#0A1018",
                                border: "1px solid #1A2A44",
                              }}
                            >
                              {session.receiverUrl}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* LIVE STATUS */}
                      <div
                        className="rounded-2xl p-5 flex items-center gap-3"
                        style={{
                          background: "#111827",
                          border: "1px solid #1F8B4C",
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: "rgba(34,197,94,.12)",
                          }}
                        >
                          <CheckCircle2 color="#22C55E" size={22} />
                        </div>
                        <div>
                          <p
                            className="font-semibold flex items-center gap-2"
                            style={{ color: "#22C55E" }}
                          >
                            <span
                              className="w-2 h-2 rounded-full inline-block animate-pulse"
                              style={{ background: "#22C55E" }}
                            />
                            1 participant connected
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            Open the call on another device to test the
                            connection.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* STEP 2 — OPEN THE FIRST DEVICE (first device only) */
                    <motion.div
                      key="first-device"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Monitor size={18} color="#818CF8" />
                        <h3 className="text-white font-semibold">
                          Open the first device
                        </h3>
                      </div>
                      <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                        Open BlueJoinet on your laptop or desktop first.
                      </p>
<button
                        onClick={() => {
                          setFirstDeviceOpened(true);
                          onOpenCaller();
                        }}
                        className="w-full py-3 rounded-xl text-white font-semibold transition hover:opacity-90 flex items-center justify-center gap-2"
                        style={{
                          background:
                            "linear-gradient(135deg,#5B5DDB,#895DF6)",
                        }}
                      >
                        Open Call on This Device
                        <ExternalLink size={17} />
                      </button>

                      {/* LIVE STATUS */}
                      <div
                        className="rounded-2xl p-5 mt-6 flex items-center gap-3"
                        style={{
                          background: "#111827",
                          border: "1px solid #5B5DDB",
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: "rgba(91,93,219,.12)",
                          }}
                        >
                          <Rocket color="#818CF8" size={20} />
                        </div>
                        <div>
                          <p
                            className="font-semibold flex items-center gap-2"
                            style={{ color: "#CBD5E1" }}
                          >
                            <span
                              className="w-2 h-2 rounded-full inline-block animate-pulse"
                              style={{ background: "#FACC15" }}
                            />
                            Waiting for another device...
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            Open the first device to get started.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
