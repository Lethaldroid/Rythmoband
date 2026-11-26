import { Box, Paper, Typography } from "@mui/material";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import React from "react";

function Notifications({ notifications = [], id }) {
  const items = [...(notifications || [])].reverse();
  return (
    <Paper
      id={id}
      role="region"
      aria-label="Notifications"
      elevation={0}
      sx={{
        position: "absolute",
        right: 0,
        top: "calc(100% + 8px)",
        width: 300,
        maxWidth: "calc(100vw - 24px)",
        zIndex: 1300,
        bgcolor: "var(--bg-raised)",
        backgroundImage: "none",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        textAlign: "left",
      }}
    >
      <Typography
        component="h2"
        sx={{
          px: 2,
          py: 1.5,
          fontSize: 14,
          fontWeight: 600,
          borderBottom: "1px solid var(--border)",
        }}
      >
        Notifications
      </Typography>
      {items.length === 0 ? (
        <Box
          sx={{
            px: 2,
            py: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          <NotificationsOffOutlinedIcon aria-hidden="true" />
          <Typography sx={{ fontSize: 14, color: "var(--text-muted)" }}>
            You're all caught up.
          </Typography>
        </Box>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {items.map((notification, i) => (
            <Box
              component="li"
              key={i}
              sx={{
                px: 2,
                py: 1.5,
                fontSize: 14,
                lineHeight: 1.5,
                color: "var(--text-main)",
                borderBottom: "1px solid var(--border)",
                "&:last-of-type": { borderBottom: "none" },
              }}
            >
              {notification}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default Notifications;
