import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LinkCraft — Free QR Code Generator & Link Tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 84px",
          background: "#F7F7F4",
          color: "#11110F",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 735 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 800 }}>
            <span>Link</span><span style={{ color: "#FF5C35" }}>Craft</span>
          </div>
          <div style={{ marginTop: 36, fontSize: 72, lineHeight: 0.98, letterSpacing: -4, fontWeight: 800 }}>
            Free QR Code Generator & Link Tools
          </div>
          <div style={{ marginTop: 28, fontSize: 25, lineHeight: 1.35, color: "#696965" }}>
            Customize QR codes, shorten URLs, clean tracking links, build UTM campaigns and more — free.
          </div>
        </div>

        <svg width="300" height="300" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M151 85V260C151 310 180 339 230 339H360" stroke="#FF5C35" strokeWidth="70" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M265 164H356C406 164 435 193 435 243V288C435 338 406 367 356 367H282" stroke="#11110F" strokeWidth="70" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M244 313H298" stroke="#F7F7F4" strokeWidth="20" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
