const express = require("express");
const tryCatch = require("../utils/tryCatch");
const router = express.Router();
const User = require("../models/userModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const passport = require("passport");
const paymentController = async (req, res) => {
  const { product, customerId } = req.body;
  // console.log(product, customerId);
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: product,
        quantity: 1,
      },
    ],
    //back home
    success_url: `${clientUrl}/app`,
    //a cancel page
    cancel_url: `${clientUrl}/pricing`,
  });
  res.json({ id: session.id, url: session.url });
};

const webHookHandler = async (request, response) => {
  // console.log(event.type);

  const sig = request.headers["stripe-signature"];
  tolerance = 500000;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,

      // process.env.STRIPE_ENDPOINT_SECRET_LOCAL,
      process.env.STRIPE_ENDPOINT_SECRET_LIVE,
      tolerance
    );
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    console.log(err);
    return;
  }

  switch (event.type) {
    case "customer.subscription.created":
      //Handle successful payments & upgrade membership

      const checkoutSessionCompleted = event.data.object;
      subscription = await stripe.subscriptions.retrieve(
        checkoutSessionCompleted.id
      );
      await User.upgradeMembership(checkoutSessionCompleted);
      await User.notifyUser(
        checkoutSessionCompleted.customer,
        `Congratulations you have now been upgraded to the ${subscription.plan.nickname} plan`
      );

      break;
    //Monthly sub comes in event
    case "invoice.paid":
      const invoiceEventData = event.data.object;
      // console.log("THE EVENT DATA", invoiceEventData);
      subscription = await stripe.subscriptions.retrieve(
        invoiceEventData.subscription
      );

      if (invoiceEventData.billing_reason === "subscription_cycle") {
        // console.log("yes");
        await User.notifyUser(
          invoiceEventData.customer,
          `your ${subscription.plan.nickname} plan has been renewed`
        );
      }
      break;

    case "invoice.payment_failed":
      const dataPayme = event.data.object;

      if (dataPayme.attempt_count === 1) {
        await User.notifyUser(
          dataPayme.customer,
          `Change your payment method before your subscription ends in 7 days ${dataPayme.hosted_invoice_url}`
        );
      }
      if (dataPayme.attempt_count === 3) {
        await User.notifyUser(
          dataPayme.customer,
          `Dear user, your subscription ends soon, change your payment method here: ${dataPayme.hosted_invoice_url}`
        );
      }

      break;
    case "payment_intent.payment_failed":
      const dat = event.data.object;
      // console.log("THE EVENT DATA", dat.last_payment_error.message);
      await User.notifyUser(dat.customer, `${dat.last_payment_error.message}`);
      // await User.downgradeMembership(data);
      break;
    case "customer.subscription.deleted":
      const data = event.data.object;

      await User.downgradeMembership(data);
      await User.notifyUser(
        data.customer,
        `You have now been downgraded to the Basic Plan, Reason: ${data.cancellation_details.reason}`
      );
      break;
    case "customer.subscription.updated":
      //redundant declaration, refactor
      // console.log("it updated o");
      const updatedEvent = event.data.object;
      // console.log("THE EVENT DATA", updatedEvent);
      await User.upgradeMembership(updatedEvent);
      await User.notifyUser(
        updatedEvent.customer,
        `Your plan has now been updated`
      );
      break;
    default:
    // console.log(`Unhandled event type ${event.type}`);
  }
};

router.post("/create-checkout-session", tryCatch(paymentController));
//webhooks
router.post(
  "/webhooks",
  express.raw({ type: "application/json" }),
  tryCatch(webHookHandler)
);

router.get(
  "/manage-billing",
  passport.authenticate("jwt", { session: false }),
  tryCatch(async (req, res) => {
    const user = req.user;

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: `${clientUrl}/dashboard/projects`,
    });

    res.status(200).json({ session: session.url });
  })
);
module.exports = router;
