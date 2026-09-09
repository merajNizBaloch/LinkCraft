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

        <svg width="330" height="282" viewBox="0 0 472 403" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(-202 0)" fill="#11110F" fillRule="evenodd">
            <path d="M 661 288 L 660 286 L 583 286 L 579 305 L 570 315 L 561 319 L 485 320 L 466 336 L 439 349 L 414 354 L 373 355 L 398 375 L 417 384 L 437 389 L 569 390 L 588 387 L 602 382 L 621 371 L 643 349 L 657 321 L 660 308 Z" />
            <path d="M 336 241 L 338 243 L 403 242 L 403 196 L 406 183 L 411 174 L 419 165 L 435 156 L 443 154 L 559 154 L 572 160 L 578 167 L 582 177 L 582 195 L 584 197 L 659 197 L 661 195 L 661 174 L 658 156 L 649 134 L 641 122 L 629 109 L 611 96 L 587 86 L 576 84 L 438 84 L 423 87 L 398 97 L 380 109 L 362 127 L 351 143 L 343 160 L 337 182 Z" />
          </g>
          <g transform="translate(-202 0)" fill="#FF5C35" fillRule="evenodd">
            <path d="M 215 13 L 214 254 L 219 278 L 233 304 L 256 325 L 272 333 L 292 338 L 415 338 L 442 331 L 466 317 L 477 307 L 491 288 L 496 278 L 502 258 L 503 206 L 496 190 L 489 183 L 475 176 L 458 176 L 442 184 L 434 194 L 430 204 L 428 247 L 425 253 L 414 263 L 402 266 L 323 266 L 309 262 L 301 255 L 295 241 L 295 50 L 293 42 L 286 29 L 279 22 L 269 16 L 260 13 Z" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
