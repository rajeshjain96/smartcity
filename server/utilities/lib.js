const normalizeNewlines = (text) => {
  // typeof str === "string" ? str.replace(/\r\n/g, "\n") : str;
  if (typeof text !== "string") return text;

  // Replace all \r\r\n with \n (handle Excel paste weirdness)
  text = text.replace(/\r\r\n/g, "\n");

  // Replace all remaining \r\n with \n
  text = text.replace(/\r\n/g, "\n");

  // Optional: remove standalone \r if any
  text = text.replace(/\r/g, "");

  return text;
};
module.exports = { normalizeNewlines };
