export const pricingOptions = [
  {
    plan: "Basic",
    price: "0",
    desc: "Everything you need to record your first dub.",
    core: "Includes",
    listings: [
      "Videos up to 1 min 30 s",
      "Integrated audio recorder",
      "Export as MP3",
    ],
    blue: true,
    price_id: "login",
  },
  {
    plan: "Pro",
    price: "17",
    desc: "For regular dubbing work. Free for 10 days.",
    core: "Everything in Basic, plus",
    listings: [
      "Videos of any length",
      "100 minutes of rythmo band volume",
      "Import subtitles",
      "Export your rythmo band",
    ],
    blue: false,
    price_id_test: "price_1N4TmTFQPhdwK6Sok1b9kNeE",
    price_id: "price_1N4RguFQPhdwK6SoT1ZBiQTT",
  },
  {
    plan: "Expert",
    price: "37",
    desc: "For studios and heavy use. Free for 10 days.",
    core: "Everything in Pro, plus",
    listings: ["Unlimited rythmo band volume", "Export audio as WAV"],
    blue: true,
    price_id_test: "price_1N4TpWFQPhdwK6SogFXUZ6AZ",
    price_id: "price_1N4RipFQPhdwK6SoGey1damC",
  },
];
// plan, price, desc, core, listings, blue
