import React from "react";
import { Box, Typography } from "@mui/material";

// Decorative mock of the studio: video frame, scrolling rythmo band past a
// playhead, and a recording waveform. Pure CSS, no media.
const lines = [
  { who: "MAYA", text: "We don't have much time left." },
  { who: "LEO", text: "Then stop talking and run!" },
  { who: "MAYA", text: "Wait — do you hear that?" },
  { who: "LEO", text: "It's coming from below us…" },
];

const bars = Array.from({ length: 64 }, (_, i) =>
  Math.round(18 + Math.abs(Math.sin(i * 0.55) * 52 + Math.sin(i * 1.7) * 22))
);

export default function StudioPreview() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        borderRadius: "20px",
        border: "1px solid var(--border-strong)",
        bgcolor: "#0f0f12",
        boxShadow: "var(--shadow-xl)",
        overflow: "hidden",
        "@keyframes bandScroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "@keyframes waveIn": {
          from: { transform: "scaleY(0.2)" },
          to: { transform: "scaleY(1)" },
        },
      }}
    >
      {/* Window bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.25,
          borderBottom: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-subtle)",
        }}
      >
        <Box sx={{ display: "flex", gap: 0.75 }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "rgba(255,255,255,.14)" }} />
          ))}
        </Box>
        <Box sx={{ flex: 1, textAlign: "center", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          episode_04_scene_12.mp4
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "#ff8a6e", fontWeight: 600 }}>
          <span className="rec-dot" /> REC
        </Box>
      </Box>

      {/* Video frame */}
      <Box
        sx={{
          position: "relative",
          aspectRatio: { xs: "16 / 9", md: "21 / 8" },
          background:
            "radial-gradient(120% 90% at 70% 30%, #3a2a24 0%, #1a1416 45%, #0d0d10 100%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          p: 2,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0 30%, rgba(255,181,71,.07) 30% 31%, transparent 31%), repeating-linear-gradient(0deg, rgba(255,255,255,.015) 0 2px, transparent 2px 4px)",
          }}
        />
        <Typography
          sx={{
            position: "relative",
            fontFamily: "var(--font-mono)",
            fontSize: { xs: 12, sm: 14 },
            color: "var(--amber)",
            bgcolor: "rgba(0,0,0,.45)",
            px: 1,
            py: 0.25,
            borderRadius: 1,
          }}
        >
          00:12:41:07
        </Typography>
        <Typography
          sx={{
            position: "relative",
            fontSize: { xs: 11, sm: 12 },
            color: "var(--text-muted)",
            bgcolor: "rgba(0,0,0,.45)",
            px: 1,
            py: 0.25,
            borderRadius: 1,
          }}
        >
          Take 3 of 5
        </Typography>
      </Box>

      {/* Rythmo band */}
      <Box sx={{ position: "relative", borderTop: "1px solid var(--border)", bgcolor: "#121216", overflow: "hidden", py: 1.75 }}>
        <Box
          sx={{
            display: "flex",
            width: "max-content",
            animation: "bandScroll 22s linear infinite",
          }}
        >
          {[...lines, ...lines].map((l, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "baseline",
                gap: 1.25,
                px: 3,
                mr: 2,
                py: 0.75,
                borderRadius: 2,
                bgcolor: l.who === "MAYA" ? "rgba(255,90,54,.10)" : "rgba(255,181,71,.08)",
                borderLeft: `3px solid ${l.who === "MAYA" ? "#ff5a36" : "#ffb547"}`,
                whiteSpace: "nowrap",
              }}
            >
              <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-subtle)" }}>
                {l.who}
              </Box>
              <Box component="span" sx={{ fontFamily: "var(--font-display)", fontSize: { xs: 16, sm: 20 }, fontWeight: 600, color: "var(--text-main)" }}>
                {l.text}
              </Box>
            </Box>
          ))}
        </Box>
        {/* Playhead */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "28%",
            width: "2px",
            bgcolor: "var(--primary)",
            boxShadow: "0 0 12px 2px rgba(255,90,54,.6)",
          }}
        />
      </Box>

      {/* Waveform */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "3px",
          height: 56,
          px: 2,
          borderTop: "1px solid var(--border)",
          bgcolor: "#0f0f12",
        }}
      >
        {bars.map((h, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: `${h}%`,
              borderRadius: 2,
              bgcolor: i < 22 ? "var(--primary)" : "rgba(255,255,255,.14)",
              transformOrigin: "center",
              animation: `waveIn 600ms ${i * 12}ms both cubic-bezier(.16,1,.3,1)`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
