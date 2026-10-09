# Email Signature Router

Automatic, domain-aware email signatures for **Resend** and any other email sender that accepts HTML/text message bodies.

The goal is simple: every outbound message gets the correct signature automatically, including messages from domains or aliases created later.

## Resolution order

The engine resolves a signature from least specific to most specific:

1. inferred domain fallback
2. global `defaultSignature`
3. organisation rule
4. exact or wildcard domain rule
5. exact sender/alias rule
6. one-off context override

That gives you the practical hierarchy:

**sender → domain → organisation → global fallback**, while still ensuring an unknown domain can receive a signature.

## Features

- Automatic signature on every outbound HTML and/or plain-text email
- Exact sender overrides such as `support@example.com`
- Exact domain overrides such as `ventures.example.com`
- Wildcard domain overrides such as `*.example.com`
- Organisation-level rules that also match subdomains
- Unknown-domain fallback with optional brand/domain inference
- Safe HTML escaping and conservative URL handling
- Mobile-friendly table-based email markup with inline CSS
- Logo, phone, website, address, social links and legal footer support
- Signature markers prevent duplicate managed signatures on replies/retries
- `skipSignature` escape hatch for machine messages that must remain unsigned
- Small Resend adapter with `send`, `preview` and `resolve`
- No runtime dependencies

## Install

This repository is intentionally dependency-free. Import it directly from your application or publish it to your preferred package registry.

```js
import { createSignatureEngine, createResendSignatureSender } from '@raebu/email-signature';
```

## Configure once

```js
import { createSignatureEngine } from './src/index.js';

export const signatures = createSignatureEngine({
  defaultSignature: {
    name: 'Martin Raeburn',
    title: 'CEO',
    company: 'The Raeburn Group',
    website: 'https://theraeburngroup.com',
    accentColor: '#0C0F12',
    includeSenderEmail: true,
    legalLines: [
      'This email may contain confidential information intended only for the named recipient.'
    ]
  },

  organizations: [
    {
      id: 'raeburn-group',
      domains: ['theraeburngroup.com'],
      signature: {
        company: 'The Raeburn Group',
        website: 'https://theraeburngroup.com'
      }
    }
  ],

  domains: {
    'ventures.theraeburngroup.com': {
      company: 'Raeburn Ventures',
      website: 'https://ventures.theraeburngroup.com'
    },
    'gibp.global': {
      company: 'GIBP Global',
      website: 'https://gibp.global'
    },
    'gibp.app': {
      company: 'GIBP Mail',
      website: 'https://gibp.app'
    },
    '*.future-brand.example': {
      title: 'Customer Team'
    }
  },

  senders: {
    'support@theraeburngroup.com': {
      name: 'Raeburn Support',
      title: 'Support Team'
    }
  }
});
```

## Use with Resend

```js
import { Resend } from 'resend';
import { createResendSignatureSender } from './src/index.js';
import { signatures } from './signature.config.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const mail = createResendSignatureSender(resend, signatures);

await mail.send({
  from: 'Martin <martin@theraeburngroup.com>',
  to: 'customer@example.com',
  subject: 'Hello',
  html: '<p>Your message goes here.</p>',
  text: 'Your message goes here.'
});
```

The application does **not** have to choose a signature. The sender address is enough.

## Domains created on the fly

Unknown domains still resolve safely. With `autoInferUnknownDomains` enabled (the default), the engine can infer a display company and website from the sender domain when a configured value is not available.

```js
const engine = createSignatureEngine({
  defaultSignature: {
    name: 'Martin Raeburn',
    title: 'CEO'
  }
});

engine.resolve('martin@brand-new.co.uk');
// company: "Brand New"
// website: "https://brand-new.co.uk"
// email: "martin@brand-new.co.uk"
```

If your global default specifies `company` or `website`, those configured values deliberately take precedence over inferred values. This lets you choose between one universal corporate fallback and per-domain automatic branding.

## Per-message override

A one-off override is possible without mutating global configuration:

```js
await mail.send(message, {
  signature: {
    title: 'Founder',
    phone: '+44 ...'
  }
});
```

## Skip a signature

For verification emails, machine alerts or messages where a signature is inappropriate:

```js
await mail.send({
  from: 'system@example.com',
  to: 'person@example.com',
  subject: 'Verification code',
  text: '123456',
  skipSignature: true
});
```

`skipSignature` is removed before the payload is handed to Resend.

## Preview / inspect

```js
const resolved = mail.resolve('support@theraeburngroup.com');
const payload = mail.preview({
  from: 'support@theraeburngroup.com',
  html: '<p>Hello</p>'
});
```

## Recommended production integration

Put the signature sender at the **lowest shared outbound-mail layer**. All manual compose, AI-generated mail, replies, automations and scheduled messages should call that one function. If individual features call `resend.emails.send()` directly, they can bypass the signature policy.

Domain verification is separate from signature routing. A sender domain still needs to be valid/verified with the email provider before mail can be delivered from it.

## Tests

```bash
npm test
```

## License

MIT
