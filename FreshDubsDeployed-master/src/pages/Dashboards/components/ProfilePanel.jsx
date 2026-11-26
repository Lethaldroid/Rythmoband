import { Box, Button, ButtonBase, Paper, Typography } from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import Badge from "../../../components/Badge";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { eraseCookie, getCookie } from "../../../utils/cookies";
import { useDispatch, useSelector } from "react-redux";
import { getUserInfos, logout } from "../../../store/features/userSlice";
import axios from "axios";
import { API_BASE_URL } from "../../../config";
import { Link, useLocation } from "react-router-dom";

const itemSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 1.5,
  width: "100%",
  minHeight: 44,
  px: 2,
  fontSize: 14,
  fontWeight: 500,
  color: "var(--text-main)",
  textDecoration: "none",
  textAlign: "left",
  cursor: "pointer",
  "& svg": { fontSize: 20, color: "var(--text-muted)" },
  "&:hover": { bgcolor: "var(--bg-hover)" },
  "&:focus-visible": { bgcolor: "var(--bg-hover)" },
};

function ProfilePanel({ className, id }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      const formData = { base64, email: user.email };

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/user/upload-pic`,
          formData
        );
        dispatch(getUserInfos());
      } catch (error) {
        console.error("Error occurred during image upload:", error);
      }
    };
    reader.readAsDataURL(file);
  }, []);
  const { user } = useSelector((state) => state.user);
  const handleLogout = () => {
    eraseCookie("jwt_Token");
    dispatch(logout());
    window.location.href = "/login";
  };
  const handleCustomer = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/stripe/manage-billing`,
        {
          headers: {
            Authorization: "Bearer " + getCookie("jwt_Token"),
          },
        }
      );
      const { session } = response.data;
      window.location.href = session;
    } catch (error) {
      console.log(error);
    }
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  return (
    <Paper
      id={id}
      className={className}
      role="region"
      aria-label="Account"
      elevation={0}
      sx={{
        position: "absolute",
        right: 0,
        top: "calc(100% + 8px)",
        width: 260,
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
      <Box sx={{ px: 2, py: 1.75, borderBottom: "1px solid var(--border)" }}>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user?.userName}
        </Typography>
        {user?.email && (
          <Typography
            sx={{
              fontSize: 13,
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
          <Typography component="span" sx={{ fontSize: 13, color: "var(--text-muted)" }}>
            Plan
          </Typography>
          <Badge membership={user?.membership} />
        </Box>
      </Box>

      <Box sx={{ py: 0.5 }}>
        {location.pathname.startsWith("/dashboard") ? (
          <Box
            {...getRootProps({ role: "button", "aria-label": "Change profile photo" })}
            sx={itemSx}
          >
            <input {...getInputProps()} />
            <PhotoCameraOutlinedIcon aria-hidden="true" />
            Change profile photo
          </Box>
        ) : (
          <Box component={Link} to={`/dashboard/${user?.userName}`} sx={itemSx}>
            <DashboardOutlinedIcon aria-hidden="true" />
            Go to dashboard
          </Box>
        )}
        <ButtonBase onClick={handleCustomer} sx={itemSx}>
          <CreditCardOutlinedIcon aria-hidden="true" />
          Manage subscription
        </ButtonBase>
      </Box>

      <Box sx={{ p: 1.5, borderTop: "1px solid var(--border)" }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<LogoutRoundedIcon />}
          onClick={() => handleLogout()}
        >
          Log out
        </Button>
      </Box>
    </Paper>
  );
}

export default ProfilePanel;
