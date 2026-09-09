'use strict';

const ECB_XML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <Cube>
    <Cube time="2026-08-14">
      <Cube currency="USD" rate="1.1712"/>
      <Cube currency="GBP" rate="0.8625"/>
      <Cube currency="UAH" rate="48.2350"/>
    </Cube>
  </Cube>
</gesmes:Envelope>`;

describe('displayFxService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch = originalFetch;
    delete process.env.DISPLAY_FX_SAR_PER_UNIT_JSON;
    delete process.env.DISPLAY_FX_UPDATED_AT;
    delete process.env.DISPLAY_FX_REFRESH_MS;
  });

  test('parses ECB XML and builds a snapshot for display and fare source currencies', () => {
    const service = require('../../src/services/displayFxService');
    const snapshot = service.buildSnapshotFromEcbXml(ECB_XML_SAMPLE);

    expect(snapshot.base_currency).toBe('SAR');
    expect(snapshot.source).toBe('ecb_reference_rates');
    expect(snapshot.provider).toBe('ECB');
    expect(snapshot.provider_updated_at).toBe('2026-08-14T16:00:00Z');
    expect(snapshot.supported_currencies).toEqual(['EUR', 'GBP', 'SAR', 'UAH', 'USD']);
    expect(snapshot.rates.SAR.sar_per_unit).toBe(1);
    expect(snapshot.rates.USD.sar_per_unit).toBe(3.75);
    expect(snapshot.rates.EUR.sar_per_unit).toBeCloseTo(4.392, 6);
    expect(snapshot.rates.UAH.sar_per_unit).toBeCloseTo(0.091, 3);
  });

  test('fetches ECB rates and caches the snapshot', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => ECB_XML_SAMPLE,
    });

    const service = require('../../src/services/displayFxService');
    service.__resetDisplayFxCache();

    const first = await service.getDisplayFxSnapshot({ forceRefresh: true });
    const second = await service.getDisplayFxSnapshot();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(first.source).toBe('ecb_reference_rates');
    expect(second.rates.USD.sar_per_unit).toBe(3.75);
  });

  test('keeps a UAH reference rate when ECB does not publish UAH', () => {
    const service = require('../../src/services/displayFxService');
    const xmlWithoutUah = ECB_XML_SAMPLE.replace('      <Cube currency="UAH" rate="48.2350"/>\n', '');
    const snapshot = service.buildSnapshotFromEcbXml(xmlWithoutUah);

    expect(snapshot.rates.UAH.sar_per_unit).toBe(0.09);
  });

  test('falls back to static reference rates when ECB fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ecb unavailable'));

    const service = require('../../src/services/displayFxService');
    service.__resetDisplayFxCache();

    const snapshot = await service.getDisplayFxSnapshot({ forceRefresh: true });
    const converted = service.convertDisplayAmount(433, 'SAR', 'EUR', snapshot);

    expect(snapshot.source).toBe('static_reference');
    expect(snapshot.provider).toBe('fallback');
    expect(snapshot.rates.USD.sar_per_unit).toBe(3.75);
    expect(snapshot.rates.EUR.sar_per_unit).toBe(4.33);
    expect(converted).toBeCloseTo(100, 5);
  });

  test('uses env override table when provided', async () => {
    process.env.DISPLAY_FX_SAR_PER_UNIT_JSON = JSON.stringify({
      SAR: 1,
      USD: 3.75,
      EUR: 4.5,
    });
    process.env.DISPLAY_FX_UPDATED_AT = '2026-08-14T09:00:00.000Z';
    global.fetch = jest.fn();

    const service = require('../../src/services/displayFxService');
    service.__resetDisplayFxCache();

    const snapshot = await service.getDisplayFxSnapshot({ forceRefresh: true });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(snapshot.source).toBe('env_override');
    expect(snapshot.provider).toBe('env');
    expect(snapshot.updated_at).toBe('2026-08-14T09:00:00.000Z');
    expect(snapshot.rates.EUR.sar_per_unit).toBe(4.5);
  });
});
