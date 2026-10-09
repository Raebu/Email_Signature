const UK_SECOND_LEVEL_SUFFIXES = new Set([
  'ac.uk',
  'co.uk',
  'gov.uk',
  'ltd.uk',
  'me.uk',
  'net.uk',
  'nhs.uk',
  'org.uk',
  'plc.uk',
  'police.uk',
  'sch.uk'
]);

export function normalizeDomain(domain = '') {
  return String(domain).trim().toLowerCase().replace(/^@+/, '').replace(/\.$/, '');
}

export function parseMailbox(from) {
  if (!from) throw new TypeError('A from address is required.');

  const raw = typeof from === 'string' ? from : from.email;
  if (!raw) throw new TypeError('The from value must contain an email address.');

  const match = String(raw).match(/<([^<>\s]+@[^<>\s]+)>\s*$/);
  const address = (match?.[1] || String(raw)).trim().toLowerCase();
  const at = address.lastIndexOf('@');
  if (at <= 0 || at === address.length - 1) {
    throw new TypeError(`Invalid from email address: ${raw}`);
  }

  return {
    address,
    localPart: address.slice(0, at),
    domain: normalizeDomain(address.slice(at + 1))
  };
}

export function rootDomain(hostname) {
  const domain = normalizeDomain(hostname);
  const labels = domain.split('.').filter(Boolean);
  if (labels.length <= 2) return domain;

  const lastTwo = labels.slice(-2).join('.');
  if (UK_SECOND_LEVEL_SUFFIXES.has(lastTwo) && labels.length >= 3) {
    return labels.slice(-3).join('.');
  }

  return lastTwo;
}

export function inferBrandName(domain) {
  const normalized = normalizeDomain(domain);
  const root = rootDomain(normalized);
  const labels = root.split('.');
  const base = labels.length > 1 ? labels[0] : normalized.split('.')[0];

  return base
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function mergeDefined(...objects) {
  const output = {};
  for (const object of objects) {
    if (!object) continue;
    for (const [key, value] of Object.entries(object)) {
      if (value !== undefined) output[key] = value;
    }
  }
  return output;
}

export function wildcardMatches(domain, pattern) {
  const normalizedDomain = normalizeDomain(domain);
  const normalizedPattern = normalizeDomain(pattern);

  if (!normalizedPattern.startsWith('*.')) return normalizedDomain === normalizedPattern;
  const suffix = normalizedPattern.slice(2);
  return normalizedDomain.endsWith(`.${suffix}`) && normalizedDomain !== suffix;
}
