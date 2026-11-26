import React, { useEffect, useState } from "react";
import {
  AppBar,
  Avatar,
  Badge as MuiBadge,
  Box,
  ButtonBase,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import SubtitlesRoundedIcon from "@mui/icons-material/SubtitlesRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Link, Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import Logo from "../../../components/Brand/Logo";
import defaultPic from "../../../images/Default_pfp.svg.png";
import { userItems } from "../../../utils/nav";
import { getCookie } from "../../../utils/cookies";
import { useDispatch, useSelector } from "react-redux";
import { getUserInfos } from "../../../store/features/userSlice";
import SearchPane from "../../../components/SearchPane";
import Notifications from "./Notifications";
import ProfilePanel from "./ProfilePanel";
import axios from "axios";
import { API_BASE_URL } from "../../../config";

const drawerWidth = 248;
const DRAWER_ID = "dashboard-nav-drawer";

const navIcons = {
  "": <DashboardRoundedIcon fontSize="small" />,
  projects: <VideoLibraryRoundedIcon fontSize="small" />,
  subplayer: <SubtitlesRoundedIcon fontSize="small" />,
};

// Friendlier labels for the shared nav items (the links stay the same).
const navLabels = {
  "": "Dashboard",
  projects: "Projects",
  subplayer: "Subtitle editor",
};

function DashboardNav({ online }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const [showNotif, setShowNotif] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (online) {
      dispatch(getUserInfos());
    }
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dispatch, showNotif, showPanel]);

  const handleOutsideClick = (event) => {
    if (!event.target.closest(".notification-panel") && showNotif) {
      setShowNotif(false);
    }
    if (!event.target.closest(".profile-panel") && showPanel) {
      setShowPanel(false);
    }
  };
  const handleEscape = (event) => {
    if (event.key !== "Escape") return;
    if (showNotif) setShowNotif(false);
    if (showPanel) setShowPanel(false);
  };

  const [searchValue, setSearchValue] = useState("");
  const [, setLink] = useState("");
  const { user } = useSelector((state) => state.user);

  const location = useLocation();
  const navigate = useNavigate();
  const userDashboard = useMatch("/dashboard/:user");

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const hrefFor = (link) => {
    if (link === "subplayer") return "/subplayer";
    if (!link) return `/dashboard/${user?.userName || ""}`;
    return `/dashboard/${link}`;
  };

  const isActive = (link) => {
    const path = location.pathname.replace(/\/+$/, "");
    if (link === "projects") return path === "/dashboard/projects";
    if (!link)
      return (
        path.startsWith("/dashboard/") &&
        path !== "/dashboard/projects" &&
        path !== "/dashboard/settings"
      );
    return false;
  };

  const handleNavState = (e, link) => {
    if (link === "subplayer") {
      window.location.pathname = link;
    }
    if (userDashboard && !link) navigate(`${user?.userName}`);
    else {
      navigate(link);
    }
    setLink(link);
  };

  const onNavClick = (e, link) => {
    // Let the browser handle new-tab / new-window clicks on the real href.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    setMobileOpen(false);
    handleNavState(e, link);
  };

  const drawer = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        px: 1.5,
        pb: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 64,
          px: 1,
        }}
      >
        <Box
          component={Link}
          to="/"
          aria-label="DubMaster home"
          sx={{
            display: "inline-flex",
            textDecoration: "none",
            borderRadius: "var(--radius-sm)",
            py: 0.5,
          }}
        >
          <Logo size={28} />
        </Box>
        <IconButton
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          sx={{ display: { xs: "inline-flex", md: "none" } }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <List sx={{ flexGrow: 1, pt: 1 }} aria-label="Dashboard sections">
        {userItems.map((item) => {
          const active = isActive(item.link);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component="a"
                href={hrefFor(item.link)}
                aria-current={active ? "page" : undefined}
                selected={active}
                onClick={(e) => onNavClick(e, item.link)}
                sx={{
                  minHeight: 44,
                  borderRadius: "var(--radius-md)",
                  color: active ? "var(--text-main)" : "var(--text-muted)",
                  position: "relative",
                  "&:hover": {
                    bgcolor: "var(--bg-hover)",
                    color: "var(--text-main)",
                  },
                  "&.Mui-selected, &.Mui-selected:hover": {
                    bgcolor: "var(--primary-soft)",
                    color: "var(--text-main)",
                  },
                  "&.Mui-selected::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 10,
                    bottom: 10,
                    width: 3,
                    borderRadius: 3,
                    bgcolor: "var(--primary)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: active ? "var(--primary)" : "inherit",
                  }}
                  aria-hidden="true"
                >
                  {navIcons[item.link]}
                </ListItemIcon>
                <ListItemText
                  primary={navLabels[item.link] || item.text}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          bgcolor: "var(--bg-raised)",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            bgcolor: online === false ? "var(--danger)" : "var(--success)",
          }}
        />
        <Box component="span" sx={{ fontSize: 13, color: "var(--text-muted)" }}>
          {online === false ? "You're offline" : "Connected"}
        </Box>
      </Box>
    </Box>
  );

  const handleShowNotif = async () => {
    setShowNotif(!showNotif);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user/check-notifs`,
        {
          headers: {
            Authorization: "Bearer " + getCookie("jwt_Token"),
          },
        }
      );
      dispatch(getUserInfos());
    } catch (error) {
      console.error(error);
    }
  };
  const handleShowPanel = () => {
    setShowPanel(!showPanel);
  };

  const hasNewNotifs = Boolean(user?.notifications?.new);

  return (
    <Box sx={{ display: "flex", minHeight: "calc(100vh - 64px)", bgcolor: "var(--bg-main)" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "rgba(11, 11, 13, 0.82)",
          backdropFilter: "saturate(140%) blur(16px)",
          WebkitBackdropFilter: "saturate(140%) blur(16px)",
          borderBottom: "1px solid var(--border)",
          color: "var(--text-main)",
          backgroundImage: "none",
        }}
      >
        <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: 64, px: { xs: 1.5, sm: 3 } }}>
          <IconButton
            aria-label="Open navigation"
            aria-controls={DRAWER_ID}
            aria-expanded={mobileOpen ? "true" : "false"}
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: "none" } }}
          >
            <MenuRoundedIcon />
          </IconButton>

          {/* Search */}
          <Box
            role="search"
            sx={{ position: "relative", flex: 1, maxWidth: 440, minWidth: 0 }}
          >
            <label htmlFor="search" className="visually-hidden">
              Search projects
            </label>
            <SearchRoundedIcon
              aria-hidden="true"
              sx={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 20,
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <Box
              component="input"
              type="search"
              id="search"
              placeholder="Search projects"
              autoComplete="off"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
              sx={{
                width: "100%",
                height: 40,
                pl: "40px",
                pr: 1.5,
                fontSize: 14,
                fontFamily: "inherit",
                color: "var(--text-main)",
                bgcolor: "var(--bg-raised)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-full)",
                transition: "border-color var(--transition-fast)",
                "&::placeholder": { color: "var(--text-subtle)", opacity: 1 },
                "&:hover": { borderColor: "var(--border-strong)" },
                "&:focus": { borderColor: "var(--primary)" },
                "&::-webkit-search-cancel-button": { cursor: "pointer" },
              }}
            />
            <SearchPane searchParams={searchValue} />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Notifications */}
          <Box className="notification-panel" sx={{ position: "relative" }}>
            <Tooltip title="Notifications">
              <IconButton
                aria-label={hasNewNotifs ? "Notifications, new messages" : "Notifications"}
                aria-haspopup="true"
                aria-expanded={showNotif ? "true" : "false"}
                aria-controls="notifications-panel"
                onClick={handleShowNotif}
                sx={{ color: showNotif ? "var(--text-main)" : "var(--text-muted)" }}
              >
                <MuiBadge
                  variant="dot"
                  color="primary"
                  invisible={!hasNewNotifs}
                  overlap="circular"
                >
                  <NotificationsNoneRoundedIcon />
                </MuiBadge>
              </IconButton>
            </Tooltip>
            {showNotif ? (
              <Notifications
                id="notifications-panel"
                notifications={user?.notifications?.messages?.slice(0, 6) || []}
              />
            ) : (
              ""
            )}
          </Box>

          {/* Account */}
          <Box className="profile-panel" sx={{ position: "relative" }}>
            <ButtonBase
              onClick={handleShowPanel}
              aria-label="Account menu"
              aria-haspopup="true"
              aria-expanded={showPanel ? "true" : "false"}
              aria-controls="account-panel"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                minHeight: 44,
                pl: 0.5,
                pr: { xs: 0.5, sm: 1 },
                borderRadius: "var(--radius-full)",
                border: "1px solid",
                borderColor: showPanel ? "var(--border-strong)" : "transparent",
                color: "var(--text-main)",
                "&:hover": { bgcolor: "var(--bg-hover)" },
              }}
            >
              <Avatar
                src={user?.profilePic || defaultPic}
                alt=""
                sx={{ width: 34, height: 34, border: "1px solid var(--border-strong)" }}
              />
              <Box
                component="span"
                sx={{
                  display: { xs: "none", sm: "inline" },
                  fontSize: 14,
                  fontWeight: 600,
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.userName}
              </Box>
              <ExpandMoreRoundedIcon
                aria-hidden="true"
                sx={{
                  display: { xs: "none", sm: "inline-block" },
                  fontSize: 18,
                  color: "var(--text-muted)",
                  transform: showPanel ? "rotate(180deg)" : "none",
                  transition: "transform var(--transition-fast)",
                }}
              />
            </ButtonBase>
            {showPanel && <ProfilePanel id="account-panel" />}
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        aria-label="Dashboard"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile: temporary drawer */}
        <Drawer
          id={DRAWER_ID}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ "aria-label": "Dashboard navigation" }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              maxWidth: "85vw",
              border: "none",
              backgroundImage: "none",
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop: permanent sidebar */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              border: "none",
              backgroundImage: "none",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 3, md: 5 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default DashboardNav;
