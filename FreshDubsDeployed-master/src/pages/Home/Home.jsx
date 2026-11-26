import React from "react";
import { Link } from "react-router-dom";
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import SubtitlesRoundedIcon from "@mui/icons-material/SubtitlesRounded";
import ViewTimelineRoundedIcon from "@mui/icons-material/ViewTimelineRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import StudioPreview from "./StudioPreview";

const features = [
  {
    icon: ViewTimelineRoundedIcon,
    title: "Rythmo band",
    desc: "Dialogue scrolls toward a fixed playhead in sync with the picture, so you see exactly when each word lands.",
  },
  {
    icon: MicRoundedIcon,
    title: "Multi-take recording",
    desc: "Record straight from the browser. Keep every take, compare them, and trim the one you like.",
  },
  {
    icon: GraphicEqRoundedIcon,
    title: "Waveform view",
    desc: "Check your timing, pauses and level against the original track before you commit a take.",
  },
  {
    icon: FileDownloadRoundedIcon,
    title: "WAV & MP3 export",
    desc: "Export finished audio and updated subtitles, ready for your editor or DAW.",
  },
];

const steps = [
  { tc: "00:01", title: "Import", desc: "Add your video and its SRT or JSON subtitle file." },
  { tc: "00:02", title: "Align", desc: "Fine-tune where each line starts and ends on the band." },
  { tc: "00:03", title: "Record", desc: "Read each line as it crosses the playhead. Retake as often as you need." },
  { tc: "00:04", title: "Export", desc: "Download your audio and timed script in one click." },
];

const shortcuts = [
  { keys: ["Space"], action: "Play / pause" },
  { keys: ["Shift", "Space"], action: "Start / stop recording" },
  { keys: ["←", "→"], sep: "/", action: "Step back / forward" },
  { keys: ["C"], action: "Trim take" },
  { keys: ["Ctrl", "Z"], action: "Undo" },
  { keys: ["S"], action: "Save project" },
];

function SectionHeading({ eyebrow, title, intro, align = "center" }) {
  return (
    <Box sx={{ textAlign: align, maxWidth: 640, mx: align === "center" ? "auto" : 0, mb: { xs: 5, md: 7 } }}>
      {eyebrow && (
        <Typography variant="overline" component="p" sx={{ color: "#ff8a6e", mb: 1.5 }}>
          {eyebrow}
        </Typography>
      )}
      <Typography variant="h2" sx={{ fontSize: { xs: 30, sm: 40 }, mb: intro ? 2 : 0 }}>
        {title}
      </Typography>
      {intro && (
        <Typography sx={{ color: "var(--text-muted)", fontSize: { xs: 16, sm: 17 } }}>{intro}</Typography>
      )}
    </Box>
  );
}

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
      }}
    >
      {children}
    </Box>
  );
}

function Home() {
  return (
    <Box sx={{ overflowX: "hidden", position: "relative" }}>
      {/* Hero */}
      <Box component="section" aria-labelledby="hero-title" sx={{ position: "relative", pt: { xs: 7, md: 11 }, pb: { xs: 8, md: 12 } }}>
        <Box
          className="ambient-glow ambient-primary"
          sx={{ width: { xs: 320, md: 640 }, height: { xs: 320, md: 640 }, top: -160, left: "50%", transform: "translateX(-50%)" }}
        />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ textAlign: "center", maxWidth: 820, mx: "auto", mb: { xs: 6, md: 8 } }}>
            <Box sx={{ mb: 3 }}>
              <span className="pill-badge">
                <span className="rec-dot" /> Dubbing studio in your browser
              </span>
            </Box>
            <Typography
              id="hero-title"
              variant="h1"
              sx={{ fontSize: { xs: 44, sm: 60, md: 76 }, mb: 3 }}
            >
              Hit every line.{" "}
              <Box component="span" sx={{ color: "var(--primary)" }}>
                On every frame.
              </Box>
            </Typography>
            <Typography
              sx={{ fontSize: { xs: 17, sm: 19 }, color: "var(--text-muted)", maxWidth: 620, mx: "auto", mb: 4.5 }}
            >
              DubMaster puts your script on a scrolling rythmo band synced to the
              video, so voice actors know exactly when to speak. Record, review
              and export without leaving the tab.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
              <Button
                component={Link}
                to="/app/new"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Open the studio
              </Button>
              <Button
                component={Link}
                to="/subplayer"
                variant="outlined"
                size="large"
                startIcon={<SubtitlesRoundedIcon />}
              >
                Try the subtitle editor
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ color: "var(--text-subtle)", mt: 2 }}>
              Free to start. Nothing to install.
            </Typography>
          </Box>

          <Box sx={{ maxWidth: 1040, mx: "auto" }}>
            <StudioPreview />
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Box component="section" aria-labelledby="features-title" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box id="features-title">
            <SectionHeading
              eyebrow="What's inside"
              title="Everything the booth needs"
              intro="The tools voice actors, directors and translators use to match lip movement, pacing and delivery."
            />
          </Box>
          <Grid container spacing={2.5}>
            {features.map(({ icon: Icon, title, desc }) => (
              <Grid item xs={12} sm={6} md={3} key={title}>
                <Box className="interactive-card" sx={{ p: 3, height: "100%" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "var(--primary-soft)",
                      color: "var(--primary)",
                      mb: 2.5,
                    }}
                  >
                    <Icon aria-hidden />
                  </Box>
                  <Typography variant="h3" sx={{ fontSize: 19, mb: 1 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
                    {desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How it works */}
      <Box
        component="section"
        aria-labelledby="steps-title"
        sx={{ py: { xs: 8, md: 12 }, bgcolor: "var(--bg-surface)", borderBlock: "1px solid var(--border)" }}
      >
        <Container maxWidth="lg">
          <Box id="steps-title">
            <SectionHeading eyebrow="How it works" title="From raw video to finished dub" />
          </Box>
          <Grid container spacing={{ xs: 4, md: 3 }} component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
            {steps.map((s) => (
              <Grid item xs={12} sm={6} md={3} key={s.title} component="li">
                <Box sx={{ borderTop: "2px solid var(--border-strong)", pt: 2.5, position: "relative" }}>
                  <Box sx={{ position: "absolute", top: -2, left: 0, width: 40, height: 2, bgcolor: "var(--primary)" }} />
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--amber)", mb: 1 }}>
                    {s.tc}
                  </Typography>
                  <Typography variant="h3" sx={{ fontSize: 22, mb: 1 }}>
                    {s.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
                    {s.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Keyboard-first */}
      <Box component="section" aria-labelledby="keys-title" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography variant="overline" component="p" sx={{ color: "#ff8a6e", mb: 1.5 }}>
                Built for the booth
              </Typography>
              <Typography id="keys-title" variant="h2" sx={{ fontSize: { xs: 30, sm: 40 }, mb: 2 }}>
                Keep your eyes on the picture
              </Typography>
              <Typography sx={{ color: "var(--text-muted)", mb: 3.5 }}>
                Every core action has a shortcut, so you can play, record, retake
                and trim without reaching for the mouse.
              </Typography>
              <Button component={Link} to="/user-guide" variant="outlined" endIcon={<ArrowForwardRoundedIcon />}>
                Read the user guide
              </Button>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  bgcolor: "var(--bg-surface)",
                  overflow: "hidden",
                }}
              >
                {shortcuts.map((s, i) => (
                  <Box
                    key={s.action}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      px: { xs: 2, sm: 3 },
                      py: 1.75,
                      borderTop: i ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <Box component="dt" sx={{ color: "var(--text-main)", fontSize: 15 }}>
                      {s.action}
                    </Box>
                    <Box component="dd" sx={{ m: 0, display: "flex", gap: 0.75, alignItems: "center" }}>
                      {s.keys.map((k, j) => (
                        <React.Fragment key={k}>
                          {j > 0 && (
                            <Box component="span" aria-hidden sx={{ color: "var(--text-subtle)", fontSize: 12 }}>
                              {s.sep || "+"}
                            </Box>
                          )}
                          <Kbd>{k}</Kbd>
                        </React.Fragment>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box component="section" aria-labelledby="cta-title">
        <Container maxWidth="lg">
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "28px",
              border: "1px solid rgba(255,90,54,.3)",
              background:
                "radial-gradient(90% 140% at 100% 0%, rgba(255,90,54,.28) 0%, transparent 55%), radial-gradient(70% 120% at 0% 100%, rgba(255,181,71,.14) 0%, transparent 60%), var(--bg-surface)",
              p: { xs: 4, sm: 6, md: 8 },
              textAlign: "center",
            }}
          >
            <Typography id="cta-title" variant="h2" sx={{ fontSize: { xs: 30, sm: 44 }, mb: 2 }}>
              Your next dub starts here
            </Typography>
            <Typography sx={{ color: "var(--text-muted)", fontSize: 18, maxWidth: 520, mx: "auto", mb: 4 }}>
              Create a free account and record your first line in minutes.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
              <Button component={Link} to="/signup" variant="contained" size="large">
                Create free account
              </Button>
              <Button component={Link} to="/pricing" variant="outlined" size="large">
                Compare plans
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
