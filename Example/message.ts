/**
 * Local message generation (no network).
 */
import { generateWAMessage, extractMessageText } from "../src/Messages/index.js";

const msg = generateWAMessage("6281234567890@s.whatsapp.net", {
  text: "Hello KaguneX",
});
console.log(JSON.stringify(msg, null, 2));
console.log("text:", extractMessageText(msg));
