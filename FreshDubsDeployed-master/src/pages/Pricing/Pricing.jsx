import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Container, Link, Typography } from "@mui/material";
import PricingCard from "./PricingCard";
import { pricingOptions } from "../../utils/pricing";

function Pricing() {
  return (
    <Box
      component="section"
      aria-labelledby="pricing-title"
      sx={{ pt: { xs: 7, md: 10 }, pb: { xs: 10, md: 14 }, position: "relative", overflow: "hidden" }}
    >
      <Box
        className="ambient-glow ambient-primary"
        sx={{ width: { xs: 300, md: 560 }, height: { xs: 300, md: 560 }, top: -200, left: "50%", transform: "translateX(-50%)" }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", maxWidth: 640, mx: "auto", mb: { xs: 6, md: 8 } }}>
          <Typography variant="overline" component="p" sx={{ color: "#ff8a6e", mb: 1.5 }}>
            Pricing
          </Typography>
          <Typography id="pricing-title" variant="h1" sx={{ fontSize: { xs: 38, sm: 52 }, mb: 2 }}>
            Pick the plan that fits your work
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", fontSize: { xs: 16, sm: 18 } }}>
            Start free and upgrade when your projects get longer. Every plan
            runs in your browser, with nothing to install.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: { xs: 3, md: 3 },
            alignItems: "stretch",
            maxWidth: { xs: 440, md: "none" },
            mx: "auto",
          }}
        >
          {pricingOptions.map((option) => (
            <PricingCard key={option.plan} {...option} />
          ))}
        </Box>

        <Box sx={{ textAlign: "center", mt: { xs: 6, md: 8 } }}>
          <Typography sx={{ color: "var(--text-muted)" }}>
            Paid plans include a 10-day free trial. Cancel anytime.
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", mt: 1 }}>
            Questions about billing?{" "}
            <Link component={RouterLink} to="/faq" sx={{ fontWeight: 600 }}>
              Read the FAQ
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Pricing;
