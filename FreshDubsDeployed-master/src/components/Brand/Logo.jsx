import React from "react";

// DubMaster mark: a waveform cut by a playhead, inside a rounded tile.
export function LogoMark({ size = 32, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="32" height="32" rx="9" fill="#ff5a36" />
      <g fill="#140805">
        <rect x="6" y="13" width="2.6" height="6" rx="1.3" />
        <rect x="10.4" y="9.5" width="2.6" height="13" rx="1.3" />
        <rect x="14.8" y="6.5" width="2.6" height="19" rx="1.3" />
        <rect x="19.2" y="11" width="2.6" height="10" rx="1.3" />
        <rect x="23.6" y="14" width="2.6" height="4" rx="1.3" />
      </g>
    </svg>
  );
}

// Mark + wordmark. `size` is the mark height in px; the text scales with it.
export default function Logo({ size = 30, showText = true, color = "#f4f4f5" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(size * 0.32),
        color,
        lineHeight: 1,
      }}
    >
      <LogoMark size={size} />
      {showText && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: Math.round(size * 0.68),
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          Dub<span style={{ color: "#ff5a36" }}>Master</span>
        </span>
      )}
    </span>
  );
}
