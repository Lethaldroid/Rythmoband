const express = require("express");
const initializePassport = require("../config/passport-local.config");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
// controller functions
const { loginUser, signupUser } = require("../controllers/userController");
const tryCatch = require("../utils/tryCatch");

const router = express.Router();

const authenticate = (method, req, res) =>
  new Promise((resolve, reject) => {
    passport.authenticate(method, (error, user, info) => {
      if (error) {
        reject(error);
      } else {
        // console.log(user);
        resolve(user);
      }
    })(req, res);
  });
const createToken = (_id) => {
  //TODO: remember me
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};
const tokenMaker = async (req, res) => {
  const { email, password } = req.body;
  // console.log(req.);
  if (!email) {
    throw Error("Please provide email");
  }
  if (!password) {
    throw Error("Please input your password");
  }
  try {
    const user = await authenticate("local", req, res);
    const token = createToken(user._id);
    if (req.body.rememberMe) {
      res.cookie("jwt_Token", token, {
        // secure:true,
        maxAge: 2592000000,
        secure: true,
        httpsOnly: true,
      });
      res.status(200).json({ token, age: 2592000000 });
    } else {
      res.cookie("jwt_Token", token, {
        // secure:true,
        maxAge: 86400000,
        secure: true,
        httpsOnly: true,
      });
      res.status(200).json({
        token,
        age: 86400000,
        customerId: user.customerId,
        membership: user.membership,
        notifications: user.notifications,
      });
    }

    // res.status(200).redirect(`/login/${token}`);
  } catch (error) {
    throw new Error(error);
  }
};

// login route
router.post("/login", tryCatch(tokenMaker));

// signup route
router.post("/signup", tryCatch(signupUser));

router.get(
  "/google-auth",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    // session: false,
    // successRedirect: "http://localhost:3000/omooooooo",
  })
);
const googleTokenMaker = async (req, res, next) => {
  try {
    const user = await authenticate("google", req, res);
    const token = createToken(user._id);
    // const data = { email: user.email, token };
    res.cookie("jw", token, {
      maxAge: 86400000,
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(`${clientUrl}/login/${token}`);
    // res.status(200).json({ message: "Successful Google Authentication" });
  } catch (error) {
    // console.log(error);
    throw new Error(error);
  }
};
router.get(
  "/google-auth/callback",

  tryCatch(googleTokenMaker)
);
router.get(
  "/data",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    // console.log(req.user);
    const { password, ...userData } = req.user._doc;
    // const {}
    if (req.user) {
      res.send(userData);
      // console.log(userData);
    } else {
      res.redirect("/login");
    }
  }
);

//FORGOT PASSWORD
router.post(
  "/forget-password",
  tryCatch(async (req, res) => {
    const { email } = req.body;
    try {
      const oldUser = await User.findOne({ email });
      if (!oldUser) {
        // return res.json({ status: "User does not exist" });
        throw new Error("User does not exist");
      }
      const secret = process.env.SECRET + oldUser.password;
      const token = jwt.sign(
        { email: oldUser.email, id: oldUser._id },
        secret,
        {
          expiresIn: "15m",
        }
      );

      //DEVELOPMENT vs PROD
      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      const link = `${clientUrl}/reset-password/${oldUser._id}/${token}`;
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      var mailOptions = {
        from: "ahmedaalee013@gmail.com",
        to: email,
        subject: "Password Reset",
        text: `Hello ${oldUser.userName}, here is your password reset ${link}. If you did not intiate this, then kindly ignore this email. This email doesn't accept replies`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          res.cookie("resetPass", token, {
            // secure:true,
            maxAge: 900000, //15min
            // secure: true,
            httpsOnly: true,
          });
          res.status(200).json({
            message: "Link sent successfully",
            token,
          });
        }
      });
      // console.log(link);
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  })
);

//Get the user details
router.get(
  "/reset-password/:id/:token",
  tryCatch(async (req, res) => {
    console.log("KAi");
    const { id, token } = req.params;
    // console.log(req.params);
    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
      return res.json({ status: "User does not exists" });
    }
    const secret = process.env.SECRET + oldUser.password;

    const verify = jwt.verify(token, secret);
    console.log(verify);
    res.status(200).json({ email: oldUser.email, userName: oldUser.userName });
  })
);
//update user pass
router.post(
  "/reset-password/:id/:token",
  tryCatch(async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
      return res.json({ status: "User not in our records" });
    }
    const secret = process.env.SECRET + oldUser.password;

    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );
    res.status(200).json({ success: true });
    // res.render("index", { email: verify.email, status: "verified" });
  })
);

//upload profile pic
router.post(
  "/upload-pic",
  tryCatch(async (req, res) => {
    const { base64, email } = req.body;
    // console.log(email);
    await User.updateOne(
      {
        email: email,
      },
      {
        $set: {
          profilePic: base64,
        },
      }
    );
    res.json({ message: "success uploading" });
  })
);
// uodate notifications
router.get(
  "/check-notifs",
  passport.authenticate("jwt", { session: false }),
  tryCatch(async (req, res) => {
    // const { base64, email } = req.body;
    // console.log(req.user);
    const user = req.user;
    // console.log(email);
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          "notifications.new": false,
        },
      }
    );
    res.status(200).json({ message: "success uploading" });
  })
);
router.post(
  "/suggestion",
  tryCatch(async (req, res) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    var mailOptions = {
      from: req.body.email,
      to: "ahmedaalee018@gmail.com",
      subject: "Customer Support",
      text: `Customer email: ${req.body.email}, the complaint/suggestion: ${req.body.suggestion}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        res.status(500).json({
          message: `An Error occured`,
          error: error,
          token,
        });
      } else {
        res.status(200).json({
          message: `Your Suggestions have been heard, Thank you ${req.body.userName}`,
        });
      }
    });
  })
);

module.exports = router;
