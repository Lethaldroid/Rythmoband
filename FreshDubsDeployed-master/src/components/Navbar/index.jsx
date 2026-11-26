import React, { useEffect } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { navItems } from "../../utils/nav";
import { getUserInfos } from "../../store/features/userSlice";
import { getCookie } from "../../utils/cookies";
import Badge from "../Badge";
import Logo from "../Brand/Logo";
import defaultPic from "../../images/Default_pfp.svg.png";

function Navbar({ online }) {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => {
    if (getCookie("jwt_Token") && online) {
      dispatch(getUserInfos());
    }
  }, [isAuthenticated, dispatch]);

  // Close the drawer whenever the route changes.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const hidden =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/app");
  if (hidden) return null;

  const isActive = (link) => location.pathname === link;
  const dashboardLink = `/dashboard/${user?.userName}`;

  return (
    <>
      <AppBar
        component="header"
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "rgba(11, 11, 13, 0.78)",
          backdropFilter: "saturate(140%) blur(16px)",
          WebkitBackdropFilter: "saturate(140%) blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {online === false && (
          <Box
            role="status"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              py: 0.5,
              fontSize: 13,
              bgcolor: "rgba(255, 181, 71, 0.12)",
              color: "var(--amber)",
              borderBottom: "1px solid rgba(255,181,71,.25)",
            }}
          >
            <WifiOffRoundedIcon sx={{ fontSize: 16 }} aria-hidden />
            You're offline. Some features won't work until you reconnect.
          </Box>
        )}
        <Toolbar
          component="nav"
          aria-label="Main"
          sx={{
            maxWidth: 1200,
            width: "100%",
            mx: "auto",
            px: { xs: 2, md: 3 },
            gap: 2,
            minHeight: { xs: 64 },
          }}
        >
          <Box
            component={Link}
            to="/"
            aria-label="DubMaster home"
            sx={{ display: "flex", alignItems: "center", textDecoration: "none", mr: "auto", borderRadius: 1 }}
          >
            <Logo size={30} />
          </Box>

          <Stack
            direction="row"
            spacing={0.5}
            component="ul"
            sx={{ display: { xs: "none", md: "flex" }, listStyle: "none", m: 0, p: 0 }}
          >
            {navItems.map((item) => (
              <li key={item.text}>
                <Button
                  component={Link}
                  to={item.link}
                  aria-current={isActive(item.link) ? "page" : undefined}
                  sx={{
                    color: isActive(item.link) ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: 500,
                    fontSize: 14,
                    px: 1.75,
                    bgcolor: isActive(item.link) ? "rgba(255,255,255,.07)" : "transparent",
                    "&:hover": { color: "var(--text-main)", bgcolor: "rgba(255,255,255,.06)" },
                  }}
                >
                  {item.text}
                </Button>
              </li>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
            {user ? (
              <Button
                component={Link}
                to={dashboardLink}
                aria-label={`Open your dashboard (${user?.userName})`}
                sx={{ pl: 1.5, pr: 0.75, gap: 1.25, color: "var(--text-main)", border: "1px solid var(--border)" }}
              >
                <Badge membership={user?.membership} />
                <Avatar
                  src={user?.profilePic || defaultPic}
                  alt=""
                  sx={{ width: 30, height: 30 }}
                />
              </Button>
            ) : (
              <>
                <Button component={Link} to="/login" sx={{ color: "var(--text-muted)", "&:hover": { color: "var(--text-main)" } }}>
                  Log in
                </Button>
                <Button component={Link} to="/signup" variant="contained">
                  Start free
                </Button>
              </>
            )}
          </Stack>

          <IconButton
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" }, color: "var(--text-main)" }}
          >
            <MenuRoundedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        id="mobile-nav"
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { width: "min(320px, 88vw)", p: 2 } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Logo size={28} />
          <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Divider sx={{ my: 1 }} />
        <List component="nav" aria-label="Mobile">
          {navItems.map((item) => (
            <ListItemButton
              key={item.text}
              component={Link}
              to={item.link}
              selected={isActive(item.link)}
              aria-current={isActive(item.link) ? "page" : undefined}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ mt: "auto", display: "grid", gap: 1 }}>
          {user ? (
            <Button component={Link} to={dashboardLink} variant="contained" size="large">
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button component={Link} to="/signup" variant="contained" size="large">
                Start free
              </Button>
              <Button component={Link} to="/login" variant="outlined" size="large">
                Log in
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}

export default Navbar;
