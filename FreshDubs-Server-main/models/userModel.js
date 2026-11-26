const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const AppError = require("../utils/AppError");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profilePic: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  //to identify the customer from stripe
  customerId: {
    type: String,
    required: true,
  },
  membership: {
    type: String,
    // required: true,
    default: "Basic",
  },
  subscriptionId: {
    type: String,
    // required: true,
  },

  notifications: {
    new: { type: Boolean },
    messages: [{ type: String }],
  },
});

// static signup method
userSchema.statics.signup = async function (
  email,
  password,
  userName,
  customerId
) {
  // validation
  if (!email || !password) {
    throw Error("All fields must be filled");
  }
  if (!validator.isEmail(email)) {
    throw Error("Email not valid");
  }
  // if (!validator.isStrongPassword(password)) {
  //   throw Error("Password not strong enough");
  // }

  const exists = await this.findOne({ email });

  if (exists) {
    // console.log("NO");
    throw Error("Email already in use");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({
    email,
    password: hash,
    userName,
    customerId,
  });

  return user;
};

// static login method
userSchema.statics.login = async function (email, password) {
  if (!email) {
    throw Error("Please provide email");
  }
  if (!password) {
    throw Error("Please input your password");
  }

  const user = await this.findOne({ email });
  if (!user) {
    throw new Error("User not in our records");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw Error("Incorrect password");
  }

  return user;
};

userSchema.statics.upgradeMembership = async function (
  checkoutSessionCompleted
) {
  if (!checkoutSessionCompleted.customer) {
    console.log("no id");
    throw new Error("No customerId");
  }
  const customerId = checkoutSessionCompleted.customer;
  const user = await this.findOne({ customerId: customerId });

  const subscription = await stripe.subscriptions.retrieve(
    checkoutSessionCompleted.id
  );
  console.log("The subscription data", subscription);
  if (user) {
    // return user;

    try {
      const upgradedUser = await this.updateOne(
        { customerId },
        {
          membership: subscription.plan.nickname,
          subscriptionId: checkoutSessionCompleted.id,
        }
      );
      // console.log(upgradedUser);
      return upgradedUser;
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log("This user no dey our database");
  }

  // console.log()
};

userSchema.statics.downgradeMembership = async function (eventData) {
  if (!eventData.customer) {
    console.log("no id");
    throw new Error("No customerId");
  }
  const customerId = eventData.customer;
  const user = await this.findOne({ customerId: customerId });
  console.log("THE USER", user);

  if (user) {
    // return user;
    console.log("user FOund");
    try {
      const upgradedUser = await this.updateOne(
        { customerId },
        {
          membership: "Basic",
          subscriptionId: eventData.subscription,
        }
      );
      console.log(upgradedUser);
      return upgradedUser;
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log("This user no dey our database");
  }

  // console.log()
};

userSchema.statics.notifyUser = async function (customerId, newMessage) {
  if (!customerId) {
    console.log("no id");
    throw new Error("No customerId");
  }

  const user = await this.findOne({ customerId });

  if (user) {
    // console.log("SEND MESSSAGEEE");
    try {
      const User = await this.updateOne(
        { customerId },
        {
          $set: { "notifications.new": true },
          $push: { "notifications.messages": newMessage },
        }
      );
      console.log(User);

      // return upgradedUser;
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log("This user no dey our database");
  }

  // console.log()
};
module.exports = mongoose.model("userInfos", userSchema, "userInfos");
