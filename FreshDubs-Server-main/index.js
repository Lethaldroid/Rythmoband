require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");
const paymentRoute = require("./routes/payment");
const projectRoute = require("./routes/project");
const translateRoute = require("./routes/translate");
const passport = require("passport");
const initializeLocalPassport = require("./config/passport-local.config");
const initializeGooglePassport = require("./config/passport-google.config");
const initializeJWTPassport = require("./config/passport-jwt.config");
const User = require("./models/userModel");
const tryCatch = require("./utils/tryCatch");
const ErrorHandler = require("./middlewares/ErrorHandler");
const cors = require("cors");
var session = require("express-session");
const path = require("path");

// express app
const app = express();
const certificateFilePath = path.join(__dirname, "global-bundle.pem");
// SO it's storing on the server page
// get it to send to the correct domain, and reverse your changes

// const whitelist = [
//   "http://localhost:3000",
//   "https://fresh-dubs.com/",
// ];
// var corsOptions = {
//   credentials: true,
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
// };

// // middleware
// app.use(
//   // cors({
//   //   credentials: true,
//   //   origin: function (origin, callback) {
//   //     if (!origin || whitelist.indexOf(origin) !== -1) {
//   //       callback(null, true);
//   //     } else {
//   //       callback(new Error("Not allowed by CORS"));
//   //     }
//   //   },
//   // })
//   cors({ credentials: true, origin: "*" })
// );

app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://fresh-dubs.com",
    "https://fresh-dubs.com",
    // "https://cors-test.codehappy.dev/",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
  // 'PUT'
  res.header(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS, POST, PUT, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", true);
  return next();
});

app.use(
  express.json({
    limit: "5mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
// app.use(session({ secret: process.env.SECRET }));
initializeLocalPassport(passport);
initializeGooglePassport(passport);
initializeJWTPassport(passport);
// app.use(passport.initialize());
// app.use(passport.session());
//routes

app.use("/api/user", tryCatch(userRoutes));
app.use("/api/stripe", paymentRoute);
app.use("/api/project", projectRoute);
app.use("/api/translate", translateRoute);

const port = process.env.PORT || 4000;

//connect to db
// console.log("the data", certificateFilePath);
mongoose
  .connect(
    process.env.MONGO_URI_USERS_LOCAL,
    // `mongodb://freshdubs:${process.env.MONGO_PASSWORD}@docdb-2023-07-01-11-19-08.cluster-csrvyqnhevou.us-east-1.docdb.amazonaws.com:27017/?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // sslCA: certificateFilePath,
      // ssl: true,
      // sslValidate: true,
    }
  )
  .then(() => {
    // listen for requests
    app.listen(port, () => {
      console.log("connected to db & listening on port", port);
    });
  })
  .catch((error) => {
    console.error(error);
    // console.log(process.env.MONGO_URI);
  });

app.use(ErrorHandler);
