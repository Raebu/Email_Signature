export async function sendWithSignature(resend, engine, message, context = {}) {
  if (!resend?.emails?.send) {
    throw new TypeError('A Resend client with emails.send() is required.');
  }
  if (!engine?.apply) {
    throw new TypeError('A signature engine created by createSignatureEngine() is required.');
  }

  return resend.emails.send(engine.apply(message, context));
}

export function createResendSignatureSender(resend, engine) {
  return {
    send(message, context = {}) {
      return sendWithSignature(resend, engine, message, context);
    },
    preview(message, context = {}) {
      return engine.apply(message, context);
    },
    resolve(from, context = {}) {
      return engine.resolve(from, context);
    }
  };
}
