// Mock flight data for testing UI (NEW FLAT FORMAT)
export const mockFlightData = {
  search_id: "mock-search-123",
  offers: [
    {
      offer_id: "LH_001",
      price: {
        total: 8384,
        currency: "UAH"
      },
      airline_code: "LH",
      airline_name: "Lufthansa",
      departure_time: "06:25",
      arrival_time: "11:10",
      origin: "CDG",
      destination: "FRA"
    },
    {
      offer_id: "OS_002",
      price: {
        total: 7250,
        currency: "UAH"
      },
      airline_code: "OS",
      airline_name: "Austrian Airlines",
      departure_time: "14:15",
      arrival_time: "18:50",
      origin: "CDG",
      destination: "VIE"
    },
    {
      offer_id: "AF_003",
      price: {
        total: 6890,
        currency: "UAH"
      },
      airline_code: "AF",
      airline_name: "Air France",
      departure_time: "08:00",
      arrival_time: "09:35",
      origin: "CDG",
      destination: "LHR"
    },
    {
      offer_id: "BA_004",
      price: {
        total: 9120,
        currency: "UAH"
      },
      airline_code: "BA",
      airline_name: "British Airways",
      departure_time: "12:30",
      arrival_time: "13:05",
      origin: "CDG",
      destination: "LHR"
    }
  ],
  metadata: {
    total_offers: 4,
    timestamp: new Date().toISOString(),
    api_version: "2.0"
  }
};
