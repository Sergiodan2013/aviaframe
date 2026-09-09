'use strict';

const fs = require('fs');
const path = require('path');

describe('agencyProvision deploy assets', () => {
  const service = require('../../src/services/agencyProvision');

  test('buildAgencyDeployFiles loads required static templates', () => {
    const files = service.buildAgencyDeployFiles({
      subdomain: 'smoke-test',
      apiKey: 'ag_test_key',
      landingHtml: '<html><body><script src="/aviaframe-widget.js"></script></body></html>',
      landingCss: 'body{background:#fff;}'
    });

    expect(files['booking.html'].toLowerCase()).toContain('<!doctype html');
    expect(files['booking.html']).toContain('/display-currency.js');
    expect(files['display-currency.js']).toContain('window.AviaframeDisplayCurrency');
    expect(files['aviaframe-widget.js']).toContain('window.AVIAFRAME_RUNTIME_CONFIG');
    expect(files['assets/style.css']).toContain('body');
    expect(Buffer.isBuffer(files['images/favicon.svg']) || typeof files['images/favicon.svg'] === 'string').toBe(true);
    expect(files['legal/privacy-policy.html']).toContain('Privacy Policy');
    expect(files['legal/terms-and-conditions.html']).toContain('Terms');
    expect(files['legal/refund-and-cancellation-policy.html']).toContain('Refund');
  });

  test('bundled legal assets match aviaframe-site legal templates', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const sourceDir = path.join(repoRoot, 'aviaframe-site', 'legal');
    const bundledDir = path.join(repoRoot, 'backend', 'agency-site-assets', 'legal');
    const expectedFiles = [
      'index.html',
      'terms-and-conditions.html',
      'refund-and-cancellation-policy.html',
      'privacy-policy.html',
      'contact-information.html',
      'pricing.html',
      'legal.css',
      'legal-lang.js'
    ];

    const normalize = (contents) => contents.replace(/\r\n/g, '\n');

    for (const fileName of expectedFiles) {
      const sourcePath = path.join(sourceDir, fileName);
      const bundledPath = path.join(bundledDir, fileName);

      expect(fs.existsSync(sourcePath)).toBe(true);
      expect(fs.existsSync(bundledPath)).toBe(true);

      const sourceContents = normalize(fs.readFileSync(sourcePath, 'utf8'));
      const bundledContents = normalize(fs.readFileSync(bundledPath, 'utf8'));
      expect(bundledContents).toBe(sourceContents);
    }
  });

  test('booking order correlation ID is shared by the click and error handlers', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const bookingTemplates = [
      path.join(repoRoot, 'aviaframe-site', 'booking.html'),
      path.join(repoRoot, 'backend', 'agency-site-assets', 'booking.html'),
      path.join(repoRoot, 'backend', 'src', 'agency-site-assets', 'booking.html')
    ];

    for (const templatePath of bookingTemplates) {
      const template = fs.readFileSync(templatePath, 'utf8');

      expect(template).toContain('_orderCorrelationId = null');
      expect(template).toContain('_orderCorrelationId = createCorrelationId()');
      expect(template).toContain("'X-Correlation-Id': _orderCorrelationId || createCorrelationId()");
      expect(template).toContain('renderTemporaryConnectionError(_orderCorrelationId || createCorrelationId())');
      expect(template).not.toContain('const orderCorrelationId');
    }
  });

  test('uses demo payments by default and keeps an explicitly live tenant live', () => {
    const demoFiles = service.buildAgencyDeployFiles({
      subdomain: 'new-agency',
      apiKey: 'ag_demo',
      landingHtml: '<html><body></body></html>',
      landingCss: '',
      paymentMode: 'demo'
    });
    const liveFiles = service.buildAgencyDeployFiles({
      subdomain: 'almalektravel',
      apiKey: 'ag_live',
      landingHtml: '<html><body></body></html>',
      landingCss: '',
      paymentMode: 'live'
    });

    expect(demoFiles['config.js']).toContain('"defaultDryRunIssue": true');
    expect(demoFiles['config.js']).toContain('"showTestPaymentCards": true');
    expect(liveFiles['config.js']).toContain('"defaultDryRunIssue": false');
    expect(liveFiles['config.js']).toContain('"showTestPaymentCards": false');
  });

  test('passes the agency brand into public widget tokens', () => {
    const generated = service.generateAgencySiteFiles({
      agencyName: 'Theme Test',
      subdomain: 'theme-test',
      apiKey: 'ag_theme',
      brandColor: '#123456',
      accentColor: '#654321'
    });

    expect(generated.html).toContain('--af-primary:#654321');
    expect(generated.html).toContain('--af-primary-hover:#000729');
  });
});
