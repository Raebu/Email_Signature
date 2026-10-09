import test from 'node:test';
import assert from 'node:assert/strict';
import { createSignatureEngine, createResendSignatureSender } from '../src/index.js';

const engine = createSignatureEngine({
  defaultSignature: {
    name: 'Martin Raeburn',
    title: 'CEO',
    company: 'Default Company',
    includeSenderEmail: true
  },
  organizations: [
    {
      id: 'raeburn',
      domains: ['theraeburngroup.com'],
      signature: { company: 'The Raeburn Group' }
    }
  ],
  domains: {
    'ventures.theraeburngroup.com': { company: 'Raeburn Ventures' },
    '*.example.com': { title: 'Example Network' }
  },
  senders: {
    'support@theraeburngroup.com': { name: 'Raeburn Support', title: 'Support Team' }
  }
});

test('uses sender > domain > organization > default hierarchy', () => {
  assert.equal(engine.resolve('support@theraeburngroup.com').name, 'Raeburn Support');
  assert.equal(engine.resolve('support@theraeburngroup.com').company, 'The Raeburn Group');
  assert.equal(engine.resolve('martin@ventures.theraeburngroup.com').company, 'Raeburn Ventures');
});

test('supports wildcard domain overrides', () => {
  const signature = engine.resolve('hello@new.example.com');
  assert.equal(signature.title, 'Example Network');
});

test('unknown domains still receive a safe default signature', () => {
  const signature = engine.resolve('hello@brand-new.co.uk');
  assert.equal(signature.name, 'Martin Raeburn');
  assert.equal(signature.company, 'Default Company');
  assert.equal(signature.email, 'hello@brand-new.co.uk');
});

test('can infer an unknown-domain brand when no default company overrides it', () => {
  const inferredEngine = createSignatureEngine({ defaultSignature: { name: 'Martin' } });
  const signature = inferredEngine.resolve('martin@brand-new.co.uk');
  assert.equal(signature.company, 'Brand New');
  assert.equal(signature.website, 'https://brand-new.co.uk');
});

test('appends both HTML and text signatures', () => {
  const result = engine.apply({
    from: 'Martin <martin@theraeburngroup.com>',
    to: 'person@example.com',
    subject: 'Hello',
    html: '<p>Hello there</p>',
    text: 'Hello there'
  });

  assert.match(result.html, /email-signature:start/);
  assert.match(result.html, /The Raeburn Group/);
  assert.match(result.text, /Martin Raeburn/);
  assert.match(result.text, /martin@theraeburngroup.com/);
});

test('re-applying replaces rather than duplicates an existing managed signature', () => {
  const first = engine.apply({ from: 'martin@theraeburngroup.com', html: '<p>Hello</p>' });
  const second = engine.apply(first);
  assert.equal((second.html.match(/email-signature:start/g) || []).length, 1);
});

test('skipSignature bypasses the signature and is not sent to Resend', () => {
  const result = engine.apply({ from: 'martin@theraeburngroup.com', html: '<p>Hello</p>', skipSignature: true });
  assert.equal(result.html, '<p>Hello</p>');
  assert.equal('skipSignature' in result, false);
});

test('Resend adapter signs before sending', async () => {
  let sent;
  const resend = { emails: { send: async message => { sent = message; return { data: { id: '1' } }; } } };
  const sender = createResendSignatureSender(resend, engine);
  await sender.send({ from: 'martin@theraeburngroup.com', html: '<p>Body</p>' });
  assert.match(sent.html, /The Raeburn Group/);
});
