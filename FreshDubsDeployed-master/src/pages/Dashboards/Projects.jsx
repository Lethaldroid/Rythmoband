import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useNavigate } from "react-router-dom";
import {
  clearProject,
  deleteProject,
  getAllProjects,
  loadProject,
} from "../../store/features/appSlice";
import { useDispatch, useSelector } from "react-redux";
import { DialoguesContext, mainContext } from "../../services/context";
import { parseDate } from "../../utils/dummyData";

const cardSx = {
  height: "100%",
  minHeight: 210,
  display: "flex",
  flexDirection: "column",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
  bgcolor: "var(--bg-surface)",
  backgroundImage: "none",
  border: "1px solid var(--border)",
  transition: "border-color var(--transition-fast), background-color var(--transition-fast)",
  "&:hover": { borderColor: "var(--border-strong)", bgcolor: "var(--bg-raised)" },
};

function Projects() {
  const { projects, loading } = useSelector((state) => state.app);
  const { setRecordingData, setprojectLoaded } = useContext(mainContext);
  const { setCurrentTime } = useContext(DialoguesContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    dispatch(getAllProjects());
  }, [dispatch]);

  const handleProjectLoad = (projectName, id) => {
    setRecordingData([]);
    setCurrentTime("");
    setprojectLoaded(false);
    dispatch(clearProject());
    if (id) {
      dispatch(loadProject(id));
    }
    navigate(`/app/${projectName}`);
  };

  // Asks for confirmation first (replaces the old window.confirm).
  const handleDelete = (e, proj) => {
    e.stopPropagation();
    setPendingDelete(proj);
  };
  const confirmDelete = () => {
    if (pendingDelete) {
      dispatch(deleteProject(pendingDelete._id));
    }
    setPendingDelete(null);
  };

  const list = Array.isArray(projects) ? projects : [];
  const hasProjects = list.length > 0;
  const showSkeleton = loading && !hasProjects;

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          pb: 3,
          mb: 4,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography component="h1" variant="h4" sx={{ fontSize: { xs: 26, md: 32 } }}>
              Projects
            </Typography>
            {hasProjects && (
              <Box
                component="span"
                aria-label={`${list.length} projects`}
                sx={{
                  px: 1.25,
                  py: 0.25,
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border-strong)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                {list.length}
              </Box>
            )}
          </Box>
          <Typography sx={{ color: "var(--text-muted)", mt: 0.5 }}>
            Open a project to keep dubbing, or start a new one.
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={<AddRoundedIcon />}
          onClick={() => handleProjectLoad("new")}
          sx={{ flexShrink: 0 }}
        >
          New project
        </Button>
      </Box>

      {showSkeleton ? (
        <Grid container spacing={2.5} role="status" aria-label="Loading projects">
          {[0, 1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Box sx={{ ...cardSx, "&:hover": {} }}>
                <Skeleton variant="rectangular" height={110} sx={{ bgcolor: "var(--bg-raised)" }} />
                <Box sx={{ p: 2 }}>
                  <Skeleton width="70%" sx={{ bgcolor: "var(--bg-raised)" }} />
                  <Skeleton width="40%" sx={{ bgcolor: "var(--bg-raised)" }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : !hasProjects ? (
        /* Empty state */
        <Box
          sx={{
            textAlign: "center",
            px: 3,
            py: { xs: 6, md: 9 },
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius-lg)",
            bgcolor: "var(--bg-surface)",
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: 52,
              height: 52,
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
          <Typography component="h2" variant="h6">
            No projects yet
          </Typography>
          <Typography sx={{ color: "var(--text-muted)", mt: 0.5, mb: 3 }}>
            Create your first one: add a video and a subtitle file to start dubbing.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => handleProjectLoad("new")}
          >
            Create your first project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2.5} component="ul" sx={{ listStyle: "none", p: 0, mb: 0 }}>
          {/* Create card */}
          <Grid item xs={12} sm={6} md={4} lg={3} component="li">
            <ButtonBase
              onClick={() => handleProjectLoad("new")}
              sx={{
                width: "100%",
                height: "100%",
                minHeight: 210,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                border: "1px dashed var(--border-strong)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-main)",
                transition: "border-color var(--transition-fast), background-color var(--transition-fast)",
                "&:hover": { borderColor: "var(--primary)", bgcolor: "var(--primary-soft)" },
              }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "var(--primary-soft)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AddRoundedIcon />
              </Box>
              <Box component="span" sx={{ fontWeight: 600, fontSize: 15 }}>
                New project
              </Box>
              <Box component="span" sx={{ fontSize: 13, color: "var(--text-muted)" }}>
                Import a video and subtitles
              </Box>
            </ButtonBase>
          </Grid>

          {/* Existing projects */}
          {list.map((proj) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={proj._id} component="li">
              <Paper elevation={0} sx={cardSx}>
                <ButtonBase
                  onClick={() => handleProjectLoad(proj.projectName, proj._id)}
                  aria-label={`Open ${proj.projectName}`}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    textAlign: "left",
                    flexGrow: 1,
                  }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      height: 110,
                      bgcolor: "var(--bg-raised)",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-subtle)",
                      position: "relative",
                    }}
                  >
                    <MovieOutlinedIcon sx={{ fontSize: 36 }} />
                    {proj.updatedAt && (
                      <Box
                        component="span"
                        sx={{
                          position: "absolute",
                          left: 10,
                          bottom: 8,
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--amber)",
                        }}
                      >
                        {parseDate(proj.updatedAt)}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ px: 2, pt: 1.75, pb: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: "var(--text-main)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {proj.projectName}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {proj.updatedAt
                        ? `Last edited ${parseDate(proj.updatedAt)}`
                        : "Dubbing project"}
                    </Typography>
                  </Box>
                </ButtonBase>

                {/* Quick actions */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 0.5,
                    px: 1,
                    pb: 1,
                  }}
                >
                  <Tooltip title="Open in studio">
                    <IconButton
                      aria-label={`Open ${proj.projectName} in studio`}
                      onClick={() => handleProjectLoad(proj.projectName, proj._id)}
                      sx={{ color: "var(--text-muted)" }}
                    >
                      <OpenInNewRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete project">
                    <IconButton
                      aria-label={`Delete ${proj.projectName}`}
                      onClick={(e) => handleDelete(e, proj)}
                      sx={{
                        color: "var(--text-muted)",
                        "&:hover": { color: "var(--danger)", bgcolor: "rgba(255, 92, 108, 0.1)" },
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        aria-labelledby="delete-project-title"
      >
        <DialogTitle id="delete-project-title">Delete this project?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{pendingDelete?.projectName}” will be permanently deleted. You can't undo this.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setPendingDelete(null)} autoFocus>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Projects;
