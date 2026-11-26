import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Link, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const sections = [
  { id: "getting-started", label: "Getting started" },
  { id: "video-walkthrough", label: "Video walkthrough" },
  { id: "keyboard-shortcuts", label: "Keyboard shortcuts" },
];

const steps = [
  {
    title: "Import your video and subtitles",
    desc: "Open the studio and add your video along with its SRT or JSON subtitle file.",
  },
  {
    title: "Align the lines",
    desc: "Fine-tune where each line starts and ends on the rythmo band so the text matches the picture.",
  },
  {
    title: "Record",
    desc: "Press Shift + Space and read each line as it crosses the playhead. Record as many takes as you need.",
  },
  {
    title: "Review and trim",
    desc: "Play your takes back against the video. Press C to split a take at the playhead and keep the part you want.",
  },
  {
    title: "Save and export",
    desc: "Press S to save your project, then download your audio and timed script.",
  },
];

// Mirrors the editor hotkeys registered in src/App.js.
const shortcuts = [
  { combos: [["Space"]], action: "Play / pause" },
  { combos: [["Shift", "Space"]], action: "Start / stop recording" },
  { combos: [["C"]], action: "Trim: split the take at the playhead" },
  { combos: [["←"], ["→"]], action: "Step back / forward 5 seconds" },
  { combos: [["Shift", "←"], ["Shift", "→"]], action: "Step back / forward 10 seconds" },
  { combos: [["G"]], action: "Jump to the start of your last take" },
  { combos: [["Ctrl", "Z"]], action: "Undo", mac: "⌘ Z" },
  { combos: [["Ctrl", "Y"]], action: "Redo", mac: "⌘ Shift Z" },
  { combos: [["S"]], action: "Save project", note: "Ctrl + S also works" },
];

function Kbd({ children }) {
  return (
    <Box
      component="kbd"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 32,
        height: 30,
        px: 1,
        borderRadius: "8px",
        border: "1px solid var(--border-strong)",
        borderBottomWidth: 3,
        bgcolor: "var(--bg-raised)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        color: "var(--text-main)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

function KeyCombo({ keys }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      {keys.map((k, i) => (
        <React.Fragment key={k}>
          {i > 0 && (
            <Box component="span" sx={{ color: "var(--text-muted)", fontSize: 13 }}>
              +
            </Box>
          )}
          <Kbd>{k}</Kbd>
        </React.Fragment>
      ))}
    </Box>
  );
}

const sectionHeadingSx = { fontSize: { xs: 26, sm: 32 }, mb: 2, scrollMarginTop: "88px" };

function UserGuide() {
  return (
    <Box sx={{ pt: { xs: 7, md: 10 }, pb: { xs: 10, md: 14 } }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box component="header" sx={{ mb: { xs: 5, md: 6 } }}>
          <Typography variant="overline" component="p" sx={{ color: "#ff8a6e", mb: 1.5 }}>
            Help
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: 38, sm: 52 }, mb: 2 }}>
            User guide
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", fontSize: { xs: 16, sm: 18 } }}>
            Everything you need to go from a raw video to a finished dub in
            DubMaster.
          </Typography>
        </Box>

        {/* Table of contents */}
        <Box
          component="nav"
          aria-labelledby="toc-title"
          sx={{
            mb: { xs: 6, md: 8 },
            p: { xs: 2.5, sm: 3 },
            borderRadius: "16px",
            border: "1px solid var(--border)",
            bgcolor: "var(--bg-surface)",
          }}
        >
          <Typography id="toc-title" component="h2" sx={{ fontWeight: 600, fontSize: 15, mb: 1.5 }}>
            On this page
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 0.5, color: "var(--text-muted)" }}>
            {sections.map((s) => (
              <li key={s.id}>
                <Link
                  href={`#${s.id}`}
                  sx={{ display: "inline-block", py: 0.75, color: "var(--text-main)", fontWeight: 500 }}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </Box>
        </Box>

        {/* Getting started */}
        <Box component="section" aria-labelledby="getting-started" sx={{ mb: { xs: 7, md: 9 } }}>
          <Typography id="getting-started" variant="h2" sx={sectionHeadingSx}>
            Getting started
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", mb: 4 }}>
            A typical project takes five steps.
          </Typography>
          <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 2 }}>
            {steps.map((step, i) => (
              <Box
                component="li"
                key={step.title}
                sx={{
                  display: "flex",
                  gap: { xs: 2, sm: 2.5 },
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  bgcolor: "var(--bg-surface)",
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "var(--primary-soft)",
                    color: "var(--primary)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  {i + 1}
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontSize: 19, mb: 0.5 }}>
                    {step.title}
                  </Typography>
                  <Typography sx={{ color: "var(--text-muted)", lineHeight: 1.65 }}>{step.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 4 }}>
            <Button component={RouterLink} to="/app/new" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
              Open the studio
            </Button>
          </Box>
        </Box>

        {/* Video */}
        <Box component="section" aria-labelledby="video-walkthrough" sx={{ mb: { xs: 7, md: 9 } }}>
          <Typography id="video-walkthrough" variant="h2" sx={sectionHeadingSx}>
            Video walkthrough
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", mb: 3 }}>
            Prefer to watch? This video shows the workflow from start to finish.
            Some screens may look different from the current version.
          </Typography>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid var(--border)",
              bgcolor: "var(--bg-surface)",
              "& iframe": { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 },
            }}
          >
            <iframe
              src="https://www.youtube.com/embed/uX2cXg0vLrw"
              title="DubMaster user guide video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </Box>
        </Box>

        {/* Shortcuts */}
        <Box component="section" aria-labelledby="keyboard-shortcuts">
          <Typography id="keyboard-shortcuts" variant="h2" sx={sectionHeadingSx}>
            Keyboard shortcuts
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", mb: 3 }}>
            Shortcuts work while you're in the editor. On a Mac, use ⌘ in place
            of Ctrl.
          </Typography>
          <Box
            sx={{
              borderRadius: "16px",
              border: "1px solid var(--border)",
              bgcolor: "var(--bg-surface)",
              overflow: "hidden",
            }}
          >
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
                "& th, & td": {
                  textAlign: "left",
                  px: { xs: 2, sm: 3 },
                  py: 1.75,
                  borderTop: "1px solid var(--border)",
                  verticalAlign: "middle",
                },
                "& thead th": {
                  borderTop: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  bgcolor: "var(--bg-raised)",
                },
              }}
            >
              <caption className="visually-hidden">DubMaster editor keyboard shortcuts</caption>
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Keys</th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map((s) => (
                  <tr key={s.action}>
                    <Box component="th" scope="row" sx={{ fontWeight: 400, color: "var(--text-main)", fontSize: 15 }}>
                      {s.action}
                      {(s.note || s.mac) && (
                        <Box component="span" sx={{ display: "block", fontSize: 13, color: "var(--text-muted)", mt: 0.25 }}>
                          {s.note || `Mac: ${s.mac}`}
                        </Box>
                      )}
                    </Box>
                    <td>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
                        {s.combos.map((keys, i) => (
                          <React.Fragment key={keys.join("+")}>
                            {i > 0 && (
                              <Box component="span" sx={{ color: "var(--text-muted)", fontSize: 13 }}>
                                /
                              </Box>
                            )}
                            <KeyCombo keys={keys} />
                          </React.Fragment>
                        ))}
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
          <Typography sx={{ color: "var(--text-muted)", mt: 4 }}>
            Can't find what you need?{" "}
            <Link component={RouterLink} to="/faq" sx={{ fontWeight: 600 }}>
              Check the FAQ
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default UserGuide;
