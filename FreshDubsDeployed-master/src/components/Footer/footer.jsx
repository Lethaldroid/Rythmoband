import React from "react";
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Link, useLocation } from "react-router-dom";
import { footerGroups } from "../../utils/nav";
import Logo from "../Brand/Logo";

const linkSx = {
  color: "var(--text-muted)",
  textDecoration: "none",
  fontSize: 14,
  borderRadius: "4px",
  transition: "color 120ms",
  "&:hover": { color: "var(--text-main)" },
};

function Footer() {
  const location = useLocation();

  // Dashboard and the full-screen studio have their own chrome.
  if (
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/app")
  ) {
    return null;
  }

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "var(--bg-main)",
        borderTop: "1px solid var(--border)",
        pt: { xs: 7, md: 9 },
        pb: 5,
        mt: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 5, md: 6 }} sx={{ mb: 6 }}>
          <Grid item xs={12} md={5}>
            <Box component={Link} to="/" aria-label="DubMaster home" sx={{ display: "inline-flex", mb: 2, borderRadius: 1 }}>
              <Logo size={30} />
            </Box>
            <Typography variant="body2" sx={{ color: "var(--text-muted)", mb: 3, lineHeight: 1.7, maxWidth: 340 }}>
              The in-browser dubbing studio. Scrolling rythmo band, frame-accurate
              subtitles and multi-take recording, all in one tab.
            </Typography>
            <Button component={Link} to="/signup" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
              Start dubbing free
            </Button>
          </Grid>

          {footerGroups.map((group) => (
            <Grid item xs={6} sm={4} md={7 / 3} key={group.title}>
              <Box component="nav" aria-label={group.title}>
                <Typography
                  component="h2"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-subtle)",
                    mb: 2,
                  }}
                >
                  {group.title}
                </Typography>
                <Stack component="ul" spacing={1.25} sx={{ listStyle: "none", p: 0, m: 0 }}>
                  {group.items.map((item) => (
                    <li key={item.text}>
                      <Box component={Link} to={item.link} sx={linkSx}>
                        {item.text}
                      </Box>
                    </li>
                  ))}
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            pt: 3,
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            gap: 1,
            color: "var(--text-subtle)",
          }}
        >
          <Typography variant="caption">
            © {new Date().getFullYear()} DubMaster. All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: "var(--font-mono)" }}>
            Runs entirely in your browser
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
