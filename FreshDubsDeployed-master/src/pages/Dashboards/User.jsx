import { Box, Button, ButtonBase, Skeleton, Typography } from "@mui/material";
import React, { useContext, useEffect } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SubtitlesRoundedIcon from "@mui/icons-material/SubtitlesRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";

import { useSelector, useDispatch } from "react-redux";
import { getUserInfos } from "../../store/features/userSlice";
import { Link, useNavigate } from "react-router-dom";
import RecentProject from "./components/RecentProject";
import {
  clearProject,
  getAllProjects,
} from "../../store/features/appSlice";
import { DialoguesContext, mainContext } from "../../services/context";

const shortcutSx = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: 1.5,
  width: "100%",
  height: "100%",
  p: 2.5,
  textAlign: "left",
  textDecoration: "none",
  color: "var(--text-main)",
  bgcolor: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  transition: "border-color var(--transition-fast), background-color var(--transition-fast)",
  "&:hover": { borderColor: "var(--border-strong)", bgcolor: "var(--bg-raised)" },
  "& .shortcut-icon": {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: "var(--radius-md)",
    bgcolor: "var(--bg-raised)",
    border: "1px solid var(--border)",
    color: "var(--amber)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

function User({ online }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setRecordingData, setprojectLoaded } = useContext(mainContext);
  const { setCurrentTime } = useContext(DialoguesContext);

  useEffect(() => {
    dispatch(getUserInfos());
    dispatch(getAllProjects());
  }, [dispatch]);
  const { user } = useSelector((state) => state.user);
  const { projects, loading } = useSelector((state) => state.app);

  const hasProjects = Array.isArray(projects) && projects.length > 0;
  const showSkeleton = loading && !hasProjects;

  // Same flow as "New project" on the Projects page.
  const handleNewProject = () => {
    setRecordingData([]);
    setCurrentTime("");
    if (setprojectLoaded) setprojectLoaded(false);
    dispatch(clearProject());
    navigate(`/app/new`);
  };

  const shortcuts = [
    {
      title: "Projects",
      text: "Browse and open all your dubbing projects.",
      icon: <VideoLibraryRoundedIcon fontSize="small" />,
      props: { component: Link, to: "/dashboard/projects" },
    },
    {
      title: "Subtitle editor",
      text: "Create or fix SRT files line by line.",
      icon: <SubtitlesRoundedIcon fontSize="small" />,
      props: { component: "a", href: "/subplayer" },
    },
    {
      title: "Help and support",
      text: "Read the user guide and common questions.",
      icon: <MenuBookRoundedIcon fontSize="small" />,
      props: { component: Link, to: "/user-guide" },
    },
  ];

  return (
    <>
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 4,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            variant="h4"
            sx={{ fontSize: { xs: 26, md: 32 }, overflowWrap: "anywhere" }}
          >
            {user?.userName ? `Welcome back, ${user.userName}` : "Welcome back"}
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", mt: 0.5 }}>
            Pick up where you left off, or start something new.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddRoundedIcon />}
          onClick={handleNewProject}
          sx={{ flexShrink: 0 }}
        >
          New project
        </Button>
      </Box>

      {/* Shortcuts */}
      <Box
        component="ul"
        aria-label="Shortcuts"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          mb: 5,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        }}
      >
        {shortcuts.map((s) => (
          <li key={s.title}>
            <ButtonBase {...s.props} sx={shortcutSx}>
              <span className="shortcut-icon" aria-hidden="true">
                {s.icon}
              </span>
              <Box sx={{ minWidth: 0 }}>
                <Box
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, fontWeight: 600, fontSize: 15 }}
                >
                  {s.title}
                  <ArrowForwardRoundedIcon
                    aria-hidden="true"
                    sx={{ fontSize: 16, color: "var(--text-muted)" }}
                  />
                </Box>
                <Box component="span" sx={{ display: "block", mt: 0.5, fontSize: 14, color: "var(--text-muted)" }}>
                  {s.text}
                </Box>
              </Box>
            </ButtonBase>
          </li>
        ))}
      </Box>

      {/* Recent projects */}
      <Box component="section" aria-labelledby="recent-projects-heading">
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography id="recent-projects-heading" component="h2" variant="h6">
            Recent projects
          </Typography>
          {hasProjects && (
            <Button component={Link} to="/dashboard/projects" size="small">
              View all
            </Button>
          )}
        </Box>

        {hasProjects && (
          <Box
            aria-hidden="true"
            sx={{
              display: { xs: "none", sm: "flex" },
              px: 2,
              pr: { sm: "112px" },
              mb: 1,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            <Box sx={{ flex: 1, pl: "48px" }}>Name</Box>
            <Box sx={{ width: 120 }}>Last edited</Box>
          </Box>
        )}

        {showSkeleton ? (
          <Box
            role="status"
            aria-label="Loading projects"
            sx={{ display: "flex", flexDirection: "column", gap: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={60}
                sx={{ bgcolor: "var(--bg-raised)", borderRadius: "var(--radius-md)" }}
              />
            ))}
          </Box>
        ) : hasProjects ? (
          <Box
            component="ul"
            sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}
          >
            {[...projects]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((project) => (
                <RecentProject
                  key={project._id}
                  projectName={project.projectName}
                  updated_at={project.updatedAt}
                  id={project._id}
                />
              ))}
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: "center",
              px: 3,
              py: { xs: 5, md: 7 },
              border: "1px dashed var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              bgcolor: "var(--bg-surface)",
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 48,
                height: 48,
                mx: "auto",
                mb: 2,
                borderRadius: "var(--radius-md)",
                bgcolor: "var(--primary-soft)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MovieOutlinedIcon />
            </Box>
            <Typography component="h3" sx={{ fontWeight: 600, fontSize: 16 }}>
              No projects yet
            </Typography>
            <Typography sx={{ color: "var(--text-muted)", mt: 0.5, mb: 2.5, fontSize: 14 }}>
              Create your first one: add a video and a subtitle file to start dubbing.
            </Typography>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleNewProject}>
              New project
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
}

export default User;
