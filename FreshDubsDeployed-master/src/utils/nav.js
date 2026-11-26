export const navItems = [
  { text: "Pricing", link: "/pricing" },
  { text: "User guide", link: "/user-guide" },
  { text: "FAQ", link: "/faq" },
  { text: "About", link: "/about" },
];

export const footerGroups = [
  {
    title: "Product",
    items: [
      { text: "Dubbing studio", link: "/app/new" },
      { text: "Subtitle editor", link: "/subplayer" },
      { text: "Pricing", link: "/pricing" },
    ],
  },
  {
    title: "Learn",
    items: [
      { text: "User guide", link: "/user-guide" },
      { text: "FAQ", link: "/faq" },
      { text: "About", link: "/about" },
    ],
  },
  {
    title: "Account",
    items: [
      { text: "Log in", link: "/login" },
      { text: "Create account", link: "/signup" },
      { text: "Privacy policy", link: "/privacy-policy" },
    ],
  },
];

// Kept for any older imports.
export const footerItems = footerGroups.flatMap((g) => g.items);

export const userItems = [
  { text: "Dashboard", link: "" },
  { text: "Projects Library", link: "projects" },
  { text: "SRT Editor", link: "subplayer" },
];
