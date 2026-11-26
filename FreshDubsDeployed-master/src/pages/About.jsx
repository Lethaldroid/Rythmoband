import React from "react";
import { Link } from "react-router-dom";
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import RecordVoiceOverRoundedIcon from "@mui/icons-material/RecordVoiceOverRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import MovieFilterRoundedIcon from "@mui/icons-material/MovieFilterRounded";

const audiences = [
  {
    icon: RecordVoiceOverRoundedIcon,
    title: "Voice actors",
    desc: "Read each line as it reaches the playhead and record take after take until the timing is right.",
  },
  {
    icon: MovieFilterRoundedIcon,
    title: "Directors and studios",
    desc: "Prepare a session in the browser instead of setting up a projection rig or dedicated hardware.",
  },
  {
    icon: TranslateRoundedIcon,
    title: "Translators and adapters",
    desc: "Place your adapted script on the band and adjust where each line starts and ends.",
  },
];

const steps = [
  { title: "Import", desc: "Add your video and its subtitle file." },
  { title: "Align", desc: "Adjust each line's start and end on the rythmo band." },
  { title: "Record", desc: "Speak as the text crosses the playhead. Retake as often as you need." },
  { title: "Export", desc: "Download your audio and the timed script." },
];

function About() {
  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      {/* Intro */}
      <Box component="section" aria-labelledby="about-title" sx={{ position: "relative", pt: { xs: 7, md: 10 }, pb: { xs: 8, md: 10 } }}>
        <Box
          className="ambient-glow ambient-primary"
          sx={{ width: { xs: 300, md: 520 }, height: { xs: 300, md: 520 }, top: -180, left: "-10%" }}
        />
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="overline" component="p" sx={{ color: "#ff8a6e", mb: 1.5 }}>
            About DubMaster
          </Typography>
          <Typography id="about-title" variant="h1" sx={{ fontSize: { xs: 38, sm: 54 }, mb: 3 }}>
            A dubbing studio that runs in your browser
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", fontSize: { xs: 17, sm: 19 }, mb: 2 }}>
            Rythmo band dubbing used to mean specialized hardware, projection
            rigs and a booked recording studio. DubMaster brings the whole
            process into a browser tab.
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", fontSize: { xs: 17, sm: 19 }, mb: 4.5 }}>
            Your script scrolls on a band synced to the video, toward a fixed
            playhead. When a word reaches the line, you say it. You see exactly
            when to speak, so you can focus on the performance.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={Link}
              to="/subplayer"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Open the studio
            </Button>
            <Button component={Link} to="/faq" variant="outlined" size="large">
              Read the FAQ
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Who it's for */}
      <Box
        component="section"
        aria-labelledby="audience-title"
        sx={{ py: { xs: 8, md: 10 }, bgcolor: "var(--bg-surface)", borderBlock: "1px solid var(--border)" }}
      >
        <Container maxWidth="lg">
          <Typography id="audience-title" variant="h2" sx={{ fontSize: { xs: 28, sm: 36 }, mb: { xs: 4, md: 5 } }}>
            Who it's for
          </Typography>
          <Grid container spacing={2.5}>
            {audiences.map(({ icon: Icon, title, desc }) => (
              <Grid item xs={12} md={4} key={title}>
                <Box
                  sx={{
                    p: 3,
                    height: "100%",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    bgcolor: "var(--bg-raised)",
                  }}
                >
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
      <Box component="section" aria-labelledby="how-title" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography id="how-title" variant="h2" sx={{ fontSize: { xs: 28, sm: 36 }, mb: { xs: 4, md: 5 } }}>
            How it works
          </Typography>
          <Grid container spacing={{ xs: 4, md: 3 }} component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
            {steps.map((s, i) => (
              <Grid item xs={12} sm={6} md={3} key={s.title} component="li">
                <Box sx={{ borderTop: "2px solid var(--border-strong)", pt: 2.5, position: "relative" }}>
                  <Box sx={{ position: "absolute", top: -2, left: 0, width: 40, height: 2, bgcolor: "var(--primary)" }} />
                  <Typography aria-hidden sx={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--amber)", mb: 1 }}>
                    {String(i + 1).padStart(2, "0")}
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
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <Button component={Link} to="/user-guide" variant="outlined" endIcon={<ArrowForwardRoundedIcon />}>
              Read the user guide
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default About;
