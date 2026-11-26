import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Modal,
  OutlinedInput,
  TextField,
} from "@mui/material";
import { ErrorMessage, Field, Form, Formik } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { useSelector } from "react-redux";
import CloseIcon from "@mui/icons-material/Close";
function SuggestionForm({ show, setShowSuggestion }) {
  const { user } = useSelector((state) => state.user);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const initialValues = {
    // email: "",
    suggestion: "",
  };

  const cardStyle = {
    padding: "32px",
    paddingBottom: { xs: "16px", md: "24px" },
    width: { xs: "80%", md: "40%" },
    // height: "50%",
    backgroundColor: "#1955AA",
    borderRadius: "32px",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: "999",
    // display:show,
  };
  const formControlStyle = {
    textAlign: "left",
    "& label": {
      mb: "8px",
      color: "white",
      fontSize: "clamp(14px,2vw,18px)",
    },

    "& .MuiOutlinedInput-root": {
      // display: "none",
      //   borderRadius: "25px",
      backgroundColor: "white",
      // border: "5px solid red",
      // borderRadius: "25px",
    },
    "& .MuiInputBase-input": {
      border: "none",
    },
    "& label.Mui-focused": {
      color: "white",
      // border: "1px solid white",
    },
  };
  const formStyle = {
    display: "flex",
    flexDirection: "column",
  };
  const validationSchema = Yup.object({
    // email: Yup.string()
    //   .email("Invalid email format")
    //   .required("Email is required"),
    suggestion: Yup.string().required("Please provide your suggestion"),
  });
  const handleSubmit = async (values, actions) => {
    values.userName = user.userName;
    values.email = user.email;
    console.log(values);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/user/suggestion`,
        values
        // { withCredentials: true }
      );

      if (response.status === 200) {
        // Acknowledge the user
        setMessage(response.data.message);
      }
    } catch (error) {
      //   console.log(error);
      setMessage(error.response.data.message);
      console.error(error.response.data.message);
    }
  };

  return (
    <Modal open={show}>
      <Box sx={cardStyle}>
        <Box
          sx={{
            textAlign: "right",
            paddingRight: "16px",
            fontSize: "32px",
            color: "#FF9820",
          }}
        >
          <CloseIcon
            sx={{ cursor: "pointer" }}
            onClick={() => {
              setShowSuggestion(false);
              setMessage("");
            }}
          />
        </Box>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          <Form style={formStyle}>
            {message && (
              <p
                style={{
                  color: "#20ff58",
                  textAlign: "center",
                }}
              >
                {message}
              </p>
            )}
            {/* <FormControl sx={{ ...formControlStyle, mb: "24px" }}>
              <FormLabel>Email</FormLabel>
              <Field as={OutlinedInput} name="email" type="email" id="email" />
              <p
                style={{
                  color: "#FF9820",
                  marginTop: "6px",
                  marginLeft: "6px",
                }}
              >
                <ErrorMessage name="email" />
              </p>
            </FormControl> */}
            <FormControl sx={{ ...formControlStyle, mb: "24px" }}>
              <FormLabel>Suggestion/Complaint</FormLabel>
              <Field
                as={TextField}
                name="suggestion"
                type="text"
                id="suggestion"
                multiline
                rows={5}
              />
              <p
                style={{
                  color: "#FF9820",
                  marginTop: "6px",
                  marginLeft: "6px",
                }}
              >
                <ErrorMessage name="suggestion" />
              </p>
            </FormControl>
            <Button
              type="submit"
              sx={{
                backgroundColor: "#FF9820",
                width: { xs: "100%", md: "50%" },
                alignSelf: "center",
                color: "white",
              }}
            >
              Submit
            </Button>

            {/* {message && } */}
          </Form>
        </Formik>
      </Box>
    </Modal>
  );
}

export default SuggestionForm;
