'use strict';

const crypto = require('crypto');

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function signWidgetPayload(payloadBase64, secret) {
  return crypto
    .createHmac('sha256', String(secret))
    .update(payloadBase64)
    .digest('base64url');
}

function issueWidgetToken(payloadObj, secret) {
  const payload = toBase64Url(JSON.stringify(payloadObj));
  const signature = signWidgetPayload(payload, secret);
  return `${payload}.${signature}`;
}

function parseWidgetToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { error: 'INVALID_WIDGET_TOKEN' };
  }
  const [payloadPart, signaturePart] = token.split('.');
  const expected = signWidgetPayload(payloadPart, secret);
  if (signaturePart !== expected) {
    return { error: 'INVALID_WIDGET_SIGNATURE' };
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload?.exp || payload.exp < nowSec) {
      return { error: 'WIDGET_TOKEN_EXPIRED' };
    }
    return { payload };
  } catch {
    return { error: 'INVALID_WIDGET_TOKEN_PAYLOAD' };
  }
}

module.exports = {
  toBase64Url,
  signWidgetPayload,
  issueWidgetToken,
  parseWidgetToken,
};
