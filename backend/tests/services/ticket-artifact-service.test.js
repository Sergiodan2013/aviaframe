describe('ticketArtifactService baggage fallbacks', () => {
  const service = require('../../src/services/ticketArtifactService');

  test('collectBaggageHighlights falls back to offer baggage_text when structured baggage is absent', () => {
    const result = service.collectBaggageHighlights({
      raw_offer_data: {
        offer: {
          baggage_text: '1 checked bag included'
        }
      }
    }, []);

    expect(result).toEqual(['Included baggage: 1 checked bag included']);
  });

  test('collectBaggageHighlights falls back to segment baggage data when passenger allowances are absent', () => {
    const result = service.collectBaggageHighlights({
      raw_offer_data: {
        offer: {
          segments: [
            {
              origin_code: 'LGW',
              destination_code: 'MXP',
              cabin_baggage: { weight: '8kg', type: 'cabin' },
              checked_baggage: { quantity: 1, weight: '23kg', type: 'checked' }
            }
          ]
        }
      }
    }, []);

    expect(result).toEqual([
      'Segment LGW -> MXP: Cabin baggage 8kg · cabin',
      'Segment LGW -> MXP: Checked baggage 1 pc · 23kg · checked'
    ]);
  });

  test('collectBaggageHighlights explains when baggage is priced but airline returned no detailed allowance', () => {
    const result = service.collectBaggageHighlights({
      raw_offer_data: {
        pricing: {
          baggage_price: 120
        },
        offer: {}
      }
    }, []);

    expect(result).toEqual([
      'Baggage / ancillaries are included in the fare pricing, but the airline did not return detailed baggage allowance in the booking response.'
    ]);
  });

  test('collectBaggageHighlights returns explicit unknown-status fallback when no baggage data exists', () => {
    const result = service.collectBaggageHighlights({
      raw_offer_data: {
        pricing: {
          baggage_price: 0
        },
        offer: {}
      }
    }, []);

    expect(result).toEqual([
      'Baggage allowance details were not returned by the airline for this ticket. Please verify checked and cabin baggage rules with the issuing agency before travel.'
    ]);
  });

  test('collectBaggageHighlights reads structured baggage from offer_price_data raw fares', () => {
    const result = service.collectBaggageHighlights({
      raw_offer_data: {
        metadata: {
          offer_price_data: {
            raw: {
              fares: [
                {
                  passenger_type: 'ADT',
                  cabin_baggage: { weight: '8kg', type: 'cabin' },
                  checked_baggage: { quantity: 1, weight: '23kg', type: 'checked' }
                }
              ]
            }
          }
        }
      }
    }, []);

    expect(result).toEqual([
      'ADT: Cabin baggage 8kg · cabin',
      'ADT: Checked baggage 1 pc · 23kg · checked'
    ]);
  });

  test('collectBaggageHighlights returns explicit no-baggage rule when fare says with_baggage=false', () => {
    const result = service.collectBaggageHighlights({
      raw_offer_data: {
        metadata: {
          offer_price_data: {
            raw: {
              fares: [
                {
                  passenger_type: 'ADT',
                  with_baggage: false
                }
              ]
            }
          }
        }
      }
    }, []);

    expect(result).toEqual([
      'ADT: No checked baggage included'
    ]);
  });
});
