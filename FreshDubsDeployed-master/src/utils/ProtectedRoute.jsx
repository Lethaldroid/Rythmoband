import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { mainContext } from "../services/context";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { useDispatch } from "react-redux";
import { getUserInfos } from "../store/features/userSlice";
import { getCookie } from "./cookies";

const ProtectedRoute = () => {
  const { setUserData } = useContext(mainContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [cookies] = useCookies(["jwt_Token"]);
  // getCookieValue()
  useEffect(() => {
    // console.log("hell is real");
    // const tokenData = getCookieValue("jwt_Token");
    dispatch(getUserInfos());
    // console.log(cookies);
    // if (getCookie("jwt_Token")) {
    // }
    // if (tokenData) {
    //   localStorage.setItem("jwt", tokenData);
    //   setAuth({ token: tokenData });
    //   // setUserData()
    //   // navigate("/app");
    // }
  }, []);

  //   let auth = {'token':true}
  return "jwt_Token" in cookies ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
