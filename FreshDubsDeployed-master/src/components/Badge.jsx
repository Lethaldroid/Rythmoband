import React from "react";

const tiers = {
  Basic: { label: "Basic", color: "#a1a1aa", bg: "rgba(161,161,170,.12)", border: "rgba(161,161,170,.3)" },
  Pro: { label: "Pro", color: "#ff8a6e", bg: "rgba(255,90,54,.12)", border: "rgba(255,90,54,.35)" },
  Expert: { label: "Expert", color: "#ffb547", bg: "rgba(255,181,71,.12)", border: "rgba(255,181,71,.35)" },
};

// Membership tier pill.
function Badge({ membership = "Basic" }) {
  const tier = tiers[membership] || tiers.Basic;
  return (
    <span
      title={`${tier.label} plan`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 9999,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: tier.color,
        background: tier.bg,
        border: `1px solid ${tier.border}`,
        lineHeight: 1.5,
      }}
    >
      {tier.label}
    </span>
  );
}

export default Badge;
