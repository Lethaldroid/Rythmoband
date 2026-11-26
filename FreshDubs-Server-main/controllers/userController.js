// const userModel = require("../models/userModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createToken = (_id) => {
  //TODO: remember me
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};
// login a user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);

    // create a token
    const token = createToken(user._id);

    // res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// signup a user
const signupUser = async (req, res) => {
  const { email, password, userName } = req.body;

  const customer = await stripe.customers.create({
    email: email,
  });
  try {
    const user = await User.signup(email, password, userName, customer.id);
    //create a token
    const token = createToken(user._id);

    if (req.body.rememberMe) {
      res.cookie("jwt_Token", token, {
        // secure:true,
        maxAge: 2592000000,
        secure: true,
        httpsOnly: true,
      });
    } else {
      res.cookie("jw", token, {
        // secure:true,
        maxAge: 86400000,
        secure: true,
        httpsOnly: true,
      });
    }
    res.status(200).json({ token, userName });
    // res.redirect(`/signup/${token}`);
  } catch (error) {
    res.status(400).json({ error: error.message });
    // next(error)
  }
};

module.exports = { signupUser, loginUser };
