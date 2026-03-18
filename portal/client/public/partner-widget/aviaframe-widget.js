(function(){"use strict";(function(){(function(){const j={checkoutUrl:null,bookingUrl:null},ge=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1}];function ye(e,s=8){const i=e.toLowerCase().trim();if(i.length<1)return[];const o=ge.filter(t=>t.code.toLowerCase().includes(i)||t.city.toLowerCase().includes(i)||t.cityRu.toLowerCase().includes(i)||t.name.toLowerCase().includes(i)||t.country.toLowerCase().includes(i));return o.sort((t,l)=>t.priority!==l.priority?t.priority-l.priority:t.city.localeCompare(l.city)),o.slice(0,s)}function be(e){const s=new Date(e),i=s.getFullYear(),o=String(s.getMonth()+1).padStart(2,"0"),t=String(s.getDate()).padStart(2,"0");return`${i}-${o}-${t}`}function xe(){return be(new Date)}const he=`
    .aviaframe-widget {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .aviaframe-widget * {
      box-sizing: border-box;
    }

    .aviaframe-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 24px 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .aviaframe-toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .aviaframe-dropdown {
      position: relative;
    }

    .aviaframe-dropdown-btn {
      border: 1px solid #d3d9e6;
      background: #ffffff;
      color: #1f273a;
      border-radius: 10px;
      height: 44px;
      padding: 0 14px;
      font-size: 14px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .aviaframe-dropdown-btn .caret {
      font-size: 12px;
      color: #5b627b;
    }

    .aviaframe-dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      min-width: 280px;
      background: #fff;
      border: 1px solid #dbe1ee;
      border-radius: 12px;
      box-shadow: 0 14px 40px rgba(17, 25, 40, 0.14);
      padding: 10px;
      z-index: 1200;
      display: none;
    }

    .aviaframe-dropdown.open .aviaframe-dropdown-menu {
      display: block;
    }

    .aviaframe-menu-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      color: #1f2737;
    }

    .aviaframe-menu-option:hover {
      background: #f2f6ff;
    }

    .aviaframe-menu-option input {
      margin: 0;
    }

    .aviaframe-passenger-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px;
      border-radius: 8px;
    }

    .aviaframe-passenger-row + .aviaframe-passenger-row {
      border-top: 1px solid #edf1f8;
    }

    .aviaframe-passenger-label {
      font-size: 15px;
      font-weight: 600;
      color: #202739;
    }

    .aviaframe-passenger-sub {
      font-size: 13px;
      color: #6a728b;
      margin-left: 6px;
    }

    .aviaframe-stepper {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .aviaframe-step-btn {
      width: 30px;
      height: 30px;
      border: 1px solid #d5dbea;
      background: #f3f6fb;
      border-radius: 50%;
      color: #23304b;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
    }

    .aviaframe-step-value {
      width: 18px;
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      color: #1f273b;
    }

    .aviaframe-ages {
      margin-top: 8px;
      padding: 10px;
      border-top: 1px solid #edf1f8;
    }

    .aviaframe-age-item {
      margin-top: 8px;
      display: grid;
      grid-template-columns: 1fr 100px;
      gap: 8px;
      align-items: center;
    }

    .aviaframe-age-item label {
      font-size: 13px;
      color: #404963;
    }

    .aviaframe-age-item select {
      height: 34px;
      border: 1px solid #d1d7e5;
      border-radius: 6px;
      padding: 0 8px;
      font-size: 14px;
    }

    .aviaframe-form {
      display: grid;
      gap: 16px;
    }

    .aviaframe-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 640px) {
      .aviaframe-row {
        grid-template-columns: 1fr;
      }
    }

    .aviaframe-field {
      position: relative;
    }

    .aviaframe-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .aviaframe-input {
      width: 100%;
      padding: 10px 12px;
      font-size: 16px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      outline: none;
      transition: all 0.2s;
    }

    .aviaframe-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .aviaframe-autocomplete {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #d1d5db;
      border-top: none;
      border-radius: 0 0 6px 6px;
      max-height: 280px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .aviaframe-autocomplete-item {
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.15s;
    }

    .aviaframe-autocomplete-item:hover,
    .aviaframe-autocomplete-item.active {
      background-color: #f3f4f6;
    }

    .aviaframe-autocomplete-item:last-child {
      border-bottom: none;
    }

    .aviaframe-airport-code {
      font-weight: 600;
      color: #2563eb;
      font-size: 14px;
    }

    .aviaframe-airport-city {
      font-size: 14px;
      color: #1f2937;
      margin-left: 8px;
    }

    .aviaframe-airport-name {
      font-size: 12px;
      color: #6b7280;
      display: block;
      margin-top: 2px;
    }

    .aviaframe-button {
      width: 100%;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      color: white;
      background: linear-gradient(to right, #2563eb, #3b82f6);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .aviaframe-button:hover:not(:disabled) {
      background: linear-gradient(to right, #1d4ed8, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
    }

    .aviaframe-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .aviaframe-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      gap: 16px;
    }

    .aviaframe-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: aviaframe-spin 0.8s linear infinite;
    }

    @keyframes aviaframe-spin {
      to { transform: rotate(360deg); }
    }

    .aviaframe-results {
      margin-top: 24px;
    }

    .aviaframe-results-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f1320;
      margin-bottom: 12px;
      line-height: 1.05;
    }

    .aviaframe-results-title small {
      font-size: 14px;
      color: #59607a;
      font-weight: 500;
    }

    .aviaframe-matrix {
      background: #ffffff;
      border: 1px solid #dbe1ee;
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 14px;
      overflow-x: auto;
    }

    .aviaframe-matrix-grid {
      display: grid;
      grid-template-columns: 130px repeat(6, minmax(100px, 1fr));
      gap: 8px;
      min-width: 760px;
    }

    .aviaframe-matrix-labels {
      display: grid;
      gap: 8px;
    }

    .aviaframe-matrix-label {
      min-height: 36px;
      display: flex;
      align-items: center;
      color: #4a526c;
      font-size: 16px;
      font-weight: 500;
    }

    .aviaframe-matrix-col {
      display: grid;
      gap: 8px;
    }

    .aviaframe-matrix-logo {
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: #f2f5ff;
      color: #26416f;
      font-size: 16px;
      font-weight: 800;
    }

    .aviaframe-matrix-cell {
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: #efeaff;
      color: #2f3550;
      font-size: 14px;
      font-weight: 700;
    }

    .aviaframe-matrix-cell.baggage {
      background: #dff2e3;
    }

    .aviaframe-layout {
      display: block;
    }

    .aviaframe-quick-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }

    .aviaframe-quick-item {
      text-align: left;
      border: 1px solid #dbe1ee;
      border-radius: 10px;
      background: #fff;
      padding: 10px 12px;
      cursor: pointer;
    }

    .aviaframe-quick-item.active {
      border-color: #2f80ed;
      box-shadow: inset 0 0 0 1px #2f80ed;
      background: #f4f9ff;
    }

    .aviaframe-quick-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f2b44;
      margin-bottom: 4px;
    }

    .aviaframe-quick-meta {
      font-size: 13px;
      color: #6a7288;
    }

    .aviaframe-airline-filter {
      margin-bottom: 12px;
    }

    .aviaframe-airline-filter-title {
      font-size: 18px;
      font-weight: 700;
      color: #152037;
      margin-bottom: 8px;
    }

    .aviaframe-airline-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .aviaframe-airline-card {
      border: 1px solid #dbe1ee;
      border-radius: 10px;
      background: #fff;
      padding: 10px;
      text-align: left;
      cursor: pointer;
    }

    .aviaframe-airline-card.active {
      border-color: #2f80ed;
      box-shadow: inset 0 0 0 1px #2f80ed;
    }

    .aviaframe-airline-card-logo {
      height: 34px;
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .aviaframe-airline-logo-big {
      height: 26px;
      max-width: 120px;
      object-fit: contain;
    }

    .aviaframe-airline-card-name {
      font-size: 14px;
      font-weight: 600;
      color: #25314a;
      margin-bottom: 3px;
    }

    .aviaframe-airline-card-price {
      font-size: 13px;
      color: #2d6cdf;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .aviaframe-airline-card-count {
      font-size: 12px;
      color: #778097;
    }

    .aviaframe-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border: 1px solid #dbe1ee;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 12px;
      background: #ffffff;
    }

    .aviaframe-summary-item {
      appearance: none;
      border: 0;
      background: #ffffff;
      text-align: left;
      width: 100%;
      padding: 10px 12px;
      border-right: 1px solid #dbe1ee;
      cursor: pointer;
      user-select: none;
    }

    .aviaframe-summary-item:last-child {
      border-right: none;
    }

    .aviaframe-summary-item.active {
      background: #25a7e5;
      color: #ffffff;
    }

    .aviaframe-summary-name {
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .aviaframe-summary-price {
      font-size: 20px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 4px;
    }

    .aviaframe-summary-time {
      font-size: 13px;
      color: #6d7590;
    }

    .aviaframe-summary-item.active .aviaframe-summary-time {
      color: #d8f0fe;
    }

    .aviaframe-flight-card {
      background: #ffffff;
      border: 1px solid #dbe1ee;
      border-radius: 12px;
      margin-bottom: 12px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 180px;
      overflow: hidden;
    }

    .aviaframe-flight-main {
      padding: 8px 10px;
    }

    .aviaframe-segment {
      display: grid;
      grid-template-columns: 1.2fr 1.1fr 1.2fr;
      gap: 8px;
      align-items: center;
      min-height: 60px;
    }

    .aviaframe-segment + .aviaframe-segment {
      border-top: 1px solid #e8ecf7;
      margin-top: 8px;
      padding-top: 8px;
    }

    .aviaframe-airline {
      font-size: 16px;
      font-weight: 800;
      color: #193e74;
      text-transform: uppercase;
    }

    .aviaframe-class {
      font-size: 13px;
      color: #7d869f;
      margin-top: 2px;
    }

    .aviaframe-time {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
      color: #131a2b;
    }

    .aviaframe-duration {
      font-size: 12px;
      color: #6f7792;
      margin-top: 3px;
    }

    .aviaframe-route {
      font-size: 15px;
      font-weight: 700;
      color: #1f273b;
    }

    .aviaframe-transfer {
      font-size: 13px;
      color: #eb6f01;
      margin-top: 3px;
    }

    .aviaframe-note {
      font-size: 12px;
      color: #eb6f01;
      margin-top: 1px;
    }

    .aviaframe-price-col {
      border-left: 1px solid #e8ecf7;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-end;
      gap: 6px;
    }

    .aviaframe-baggage {
      font-size: 13px;
      color: #5f6880;
    }

    .aviaframe-flight-price {
      font-size: 20px;
      font-weight: 800;
      color: #1f2434;
      line-height: 0.95;
      text-align: right;
    }

    .aviaframe-sortbar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .aviaframe-sort-label {
      font-size: 13px;
      color: #4f5871;
      margin-right: 4px;
    }

    .aviaframe-sort-btn {
      border: 1px solid #d6dcec;
      background: #fff;
      color: #27324b;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .aviaframe-sort-btn.active {
      border-color: #2599de;
      color: #1d79b4;
      background: #ecf6ff;
    }

    .aviaframe-airline-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .aviaframe-airline-logo {
      width: 22px;
      height: 22px;
      object-fit: contain;
      border-radius: 50%;
      border: 1px solid #dbe2ee;
      background: #fff;
      padding: 2px;
      flex-shrink: 0;
    }

    .aviaframe-card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
      gap: 8px;
    }

    .aviaframe-return-line {
      font-size: 12px;
      color: #687289;
      margin-top: 6px;
    }

    .aviaframe-details-toggle {
      border: none;
      background: transparent;
      color: #1977b8;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }

    .aviaframe-flight-card.selected {
      border-color: #24a877;
      box-shadow: 0 0 0 2px rgba(36, 168, 119, 0.15);
    }

    .aviaframe-selected-title {
      font-size: 14px;
      color: #1f6f46;
      font-weight: 700;
      margin: 0 0 8px 2px;
    }

    .aviaframe-details-panel {
      margin-top: 8px;
      border-top: 1px dashed #dbe1ee;
      padding-top: 8px;
      font-size: 12px;
      color: #4f5871;
      line-height: 1.45;
    }

    .aviaframe-detail-leg + .aviaframe-detail-leg {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e8ecf7;
    }

    .aviaframe-detail-route {
      font-size: 14px;
      font-weight: 700;
      color: #27324b;
    }

    .aviaframe-detail-meta {
      font-size: 13px;
      color: #5f6880;
    }

    .aviaframe-select-button {
      border: none;
      border-radius: 8px;
      background: #ffd400;
      color: #332d00;
      font-size: 17px;
      font-weight: 700;
      padding: 8px 12px;
      cursor: pointer;
    }

    .aviaframe-selection-notice {
      margin-bottom: 12px;
      background: #e9f9ef;
      border: 1px solid #bde8cd;
      color: #145a2f;
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 14px;
    }

    .aviaframe-selection-notice .continue-btn {
      border: none;
      border-radius: 7px;
      background: #0f9f6e;
      color: #fff;
      padding: 8px 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .aviaframe-filter-item:last-child {
      border-bottom: none;
    }

    .aviaframe-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      color: #991b1b;
      margin-top: 16px;
    }

    .aviaframe-date-error {
      font-size: 12px;
      color: #dc2626;
      margin-top: 4px;
      display: none;
    }

    .aviaframe-input--error {
      border-color: #dc2626 !important;
      background: #fff5f5 !important;
    }

    .aviaframe-warning {
      background: #fff8e6;
      border: 1px solid #f4d58d;
      border-radius: 8px;
      padding: 12px 14px;
      color: #7a5400;
      margin-bottom: 12px;
      font-size: 14px;
      line-height: 1.4;
    }

    .aviaframe-no-results {
      text-align: center;
      padding: 48px 24px;
      color: #6b7280;
    }

    @media (max-width: 980px) {
      .aviaframe-quick-grid {
        grid-template-columns: 1fr 1fr;
      }

      .aviaframe-airline-grid {
        grid-template-columns: 1fr 1fr;
      }

      .aviaframe-summary-price {
        font-size: 18px;
      }
    }

    @media (max-width: 520px) {
      .aviaframe-flight-card {
        grid-template-columns: 1fr;
      }

      .aviaframe-price-col {
        border-left: none;
        border-top: 1px solid #e8ecf7;
        align-items: flex-start;
      }

      .aviaframe-flight-price {
        font-size: 18px;
        text-align: left;
      }

      .aviaframe-segment {
        grid-template-columns: 1fr;
      }
    }
  `;function we(){const e=xe();return`
      <div class="aviaframe-title">
        ✈️ Flight Search
      </div>

      <div class="aviaframe-toolbar">
        <div class="aviaframe-dropdown" data-dd="trip">
          <button type="button" class="aviaframe-dropdown-btn" id="aviaframe-trip-btn">
            <span id="aviaframe-trip-label">Return</span> <span class="caret">▾</span>
          </button>
          <div class="aviaframe-dropdown-menu" id="aviaframe-trip-menu">
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-trip" value="return" checked> Return</label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-trip" value="one_way"> One-way</label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-trip" value="multi_city"> Multi-city</label>
          </div>
        </div>

        <div class="aviaframe-dropdown" data-dd="cabin">
          <button type="button" class="aviaframe-dropdown-btn" id="aviaframe-cabin-btn">
            <span id="aviaframe-cabin-label">Economy</span> <span class="caret">▾</span>
          </button>
          <div class="aviaframe-dropdown-menu" id="aviaframe-cabin-menu">
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-cabin-class" value="economy" checked> Economy</label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-cabin-class" value="premium_economy"> Premium Economy</label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-cabin-class" value="business"> Business</label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-cabin-class" value="first"> First Class</label>
            <label class="aviaframe-menu-option"><input type="checkbox" id="aviaframe-mixed-class"> Apply mixed classes</label>
          </div>
        </div>

        <div class="aviaframe-dropdown" data-dd="passengers">
          <button type="button" class="aviaframe-dropdown-btn" id="aviaframe-passengers-btn">
            <span id="aviaframe-passengers-label">1 Passenger</span> <span class="caret">▾</span>
          </button>
          <div class="aviaframe-dropdown-menu" id="aviaframe-passengers-menu" style="min-width:340px;">
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label">Adults</span><span class="aviaframe-passenger-sub">Over 11</span></div>
              <div class="aviaframe-stepper">
                <button type="button" class="aviaframe-step-btn" data-counter="adults" data-delta="-1">−</button>
                <span class="aviaframe-step-value" id="aviaframe-count-adults">1</span>
                <button type="button" class="aviaframe-step-btn" data-counter="adults" data-delta="1">+</button>
              </div>
            </div>
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label">Children</span><span class="aviaframe-passenger-sub">2-11</span></div>
              <div class="aviaframe-stepper">
                <button type="button" class="aviaframe-step-btn" data-counter="children" data-delta="-1">−</button>
                <span class="aviaframe-step-value" id="aviaframe-count-children">0</span>
                <button type="button" class="aviaframe-step-btn" data-counter="children" data-delta="1">+</button>
              </div>
            </div>
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label">Infants</span><span class="aviaframe-passenger-sub">Under 2</span></div>
              <div class="aviaframe-stepper">
                <button type="button" class="aviaframe-step-btn" data-counter="infants" data-delta="-1">−</button>
                <span class="aviaframe-step-value" id="aviaframe-count-infants">0</span>
                <button type="button" class="aviaframe-step-btn" data-counter="infants" data-delta="1">+</button>
              </div>
            </div>
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label">Cabin baggage</span></div>
              <div class="aviaframe-stepper">
                <button type="button" class="aviaframe-step-btn" data-counter="cabinBags" data-delta="-1">−</button>
                <span class="aviaframe-step-value" id="aviaframe-count-cabinBags">0</span>
                <button type="button" class="aviaframe-step-btn" data-counter="cabinBags" data-delta="1">+</button>
              </div>
            </div>
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label">Checked baggage</span></div>
              <div class="aviaframe-stepper">
                <button type="button" class="aviaframe-step-btn" data-counter="checkedBags" data-delta="-1">−</button>
                <span class="aviaframe-step-value" id="aviaframe-count-checkedBags">0</span>
                <button type="button" class="aviaframe-step-btn" data-counter="checkedBags" data-delta="1">+</button>
              </div>
            </div>
            <div class="aviaframe-ages" id="aviaframe-age-selectors"></div>
          </div>
        </div>
      </div>

      <form class="aviaframe-form" id="aviaframe-search-form">
        <div class="aviaframe-row">
          <div class="aviaframe-field">
            <label class="aviaframe-label">From</label>
            <input
              type="text"
              class="aviaframe-input"
              id="aviaframe-origin"
              placeholder="Paris, CDG..."
              autocomplete="off"
              required
            />
            <div class="aviaframe-autocomplete" id="aviaframe-origin-autocomplete" style="display: none;"></div>
          </div>

          <div class="aviaframe-field">
            <label class="aviaframe-label">To</label>
            <input
              type="text"
              class="aviaframe-input"
              id="aviaframe-destination"
              placeholder="London, LHR..."
              autocomplete="off"
              required
            />
            <div class="aviaframe-autocomplete" id="aviaframe-destination-autocomplete" style="display: none;"></div>
          </div>
        </div>

        <div class="aviaframe-row">
          <div class="aviaframe-field">
            <label class="aviaframe-label">Departure Date</label>
            <input
              type="date"
              class="aviaframe-input"
              id="aviaframe-depart-date"
              min="${e}"
              required
            />
          </div>

          <div class="aviaframe-field">
            <label class="aviaframe-label">Return Date</label>
            <input
              type="date"
              class="aviaframe-input"
              id="aviaframe-return-date"
              min="${e}"
            />
            <div class="aviaframe-date-error" id="aviaframe-return-date-error"></div>
          </div>
        </div>

        <div id="aviaframe-multi-city-fields" style="display:none;">
          <div class="aviaframe-row">
            <div class="aviaframe-field">
              <label class="aviaframe-label">From (2nd segment)</label>
              <input
                type="text"
                class="aviaframe-input"
                id="aviaframe-origin-2"
                placeholder="Paris, CDG..."
                autocomplete="off"
              />
              <div class="aviaframe-autocomplete" id="aviaframe-origin-2-autocomplete" style="display: none;"></div>
            </div>

            <div class="aviaframe-field">
              <label class="aviaframe-label">To (2nd segment)</label>
              <input
                type="text"
                class="aviaframe-input"
                id="aviaframe-destination-2"
                placeholder="London, LHR..."
                autocomplete="off"
              />
              <div class="aviaframe-autocomplete" id="aviaframe-destination-2-autocomplete" style="display: none;"></div>
            </div>
          </div>

          <div class="aviaframe-row">
            <div class="aviaframe-field">
              <label class="aviaframe-label">Departure Date (2nd segment)</label>
              <input
                type="date"
                class="aviaframe-input"
                id="aviaframe-depart-date-2"
                min="${e}"
              />
            </div>
          </div>
        </div>

        <div style="display:none;">
          <input type="hidden" id="aviaframe-trip-type" value="return" />
          <input type="hidden" id="aviaframe-cabin" value="economy" />
          <input type="hidden" id="aviaframe-adults" value="1" />
          <input type="hidden" id="aviaframe-children" value="0" />
          <input type="hidden" id="aviaframe-infants" value="0" />
          <input type="hidden" id="aviaframe-cabin-bags" value="0" />
          <input type="hidden" id="aviaframe-checked-bags" value="0" />
          <input type="hidden" id="aviaframe-children-ages" value="[]" />
          <input type="hidden" id="aviaframe-infant-ages" value="[]" />
        </div>

        <button type="submit" class="aviaframe-button">Search Flights</button>
      </form>

      <div id="aviaframe-results"></div>
    `}function _e(){var e;const s=Array.from(document.querySelectorAll(".aviaframe-dropdown")),i=()=>s.forEach(r=>r.classList.remove("open"));s.forEach(r=>{const $=r.querySelector(".aviaframe-dropdown-btn");$&&$.addEventListener("click",y=>{y.stopPropagation();const b=r.classList.contains("open");i(),b||r.classList.add("open")})}),document.addEventListener("click",r=>{r.target.closest(".aviaframe-dropdown")||i()});const o=document.getElementById("aviaframe-trip-type"),t=document.getElementById("aviaframe-trip-label"),l=(e=document.getElementById("aviaframe-return-date"))==null?void 0:e.closest(".aviaframe-field"),v=document.getElementById("aviaframe-multi-city-fields");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(r=>{r.addEventListener("change",()=>{r.checked&&(o.value=r.value,t.textContent=r.value==="one_way"?"One-way":r.value==="multi_city"?"Multi-city":"Return",r.value==="one_way"?(l&&(l.style.display="none"),v&&(v.style.display="none")):r.value==="multi_city"?(l&&(l.style.display="none"),v&&(v.style.display="block")):(l&&(l.style.display="block"),v&&(v.style.display="none")))})});const x=document.getElementById("aviaframe-cabin"),I=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(r=>{r.addEventListener("change",()=>{r.checked&&(x.value=r.value,I.textContent=r.parentElement.textContent.trim())})});const S={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},p={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},u=()=>{document.getElementById("aviaframe-adults").value=p.adults,document.getElementById("aviaframe-children").value=p.children,document.getElementById("aviaframe-infants").value=p.infants,document.getElementById("aviaframe-cabin-bags").value=p.cabinBags,document.getElementById("aviaframe-checked-bags").value=p.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(p.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(p.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${p.adults+p.children+p.infants} Passenger${p.adults+p.children+p.infants!==1?"s":""}`},d=()=>{const r=document.getElementById("aviaframe-age-selectors");for(;p.childrenAges.length<p.children;)p.childrenAges.push(2);for(;p.childrenAges.length>p.children;)p.childrenAges.pop();for(;p.infantAges.length<p.infants;)p.infantAges.push(1);for(;p.infantAges.length>p.infants;)p.infantAges.pop();const $=p.childrenAges.map((b,c)=>`
        <div class="aviaframe-age-item">
          <label>Child ${c+1} age</label>
          <select data-age-type="child" data-age-index="${c}">
            ${Array.from({length:10},(g,B)=>B+2).map(g=>`<option value="${g}" ${g===b?"selected":""}>${g}</option>`).join("")}
          </select>
        </div>
      `).join(""),y=p.infantAges.map((b,c)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${c+1} age</label>
          <select data-age-type="infant" data-age-index="${c}">
            ${Array.from({length:2},(g,B)=>B).map(g=>`<option value="${g}" ${g===b?"selected":""}>${g}</option>`).join("")}
          </select>
        </div>
      `).join("");r.innerHTML=$+y,r.querySelectorAll("select[data-age-type]").forEach(b=>{b.addEventListener("change",()=>{const c=b.getAttribute("data-age-type"),g=Number(b.getAttribute("data-age-index")),B=Number(b.value);c==="child"?p.childrenAges[g]=B:p.infantAges[g]=B,u()})}),u()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(r=>{r.addEventListener("click",()=>{const $=r.getAttribute("data-counter"),y=Number(r.getAttribute("data-delta")),b=S[$];if(!b)return;const c=Math.max(b.min,Math.min(b.max,p[$]+y));p[$]=c;const g=document.getElementById(`aviaframe-count-${$}`);g&&(g.textContent=c),d()})}),d()}function ae(e,s){const i=document.getElementById(e),o=document.getElementById(s);if(!i||!o)return;let t=-1;i.addEventListener("input",function(){const l=this.value;if(l.length<1){o.style.display="none";return}const v=ye(l);if(v.length===0){o.style.display="none";return}o.innerHTML=v.map((x,I)=>`
        <div class="aviaframe-autocomplete-item" data-index="${I}" data-code="${x.code}">
          <div>
            <span class="aviaframe-airport-code">${x.code}</span>
            <span class="aviaframe-airport-city">${x.city} / ${x.cityRu}</span>
          </div>
          <span class="aviaframe-airport-name">${x.name}, ${x.country}</span>
        </div>
      `).join(""),o.style.display="block",t=-1,o.querySelectorAll(".aviaframe-autocomplete-item").forEach((x,I)=>{x.addEventListener("click",function(){const S=v[I];i.value=`${S.city} (${S.code})`,i.dataset.code=S.code,o.style.display="none"})})}),i.addEventListener("keydown",function(l){const v=o.querySelectorAll(".aviaframe-autocomplete-item");v.length!==0&&(l.key==="ArrowDown"?(l.preventDefault(),t=Math.min(t+1,v.length-1),ce(v,t)):l.key==="ArrowUp"?(l.preventDefault(),t=Math.max(t-1,0),ce(v,t)):l.key==="Enter"&&t>=0?(l.preventDefault(),v[t].click()):l.key==="Escape"&&(o.style.display="none"))}),document.addEventListener("click",function(l){!i.contains(l.target)&&!o.contains(l.target)&&(o.style.display="none")})}function ce(e,s){e.forEach((i,o)=>{o===s?(i.classList.add("active"),i.scrollIntoView({block:"nearest"})):i.classList.remove("active")})}function ke(e){const s=document.getElementById("aviaframe-search-form"),i=document.getElementById("aviaframe-results");s.addEventListener("submit",async function(o){o.preventDefault();const t=document.getElementById("aviaframe-origin"),l=document.getElementById("aviaframe-destination"),v=document.getElementById("aviaframe-depart-date").value,x=document.getElementById("aviaframe-return-date").value,I=parseInt(document.getElementById("aviaframe-adults").value,10),S=parseInt(document.getElementById("aviaframe-children").value,10)||0,p=parseInt(document.getElementById("aviaframe-infants").value,10)||0,u=document.getElementById("aviaframe-trip-type").value||"return",d=document.getElementById("aviaframe-cabin").value,r=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),$=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),y=t.dataset.code,b=l.dataset.code;if(!y||!b){i.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select airports from the dropdown.
          </div>
        `;return}if(!v){i.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select departure date.
          </div>
        `;return}if(u==="return"&&(!x||x<=v)){i.innerHTML=`<div class="aviaframe-error"><strong>Error:</strong> ${x?"Return date must be after the departure date.":"Please select a return date."}</div>`;return}i.innerHTML=`
        <div class="aviaframe-loading">
          <div class="aviaframe-spinner"></div>
          <div>Searching for flights...</div>
        </div>
      `;let c={origin:y,destination:b,depart_date:v,return_date:x||null,adults:I,children:S,infants:p,children_ages:r,infant_ages:$,cabin_class:d,trip_type:u};if(u==="one_way"&&(c.return_date=null),u==="multi_city"){const f=document.getElementById("aviaframe-origin-2"),m=document.getElementById("aviaframe-destination-2"),C=document.getElementById("aviaframe-depart-date-2").value,k=f==null?void 0:f.dataset.code,T=m==null?void 0:m.dataset.code;if(!k||!T||!C){i.innerHTML=`
            <div class="aviaframe-error">
              <strong>Error:</strong> For Multi-city please fill second segment: From, To and Date.
            </div>
          `;return}c.segments=[{origin:y,destination:b,depart_date:v},{origin:k,destination:T,depart_date:C}]}const g=f=>String(f||"").replace(/\/+$/,""),B=f=>{const m=g(f);return m.endsWith("/search")?m:`${m}/search`},a=f=>{const m=g(f);return m.includes("/api/drct/")?m.replace("/api/drct/","/api/n8n/webhook-test/drct/"):m.endsWith("/api/drct")?m.replace("/api/drct","/api/n8n/webhook-test/drct"):m},n=f=>{const m=g(f),C=[m,B(m),a(m)];return[...new Set(C.filter(Boolean))]};try{let f=null;const m=n(e);for(const k of m)if(f=await fetch(k,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(c)}),f.ok||f.status!==404)break;if(!f.ok)throw new Error(`HTTP ${f.status}: ${f.statusText}`);const C=await f.json();if(C.offers&&C.offers.length>0){const k=C.offers.map(T=>{const L={...T,_searchOrigin:c.origin||(T==null?void 0:T._searchOrigin)||null,_searchDestination:c.destination||(T==null?void 0:T._searchDestination)||null,_searchReturnDate:c.return_date||(T==null?void 0:T._searchReturnDate)||null};if(!(L!=null&&L.return_origin&&L!=null&&L.return_destination||L!=null&&L.return_departure_time&&L!=null&&L.return_arrival_time)&&c.return_date){const _=Se(L);_&&Object.assign(L,_),L.return_origin||(L.return_origin=c.destination||null),L.return_destination||(L.return_destination=c.origin||null)}return L});fe(k)}else i.innerHTML=`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No flights found</div>
              <div>Try adjusting your search criteria</div>
            </div>
          `}catch(f){const m=String((f==null?void 0:f.message)||""),C=m.includes("HTTP 404");if((f==null?void 0:f.name)==="TypeError"||m.includes("Failed to fetch")||m.toLowerCase().includes("cors")||C){const k=Ne(c);fe(k),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",f);return}i.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${m}
          </div>
        `}})}function Ae(e){return e?`https://pics.avs.io/200/80/${e}.png`:null}function Ee(e){var k,T,L;const s={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,passengers:e.passengers||[],selected_at:new Date().toISOString()};localStorage.setItem("selectedOffer",JSON.stringify(s)),console.log("✅ Offer selected:",e.offer_id),window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:s},bubbles:!0}));const i=document.querySelector(".aviaframe-widget"),o=document.getElementById("aviaframe-results"),t=document.getElementById("aviaframe-search-form");if(!i){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:s},bubbles:!0})),j.checkoutUrl&&(window.location.href=j.checkoutUrl);return}t&&(t.style.display="none"),o&&(o.style.display="none");const l=document.getElementById("aviaframe-passenger-step");l&&l.remove();const v=((e==null?void 0:e.price)||{}).currency||"UAH",x=Math.round((e==null?void 0:e.displayed_price)||((e==null?void 0:e.price)||{}).total||0).toLocaleString("en-US"),I=e.airline_name||e.airline||"Airline",S=e.origin||"---",p=e.destination||"---",u=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",d=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A",r=parseInt(((k=document.getElementById("aviaframe-adults"))==null?void 0:k.value)||"1",10)||1,$=parseInt(((T=document.getElementById("aviaframe-children"))==null?void 0:T.value)||"0",10)||0,y=parseInt(((L=document.getElementById("aviaframe-infants"))==null?void 0:L.value)||"0",10)||0,b=[];for(let _=0;_<r;_++)b.push({id:"ADT"+(_+1),type:"ADT"});for(let _=0;_<$;_++)b.push({id:"CHD"+(_+1),type:"CHD"});for(let _=0;_<y;_++)b.push({id:"INF"+(_+1),type:"INF"});b.length||b.push({id:"T1",type:"ADT"});const c={};function g(_){c[_]=(c[_]||0)+1;const R=c[_];return _==="ADT"?"Adult "+R:_==="CHD"?"Child "+R:_==="INF"?"Infant "+R:"Passenger "+R}function B(_,R){const G=_.type||"ADT",E=g(G),M=G==="ADT"?"18+ years":G==="CHD"?"2–11 years":"Under 2 years";return'<div class="avf-pax-section" data-pax-idx="'+R+'" data-pax-type="'+G+'" style="grid-column:1/-1;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:8px"><div style="font-size:18px;font-weight:700;color:#1f2937;margin-bottom:12px">'+E+' <span style="font-size:13px;font-weight:400;color:#94a3b8">'+M+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">First Name *</span><input required data-field="firstName" placeholder="John" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Last Name *</span><input required data-field="lastName" placeholder="Doe" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Gender *</span><select data-field="gender" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px"><option value="M">Male</option><option value="F">Female</option></select></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Date of Birth *</span><input required type="date" lang="en" data-field="dateOfBirth" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Number *</span><input required data-field="passportNumber" placeholder="AB1234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Expiry *</span><input required type="date" lang="en" data-field="passportExpiry" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label></div></div>'}const a=b.map((_,R)=>B(_,R)).join(""),n=document.createElement("div");n.id="aviaframe-passenger-step",n.style.marginTop="16px",n.style.border="1px solid #d9e3f3",n.style.borderRadius="12px",n.style.padding="16px",n.style.background="#fff",n.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px"><div><div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.1">Selected Flight</div><div style="margin-top:8px;font-size:20px;font-weight:700;color:#1f2937">'+S+" → "+p+' <span style="font-size:18px;font-weight:600;color:#64748b">'+I+'</span></div><div style="margin-top:6px;font-size:16px;color:#475569">Departure: '+u+" | Arrival: "+d+'</div></div><div style="text-align:right"><div style="font-size:56px;line-height:1;font-weight:800;color:#2563eb">'+x+" "+v+'</div><div style="margin-top:6px;font-size:20px;color:#64748b">total</div></div></div><div style="font-size:38px;font-weight:800;color:#0f172a;margin:16px 0 10px">Passenger Details</div><form id="aviaframe-passenger-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="grid-column:1/-1;font-size:20px;font-weight:700;color:#1f2937;margin-top:2px">Contact Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Email Address *</span><input required type="email" name="email" placeholder="name@example.com" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Phone Number *</span><input required name="phone" placeholder="+971501234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1/-1;height:1px;background:#e2e8f0;margin:6px 0"></div>'+a+'<div style="grid-column:1/-1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1/-1;font-size:20px;font-weight:700;color:#1f2937">Payment Method</div><div style="grid-column:1/-1;display:flex;flex-direction:column;gap:10px"><label style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #2563eb;border-radius:10px;cursor:pointer;background:#eff6ff"><input type="radio" name="paymentMethod" value="bank_transfer" checked style="width:18px;height:18px;accent-color:#2563eb" /><div><div style="font-size:15px;font-weight:700;color:#1e3a8a">Bank Transfer</div><div style="font-size:13px;color:#3b82f6">Transfer to agency bank account</div></div></label><label style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #e2e8f0;border-radius:10px;cursor:pointer"><input type="radio" name="paymentMethod" value="cash" style="width:18px;height:18px;accent-color:#2563eb" /><div><div style="font-size:15px;font-weight:700;color:#1f2937">Cash at Office</div><div style="font-size:13px;color:#64748b">Pay in person at our office</div></div></label></div><div id="aviaframe-passenger-error" style="grid-column:1/-1;display:none;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px;font-size:14px"></div><div style="grid-column:1/-1;display:flex;justify-content:space-between;gap:10px;margin-top:6px"><button type="button" id="aviaframe-passenger-back" style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:600">Back</button><button type="submit" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer">Continue to booking</button></div></form>',i.appendChild(n),window.scrollTo({top:0,behavior:"smooth"});const f=n.querySelector("#aviaframe-passenger-back"),m=n.querySelector("#aviaframe-passenger-form"),C=n.querySelector("#aviaframe-passenger-error");f&&f.addEventListener("click",()=>{n.remove(),t&&(t.style.display=""),o&&(o.style.display="")}),function(R,G){if(!R)return;function E(w,D){let q=w.parentNode.querySelector(".avf-ferr");q||(q=document.createElement("span"),q.className="avf-ferr",q.style.cssText="color:#b91c1c;font-size:12px;margin-top:2px;display:block",w.parentNode.appendChild(q)),q.textContent=D,w.style.borderColor="#ef4444"}function M(w){const D=w.parentNode.querySelector(".avf-ferr");D&&(D.textContent=""),w.style.borderColor="#cbd5e1"}const P=R.querySelector('[name="email"]'),U=R.querySelector('[name="phone"]');function V(){const w=P.value.trim();w?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w)?M(P):E(P,"Invalid email address"):E(P,"Email is required")}function X(){const w=U.value.trim();w?/^\+\d{7,15}$/.test(w)?M(U):E(U,"Format: +971501234567"):E(U,"Phone is required")}P&&(P.addEventListener("input",V),P.addEventListener("blur",V)),U&&(U.addEventListener("input",X),U.addEventListener("blur",X)),R.querySelectorAll(".avf-pax-section").forEach(function(w){const D=w.dataset.paxType||"ADT";function q(A){const F=A.value.trim();F?/^[A-Za-z\s\-']+$/.test(F)?M(A):E(A,"Latin letters only"):E(A,"Required")}const W=w.querySelector('[data-field="firstName"]'),K=w.querySelector('[data-field="lastName"]'),Q=w.querySelector('[data-field="dateOfBirth"]'),z=w.querySelector('[data-field="passportNumber"]'),N=w.querySelector('[data-field="passportExpiry"]');W&&(W.addEventListener("input",function(){q(this)}),W.addEventListener("blur",function(){q(this)})),K&&(K.addEventListener("input",function(){q(this)}),K.addEventListener("blur",function(){q(this)})),Q&&Q.addEventListener("change",function(){const A=this.value;if(!A){E(this,"Date of birth required");return}const F=new Date(A);if(isNaN(F.getTime())){E(this,"Invalid date");return}const J=(Date.now()-F.getTime())/(365.25*24*3600*1e3);D==="ADT"&&J<18?E(this,"Adult must be 18+ years old"):D==="CHD"&&J<2?E(this,"Child must be at least 2 years old"):D==="CHD"&&J>=12?E(this,"Child must be under 12 years old"):D==="INF"&&J>=2?E(this,"Infant must be under 2 years old"):M(this)}),z&&(z.addEventListener("input",function(){this.value=this.value.toUpperCase();const A=this.value.trim();A?A.length<6?E(this,"At least 6 characters"):/^[A-Z0-9]+$/.test(A)?M(this):E(this,"Letters and digits only"):E(this,"Required")}),z.addEventListener("blur",function(){const A=this.value.trim();A?A.length<6?E(this,"At least 6 characters"):/^[A-Z0-9]+$/.test(A)?M(this):E(this,"Letters and digits only"):E(this,"Required")})),N&&N.addEventListener("change",function(){const A=this.value;if(!A){E(this,"Expiry required");return}const F=new Date(A+"T00:00:00");if(F<new Date){E(this,"Passport has expired");return}const O=new Date;if(O.setMonth(O.getMonth()+6),F<O){E(this,"Must be valid 6+ months");return}M(this)})})}(n.querySelector("#aviaframe-passenger-form")),m&&m.addEventListener("submit",_=>{var W,K,Q;_.preventDefault();const R=(e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10),G=new Date(R+"T00:00:00"),E=new Date(G);E.setMonth(E.getMonth()+6);const M=new Date,P=String(((W=m.querySelector('[name="email"]'))==null?void 0:W.value)||""),U=String(((K=m.querySelector('[name="phone"]'))==null?void 0:K.value)||""),V=String(((Q=m.querySelector('[name="paymentMethod"]:checked'))==null?void 0:Q.value)||"bank_transfer"),X=m.querySelectorAll(".avf-pax-section"),w=[];let D=null;for(let z=0;z<X.length;z++){const N=X[z],A=N.dataset.paxType||"ADT",F=parseInt(N.dataset.paxIdx,10),J=b[F]||{},O=H=>{var Z;return String(((Z=N.querySelector('[data-field="'+H+'"]'))==null?void 0:Z.value)||"")},ue=O("firstName"),me=O("lastName"),Re=O("gender")||"M",le=O("dateOfBirth"),Me=O("passportNumber"),de=O("passportExpiry");if(!ue||!me){D="Please fill in name for passenger "+(z+1)+".";break}if(!le){D="Please enter date of birth for passenger "+(z+1)+".";break}const ee=new Date(le);if(isNaN(ee.getTime())){D="Invalid date of birth for passenger "+(z+1)+".";break}if(A==="ADT"){const H=new Date(ee);if(H.setFullYear(H.getFullYear()+18),H>M){D="Adult "+(z+1)+" must be at least 18 years old.";break}}else if(A==="CHD"){const H=new Date(ee);H.setFullYear(H.getFullYear()+2);const Z=new Date(ee);if(Z.setFullYear(Z.getFullYear()+12),H>M){D="Child "+(z+1)+" must be at least 2 years old.";break}if(Z<=M){D="Child "+(z+1)+" must be under 12 years old.";break}}else if(A==="INF"){const H=new Date(ee);if(H.setFullYear(H.getFullYear()+2),H<=M){D="Infant "+(z+1)+" must be under 2 years old.";break}}if(!de){D="Please enter passport expiry for passenger "+(z+1)+".";break}const ve=new Date(de+"T00:00:00");if(isNaN(ve.getTime())||ve<E){D="Passport for passenger "+(z+1)+" must be valid 6+ months from trip date.";break}w.push({type:A,pax_id:J.id||"T"+(F+1),first_name:ue,last_name:me,gender:Re,date_of_birth:le,email:P,phone:U,document:{type:"REGULAR_PASSPORT",number:Me,expiry_date:de,issuing_country:"AE",citizenship:"AE",country_of_issue:"AE"},payment_method:V})}if(D){C&&(C.textContent=D,C.style.display="block");return}C&&(C.style.display="none");const q=w[0]?{firstName:w[0].first_name,lastName:w[0].last_name,email:P,phone:U,gender:w[0].gender,dateOfBirth:w[0].date_of_birth,passportNumber:w[0].document.number,passportExpiry:w[0].document.expiry_date,paymentMethod:V}:null;localStorage.setItem("passengerData",JSON.stringify(q)),window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:s,passenger:q,passengers:w},bubbles:!0})),(()=>{const z=N=>{var F;const A=N?'<div style="font-size:13px;color:#64748b;margin-bottom:16px">Reference: <strong>'+N+"</strong></div>":"";n.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:52px;margin-bottom:16px">✅</div><div style="font-size:24px;font-weight:800;color:#166534;margin-bottom:10px">Booking Request Received!</div><div style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:16px">Thank you, <strong>'+(((F=w[0])==null?void 0:F.first_name)||"")+"</strong>! Your booking request has been received.<br>We will contact you at <strong>"+P+"</strong><br>to confirm the booking and send payment instructions.</div>"+A+'<button type="button" id="aviaframe-passenger-back2" style="border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600;font-size:14px">Search again</button></div>',n.querySelector("#aviaframe-passenger-back2")&&n.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{n.remove(),t&&(t.style.display=""),o&&(o.style.display="")})};j.checkoutUrl?window.location.href=j.checkoutUrl:j.bookingUrl?(n.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:36px;margin-bottom:12px">⏳</div><div style="font-size:16px;color:#374151">Sending booking request…</div></div>',fetch(j.bookingUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({offer:s,passengers:w,contacts:{email:P,phone:U}})}).then(N=>N.json().catch(()=>({}))).then(N=>{if(N.success===!1||N.statusCode>=400||N.error){n.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:52px;margin-bottom:16px">❌</div><div style="font-size:24px;font-weight:800;color:#b91c1c;margin-bottom:12px">Booking Failed</div><div style="font-size:15px;color:#374151;margin-bottom:20px">'+(N.message||N.error||"Something went wrong. Please try again or contact us.")+'</div><button type="button" id="aviaframe-err-back" style="border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600">← Search again</button></div>';const A=n.querySelector("#aviaframe-err-back");A&&A.addEventListener("click",()=>{n.remove(),t&&(t.style.display=""),o&&(o.style.display="")});return}z(N.order_number||N.order_id||null)}).catch(()=>{z(null)})):z(null)})()})}function Y(e,s=0){const i=Number(e);return Number.isFinite(i)?i:s}function h(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function re(e,s){return`${Math.round(Y(e,0)).toLocaleString("uk-UA")} ${s||"UAH"}`}function te(e){if(!e)return"--:--";const s=String(e).match(/T(\d{2}:\d{2})/);return s?s[1]:String(e)}function ie(e){return e?String(e).trim().toUpperCase():null}function ne(e){var s;return ie((e==null?void 0:e.origin_code)||((s=e==null?void 0:e.departure_airport)==null?void 0:s.code)||(e==null?void 0:e.origin))}function oe(e){var s;return ie((e==null?void 0:e.destination_code)||((s=e==null?void 0:e.arrival_airport)==null?void 0:s.code)||(e==null?void 0:e.destination))}function $e(e){return(e==null?void 0:e.departure)||[e==null?void 0:e.departure_date,e==null?void 0:e.departure_time].filter(Boolean).join("T")}function Te(e){return(e==null?void 0:e.arrival)||[e==null?void 0:e.arrival_date,e==null?void 0:e.arrival_time].filter(Boolean).join("T")}function Se(e){const s=Array.isArray(e==null?void 0:e.segments)?e.segments:[];if(!s.length)return null;const i=ie((e==null?void 0:e._searchOrigin)||(e==null?void 0:e.origin)),o=ie((e==null?void 0:e._searchDestination)||(e==null?void 0:e.destination));if(!i||!o)return null;let t=-1;for(let d=1;d<s.length;d+=1){const r=ne(s[d]),$=oe(s[d]);if(r===o||$===i){t=d;break}}if(t<0)return null;const l=s.slice(t),v=l[0],x=l[l.length-1],I=ne(v)||o,S=oe(x)||i,p=$e(v)||null,u=Te(x)||null;return!I||!S?null:{return_origin:I,return_destination:S,return_departure_time:p,return_arrival_time:u}}function Ce(e){if(e.duration_minutes)return Y(e.duration_minutes,0);if(e.durationMinutes)return Y(e.durationMinutes,0);if(e.journey_time)return Math.round(Y(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const s=new Date(e.departure_time).getTime(),i=new Date(e.arrival_time).getTime();return!Number.isFinite(s)||!Number.isFinite(i)||i<=s?0:Math.round((i-s)/6e4)}function Ie(e,s){if(!e||!s)return 0;const i=new Date(e).getTime(),o=new Date(s).getTime();return!Number.isFinite(i)||!Number.isFinite(o)||o<=i?0:Math.round((o-i)/6e4)}function pe(e){const s=Y(e,0),i=Math.floor(s/60),o=s%60;return s<=0?"n/a":`${i}h ${o}m`}function Le(e){return e.stops!==void 0?Y(e.stops,0):e.transfers_count!==void 0?Y(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function De(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function Be(e){const s=(e.airline_code||e.airline||"").toString().trim();return s?s.slice(0,2).toUpperCase():"NA"}function ze(e){var s,i;const o=Y((e==null?void 0:e.displayed_price)||((s=e==null?void 0:e.price)==null?void 0:s.total),0),t=((i=e==null?void 0:e.price)==null?void 0:i.currency)||"UAH",l=Le(e),v=Array.isArray(e==null?void 0:e.segments)?e.segments.map(r=>{var $,y,b;return{origin:(()=>{const c=ne(r),g=(r==null?void 0:r.origin)||(($=r==null?void 0:r.departure_city)==null?void 0:$.name)||"";return c?g&&g.toUpperCase()!==c?`${c} (${g})`:c:g||"N/A"})(),destination:(()=>{const c=oe(r),g=(r==null?void 0:r.destination)||((y=r==null?void 0:r.arrival_city)==null?void 0:y.name)||"";return c?g&&g.toUpperCase()!==c?`${c} (${g})`:c:g||"N/A"})(),departure:(r==null?void 0:r.departure)||[r==null?void 0:r.departure_date,r==null?void 0:r.departure_time].filter(Boolean).join(" ")||"N/A",arrival:(r==null?void 0:r.arrival)||[r==null?void 0:r.arrival_date,r==null?void 0:r.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((b=r==null?void 0:r.carrier)==null?void 0:b.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:(r==null?void 0:r.flight_number)||"N/A"}}):[],x=!!(e!=null&&e.return_origin&&e!=null&&e.return_destination||e!=null&&e.return_departure_time&&e!=null&&e.return_arrival_time),I=x?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",S=x?te(e.return_departure_time):"--:--",p=x?te(e.return_arrival_time):"--:--",u=x?Ie(e.return_departure_time,e.return_arrival_time):0,d=x?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:Be(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:te(e.departure_time),arrive:te(e.arrival_time),durationMinutes:Ce(e),stops:l,stopsText:De(l),priceTotal:o,priceCurrency:t,baggageText:e.baggage_text||(e.with_baggage?"With baggage":"No baggage"),segments:v,hasReturnData:x,returnRoute:I,returnDepart:S,returnArrive:p,returnDurationMinutes:u,returnSummary:d}}function Ne(e){const s=e.origin||"WAW",i=e.destination||"YVR",o=e.depart_date||"2026-02-27",t=e.return_date||"",l=e.trip_type!=="one_way"&&!!t,v=(x,I,S,p=[])=>{const u=d=>({origin:d.from,destination:d.to,departure:d.depart,arrival:d.arrive,carrier:{airline_code:x,airline_name:I},flight_number:d.flight});return[...S.map(u),...p.map(u)]};return[{offer_id:"fallback_1",origin:s,destination:i,departure_time:`${o}T13:05:00`,arrival_time:`${o}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:l?i:null,return_destination:l?s:null,return_departure_time:l?`${t}T14:20:00`:null,return_arrival_time:l?`${t}T22:40:00`:null,segments:v("DL","DELTA",[{from:s,to:"CDG",depart:`${o}T13:05:00`,arrive:`${o}T16:10:00`,flight:"737"},{from:"CDG",to:i,depart:`${o}T17:05:00`,arrive:`${o}T23:25:00`,flight:"4200"}],l?[{from:i,to:"FRA",depart:`${t}T14:20:00`,arrive:`${t}T17:10:00`,flight:"9655"},{from:"FRA",to:s,depart:`${t}T18:30:00`,arrive:`${t}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"UAH"}},{offer_id:"fallback_2",origin:s,destination:i,departure_time:`${o}T08:10:00`,arrival_time:`${o}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:l?i:null,return_destination:l?s:null,return_departure_time:l?`${t}T09:00:00`:null,return_arrival_time:l?`${t}T20:30:00`:null,segments:v("LO","LOT",[{from:s,to:i,depart:`${o}T08:10:00`,arrive:`${o}T22:00:00`,flight:"441"}],l?[{from:i,to:s,depart:`${t}T09:00:00`,arrive:`${t}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"UAH"}},{offer_id:"fallback_3",origin:s,destination:i,departure_time:`${o}T06:45:00`,arrival_time:`${o}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:l?i:null,return_destination:l?s:null,return_departure_time:l?`${t}T07:10:00`:null,return_arrival_time:l?`${t}T19:55:00`:null,segments:v("AC","AIR CANADA",[{from:s,to:"MUC",depart:`${o}T06:45:00`,arrive:`${o}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${o}T11:50:00`,arrive:`${o}T14:50:00`,flight:"837"},{from:"YYZ",to:i,depart:`${o}T18:40:00`,arrive:`${o}T23:15:00`,flight:"835"}],l?[{from:i,to:"YYZ",depart:`${t}T07:10:00`,arrive:`${t}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${t}T12:00:00`,arrive:`${t}T16:00:00`,flight:"838"},{from:"MUC",to:s,depart:`${t}T17:20:00`,arrive:`${t}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"UAH"}}]}function fe(e,s={}){const i=document.getElementById("aviaframe-results"),o=e.map(ze).map((a,n)=>({...a,id:a.offer.offer_id||`offer_${n}`,airlineLogo:Ae(a.carrierCode)})),t={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set},l=a=>t.quickFilter==="nonstop"?a.filter(n=>n.stops===0):t.quickFilter==="one_stop"?a.filter(n=>n.stops===1):t.quickFilter==="baggage"?a.filter(n=>/baggage|bag/i.test(n.baggageText||"")):a,v=a=>a.length?{count:a.length,minPrice:Math.min(...a.map(n=>n.priceTotal))}:{count:0,minPrice:null},x=()=>({all:v(o),nonstop:v(o.filter(a=>a.stops===0)),one_stop:v(o.filter(a=>a.stops===1)),baggage:v(o.filter(a=>/baggage|bag/i.test(a.baggageText||"")))}),I=()=>{const a=l(o),n=new Map;return a.forEach(f=>{const m=f.carrierCode||"NA";if(!n.has(m))n.set(m,{code:m,name:f.airlineName||m,logo:f.airlineLogo,count:1,minPrice:f.priceTotal});else{const C=n.get(m);C.count+=1,C.minPrice=Math.min(C.minPrice,f.priceTotal)}}),Array.from(n.values()).sort((f,m)=>f.minPrice-m.minPrice).slice(0,8)},S=a=>`
      <div class="aviaframe-details-panel">
        ${a.segments.length?a.segments.map(n=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${h(n.origin)} → ${h(n.destination)}</div>
            <div class="aviaframe-detail-meta">${h(n.departure)} → ${h(n.arrival)}</div>
            <div class="aviaframe-detail-meta">${h(n.airline)} • flight ${h(n.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${h(a.route)}</div>
            <div class="aviaframe-detail-meta">${h(a.depart)} → ${h(a.arrive)}</div>
          </div>
        `}
      </div>
    `,p=(a,n="")=>`
      <article class="aviaframe-flight-card ${n}" data-offer-id="${h(a.id)}">
        <div class="aviaframe-flight-main">
          <div class="aviaframe-segment">
            <div>
              <div class="aviaframe-airline-header">
                ${a.airlineLogo?`<img class="aviaframe-airline-logo" src="${a.airlineLogo}" alt="${h(a.airlineName)}" onerror="this.style.display='none'">`:""}
                <div class="aviaframe-airline">${h(a.airlineName)}</div>
              </div>
              <div class="aviaframe-class">Economy class</div>
            </div>
            <div>
              <div class="aviaframe-time">${h(a.depart)} - ${h(a.arrive)}</div>
              <div class="aviaframe-duration">${h(pe(a.durationMinutes))} total travel time</div>
            </div>
            <div>
              <div class="aviaframe-route">${h(a.route)}</div>
              <div class="aviaframe-transfer">${h(a.stopsText)}</div>
            </div>
          </div>
          ${a.hasReturnData?`
            <div class="aviaframe-segment">
              <div>
                <div class="aviaframe-airline-header">
                  ${a.airlineLogo?`<img class="aviaframe-airline-logo" src="${a.airlineLogo}" alt="${h(a.airlineName)}" onerror="this.style.display='none'">`:""}
                  <div class="aviaframe-airline">${h(a.airlineName)}</div>
                </div>
                <div class="aviaframe-class">Economy class</div>
              </div>
              <div>
                <div class="aviaframe-time">${h(a.returnDepart)} - ${h(a.returnArrive)}</div>
                <div class="aviaframe-duration">${h(pe(a.returnDurationMinutes||a.durationMinutes))} total travel time</div>
              </div>
              <div>
                <div class="aviaframe-route">${h(a.returnRoute)}</div>
                <div class="aviaframe-transfer">${h(a.stopsText)}</div>
              </div>
            </div>
          `:""}
          <div class="aviaframe-card-actions">
            <button type="button" class="aviaframe-details-toggle" data-details-id="${h(a.id)}">
              ${t.expandedIds.has(a.id)?"Hide details":"Details"}
            </button>
          </div>
          ${t.expandedIds.has(a.id)?S(a):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${h(a.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${h(re(a.priceTotal,a.priceCurrency))}</div>
          <button class="aviaframe-select-button" data-select-id="${h(a.id)}">Select</button>
        </aside>
      </article>
    `,u=()=>{let a=l(o);return t.selectedAirlines.size&&(a=a.filter(n=>t.selectedAirlines.has(n.carrierCode))),a=[...a],t.sort==="airline"?a.sort((n,f)=>n.airlineName.localeCompare(f.airlineName)):t.sort==="fastest"?a.sort((n,f)=>n.durationMinutes-f.durationMinutes):a.sort((n,f)=>n.priceTotal-f.priceTotal),a},d=(a,n,f)=>`
      <button type="button" class="aviaframe-quick-item ${t.quickFilter===a?"active":""}" data-quick="${a}">
        <div class="aviaframe-quick-title">${n}</div>
        <div class="aviaframe-quick-meta">${f.count} flights${f.minPrice!==null?` · from ${re(f.minPrice,"UAH")}`:""}</div>
      </button>
    `,r=a=>a.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${a.map(n=>`
              <button type="button" class="aviaframe-airline-card ${t.selectedAirlines.has(n.code)?"active":""}" data-airline="${h(n.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${n.logo?`<img class="aviaframe-airline-logo-big" src="${n.logo}" alt="${h(n.name)}" onerror="this.style.display='none'">`:`<span>${h(n.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${h(n.name)}</div>
                <div class="aviaframe-airline-card-price">from ${h(re(n.minPrice,"UAH"))}</div>
                <div class="aviaframe-airline-card-count">${n.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",$=`
      ${s.noticeHtml||""}
      <div class="aviaframe-results-title">Search Results <small>${e.length} flights</small></div>
      <section class="aviaframe-quick-grid" id="aviaframe-quick-grid"></section>
      <section id="aviaframe-airline-filter-wrap"></section>
      <section class="aviaframe-layout">
        <main>
          <div class="aviaframe-sortbar">
            <span class="aviaframe-sort-label">Sort by:</span>
            <button type="button" class="aviaframe-sort-btn active" data-sort="price">Price</button>
            <button type="button" class="aviaframe-sort-btn" data-sort="airline">Airline</button>
            <button type="button" class="aviaframe-sort-btn" data-sort="fastest">Fastest</button>
          </div>
          <div id="aviaframe-selected-flight"></div>
          <div id="aviaframe-cards-container"></div>
        </main>
      </section>
    `;i.innerHTML=$;const y=document.getElementById("aviaframe-cards-container"),b=document.getElementById("aviaframe-selected-flight"),c=document.getElementById("aviaframe-quick-grid"),g=document.getElementById("aviaframe-airline-filter-wrap"),B=()=>{const a=x();c.innerHTML=[d("all","All",a.all),d("nonstop","Non-stop",a.nonstop),d("one_stop","1 stop",a.one_stop),d("baggage","With baggage",a.baggage)].join("");const n=I();g.innerHTML=r(n);const f=u(),m=t.selectedId?f.find(k=>k.id===t.selectedId):null;b.innerHTML=m?`<div class="aviaframe-selected-title">Selected flight</div>${p(m,"selected")}`:"";const C=f.filter(k=>k.id!==t.selectedId);y.innerHTML=C.length?C.map(k=>p(k)).join(""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',i.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(k=>{k.addEventListener("click",()=>{const T=k.getAttribute("data-select-id"),L=o.find(_=>_.id===T);L&&(t.selectedId=T,Ee(L.offer))})}),i.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(k=>{k.addEventListener("click",()=>{const T=k.getAttribute("data-details-id");t.expandedIds.has(T)?t.expandedIds.delete(T):t.expandedIds.add(T),B()})}),i.querySelectorAll("[data-quick]").forEach(k=>{k.addEventListener("click",()=>{t.quickFilter=k.getAttribute("data-quick"),B()})}),i.querySelectorAll("[data-airline]").forEach(k=>{k.addEventListener("click",()=>{const T=k.getAttribute("data-airline");t.selectedAirlines.has(T)?t.selectedAirlines.delete(T):t.selectedAirlines.add(T),B()})})};i.querySelectorAll("[data-sort]").forEach(a=>{a.addEventListener("click",()=>{t.sort=a.getAttribute("data-sort"),i.querySelectorAll("[data-sort]").forEach(n=>n.classList.remove("active")),i.querySelectorAll(`[data-sort="${t.sort}"]`).forEach(n=>n.classList.add("active")),B()})}),B(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}function se(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const s=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";j.checkoutUrl=e.dataset.checkoutUrl||null,j.bookingUrl=String(e.dataset.bookingUrl||"").trim()||null;const i=String(e.dataset.primaryColor||"").trim(),o=String(e.dataset.logoUrl||"").trim(),t=String(e.dataset.title||"").trim(),l=String(localStorage.getItem("aviaframe_lang")||e.dataset.language||"en").toLowerCase(),v=document.createElement("style");if(v.textContent=he,document.head.appendChild(v),i&&/^#[0-9a-fA-F]{3,8}$/.test(i)){const u=document.createElement("style");u.textContent=`.aviaframe-select-button{background:${i}!important}.aviaframe-quick-item.active{background:${i}!important;border-color:${i}!important}.aviaframe-sort-btn.active{color:${i}!important}.aviaframe-flight-card.selected{border-color:${i}!important}.aviaframe-airline-card.active{border-color:${i}!important;color:${i}!important}`,document.head.appendChild(u)}e.className="aviaframe-widget",e.innerHTML=we();const x=e.querySelector(".aviaframe-title");if(x&&(t&&(x.innerHTML=t),o&&!/^javascript:/i.test(o))){const u=document.createElement("img");u.src=o,u.alt="",u.style.cssText="height:28px;max-width:110px;object-fit:contain;vertical-align:middle;margin-right:8px",u.onerror=function(){this.remove()},x.insertBefore(u,x.firstChild)}if(l==="ru"){const u={Return:"Туда-обратно","One-way":"В одну сторону","Multi-city":"Несколько городов",Economy:"Эконом","Premium Economy":"Эконом плюс",Business:"Бизнес",First:"Первый класс","Search flights":"Поиск рейсов",From:"Откуда",To:"Куда","Departure date":"Дата вылета","Return date":"Дата возврата",Adults:"Взрослые",Children:"Дети",Infants:"Младенцы","Cabin bags":"Ручная кладь","Checked bags":"Багаж",Passengers:"Пассажиры",Done:"Готово","✈️ Flight Search":"✈️ Поиск рейсов"};e.querySelectorAll("*").forEach(d=>{if(d.children.length===0){const r=d.textContent.trim();r in u&&(d.textContent=u[r])}})}const I={Return:"ذهاب وعودة","One-way":"ذهاب فقط","Multi-city":"رحلات متعددة",Economy:"اقتصادية","Premium Economy":"اقتصادية مميزة",Business:"أعمال","First Class":"الدرجة الأولى",First:"أولى","Search Flights":"ابحث عن رحلات",From:"من",To:"إلى","Departure Date":"تاريخ المغادرة","Return Date":"تاريخ العودة","From (2nd segment)":"من (الرحلة الثانية)","To (2nd segment)":"إلى (الرحلة الثانية)","Departure Date (2nd segment)":"تاريخ المغادرة (الرحلة الثانية)",Adults:"بالغون","Over 11":"فوق 11 سنة",Children:"أطفال","2-11":"2-11 سنة",Infants:"رضّع","Under 2":"أقل من سنتين","Cabin bags":"حقائب المقصورة","Checked bags":"أمتعة مسجّلة",Done:"تم","✈️ Flight Search":"✈️ ابحث عن رحلات",All:"الكل","Non-stop":"مباشر","1 stop":"توقف واحد","With baggage":"مع أمتعة",Price:"السعر",Airline:"الشركة",Fastest:"الأسرع","Economy class":"درجة اقتصادية","No flights found":"لم يتم العثور على رحلات","No offers found for current sort/filter settings.":"لا توجد عروض للتصفية الحالية","Selected flight":"الرحلة المختارة","Selected Flight":"الرحلة المختارة","Passenger Details":"تفاصيل المسافرين","Contact Information":"معلومات الاتصال","Email Address *":"البريد الإلكتروني *","Phone Number *":"رقم الهاتف *","Payment Method":"طريقة الدفع","Bank Transfer":"تحويل بنكي","Transfer to agency bank account":"التحويل إلى حساب الوكالة","Cash at Office":"نقداً في المكتب","Pay in person at our office":"الدفع نقداً في مكتبنا",Back:"رجوع","Continue to booking":"متابعة الحجز","First Name *":"الاسم الأول *","Last Name *":"اسم العائلة *","Date of Birth *":"تاريخ الميلاد *","Passport Number *":"رقم الجواز *","Passport Expiry *":"انتهاء الجواز *","Nationality *":"الجنسية *","Gender *":"الجنس *",Male:"ذكر",Female:"أنثى",total:"الإجمالي","No baggage":"بدون أمتعة",details:"التفاصيل","hide details":"إخفاء التفاصيل",Select:"اختر"},S=u=>{u.querySelectorAll("*").forEach(d=>{if(d.children.length===0){const r=d.textContent.trim();r in I&&(d.dataset.afEn||(d.dataset.afEn=r),d.textContent=I[r])}})};if(l==="ar"){if(S(e),e.dir="rtl",e.style.fontFamily="'Cairo',sans-serif",!document.getElementById("af-cairo")){const d=document.createElement("link");d.id="af-cairo",d.rel="stylesheet",d.href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap",document.head.appendChild(d)}new MutationObserver(()=>S(e)).observe(e,{childList:!0,subtree:!0})}else e.dir="ltr",e.style.fontFamily="";const p=e.querySelector(".aviaframe-title");if(p){const u=document.createElement("div");u.id="af-lang-sw",u.style.cssText="margin-left:auto;display:flex;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.08);flex-shrink:0";const d=(r,$)=>{const y=document.createElement("button");y.dataset.lang=r,y.textContent=$;const b=l===r;return y.style.cssText=`padding:5px 12px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:background 0.15s,color 0.15s;background:${b?"#2563eb":"#fff"};color:${b?"#fff":"#6b7280"}`,r==="ar"&&(y.style.borderLeft="1px solid #e5e7eb"),y.addEventListener("mouseover",()=>{var c;y.dataset.lang!==((c=y.closest("[id=af-lang-sw]"))==null?void 0:c.dataset.active)&&(y.style.background=b?"#1d4ed8":"#f9fafb")}),y.addEventListener("mouseout",()=>{var g;const c=((g=y.closest("[id=af-lang-sw]"))==null?void 0:g.dataset.active)||"en";y.style.background=y.dataset.lang===c?"#2563eb":"#fff",y.style.color=y.dataset.lang===c?"#fff":"#6b7280"}),y.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation();const g=y.dataset.lang,B=y.closest("#af-lang-sw");if(B&&(B.dataset.active=g,B.querySelectorAll("button").forEach(a=>{const n=a.dataset.lang===g;a.style.background=n?"#2563eb":"#fff",a.style.color=n?"#fff":"#6b7280"})),g==="ar"){if(S(e),e.dir="rtl",e.style.fontFamily="'Cairo',sans-serif",!document.getElementById("af-cairo")){const a=document.createElement("link");a.id="af-cairo",a.rel="stylesheet",a.href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap",document.head.appendChild(a)}e._arObs||(e._arObs=new MutationObserver(()=>S(e)),e._arObs.observe(e,{childList:!0,subtree:!0}))}else e.querySelectorAll("[data-af-en]").forEach(a=>{a.textContent=a.dataset.afEn,a.removeAttribute("data-af-en")}),e.dir="ltr",e.style.fontFamily="",e._arObs&&(e._arObs.disconnect(),e._arObs=null)}),y};u.dataset.active=l,u.appendChild(d("en","EN")),u.appendChild(d("ar","عر")),p.style.cssText="display:flex;align-items:center;width:100%",p.appendChild(u)}setTimeout(()=>{_e(),ae("aviaframe-origin","aviaframe-origin-autocomplete"),ae("aviaframe-destination","aviaframe-destination-autocomplete"),ae("aviaframe-origin-2","aviaframe-origin-2-autocomplete"),ae("aviaframe-destination-2","aviaframe-destination-2-autocomplete"),ke(s),["aviaframe-depart-date","aviaframe-return-date","aviaframe-depart-date-2"].forEach(u=>{const d=document.getElementById(u);d&&d.setAttribute("lang","en")}),(()=>{const u=document.getElementById("aviaframe-depart-date"),d=document.getElementById("aviaframe-return-date"),r=document.getElementById("aviaframe-return-date-error");if(!u||!d||!r)return;const $=()=>{const y=u.value,b=d.value,c=document.getElementById("aviaframe-trip-type");if(!c||c.value==="one_way"||c.value==="multi_city"){r.style.display="none",d.classList.remove("aviaframe-input--error");return}b&&y&&b<=y?(r.textContent="Return date must be after the departure date.",r.style.display="block",d.classList.add("aviaframe-input--error")):(r.style.display="none",d.classList.remove("aviaframe-input--error"))};u.addEventListener("change",$),d.addEventListener("change",$)})()},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",se):se(),window.AviaframeWidget={init:se}})()})()})();
