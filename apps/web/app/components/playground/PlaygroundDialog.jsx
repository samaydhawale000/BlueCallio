"use client";

import QRCode from "react-qr-code";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  CheckCircle2,
  Info,
} from "lucide-react";

export default function PlaygroundDialog({
  open,
  session,
  onClose,
  onCopy,
  onOpenCaller,
  onOpenReceiver,
}) {
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
              background: "rgba(0,0,0,.75)",
              backdropFilter: "blur(12px)",
            }}
          />

          {/* Modal wrapper */}

          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 overflow-y-auto">

            <motion.div
              initial={{
                opacity: 0,
                scale: .96,
                y: 30,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: .96,
                y: 30,
              }}
              transition={{
                duration: .22,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl my-6"
            >

              <div
                className="rounded-3xl border overflow-hidden flex flex-col max-h-[90vh]"
                style={{
                  background: "#0B1220",
                  borderColor: "#223250",
                }}
              >

                {/* HEADER */}

                <div
                  className="flex justify-between items-start px-8 py-6 shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg,#5B5DDB,#895DF6)",
                  }}
                >

                  <div>

                    <h2 className="text-3xl font-bold text-white">
                      Demo Session Ready 🚀
                    </h2>

                    <p className="text-indigo-100 mt-2">
                      Test BlueJoinet instantly without writing a single line of code.
                    </p>

                  </div>

                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white"
                  >
                    <X size={26} />
                  </button>

                </div>

                {/* BODY */}

                <div className="overflow-y-auto">

                  <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">

                    {/* LEFT */}

                    <div
                      className="p-8 flex flex-col"
                      style={{
                        borderRight:
                          "1px solid #223250",
                      }}
                    >

                      <div className="bg-white rounded-2xl p-5 flex justify-center">

                        <QRCode
                          value={session.receiverUrl}
                          className="w-full h-auto max-w-[220px]"
                        />

                      </div>

                      <h3 className="text-white font-semibold mt-6">
                        Join on your phone
                      </h3>

                      <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                        Scan the QR using your mobile camera and join instantly.
                      </p>

                      <button
                        onClick={onOpenReceiver}
                        className="mt-6 w-full py-3 rounded-xl text-white font-medium transition hover:opacity-95"
                        style={{
                          background:
                            "linear-gradient(135deg,#5B5DDB,#895DF6)",
                        }}
                      >
                        Open Receiver
                      </button>

                      <div
                        className="rounded-2xl mt-8 p-5"
                        style={{
                          background: "#101827",
                          border: "1px solid #223250",
                        }}
                      >

                        <div className="flex gap-3">

                          <Info
                            color="#818CF8"
                            size={18}
                            className="shrink-0 mt-0.5"
                          />

                          <div>

                            <h4 className="text-white font-medium">
                              Tips
                            </h4>

                            <ul className="mt-3 text-sm text-slate-400 space-y-2 leading-relaxed">

                              <li>
                                • Open Caller on your laptop.
                              </li>

                              <li>
                                • Scan the QR using your phone.
                              </li>

                              <li>
                                • Or paste the Receiver link into another browser.
                              </li>

                              <li>
                                • Allow Camera & Microphone permissions.
                              </li>

                            </ul>

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* RIGHT */}

                    <div className="p-8">

                      {/* STATUS */}

                      <div
                        className="rounded-2xl p-5 mb-8"
                        style={{
                          background: "#111827",
                        }}
                      >

                        <div className="flex items-center gap-3">

                          <CheckCircle2
                            color="#22C55E"
                            size={22}
                          />

                          <div>

                            <h4 className="text-white font-semibold">
                              Session Created
                            </h4>

                            <p className="text-slate-400 text-sm">
                              Waiting for participants...
                            </p>

                          </div>

                        </div>

                      </div>

                {/* RIGHT */}

                                      {/* CALLER */}

                      <div className="mb-8">

                        <div className="flex items-center gap-2 mb-3">

                          <Monitor
                            size={18}
                            color="#818CF8"
                          />

                          <h3 className="text-white font-semibold">
                            Caller
                          </h3>

                        </div>

                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "#111827",
                          }}
                        >

                          <div className="break-all text-sm text-slate-400">
                            {session.callerUrl}
                          </div>

                          <div className="flex gap-3 mt-4">

                            <button
                              onClick={() => onCopy(session.callerUrl)}
                              className="flex-1 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                              style={{
                                background: "#1F2937",
                              }}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Copy size={16} />
                                Copy
                              </div>
                            </button>

                            <button
                              onClick={onOpenCaller}
                              className="flex-1 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                              style={{
                                background:
                                  "linear-gradient(135deg,#5B5DDB,#895DF6)",
                              }}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <ExternalLink size={16} />
                                Open
                              </div>
                            </button>

                          </div>

                        </div>

                      </div>

                      {/* RECEIVER */}

                      <div>

                        <div className="flex items-center gap-2 mb-3">

                          <Smartphone
                            size={18}
                            color="#818CF8"
                          />

                          <h3 className="text-white font-semibold">
                            Receiver
                          </h3>

                        </div>

                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "#111827",
                          }}
                        >

                          <div className="break-all text-sm text-slate-400">
                            {session.receiverUrl}
                          </div>

                          <div className="flex gap-3 mt-4">

                            <button
                              onClick={() => onCopy(session.receiverUrl)}
                              className="flex-1 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                              style={{
                                background: "#1F2937",
                              }}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Copy size={16} />
                                Copy
                              </div>
                            </button>

                            <button
                              onClick={onOpenReceiver}
                              className="flex-1 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                              style={{
                                background:
                                  "linear-gradient(135deg,#5B5DDB,#895DF6)",
                              }}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <ExternalLink size={16} />
                                Open
                              </div>
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </motion.div>

          </div>
        </>
      )}
    </AnimatePresence>
  );
}