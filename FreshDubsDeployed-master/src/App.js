import logo from "./logo.svg";
// import Navbar from "./components/navbar";
import VideoPlayer from "./components/VideoPlayer";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Rythmoband from "./components/rythmoband/rythmoband";
import SrtUploader from "./components/srtuploader/srtuploader";
import Projectlist from "./components/projectuploader";
import "./App.css";
import { useState, createContext, useEffect } from "react";
import { HotkeysProvider, useHotkeys } from "react-hotkeys-hook";
import { mainContext, DialoguesContext } from "./services/context";
import { isMobile } from "./pages/subplayer/utils";
import User from "./pages/Dashboards/User";
import ProtectedRoute from "./utils/ProtectedRoute";
import Login from "./pages/Login/login";
import axios from "axios";
import Signup from "./pages/Signup/signup";
import { Button, Toolbar } from "@mui/material";
import SubPlayer from "./pages/subplayer/subPlayer";
import Mobile from "./pages/subplayer/Mobile";
import GlobalStyle from "./pages/subplayer/GlobalStyle";
import { CookiesProvider, useCookies } from "react-cookie";
import Reset from "./pages/Reset/reset";
import Forget from "./pages/Forget/forget";
import Home from "./pages/Home/Home";
import Navbar from "./components/Navbar/index.jsx";
import Footer from "./components/Footer/footer";
import CookieSetter from "./utils/CookieSetter";
import Pricing from "./pages/Pricing/Pricing";
import DashboardNav from "./pages/Dashboards/components/DashboardNav";
import { Detector } from "react-detect-offline";
import Projects from "./pages/Dashboards/Projects";
import AppNav from "./pages/Dashboards/components/AppNav";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./store/store";
import NotificationsSystem, {
  NotificationsProvider,
  setUpNotifications,
  dismissNotification,
  useNotifications,
} from "reapop";
import About from "./pages/About";
import Faq from "./pages/Faq";
import UserGuide from "./pages/UserGuide";
import Privacy from "./pages/Privacy";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import toastTheme from "./utils/toastTheme";

// Editor hotkeys only run (and only swallow keys) on the editor route.
const onEditor = () => window.location.pathname.startsWith("/app/");
const hotkeyOptions = { enabled: onEditor, preventDefault: onEditor };

function App() {
  const [Dialogues1, setDialogues1] = useState([""]);
  const [Time1, setTime1] = useState([["00:00:00:000 ", " 00:00:00:832"]]);
  const [Dialogues2, setDialogues2] = useState([""]);
  const [Time2, setTime2] = useState([["00:00:00:000 ", " 00:00:00:832"]]);
  const [Dialogues3, setDialogues3] = useState([""]);
  const [Time3, setTime3] = useState([["00:00:00:000 ", " 00:00:00:832"]]);
  const [source, setsource] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [dialogueNumber, setDialogueNumber] = useState(undefined);
  const [rythmoPosition, setrythmoPosition] = useState(undefined);
  // const [projectName, setprojectName] = useState(undefined);
  const [voiceList, setVoiceList] = useState([]);
  const [recordingData, setRecordingData] = useState([]);
  const [jsonData, setJsonData] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [toggleSlider, setToggleSlider] = useState(false);
  const [statusArray, setStatusArray] = useState([]);
  const [redoArray, setRedoArray] = useState([]);
  const [vidDuration, setVidDuration] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [channels, setChannels] = useState(1); //1 for mono, 2 for stereo
  const { projectName, vidSource, time1, time2, time3, srt1, srt2, srt3 } =
    useSelector((state) => state.app);
  const dispatch = useDispatch();
  //Test state, to be replaced with redux
  const [auth, setAuth] = useState({ token: false });
  const [projectLoaded, setprojectLoaded] = useState(false);
  // const [userData, setUserData] = useState({ userName: "" });

  useEffect(() => {
    // console.log("ToggleSlider", toggleSlider);
    // console.log(userData);
    // document.cookie = "jwt_Token=default";
    // if()
    // const fetchAuthUser = async ()=>{
    //   await axios.get(/)
    // }
    // console.log("reloaded", auth);
  }, [toggleSlider, auth]);
  setUpNotifications({
    defaultProps: {
      position: "top-center",
      dismissible: true,
      // onDismiss:
      dismissAfter: 3000,
      allowHTML: true,
      // showDismissButton: true,
    },
  });
  const [vidHot, setVidHot] = useState({
    play: false,
    record: false,
    trim: false,
    f: false,
    b: false,
    ff: false,
    bb: false,
    save: false,
    G: false,
    undo: false,
    redo: false,
  });

  // const { notifications, dismissNotification } = useNotifications();
  const notifications = useSelector((state) => state.notifications);
  // Editor hotkeys. Each one flips a flag in vidHot; the editor components
  // react to the change.
  const toggleHot = (key) => setVidHot((v) => ({ ...v, [key]: !v[key] }));
  useHotkeys("space", () => toggleHot("play"), hotkeyOptions);
  useHotkeys("shift+space", () => toggleHot("record"), hotkeyOptions);
  useHotkeys("c", () => toggleHot("trim"), hotkeyOptions);
  useHotkeys("right", () => toggleHot("f"), hotkeyOptions);
  useHotkeys("left", () => toggleHot("b"), hotkeyOptions);
  useHotkeys("shift+right", () => toggleHot("ff"), hotkeyOptions);
  useHotkeys("shift+left", () => toggleHot("bb"), hotkeyOptions);
  useHotkeys("g", () => toggleHot("G"), hotkeyOptions);
  useHotkeys("ctrl+z, meta+z", () => toggleHot("undo"), hotkeyOptions);
  useHotkeys("ctrl+y, meta+shift+z", () => toggleHot("redo"), hotkeyOptions);
  useHotkeys("s, ctrl+s, meta+s", () => toggleHot("save"), hotkeyOptions);
  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
    <HotkeysProvider initiallyActiveScopes={["video"]}>
      <Router>
        <CookiesProvider>
          <mainContext.Provider
            value={{
              showExport,
              setShowExport,
              recordingData,
              setRecordingData,
              jsonData,
              setJsonData,
              recordings,
              setRecordings,
              toggleSlider,
              setToggleSlider,
              statusArray,
              setStatusArray,
              redoArray,
              setRedoArray,
              vidDuration,
              setVidDuration,
              channels,
              setChannels,
              auth,
              setAuth,
              projectLoaded,
              setprojectLoaded,
            }}
          >
            <DialoguesContext.Provider
              value={{
                Dialogues1,
                setDialogues1,
                Time1,
                setTime1,
                Dialogues2,
                setDialogues2,
                Time2,
                setTime2,
                Dialogues3,
                setDialogues3,
                Time3,
                setTime3,
                source,
                setsource,
                currentTime,
                setCurrentTime,
                dialogueNumber,
                setDialogueNumber,
                rythmoPosition,
                setrythmoPosition,
                // projectName,
                // setprojectName,
                voiceList,
                setVoiceList,
              }}
            >
              {/* <Provider store={store}> */}
              <div className="App">
                <a className="skip-link" href="#main-content">
                  Skip to main content
                </a>
                <div>
                  <NotificationsSystem
                    // 2. Pass the notifications you want Reapop to display.
                    notifications={notifications}
                    // 3. Pass the function used to dismiss a notification.
                    dismissNotification={(id) =>
                      dispatch(dismissNotification(id))
                    }
                    // 4. Pass a builtIn theme or a custom theme.
                    theme={toastTheme}
                  />
                </div>
                <Detector
                  render={({ online }) => (
                    <>
                      <Navbar online={online} />
                      {/* <h1>{online}</h1> */}
                    </>
                  )}
                />
                {/* <DashboardNav /> */}
                <Toolbar />
                <main id="main-content" tabIndex={-1} style={{ outline: "none" }}>
                <Routes>
                  <Route index exact path="/" element={<Home />}></Route>
                  <Route path="/login">
                    <Route index element={<Login />} />
                    <Route path=":dfghjklllkjhg" element={<Login />} />
                  </Route>
                  <Route path="/signup">
                    <Route index element={<Signup />} />
                    <Route path=":dfghjklllkjhg" element={<Signup />} />
                  </Route>
                  <Route path="/pricing">
                    <Route index element={<Pricing />} />
                    {/* <Route path=":dfghjklllkjhg" element={<Signup />} /> */}
                  </Route>
                  <Route
                    path="/subplayer"
                    element={
                      <>
                        <GlobalStyle />
                        {isMobile ? <Mobile /> : <SubPlayer />}
                      </>
                    }
                  ></Route>
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="app"
                      element={
                        <>
                          {/* <SrtUploader /> */}
                          <Detector
                            render={({ online }) => (
                              <>
                                <AppNav online={online} />
                              </>
                            )}
                          />
                        </>
                      }
                    >
                      <Route
                        path=":project"
                        element={
                          <VideoPlayer
                            Dialogues1={srt1}
                            Dialogues2={srt2}
                            Dialogues3={srt3}
                            time1={time1}
                            time2={time2}
                            time3={time3}
                            source={vidSource}
                            initialTime={currentTime || "0:0:0:0"}
                            rythmoPosition={rythmoPosition}
                            dialogueNumber={dialogueNumber}
                            voiceList={voiceList}
                            toggleSlider={toggleSlider}
                            vidHot={vidHot}
                            setVidHot={setVidHot}
                            setToggleSlider={setToggleSlider}
                            context={mainContext.Consumer}
                            store={store}
                            name={projectName}
                          />
                        }
                      />
                    </Route>
                  </Route>
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="dashboard"
                      element={
                        <Detector
                          render={({ online }) => (
                            <>
                              <DashboardNav online={online} />
                            </>
                          )}
                        />
                      }
                    >
                      <Route path="projects" element={<Projects />}></Route>
                      <Route path="settings" element={<>settings</>}></Route>
                      <Route
                        path=":user"
                        element={
                          <Detector
                            render={({ online }) => (
                              <>
                                <User online={online} />
                              </>
                            )}
                          />
                        }
                      ></Route>
                    </Route>
                  </Route>
                  <Route
                    exact
                    path="/projectlist"
                    element={<Projectlist />}
                  ></Route>

                  <Route
                    exact
                    path="/reset-password/:id/:token"
                    element={<Reset />}
                  ></Route>
                  <Route
                    exact
                    path="/privacy-policy"
                    element={<Privacy />}
                  ></Route>
                  {/* <Route
                    exact
                    path="/auth/:dfghjklllkjhg"
                    element={<CookieSetter />}
                  ></Route> */}
                  <Route
                    exact
                    path="/forget-password"
                    element={<Forget />}
                  ></Route>
                  <Route exact path="/about" element={<About />}></Route>
                  <Route exact path="/faq" element={<Faq />}></Route>
                  <Route
                    exact
                    path="/user-guide"
                    element={<UserGuide />}
                  ></Route>
                </Routes>
                </main>
                <Footer />
              </div>
              {/* </Provider> */}
            </DialoguesContext.Provider>
          </mainContext.Provider>
        </CookiesProvider>
      </Router>
    </HotkeysProvider>
    </ThemeProvider>
  );
}

export default App;
