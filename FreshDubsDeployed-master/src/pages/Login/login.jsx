import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { Form, Field, Formik } from "formik";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
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
  "Dialogue scrolls toward a fixed playhead in sync with the picture.",
  "Record and compare takes right in your browser.",
  "Export WAV or MP3 audio with updated subtitles.",
];

function Login() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { dfghjklllkjhg } = useParams();

  useEffect(() => {
    if (dfghjklllkjhg) {
      document.cookie = `jwt_Token=${dfghjklllkjhg}; Max-Age="86400000" ; path=/; `;
      window.history.replaceState({}, "", "/");
      window.location.href = "/";
    }
  }, [dfghjklllkjhg]);

  const initialValues = {
    email: "",
    password: "",
    rememberMe: false,
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Enter a valid email address, like name@example.com")
      .required("Enter your email address"),
    password: Yup.string().required("Enter your password"),
  });

  const handleSubmit = async (values, actions) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/login`,
        values,
        { withCredentials: true }
      );

      if (response.status === 200) {
        document.cookie = `jwt_Token=${response.data.token} ;Max-Age=${response.data.age}  path=/;`;
        window.location.href = "/";
      }
      navigate("/dashboard/projects");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      console.error(msg);
      setError(msg);
    }
  };

  const handleLogin = () => {
    window.open(`${API_BASE_URL}/api/user/google-auth`, "_self");
  };

  return (
    <Box
      component="section"
      aria-labelledby="login-title"
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
          <Typography id="login-title" variant="h1" sx={{ fontSize: { xs: 28, sm: 32 }, mb: 1 }}>
            Welcome back
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 3 }}>
            Sign in to pick up your projects where you left off.
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
            onClick={handleLogin}
            startIcon={<img src={GoogleIcon} alt="" width={20} height={20} />}
          >
            Continue with Google
          </Button>

          <Divider sx={{ my: 3, color: "text.secondary", fontSize: 13 }}>or use your email</Divider>

          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={1.5}>
                  <Field name="email">
                    {({ field, meta }) => (
                      <TextField
                        {...field}
                        id="login-email"
                        label="Email"
                        type="email"
                        autoComplete="email"
                        fullWidth
                        error={Boolean(meta.touched && meta.error)}
                        helperText={meta.touched && meta.error ? meta.error : " "}
                      />
                    )}
                  </Field>

                  <Field name="password">
                    {({ field, meta }) => (
                      <TextField
                        {...field}
                        id="login-password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        fullWidth
                        error={Boolean(meta.touched && meta.error)}
                        helperText={meta.touched && meta.error ? meta.error : " "}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                aria-label="Show password"
                                aria-pressed={showPassword}
                                aria-controls="login-password"
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

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  columnGap={2}
                  sx={{ mt: 0.5, mb: 3 }}
                >
                  <Field name="rememberMe">
                    {({ field }) => (
                      <FormControlLabel
                        control={<Checkbox checked={field.value} onChange={field.onChange} name="rememberMe" />}
                        label={<Typography variant="body2" sx={{ color: "text.secondary" }}>Remember me</Typography>}
                      />
                    )}
                  </Field>
                  <Link
                    component={RouterLink}
                    to="/forget-password"
                    variant="body2"
                    sx={{ color: "primary.light", fontWeight: 600, py: 1 }}
                  >
                    Forgot password?
                  </Link>
                </Stack>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" aria-hidden="true" /> : null}
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
              </Form>
            )}
          </Formik>

          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mt: 3 }}>
            New to DubMaster?{" "}
            <Link component={RouterLink} to="/signup" sx={{ color: "primary.light", fontWeight: 600 }}>
              Create an account
            </Link>
          </Typography>
        </Paper>

        <Box component="aside" aria-label="Why DubMaster" sx={{ display: { xs: "none", md: "block" }, flex: 1 }}>
          <Typography variant="overline" component="p" sx={{ color: "var(--amber)", mb: 2 }}>
            Your dubbing studio
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

export default Login;
