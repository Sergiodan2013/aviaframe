// Popular airports database with IATA codes
// Supports search in English and Russian
// Priority: 1 = capital, 2 = major city, 3 = other
export const airports = [
  // Russia
  { code: 'MOW', city: 'Moscow', cityRu: 'Москва', country: 'Russia', countryRu: 'Россия', name: 'All Airports', priority: 1 },
  { code: 'DME', city: 'Moscow', cityRu: 'Москва', country: 'Russia', countryRu: 'Россия', name: 'Domodedovo', priority: 1 },
  { code: 'SVO', city: 'Moscow', cityRu: 'Москва', country: 'Russia', countryRu: 'Россия', name: 'Sheremetyevo', priority: 1 },
  { code: 'VKO', city: 'Moscow', cityRu: 'Москва', country: 'Russia', countryRu: 'Россия', name: 'Vnukovo', priority: 1 },
  { code: 'LED', city: 'St. Petersburg', cityRu: 'Санкт-Петербург', country: 'Russia', countryRu: 'Россия', name: 'Pulkovo', priority: 2 },
  { code: 'KZN', city: 'Kazan', cityRu: 'Казань', country: 'Russia', countryRu: 'Россия', name: 'Kazan International', priority: 2 },
  { code: 'SVX', city: 'Yekaterinburg', cityRu: 'Екатеринбург', country: 'Russia', countryRu: 'Россия', name: 'Koltsovo', priority: 2 },
  { code: 'KRR', city: 'Krasnodar', cityRu: 'Краснодар', country: 'Russia', countryRu: 'Россия', name: 'Pashkovsky', priority: 2 },
  { code: 'ROV', city: 'Rostov-on-Don', cityRu: 'Ростов-на-Дону', country: 'Russia', countryRu: 'Россия', name: 'Platov', priority: 2 },
  { code: 'AER', city: 'Sochi', cityRu: 'Сочи', country: 'Russia', countryRu: 'Россия', name: 'Adler-Sochi', priority: 2 },
  { code: 'OVB', city: 'Novosibirsk', cityRu: 'Новосибирск', country: 'Russia', countryRu: 'Россия', name: 'Tolmachevo', priority: 2 },
  { code: 'VOZ', city: 'Voronezh', cityRu: 'Воронеж', country: 'Russia', countryRu: 'Россия', name: 'Chertovitskoye', priority: 3 },
  { code: 'UFA', city: 'Ufa', cityRu: 'Уфа', country: 'Russia', countryRu: 'Россия', name: 'Ufa International', priority: 3 },
  { code: 'VVO', city: 'Vladivostok', cityRu: 'Владивосток', country: 'Russia', countryRu: 'Россия', name: 'Knevichi', priority: 3 },

  // United Kingdom
  { code: 'LHR', city: 'London', cityRu: 'Лондон', country: 'United Kingdom', countryRu: 'Великобритания', name: 'Heathrow', priority: 1 },
  { code: 'LGW', city: 'London', cityRu: 'Лондон', country: 'United Kingdom', countryRu: 'Великобритания', name: 'Gatwick', priority: 1 },
  { code: 'STN', city: 'London', cityRu: 'Лондон', country: 'United Kingdom', countryRu: 'Великобритания', name: 'Stansted', priority: 1 },
  { code: 'LTN', city: 'London', cityRu: 'Лондон', country: 'United Kingdom', countryRu: 'Великобритания', name: 'Luton', priority: 1 },
  { code: 'MAN', city: 'Manchester', cityRu: 'Манчестер', country: 'United Kingdom', countryRu: 'Великобритания', name: 'Manchester', priority: 2 },
  { code: 'EDI', city: 'Edinburgh', cityRu: 'Эдинбург', country: 'United Kingdom', countryRu: 'Великобритания', name: 'Edinburgh', priority: 2 },
  { code: 'BHX', city: 'Birmingham', cityRu: 'Бирмингем', country: 'United Kingdom', countryRu: 'Великобритания', name: 'Birmingham', priority: 2 },

  // France
  { code: 'CDG', city: 'Paris', cityRu: 'Париж', country: 'France', countryRu: 'Франция', name: 'Charles de Gaulle', priority: 1 },
  { code: 'ORY', city: 'Paris', cityRu: 'Париж', country: 'France', countryRu: 'Франция', name: 'Orly', priority: 1 },
  { code: 'NCE', city: 'Nice', cityRu: 'Ницца', country: 'France', countryRu: 'Франция', name: 'Côte d\'Azur', priority: 2 },
  { code: 'LYS', city: 'Lyon', cityRu: 'Лион', country: 'France', countryRu: 'Франция', name: 'Saint-Exupéry', priority: 2 },
  { code: 'MRS', city: 'Marseille', cityRu: 'Марсель', country: 'France', countryRu: 'Франция', name: 'Provence', priority: 2 },

  // Germany
  { code: 'TXL', city: 'Berlin', cityRu: 'Берлин', country: 'Germany', countryRu: 'Германия', name: 'Brandenburg', priority: 1 },
  { code: 'FRA', city: 'Frankfurt', cityRu: 'Франкфурт', country: 'Germany', countryRu: 'Германия', name: 'Frankfurt am Main', priority: 2 },
  { code: 'MUC', city: 'Munich', cityRu: 'Мюнхен', country: 'Germany', countryRu: 'Германия', name: 'Franz Josef Strauss', priority: 2 },
  { code: 'DUS', city: 'Düsseldorf', cityRu: 'Дюссельдорф', country: 'Germany', countryRu: 'Германия', name: 'Düsseldorf', priority: 2 },
  { code: 'HAM', city: 'Hamburg', cityRu: 'Гамбург', country: 'Germany', countryRu: 'Германия', name: 'Hamburg', priority: 2 },

  // Spain
  { code: 'MAD', city: 'Madrid', cityRu: 'Мадрид', country: 'Spain', countryRu: 'Испания', name: 'Barajas', priority: 1 },
  { code: 'BCN', city: 'Barcelona', cityRu: 'Барселона', country: 'Spain', countryRu: 'Испания', name: 'El Prat', priority: 2 },
  { code: 'AGP', city: 'Málaga', cityRu: 'Малага', country: 'Spain', countryRu: 'Испания', name: 'Costa del Sol', priority: 2 },
  { code: 'PMI', city: 'Palma de Mallorca', cityRu: 'Пальма-де-Майорка', country: 'Spain', countryRu: 'Испания', name: 'Son Sant Joan', priority: 2 },
  { code: 'VLC', city: 'Valencia', cityRu: 'Валенсия', country: 'Spain', countryRu: 'Испания', name: 'Valencia', priority: 2 },
  { code: 'ALC', city: 'Alicante', cityRu: 'Аликанте', country: 'Spain', countryRu: 'Испания', name: 'Alicante-Elche', priority: 3 },
  { code: 'SVQ', city: 'Seville', cityRu: 'Севилья', country: 'Spain', countryRu: 'Испания', name: 'San Pablo', priority: 3 },

  // Italy
  { code: 'FCO', city: 'Rome', cityRu: 'Рим', country: 'Italy', countryRu: 'Италия', name: 'Fiumicino', priority: 1 },
  { code: 'MXP', city: 'Milan', cityRu: 'Милан', country: 'Italy', countryRu: 'Италия', name: 'Malpensa', priority: 2 },
  { code: 'LIN', city: 'Milan', cityRu: 'Милан', country: 'Italy', countryRu: 'Италия', name: 'Linate', priority: 2 },
  { code: 'VCE', city: 'Venice', cityRu: 'Венеция', country: 'Italy', countryRu: 'Италия', name: 'Marco Polo', priority: 2 },
  { code: 'NAP', city: 'Naples', cityRu: 'Неаполь', country: 'Italy', countryRu: 'Италия', name: 'Naples International', priority: 3 },

  // Netherlands
  { code: 'AMS', city: 'Amsterdam', cityRu: 'Амстердам', country: 'Netherlands', countryRu: 'Нидерланды', name: 'Schiphol', priority: 1 },

  // Belgium
  { code: 'BRU', city: 'Brussels', cityRu: 'Брюссель', country: 'Belgium', countryRu: 'Бельгия', name: 'Brussels Airport', priority: 1 },
  { code: 'CRL', city: 'Charleroi', cityRu: 'Шарлеруа', country: 'Belgium', countryRu: 'Бельгия', name: 'Brussels South', priority: 2 },

  // Austria
  { code: 'VIE', city: 'Vienna', cityRu: 'Вена', country: 'Austria', countryRu: 'Австрия', name: 'Schwechat', priority: 1 },

  // Switzerland
  { code: 'ZRH', city: 'Zurich', cityRu: 'Цюрих', country: 'Switzerland', countryRu: 'Швейцария', name: 'Zurich Airport', priority: 1 },
  { code: 'GVA', city: 'Geneva', cityRu: 'Женева', country: 'Switzerland', countryRu: 'Швейцария', name: 'Geneva', priority: 2 },

  // Denmark
  { code: 'CPH', city: 'Copenhagen', cityRu: 'Копенгаген', country: 'Denmark', countryRu: 'Дания', name: 'Kastrup', priority: 1 },

  // Sweden
  { code: 'ARN', city: 'Stockholm', cityRu: 'Стокгольм', country: 'Sweden', countryRu: 'Швеция', name: 'Arlanda', priority: 1 },
  { code: 'GOT', city: 'Gothenburg', cityRu: 'Гётеборг', country: 'Sweden', countryRu: 'Швеция', name: 'Landvetter', priority: 2 },

  // Norway
  { code: 'OSL', city: 'Oslo', cityRu: 'Осло', country: 'Norway', countryRu: 'Норвегия', name: 'Gardermoen', priority: 1 },

  // Finland
  { code: 'HEL', city: 'Helsinki', cityRu: 'Хельсинки', country: 'Finland', countryRu: 'Финляндия', name: 'Vantaa', priority: 1 },

  // Turkey
  { code: 'IST', city: 'Istanbul', cityRu: 'Стамбул', country: 'Turkey', countryRu: 'Турция', name: 'Istanbul Airport', priority: 1 },
  { code: 'SAW', city: 'Istanbul', cityRu: 'Стамбул', country: 'Turkey', countryRu: 'Турция', name: 'Sabiha Gökçen', priority: 1 },
  { code: 'ESB', city: 'Ankara', cityRu: 'Анкара', country: 'Turkey', countryRu: 'Турция', name: 'Esenboğa', priority: 2 },
  { code: 'AYT', city: 'Antalya', cityRu: 'Анталья', country: 'Turkey', countryRu: 'Турция', name: 'Antalya', priority: 2 },

  // Czech Republic
  { code: 'PRG', city: 'Prague', cityRu: 'Прага', country: 'Czech Republic', countryRu: 'Чехия', name: 'Václav Havel', priority: 1 },

  // Poland
  { code: 'WAW', city: 'Warsaw', cityRu: 'Варшава', country: 'Poland', countryRu: 'Польша', name: 'Chopin', priority: 1 },
  { code: 'KRK', city: 'Kraków', cityRu: 'Краков', country: 'Poland', countryRu: 'Польша', name: 'John Paul II', priority: 2 },

  // Hungary
  { code: 'BUD', city: 'Budapest', cityRu: 'Будапешт', country: 'Hungary', countryRu: 'Венгрия', name: 'Ferenc Liszt', priority: 1 },

  // Ukraine
  { code: 'KBP', city: 'Kyiv', cityRu: 'Киев', country: 'Ukraine', countryRu: 'Украина', name: 'Boryspil', priority: 1 },
  { code: 'IEV', city: 'Kyiv', cityRu: 'Киев', country: 'Ukraine', countryRu: 'Украина', name: 'Zhuliany', priority: 1 },
  { code: 'ODS', city: 'Odessa', cityRu: 'Одесса', country: 'Ukraine', countryRu: 'Украина', name: 'Odessa International', priority: 2 },
  { code: 'LWO', city: 'Lviv', cityRu: 'Львов', country: 'Ukraine', countryRu: 'Украина', name: 'Lviv International', priority: 2 },

  // Greece
  { code: 'ATH', city: 'Athens', cityRu: 'Афины', country: 'Greece', countryRu: 'Греция', name: 'Eleftherios Venizelos', priority: 1 },
  { code: 'SKG', city: 'Thessaloniki', cityRu: 'Салоники', country: 'Greece', countryRu: 'Греция', name: 'Macedonia', priority: 2 },
  { code: 'HER', city: 'Heraklion', cityRu: 'Ираклион', country: 'Greece', countryRu: 'Греция', name: 'Nikos Kazantzakis', priority: 3 },

  // Portugal
  { code: 'LIS', city: 'Lisbon', cityRu: 'Лиссабон', country: 'Portugal', countryRu: 'Португалия', name: 'Portela', priority: 1 },
  { code: 'OPO', city: 'Porto', cityRu: 'Порту', country: 'Portugal', countryRu: 'Португалия', name: 'Francisco Sá Carneiro', priority: 2 },

  // Ireland
  { code: 'DUB', city: 'Dublin', cityRu: 'Дублин', country: 'Ireland', countryRu: 'Ирландия', name: 'Dublin', priority: 1 },

  // Middle East
  { code: 'DXB', city: 'Dubai', cityRu: 'Дубай', country: 'UAE', countryRu: 'ОАЭ', name: 'Dubai International', priority: 1 },
  { code: 'DWC', city: 'Dubai', cityRu: 'Дубай', country: 'UAE', countryRu: 'ОАЭ', name: 'Al Maktoum', priority: 1 },
  { code: 'AUH', city: 'Abu Dhabi', cityRu: 'Абу-Даби', country: 'UAE', countryRu: 'ОАЭ', name: 'Zayed International', priority: 1 },
  { code: 'DOH', city: 'Doha', cityRu: 'Доха', country: 'Qatar', countryRu: 'Катар', name: 'Hamad International', priority: 1 },
  { code: 'TLV', city: 'Tel Aviv', cityRu: 'Тель-Авив', country: 'Israel', countryRu: 'Израиль', name: 'Ben Gurion', priority: 1 },
  { code: 'CAI', city: 'Cairo', cityRu: 'Каир', country: 'Egypt', countryRu: 'Египет', name: 'Cairo International', priority: 1 },
  { code: 'BAH', city: 'Manama', cityRu: 'Манама', country: 'Bahrain', countryRu: 'Бахрейн', name: 'Bahrain International', priority: 1 },

  // Asia
  { code: 'BKK', city: 'Bangkok', cityRu: 'Бангкок', country: 'Thailand', countryRu: 'Таиланд', name: 'Suvarnabhumi', priority: 1 },
  { code: 'SIN', city: 'Singapore', cityRu: 'Сингапур', country: 'Singapore', countryRu: 'Сингапур', name: 'Changi', priority: 1 },
  { code: 'HKG', city: 'Hong Kong', cityRu: 'Гонконг', country: 'Hong Kong', countryRu: 'Гонконг', name: 'Hong Kong International', priority: 1 },
  { code: 'PEK', city: 'Beijing', cityRu: 'Пекин', country: 'China', countryRu: 'Китай', name: 'Capital', priority: 1 },
  { code: 'PVG', city: 'Shanghai', cityRu: 'Шанхай', country: 'China', countryRu: 'Китай', name: 'Pudong', priority: 2 },
  { code: 'ICN', city: 'Seoul', cityRu: 'Сеул', country: 'South Korea', countryRu: 'Южная Корея', name: 'Incheon', priority: 1 },
  { code: 'NRT', city: 'Tokyo', cityRu: 'Токио', country: 'Japan', countryRu: 'Япония', name: 'Narita', priority: 1 },
  { code: 'HND', city: 'Tokyo', cityRu: 'Токио', country: 'Japan', countryRu: 'Япония', name: 'Haneda', priority: 1 },
  { code: 'DEL', city: 'Delhi', cityRu: 'Дели', country: 'India', countryRu: 'Индия', name: 'Indira Gandhi', priority: 1 },
  { code: 'BOM', city: 'Mumbai', cityRu: 'Мумбаи', country: 'India', countryRu: 'Индия', name: 'Chhatrapati Shivaji', priority: 2 },
  { code: 'KUL', city: 'Kuala Lumpur', cityRu: 'Куала-Лумпур', country: 'Malaysia', countryRu: 'Малайзия', name: 'International', priority: 1 },
  { code: 'CGK', city: 'Jakarta', cityRu: 'Джакарта', country: 'Indonesia', countryRu: 'Индонезия', name: 'Soekarno-Hatta', priority: 1 },
  { code: 'MNL', city: 'Manila', cityRu: 'Манила', country: 'Philippines', countryRu: 'Филиппины', name: 'Ninoy Aquino', priority: 1 },

  // Americas
  { code: 'JFK', city: 'New York', cityRu: 'Нью-Йорк', country: 'USA', countryRu: 'США', name: 'John F. Kennedy', priority: 1 },
  { code: 'LGA', city: 'New York', cityRu: 'Нью-Йорк', country: 'USA', countryRu: 'США', name: 'LaGuardia', priority: 1 },
  { code: 'EWR', city: 'New York', cityRu: 'Нью-Йорк', country: 'USA', countryRu: 'США', name: 'Newark', priority: 1 },
  { code: 'LAX', city: 'Los Angeles', cityRu: 'Лос-Анджелес', country: 'USA', countryRu: 'США', name: 'Los Angeles International', priority: 2 },
  { code: 'MIA', city: 'Miami', cityRu: 'Майами', country: 'USA', countryRu: 'США', name: 'Miami International', priority: 2 },
  { code: 'ORD', city: 'Chicago', cityRu: 'Чикаго', country: 'USA', countryRu: 'США', name: "O'Hare", priority: 2 },
  { code: 'SFO', city: 'San Francisco', cityRu: 'Сан-Франциско', country: 'USA', countryRu: 'США', name: 'San Francisco International', priority: 2 },
  { code: 'YYZ', city: 'Toronto', cityRu: 'Торонто', country: 'Canada', countryRu: 'Канада', name: 'Pearson', priority: 1 },
  { code: 'YVR', city: 'Vancouver', cityRu: 'Ванкувер', country: 'Canada', countryRu: 'Канада', name: 'Vancouver International', priority: 2 },
  { code: 'MEX', city: 'Mexico City', cityRu: 'Мехико', country: 'Mexico', countryRu: 'Мексика', name: 'Benito Juárez', priority: 1 },
  { code: 'GRU', city: 'São Paulo', cityRu: 'Сан-Паулу', country: 'Brazil', countryRu: 'Бразилия', name: 'Guarulhos', priority: 1 },
  { code: 'GIG', city: 'Rio de Janeiro', cityRu: 'Рио-де-Жанейро', country: 'Brazil', countryRu: 'Бразилия', name: 'Galeão', priority: 2 },
  { code: 'EZE', city: 'Buenos Aires', cityRu: 'Буэнос-Айрес', country: 'Argentina', countryRu: 'Аргентина', name: 'Ministro Pistarini', priority: 1 },
];

/**
 * Search airports by query (code, city name in English or Russian, country)
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Array} - Matching airports sorted by priority
 */
export function searchAirports(query, limit = 10) {
  if (!query || query.length < 1) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  const matches = airports.filter(airport => {
    return (
      airport.code.toLowerCase().includes(searchTerm) ||
      airport.city.toLowerCase().includes(searchTerm) ||
      airport.cityRu.toLowerCase().includes(searchTerm) ||
      airport.name.toLowerCase().includes(searchTerm) ||
      airport.country.toLowerCase().includes(searchTerm) ||
      (airport.countryRu && airport.countryRu.toLowerCase().includes(searchTerm))
    );
  });

  // Sort by priority: 1 (capitals) first, then 2 (major cities), then 3 (other)
  matches.sort((a, b) => {
    // First sort by priority
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then alphabetically by city name
    return a.city.localeCompare(b.city);
  });

  return matches.slice(0, limit);
}

/**
 * Get airport by IATA code
 * @param {string} code - IATA code
 * @returns {Object|null} - Airport object or null
 */
export function getAirportByCode(code) {
  return airports.find(airport => airport.code === code.toUpperCase()) || null;
}
