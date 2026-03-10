(function(){"use strict";(function(){(function(){const R={checkoutUrl:null},O=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1}];function j(e,n=8){const r=e.toLowerCase().trim();if(r.length<1)return[];const o=O.filter(a=>a.code.toLowerCase().includes(r)||a.city.toLowerCase().includes(r)||a.cityRu.toLowerCase().includes(r)||a.name.toLowerCase().includes(r)||a.country.toLowerCase().includes(r));return o.sort((a,l)=>a.priority!==l.priority?a.priority-l.priority:a.city.localeCompare(l.city)),o.slice(0,n)}function G(e){const n=new Date(e),r=n.getFullYear(),o=String(n.getMonth()+1).padStart(2,"0"),a=String(n.getDate()).padStart(2,"0");return`${r}-${o}-${a}`}function J(){return G(new Date)}const K=`
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
      justify-content: center;
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
  `;function Y(){const e=J();return`
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
    `}function W(){var e;const n=Array.from(document.querySelectorAll(".aviaframe-dropdown")),r=()=>n.forEach(i=>i.classList.remove("open"));n.forEach(i=>{const k=i.querySelector(".aviaframe-dropdown-btn");k&&k.addEventListener("click",T=>{T.stopPropagation();const v=i.classList.contains("open");r(),v||i.classList.add("open")})}),document.addEventListener("click",i=>{i.target.closest(".aviaframe-dropdown")||r()});const o=document.getElementById("aviaframe-trip-type"),a=document.getElementById("aviaframe-trip-label"),l=(e=document.getElementById("aviaframe-return-date"))==null?void 0:e.closest(".aviaframe-field"),p=document.getElementById("aviaframe-multi-city-fields");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(i=>{i.addEventListener("change",()=>{i.checked&&(o.value=i.value,a.textContent=i.value==="one_way"?"One-way":i.value==="multi_city"?"Multi-city":"Return",i.value==="one_way"?(l&&(l.style.display="none"),p&&(p.style.display="none")):i.value==="multi_city"?(l&&(l.style.display="none"),p&&(p.style.display="block")):(l&&(l.style.display="block"),p&&(p.style.display="none")))})});const y=document.getElementById("aviaframe-cabin"),$=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(i=>{i.addEventListener("change",()=>{i.checked&&(y.value=i.value,$.textContent=i.parentElement.textContent.trim())})});const E={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},c={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},S=()=>{document.getElementById("aviaframe-adults").value=c.adults,document.getElementById("aviaframe-children").value=c.children,document.getElementById("aviaframe-infants").value=c.infants,document.getElementById("aviaframe-cabin-bags").value=c.cabinBags,document.getElementById("aviaframe-checked-bags").value=c.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(c.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(c.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${c.adults+c.children+c.infants} Passenger${c.adults+c.children+c.infants!==1?"s":""}`},x=()=>{const i=document.getElementById("aviaframe-age-selectors");for(;c.childrenAges.length<c.children;)c.childrenAges.push(2);for(;c.childrenAges.length>c.children;)c.childrenAges.pop();for(;c.infantAges.length<c.infants;)c.infantAges.push(1);for(;c.infantAges.length>c.infants;)c.infantAges.pop();const k=c.childrenAges.map((v,b)=>`
        <div class="aviaframe-age-item">
          <label>Child ${b+1} age</label>
          <select data-age-type="child" data-age-index="${b}">
            ${Array.from({length:10},(f,h)=>h+2).map(f=>`<option value="${f}" ${f===v?"selected":""}>${f}</option>`).join("")}
          </select>
        </div>
      `).join(""),T=c.infantAges.map((v,b)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${b+1} age</label>
          <select data-age-type="infant" data-age-index="${b}">
            ${Array.from({length:2},(f,h)=>h).map(f=>`<option value="${f}" ${f===v?"selected":""}>${f}</option>`).join("")}
          </select>
        </div>
      `).join("");i.innerHTML=k+T,i.querySelectorAll("select[data-age-type]").forEach(v=>{v.addEventListener("change",()=>{const b=v.getAttribute("data-age-type"),f=Number(v.getAttribute("data-age-index")),h=Number(v.value);b==="child"?c.childrenAges[f]=h:c.infantAges[f]=h,S()})}),S()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(i=>{i.addEventListener("click",()=>{const k=i.getAttribute("data-counter"),T=Number(i.getAttribute("data-delta")),v=E[k];if(!v)return;const b=Math.max(v.min,Math.min(v.max,c[k]+T));c[k]=b;const f=document.getElementById(`aviaframe-count-${k}`);f&&(f.textContent=b),x()})}),x()}function L(e,n){const r=document.getElementById(e),o=document.getElementById(n);if(!r||!o)return;let a=-1;r.addEventListener("input",function(){const l=this.value;if(l.length<1){o.style.display="none";return}const p=j(l);if(p.length===0){o.style.display="none";return}o.innerHTML=p.map((y,$)=>`
        <div class="aviaframe-autocomplete-item" data-index="${$}" data-code="${y.code}">
          <div>
            <span class="aviaframe-airport-code">${y.code}</span>
            <span class="aviaframe-airport-city">${y.city} / ${y.cityRu}</span>
          </div>
          <span class="aviaframe-airport-name">${y.name}, ${y.country}</span>
        </div>
      `).join(""),o.style.display="block",a=-1,o.querySelectorAll(".aviaframe-autocomplete-item").forEach((y,$)=>{y.addEventListener("click",function(){const E=p[$];r.value=`${E.city} (${E.code})`,r.dataset.code=E.code,o.style.display="none"})})}),r.addEventListener("keydown",function(l){const p=o.querySelectorAll(".aviaframe-autocomplete-item");p.length!==0&&(l.key==="ArrowDown"?(l.preventDefault(),a=Math.min(a+1,p.length-1),q(p,a)):l.key==="ArrowUp"?(l.preventDefault(),a=Math.max(a-1,0),q(p,a)):l.key==="Enter"&&a>=0?(l.preventDefault(),p[a].click()):l.key==="Escape"&&(o.style.display="none"))}),document.addEventListener("click",function(l){!r.contains(l.target)&&!o.contains(l.target)&&(o.style.display="none")})}function q(e,n){e.forEach((r,o)=>{o===n?(r.classList.add("active"),r.scrollIntoView({block:"nearest"})):r.classList.remove("active")})}function V(e){const n=document.getElementById("aviaframe-search-form"),r=document.getElementById("aviaframe-results");n.addEventListener("submit",async function(o){o.preventDefault();const a=document.getElementById("aviaframe-origin"),l=document.getElementById("aviaframe-destination"),p=document.getElementById("aviaframe-depart-date").value,y=document.getElementById("aviaframe-return-date").value,$=parseInt(document.getElementById("aviaframe-adults").value,10),E=parseInt(document.getElementById("aviaframe-children").value,10)||0,c=parseInt(document.getElementById("aviaframe-infants").value,10)||0,S=document.getElementById("aviaframe-trip-type").value||"return",x=document.getElementById("aviaframe-cabin").value,i=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),k=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),T=a.dataset.code,v=l.dataset.code;if(!T||!v){r.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select airports from the dropdown.
          </div>
        `;return}if(!p){r.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select departure date.
          </div>
        `;return}r.innerHTML=`
        <div class="aviaframe-loading">
          <div class="aviaframe-spinner"></div>
          <div>Searching for flights...</div>
        </div>
      `;let b={origin:T,destination:v,depart_date:p,return_date:y||null,adults:$,children:E,infants:c,children_ages:i,infant_ages:k,cabin_class:x,trip_type:S};if(S==="one_way"&&(b.return_date=null),S==="multi_city"){const s=document.getElementById("aviaframe-origin-2"),m=document.getElementById("aviaframe-destination-2"),A=document.getElementById("aviaframe-depart-date-2").value,g=s==null?void 0:s.dataset.code,w=m==null?void 0:m.dataset.code;if(!g||!w||!A){r.innerHTML=`
            <div class="aviaframe-error">
              <strong>Error:</strong> For Multi-city please fill second segment: From, To and Date.
            </div>
          `;return}b.segments=[{origin:T,destination:v,depart_date:p},{origin:g,destination:w,depart_date:A}]}const f=s=>String(s||"").replace(/\/+$/,""),h=s=>{const m=f(s);return m.endsWith("/search")?m:`${m}/search`},t=s=>{const m=f(s);return m.includes("/api/drct/")?m.replace("/api/drct/","/api/n8n/webhook-test/drct/"):m.endsWith("/api/drct")?m.replace("/api/drct","/api/n8n/webhook-test/drct"):m},d=s=>{const m=f(s),A=[m,h(m),t(m)];return[...new Set(A.filter(Boolean))]};try{let s=null;const m=d(e);for(const g of m)if(s=await fetch(g,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}),s.ok||s.status!==404)break;if(!s.ok)throw new Error(`HTTP ${s.status}: ${s.statusText}`);const A=await s.json();if(A.offers&&A.offers.length>0){const g=A.offers.map(w=>{const _={...w,_searchOrigin:b.origin||(w==null?void 0:w._searchOrigin)||null,_searchDestination:b.destination||(w==null?void 0:w._searchDestination)||null,_searchReturnDate:b.return_date||(w==null?void 0:w._searchReturnDate)||null};if(!(_!=null&&_.return_origin&&_!=null&&_.return_destination||_!=null&&_.return_departure_time&&_!=null&&_.return_arrival_time)&&b.return_date){const I=ae(_);I&&Object.assign(_,I),_.return_origin||(_.return_origin=b.destination||null),_.return_destination||(_.return_destination=b.origin||null)}return _});P(g)}else r.innerHTML=`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No flights found</div>
              <div>Try adjusting your search criteria</div>
            </div>
          `}catch(s){const m=String((s==null?void 0:s.message)||""),A=m.includes("HTTP 404");if((s==null?void 0:s.name)==="TypeError"||m.includes("Failed to fetch")||m.toLowerCase().includes("cors")||A){const g=de(b);P(g,{noticeHtml:`
              <div class="aviaframe-warning">
                Demo mode: backend is currently not reachable from the browser (CORS/network), so test offers are shown for UI validation.
              </div>
            `}),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",s);return}r.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${m}
          </div>
        `}})}function Z(e){return e?`https://pics.avs.io/200/80/${e}.png`:null}function X(e){const n={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,selected_at:new Date().toISOString()};n.passenger_counts={adults:Math.max(1,Number((document.getElementById("aviaframe-adults")||{}).value||1)),children:Math.max(0,Number((document.getElementById("aviaframe-children")||{}).value||0)),infants:Math.max(0,Number((document.getElementById("aviaframe-infants")||{}).value||0))},localStorage.setItem("selectedOffer",JSON.stringify(n)),console.log("✅ Offer selected:",e.offer_id),window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:n},bubbles:!0}));const r=document.querySelector(".aviaframe-widget"),o=document.getElementById("aviaframe-results"),a=document.getElementById("aviaframe-search-form");if(!r){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:n},bubbles:!0})),R.checkoutUrl&&(window.location.href=R.checkoutUrl);return}a&&(a.style.display="none"),o&&(o.style.display="none");const l=document.getElementById("aviaframe-passenger-step");l&&l.remove();const p=((e==null?void 0:e.price)||{}).currency||"UAH",y=Math.round(((e==null?void 0:e.price)||{}).total||0).toLocaleString("en-US"),$=e.airline_name||e.airline||"Airline",E=e.origin||"---",c=e.destination||"---",S=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",x=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A",i=document.createElement("div");i.id="aviaframe-passenger-step",i.style.marginTop="16px",i.style.border="1px solid #d9e3f3",i.style.borderRadius="12px",i.style.padding="16px",i.style.background="#fff",i.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px"><div><div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.1">Selected Flight</div><div style="margin-top:8px;font-size:20px;font-weight:700;color:#1f2937">'+E+" → "+c+' <span style="font-size:18px;font-weight:600;color:#64748b">'+$+'</span></div><div style="margin-top:6px;font-size:16px;color:#475569">Departure: '+S+" | Arrival: "+x+'</div></div><div style="text-align:right"><div style="font-size:56px;line-height:1;font-weight:800;color:#2563eb">'+y+" "+p+'</div><div style="margin-top:6px;font-size:20px;color:#64748b">per person</div></div></div><div style="font-size:38px;font-weight:800;color:#0f172a;margin:16px 0 10px">Passenger Details</div><form id="aviaframe-passenger-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="grid-column:1 / -1;font-size:20px;font-weight:700;color:#1f2937;margin-top:2px">Contact Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Email Address *</span><input required type="email" name="email" placeholder="name@example.com" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Phone Number *</span><input required name="phone" placeholder="+971501234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1 / -1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1 / -1;font-size:20px;font-weight:700;color:#1f2937">Personal Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Gender *</span><select name="gender" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px"><option value="male">Male</option><option value="female">Female</option></select></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Date of Birth *</span><input required type="date" name="dateOfBirth" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">First Name *</span><input required name="firstName" placeholder="John" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Last Name *</span><input required name="lastName" placeholder="Doe" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1 / -1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1 / -1;font-size:20px;font-weight:700;color:#1f2937">Document Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Number *</span><input required name="passportNumber" placeholder="AB1234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Expiry Date *</span><input required type="date" name="passportExpiry" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div id="aviaframe-passenger-error" style="grid-column:1 / -1;display:none;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px;font-size:14px"></div><div style="grid-column:1 / -1;display:flex;justify-content:space-between;gap:10px;margin-top:6px"><button type="button" id="aviaframe-passenger-back" style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:600">Back</button><button type="submit" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer">Continue to booking</button></div></form>',r.appendChild(i),window.scrollTo({top:0,behavior:"smooth"});const k=i.querySelector("#aviaframe-passenger-back"),T=i.querySelector("#aviaframe-passenger-form"),v=i.querySelector("#aviaframe-passenger-error");k&&k.addEventListener("click",()=>{i.remove(),a&&(a.style.display=""),o&&(o.style.display="")}),T&&T.addEventListener("submit",b=>{b.preventDefault();const f=new FormData(T),h={firstName:String(f.get("firstName")||""),lastName:String(f.get("lastName")||""),email:String(f.get("email")||""),phone:String(f.get("phone")||""),gender:String(f.get("gender")||"male"),dateOfBirth:String(f.get("dateOfBirth")||""),passportNumber:String(f.get("passportNumber")||""),passportExpiry:String(f.get("passportExpiry")||"")},t=new Date,d=new Date(h.dateOfBirth),s=new Date(d);if(s.setFullYear(s.getFullYear()+18),!h.dateOfBirth||Number.isNaN(d.getTime())||s>t){v&&(v.textContent="Passenger must be at least 18 years old.",v.style.display="block");return}const m=(e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10),A=new Date(m+"T00:00:00"),g=new Date(A);g.setMonth(g.getMonth()+6);const w=new Date(h.passportExpiry+"T00:00:00");if(!h.passportExpiry||Number.isNaN(w.getTime())||w<g){v&&(v.textContent="Passport must be valid for at least 6 months from the trip date.",v.style.display="block");return}v&&(v.style.display="none"),h.passengers=function(){const _=[],I=n.passenger_counts||{adults:1,children:0,infants:0};for(let z=0;z<Math.max(1,Number(I.adults||1));z+=1)_.push({...h,type:"ADT"});for(let z=0;z<Math.max(0,Number(I.children||0));z+=1)_.push({...h,type:"CHD"});for(let z=0;z<Math.max(0,Number(I.infants||0));z+=1)_.push({...h,type:"INF"});return _}(),localStorage.setItem("passengerData",JSON.stringify(h)),window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:n,passenger:h},bubbles:!0})),R.checkoutUrl?window.location.href=R.checkoutUrl:i.innerHTML='<div style="padding:10px 0"><div style="font-size:20px;font-weight:700;color:#166534;margin-bottom:6px">Passenger details saved</div><div style="font-size:14px;color:#374151">Host app can continue booking via aviaframe:continueToBooking event.</div><button type="button" id="aviaframe-passenger-back2" style="margin-top:12px;border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:8px 12px;cursor:pointer">Back to search</button></div>',i.querySelector("#aviaframe-passenger-back2")&&i.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{i.remove(),a&&(a.style.display=""),o&&(o.style.display="")})})}function B(e,n=0){const r=Number(e);return Number.isFinite(r)?r:n}function u(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function M(e,n){return`${Math.round(B(e,0)).toLocaleString("uk-UA")} ${n||"UAH"}`}function D(e){if(!e)return"--:--";const n=String(e).match(/T(\d{2}:\d{2})/);return n?n[1]:String(e)}function N(e){return e?String(e).trim().toUpperCase():null}function H(e){var n;return N((e==null?void 0:e.origin_code)||((n=e==null?void 0:e.departure_airport)==null?void 0:n.code)||(e==null?void 0:e.origin))}function U(e){var n;return N((e==null?void 0:e.destination_code)||((n=e==null?void 0:e.arrival_airport)==null?void 0:n.code)||(e==null?void 0:e.destination))}function Q(e){return(e==null?void 0:e.departure)||[e==null?void 0:e.departure_date,e==null?void 0:e.departure_time].filter(Boolean).join("T")}function ee(e){return(e==null?void 0:e.arrival)||[e==null?void 0:e.arrival_date,e==null?void 0:e.arrival_time].filter(Boolean).join("T")}function ae(e){const n=Array.isArray(e==null?void 0:e.segments)?e.segments:[];if(!n.length)return null;const r=N((e==null?void 0:e._searchOrigin)||(e==null?void 0:e.origin)),o=N((e==null?void 0:e._searchDestination)||(e==null?void 0:e.destination));if(!r||!o)return null;let a=-1;for(let x=1;x<n.length;x+=1){const i=H(n[x]),k=U(n[x]);if(i===o||k===r){a=x;break}}if(a<0)return null;const l=n.slice(a),p=l[0],y=l[l.length-1],$=H(p)||o,E=U(y)||r,c=Q(p)||null,S=ee(y)||null;return!$||!E?null:{return_origin:$,return_destination:E,return_departure_time:c,return_arrival_time:S}}function te(e){if(e.duration_minutes)return B(e.duration_minutes,0);if(e.durationMinutes)return B(e.durationMinutes,0);if(e.journey_time)return Math.round(B(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const n=new Date(e.departure_time).getTime(),r=new Date(e.arrival_time).getTime();return!Number.isFinite(n)||!Number.isFinite(r)||r<=n?0:Math.round((r-n)/6e4)}function ie(e,n){if(!e||!n)return 0;const r=new Date(e).getTime(),o=new Date(n).getTime();return!Number.isFinite(r)||!Number.isFinite(o)||o<=r?0:Math.round((o-r)/6e4)}function F(e){const n=B(e,0),r=Math.floor(n/60),o=n%60;return n<=0?"n/a":`${r}h ${o}m`}function re(e){return e.stops!==void 0?B(e.stops,0):e.transfers_count!==void 0?B(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function ne(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function oe(e){const n=(e.airline_code||e.airline||"").toString().trim();return n?n.slice(0,2).toUpperCase():"NA"}function le(e){var n,r;const o=B((n=e==null?void 0:e.price)==null?void 0:n.total,0),a=((r=e==null?void 0:e.price)==null?void 0:r.currency)||"UAH",l=re(e),p=Array.isArray(e==null?void 0:e.segments)?e.segments.map(i=>{var k,T,v,b,f;return{origin:(i==null?void 0:i.origin)||((k=i==null?void 0:i.departure_city)==null?void 0:k.name)||((T=i==null?void 0:i.departure_airport)==null?void 0:T.code)||"N/A",destination:(i==null?void 0:i.destination)||((v=i==null?void 0:i.arrival_city)==null?void 0:v.name)||((b=i==null?void 0:i.arrival_airport)==null?void 0:b.code)||"N/A",departure:(i==null?void 0:i.departure)||[i==null?void 0:i.departure_date,i==null?void 0:i.departure_time].filter(Boolean).join(" ")||"N/A",arrival:(i==null?void 0:i.arrival)||[i==null?void 0:i.arrival_date,i==null?void 0:i.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((f=i==null?void 0:i.carrier)==null?void 0:f.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:(i==null?void 0:i.flight_number)||"N/A"}}):[],y=!!(e!=null&&e.return_origin&&e!=null&&e.return_destination||e!=null&&e.return_departure_time&&e!=null&&e.return_arrival_time),$=y?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",E=y?D(e.return_departure_time):"--:--",c=y?D(e.return_arrival_time):"--:--",S=y?ie(e.return_departure_time,e.return_arrival_time):0,x=y?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:oe(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:D(e.departure_time),arrive:D(e.arrival_time),durationMinutes:te(e),stops:l,stopsText:ne(l),priceTotal:o,priceCurrency:a,baggageText:e.baggage_text||(e.with_baggage?"With baggage":"No baggage"),segments:p,hasReturnData:y,returnRoute:$,returnDepart:E,returnArrive:c,returnDurationMinutes:S,returnSummary:x}}function de(e){const n=e.origin||"WAW",r=e.destination||"YVR",o=e.depart_date||"2026-02-27",a=e.return_date||"",l=e.trip_type!=="one_way"&&!!a,p=(y,$,E,c=[])=>{const S=x=>({origin:x.from,destination:x.to,departure:x.depart,arrival:x.arrive,carrier:{airline_code:y,airline_name:$},flight_number:x.flight});return[...E.map(S),...c.map(S)]};return[{offer_id:"fallback_1",origin:n,destination:r,departure_time:`${o}T13:05:00`,arrival_time:`${o}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:l?r:null,return_destination:l?n:null,return_departure_time:l?`${a}T14:20:00`:null,return_arrival_time:l?`${a}T22:40:00`:null,segments:p("DL","DELTA",[{from:n,to:"CDG",depart:`${o}T13:05:00`,arrive:`${o}T16:10:00`,flight:"737"},{from:"CDG",to:r,depart:`${o}T17:05:00`,arrive:`${o}T23:25:00`,flight:"4200"}],l?[{from:r,to:"FRA",depart:`${a}T14:20:00`,arrive:`${a}T17:10:00`,flight:"9655"},{from:"FRA",to:n,depart:`${a}T18:30:00`,arrive:`${a}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"UAH"}},{offer_id:"fallback_2",origin:n,destination:r,departure_time:`${o}T08:10:00`,arrival_time:`${o}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:l?r:null,return_destination:l?n:null,return_departure_time:l?`${a}T09:00:00`:null,return_arrival_time:l?`${a}T20:30:00`:null,segments:p("LO","LOT",[{from:n,to:r,depart:`${o}T08:10:00`,arrive:`${o}T22:00:00`,flight:"441"}],l?[{from:r,to:n,depart:`${a}T09:00:00`,arrive:`${a}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"UAH"}},{offer_id:"fallback_3",origin:n,destination:r,departure_time:`${o}T06:45:00`,arrival_time:`${o}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:l?r:null,return_destination:l?n:null,return_departure_time:l?`${a}T07:10:00`:null,return_arrival_time:l?`${a}T19:55:00`:null,segments:p("AC","AIR CANADA",[{from:n,to:"MUC",depart:`${o}T06:45:00`,arrive:`${o}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${o}T11:50:00`,arrive:`${o}T14:50:00`,flight:"837"},{from:"YYZ",to:r,depart:`${o}T18:40:00`,arrive:`${o}T23:15:00`,flight:"835"}],l?[{from:r,to:"YYZ",depart:`${a}T07:10:00`,arrive:`${a}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${a}T12:00:00`,arrive:`${a}T16:00:00`,flight:"838"},{from:"MUC",to:n,depart:`${a}T17:20:00`,arrive:`${a}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"UAH"}}]}function P(e,n={}){const r=document.getElementById("aviaframe-results"),o=e.map(le).map((t,d)=>({...t,id:t.offer.offer_id||`offer_${d}`,airlineLogo:Z(t.carrierCode)})),a={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set},l=t=>a.quickFilter==="nonstop"?t.filter(d=>d.stops===0):a.quickFilter==="one_stop"?t.filter(d=>d.stops===1):a.quickFilter==="baggage"?t.filter(d=>/baggage|bag/i.test(d.baggageText||"")):t,p=t=>t.length?{count:t.length,minPrice:Math.min(...t.map(d=>d.priceTotal))}:{count:0,minPrice:null},y=()=>({all:p(o),nonstop:p(o.filter(t=>t.stops===0)),one_stop:p(o.filter(t=>t.stops===1)),baggage:p(o.filter(t=>/baggage|bag/i.test(t.baggageText||"")))}),$=()=>{const t=l(o),d=new Map;return t.forEach(s=>{const m=s.carrierCode||"NA";if(!d.has(m))d.set(m,{code:m,name:s.airlineName||m,logo:s.airlineLogo,count:1,minPrice:s.priceTotal});else{const A=d.get(m);A.count+=1,A.minPrice=Math.min(A.minPrice,s.priceTotal)}}),Array.from(d.values()).sort((s,m)=>s.minPrice-m.minPrice).slice(0,8)},E=t=>`
      <div class="aviaframe-details-panel">
        ${t.segments.length?t.segments.map(d=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${u(d.origin)} → ${u(d.destination)}</div>
            <div class="aviaframe-detail-meta">${u(d.departure)} → ${u(d.arrival)}</div>
            <div class="aviaframe-detail-meta">${u(d.airline)} • flight ${u(d.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${u(t.route)}</div>
            <div class="aviaframe-detail-meta">${u(t.depart)} → ${u(t.arrive)}</div>
          </div>
        `}
      </div>
    `,c=(t,d="")=>`
      <article class="aviaframe-flight-card ${d}" data-offer-id="${u(t.id)}">
        <div class="aviaframe-flight-main">
          <div class="aviaframe-segment">
            <div>
              <div class="aviaframe-airline-header">
                ${t.airlineLogo?`<img class="aviaframe-airline-logo" src="${t.airlineLogo}" alt="${u(t.airlineName)}" onerror="this.style.display='none'">`:""}
                <div class="aviaframe-airline">${u(t.airlineName)}</div>
              </div>
              <div class="aviaframe-class">Economy class</div>
            </div>
            <div>
              <div class="aviaframe-time">${u(t.depart)} - ${u(t.arrive)}</div>
              <div class="aviaframe-duration">${u(F(t.durationMinutes))} total travel time</div>
            </div>
            <div>
              <div class="aviaframe-route">${u(t.route)}</div>
              <div class="aviaframe-transfer">${u(t.stopsText)}</div>
            </div>
          </div>
          ${t.hasReturnData?`
            <div class="aviaframe-segment">
              <div>
                <div class="aviaframe-airline-header">
                  ${t.airlineLogo?`<img class="aviaframe-airline-logo" src="${t.airlineLogo}" alt="${u(t.airlineName)}" onerror="this.style.display='none'">`:""}
                  <div class="aviaframe-airline">${u(t.airlineName)}</div>
                </div>
                <div class="aviaframe-class">Economy class</div>
              </div>
              <div>
                <div class="aviaframe-time">${u(t.returnDepart)} - ${u(t.returnArrive)}</div>
                <div class="aviaframe-duration">${u(F(t.returnDurationMinutes||t.durationMinutes))} total travel time</div>
              </div>
              <div>
                <div class="aviaframe-route">${u(t.returnRoute)}</div>
                <div class="aviaframe-transfer">${u(t.stopsText)}</div>
              </div>
            </div>
          `:""}
          <div class="aviaframe-card-actions">
            <button type="button" class="aviaframe-details-toggle" data-details-id="${u(t.id)}">
              ${a.expandedIds.has(t.id)?"Hide details":"Details"}
            </button>
          </div>
          ${a.expandedIds.has(t.id)?E(t):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${u(t.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${u(M(t.priceTotal,t.priceCurrency))}</div>
          <button class="aviaframe-select-button" data-select-id="${u(t.id)}">Select</button>
        </aside>
      </article>
    `,S=()=>{let t=l(o);return a.selectedAirlines.size&&(t=t.filter(d=>a.selectedAirlines.has(d.carrierCode))),t=[...t],a.sort==="airline"?t.sort((d,s)=>d.airlineName.localeCompare(s.airlineName)):a.sort==="fastest"?t.sort((d,s)=>d.durationMinutes-s.durationMinutes):t.sort((d,s)=>d.priceTotal-s.priceTotal),t},x=(t,d,s)=>`
      <button type="button" class="aviaframe-quick-item ${a.quickFilter===t?"active":""}" data-quick="${t}">
        <div class="aviaframe-quick-title">${d}</div>
        <div class="aviaframe-quick-meta">${s.count} flights${s.minPrice!==null?` · from ${M(s.minPrice,"UAH")}`:""}</div>
      </button>
    `,i=t=>t.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${t.map(d=>`
              <button type="button" class="aviaframe-airline-card ${a.selectedAirlines.has(d.code)?"active":""}" data-airline="${u(d.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${d.logo?`<img class="aviaframe-airline-logo-big" src="${d.logo}" alt="${u(d.name)}" onerror="this.style.display='none'">`:`<span>${u(d.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${u(d.name)}</div>
                <div class="aviaframe-airline-card-price">from ${u(M(d.minPrice,"UAH"))}</div>
                <div class="aviaframe-airline-card-count">${d.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",k=`
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
    `;r.innerHTML=k;const T=document.getElementById("aviaframe-cards-container"),v=document.getElementById("aviaframe-selected-flight"),b=document.getElementById("aviaframe-quick-grid"),f=document.getElementById("aviaframe-airline-filter-wrap"),h=()=>{const t=y();b.innerHTML=[x("all","All",t.all),x("nonstop","Non-stop",t.nonstop),x("one_stop","1 stop",t.one_stop),x("baggage","With baggage",t.baggage)].join("");const d=$();f.innerHTML=i(d);const s=S(),m=a.selectedId?s.find(g=>g.id===a.selectedId):null;v.innerHTML=m?`<div class="aviaframe-selected-title">Selected flight</div>${c(m,"selected")}`:"";const A=s.filter(g=>g.id!==a.selectedId);T.innerHTML=A.length?A.map(g=>c(g)).join(""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',r.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(g=>{g.addEventListener("click",()=>{const w=g.getAttribute("data-select-id"),_=o.find(I=>I.id===w);_&&(a.selectedId=w,X(_.offer))})}),r.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(g=>{g.addEventListener("click",()=>{const w=g.getAttribute("data-details-id");a.expandedIds.has(w)?a.expandedIds.delete(w):a.expandedIds.add(w),h()})}),r.querySelectorAll("[data-quick]").forEach(g=>{g.addEventListener("click",()=>{a.quickFilter=g.getAttribute("data-quick"),h()})}),r.querySelectorAll("[data-airline]").forEach(g=>{g.addEventListener("click",()=>{const w=g.getAttribute("data-airline");a.selectedAirlines.has(w)?a.selectedAirlines.delete(w):a.selectedAirlines.add(w),h()})})};r.querySelectorAll("[data-sort]").forEach(t=>{t.addEventListener("click",()=>{a.sort=t.getAttribute("data-sort"),r.querySelectorAll("[data-sort]").forEach(d=>d.classList.remove("active")),r.querySelectorAll(`[data-sort="${a.sort}"]`).forEach(d=>d.classList.add("active")),h()})}),h(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}function C(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const n=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";R.checkoutUrl=e.dataset.checkoutUrl||"/booking";const r=document.createElement("style");r.textContent=K,document.head.appendChild(r),e.className="aviaframe-widget",e.innerHTML=Y(),setTimeout(()=>{W(),L("aviaframe-origin","aviaframe-origin-autocomplete"),L("aviaframe-destination","aviaframe-destination-autocomplete"),L("aviaframe-origin-2","aviaframe-origin-2-autocomplete"),L("aviaframe-destination-2","aviaframe-destination-2-autocomplete"),V(n)},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",C):C(),window.AviaframeWidget={init:C}})()})()})();
