(function(){"use strict";(function(){(function(){const j={checkoutUrl:null,bookingUrl:null},ge=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1}];function ye(e,n=8){const t=e.toLowerCase().trim();if(t.length<1)return[];const r=ge.filter(a=>a.code.toLowerCase().includes(t)||a.city.toLowerCase().includes(t)||a.cityRu.toLowerCase().includes(t)||a.name.toLowerCase().includes(t)||a.country.toLowerCase().includes(t));return r.sort((a,l)=>a.priority!==l.priority?a.priority-l.priority:a.city.localeCompare(l.city)),r.slice(0,n)}function be(e){const n=new Date(e),t=n.getFullYear(),r=String(n.getMonth()+1).padStart(2,"0"),a=String(n.getDate()).padStart(2,"0");return`${t}-${r}-${a}`}function xe(){return be(new Date)}const he=`
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
    `}function _e(){var e;const n=Array.from(document.querySelectorAll(".aviaframe-dropdown")),t=()=>n.forEach(s=>s.classList.remove("open"));n.forEach(s=>{const $=s.querySelector(".aviaframe-dropdown-btn");$&&$.addEventListener("click",z=>{z.stopPropagation();const x=s.classList.contains("open");t(),x||s.classList.add("open")})}),document.addEventListener("click",s=>{s.target.closest(".aviaframe-dropdown")||t()});const r=document.getElementById("aviaframe-trip-type"),a=document.getElementById("aviaframe-trip-label"),l=(e=document.getElementById("aviaframe-return-date"))==null?void 0:e.closest(".aviaframe-field"),u=document.getElementById("aviaframe-multi-city-fields");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(s=>{s.addEventListener("change",()=>{s.checked&&(r.value=s.value,a.textContent=s.value==="one_way"?"One-way":s.value==="multi_city"?"Multi-city":"Return",s.value==="one_way"?(l&&(l.style.display="none"),u&&(u.style.display="none")):s.value==="multi_city"?(l&&(l.style.display="none"),u&&(u.style.display="block")):(l&&(l.style.display="block"),u&&(u.style.display="none")))})});const f=document.getElementById("aviaframe-cabin"),v=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(s=>{s.addEventListener("change",()=>{s.checked&&(f.value=s.value,v.textContent=s.parentElement.textContent.trim())})});const b={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},d={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},I=()=>{document.getElementById("aviaframe-adults").value=d.adults,document.getElementById("aviaframe-children").value=d.children,document.getElementById("aviaframe-infants").value=d.infants,document.getElementById("aviaframe-cabin-bags").value=d.cabinBags,document.getElementById("aviaframe-checked-bags").value=d.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(d.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(d.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${d.adults+d.children+d.infants} Passenger${d.adults+d.children+d.infants!==1?"s":""}`},k=()=>{const s=document.getElementById("aviaframe-age-selectors");for(;d.childrenAges.length<d.children;)d.childrenAges.push(2);for(;d.childrenAges.length>d.children;)d.childrenAges.pop();for(;d.infantAges.length<d.infants;)d.infantAges.push(1);for(;d.infantAges.length>d.infants;)d.infantAges.pop();const $=d.childrenAges.map((x,m)=>`
        <div class="aviaframe-age-item">
          <label>Child ${m+1} age</label>
          <select data-age-type="child" data-age-index="${m}">
            ${Array.from({length:10},(y,R)=>R+2).map(y=>`<option value="${y}" ${y===x?"selected":""}>${y}</option>`).join("")}
          </select>
        </div>
      `).join(""),z=d.infantAges.map((x,m)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${m+1} age</label>
          <select data-age-type="infant" data-age-index="${m}">
            ${Array.from({length:2},(y,R)=>R).map(y=>`<option value="${y}" ${y===x?"selected":""}>${y}</option>`).join("")}
          </select>
        </div>
      `).join("");s.innerHTML=$+z,s.querySelectorAll("select[data-age-type]").forEach(x=>{x.addEventListener("change",()=>{const m=x.getAttribute("data-age-type"),y=Number(x.getAttribute("data-age-index")),R=Number(x.value);m==="child"?d.childrenAges[y]=R:d.infantAges[y]=R,I()})}),I()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(s=>{s.addEventListener("click",()=>{const $=s.getAttribute("data-counter"),z=Number(s.getAttribute("data-delta")),x=b[$];if(!x)return;const m=Math.max(x.min,Math.min(x.max,d[$]+z));d[$]=m;const y=document.getElementById(`aviaframe-count-${$}`);y&&(y.textContent=m),k()})}),k()}function ae(e,n){const t=document.getElementById(e),r=document.getElementById(n);if(!t||!r)return;let a=-1;t.addEventListener("input",function(){const l=this.value;if(l.length<1){r.style.display="none";return}const u=ye(l);if(u.length===0){r.style.display="none";return}r.innerHTML=u.map((f,v)=>`
        <div class="aviaframe-autocomplete-item" data-index="${v}" data-code="${f.code}">
          <div>
            <span class="aviaframe-airport-code">${f.code}</span>
            <span class="aviaframe-airport-city">${f.city} / ${f.cityRu}</span>
          </div>
          <span class="aviaframe-airport-name">${f.name}, ${f.country}</span>
        </div>
      `).join(""),r.style.display="block",a=-1,r.querySelectorAll(".aviaframe-autocomplete-item").forEach((f,v)=>{f.addEventListener("click",function(){const b=u[v];t.value=`${b.city} (${b.code})`,t.dataset.code=b.code,r.style.display="none"})})}),t.addEventListener("keydown",function(l){const u=r.querySelectorAll(".aviaframe-autocomplete-item");u.length!==0&&(l.key==="ArrowDown"?(l.preventDefault(),a=Math.min(a+1,u.length-1),ce(u,a)):l.key==="ArrowUp"?(l.preventDefault(),a=Math.max(a-1,0),ce(u,a)):l.key==="Enter"&&a>=0?(l.preventDefault(),u[a].click()):l.key==="Escape"&&(r.style.display="none"))}),document.addEventListener("click",function(l){!t.contains(l.target)&&!r.contains(l.target)&&(r.style.display="none")})}function ce(e,n){e.forEach((t,r)=>{r===n?(t.classList.add("active"),t.scrollIntoView({block:"nearest"})):t.classList.remove("active")})}function ke(e){const n=document.getElementById("aviaframe-search-form"),t=document.getElementById("aviaframe-results");n.addEventListener("submit",async function(r){r.preventDefault();const a=document.getElementById("aviaframe-origin"),l=document.getElementById("aviaframe-destination"),u=document.getElementById("aviaframe-depart-date").value,f=document.getElementById("aviaframe-return-date").value,v=parseInt(document.getElementById("aviaframe-adults").value,10),b=parseInt(document.getElementById("aviaframe-children").value,10)||0,d=parseInt(document.getElementById("aviaframe-infants").value,10)||0,I=document.getElementById("aviaframe-trip-type").value||"return",k=document.getElementById("aviaframe-cabin").value,s=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),$=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),z=a.dataset.code,x=l.dataset.code;if(!z||!x){t.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select airports from the dropdown.
          </div>
        `;return}if(!u){t.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select departure date.
          </div>
        `;return}if(I==="return"&&(!f||f<=u)){t.innerHTML=`<div class="aviaframe-error"><strong>Error:</strong> ${f?"Return date must be after the departure date.":"Please select a return date."}</div>`;return}t.innerHTML=`
        <div class="aviaframe-loading">
          <div class="aviaframe-spinner"></div>
          <div>Searching for flights...</div>
        </div>
      `;let m={origin:z,destination:x,depart_date:u,return_date:f||null,adults:v,children:b,infants:d,children_ages:s,infant_ages:$,cabin_class:k,trip_type:I};if(I==="one_way"&&(m.return_date=null),I==="multi_city"){const c=document.getElementById("aviaframe-origin-2"),p=document.getElementById("aviaframe-destination-2"),S=document.getElementById("aviaframe-depart-date-2").value,_=c==null?void 0:c.dataset.code,T=p==null?void 0:p.dataset.code;if(!_||!T||!S){t.innerHTML=`
            <div class="aviaframe-error">
              <strong>Error:</strong> For Multi-city please fill second segment: From, To and Date.
            </div>
          `;return}m.segments=[{origin:z,destination:x,depart_date:u},{origin:_,destination:T,depart_date:S}]}const y=c=>String(c||"").replace(/\/+$/,""),R=c=>{const p=y(c);return p.endsWith("/search")?p:`${p}/search`},i=c=>{const p=y(c);return p.includes("/api/drct/")?p.replace("/api/drct/","/api/n8n/webhook-test/drct/"):p.endsWith("/api/drct")?p.replace("/api/drct","/api/n8n/webhook-test/drct"):p},o=c=>{const p=y(c),S=[p,R(p),i(p)];return[...new Set(S.filter(Boolean))]};try{let c=null;const p=o(e);for(const _ of p)if(c=await fetch(_,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(m)}),c.ok||c.status!==404)break;if(!c.ok)throw new Error(`HTTP ${c.status}: ${c.statusText}`);const S=await c.json();if(S.offers&&S.offers.length>0){const _=S.offers.map(T=>{const L={...T,_searchOrigin:m.origin||(T==null?void 0:T._searchOrigin)||null,_searchDestination:m.destination||(T==null?void 0:T._searchDestination)||null,_searchReturnDate:m.return_date||(T==null?void 0:T._searchReturnDate)||null};if(!(L!=null&&L.return_origin&&L!=null&&L.return_destination||L!=null&&L.return_departure_time&&L!=null&&L.return_arrival_time)&&m.return_date){const w=Se(L);w&&Object.assign(L,w),L.return_origin||(L.return_origin=m.destination||null),L.return_destination||(L.return_destination=m.origin||null)}return L});ue(_)}else t.innerHTML=`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No flights found</div>
              <div>Try adjusting your search criteria</div>
            </div>
          `}catch(c){const p=String((c==null?void 0:c.message)||""),S=p.includes("HTTP 404");if((c==null?void 0:c.name)==="TypeError"||p.includes("Failed to fetch")||p.toLowerCase().includes("cors")||S){const _=Re(m);ue(_),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",c);return}t.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${p}
          </div>
        `}})}function Ae(e){return e?`https://pics.avs.io/200/80/${e}.png`:null}function Ee(e){var _,T,L;const n={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,passengers:e.passengers||[],selected_at:new Date().toISOString()};localStorage.setItem("selectedOffer",JSON.stringify(n)),console.log("✅ Offer selected:",e.offer_id),window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:n},bubbles:!0}));const t=document.querySelector(".aviaframe-widget"),r=document.getElementById("aviaframe-results"),a=document.getElementById("aviaframe-search-form");if(!t){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:n},bubbles:!0})),j.checkoutUrl&&(window.location.href=j.checkoutUrl);return}a&&(a.style.display="none"),r&&(r.style.display="none");const l=document.getElementById("aviaframe-passenger-step");l&&l.remove();const u=((e==null?void 0:e.price)||{}).currency||"UAH",f=Math.round(((e==null?void 0:e.price)||{}).total||0).toLocaleString("en-US"),v=e.airline_name||e.airline||"Airline",b=e.origin||"---",d=e.destination||"---",I=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",k=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A",s=parseInt(((_=document.getElementById("aviaframe-adults"))==null?void 0:_.value)||"1",10)||1,$=parseInt(((T=document.getElementById("aviaframe-children"))==null?void 0:T.value)||"0",10)||0,z=parseInt(((L=document.getElementById("aviaframe-infants"))==null?void 0:L.value)||"0",10)||0,x=[];for(let w=0;w<s;w++)x.push({id:"ADT"+(w+1),type:"ADT"});for(let w=0;w<$;w++)x.push({id:"CHD"+(w+1),type:"CHD"});for(let w=0;w<z;w++)x.push({id:"INF"+(w+1),type:"INF"});x.length||x.push({id:"T1",type:"ADT"});const m={};function y(w){m[w]=(m[w]||0)+1;const N=m[w];return w==="ADT"?"Adult "+N:w==="CHD"?"Child "+N:w==="INF"?"Infant "+N:"Passenger "+N}function R(w,N){const G=w.type||"ADT",E=y(G),M=G==="ADT"?"18+ years":G==="CHD"?"2–11 years":"Under 2 years";return'<div class="avf-pax-section" data-pax-idx="'+N+'" data-pax-type="'+G+'" style="grid-column:1/-1;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:8px"><div style="font-size:18px;font-weight:700;color:#1f2937;margin-bottom:12px">'+E+' <span style="font-size:13px;font-weight:400;color:#94a3b8">'+M+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">First Name *</span><input required data-field="firstName" placeholder="John" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Last Name *</span><input required data-field="lastName" placeholder="Doe" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Gender *</span><select data-field="gender" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px"><option value="M">Male</option><option value="F">Female</option></select></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Date of Birth *</span><input required type="date" lang="en" data-field="dateOfBirth" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Number *</span><input required data-field="passportNumber" placeholder="AB1234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Expiry *</span><input required type="date" lang="en" data-field="passportExpiry" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label></div></div>'}const i=x.map((w,N)=>R(w,N)).join(""),o=document.createElement("div");o.id="aviaframe-passenger-step",o.style.marginTop="16px",o.style.border="1px solid #d9e3f3",o.style.borderRadius="12px",o.style.padding="16px",o.style.background="#fff",o.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px"><div><div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.1">Selected Flight</div><div style="margin-top:8px;font-size:20px;font-weight:700;color:#1f2937">'+b+" → "+d+' <span style="font-size:18px;font-weight:600;color:#64748b">'+v+'</span></div><div style="margin-top:6px;font-size:16px;color:#475569">Departure: '+I+" | Arrival: "+k+'</div></div><div style="text-align:right"><div style="font-size:56px;line-height:1;font-weight:800;color:#2563eb">'+f+" "+u+'</div><div style="margin-top:6px;font-size:20px;color:#64748b">total</div></div></div><div style="font-size:38px;font-weight:800;color:#0f172a;margin:16px 0 10px">Passenger Details</div><form id="aviaframe-passenger-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="grid-column:1/-1;font-size:20px;font-weight:700;color:#1f2937;margin-top:2px">Contact Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Email Address *</span><input required type="email" name="email" placeholder="name@example.com" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Phone Number *</span><input required name="phone" placeholder="+971501234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1/-1;height:1px;background:#e2e8f0;margin:6px 0"></div>'+i+'<div style="grid-column:1/-1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1/-1;font-size:20px;font-weight:700;color:#1f2937">Payment Method</div><div style="grid-column:1/-1;display:flex;flex-direction:column;gap:10px"><label style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #2563eb;border-radius:10px;cursor:pointer;background:#eff6ff"><input type="radio" name="paymentMethod" value="bank_transfer" checked style="width:18px;height:18px;accent-color:#2563eb" /><div><div style="font-size:15px;font-weight:700;color:#1e3a8a">Bank Transfer</div><div style="font-size:13px;color:#3b82f6">Transfer to agency bank account</div></div></label><label style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #e2e8f0;border-radius:10px;cursor:pointer"><input type="radio" name="paymentMethod" value="cash" style="width:18px;height:18px;accent-color:#2563eb" /><div><div style="font-size:15px;font-weight:700;color:#1f2937">Cash at Office</div><div style="font-size:13px;color:#64748b">Pay in person at our office</div></div></label></div><div id="aviaframe-passenger-error" style="grid-column:1/-1;display:none;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px;font-size:14px"></div><div style="grid-column:1/-1;display:flex;justify-content:space-between;gap:10px;margin-top:6px"><button type="button" id="aviaframe-passenger-back" style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:600">Back</button><button type="submit" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer">Continue to booking</button></div></form>',t.appendChild(o),window.scrollTo({top:0,behavior:"smooth"});const c=o.querySelector("#aviaframe-passenger-back"),p=o.querySelector("#aviaframe-passenger-form"),S=o.querySelector("#aviaframe-passenger-error");c&&c.addEventListener("click",()=>{o.remove(),a&&(a.style.display=""),r&&(r.style.display="")}),function(N,G){if(!N)return;function E(h,C){let q=h.parentNode.querySelector(".avf-ferr");q||(q=document.createElement("span"),q.className="avf-ferr",q.style.cssText="color:#b91c1c;font-size:12px;margin-top:2px;display:block",h.parentNode.appendChild(q)),q.textContent=C,h.style.borderColor="#ef4444"}function M(h){const C=h.parentNode.querySelector(".avf-ferr");C&&(C.textContent=""),h.style.borderColor="#cbd5e1"}const U=N.querySelector('[name="email"]'),P=N.querySelector('[name="phone"]');function V(){const h=U.value.trim();h?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h)?M(U):E(U,"Invalid email address"):E(U,"Email is required")}function X(){const h=P.value.trim();h?/^\+\d{7,15}$/.test(h)?M(P):E(P,"Format: +971501234567"):E(P,"Phone is required")}U&&(U.addEventListener("input",V),U.addEventListener("blur",V)),P&&(P.addEventListener("input",X),P.addEventListener("blur",X)),N.querySelectorAll(".avf-pax-section").forEach(function(h){const C=h.dataset.paxType||"ADT";function q(A){const H=A.value.trim();H?/^[A-Za-z\s\-']+$/.test(H)?M(A):E(A,"Latin letters only"):E(A,"Required")}const K=h.querySelector('[data-field="firstName"]'),W=h.querySelector('[data-field="lastName"]'),Q=h.querySelector('[data-field="dateOfBirth"]'),D=h.querySelector('[data-field="passportNumber"]'),B=h.querySelector('[data-field="passportExpiry"]');K&&(K.addEventListener("input",function(){q(this)}),K.addEventListener("blur",function(){q(this)})),W&&(W.addEventListener("input",function(){q(this)}),W.addEventListener("blur",function(){q(this)})),Q&&Q.addEventListener("change",function(){const A=this.value;if(!A){E(this,"Date of birth required");return}const H=new Date(A);if(isNaN(H.getTime())){E(this,"Invalid date");return}const J=(Date.now()-H.getTime())/(365.25*24*3600*1e3);C==="ADT"&&J<18?E(this,"Adult must be 18+ years old"):C==="CHD"&&J<2?E(this,"Child must be at least 2 years old"):C==="CHD"&&J>=12?E(this,"Child must be under 12 years old"):C==="INF"&&J>=2?E(this,"Infant must be under 2 years old"):M(this)}),D&&(D.addEventListener("input",function(){this.value=this.value.toUpperCase();const A=this.value.trim();A?A.length<6?E(this,"At least 6 characters"):/^[A-Z0-9]+$/.test(A)?M(this):E(this,"Letters and digits only"):E(this,"Required")}),D.addEventListener("blur",function(){const A=this.value.trim();A?A.length<6?E(this,"At least 6 characters"):/^[A-Z0-9]+$/.test(A)?M(this):E(this,"Letters and digits only"):E(this,"Required")})),B&&B.addEventListener("change",function(){const A=this.value;if(!A){E(this,"Expiry required");return}const H=new Date(A+"T00:00:00");if(H<new Date){E(this,"Passport has expired");return}const O=new Date;if(O.setMonth(O.getMonth()+6),H<O){E(this,"Must be valid 6+ months");return}M(this)})})}(o.querySelector("#aviaframe-passenger-form")),p&&p.addEventListener("submit",w=>{var K,W,Q;w.preventDefault();const N=(e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10),G=new Date(N+"T00:00:00"),E=new Date(G);E.setMonth(E.getMonth()+6);const M=new Date,U=String(((K=p.querySelector('[name="email"]'))==null?void 0:K.value)||""),P=String(((W=p.querySelector('[name="phone"]'))==null?void 0:W.value)||""),V=String(((Q=p.querySelector('[name="paymentMethod"]:checked'))==null?void 0:Q.value)||"bank_transfer"),X=p.querySelectorAll(".avf-pax-section"),h=[];let C=null;for(let D=0;D<X.length;D++){const B=X[D],A=B.dataset.paxType||"ADT",H=parseInt(B.dataset.paxIdx,10),J=x[H]||{},O=F=>{var Z;return String(((Z=B.querySelector('[data-field="'+F+'"]'))==null?void 0:Z.value)||"")},me=O("firstName"),fe=O("lastName"),Ne=O("gender")||"M",le=O("dateOfBirth"),Me=O("passportNumber"),de=O("passportExpiry");if(!me||!fe){C="Please fill in name for passenger "+(D+1)+".";break}if(!le){C="Please enter date of birth for passenger "+(D+1)+".";break}const ee=new Date(le);if(isNaN(ee.getTime())){C="Invalid date of birth for passenger "+(D+1)+".";break}if(A==="ADT"){const F=new Date(ee);if(F.setFullYear(F.getFullYear()+18),F>M){C="Adult "+(D+1)+" must be at least 18 years old.";break}}else if(A==="CHD"){const F=new Date(ee);F.setFullYear(F.getFullYear()+2);const Z=new Date(ee);if(Z.setFullYear(Z.getFullYear()+12),F>M){C="Child "+(D+1)+" must be at least 2 years old.";break}if(Z<=M){C="Child "+(D+1)+" must be under 12 years old.";break}}else if(A==="INF"){const F=new Date(ee);if(F.setFullYear(F.getFullYear()+2),F<=M){C="Infant "+(D+1)+" must be under 2 years old.";break}}if(!de){C="Please enter passport expiry for passenger "+(D+1)+".";break}const ve=new Date(de+"T00:00:00");if(isNaN(ve.getTime())||ve<E){C="Passport for passenger "+(D+1)+" must be valid 6+ months from trip date.";break}h.push({type:A,pax_id:J.id||"T"+(H+1),first_name:me,last_name:fe,gender:Ne,date_of_birth:le,email:U,phone:P,document:{type:"REGULAR_PASSPORT",number:Me,expiry_date:de,issuing_country:"AE",citizenship:"AE",country_of_issue:"AE"},payment_method:V})}if(C){S&&(S.textContent=C,S.style.display="block");return}S&&(S.style.display="none");const q=h[0]?{firstName:h[0].first_name,lastName:h[0].last_name,email:U,phone:P,gender:h[0].gender,dateOfBirth:h[0].date_of_birth,passportNumber:h[0].document.number,passportExpiry:h[0].document.expiry_date,paymentMethod:V}:null;localStorage.setItem("passengerData",JSON.stringify(q)),window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:n,passenger:q,passengers:h},bubbles:!0})),(()=>{const D=B=>{var H;const A=B?'<div style="font-size:13px;color:#64748b;margin-bottom:16px">Reference: <strong>'+B+"</strong></div>":"";o.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:52px;margin-bottom:16px">✅</div><div style="font-size:24px;font-weight:800;color:#166534;margin-bottom:10px">Booking Request Received!</div><div style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:16px">Thank you, <strong>'+(((H=h[0])==null?void 0:H.first_name)||"")+"</strong>! Your booking request has been received.<br>We will contact you at <strong>"+U+"</strong><br>to confirm the booking and send payment instructions.</div>"+A+'<button type="button" id="aviaframe-passenger-back2" style="border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600;font-size:14px">Search again</button></div>',o.querySelector("#aviaframe-passenger-back2")&&o.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{o.remove(),a&&(a.style.display=""),r&&(r.style.display="")})};j.checkoutUrl?window.location.href=j.checkoutUrl:j.bookingUrl?(o.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:36px;margin-bottom:12px">⏳</div><div style="font-size:16px;color:#374151">Sending booking request…</div></div>',fetch(j.bookingUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({offer:n,passengers:h,contacts:{email:U,phone:P}})}).then(B=>B.json().catch(()=>({}))).then(B=>{if(B.success===!1||B.statusCode>=400||B.error){o.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:52px;margin-bottom:16px">❌</div><div style="font-size:24px;font-weight:800;color:#b91c1c;margin-bottom:12px">Booking Failed</div><div style="font-size:15px;color:#374151;margin-bottom:20px">'+(B.message||B.error||"Something went wrong. Please try again or contact us.")+'</div><button type="button" id="aviaframe-err-back" style="border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600">← Search again</button></div>';const A=o.querySelector("#aviaframe-err-back");A&&A.addEventListener("click",()=>{o.remove(),a&&(a.style.display=""),r&&(r.style.display="")});return}D(B.order_number||B.order_id||null)}).catch(()=>{D(null)})):D(null)})()})}function Y(e,n=0){const t=Number(e);return Number.isFinite(t)?t:n}function g(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function re(e,n){return`${Math.round(Y(e,0)).toLocaleString("uk-UA")} ${n||"UAH"}`}function te(e){if(!e)return"--:--";const n=String(e).match(/T(\d{2}:\d{2})/);return n?n[1]:String(e)}function ie(e){return e?String(e).trim().toUpperCase():null}function ne(e){var n;return ie((e==null?void 0:e.origin_code)||((n=e==null?void 0:e.departure_airport)==null?void 0:n.code)||(e==null?void 0:e.origin))}function oe(e){var n;return ie((e==null?void 0:e.destination_code)||((n=e==null?void 0:e.arrival_airport)==null?void 0:n.code)||(e==null?void 0:e.destination))}function $e(e){return(e==null?void 0:e.departure)||[e==null?void 0:e.departure_date,e==null?void 0:e.departure_time].filter(Boolean).join("T")}function Te(e){return(e==null?void 0:e.arrival)||[e==null?void 0:e.arrival_date,e==null?void 0:e.arrival_time].filter(Boolean).join("T")}function Se(e){const n=Array.isArray(e==null?void 0:e.segments)?e.segments:[];if(!n.length)return null;const t=ie((e==null?void 0:e._searchOrigin)||(e==null?void 0:e.origin)),r=ie((e==null?void 0:e._searchDestination)||(e==null?void 0:e.destination));if(!t||!r)return null;let a=-1;for(let k=1;k<n.length;k+=1){const s=ne(n[k]),$=oe(n[k]);if(s===r||$===t){a=k;break}}if(a<0)return null;const l=n.slice(a),u=l[0],f=l[l.length-1],v=ne(u)||r,b=oe(f)||t,d=$e(u)||null,I=Te(f)||null;return!v||!b?null:{return_origin:v,return_destination:b,return_departure_time:d,return_arrival_time:I}}function Ie(e){if(e.duration_minutes)return Y(e.duration_minutes,0);if(e.durationMinutes)return Y(e.durationMinutes,0);if(e.journey_time)return Math.round(Y(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const n=new Date(e.departure_time).getTime(),t=new Date(e.arrival_time).getTime();return!Number.isFinite(n)||!Number.isFinite(t)||t<=n?0:Math.round((t-n)/6e4)}function Le(e,n){if(!e||!n)return 0;const t=new Date(e).getTime(),r=new Date(n).getTime();return!Number.isFinite(t)||!Number.isFinite(r)||r<=t?0:Math.round((r-t)/6e4)}function pe(e){const n=Y(e,0),t=Math.floor(n/60),r=n%60;return n<=0?"n/a":`${t}h ${r}m`}function Ce(e){return e.stops!==void 0?Y(e.stops,0):e.transfers_count!==void 0?Y(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function De(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function Be(e){const n=(e.airline_code||e.airline||"").toString().trim();return n?n.slice(0,2).toUpperCase():"NA"}function ze(e){var n,t;const r=Y((n=e==null?void 0:e.price)==null?void 0:n.total,0),a=((t=e==null?void 0:e.price)==null?void 0:t.currency)||"UAH",l=Ce(e),u=Array.isArray(e==null?void 0:e.segments)?e.segments.map(s=>{var $,z,x;return{origin:(()=>{const m=ne(s),y=(s==null?void 0:s.origin)||(($=s==null?void 0:s.departure_city)==null?void 0:$.name)||"";return m?y&&y.toUpperCase()!==m?`${m} (${y})`:m:y||"N/A"})(),destination:(()=>{const m=oe(s),y=(s==null?void 0:s.destination)||((z=s==null?void 0:s.arrival_city)==null?void 0:z.name)||"";return m?y&&y.toUpperCase()!==m?`${m} (${y})`:m:y||"N/A"})(),departure:(s==null?void 0:s.departure)||[s==null?void 0:s.departure_date,s==null?void 0:s.departure_time].filter(Boolean).join(" ")||"N/A",arrival:(s==null?void 0:s.arrival)||[s==null?void 0:s.arrival_date,s==null?void 0:s.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((x=s==null?void 0:s.carrier)==null?void 0:x.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:(s==null?void 0:s.flight_number)||"N/A"}}):[],f=!!(e!=null&&e.return_origin&&e!=null&&e.return_destination||e!=null&&e.return_departure_time&&e!=null&&e.return_arrival_time),v=f?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",b=f?te(e.return_departure_time):"--:--",d=f?te(e.return_arrival_time):"--:--",I=f?Le(e.return_departure_time,e.return_arrival_time):0,k=f?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:Be(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:te(e.departure_time),arrive:te(e.arrival_time),durationMinutes:Ie(e),stops:l,stopsText:De(l),priceTotal:r,priceCurrency:a,baggageText:e.baggage_text||(e.with_baggage?"With baggage":"No baggage"),segments:u,hasReturnData:f,returnRoute:v,returnDepart:b,returnArrive:d,returnDurationMinutes:I,returnSummary:k}}function Re(e){const n=e.origin||"WAW",t=e.destination||"YVR",r=e.depart_date||"2026-02-27",a=e.return_date||"",l=e.trip_type!=="one_way"&&!!a,u=(f,v,b,d=[])=>{const I=k=>({origin:k.from,destination:k.to,departure:k.depart,arrival:k.arrive,carrier:{airline_code:f,airline_name:v},flight_number:k.flight});return[...b.map(I),...d.map(I)]};return[{offer_id:"fallback_1",origin:n,destination:t,departure_time:`${r}T13:05:00`,arrival_time:`${r}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:l?t:null,return_destination:l?n:null,return_departure_time:l?`${a}T14:20:00`:null,return_arrival_time:l?`${a}T22:40:00`:null,segments:u("DL","DELTA",[{from:n,to:"CDG",depart:`${r}T13:05:00`,arrive:`${r}T16:10:00`,flight:"737"},{from:"CDG",to:t,depart:`${r}T17:05:00`,arrive:`${r}T23:25:00`,flight:"4200"}],l?[{from:t,to:"FRA",depart:`${a}T14:20:00`,arrive:`${a}T17:10:00`,flight:"9655"},{from:"FRA",to:n,depart:`${a}T18:30:00`,arrive:`${a}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"UAH"}},{offer_id:"fallback_2",origin:n,destination:t,departure_time:`${r}T08:10:00`,arrival_time:`${r}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:l?t:null,return_destination:l?n:null,return_departure_time:l?`${a}T09:00:00`:null,return_arrival_time:l?`${a}T20:30:00`:null,segments:u("LO","LOT",[{from:n,to:t,depart:`${r}T08:10:00`,arrive:`${r}T22:00:00`,flight:"441"}],l?[{from:t,to:n,depart:`${a}T09:00:00`,arrive:`${a}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"UAH"}},{offer_id:"fallback_3",origin:n,destination:t,departure_time:`${r}T06:45:00`,arrival_time:`${r}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:l?t:null,return_destination:l?n:null,return_departure_time:l?`${a}T07:10:00`:null,return_arrival_time:l?`${a}T19:55:00`:null,segments:u("AC","AIR CANADA",[{from:n,to:"MUC",depart:`${r}T06:45:00`,arrive:`${r}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${r}T11:50:00`,arrive:`${r}T14:50:00`,flight:"837"},{from:"YYZ",to:t,depart:`${r}T18:40:00`,arrive:`${r}T23:15:00`,flight:"835"}],l?[{from:t,to:"YYZ",depart:`${a}T07:10:00`,arrive:`${a}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${a}T12:00:00`,arrive:`${a}T16:00:00`,flight:"838"},{from:"MUC",to:n,depart:`${a}T17:20:00`,arrive:`${a}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"UAH"}}]}function ue(e,n={}){const t=document.getElementById("aviaframe-results"),r=e.map(ze).map((i,o)=>({...i,id:i.offer.offer_id||`offer_${o}`,airlineLogo:Ae(i.carrierCode)})),a={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set},l=i=>a.quickFilter==="nonstop"?i.filter(o=>o.stops===0):a.quickFilter==="one_stop"?i.filter(o=>o.stops===1):a.quickFilter==="baggage"?i.filter(o=>/baggage|bag/i.test(o.baggageText||"")):i,u=i=>i.length?{count:i.length,minPrice:Math.min(...i.map(o=>o.priceTotal))}:{count:0,minPrice:null},f=()=>({all:u(r),nonstop:u(r.filter(i=>i.stops===0)),one_stop:u(r.filter(i=>i.stops===1)),baggage:u(r.filter(i=>/baggage|bag/i.test(i.baggageText||"")))}),v=()=>{const i=l(r),o=new Map;return i.forEach(c=>{const p=c.carrierCode||"NA";if(!o.has(p))o.set(p,{code:p,name:c.airlineName||p,logo:c.airlineLogo,count:1,minPrice:c.priceTotal});else{const S=o.get(p);S.count+=1,S.minPrice=Math.min(S.minPrice,c.priceTotal)}}),Array.from(o.values()).sort((c,p)=>c.minPrice-p.minPrice).slice(0,8)},b=i=>`
      <div class="aviaframe-details-panel">
        ${i.segments.length?i.segments.map(o=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${g(o.origin)} → ${g(o.destination)}</div>
            <div class="aviaframe-detail-meta">${g(o.departure)} → ${g(o.arrival)}</div>
            <div class="aviaframe-detail-meta">${g(o.airline)} • flight ${g(o.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${g(i.route)}</div>
            <div class="aviaframe-detail-meta">${g(i.depart)} → ${g(i.arrive)}</div>
          </div>
        `}
      </div>
    `,d=(i,o="")=>`
      <article class="aviaframe-flight-card ${o}" data-offer-id="${g(i.id)}">
        <div class="aviaframe-flight-main">
          <div class="aviaframe-segment">
            <div>
              <div class="aviaframe-airline-header">
                ${i.airlineLogo?`<img class="aviaframe-airline-logo" src="${i.airlineLogo}" alt="${g(i.airlineName)}" onerror="this.style.display='none'">`:""}
                <div class="aviaframe-airline">${g(i.airlineName)}</div>
              </div>
              <div class="aviaframe-class">Economy class</div>
            </div>
            <div>
              <div class="aviaframe-time">${g(i.depart)} - ${g(i.arrive)}</div>
              <div class="aviaframe-duration">${g(pe(i.durationMinutes))} total travel time</div>
            </div>
            <div>
              <div class="aviaframe-route">${g(i.route)}</div>
              <div class="aviaframe-transfer">${g(i.stopsText)}</div>
            </div>
          </div>
          ${i.hasReturnData?`
            <div class="aviaframe-segment">
              <div>
                <div class="aviaframe-airline-header">
                  ${i.airlineLogo?`<img class="aviaframe-airline-logo" src="${i.airlineLogo}" alt="${g(i.airlineName)}" onerror="this.style.display='none'">`:""}
                  <div class="aviaframe-airline">${g(i.airlineName)}</div>
                </div>
                <div class="aviaframe-class">Economy class</div>
              </div>
              <div>
                <div class="aviaframe-time">${g(i.returnDepart)} - ${g(i.returnArrive)}</div>
                <div class="aviaframe-duration">${g(pe(i.returnDurationMinutes||i.durationMinutes))} total travel time</div>
              </div>
              <div>
                <div class="aviaframe-route">${g(i.returnRoute)}</div>
                <div class="aviaframe-transfer">${g(i.stopsText)}</div>
              </div>
            </div>
          `:""}
          <div class="aviaframe-card-actions">
            <button type="button" class="aviaframe-details-toggle" data-details-id="${g(i.id)}">
              ${a.expandedIds.has(i.id)?"Hide details":"Details"}
            </button>
          </div>
          ${a.expandedIds.has(i.id)?b(i):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${g(i.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${g(re(i.priceTotal,i.priceCurrency))}</div>
          <button class="aviaframe-select-button" data-select-id="${g(i.id)}">Select</button>
        </aside>
      </article>
    `,I=()=>{let i=l(r);return a.selectedAirlines.size&&(i=i.filter(o=>a.selectedAirlines.has(o.carrierCode))),i=[...i],a.sort==="airline"?i.sort((o,c)=>o.airlineName.localeCompare(c.airlineName)):a.sort==="fastest"?i.sort((o,c)=>o.durationMinutes-c.durationMinutes):i.sort((o,c)=>o.priceTotal-c.priceTotal),i},k=(i,o,c)=>`
      <button type="button" class="aviaframe-quick-item ${a.quickFilter===i?"active":""}" data-quick="${i}">
        <div class="aviaframe-quick-title">${o}</div>
        <div class="aviaframe-quick-meta">${c.count} flights${c.minPrice!==null?` · from ${re(c.minPrice,"UAH")}`:""}</div>
      </button>
    `,s=i=>i.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${i.map(o=>`
              <button type="button" class="aviaframe-airline-card ${a.selectedAirlines.has(o.code)?"active":""}" data-airline="${g(o.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${o.logo?`<img class="aviaframe-airline-logo-big" src="${o.logo}" alt="${g(o.name)}" onerror="this.style.display='none'">`:`<span>${g(o.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${g(o.name)}</div>
                <div class="aviaframe-airline-card-price">from ${g(re(o.minPrice,"UAH"))}</div>
                <div class="aviaframe-airline-card-count">${o.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",$=`
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
    `;t.innerHTML=$;const z=document.getElementById("aviaframe-cards-container"),x=document.getElementById("aviaframe-selected-flight"),m=document.getElementById("aviaframe-quick-grid"),y=document.getElementById("aviaframe-airline-filter-wrap"),R=()=>{const i=f();m.innerHTML=[k("all","All",i.all),k("nonstop","Non-stop",i.nonstop),k("one_stop","1 stop",i.one_stop),k("baggage","With baggage",i.baggage)].join("");const o=v();y.innerHTML=s(o);const c=I(),p=a.selectedId?c.find(_=>_.id===a.selectedId):null;x.innerHTML=p?`<div class="aviaframe-selected-title">Selected flight</div>${d(p,"selected")}`:"";const S=c.filter(_=>_.id!==a.selectedId);z.innerHTML=S.length?S.map(_=>d(_)).join(""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',t.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(_=>{_.addEventListener("click",()=>{const T=_.getAttribute("data-select-id"),L=r.find(w=>w.id===T);L&&(a.selectedId=T,Ee(L.offer))})}),t.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(_=>{_.addEventListener("click",()=>{const T=_.getAttribute("data-details-id");a.expandedIds.has(T)?a.expandedIds.delete(T):a.expandedIds.add(T),R()})}),t.querySelectorAll("[data-quick]").forEach(_=>{_.addEventListener("click",()=>{a.quickFilter=_.getAttribute("data-quick"),R()})}),t.querySelectorAll("[data-airline]").forEach(_=>{_.addEventListener("click",()=>{const T=_.getAttribute("data-airline");a.selectedAirlines.has(T)?a.selectedAirlines.delete(T):a.selectedAirlines.add(T),R()})})};t.querySelectorAll("[data-sort]").forEach(i=>{i.addEventListener("click",()=>{a.sort=i.getAttribute("data-sort"),t.querySelectorAll("[data-sort]").forEach(o=>o.classList.remove("active")),t.querySelectorAll(`[data-sort="${a.sort}"]`).forEach(o=>o.classList.add("active")),R()})}),R(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}function se(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const n=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";j.checkoutUrl=e.dataset.checkoutUrl||null,j.bookingUrl=String(e.dataset.bookingUrl||"").trim()||null;const t=String(e.dataset.primaryColor||"").trim(),r=String(e.dataset.logoUrl||"").trim(),a=String(e.dataset.title||"").trim(),l=String(e.dataset.language||"en").toLowerCase(),u=document.createElement("style");if(u.textContent=he,document.head.appendChild(u),t&&/^#[0-9a-fA-F]{3,8}$/.test(t)){const v=document.createElement("style");v.textContent=`.aviaframe-select-button{background:${t}!important}.aviaframe-quick-item.active{background:${t}!important;border-color:${t}!important}.aviaframe-sort-btn.active{color:${t}!important}.aviaframe-flight-card.selected{border-color:${t}!important}.aviaframe-airline-card.active{border-color:${t}!important;color:${t}!important}`,document.head.appendChild(v)}e.className="aviaframe-widget",e.innerHTML=we();const f=e.querySelector(".aviaframe-title");if(f&&(a&&(f.innerHTML=a),r&&!/^javascript:/i.test(r))){const v=document.createElement("img");v.src=r,v.alt="",v.style.cssText="height:28px;max-width:110px;object-fit:contain;vertical-align:middle;margin-right:8px",v.onerror=function(){this.remove()},f.insertBefore(v,f.firstChild)}if(l==="ru"){const v={Return:"Туда-обратно","One-way":"В одну сторону","Multi-city":"Несколько городов",Economy:"Эконом","Premium Economy":"Эконом плюс",Business:"Бизнес",First:"Первый класс","Search flights":"Поиск рейсов",From:"Откуда",To:"Куда","Departure date":"Дата вылета","Return date":"Дата возврата",Adults:"Взрослые",Children:"Дети",Infants:"Младенцы","Cabin bags":"Ручная кладь","Checked bags":"Багаж",Passengers:"Пассажиры",Done:"Готово","✈️ Flight Search":"✈️ Поиск рейсов"};e.querySelectorAll("*").forEach(b=>{if(b.children.length===0){const d=b.textContent.trim();d in v&&(b.textContent=v[d])}})}setTimeout(()=>{_e(),ae("aviaframe-origin","aviaframe-origin-autocomplete"),ae("aviaframe-destination","aviaframe-destination-autocomplete"),ae("aviaframe-origin-2","aviaframe-origin-2-autocomplete"),ae("aviaframe-destination-2","aviaframe-destination-2-autocomplete"),ke(n),["aviaframe-depart-date","aviaframe-return-date","aviaframe-depart-date-2"].forEach(v=>{const b=document.getElementById(v);b&&b.setAttribute("lang","en")}),(()=>{const v=document.getElementById("aviaframe-depart-date"),b=document.getElementById("aviaframe-return-date"),d=document.getElementById("aviaframe-return-date-error");if(!v||!b||!d)return;const I=()=>{const k=v.value,s=b.value,$=document.getElementById("aviaframe-trip-type");if(!$||$.value==="one_way"||$.value==="multi_city"){d.style.display="none",b.classList.remove("aviaframe-input--error");return}s&&k&&s<=k?(d.textContent="Return date must be after the departure date.",d.style.display="block",b.classList.add("aviaframe-input--error")):(d.style.display="none",b.classList.remove("aviaframe-input--error"))};v.addEventListener("change",I),b.addEventListener("change",I)})()},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",se):se(),window.AviaframeWidget={init:se}})()})()})();
