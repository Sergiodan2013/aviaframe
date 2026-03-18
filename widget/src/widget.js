(function(){"use strict";(function(){const C={checkoutUrl:null,bookingUrl:null},q=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1}];function F(e,n=8){const r=e.toLowerCase().trim();if(r.length<1)return[];const o=q.filter(t=>t.code.toLowerCase().includes(r)||t.city.toLowerCase().includes(r)||t.cityRu.toLowerCase().includes(r)||t.name.toLowerCase().includes(r)||t.country.toLowerCase().includes(r));return o.sort((t,s)=>t.priority!==s.priority?t.priority-s.priority:t.city.localeCompare(s.city)),o.slice(0,n)}function P(e){const n=new Date(e),r=n.getFullYear(),o=String(n.getMonth()+1).padStart(2,"0"),t=String(n.getDate()).padStart(2,"0");return`${r}-${o}-${t}`}function j(){return P(new Date)}const W=`
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
  `;function G(){const e=j();return`
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
    `}function K(){var y;const e=Array.from(document.querySelectorAll(".aviaframe-dropdown")),n=()=>e.forEach(i=>i.classList.remove("open"));e.forEach(i=>{const x=i.querySelector(".aviaframe-dropdown-btn");x&&x.addEventListener("click",$=>{$.stopPropagation();const b=i.classList.contains("open");n(),b||i.classList.add("open")})}),document.addEventListener("click",i=>{i.target.closest(".aviaframe-dropdown")||n()});const r=document.getElementById("aviaframe-trip-type"),o=document.getElementById("aviaframe-trip-label"),t=(y=document.getElementById("aviaframe-return-date"))==null?void 0:y.closest(".aviaframe-field"),s=document.getElementById("aviaframe-multi-city-fields");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(i=>{i.addEventListener("change",()=>{i.checked&&(r.value=i.value,o.textContent=i.value==="one_way"?"One-way":i.value==="multi_city"?"Multi-city":"Return",i.value==="one_way"?(t&&(t.style.display="none"),s&&(s.style.display="none")):i.value==="multi_city"?(t&&(t.style.display="none"),s&&(s.style.display="block")):(t&&(t.style.display="block"),s&&(s.style.display="none")))})});const m=document.getElementById("aviaframe-cabin"),g=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(i=>{i.addEventListener("change",()=>{i.checked&&(m.value=i.value,g.textContent=i.parentElement.textContent.trim())})});const _={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},d={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},E=()=>{document.getElementById("aviaframe-adults").value=d.adults,document.getElementById("aviaframe-children").value=d.children,document.getElementById("aviaframe-infants").value=d.infants,document.getElementById("aviaframe-cabin-bags").value=d.cabinBags,document.getElementById("aviaframe-checked-bags").value=d.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(d.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(d.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${d.adults+d.children+d.infants} Passenger${d.adults+d.children+d.infants!==1?"s":""}`},A=()=>{const i=document.getElementById("aviaframe-age-selectors");for(;d.childrenAges.length<d.children;)d.childrenAges.push(2);for(;d.childrenAges.length>d.children;)d.childrenAges.pop();for(;d.infantAges.length<d.infants;)d.infantAges.push(1);for(;d.infantAges.length>d.infants;)d.infantAges.pop();const x=d.childrenAges.map((b,f)=>`
        <div class="aviaframe-age-item">
          <label>Child ${f+1} age</label>
          <select data-age-type="child" data-age-index="${f}">
            ${Array.from({length:10},(h,k)=>k+2).map(h=>`<option value="${h}" ${h===b?"selected":""}>${h}</option>`).join("")}
          </select>
        </div>
      `).join(""),$=d.infantAges.map((b,f)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${f+1} age</label>
          <select data-age-type="infant" data-age-index="${f}">
            ${Array.from({length:2},(h,k)=>k).map(h=>`<option value="${h}" ${h===b?"selected":""}>${h}</option>`).join("")}
          </select>
        </div>
      `).join("");i.innerHTML=x+$,i.querySelectorAll("select[data-age-type]").forEach(b=>{b.addEventListener("change",()=>{const f=b.getAttribute("data-age-type"),h=Number(b.getAttribute("data-age-index")),k=Number(b.value);f==="child"?d.childrenAges[h]=k:d.infantAges[h]=k,E()})}),E()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(i=>{i.addEventListener("click",()=>{const x=i.getAttribute("data-counter"),$=Number(i.getAttribute("data-delta")),b=_[x];if(!b)return;const f=Math.max(b.min,Math.min(b.max,d[x]+$));d[x]=f;const h=document.getElementById(`aviaframe-count-${x}`);h&&(h.textContent=f),A()})}),A()}function R(e,n){const r=document.getElementById(e),o=document.getElementById(n);if(!r||!o)return;let t=-1;r.addEventListener("input",function(){const s=this.value;if(s.length<1){o.style.display="none";return}const m=F(s);if(m.length===0){o.style.display="none";return}o.innerHTML=m.map((g,_)=>`
        <div class="aviaframe-autocomplete-item" data-index="${_}" data-code="${g.code}">
          <div>
            <span class="aviaframe-airport-code">${g.code}</span>
            <span class="aviaframe-airport-city">${g.city} / ${g.cityRu}</span>
          </div>
          <span class="aviaframe-airport-name">${g.name}, ${g.country}</span>
        </div>
      `).join(""),o.style.display="block",t=-1,o.querySelectorAll(".aviaframe-autocomplete-item").forEach((g,_)=>{g.addEventListener("click",function(){const d=m[_];r.value=`${d.city} (${d.code})`,r.dataset.code=d.code,o.style.display="none"})})}),r.addEventListener("keydown",function(s){const m=o.querySelectorAll(".aviaframe-autocomplete-item");m.length!==0&&(s.key==="ArrowDown"?(s.preventDefault(),t=Math.min(t+1,m.length-1),z(m,t)):s.key==="ArrowUp"?(s.preventDefault(),t=Math.max(t-1,0),z(m,t)):s.key==="Enter"&&t>=0?(s.preventDefault(),m[t].click()):s.key==="Escape"&&(o.style.display="none"))}),document.addEventListener("click",function(s){!r.contains(s.target)&&!o.contains(s.target)&&(o.style.display="none")})}function z(e,n){e.forEach((r,o)=>{o===n?(r.classList.add("active"),r.scrollIntoView({block:"nearest"})):r.classList.remove("active")})}function J(e){const n=document.getElementById("aviaframe-search-form"),r=document.getElementById("aviaframe-results");n.addEventListener("submit",async function(o){o.preventDefault();const t=document.getElementById("aviaframe-origin"),s=document.getElementById("aviaframe-destination"),m=document.getElementById("aviaframe-depart-date").value,g=document.getElementById("aviaframe-return-date").value,_=parseInt(document.getElementById("aviaframe-adults").value,10),d=parseInt(document.getElementById("aviaframe-children").value,10)||0,E=parseInt(document.getElementById("aviaframe-infants").value,10)||0,A=document.getElementById("aviaframe-trip-type").value||"return",y=document.getElementById("aviaframe-cabin").value,i=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),x=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),$=t.dataset.code,b=s.dataset.code;if(!$||!b){r.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select airports from the dropdown.
          </div>
        `;return}if(!m){r.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select departure date.
          </div>
        `;return}if(A==="return"&&(!g||g<=m)){r.innerHTML=`<div class="aviaframe-error"><strong>Error:</strong> ${!g?"Please select a return date.":"Return date must be after the departure date."}</div>`;return}r.innerHTML=`
        <div class="aviaframe-loading">
          <div class="aviaframe-spinner"></div>
          <div>Searching for flights...</div>
        </div>
      `;let f={origin:$,destination:b,depart_date:m,return_date:g||null,adults:_,children:d,infants:E,children_ages:i,infant_ages:x,cabin_class:y,trip_type:A};if(A==="one_way"&&(f.return_date=null),A==="multi_city"){const a=document.getElementById("aviaframe-origin-2"),l=document.getElementById("aviaframe-destination-2"),u=document.getElementById("aviaframe-depart-date-2").value,v=a==null?void 0:a.dataset.code,p=l==null?void 0:l.dataset.code;if(!v||!p||!u){r.innerHTML=`
            <div class="aviaframe-error">
              <strong>Error:</strong> For Multi-city please fill second segment: From, To and Date.
            </div>
          `;return}f.segments=[{origin:$,destination:b,depart_date:m},{origin:v,destination:p,depart_date:u}]}const h=a=>String(a||"").replace(/\/+$/,""),k=a=>{const l=h(a);return l.endsWith("/search")?l:`${l}/search`},P=a=>{const l=h(a);return l.includes("/api/drct/")?l.replace("/api/drct/","/api/n8n/webhook-test/drct/"):l.endsWith("/api/drct")?l.replace("/api/drct","/api/n8n/webhook-test/drct"):l},J=a=>{const l=h(a),u=[l,k(l),P(l)];return[...new Set(u.filter(Boolean))]};try{let a=null;const w=J(e);for(const u of w){if(a=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(f)}),a.ok)break;if(a.status!==404)break}if(!a.ok)throw new Error(`HTTP ${a.status}: ${a.statusText}`);const l=await a.json();if(l.offers&&l.offers.length>0){const u=l.offers.map(v=>{const p={...v,_searchOrigin:f.origin||(v==null?void 0:v._searchOrigin)||null,_searchDestination:f.destination||(v==null?void 0:v._searchDestination)||null,_searchReturnDate:f.return_date||(v==null?void 0:v._searchReturnDate)||null};if(!!!(p!=null&&p.return_origin&&(p!=null&&p.return_destination)||p!=null&&p.return_departure_time&&(p!=null&&p.return_arrival_time))&&f.return_date){const T=Q(p);T&&Object.assign(p,T),p.return_origin||(p.return_origin=f.destination||null),p.return_destination||(p.return_destination=f.origin||null)}return p});U(u)}else r.innerHTML=`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No flights found</div>
              <div>Try adjusting your search criteria</div>
            </div>
          `}catch(a){const l=String((a==null?void 0:a.message)||"");const u=l.includes("HTTP 404");if((a==null?void 0:a.name)==="TypeError"||l.includes("Failed to fetch")||l.toLowerCase().includes("cors")||u){const v=oe(f);U(v),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",a);return}r.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${l}
          </div>
        `}})}function Y(e){return e?`https://pics.avs.io/200/80/${e}.png`:null}function V(e){
  const n={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,passengers:e.passengers||[],selected_at:new Date().toISOString()};
  localStorage.setItem("selectedOffer",JSON.stringify(n));
  console.log("✅ Offer selected:",e.offer_id);
  window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:n},bubbles:true}));
  const r=document.querySelector(".aviaframe-widget"),o=document.getElementById("aviaframe-results"),t=document.getElementById("aviaframe-search-form");
  if(!r){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:n},bubbles:true}));C.checkoutUrl&&(window.location.href=C.checkoutUrl);return;}
  t&&(t.style.display="none");o&&(o.style.display="none");
  const s=document.getElementById("aviaframe-passenger-step");s&&s.remove();
  const m=((e==null?void 0:e.price)||{}).currency||"UAH",g=Math.round(((e==null?void 0:e.displayed_price)||(((e==null?void 0:e.price)||{}).total||0))).toLocaleString("en-US"),_=e.airline_name||e.airline||"Airline",d=e.origin||"---",E=e.destination||"---",A=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",y=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A";
  const _paxAdults=parseInt(document.getElementById("aviaframe-adults")?.value||"1",10)||1;const _paxChildren=parseInt(document.getElementById("aviaframe-children")?.value||"0",10)||0;const _paxInfants=parseInt(document.getElementById("aviaframe-infants")?.value||"0",10)||0;const passList=[];for(let _i=0;_i<_paxAdults;_i++)passList.push({id:"ADT"+(_i+1),type:"ADT"});for(let _i=0;_i<_paxChildren;_i++)passList.push({id:"CHD"+(_i+1),type:"CHD"});for(let _i=0;_i<_paxInfants;_i++)passList.push({id:"INF"+(_i+1),type:"INF"});if(!passList.length)passList.push({id:"T1",type:"ADT"});
  const typeCounts={};
  function passengerLabel(type){typeCounts[type]=(typeCounts[type]||0)+1;const n=typeCounts[type];if(type==="ADT")return"Adult "+n;if(type==="CHD")return"Child "+n;if(type==="INF")return"Infant "+n;return"Passenger "+n;}
  function paxSection(pax,idx){const type=pax.type||"ADT";const label=passengerLabel(type);const ageHint=type==="ADT"?"18+ years":type==="CHD"?"2\u201311 years":"Under 2 years";return'<div class="avf-pax-section" data-pax-idx="'+idx+'" data-pax-type="'+type+'" style="grid-column:1/-1;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:8px"><div style="font-size:18px;font-weight:700;color:#1f2937;margin-bottom:12px">'+label+' <span style="font-size:13px;font-weight:400;color:#94a3b8">'+ageHint+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">First Name *</span><input required data-field="firstName" placeholder="John" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Last Name *</span><input required data-field="lastName" placeholder="Doe" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Gender *</span><select data-field="gender" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px"><option value="M">Male</option><option value="F">Female</option></select></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Date of Birth *</span><input required type="date" lang="en" data-field="dateOfBirth" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Number *</span><input required data-field="passportNumber" placeholder="AB1234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Expiry *</span><input required type="date" lang="en" data-field="passportExpiry" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label></div></div>';}
  const paxHtml=passList.map((p,idx)=>paxSection(p,idx)).join("");
  const i=document.createElement("div");i.id="aviaframe-passenger-step";i.style.marginTop="16px";i.style.border="1px solid #d9e3f3";i.style.borderRadius="12px";i.style.padding="16px";i.style.background="#fff";
  i.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px"><div><div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.1">Selected Flight</div><div style="margin-top:8px;font-size:20px;font-weight:700;color:#1f2937">'+d+' \u2192 '+E+' <span style="font-size:18px;font-weight:600;color:#64748b">'+_+'</span></div><div style="margin-top:6px;font-size:16px;color:#475569">Departure: '+A+' | Arrival: '+y+'</div></div><div style="text-align:right"><div style="font-size:56px;line-height:1;font-weight:800;color:#2563eb">'+g+' '+m+'</div><div style="margin-top:6px;font-size:20px;color:#64748b">total</div></div></div><div style="font-size:38px;font-weight:800;color:#0f172a;margin:16px 0 10px">Passenger Details</div><form id="aviaframe-passenger-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="grid-column:1/-1;font-size:20px;font-weight:700;color:#1f2937;margin-top:2px">Contact Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Email Address *</span><input required type="email" name="email" placeholder="name@example.com" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Phone Number *</span><input required name="phone" placeholder="+971501234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1/-1;height:1px;background:#e2e8f0;margin:6px 0"></div>'+paxHtml+'<div style="grid-column:1/-1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1/-1;font-size:20px;font-weight:700;color:#1f2937">Payment Method</div><div style="grid-column:1/-1;display:flex;flex-direction:column;gap:10px"><label style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #2563eb;border-radius:10px;cursor:pointer;background:#eff6ff"><input type="radio" name="paymentMethod" value="bank_transfer" checked style="width:18px;height:18px;accent-color:#2563eb" /><div><div style="font-size:15px;font-weight:700;color:#1e3a8a">Bank Transfer</div><div style="font-size:13px;color:#3b82f6">Transfer to agency bank account</div></div></label><label style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #e2e8f0;border-radius:10px;cursor:pointer"><input type="radio" name="paymentMethod" value="cash" style="width:18px;height:18px;accent-color:#2563eb" /><div><div style="font-size:15px;font-weight:700;color:#1f2937">Cash at Office</div><div style="font-size:13px;color:#64748b">Pay in person at our office</div></div></label></div><div id="aviaframe-passenger-error" style="grid-column:1/-1;display:none;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px;font-size:14px"></div><div style="grid-column:1/-1;display:flex;justify-content:space-between;gap:10px;margin-top:6px"><button type="button" id="aviaframe-passenger-back" style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:600">Back</button><button type="submit" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer">Continue to booking</button></div></form>';
  r.appendChild(i);window.scrollTo({top:0,behavior:"smooth"});
  const x=i.querySelector("#aviaframe-passenger-back"),$=i.querySelector("#aviaframe-passenger-form"),b=i.querySelector("#aviaframe-passenger-error");
  x&&x.addEventListener("click",()=>{i.remove();t&&(t.style.display="");o&&(o.style.display="");});
  (function addInlineValidation(form,pList){if(!form)return;function showE(el,msg){let e=el.parentNode.querySelector('.avf-ferr');if(!e){e=document.createElement('span');e.className='avf-ferr';e.style.cssText='color:#b91c1c;font-size:12px;margin-top:2px;display:block';el.parentNode.appendChild(e);}e.textContent=msg;el.style.borderColor='#ef4444';}function clearE(el){const e=el.parentNode.querySelector('.avf-ferr');if(e)e.textContent='';el.style.borderColor='#cbd5e1';}const em=form.querySelector('[name="email"]'),ph=form.querySelector('[name="phone"]');function valEmail(){const v=em.value.trim();if(!v)showE(em,'Email is required');else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))showE(em,'Invalid email address');else clearE(em);}function valPhone(){const v=ph.value.trim();if(!v)showE(ph,'Phone is required');else if(!/^\+\d{7,15}$/.test(v))showE(ph,'Format: +971501234567');else clearE(ph);}if(em){em.addEventListener('input',valEmail);em.addEventListener('blur',valEmail);}if(ph){ph.addEventListener('input',valPhone);ph.addEventListener('blur',valPhone);}form.querySelectorAll('.avf-pax-section').forEach(function(sec){const pt=sec.dataset.paxType||'ADT';function vName(el){const v=el.value.trim();if(!v)showE(el,'Required');else if(!/^[A-Za-z\s\-']+$/.test(v))showE(el,'Latin letters only');else clearE(el);}const fn=sec.querySelector('[data-field="firstName"]'),ln=sec.querySelector('[data-field="lastName"]'),dob=sec.querySelector('[data-field="dateOfBirth"]'),pn=sec.querySelector('[data-field="passportNumber"]'),pe=sec.querySelector('[data-field="passportExpiry"]');if(fn){fn.addEventListener('input',function(){vName(this);});fn.addEventListener('blur',function(){vName(this);});}if(ln){ln.addEventListener('input',function(){vName(this);});ln.addEventListener('blur',function(){vName(this);});}if(dob){dob.addEventListener('change',function(){const v=this.value;if(!v){showE(this,'Date of birth required');return;}const d=new Date(v);if(isNaN(d.getTime())){showE(this,'Invalid date');return;}const yrs=(Date.now()-d.getTime())/(365.25*24*3600*1000);if(pt==='ADT'&&yrs<18)showE(this,'Adult must be 18+ years old');else if(pt==='CHD'&&yrs<2)showE(this,'Child must be at least 2 years old');else if(pt==='CHD'&&yrs>=12)showE(this,'Child must be under 12 years old');else if(pt==='INF'&&yrs>=2)showE(this,'Infant must be under 2 years old');else clearE(this);});}if(pn){pn.addEventListener('input',function(){this.value=this.value.toUpperCase();const v=this.value.trim();if(!v)showE(this,'Required');else if(v.length<6)showE(this,'At least 6 characters');else if(!/^[A-Z0-9]+$/.test(v))showE(this,'Letters and digits only');else clearE(this);});pn.addEventListener('blur',function(){const v=this.value.trim();if(!v)showE(this,'Required');else if(v.length<6)showE(this,'At least 6 characters');else if(!/^[A-Z0-9]+$/.test(v))showE(this,'Letters and digits only');else clearE(this);});}if(pe){pe.addEventListener('change',function(){const v=this.value;if(!v){showE(this,'Expiry required');return;}const exp=new Date(v+'T00:00:00'),now=new Date();if(exp<now){showE(this,'Passport has expired');return;}const six=new Date();six.setMonth(six.getMonth()+6);if(exp<six){showE(this,'Must be valid 6+ months');return;}clearE(this);});}});})(i.querySelector('#aviaframe-passenger-form'),passList);
  $&&$.addEventListener("submit",f=>{
    f.preventDefault();
    const tripDate=((e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10));
    const tripDateObj=new Date(tripDate+"T00:00:00"),passMinExp=new Date(tripDateObj);passMinExp.setMonth(passMinExp.getMonth()+6);
    const now=new Date();
    const email=String($.querySelector('[name="email"]')?.value||"");
    const phone=String($.querySelector('[name="phone"]')?.value||"");
    const paymentMethod=String($.querySelector('[name="paymentMethod"]:checked')?.value||"bank_transfer");
    const paxSections=$.querySelectorAll(".avf-pax-section");
    const passengers=[];let errMsg=null;
    for(let pi=0;pi<paxSections.length;pi++){
      const sec=paxSections[pi],paxType=sec.dataset.paxType||"ADT",paxIdx=parseInt(sec.dataset.paxIdx,10),srcPax=passList[paxIdx]||{};
      const get=field=>String(sec.querySelector('[data-field="'+field+'"]')?.value||"");
      const firstName=get("firstName"),lastName=get("lastName"),gender=get("gender")||"M",dateOfBirth=get("dateOfBirth"),passportNumber=get("passportNumber"),passportExpiry=get("passportExpiry");
      if(!firstName||!lastName){errMsg="Please fill in name for passenger "+(pi+1)+".";break;}
      if(!dateOfBirth){errMsg="Please enter date of birth for passenger "+(pi+1)+".";break;}
      const dob=new Date(dateOfBirth);
      if(isNaN(dob.getTime())){errMsg="Invalid date of birth for passenger "+(pi+1)+".";break;}
      if(paxType==="ADT"){const minAge=new Date(dob);minAge.setFullYear(minAge.getFullYear()+18);if(minAge>now){errMsg="Adult "+(pi+1)+" must be at least 18 years old.";break;}}
      else if(paxType==="CHD"){const minAge=new Date(dob);minAge.setFullYear(minAge.getFullYear()+2);const maxAge=new Date(dob);maxAge.setFullYear(maxAge.getFullYear()+12);if(minAge>now){errMsg="Child "+(pi+1)+" must be at least 2 years old.";break;}if(maxAge<=now){errMsg="Child "+(pi+1)+" must be under 12 years old.";break;}}
      else if(paxType==="INF"){const maxAge=new Date(dob);maxAge.setFullYear(maxAge.getFullYear()+2);if(maxAge<=now){errMsg="Infant "+(pi+1)+" must be under 2 years old.";break;}}
      if(!passportExpiry){errMsg="Please enter passport expiry for passenger "+(pi+1)+".";break;}
      const expDate=new Date(passportExpiry+"T00:00:00");if(isNaN(expDate.getTime())||expDate<passMinExp){errMsg="Passport for passenger "+(pi+1)+" must be valid 6+ months from trip date.";break;}
      passengers.push({type:paxType,pax_id:srcPax.id||"T"+(paxIdx+1),first_name:firstName,last_name:lastName,gender:gender,date_of_birth:dateOfBirth,email:email,phone:phone,document:{type:"REGULAR_PASSPORT",number:passportNumber,expiry_date:passportExpiry,issuing_country:"AE",citizenship:"AE",country_of_issue:"AE"},payment_method:paymentMethod});
    }
    if(errMsg){b&&(b.textContent=errMsg,b.style.display="block");return;}
    b&&(b.style.display="none");
    const k=passengers[0]?{firstName:passengers[0].first_name,lastName:passengers[0].last_name,email,phone,gender:passengers[0].gender,dateOfBirth:passengers[0].date_of_birth,passportNumber:passengers[0].document.number,passportExpiry:passengers[0].document.expiry_date,paymentMethod}:null;
    localStorage.setItem("passengerData",JSON.stringify(k));
    window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:n,passenger:k,passengers},bubbles:true}));
    (()=>{const showConf=(ref)=>{const refHtml=ref?'<div style="font-size:13px;color:#64748b;margin-bottom:16px">Reference: <strong>'+ref+'</strong></div>':"";i.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:52px;margin-bottom:16px">\u2705</div><div style="font-size:24px;font-weight:800;color:#166534;margin-bottom:10px">Booking Request Received!</div><div style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:16px">Thank you, <strong>'+(passengers[0]?.first_name||"")+'</strong>! Your booking request has been received.<br>We will contact you at <strong>'+email+'</strong><br>to confirm the booking and send payment instructions.</div>'+refHtml+'<button type="button" id="aviaframe-passenger-back2" style="border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600;font-size:14px">Search again</button></div>';i.querySelector("#aviaframe-passenger-back2")&&i.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{i.remove();t&&(t.style.display="");o&&(o.style.display="");});};
    if(C.checkoutUrl){window.location.href=C.checkoutUrl;}
    else if(C.bookingUrl){i.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:36px;margin-bottom:12px">\u23f3</div><div style="font-size:16px;color:#374151">Sending booking request\u2026</div></div>';fetch(C.bookingUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({offer:n,passengers,contacts:{email,phone}})}).then(resp=>resp.json().catch(()=>({}))).then(data=>{if(data.success===false||data.statusCode>=400||data.error){i.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:52px;margin-bottom:16px">\u274c</div><div style="font-size:24px;font-weight:800;color:#b91c1c;margin-bottom:12px">Booking Failed</div><div style="font-size:15px;color:#374151;margin-bottom:20px">'+(data.message||data.error||'Something went wrong. Please try again or contact us.')+'</div><button type="button" id="aviaframe-err-back" style="border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600">\u2190 Search again</button></div>';const eb=i.querySelector("#aviaframe-err-back");if(eb)eb.addEventListener("click",()=>{i.remove();t&&(t.style.display="");o&&(o.style.display="");});return;}showConf(data.order_number||data.order_id||null);}).catch(()=>{showConf(null);});}
    else{showConf(null);}})();
  });}function S(e,n=0){const r=Number(e);return Number.isFinite(r)?r:n}function c(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function L(e,n){return`${Math.round(S(e,0)).toLocaleString("uk-UA")} ${n||"UAH"}`}function I(e){if(!e)return"--:--";const n=String(e).match(/T(\d{2}:\d{2})/);return n?n[1]:String(e)}function B(e){return e?String(e).trim().toUpperCase():null}function M(e){var n;return B((e==null?void 0:e.origin_code)||((n=e==null?void 0:e.departure_airport)==null?void 0:n.code)||(e==null?void 0:e.origin))}function N(e){var n;return B((e==null?void 0:e.destination_code)||((n=e==null?void 0:e.arrival_airport)==null?void 0:n.code)||(e==null?void 0:e.destination))}function Z(e){return(e==null?void 0:e.departure)||[e==null?void 0:e.departure_date,e==null?void 0:e.departure_time].filter(Boolean).join("T")}function X(e){return(e==null?void 0:e.arrival)||[e==null?void 0:e.arrival_date,e==null?void 0:e.arrival_time].filter(Boolean).join("T")}function Q(e){const n=Array.isArray(e==null?void 0:e.segments)?e.segments:[];if(!n.length)return null;const r=B((e==null?void 0:e._searchOrigin)||(e==null?void 0:e.origin)),o=B((e==null?void 0:e._searchDestination)||(e==null?void 0:e.destination));if(!r||!o)return null;let t=-1;for(let y=1;y<n.length;y+=1){const i=M(n[y]),x=N(n[y]);if(i===o||x===r){t=y;break}}if(t<0)return null;const s=n.slice(t),m=s[0],g=s[s.length-1],_=M(m)||o,d=N(g)||r,E=Z(m)||null,A=X(g)||null;return!_||!d?null:{return_origin:_,return_destination:d,return_departure_time:E,return_arrival_time:A}}function ee(e){if(e.duration_minutes)return S(e.duration_minutes,0);if(e.durationMinutes)return S(e.durationMinutes,0);if(e.journey_time)return Math.round(S(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const n=new Date(e.departure_time).getTime(),r=new Date(e.arrival_time).getTime();return!Number.isFinite(n)||!Number.isFinite(r)||r<=n?0:Math.round((r-n)/6e4)}function ae(e,n){if(!e||!n)return 0;const r=new Date(e).getTime(),o=new Date(n).getTime();return!Number.isFinite(r)||!Number.isFinite(o)||o<=r?0:Math.round((o-r)/6e4)}function H(e){const n=S(e,0),r=Math.floor(n/60),o=n%60;return n<=0?"n/a":`${r}h ${o}m`}function te(e){return e.stops!==void 0?S(e.stops,0):e.transfers_count!==void 0?S(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function ie(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function re(e){const n=(e.airline_code||e.airline||"").toString().trim();return n?n.slice(0,2).toUpperCase():"NA"}function ne(e){var A,y;const n=S((e==null?void 0:e.displayed_price)||((A=e==null?void 0:e.price)==null?void 0:A.total),0),r=((y=e==null?void 0:e.price)==null?void 0:y.currency)||"UAH",o=te(e),t=Array.isArray(e==null?void 0:e.segments)?e.segments.map(i=>{var x,$,b,f,h;return{origin:(()=>{const code=M(i);const city=(i==null?void 0:i.origin)||((x=i==null?void 0:i.departure_city)==null?void 0:x.name)||"";return code?(city&&city.toUpperCase()!==code?`${code} (${city})`:code):(city||"N/A")})(),destination:(()=>{const code=N(i);const city=(i==null?void 0:i.destination)||((b=i==null?void 0:i.arrival_city)==null?void 0:b.name)||"";return code?(city&&city.toUpperCase()!==code?`${code} (${city})`:code):(city||"N/A")})(),departure:(i==null?void 0:i.departure)||[i==null?void 0:i.departure_date,i==null?void 0:i.departure_time].filter(Boolean).join(" ")||"N/A",arrival:(i==null?void 0:i.arrival)||[i==null?void 0:i.arrival_date,i==null?void 0:i.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((h=i==null?void 0:i.carrier)==null?void 0:h.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:(i==null?void 0:i.flight_number)||"N/A"}}):[],s=!!(e!=null&&e.return_origin&&(e!=null&&e.return_destination)||e!=null&&e.return_departure_time&&(e!=null&&e.return_arrival_time)),m=s?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",g=s?I(e.return_departure_time):"--:--",_=s?I(e.return_arrival_time):"--:--",d=s?ae(e.return_departure_time,e.return_arrival_time):0,E=s?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:re(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:I(e.departure_time),arrive:I(e.arrival_time),durationMinutes:ee(e),stops:o,stopsText:ie(o),priceTotal:n,priceCurrency:r,baggageText:e.baggage_text||(e.with_baggage?"With baggage":"No baggage"),segments:t,hasReturnData:s,returnRoute:m,returnDepart:g,returnArrive:_,returnDurationMinutes:d,returnSummary:E}}function oe(e){const n=e.origin||"WAW",r=e.destination||"YVR",o=e.depart_date||"2026-02-27",t=e.return_date||"",s=e.trip_type!=="one_way"&&!!t,m=(g,_,d,E=[])=>{const A=y=>({origin:y.from,destination:y.to,departure:y.depart,arrival:y.arrive,carrier:{airline_code:g,airline_name:_},flight_number:y.flight});return[...d.map(A),...E.map(A)]};return[{offer_id:"fallback_1",origin:n,destination:r,departure_time:`${o}T13:05:00`,arrival_time:`${o}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:s?r:null,return_destination:s?n:null,return_departure_time:s?`${t}T14:20:00`:null,return_arrival_time:s?`${t}T22:40:00`:null,segments:m("DL","DELTA",[{from:n,to:"CDG",depart:`${o}T13:05:00`,arrive:`${o}T16:10:00`,flight:"737"},{from:"CDG",to:r,depart:`${o}T17:05:00`,arrive:`${o}T23:25:00`,flight:"4200"}],s?[{from:r,to:"FRA",depart:`${t}T14:20:00`,arrive:`${t}T17:10:00`,flight:"9655"},{from:"FRA",to:n,depart:`${t}T18:30:00`,arrive:`${t}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"UAH"}},{offer_id:"fallback_2",origin:n,destination:r,departure_time:`${o}T08:10:00`,arrival_time:`${o}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:s?r:null,return_destination:s?n:null,return_departure_time:s?`${t}T09:00:00`:null,return_arrival_time:s?`${t}T20:30:00`:null,segments:m("LO","LOT",[{from:n,to:r,depart:`${o}T08:10:00`,arrive:`${o}T22:00:00`,flight:"441"}],s?[{from:r,to:n,depart:`${t}T09:00:00`,arrive:`${t}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"UAH"}},{offer_id:"fallback_3",origin:n,destination:r,departure_time:`${o}T06:45:00`,arrival_time:`${o}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:s?r:null,return_destination:s?n:null,return_departure_time:s?`${t}T07:10:00`:null,return_arrival_time:s?`${t}T19:55:00`:null,segments:m("AC","AIR CANADA",[{from:n,to:"MUC",depart:`${o}T06:45:00`,arrive:`${o}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${o}T11:50:00`,arrive:`${o}T14:50:00`,flight:"837"},{from:"YYZ",to:r,depart:`${o}T18:40:00`,arrive:`${o}T23:15:00`,flight:"835"}],s?[{from:r,to:"YYZ",depart:`${t}T07:10:00`,arrive:`${t}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${t}T12:00:00`,arrive:`${t}T16:00:00`,flight:"838"},{from:"MUC",to:n,depart:`${t}T17:20:00`,arrive:`${t}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"UAH"}}]}function U(e,n={}){const r=document.getElementById("aviaframe-results"),o=e.map(ne).map((a,l)=>({...a,id:a.offer.offer_id||`offer_${l}`,airlineLogo:Y(a.carrierCode)})),t={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set},s=a=>t.quickFilter==="nonstop"?a.filter(l=>l.stops===0):t.quickFilter==="one_stop"?a.filter(l=>l.stops===1):t.quickFilter==="baggage"?a.filter(l=>/baggage|bag/i.test(l.baggageText||"")):a,m=a=>a.length?{count:a.length,minPrice:Math.min(...a.map(l=>l.priceTotal))}:{count:0,minPrice:null},g=()=>({all:m(o),nonstop:m(o.filter(a=>a.stops===0)),one_stop:m(o.filter(a=>a.stops===1)),baggage:m(o.filter(a=>/baggage|bag/i.test(a.baggageText||"")))}),_=()=>{const a=s(o),l=new Map;return a.forEach(u=>{const v=u.carrierCode||"NA";if(!l.has(v))l.set(v,{code:v,name:u.airlineName||v,logo:u.airlineLogo,count:1,minPrice:u.priceTotal});else{const p=l.get(v);p.count+=1,p.minPrice=Math.min(p.minPrice,u.priceTotal)}}),Array.from(l.values()).sort((u,v)=>u.minPrice-v.minPrice).slice(0,8)},d=a=>`
      <div class="aviaframe-details-panel">
        ${a.segments.length?a.segments.map(l=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${c(l.origin)} → ${c(l.destination)}</div>
            <div class="aviaframe-detail-meta">${c(l.departure)} → ${c(l.arrival)}</div>
            <div class="aviaframe-detail-meta">${c(l.airline)} • flight ${c(l.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${c(a.route)}</div>
            <div class="aviaframe-detail-meta">${c(a.depart)} → ${c(a.arrive)}</div>
          </div>
        `}
      </div>
    `,E=(a,l="")=>`
      <article class="aviaframe-flight-card ${l}" data-offer-id="${c(a.id)}">
        <div class="aviaframe-flight-main">
          <div class="aviaframe-segment">
            <div>
              <div class="aviaframe-airline-header">
                ${a.airlineLogo?`<img class="aviaframe-airline-logo" src="${a.airlineLogo}" alt="${c(a.airlineName)}" onerror="this.style.display='none'">`:""}
                <div class="aviaframe-airline">${c(a.airlineName)}</div>
              </div>
              <div class="aviaframe-class">Economy class</div>
            </div>
            <div>
              <div class="aviaframe-time">${c(a.depart)} - ${c(a.arrive)}</div>
              <div class="aviaframe-duration">${c(H(a.durationMinutes))} total travel time</div>
            </div>
            <div>
              <div class="aviaframe-route">${c(a.route)}</div>
              <div class="aviaframe-transfer">${c(a.stopsText)}</div>
            </div>
          </div>
          ${a.hasReturnData?`
            <div class="aviaframe-segment">
              <div>
                <div class="aviaframe-airline-header">
                  ${a.airlineLogo?`<img class="aviaframe-airline-logo" src="${a.airlineLogo}" alt="${c(a.airlineName)}" onerror="this.style.display='none'">`:""}
                  <div class="aviaframe-airline">${c(a.airlineName)}</div>
                </div>
                <div class="aviaframe-class">Economy class</div>
              </div>
              <div>
                <div class="aviaframe-time">${c(a.returnDepart)} - ${c(a.returnArrive)}</div>
                <div class="aviaframe-duration">${c(H(a.returnDurationMinutes||a.durationMinutes))} total travel time</div>
              </div>
              <div>
                <div class="aviaframe-route">${c(a.returnRoute)}</div>
                <div class="aviaframe-transfer">${c(a.stopsText)}</div>
              </div>
            </div>
          `:""}
          <div class="aviaframe-card-actions">
            <button type="button" class="aviaframe-details-toggle" data-details-id="${c(a.id)}">
              ${t.expandedIds.has(a.id)?"Hide details":"Details"}
            </button>
          </div>
          ${t.expandedIds.has(a.id)?d(a):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${c(a.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${c(L(a.priceTotal,a.priceCurrency))}</div>
          <button class="aviaframe-select-button" data-select-id="${c(a.id)}">Select</button>
        </aside>
      </article>
    `,A=()=>{let a=s(o);return t.selectedAirlines.size&&(a=a.filter(l=>t.selectedAirlines.has(l.carrierCode))),a=[...a],t.sort==="airline"?a.sort((l,u)=>l.airlineName.localeCompare(u.airlineName)):t.sort==="fastest"?a.sort((l,u)=>l.durationMinutes-u.durationMinutes):a.sort((l,u)=>l.priceTotal-u.priceTotal),a},y=(a,l,u)=>`
      <button type="button" class="aviaframe-quick-item ${t.quickFilter===a?"active":""}" data-quick="${a}">
        <div class="aviaframe-quick-title">${l}</div>
        <div class="aviaframe-quick-meta">${u.count} flights${u.minPrice!==null?` · from ${L(u.minPrice,"UAH")}`:""}</div>
      </button>
    `,i=a=>a.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${a.map(l=>`
              <button type="button" class="aviaframe-airline-card ${t.selectedAirlines.has(l.code)?"active":""}" data-airline="${c(l.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${l.logo?`<img class="aviaframe-airline-logo-big" src="${l.logo}" alt="${c(l.name)}" onerror="this.style.display='none'">`:`<span>${c(l.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${c(l.name)}</div>
                <div class="aviaframe-airline-card-price">from ${c(L(l.minPrice,"UAH"))}</div>
                <div class="aviaframe-airline-card-count">${l.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",x=`
      ${n.noticeHtml||""}
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
    `;r.innerHTML=x;const $=document.getElementById("aviaframe-cards-container"),b=document.getElementById("aviaframe-selected-flight"),f=document.getElementById("aviaframe-quick-grid"),h=document.getElementById("aviaframe-airline-filter-wrap"),k=()=>{const a=g();f.innerHTML=[y("all","All",a.all),y("nonstop","Non-stop",a.nonstop),y("one_stop","1 stop",a.one_stop),y("baggage","With baggage",a.baggage)].join("");const l=_();h.innerHTML=i(l);const u=A(),v=t.selectedId?u.find(w=>w.id===t.selectedId):null;b.innerHTML=v?`<div class="aviaframe-selected-title">Selected flight</div>${E(v,"selected")}`:"";const p=u.filter(w=>w.id!==t.selectedId);$.innerHTML=p.length?p.map(w=>E(w)).join(""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',r.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(w=>{w.addEventListener("click",()=>{const T=w.getAttribute("data-select-id"),O=o.find(le=>le.id===T);O&&(t.selectedId=T,V(O.offer))})}),r.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(w=>{w.addEventListener("click",()=>{const T=w.getAttribute("data-details-id");t.expandedIds.has(T)?t.expandedIds.delete(T):t.expandedIds.add(T),k()})}),r.querySelectorAll("[data-quick]").forEach(w=>{w.addEventListener("click",()=>{t.quickFilter=w.getAttribute("data-quick"),k()})}),r.querySelectorAll("[data-airline]").forEach(w=>{w.addEventListener("click",()=>{const T=w.getAttribute("data-airline");t.selectedAirlines.has(T)?t.selectedAirlines.delete(T):t.selectedAirlines.add(T),k()})})};r.querySelectorAll("[data-sort]").forEach(a=>{a.addEventListener("click",()=>{t.sort=a.getAttribute("data-sort"),r.querySelectorAll("[data-sort]").forEach(l=>l.classList.remove("active")),r.querySelectorAll(`[data-sort="${t.sort}"]`).forEach(l=>l.classList.add("active")),k()})}),k(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}function D(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const n=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";C.checkoutUrl=e.dataset.checkoutUrl||null;C.bookingUrl=String(e.dataset.bookingUrl||"").trim()||null;const primaryColor=String(e.dataset.primaryColor||"").trim();const logoUrl=String(e.dataset.logoUrl||"").trim();const widgetTitle=String(e.dataset.title||"").trim();const lang=String(localStorage.getItem("aviaframe_lang")||e.dataset.language||"en").toLowerCase();const r=document.createElement("style");r.textContent=W,document.head.appendChild(r);if(primaryColor&&/^#[0-9a-fA-F]{3,8}$/.test(primaryColor)){const ov=document.createElement("style");ov.textContent=`.aviaframe-select-button{background:${primaryColor}!important}.aviaframe-quick-item.active{background:${primaryColor}!important;border-color:${primaryColor}!important}.aviaframe-sort-btn.active{color:${primaryColor}!important}.aviaframe-flight-card.selected{border-color:${primaryColor}!important}.aviaframe-airline-card.active{border-color:${primaryColor}!important;color:${primaryColor}!important}`;document.head.appendChild(ov)}e.className="aviaframe-widget",e.innerHTML=G();const titleEl=e.querySelector(".aviaframe-title");if(titleEl){if(widgetTitle)titleEl.innerHTML=widgetTitle;if(logoUrl&&!/^javascript:/i.test(logoUrl)){const img=document.createElement("img");img.src=logoUrl;img.alt="";img.style.cssText="height:28px;max-width:110px;object-fit:contain;vertical-align:middle;margin-right:8px";img.onerror=function(){this.remove()};titleEl.insertBefore(img,titleEl.firstChild)}}if(lang==="ru"){const labels={"Return":"Туда-обратно","One-way":"В одну сторону","Multi-city":"Несколько городов","Economy":"Эконом","Premium Economy":"Эконом плюс","Business":"Бизнес","First":"Первый класс","Search flights":"Поиск рейсов","From":"Откуда","To":"Куда","Departure date":"Дата вылета","Return date":"Дата возврата","Adults":"Взрослые","Children":"Дети","Infants":"Младенцы","Cabin bags":"Ручная кладь","Checked bags":"Багаж","Passengers":"Пассажиры","Done":"Готово","✈️ Flight Search":"✈️ Поиск рейсов"};e.querySelectorAll("*").forEach(el=>{if(el.children.length===0){const t=el.textContent.trim();if(t in labels)el.textContent=labels[t]}})}const arLabels={"Return":"ذهاب وعودة","One-way":"ذهاب فقط","Multi-city":"رحلات متعددة","Economy":"اقتصادية","Premium Economy":"اقتصادية مميزة","Business":"أعمال","First Class":"الدرجة الأولى","First":"أولى","Search Flights":"ابحث عن رحلات","From":"من","To":"إلى","Departure Date":"تاريخ المغادرة","Return Date":"تاريخ العودة","From (2nd segment)":"من (الرحلة الثانية)","To (2nd segment)":"إلى (الرحلة الثانية)","Departure Date (2nd segment)":"تاريخ المغادرة (الرحلة الثانية)","Adults":"بالغون","Over 11":"فوق 11 سنة","Children":"أطفال","2-11":"2-11 سنة","Infants":"رضّع","Under 2":"أقل من سنتين","Cabin bags":"حقائب المقصورة","Checked bags":"أمتعة مسجّلة","Done":"تم","✈️ Flight Search":"✈️ ابحث عن رحلات","All":"الكل","Non-stop":"مباشر","1 stop":"توقف واحد","With baggage":"مع أمتعة","Price":"السعر","Airline":"الشركة","Fastest":"الأسرع","Economy class":"درجة اقتصادية","No flights found":"لم يتم العثور على رحلات","No offers found for current sort/filter settings.":"لا توجد عروض للتصفية الحالية","Selected flight":"الرحلة المختارة","Selected Flight":"الرحلة المختارة","Passenger Details":"تفاصيل المسافرين","Contact Information":"معلومات الاتصال","Email Address *":"البريد الإلكتروني *","Phone Number *":"رقم الهاتف *","Payment Method":"طريقة الدفع","Bank Transfer":"تحويل بنكي","Transfer to agency bank account":"التحويل إلى حساب الوكالة","Cash at Office":"نقداً في المكتب","Pay in person at our office":"الدفع نقداً في مكتبنا","Back":"رجوع","Continue to booking":"متابعة الحجز","First Name *":"الاسم الأول *","Last Name *":"اسم العائلة *","Date of Birth *":"تاريخ الميلاد *","Passport Number *":"رقم الجواز *","Passport Expiry *":"انتهاء الجواز *","Nationality *":"الجنسية *","Gender *":"الجنس *","Male":"ذكر","Female":"أنثى","total":"الإجمالي","No baggage":"بدون أمتعة","details":"التفاصيل","hide details":"إخفاء التفاصيل","Select":"اختر"};const applyAr=ct=>{ct.querySelectorAll("*").forEach(el=>{if(el.children.length===0){const t=el.textContent.trim();if(t in arLabels){if(!el.dataset.afEn)el.dataset.afEn=t;el.textContent=arLabels[t]}}})};if(lang==="ar"){applyAr(e);e.dir="rtl";e.style.fontFamily="'Cairo',sans-serif";if(!document.getElementById("af-cairo")){const lk=document.createElement("link");lk.id="af-cairo";lk.rel="stylesheet";lk.href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap";document.head.appendChild(lk)}const obs=new MutationObserver(()=>applyAr(e));obs.observe(e,{childList:true,subtree:true});}else{e.dir="ltr";e.style.fontFamily=""}const _lt=e.querySelector(".aviaframe-title");if(_lt){const _sw=document.createElement("div");_sw.id="af-lang-sw";_sw.style.cssText="margin-left:auto;display:flex;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.08);flex-shrink:0";const _mkBtn=(lc,label)=>{const b=document.createElement("button");b.dataset.lang=lc;b.textContent=label;const isAct=lang===lc;b.style.cssText=`padding:5px 12px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:background 0.15s,color 0.15s;background:${isAct?"#2563eb":"#fff"};color:${isAct?"#fff":"#6b7280"}`;if(lc==="ar")b.style.borderLeft="1px solid #e5e7eb";b.addEventListener("mouseover",()=>{if(b.dataset.lang!==b.closest("[id=af-lang-sw]")?.dataset.active)b.style.background=isAct?"#1d4ed8":"#f9fafb"});b.addEventListener("mouseout",()=>{const cur=b.closest("[id=af-lang-sw]")?.dataset.active||"en";b.style.background=b.dataset.lang===cur?"#2563eb":"#fff";b.style.color=b.dataset.lang===cur?"#fff":"#6b7280"});b.addEventListener("click",ev=>{ev.preventDefault();ev.stopPropagation();const nl=b.dataset.lang;const _sw2=b.closest("#af-lang-sw");if(_sw2){_sw2.dataset.active=nl;_sw2.querySelectorAll("button").forEach(btn=>{const isA2=btn.dataset.lang===nl;btn.style.background=isA2?"#2563eb":"#fff";btn.style.color=isA2?"#fff":"#6b7280";});}if(nl==="ar"){applyAr(e);e.dir="rtl";e.style.fontFamily="'Cairo',sans-serif";if(!document.getElementById("af-cairo")){const lk2=document.createElement("link");lk2.id="af-cairo";lk2.rel="stylesheet";lk2.href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap";document.head.appendChild(lk2);}if(!e._arObs){e._arObs=new MutationObserver(()=>applyAr(e));e._arObs.observe(e,{childList:true,subtree:true});}}else{e.querySelectorAll("[data-af-en]").forEach(el=>{el.textContent=el.dataset.afEn;el.removeAttribute("data-af-en");});e.dir="ltr";e.style.fontFamily="";if(e._arObs){e._arObs.disconnect();e._arObs=null;}}});return b};_sw.dataset.active=lang;_sw.appendChild(_mkBtn("en","EN"));_sw.appendChild(_mkBtn("ar","عر"));_lt.style.cssText="display:flex;align-items:center;width:100%";_lt.appendChild(_sw)}setTimeout(()=>{K(),R("aviaframe-origin","aviaframe-origin-autocomplete"),R("aviaframe-destination","aviaframe-destination-autocomplete"),R("aviaframe-origin-2","aviaframe-origin-2-autocomplete"),R("aviaframe-destination-2","aviaframe-destination-2-autocomplete"),J(n);['aviaframe-depart-date','aviaframe-return-date','aviaframe-depart-date-2'].forEach(id=>{const el=document.getElementById(id);if(el)el.setAttribute('lang','en')});(()=>{const dep=document.getElementById("aviaframe-depart-date"),ret=document.getElementById("aviaframe-return-date"),err=document.getElementById("aviaframe-return-date-error");if(!dep||!ret||!err)return;const validate=()=>{const d=dep.value,r=ret.value,tt=document.getElementById("aviaframe-trip-type");if(!tt||tt.value==="one_way"||tt.value==="multi_city"){err.style.display="none";ret.classList.remove("aviaframe-input--error");return}if(r&&d&&r<=d){err.textContent="Return date must be after the departure date.";err.style.display="block";ret.classList.add("aviaframe-input--error")}else{err.style.display="none";ret.classList.remove("aviaframe-input--error")}};dep.addEventListener("change",validate);ret.addEventListener("change",validate)})()},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",D):D(),window.AviaframeWidget={init:D}})()})();
