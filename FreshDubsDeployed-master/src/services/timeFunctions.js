export const convertToSecInt = (time) => {
  if (time === null || time === undefined) return 0;
  if (typeof time === "number") return isNaN(time) ? 0 : time;

  const str = String(time).trim();
  if (!str) return 0;

  // If it's already a clean numeric string, e.g. "12.34"
  if (!isNaN(str) && str.indexOf(":") === -1) {
    return parseFloat(str) || 0;
  }

  // Normalize commas to dots or colons
  // Standard SRT format is HH:MM:SS,mmm or HH:MM:SS.mmm or HH:MM:SS:mmm
  const parts = str.split(":");
  if (parts.length === 4) {
    // HH:MM:SS:mmm
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    const millisPart = parts[3].trim().replace(",", ".");
    const millis = (parseFloat(millisPart) || 0) / Math.pow(10, millisPart.length || 3);
    return hours * 3600 + minutes * 60 + seconds + millis;
  } else if (parts.length === 3) {
    // HH:MM:SS,mmm or HH:MM:SS.mmm
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const secondsPart = parts[2].trim().replace(",", ".");
    const seconds = parseFloat(secondsPart) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    // MM:SS,mmm or MM:SS.mmm
    const minutes = parseFloat(parts[0]) || 0;
    const secondsPart = parts[1].trim().replace(",", ".");
    const seconds = parseFloat(secondsPart) || 0;
    return minutes * 60 + seconds;
  }

  const fallback = parseFloat(str.replace(",", "."));
  return isNaN(fallback) ? 0 : fallback;
};