import { setLocale, setTranslations } from "react-i18nify";
import i18n from "./index";

// Register subtitle-editor strings. index.js at the subplayer root used to do
// this, but it's a standalone entry the main app never imports.
setTranslations(i18n);
const language = navigator.language.toLowerCase();
setLocale(i18n[language] ? language : "en");
