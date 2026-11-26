import { wyboTheme, STATUSES } from "reapop";

// Reapop toast theme in DubMaster colors.
const statusColor = {
  [STATUSES.none]: "#a1a1aa",
  [STATUSES.info]: "#6cb8ff",
  [STATUSES.loading]: "#6cb8ff",
  [STATUSES.success]: "#3ddc97",
  [STATUSES.warning]: "#ffb547",
  [STATUSES.error]: "#ff5c6c",
};

const toastTheme = {
  ...wyboTheme,
  notification: (n) => ({
    ...wyboTheme.notification(n),
    width: "min(380px, calc(100vw - 32px))",
    borderRadius: "12px",
    backgroundColor: "#1a1a1f",
    color: "#f4f4f5",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderLeft: `3px solid ${statusColor[n.status]}`,
    boxShadow: "0 16px 40px -12px rgba(0, 0, 0, 0.7)",
    fontFamily: "var(--font-sans)",
    marginBottom: "12px",
  }),
  notificationIcon: (n) => ({
    ...wyboTheme.notificationIcon(n),
    color: statusColor[n.status],
  }),
  notificationDismissIcon: (n) => ({
    ...wyboTheme.notificationDismissIcon(n),
    color: "#a1a1aa",
  }),
  notificationButton: (n, position, state) => ({
    ...wyboTheme.notificationButton(n, position, state),
    color: state.isHovered ? "#ff7656" : "#f4f4f5",
    borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
    borderTop: position === 1 ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
  }),
};

export default toastTheme;
