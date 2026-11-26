import React, { useEffect } from "react";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";

import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";

import Toolbar from "@mui/material/Toolbar";

import {
  Link,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";
import Logo, { LogoMark } from "../../../components/Brand/Logo";
import defaultPic from "../../../images/Default_pfp.svg.png";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardOutlinedIcon from "@mui/icons-material/KeyboardOutlined";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import {
  Avatar,
  Button,
  ButtonBase,
  Stack,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { getCookie } from "../../../utils/cookies";
import { useDispatch, useSelector } from "react-redux";
import { getUserInfos } from "../../../store/features/userSlice";
import { useState } from "react";
import ProfilePanel from "./ProfilePanel";
import axios from "axios";
import { API_BASE_URL } from "../../../config";
import SrtUploader from "../../../components/srtuploader/srtuploader";
import {
  setTrackName,
  updateProjectName,
  uploadSrt1,
  uploadSrt2,
  uploadSrt3,
  uploadTime1,
  uploadTime2,
  uploadTime3,
} from "../../../store/features/appSlice";
import { notify } from "reapop";

import { loadJson } from "../../../services/srtreader";
import { useContext } from "react";
import { DialoguesContext, mainContext } from "../../../services/context";
import SuggestionForm from "../../../components/Suggestion/SuggestionForm";
const uploadSrt = [uploadSrt1, uploadSrt2, uploadSrt3];
const uploadTime = [uploadTime1, uploadTime2, uploadTime3];
const drawerWidth = 120;

// Editor keyboard shortcuts (wired in src/App.js).
const SHORTCUTS = [
  ["Space", "Play / pause"],
  ["Shift+Space", "Record / stop"],
  ["← / →", "Back / forward 5 s"],
  ["Shift+← / →", "Back / forward 10 s"],
  ["C", "Split take at playhead"],
  ["G", "Jump to last take"],
  ["Ctrl+Z", "Undo"],
  ["Ctrl+Y", "Redo"],
  ["S or Ctrl+S", "Save project"],
];

const shortcutList = (
  <Box component="dl" sx={{ m: 0, p: 0.5, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.5 }}>
    {SHORTCUTS.map(([keys, label]) => (
      <React.Fragment key={keys}>
        <Box component="dt" sx={{ fontFamily: "var(--font-mono)", color: "var(--amber)", fontSize: 12, whiteSpace: "nowrap" }}>
          {keys}
        </Box>
        <Box component="dd" sx={{ m: 0, fontSize: 12 }}>
          {label}
        </Box>
      </React.Fragment>
    ))}
  </Box>
);

// Shared look for the rail / bottom-bar items.
const railItemSx = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.5,
  minWidth: 56,
  minHeight: 56,
  px: 1,
  py: 0.75,
  borderRadius: "var(--radius-md)",
  color: "var(--text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.2,
  textAlign: "center",
  transition: "background-color var(--transition-fast), color var(--transition-fast)",
  "& .MuiSvgIcon-root": { fontSize: 26 },
  "&:hover": { bgcolor: "var(--bg-hover)", color: "var(--text-main)" },
  "&[aria-expanded='true']": { bgcolor: "var(--primary-soft)", color: "var(--primary)" },
  "&.Mui-focusVisible": { outline: "2px solid var(--primary)", outlineOffset: 2 },
};

function AppNav({ online }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [inputMode, setInputMode] = useState(false);
  const [nameState, setNameState] = useState("");
  //   const match = useMatch();
  const dispatch = useDispatch();
  const [showNotif, setShowNotif] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  //   const isSmallScreen = useMediaQuery()
  const isSmallScreen = useMediaQuery("(max-width: 600px)");
  const { projectName, saveData } = useSelector((state) => state.app);
  const {
    setRecordingData,
    projectLoaded,
    setprojectLoaded,
    showExport,
    setShowExport,
  } = useContext(mainContext);

  const { setCurrentTime } = useContext(DialoguesContext);
  useEffect(() => {
    dispatch(getUserInfos());
  }, [dispatch]);

  // Restore a saved project once: recordings, playhead and subtitle tracks.
  useEffect(() => {
    if (!saveData || projectLoaded) return;
    setprojectLoaded(true);
    loadJson(saveData)
      .then((savedArray) => {
        const meta = savedArray[savedArray.length - 1] || {};
        setCurrentTime(meta.currentTime);
        setRecordingData(savedArray.slice(0, -1));
        const tracks = meta.tracks;
        if (tracks) {
          [1, 2, 3].forEach((n) => {
            dispatch(uploadSrt[n - 1](tracks[`srt${n}`] || [""]));
            dispatch(uploadTime[n - 1](tracks[`time${n}`] || []));
            dispatch(setTrackName({ track: n, name: tracks.trackNames?.[n - 1] || "" }));
          });
        }
      })
      .catch(() => {
        dispatch(notify({ message: "Could not open this project's saved data", status: "error" }));
      });
  }, [dispatch, saveData, projectLoaded, setprojectLoaded, setCurrentTime, setRecordingData]);

  // Close the profile panel when clicking elsewhere.
  useEffect(() => {
    if (!showPanel) return;
    const close = (event) => {
      if (!event.target.closest(".profile-panel, .pane, .mobilePane")) setShowPanel(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showPanel]);
  const [searchValue, setSearchValue] = useState("");

  const [link, setLink] = useState("");
  const { user } = useSelector((state) => state.user);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const containerStyles = {
    "& .pane, .uploadPane": {
      position: "fixed",
      left: "128px",
      right: "0px",
      top: "100px",
      zIndex: "99",
    },
    "& .mobilePane, .mobileUploadPane": {
      position: "fixed",
      left: "8px",
      top: "50%",
      zIndex: "99",
    },
    "& .uploadPane": {
      top: "80px",
      left: "136px",
      right: "auto",
      width: "400px",
      maxHeight: "calc(100vh - 100px)",
      overflowY: "auto",
    },
    "& .mobileUploadPane": {
      top: "auto",
      left: "8px",
      right: "8px",
      bottom: "80px",
      maxHeight: "70vh",
      overflowY: "auto",
    },
  };

  const NavStyles = {
    display: "flex",
    backgroundColor: "var(--bg-main)",
    minHeight: "100vh",
  };
  const sideDrawer = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "visible",
    height: "100vh",
    bgcolor: "var(--bg-surface)",
    borderRight: "1px solid var(--border)",
    pt: 2,
    pb: 2,
  };
  const mobileBar = {
    display: {
      xs: "flex",
      sm: "none",
    },
    alignItems: "center",
    justifyContent: "space-around",
    px: 0.5,
    position: "fixed",
    bottom: "0px",
    left: 0,
    zIndex: 1100,
    bgcolor: "var(--bg-surface)",
    borderTop: "1px solid var(--border)",
    boxSizing: "border-box",
    width: "100%",
    height: "70px",
    pb: "env(safe-area-inset-bottom)",
    "& .rail-item": { minWidth: 52, px: 0.5, fontSize: 11 },
    "& .rail-item .MuiSvgIcon-root": { fontSize: 24 },
  };
  const location = useLocation();
  const navigate = useNavigate();
  const userDashboard = useMatch("/dashboard/:user");

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const handleShowPanel = () => {
    setShowPanel(!showPanel);
  };
  const handleShowUploader = () => {
    setShowUploader(!showUploader);
  };

  const profileButton = (avatarSize) => (
    <ButtonBase
      className="profile-panel rail-item"
      onClick={handleShowPanel}
      aria-label="Account menu"
      aria-haspopup="true"
      aria-expanded={showPanel ? "true" : "false"}
      aria-controls="account-panel"
      sx={railItemSx}
    >
      <Avatar
        src={user?.profilePic || defaultPic}
        alt=""
        sx={{ width: avatarSize, height: avatarSize, border: "1px solid var(--border-strong)" }}
      />
      <span>Profile</span>
    </ButtonBase>
  );

  // Rail items shared by the desktop drawer and the phone bottom bar.
  const navItems = (
    <>
      <ButtonBase
        className="rail-item"
        onClick={() => {
          navigate("/dashboard/projects");
        }}
        sx={railItemSx}
      >
        <FolderOutlinedIcon aria-hidden="true" />
        <span>Projects</span>
      </ButtonBase>
      <ButtonBase
        className="rail-item uploader"
        onClick={handleShowUploader}
        aria-expanded={showUploader ? "true" : "false"}
        sx={railItemSx}
      >
        {showUploader ? (
          <CloseRoundedIcon aria-hidden="true" />
        ) : (
          <CloudUploadOutlinedIcon aria-hidden="true" />
        )}
        <span>{showUploader ? "Close" : "Upload"}</span>
      </ButtonBase>
    </>
  );

  const helpItems = (
    <>
      <ButtonBase
        className="rail-item"
        onClick={() => {
          navigate("/user-guide");
        }}
        sx={railItemSx}
      >
        <MenuBookOutlinedIcon aria-hidden="true" />
        <span>User guide</span>
      </ButtonBase>
      <ButtonBase
        className="rail-item"
        onClick={() => {
          setShowSuggestion(true);
        }}
        sx={railItemSx}
      >
        <SupportAgentIcon aria-hidden="true" />
        <span>Support</span>
      </ButtonBase>
    </>
  );

  const drawer = (
    <Box sx={sideDrawer}>
      <Box
        component={Link}
        to="/"
        aria-label="DubMaster home"
        sx={{ display: "inline-flex", p: 1, mb: 2, borderRadius: "var(--radius-md)" }}
      >
        <LogoMark size={36} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, flexGrow: 1 }}>
        {profileButton(40)}
        {navItems}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        {helpItems}
      </Box>
    </Box>
  );

  const container = document.body;

  const handleNavState = (e, link) => {
    if (userDashboard && !link) navigate(`${user.userName}`);
    else {
      navigate(link);
    }
    setLink(link);
  };
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
      // ignore
    }
  };

  const handleProjectName = (e) => {
    setNameState(e.target.value);
  };

  const toggleInputMode = () => {
    setInputMode(!inputMode);
  };
  return (
    <Box sx={NavStyles}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "rgba(11, 11, 13, 0.86)",
          backdropFilter: "saturate(140%) blur(16px)",
          WebkitBackdropFilter: "saturate(140%) blur(16px)",
          backgroundImage: "none",
          color: "var(--text-main)",
          borderBottom: "1px solid var(--border)",
          zIndex: "9999",
        }}
        elevation={0}
      >
        <Toolbar sx={{ minHeight: 64, px: { xs: 1.5, sm: 3 }, gap: 1.5 }}>
          {/* Phones have no rail, so the logo lives in the bar there */}
          <Box
            component={Link}
            to="/"
            aria-label="DubMaster home"
            sx={{ display: { xs: "inline-flex", sm: "none" }, borderRadius: "var(--radius-sm)", flexShrink: 0 }}
          >
            <LogoMark size={30} />
          </Box>
          <Box sx={{ display: { xs: "none", sm: "inline-flex" }, flexShrink: 0 }} aria-hidden="true">
            <Logo size={26} />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "flex-start", sm: "center" },
            }}
          >
            {inputMode ? (
              <Box
                component="input"
                className="projectName"
                type="text"
                aria-label="Project name"
                onBlur={(e) => {
                  setInputMode(false);
                  if (nameState) {
                    dispatch(updateProjectName(nameState));
                  }
                }}
                autoFocus
                onFocus={() => {
                  setNameState(projectName);
                }}
                value={nameState}
                onChange={handleProjectName}
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  height: 40,
                  px: 1.5,
                  fontSize: 15,
                  fontFamily: "inherit",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  bgcolor: "var(--bg-raised)",
                  border: "1px solid var(--primary)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
            ) : (
              <Tooltip title="Rename project" arrow PopperProps={{ sx: { zIndex: 10000 } }}>
                <ButtonBase
                  className="projectName"
                  onClick={toggleInputMode}
                  aria-label={`Project: ${projectName || "Untitled"}. Rename`}
                  sx={{
                    maxWidth: "100%",
                    minHeight: 40,
                    px: 1.5,
                    gap: 1,
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-main)",
                    fontFamily: "inherit",
                    fontSize: 15,
                    fontWeight: 600,
                    "&:hover": { bgcolor: "var(--bg-hover)" },
                    "&:hover .edit-icon": { color: "var(--text-main)" },
                    "&.Mui-focusVisible": { outline: "2px solid var(--primary)", outlineOffset: 2 },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {projectName || "Untitled project"}
                  </Box>
                  <EditOutlinedIcon
                    className="edit-icon"
                    aria-hidden="true"
                    sx={{ fontSize: 16, color: "var(--text-muted)" }}
                  />
                </ButtonBase>
              </Tooltip>
            )}
          </Box>

          <Stack flexDirection="row" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
            {online === false && (
              <Box
                role="status"
                className="pill-badge"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: "var(--radius-full)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--amber)",
                  bgcolor: "var(--amber-soft)",
                  border: "1px solid rgba(255, 181, 71, 0.3)",
                }}
              >
                Offline
              </Box>
            )}
            <Tooltip title={shortcutList} arrow describeChild placement="bottom-end" PopperProps={{ sx: { zIndex: 10000 } }}>
              <IconButton
                aria-label="Keyboard shortcuts"
                aria-describedby="editor-shortcuts"
                onMouseDown={(e) => e.preventDefault()}
                sx={{ display: { xs: "none", md: "inline-flex" }, width: 40, height: 40, color: "var(--text-muted)" }}
              >
                <KeyboardOutlinedIcon />
              </IconButton>
            </Tooltip>
            <span id="editor-shortcuts" className="visually-hidden">
              {SHORTCUTS.map(([keys, label]) => `${keys}: ${label}`).join(". ")}
            </span>
            <Button
              variant="contained"
              onClick={() => {
                setShowExport(!showExport);
              }}
              aria-expanded={showExport ? "true" : "false"}
              aria-controls="export-panel"
              startIcon={showExport ? <CloseRoundedIcon /> : <IosShareRoundedIcon />}
              sx={{ minHeight: 40, borderRadius: "var(--radius-full)", px: 2 }}
            >
              {showExport ? "Close" : "Export"}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          // phones use the fixed bottom bar, so the nav column takes no space
          width: { xs: 0, sm: drawerWidth },
          flexShrink: { sm: 0 },
          zIndex: "99",
        }}
        aria-label="Editor"
      >
        <Box sx={mobileBar}>
          {profileButton(28)}
          {navItems}
          {helpItems}
        </Box>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              border: "none",
              bgcolor: "var(--bg-surface)",
              backgroundImage: "none",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          padding: "0px",
          paddingTop: "0px",
          minWidth: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Box sx={containerStyles}>
          {showPanel && (
            <ProfilePanel
              id="account-panel"
              className={isSmallScreen ? "mobilePane" : "pane"}
            />
          )}
          {showUploader && (
            <SrtUploader
              className={isSmallScreen ? "mobileUploadPane" : "uploadPane"}
              onClose={() => setShowUploader(false)}
            />
          )}
          <SuggestionForm
            show={showSuggestion}
            setShowSuggestion={setShowSuggestion}
          />

          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AppNav;
