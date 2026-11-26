// const { loginUser } = require("./controllers/userController")
const User = require("../models/userModel");
const LocalStrategy = require("passport-local").Strategy;

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    try {
      const user = await User.login(email, password);
      //   if (!user) {
      //     return done(null, false, { message: "Invalid email or password" });
      //   }
      return done(null, user);
    } catch (error) {
      done(error);
    }
    // console.log(user)

    // const user = await User.login();
  };
  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));
  //   passport.serializeUser();
}

module.exports = initialize;
