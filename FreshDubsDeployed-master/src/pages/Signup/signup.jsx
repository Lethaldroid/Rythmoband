import React, { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Form, Field, Formik } from "formik";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import * as Yup from "yup";
import GoogleIcon from "../../images/logos_google-icon.png";
import Logo from "../../components/Brand/Logo";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const benefits = [
  "Import a video with its SRT or JSON subtitles.",
  "Read each line as it crosses the playhead. Retake as often as you need.",
  "Download your audio and timed script when you're done.",
];

function Signup() {
  const { dfghjklllkjhg } = useParams();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (dfghjklllkjhg) {
      document.cookie = `jwt_Token=${dfghjklllkjhg} ; path=/;`;
      window.history.replaceState({}, "", "/");
      window.location.href = "/dashboard";
    }
  }, [dfghjklllkjhg]);

  const initialValues = {
    userName: "",
    email: "",
    password: "",
  };

  const validationSchema = Yup.object({
    userName: Yup.string().required("Choose a username"),
    email: Yup.string()
      .email("Enter a valid email address, like name@example.com")
      .required("Enter your email address"),
    password: Yup.string()
      .min(6, "Use at least 6 characters")
      .required("Create a password"),
  });

  const handleSubmit = async (values, actions) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/signup`,
        values,
        { withCredentials: true }
      );

      if (response.status === 200) {
        document.cookie = `jwt_Token=${response.data.token} ;Max-Age=${response.data.age} path=/;`;
        window.location.href = `/dashboard/${response.data.userName}`;
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Signup failed";
      console.error(msg);
      setError(msg);
    }
  };

  const handleSignUp = () => {
    window.open(`${API_BASE_URL}/api/user/google-auth`, "_self");
  };

  const fieldProps = (meta) => ({
    fullWidth: true,
    error: Boolean(meta.touched && meta.error),
  });

  return (
    <Box
      component="section"
      aria-labelledby="signup-title"
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        px: 2,
        py: { xs: 5, md: 8 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: 440, md: 860 },
          mx: "auto",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            maxWidth: 440,
            flexShrink: 0,
            p: { xs: 3, sm: 5 },
            borderRadius: "var(--radius-xl)",
            bgcolor: "var(--bg-surface)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <Link component={RouterLink} to="/" aria-label="DubMaster home" sx={{ display: "inline-flex", mb: 3 }}>
            <Logo size={30} />
          </Link>
          <Typography id="signup-title" variant="h1" sx={{ fontSize: { xs: 28, sm: 32 }, mb: 1 }}>
            Create your account
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 3 }}>
            Set up your studio and start your first dub in minutes.
          </Typography>

          {error && (
            <Alert severity="error" role="alert" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleSignUp}
            startIcon={<img src={GoogleIcon} alt="" width={20} height={20} />}
          >
            Sign up with Google
          </Button>

          <Divider sx={{ my: 3, color: "text.secondary", fontSize: 13 }}>or use your email</Divider>

          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Field name="userName">
                    {({ field, meta }) => (
                      <TextField
                        {...field}
                        {...fieldProps(meta)}
                        id="signup-username"
                        label="Username"
                        type="text"
                        autoComplete="username"
                        inputProps={{ autoCapitalize: "none", spellCheck: false }}
                        helperText={meta.touched && meta.error ? meta.error : "This is how you'll appear in DubMaster."}
                      />
                    )}
                  </Field>

                  <Field name="email">
                    {({ field, meta }) => (
                      <TextField
                        {...field}
                        {...fieldProps(meta)}
                        id="signup-email"
                        label="Email"
                        type="email"
                        autoComplete="email"
                        helperText={meta.touched && meta.error ? meta.error : " "}
                      />
                    )}
                  </Field>

                  <Field name="password">
                    {({ field, meta }) => (
                      <TextField
                        {...field}
                        {...fieldProps(meta)}
                        id="signup-password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        helperText={meta.touched && meta.error ? meta.error : "At least 6 characters."}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                aria-label="Show password"
                                aria-pressed={showPassword}
                                aria-controls="signup-password"
                                sx={{ color: "text.secondary", width: 40, height: 40 }}
                              >
                                {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </Field>
                </Stack>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" aria-hidden="true" /> : null}
                >
                  {isSubmitting ? "Creating account…" : "Create account"}
                </Button>
              </Form>
            )}
          </Formik>

          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mt: 3 }}>
            Already have an account?{" "}
            <Link component={RouterLink} to="/login" sx={{ color: "primary.light", fontWeight: 600 }}>
              Sign in
            </Link>
          </Typography>
        </Paper>

        <Box component="aside" aria-label="How DubMaster works" sx={{ display: { xs: "none", md: "block" }, flex: 1 }}>
          <Typography variant="overline" component="p" sx={{ color: "var(--amber)", mb: 2 }}>
            How it works
          </Typography>
          <Stack component="ul" spacing={2} sx={{ listStyle: "none", p: 0, m: 0 }}>
            {benefits.map((item) => (
              <Stack component="li" key={item} direction="row" spacing={1.5} alignItems="flex-start">
                <CheckRoundedIcon aria-hidden="true" sx={{ color: "primary.main", fontSize: 20, mt: "2px" }} />
                <Typography sx={{ color: "text.secondary" }}>{item}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default Signup;
