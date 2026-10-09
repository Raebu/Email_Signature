export { createSignatureEngine } from './engine.js';
export { createResendSignatureSender, sendWithSignature } from './resend.js';
export {
  HTML_SIGNATURE_END,
  HTML_SIGNATURE_START,
  TEXT_SIGNATURE_END,
  TEXT_SIGNATURE_START,
  renderHtmlSignature,
  renderTextSignature,
  stripHtmlSignature,
  stripTextSignature
} from './render.js';
export { inferBrandName, normalizeDomain, parseMailbox, rootDomain } from './utils.js';
