import { escapeHtml } from './utils.js';

export const HTML_SIGNATURE_START = '<!-- email-signature:start -->';
export const HTML_SIGNATURE_END = '<!-- email-signature:end -->';
export const TEXT_SIGNATURE_START = '-- email-signature:start --';
export const TEXT_SIGNATURE_END = '-- email-signature:end --';

function compact(values) {
  return values.filter(value => value !== undefined && value !== null && String(value).trim() !== '');
}

function safeUrl(url) {
  if (!url) return null;
  const value = String(url).trim();
  if (!/^https?:\/\//i.test(value) && !/^mailto:/i.test(value) && !/^tel:/i.test(value)) return null;
  return value;
}

export function renderHtmlSignature(signature) {
  const name = escapeHtml(signature.name || '');
  const title = escapeHtml(signature.title || '');
  const company = escapeHtml(signature.company || '');
  const email = escapeHtml(signature.email || '');
  const phone = escapeHtml(signature.phone || '');
  const website = safeUrl(signature.website);
  const logoUrl = safeUrl(signature.logoUrl);
  const accent = /^#[0-9a-f]{3,8}$/i.test(signature.accentColor || '') ? signature.accentColor : '#111827';

  const identityLine = compact([title, company]).join(' · ');
  const contact = [];
  if (email) contact.push(`<a href="mailto:${email}" style="color:${accent};text-decoration:none">${email}</a>`);
  if (phone) contact.push(`<a href="tel:${escapeHtml(String(signature.phone).replace(/\s+/g, ''))}" style="color:${accent};text-decoration:none">${phone}</a>`);
  if (website) contact.push(`<a href="${escapeHtml(website)}" style="color:${accent};text-decoration:none">${escapeHtml(signature.websiteLabel || website.replace(/^https?:\/\//i, '').replace(/\/$/, ''))}</a>`);

  const social = Object.entries(signature.socialLinks || {})
    .map(([label, url]) => [label, safeUrl(url)])
    .filter(([, url]) => Boolean(url))
    .map(([label, url]) => `<a href="${escapeHtml(url)}" style="color:${accent};text-decoration:none">${escapeHtml(label)}</a>`)
    .join(' · ');

  const legalLines = (signature.legalLines || [])
    .filter(Boolean)
    .map(line => `<div style="margin-top:2px">${escapeHtml(line)}</div>`)
    .join('');

  const logo = logoUrl
    ? `<td style="padding:0 14px 0 0;vertical-align:top"><img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(signature.logoAlt || company || 'Logo')}" width="${Number(signature.logoWidth) || 96}" style="display:block;border:0;max-width:120px;height:auto"></td>`
    : '';

  return `${HTML_SIGNATURE_START}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45;color:#374151;margin-top:18px">
  <tr>
    ${logo}
    <td style="vertical-align:top;border-left:${logo ? `2px solid ${accent}` : '0'};padding-left:${logo ? '14px' : '0'}">
      ${name ? `<div style="font-size:15px;font-weight:700;color:#111827">${name}</div>` : ''}
      ${identityLine ? `<div style="margin-top:1px">${identityLine}</div>` : ''}
      ${contact.length ? `<div style="margin-top:7px">${contact.join(' · ')}</div>` : ''}
      ${social ? `<div style="margin-top:4px">${social}</div>` : ''}
      ${signature.address ? `<div style="margin-top:5px">${escapeHtml(signature.address)}</div>` : ''}
      ${legalLines ? `<div style="font-size:10px;line-height:1.35;color:#6b7280;margin-top:8px;max-width:620px">${legalLines}</div>` : ''}
    </td>
  </tr>
</table>
${HTML_SIGNATURE_END}`;
}

export function renderTextSignature(signature) {
  const lines = [];
  if (signature.name) lines.push(signature.name);
  if (signature.title || signature.company) lines.push(compact([signature.title, signature.company]).join(' | '));

  const contacts = compact([
    signature.email,
    signature.phone,
    signature.website
  ]);
  if (contacts.length) lines.push(contacts.join(' | '));
  if (signature.address) lines.push(signature.address);

  const social = Object.entries(signature.socialLinks || {})
    .filter(([, url]) => Boolean(url))
    .map(([label, url]) => `${label}: ${url}`);
  if (social.length) lines.push(social.join(' | '));

  if (signature.legalLines?.length) {
    lines.push('', ...signature.legalLines.filter(Boolean));
  }

  return `${TEXT_SIGNATURE_START}\n${lines.join('\n')}\n${TEXT_SIGNATURE_END}`;
}

export function stripHtmlSignature(html = '') {
  const start = html.indexOf(HTML_SIGNATURE_START);
  if (start === -1) return html;
  const end = html.indexOf(HTML_SIGNATURE_END, start);
  return end === -1 ? html.slice(0, start) : html.slice(0, start) + html.slice(end + HTML_SIGNATURE_END.length);
}

export function stripTextSignature(text = '') {
  const start = text.indexOf(TEXT_SIGNATURE_START);
  if (start === -1) return text;
  const end = text.indexOf(TEXT_SIGNATURE_END, start);
  return end === -1 ? text.slice(0, start) : text.slice(0, start) + text.slice(end + TEXT_SIGNATURE_END.length);
}
