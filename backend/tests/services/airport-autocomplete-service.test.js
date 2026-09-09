describe('airportAutocompleteService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  function loadService() {
    jest.doMock('../../src/config', () => ({
      config: {
        airportAutocompleteUrl: 'https://autocomplete.travelpayouts.com/places2',
        airportAutocompleteTimeoutMs: 1000,
      }
    }));
    jest.doMock('../../src/lib/logger', () => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    }));
    return require('../../src/services/airportAutocompleteService');
  }

  test('normalizePlaces emits city-only provider result as a single airport item', () => {
    const { normalizePlaces } = loadService();

    const groups = normalizePlaces([
      {
        type: 'city',
        code: 'LIS',
        name: 'Lisbon',
        city_code: 'LIS',
        city_name: 'Lisbon',
        country_code: 'PT',
        country_name: 'Portugal',
      }
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].country_code).toBe('PT');
    expect(groups[0].items).toEqual([
      expect.objectContaining({
        type: 'airport',
        code: 'LIS',
        city_code: 'LIS',
        city_name: 'Lisbon',
        country_code: 'PT',
        country_name: 'Portugal',
      })
    ]);
  });

  test('normalizePlaces preserves upstream ranking for vie-like responses', () => {
    const { normalizePlaces } = loadService();

    const groups = normalizePlaces([
      {
        type: 'city',
        code: 'VIE',
        name: 'Vienna',
        city_code: 'VIE',
        city_name: 'Vienna',
        country_code: 'AT',
        country_name: 'Austria',
      },
      {
        type: 'city',
        code: 'NHA',
        name: 'Nha Trang',
        city_code: 'NHA',
        city_name: 'Nha Trang',
        country_code: 'VN',
        country_name: 'Vietnam',
      }
    ]);

    expect(groups.map((group) => group.country_name)).toEqual(['Austria', 'Vietnam']);
    expect(groups[0].items[0]).toMatchObject({
      code: 'VIE',
      city_name: 'Vienna',
    });
  });

  test('does not cache empty autocomplete results', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ([]) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            type: 'city',
            code: 'RUH',
            name: 'Riyadh',
            city_code: 'RUH',
            city_name: 'Riyadh',
            country_code: 'SA',
            country_name: 'Saudi Arabia',
          }
        ])
      });
    global.fetch = fetchMock;

    const { getAirportAutocomplete } = loadService();

    const first = await getAirportAutocomplete({ query: 'riyadh', locale: 'en', limit: 12 });
    const second = await getAirportAutocomplete({ query: 'riyadh', locale: 'en', limit: 12 });

    expect(first.groups).toEqual([]);
    expect(second.groups[0].items[0]).toMatchObject({
      code: 'RUH',
      city_name: 'Riyadh',
    });
    expect(second.cached).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('resolveAirportDisplayName expands airport code to city + airport label', () => {
    const { resolveAirportDisplayName } = loadService();

    expect(resolveAirportDisplayName('Heathrow', 'LHR')).toBe('London Heathrow (LHR)');
    expect(resolveAirportDisplayName('', 'JFK')).toBe('New York John F. Kennedy (JFK)');
  });
});
