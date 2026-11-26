import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../config";

export const getUserInfos = createAsyncThunk(
  "getUserInfos",
  async (object, { getState, rejectWithValue }) => {
    // console.log(getState());

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user/data`,
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
      rejectWithValue(error.response);
      console.error(error);
    }
  }
);

// const fetchUser = async () => {
//   try {
//     const response = await axios.get("http://localhost:4000/api/user/data", {
//       headers: {
//         Authorization: "Bearer " + cookies.jwt_Token,
//       },
//     });
//     if (response.data) {
//       return response.data;
//     }
//     //   setUserData(response.data);
//     // console.log(response.data);
//   } catch (error) {
//     console.log(error);
//   }
// };
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}
const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    loading: false,
    isSuccess: false,
    message: "gg",
    isAuthenticated: false,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.loading = false;
      state.isSuccess = false;
      state.message = "Logged Out";
      state.isAuthenticated = false;
    },
  },
  extraReducers: {
    [getUserInfos.pending]: (state, action) => {
      state.loading = true;
    },
    [getUserInfos.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.user = payload;
      state.isSuccess = true;
      state.isAuthenticated = true;
      state.message = "successs";
    },
    [getUserInfos.rejected]: (state, { payload }) => {
      state.loading = false;
      state.isSuccess = false;
      state.message = "error";
      // state.isAuthenticated = false;
    },
  },
});
export const { logout } = userSlice.actions;
export default userSlice;
