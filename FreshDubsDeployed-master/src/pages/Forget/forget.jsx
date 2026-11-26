import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Form, Field, Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import Logo from "../../components/Brand/Logo";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";

function Forget() {
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const initialValues = {
    email: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Enter a valid email address, like name@example.com")
      .required("Enter your email address"),
  });

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/user/forget-password`,
        values,
        { withCredentials: true }
      );
      if (response) {
        setLoading(false);
        document.cookie = `resetPass=${response.data.token}; Max-Age="900000" ; path=/; `;
        setSent(true);
        setErrorMsg("");
      }
    } catch (error) {
      console.error(error.response?.data);
      setErrorMsg(error.response?.data?.message || "We couldn't send the reset link. Try again.");
      setSent(false);
      setLoading(false);
    }
  };

  return (
    <Box
      component="section"
      aria-labelledby="forget-title"
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
        <Typography id="forget-title" variant="h1" sx={{ fontSize: { xs: 28, sm: 32 }, mb: 1 }}>
          Reset your password
        </Typography>

        {sent ? (
          <Box role="status" sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
                p: 2.5,
                borderRadius: "var(--radius-lg)",
                bgcolor: "var(--bg-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <MarkEmailReadRoundedIcon aria-hidden="true" sx={{ color: "success.main", fontSize: 28, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Check your inbox</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  We've sent you a link to reset your password. It expires in 15 minutes.
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <>
            <Typography sx={{ color: "text.secondary", mb: 3 }}>
              Enter the email you signed up with and we'll send you a reset link.
            </Typography>

            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
              <Form noValidate>
                {errorMsg && (
                  <Alert severity="error" role="alert" sx={{ mb: 3 }}>
                    {errorMsg}
                  </Alert>
                )}

                <Field name="email">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      id="forget-email"
                      label="Email"
                      type="email"
                      autoComplete="email"
                      fullWidth
                      error={Boolean(meta.touched && meta.error)}
                      helperText={meta.touched && meta.error ? meta.error : " "}
                      sx={{ mb: 2 }}
                    />
                  )}
                </Field>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" aria-hidden="true" /> : null}
                >
                  {loading ? "Sending link…" : "Send reset link"}
                </Button>
              </Form>
            </Formik>
          </>
        )}

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Link
            component={RouterLink}
            to="/login"
            variant="body2"
            sx={{
              color: "primary.light",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              py: 1,
            }}
          >
            <ArrowBackRoundedIcon fontSize="small" aria-hidden="true" /> Back to sign in
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}

export default Forget;
