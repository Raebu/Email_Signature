import { inferBrandName, mergeDefined, normalizeDomain, parseMailbox, rootDomain, wildcardMatches } from './utils.js';
import { renderHtmlSignature, renderTextSignature, stripHtmlSignature, stripTextSignature } from './render.js';

function findDomainOverride(overrides = {}, domain) {
  const normalizedDomain = normalizeDomain(domain);
  if (overrides[normalizedDomain]) return overrides[normalizedDomain];

  let best = null;
  let bestLength = -1;
  for (const [pattern, value] of Object.entries(overrides)) {
    if (pattern.startsWith('*.') && wildcardMatches(normalizedDomain, pattern) && pattern.length > bestLength) {
      best = value;
      bestLength = pattern.length;
    }
  }
  return best;
}

function findOrganization(config, domain) {
  const normalized = normalizeDomain(domain);
  let best = null;
  let bestLength = -1;

  for (const organization of config.organizations || []) {
    const domains = organization.domains || [];
    for (const candidate of domains) {
      const pattern = normalizeDomain(candidate);
      const matches = pattern.startsWith('*.')
        ? wildcardMatches(normalized, pattern)
        : normalized === pattern || normalized.endsWith(`.${pattern}`);

      if (matches && pattern.length > bestLength) {
        best = organization;
        bestLength = pattern.length;
      }
    }
  }

  return best;
}

export function createSignatureEngine(config = {}) {
  const engineConfig = {
    autoInferUnknownDomains: true,
    replaceExistingSignature: true,
    separatorHtml: '<br><br>',
    separatorText: '\n\n',
    ...config
  };

  function resolve(from, context = {}) {
    const mailbox = parseMailbox(from);
    const organization = findOrganization(engineConfig, mailbox.domain);
    const domainOverride = findDomainOverride(engineConfig.domains, mailbox.domain);
    const senderOverride = engineConfig.senders?.[mailbox.address];

    const inferred = engineConfig.autoInferUnknownDomains
      ? {
          company: inferBrandName(mailbox.domain),
          website: `https://${rootDomain(mailbox.domain)}`
        }
      : {};

    const resolved = mergeDefined(
      inferred,
      engineConfig.defaultSignature,
      organization?.signature,
      domainOverride,
      senderOverride,
      context.signature
    );

    if (resolved.includeSenderEmail !== false) {
      resolved.email = resolved.email || mailbox.address;
    }

    return {
      ...resolved,
      sender: mailbox.address,
      domain: mailbox.domain,
      organizationId: organization?.id || null
    };
  }

  function apply(message, context = {}) {
    if (!message?.from) throw new TypeError('Message.from is required.');
    if (context.skipSignature || message.skipSignature) {
      const { skipSignature, ...cleanMessage } = message;
      return cleanMessage;
    }

    const signature = resolve(message.from, context);
    const htmlSignature = renderHtmlSignature(signature);
    const textSignature = renderTextSignature(signature);

    let html = message.html;
    let text = message.text;

    if (html != null) {
      if (engineConfig.replaceExistingSignature) html = stripHtmlSignature(String(html));
      html = `${html.replace(/\s+$/, '')}${engineConfig.separatorHtml}${htmlSignature}`;
    }

    if (text != null) {
      if (engineConfig.replaceExistingSignature) text = stripTextSignature(String(text));
      text = `${text.replace(/\s+$/, '')}${engineConfig.separatorText}${textSignature}`;
    }

    if (html == null && text == null) {
      throw new TypeError('Message must contain html or text content.');
    }

    const { skipSignature, ...cleanMessage } = message;
    return { ...cleanMessage, ...(html != null ? { html } : {}), ...(text != null ? { text } : {}) };
  }

  return { resolve, apply, config: engineConfig };
}
