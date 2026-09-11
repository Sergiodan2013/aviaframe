'use strict';

// A09: agency-controlled content (name, about text, hero copy, contact
// details, destinations, reviews, airlines, social links, colors, logo/hero
// image URLs, language) is baked directly into the static HTML file served
// to every visitor of that agency's site by generateAgencySiteFiles(). Any
// of these fields could previously carry `<script>`, break out of a
// `<style>` block, or set a `javascript:` URL and have it execute for every
// visitor — a stored XSS scoped to that agency's site. These tests assert
// the generator now neutralizes every one of those vectors.

const { generateAgencySiteFiles } = require('../../src/services/agencyProvision');

const SCRIPT_MARKER = '<script>alert(1)</script>';

function generate(overrides) {
  return generateAgencySiteFiles({
    agencyName: 'Acme Travel',
    subdomain: 'acme',
    apiKey: 'ag_test_key',
    ...overrides
  }).html;
}

describe('agency site generator neutralizes stored XSS (A09)', () => {
  test('script markers in plain text fields never appear as executable HTML', () => {
    const html = generate({
      agencyName: SCRIPT_MARKER,
      agencyNameAr: SCRIPT_MARKER,
      contactPhone: SCRIPT_MARKER,
      contactPhone2: SCRIPT_MARKER,
      address: SCRIPT_MARKER,
      workingHours: SCRIPT_MARKER,
      workingHoursAr: SCRIPT_MARKER,
      supervisorName: SCRIPT_MARKER,
      aboutEn: SCRIPT_MARKER,
      aboutAr: SCRIPT_MARKER,
      heroTagline: SCRIPT_MARKER,
      heroDescription: SCRIPT_MARKER,
      licenseNumber: SCRIPT_MARKER,
      iataNumber: SCRIPT_MARKER,
      foundedYear: SCRIPT_MARKER
    });

    expect(html).not.toContain(SCRIPT_MARKER);
    // The escaped form must still be present — this is redaction of danger,
    // not silent deletion of the agency's content.
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('email fields cannot break out of their mailto href attribute', () => {
    const html = generate({
      contactEmail: 'a"><script>alert(2)</script>@evil.com',
      supervisorName: 'Sup',
      supervisorEmail: 'b"><script>alert(3)</script>@evil.com'
    });

    expect(html).not.toContain('<script>alert(2)</script>');
    expect(html).not.toContain('<script>alert(3)</script>');
    expect(html).not.toMatch(/href="mailto:[^"]*"><script>/);
  });

  test('logoUrl and heroImageUrl reject non-http(s) schemes outright', () => {
    const html = generate({
      logoUrl: 'javascript:alert(4)',
      heroImageUrl: 'javascript:alert(5)'
    });

    expect(html).not.toMatch(/src="javascript:/);
    expect(html).not.toMatch(/url\('javascript:/);
    // Falls back to the text-initial logo, not a broken <img>.
    expect(html).toContain('av-logo-icon-text');
  });

  test('heroImageUrl cannot close the <style> attribute or the CSS url() token', () => {
    const breakout = "https://x.com/y.jpg');}</style><script>alert(6)</script><style>{a:'";
    const html = generate({ heroImageUrl: breakout });

    expect(html).not.toMatch(/<\/style>\s*<script>/);
    expect(html).not.toContain('<script>alert(6)</script>');
  });

  test('brandColor/accentColor/headerBg/footerBg cannot close the <style> block', () => {
    const breakout = "#fff</style><script>alert(7)</script><style>";
    const html = generate({
      brandColor: breakout,
      accentColor: breakout,
      headerBg: breakout,
      footerBg: breakout
    });

    expect(html).not.toMatch(/<\/style>\s*<script>/);
    expect(html).not.toContain('<script>alert(7)</script>');
    // Invalid colors fall back to the documented defaults rather than
    // silently dropping all theming.
    expect(html).toContain('--av-brand: #1a3c8e;');
  });

  test('valid hex colors pass through unchanged (no regression)', () => {
    const html = generate({ brandColor: '#123456', accentColor: '#654321' });
    expect(html).toContain('--av-brand: #123456;');
    expect(html).toContain('--av-accent: #654321;');
  });

  test('language collapses to a closed en/ar enum, closing the inline-script breakout', () => {
    const breakout = "'; alert(8); '";
    const html = generate({ language: breakout });

    expect(html).not.toContain('alert(8)');
    expect(html).toContain(`localStorage.getItem('aviaframe_lang') || 'en'`);
    expect(html).toContain('<html lang="en">');
  });

  test('language=ar is preserved (no regression)', () => {
    const html = generate({ language: 'ar' });
    expect(html).toContain('<html lang="ar">');
    expect(html).toContain(`localStorage.getItem('aviaframe_lang') || 'ar'`);
  });

  test('social links cannot break out of their href attribute', () => {
    const html = generate({
      instagram: 'evil.com/x"><script>alert(9)</script>',
      twitter: 'javascript:alert(10)'
    });

    expect(html).not.toContain('<script>alert(9)</script>');
    expect(html).not.toMatch(/href="javascript:/);
  });

  test('destinations (city/country/landmark/price/photo) are escaped', () => {
    const html = generate({
      destinations: [{
        city: SCRIPT_MARKER,
        country: SCRIPT_MARKER,
        landmark: SCRIPT_MARKER,
        price: SCRIPT_MARKER,
        image_url: "https://x.com/y.jpg');}</style><script>alert(11)</script>"
      }]
    });

    expect(html).not.toContain(SCRIPT_MARKER);
    expect(html).not.toContain('<script>alert(11)</script>');
    expect(html).not.toMatch(/<\/style>\s*<script>/);
  });

  test('reviews (name/location/text) are fully escaped, not just quotes', () => {
    const html = generate({
      reviews: [{ name: SCRIPT_MARKER, location: SCRIPT_MARKER, text: SCRIPT_MARKER, rating: 5 }]
    });

    expect(html).not.toContain(SCRIPT_MARKER);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('featured airline names are escaped', () => {
    const html = generate({ featuredAirlines: [SCRIPT_MARKER] });
    expect(html).not.toContain(SCRIPT_MARKER);
  });

  test('googleMapsUrl still requires a google.com/maps URL and is escaped', () => {
    const html = generate({ googleMapsUrl: 'https://google.com/maps"><script>alert(12)</script>' });
    expect(html).not.toContain('<script>alert(12)</script>');

    const rejected = generate({ googleMapsUrl: 'https://evil.com/maps' });
    expect(rejected).not.toContain('av-maps-embed');
  });
});
