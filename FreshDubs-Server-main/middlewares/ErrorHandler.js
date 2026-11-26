const AppError = require("../utils/AppError");
const util = require("util");
const ErrorHandler = (err, req, res, next) => {
  // const err = error.code;
  // console.log(err.code);
  // if (err instanceof AppError) {
  //   console.log("hey");
  //   return res.status(err.statusCode).json({
  //     success: false,
  //     status: err.statusCode,
  //     message: errMsg,
  //     stack: process.env.NODE_ENV === "development" ? err.stack : {},
  //   });
  // }
  // console.log("Middleware Error Handling", err.message);

  // console.log(
  //   util.inspect(err.message, {
  //     showHidden: false,
  //     depth: null,
  //     colors: true,
  //   })
  // );

  const errStatus = err.statusCode || 500;
  // console.log(err.code);
  const errMsg = err.message || "Something went wrong";
  res.status(errStatus).json({
    success: false,
    status: errStatus,
    code: err.code,
    message: errMsg,
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  });
};

module.exports = ErrorHandler;
