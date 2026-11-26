import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import { Form, Field, Formik } from "formik";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import * as Yup from "yup";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import Logo from "../../components/Brand/Logo";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

function Reset() {
  const { id, token } = useParams();
  const [data, setData] = useState({});
  const [sent, setSent] = useState(false);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  useEffect(() => {
    if (getCookie("resetPass") === undefined) {
      setExpired(true);
    } else {
      setExpired(false);
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/user/reset-password/${id}/${token}`,
          { withCredentials: true }
        );
        setData(response.data);
      } catch (error) {
        console.error(error.response?.data);
      }
    };

    fetchUser();
  }, [id, token]);

  const initialValues = {
    password: "",
    confirmPassword: "",
  };

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(6, "Use at least 6 characters")
      .required("Enter a new password"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords don't match")
      .required("Enter your new password again"),
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/reset-password/${id}/${token}`,
        values
      );
      if (response) {
        setSent(true);
        setLoading(false);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      setErrorMsg(error.response?.data?.message || "We couldn't update your password. Try again.");
    }
  };

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setShowPassword(!showPassword)}
        edge="end"
        aria-label="Show passwords"
        aria-pressed={showPassword}
        aria-controls="reset-password reset-confirm-password"
        sx={{ color: "text.secondary", width: 40, height: 40 }}
      >
        {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
      </IconButton>
    </InputAdornment>
  );

  const noticeSx = {
    display: "flex",
    gap: 2,
    alignItems: "flex-start",
    p: 2.5,
    mt: 3,
    borderRadius: "var(--radius-lg)",
    bgcolor: "var(--bg-raised)",
    border: "1px solid var(--border)",
  };

  return (
    <Box
      component="section"
      aria-labelledby="reset-title"
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        px: 2,
        py: { xs: 5, md: 8 },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 440,
          mx: "auto",
          p: { xs: 3, sm: 5 },
          borderRadius: "var(--radius-xl)",
          bgcolor: "var(--bg-surface)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <Link component={RouterLink} to="/" aria-label="DubMaster home" sx={{ display: "inline-flex", mb: 3 }}>
          <Logo size={30} />
        </Link>
        <Typography id="reset-title" variant="h1" sx={{ fontSize: { xs: 28, sm: 32 }, mb: 1 }}>
          Choose a new password
        </Typography>

        {!expired && !sent && data.userName && (
          <Typography sx={{ color: "text.secondary", overflowWrap: "anywhere" }}>
            Set a new password for <Box component="strong" sx={{ color: "text.primary" }}>{data.email}</Box>.
          </Typography>
        )}

        {sent ? (
          <Box role="status" sx={noticeSx}>
            <CheckCircleRoundedIcon aria-hidden="true" sx={{ color: "success.main", fontSize: 28, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Password updated</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Taking you to sign in…
              </Typography>
            </Box>
          </Box>
        ) : expired ? (
          <>
            <Box sx={noticeSx}>
              <ErrorOutlineRoundedIcon aria-hidden="true" sx={{ color: "error.main", fontSize: 28, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>This link has expired</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Reset links work for 15 minutes. Request a new one to continue.
                </Typography>
              </Box>
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate("/forget-password")}
              sx={{ mt: 3 }}
            >
              Request a new link
            </Button>
          </>
        ) : (
          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            <Form noValidate>
              {errorMsg && (
                <Alert severity="error" role="alert" sx={{ mt: 3 }}>
                  {errorMsg}
                </Alert>
              )}

              <Stack spacing={1.5} sx={{ mt: 3, mb: 2 }}>
                <Field name="password">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      id="reset-password"
                      label="New password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      fullWidth
                      error={Boolean(meta.touched && meta.error)}
                      helperText={meta.touched && meta.error ? meta.error : "At least 6 characters."}
                      InputProps={{ endAdornment: passwordAdornment }}
                    />
                  )}
                </Field>

                <Field name="confirmPassword">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      id="reset-confirm-password"
                      label="Confirm new password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      fullWidth
                      error={Boolean(meta.touched && meta.error)}
                      helperText={meta.touched && meta.error ? meta.error : " "}
                    />
                  )}
                </Field>
              </Stack>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" aria-hidden="true" /> : null}
              >
                {loading ? "Updating password…" : "Update password"}
              </Button>
            </Form>
          </Formik>
        )}

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Link component={RouterLink} to="/login" variant="body2" sx={{ color: "primary.light", fontWeight: 600, py: 1, display: "inline-block" }}>
            Back to sign in
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}

export default Reset;
