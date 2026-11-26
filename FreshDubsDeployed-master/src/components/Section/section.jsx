import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

const Section = styled(Box)(({ theme, padding }) => ({
  paddingInline: "clamp(16px, 5vw, 120px)",
  textAlign: "left",
  position: "relative",
  minHeight: "800px",
  //   background: "orange",
  overflow: "hidden",
  //   marginTop: "5px",

  "& h2": {
    fontSize: "clamp(30px, 7vw,50px)",
    margin: "0px",
  },
  "& h3": {
    // display: "none",
    fontSize: "clamp(22px, 4vw,30px)",
    margin: "0px",
  },
  "& h4": {
    // display: "none",'
    fontSize: "clamp(18px, 7vw, 22px)",
    margin: "0px",
  },
}));

export default Section;
