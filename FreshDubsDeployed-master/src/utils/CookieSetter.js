import React, { useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate, useParams } from "react-router-dom";
import { getUserInfos } from "../store/features/userSlice";
import { useDispatch } from "react-redux";

function CookieSetter() {
  const { dfghjklllkjhg } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [cookies, setCookie, removeCookie] = useCookies(["jwt_Token"]);
  useEffect(() => {
    if (dfghjklllkjhg) {
      document.cookie = `jwt_Token=${dfghjklllkjhg} ; path=/;`;

      window.location.href = "/app";
    } else {
      navigate("/login");
    }
  }, []);

  return <div>CookieSetter</div>;
}

export default CookieSetter;
