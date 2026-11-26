import React, { useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";

function PricingCard({ plan, price, desc, core, listings, blue, price_id }) {
  const { user } = useSelector((state) => state.user);
  const [clicked, setClicked] = useState(false);
  const navigate = useNavigate();

  const isPopular = !blue; // Pro plan is highlighted
  const headingId = `plan-${plan.toLowerCase()}-title`;
  const isFree = plan === "Basic";

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  const handlePayment = async (priceId) => {
    if (priceId === "login" || !getCookie("jwt_Token")) {
      navigate("/login");
      return;
    }
    try {
      const body = { product: priceId, customerId: user.customerId };
      const headers = {
        "Content-Type": "application/json",
      };
      setClicked(true);
      const response = await fetch(
        `${API_BASE_URL}/api/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body),
        }
      );
      setClicked(false);
      const session = await response.json();
      if (session?.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      setClicked(false);
      console.error("Stripe Checkout Error:", error);
    }
  };

  return (
    <Box
      component="article"
      aria-labelledby={headingId}
      sx={{
        position: "relative",
        borderRadius: "20px",
        p: { xs: 3, md: 4 },
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: isPopular ? "var(--bg-raised)" : "var(--bg-surface)",
        border: isPopular ? "1px solid var(--primary)" : "1px solid var(--border)",
        boxShadow: isPopular ? "var(--glow-primary)" : "none",
      }}
    >
      {/* Plan header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Typography id={headingId} variant="h2" sx={{ fontSize: 24 }}>
          {plan}
        </Typography>
        {isPopular && (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.25,
              py: 0.25,
              borderRadius: "var(--radius-full)",
              bgcolor: "var(--primary-soft)",
              color: "var(--primary-hover)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <StarRoundedIcon aria-hidden sx={{ fontSize: 16 }} /> Recommended
          </Box>
        )}
      </Box>
      <Typography variant="body2" sx={{ color: "var(--text-muted)", mb: 3, minHeight: { md: 40 } }}>
        {desc}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 3 }}>
        <Typography
          component="p"
          sx={{
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            fontSize: 44,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "var(--text-main)",
          }}
        >
          ${price}
          <span className="visually-hidden"> per month</span>
        </Typography>
        <Typography component="span" aria-hidden sx={{ color: "var(--text-muted)", fontSize: 15 }}>
          / month
        </Typography>
      </Box>

      {/* Primary action */}
      <Button
        variant={isPopular ? "contained" : "outlined"}
        size="large"
        fullWidth
        disabled={clicked}
        aria-busy={clicked || undefined}
        startIcon={clicked ? <CircularProgress size={18} color="inherit" aria-hidden /> : null}
        onClick={() => handlePayment(price_id)}
      >
        {clicked
          ? "Redirecting…"
          : isFree
          ? "Get started free"
          : "Start 10-day free trial"}
      </Button>

      {/* Features */}
      <Box sx={{ mt: 3.5, pt: 3, borderTop: "1px solid var(--border)", flexGrow: 1 }}>
        {core && (
          <Typography
            id={`${headingId}-features`}
            component="p"
            sx={{ fontWeight: 600, fontSize: 14, color: "var(--text-main)", mb: 2 }}
          >
            {core}
          </Typography>
        )}
        <Box
          component="ul"
          aria-labelledby={core ? `${headingId}-features` : undefined}
          sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 1.5 }}
        >
          {listings.map((item) => (
            <Box
              component="li"
              key={item}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.25,
                fontSize: 15,
                lineHeight: 1.5,
                color: "var(--text-muted)",
              }}
            >
              <CheckRoundedIcon
                aria-hidden
                sx={{ fontSize: 20, color: isPopular ? "var(--primary)" : "var(--success)", flexShrink: 0, mt: "1px" }}
              />
              <span>{item}</span>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default PricingCard;
