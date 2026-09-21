import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", color: "white", background: "linear-gradient(135deg, #050816, #172554)" }}><div style={{ display: "flex", fontSize: 34, color: "#a5b4fc", marginBottom: 28 }}>PurpleCallio</div><div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>Video Calling API &amp; WebRTC SDK</div><div style={{ display: "flex", fontSize: 30, color: "#cbd5e1", marginTop: 28 }}>Add audio, video and screen sharing to your product.</div></div>, size);
}
