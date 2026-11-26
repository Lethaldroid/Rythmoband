import { Box, ButtonBase, Paper } from "@mui/material";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import React, { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { parseDate } from "../utils/dummyData";
import { clearProject, loadProject } from "../store/features/appSlice";
import { useNavigate } from "react-router-dom";
import { DialoguesContext, mainContext } from "../services/context";

function SearchPane({ searchParams = "" }) {
  const dispatch = useDispatch();
  const { projects } = useSelector((state) => state.app);
  const [filtered, setFiltered] = useState(projects);
  const { setRecordingData } = useContext(mainContext);

  const { setCurrentTime } = useContext(DialoguesContext);
  const navigate = useNavigate();
  useEffect(() => {
    setFiltered(searchProjects(searchParams));
  }, [dispatch, searchParams]);
  const searchProjects = (query) => {
    // Convert the query to lowercase for case-insensitive search
    const searchQuery = query.toLowerCase();

    // Filter the projects based on the search query
    if (Array.isArray(projects) && projects.length > 0) {
      const filteredProjects = projects.filter((project) => {
        const projectName = project.projectName.toLowerCase();
        return projectName.includes(searchQuery);
      });
      return filteredProjects;
    }
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
    <Paper
      elevation={0}
      role="region"
      aria-label="Search results"
      aria-live="polite"
      sx={{
        display: searchParams ? "block" : "none",
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        width: "100%",
        minWidth: 260,
        maxHeight: 360,
        overflowY: "auto",
        zIndex: 1300,
        p: 1,
        textAlign: "left",
        bgcolor: "var(--bg-raised)",
        backgroundImage: "none",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: 1,
          pb: 0.75,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        <span>Projects</span>
        <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
          Created
        </Box>
      </Box>
      {!filtered || filtered.length === 0 ? (
        <Box sx={{ px: 1, py: 1.5, fontSize: 14, color: "var(--text-muted)" }}>
          No projects match “{searchParams}”.
        </Box>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {filtered.map(({ projectName, _id, createdAt }) => (
            <li key={_id}>
              <ButtonBase
                onClick={() => handleProjectLoad(projectName, _id)}
                sx={{
                  width: "100%",
                  minHeight: 44,
                  px: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-main)",
                  textAlign: "left",
                  "&:hover, &.Mui-focusVisible": { bgcolor: "var(--bg-hover)" },
                }}
              >
                <Box
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
                >
                  <MovieOutlinedIcon
                    aria-hidden="true"
                    sx={{ fontSize: 18, color: "var(--text-muted)", flexShrink: 0 }}
                  />
                  <Box
                    component="span"
                    sx={{
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {projectName}
                  </Box>
                </Box>
                <Box
                  component="span"
                  sx={{
                    display: { xs: "none", md: "inline" },
                    flexShrink: 0,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  {parseDate(createdAt)}
                </Box>
              </ButtonBase>
            </li>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default SearchPane;
