// const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("../models/userModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

function initialize(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL:
          "https://fresh-dubs-server.vercel.app/api/user/google-auth/callback",
        // proxy: true,
        // passReqToCallback   : true
      },
      function (request, accessToken, refreshToken, profile, done) {
        // console.log(profile);
        // done(profile);
        User.findOne({ email: profile.email }).then(async (currentUser) => {
          if (currentUser) {
            // currentUser.firstName = profile.given_name
            // console.log(profile);
            return done(null, currentUser);
          } else {
            // new User({

            //     email:profile.emails[0].value,
            //     password:"google" //placeholder password
            // })

            const customer = await stripe.customers.create({
              email: profile.email,
            });

            const user = await User.signup(
              profile.email,
              "google",
              profile.given_name,
              customer.id
            );
            return done(null, user);
          }
        });
      }
    )
  );
  passport.serializeUser((user, cb) => {
    // console.log("Serializing user:", user);
    cb(null, user._id);
  });

  passport.deserializeUser(async (id, cb) => {
    const user = await User.findOne({ where: { id } }).catch((err) => {
      // console.log("Error deserializing", err);
      cb(err, null);
    });

    // console.log("DeSerialized user", user);

    if (user) cb(null, user);
  });
}

module.exports = initialize;
