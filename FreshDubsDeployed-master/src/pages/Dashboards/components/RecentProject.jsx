import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { parseDate } from "../../../utils/dummyData";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useNavigate } from "react-router-dom";
import { DialoguesContext, mainContext } from "../../../services/context";
import { useContext } from "react";
import { useDispatch } from "react-redux";
import {
  clearProject,
  deleteProject,
  getAllProjects,
  loadProject,
} from "../../../store/features/appSlice";
import { notify } from "reapop";
import { useEffect } from "react";

function RecentProject({ projectName, updated_at, id }) {
  const { setRecordingData } = useContext(mainContext);
  const [del, setDeleted] = useState(false);
  const { setCurrentTime } = useContext(DialoguesContext);
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);
  const menuId = `project-menu-${id}`;
  const buttonId = `project-menu-button-${id}`;
  const confirmTitleId = `delete-project-title-${id}`;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  useEffect(() => {
    dispatch(getAllProjects());
  }, [del]);

  const handleDelete = (id, projectName) => {
    dispatch(deleteProject(id))
      .then((data) =>
        dispatch(
          notify({
            message: `Deleted ${projectName}`,
            onDismiss: () => {
              setDeleted(!del);
            },
          })
        )
      )
      .catch((error) => dispatch(notify({ message: error })));
    dispatch(getAllProjects());
    setAnchorEl(null);
  };

  const handleProjectLoad = (projectName, id) => {
    setRecordingData([]);
    setCurrentTime("");
    dispatch(clearProject());
    if (id) {
      dispatch(loadProject(id));
    }
    navigate(`/app/${projectName}`);
  };

  return (
    <Box
      component="li"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        pr: 1,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        bgcolor: "var(--bg-surface)",
        transition: "border-color var(--transition-fast), background-color var(--transition-fast)",
        "&:hover": {
          borderColor: "var(--border-strong)",
          bgcolor: "var(--bg-raised)",
        },
      }}
    >
      <ButtonBase
        onClick={() => handleProjectLoad(projectName, id)}
        aria-label={`Open ${projectName}`}
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1.5,
          minHeight: 60,
          pl: 2,
          py: 1,
          textAlign: "left",
          borderRadius: "var(--radius-md)",
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: "var(--radius-sm)",
            bgcolor: "var(--primary-soft)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MovieOutlinedIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-main)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {projectName}
          </Typography>
          <Typography
            sx={{
              display: { xs: "block", sm: "none" },
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}
          >
            Edited {parseDate(updated_at)}
          </Typography>
        </Box>
        <Typography
          sx={{
            display: { xs: "none", sm: "block" },
            flexShrink: 0,
            width: 120,
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
          }}
        >
          {parseDate(updated_at)}
        </Typography>
      </ButtonBase>

      <Tooltip title="Open in studio">
        <IconButton
          aria-label={`Open ${projectName} in studio`}
          onClick={() => handleProjectLoad(projectName, id)}
          sx={{ display: { xs: "none", sm: "inline-flex" }, color: "var(--text-muted)" }}
        >
          <OpenInNewRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="More actions">
        <IconButton
          aria-label={`More actions for ${projectName}`}
          id={buttonId}
          aria-controls={open ? menuId : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-haspopup="true"
          onClick={handleClick}
          sx={{ color: "var(--text-muted)" }}
        >
          <MoreHorizRoundedIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id={menuId}
        MenuListProps={{ "aria-labelledby": buttonId }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            handleProjectLoad(projectName, id);
          }}
        >
          <ListItemIcon aria-hidden="true">
            <OpenInNewRoundedIcon fontSize="small" />
          </ListItemIcon>
          Open
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setConfirmOpen(true);
          }}
          sx={{ color: "var(--danger)" }}
        >
          <ListItemIcon aria-hidden="true" sx={{ color: "inherit" }}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby={confirmTitleId}
      >
        <DialogTitle id={confirmTitleId}>Delete this project?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{projectName}” will be permanently deleted. You can't undo this.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmOpen(false)} autoFocus>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setConfirmOpen(false);
              handleDelete(id, projectName);
            }}
          >
            Delete project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RecentProject;
