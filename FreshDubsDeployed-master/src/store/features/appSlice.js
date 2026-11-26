import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { notify } from "reapop";
import { API_BASE_URL } from "../../config";
// import store from "../store";

//THUNKDOM
export const uploadProject = createAsyncThunk(
  "uploadProject",
  async (object, { getState, rejectWithValue }) => {
    const state = getState();
    const currentProject = state.app.currentProject;
    // const newOrNot = (match, currentProject) =>{
    //   return
    //   match ? currentProject?._id : false;
    // const match = currentProject.projectName === state.projectName;}
    console.log("values", {
      id: currentProject,
      projectName: state.app?.projectName,
      saveData: state.app?.saveData,
    });
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/project/save`,
        {
          id: currentProject,
          projectName: state.app?.projectName,
          saveData: state.app?.saveData,
        },
        {
          headers: {
            Authorization: "Bearer " + getCookie("jwt_Token"),
          },

          // withCredentials: true,
        }
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
      console.error(error);
    }
  }
);

export const loadProject = createAsyncThunk(
  "loadProject",
  async (id, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/project?id=${id}`,
        {
          headers: {
            Authorization: "Bearer " + getCookie("jwt_Token"),
          },

          // withCredentials: true,
        }
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
      console.error(error);
    }
  }
);
export const getAllProjects = createAsyncThunk(
  "getAllProjects",
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/project/all`,
        {
          headers: {
            Authorization: "Bearer " + getCookie("jwt_Token"),
          },
        }
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
      console.error(error);
    }
  }
);

export const deleteProject = createAsyncThunk(
  "deleteProject",
  async (id, { getState, rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/project/delete?id=${id}`,
        {
          headers: {
            Authorization: "Bearer " + getCookie("jwt_Token"),
          },
        }
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
      console.error(error);
    }
  }
);
//--> THUNKDOM

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}
const appSlice = createSlice({
  name: "app",
  initialState: {
    projectName: "Untitled Project",

    vidSource: "",
    srt1: [""],
    srt2: [""],
    srt3: [""],
    currentProject: "",
    time1: [["00:00:00:000 ", " 00:00:00:832"]],
    time2: [["00:00:00:000 ", " 00:00:00:832"]],
    time3: [["00:00:00:000 ", " 00:00:00:832"]],
    trackNames: ["", "", ""],
    saveData: "",
    loading: false,
    message: "",
    projects: [],
  },
  reducers: {
    updateProjectName(state, payload) {
      state.projectName = payload.payload;
    },
    uploadVideo(state, payload) {
      state.vidSource = payload.payload;
    },
    uploadSrt1(state, payload) {
      state.srt1 = payload.payload;
    },
    uploadSrt2(state, payload) {
      state.srt2 = payload.payload;
    },
    uploadSrt3(state, payload) {
      state.srt3 = payload.payload;
    },
    uploadTime1(state, payload) {
      state.time1 = payload.payload;
    },
    uploadTime2(state, payload) {
      state.time2 = payload.payload;
    },
    uploadTime3(state, payload) {
      state.time3 = payload.payload;
    },
    setTrackName(state, { payload: { track, name } }) {
      state.trackNames = [...(state.trackNames || ["", "", ""])];
      state.trackNames[track - 1] = name;
    },
    clearTrack(state, { payload: track }) {
      state[`srt${track}`] = [""];
      state[`time${track}`] = [];
      state.trackNames = [...(state.trackNames || ["", "", ""])];
      state.trackNames[track - 1] = "";
    },
    saveProject(state, payload) {
      state.saveData = payload.payload;
      // console.log(state.saveData);

      // state.currentProject= {}
      //remeber to create a thunk that uploads this
    },
    clearProject(state, payload) {
      state.saveData = "";
      state.projectName = "Untitled Project";
      state.currentProject = "";
      //remeber to create a thunk that uploads this
    },
  },
  extraReducers: {
    [getAllProjects.pending]: (state, action) => {
      state.loading = true;
    },
    [getAllProjects.fulfilled]: (state, action) => {
      state.loading = false;
      state.projects = action.payload;
    },
    [getAllProjects.rejected]: (state, action) => {
      state.loading = false;
      state.message = "error";
    },
    [loadProject.pending]: (state, action) => {
      state.loading = true;
    },
    [loadProject.fulfilled]: (state, action) => {
      state.saveData = action.payload?.saveData;
      state.projectName = action.payload?.projectName;
      state.currentProject = action.payload?._id;
    },
    [loadProject.rejected]: (state, action) => {
      state.loading = false;
      state.message = "error";
    },
    [uploadProject.pending]: (state, action) => {
      state.loading = true;
    },
    [uploadProject.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.saveData = payload?.saveData;
      state.projectName = payload?.projectName;
      state.currentProject = payload?._id;
      // alert("Project Saved");
    },
    [uploadProject.rejected]: (state, { payload }) => {
      state.loading = false;
      // state.isSuccess = false;
      state.message = "error";
      // state.isAuthenticated = false;
    },
    [deleteProject.fulfilled]: (state, { payload }) => {
      state.loading = false;
      // state.isSuccess = false;
      state.message = "error";
      // alert(`Successfully deleted Project ${payload.projectName}`);
      // getAllProjects();
      console.log("deleted");
      // state.isAuthenticated = false;
    },
    [deleteProject.rejected]: (state, { payload }) => {
      state.loading = false;
      // state.isSuccess = false;
      state.message = "error";
      // alert(`error deleting ${payload.projectName}`);

      // state.isAuthenticated = false;
    },
  },
});
export const {
  uploadVideo,
  uploadSrt1,
  uploadSrt2,
  uploadSrt3,
  uploadTime1,
  uploadTime2,
  uploadTime3,
  updateProjectName,
  saveProject,
  clearProject,
  setTrackName,
  clearTrack,
} = appSlice.actions;
export default appSlice;
