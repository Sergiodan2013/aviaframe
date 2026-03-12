(function(){"use strict";(function(){(function(){const j={checkoutUrl:null,bookingUrl:null},ge=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1}];function ye(e,o=8){const i=e.toLowerCase().trim();if(i.length<1)return[];const n=ge.filter(a=>a.code.toLowerCase().includes(i)||a.city.toLowerCase().includes(i)||a.cityRu.toLowerCase().includes(i)||a.name.toLowerCase().includes(i)||a.country.toLowerCase().includes(i));return n.sort((a,d)=>a.priority!==d.priority?a.priority-d.priority:a.city.localeCompare(d.city)),n.slice(0,o)}function be(e){const o=new Date(e),i=o.getFullYear(),n=String(o.getMonth()+1).padStart(2,"0"),a=String(o.getDate()).padStart(2,"0");return`${i}-${n}-${a}`}function xe(){return be(new Date)}const he=`
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
    `}function _e(){var e;const o=Array.from(document.querySelectorAll(".aviaframe-dropdown")),i=()=>o.forEach(t=>t.classList.remove("open"));o.forEach(t=>{const _=t.querySelector(".aviaframe-dropdown-btn");_&&_.addEventListener("click",A=>{A.stopPropagation();const g=t.classList.contains("open");i(),g||t.classList.add("open")})}),document.addEventListener("click",t=>{t.target.closest(".aviaframe-dropdown")||i()});const n=document.getElementById("aviaframe-trip-type"),a=document.getElementById("aviaframe-trip-label"),d=(e=document.getElementById("aviaframe-return-date"))==null?void 0:e.closest(".aviaframe-field"),m=document.getElementById("aviaframe-multi-city-fields");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(t=>{t.addEventListener("change",()=>{t.checked&&(n.value=t.value,a.textContent=t.value==="one_way"?"One-way":t.value==="multi_city"?"Multi-city":"Return",t.value==="one_way"?(d&&(d.style.display="none"),m&&(m.style.display="none")):t.value==="multi_city"?(d&&(d.style.display="none"),m&&(m.style.display="block")):(d&&(d.style.display="block"),m&&(m.style.display="none")))})});const y=document.getElementById("aviaframe-cabin"),I=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(t=>{t.addEventListener("change",()=>{t.checked&&(y.value=t.value,I.textContent=t.parentElement.textContent.trim())})});const p={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},l={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},h=()=>{document.getElementById("aviaframe-adults").value=l.adults,document.getElementById("aviaframe-children").value=l.children,document.getElementById("aviaframe-infants").value=l.infants,document.getElementById("aviaframe-cabin-bags").value=l.cabinBags,document.getElementById("aviaframe-checked-bags").value=l.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(l.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(l.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${l.adults+l.children+l.infants} Passenger${l.adults+l.children+l.infants!==1?"s":""}`},v=()=>{const t=document.getElementById("aviaframe-age-selectors");for(;l.childrenAges.length<l.children;)l.childrenAges.push(2);for(;l.childrenAges.length>l.children;)l.childrenAges.pop();for(;l.infantAges.length<l.infants;)l.infantAges.push(1);for(;l.infantAges.length>l.infants;)l.infantAges.pop();const _=l.childrenAges.map((g,u)=>`
        <div class="aviaframe-age-item">
          <label>Child ${u+1} age</label>
          <select data-age-type="child" data-age-index="${u}">
            ${Array.from({length:10},(x,N)=>N+2).map(x=>`<option value="${x}" ${x===g?"selected":""}>${x}</option>`).join("")}
          </select>
        </div>
      `).join(""),A=l.infantAges.map((g,u)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${u+1} age</label>
          <select data-age-type="infant" data-age-index="${u}">
            ${Array.from({length:2},(x,N)=>N).map(x=>`<option value="${x}" ${x===g?"selected":""}>${x}</option>`).join("")}
          </select>
        </div>
      `).join("");t.innerHTML=_+A,t.querySelectorAll("select[data-age-type]").forEach(g=>{g.addEventListener("change",()=>{const u=g.getAttribute("data-age-type"),x=Number(g.getAttribute("data-age-index")),N=Number(g.value);u==="child"?l.childrenAges[x]=N:l.infantAges[x]=N,h()})}),h()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(t=>{t.addEventListener("click",()=>{const _=t.getAttribute("data-counter"),A=Number(t.getAttribute("data-delta")),g=p[_];if(!g)return;const u=Math.max(g.min,Math.min(g.max,l[_]+A));l[_]=u;const x=document.getElementById(`aviaframe-count-${_}`);x&&(x.textContent=u),v()})}),v()}function ae(e,o){const i=document.getElementById(e),n=document.getElementById(o);if(!i||!n)return;let a=-1;i.addEventListener("input",function(){const d=this.value;if(d.length<1){n.style.display="none";return}const m=ye(d);if(m.length===0){n.style.display="none";return}n.innerHTML=m.map((y,I)=>`
        <div class="aviaframe-autocomplete-item" data-index="${I}" data-code="${y.code}">
          <div>
            <span class="aviaframe-airport-code">${y.code}</span>
            <span class="aviaframe-airport-city">${y.city} / ${y.cityRu}</span>
          </div>
          <span class="aviaframe-airport-name">${y.name}, ${y.country}</span>
        </div>
      `).join(""),n.style.display="block",a=-1,n.querySelectorAll(".aviaframe-autocomplete-item").forEach((y,I)=>{y.addEventListener("click",function(){const p=m[I];i.value=`${p.city} (${p.code})`,i.dataset.code=p.code,n.style.display="none"})})}),i.addEventListener("keydown",function(d){const m=n.querySelectorAll(".aviaframe-autocomplete-item");m.length!==0&&(d.key==="ArrowDown"?(d.preventDefault(),a=Math.min(a+1,m.length-1),ce(m,a)):d.key==="ArrowUp"?(d.preventDefault(),a=Math.max(a-1,0),ce(m,a)):d.key==="Enter"&&a>=0?(d.preventDefault(),m[a].click()):d.key==="Escape"&&(n.style.display="none"))}),document.addEventListener("click",function(d){!i.contains(d.target)&&!n.contains(d.target)&&(n.style.display="none")})}function ce(e,o){e.forEach((i,n)=>{n===o?(i.classList.add("active"),i.scrollIntoView({block:"nearest"})):i.classList.remove("active")})}function ke(e){const o=document.getElementById("aviaframe-search-form"),i=document.getElementById("aviaframe-results");o.addEventListener("submit",async function(n){n.preventDefault();const a=document.getElementById("aviaframe-origin"),d=document.getElementById("aviaframe-destination"),m=document.getElementById("aviaframe-depart-date").value,y=document.getElementById("aviaframe-return-date").value,I=parseInt(document.getElementById("aviaframe-adults").value,10),p=parseInt(document.getElementById("aviaframe-children").value,10)||0,l=parseInt(document.getElementById("aviaframe-infants").value,10)||0,h=document.getElementById("aviaframe-trip-type").value||"return",v=document.getElementById("aviaframe-cabin").value,t=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),_=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),A=a.dataset.code,g=d.dataset.code;if(!A||!g){i.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select airports from the dropdown.
          </div>
        `;return}if(!m){i.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> Please select departure date.
          </div>
        `;return}if(h==="return"&&(!y||y<=m)){i.innerHTML=`<div class="aviaframe-error"><strong>Error:</strong> ${y?"Return date must be after the departure date.":"Please select a return date."}</div>`;return}i.innerHTML=`
        <div class="aviaframe-loading">
          <div class="aviaframe-spinner"></div>
          <div>Searching for flights...</div>
        </div>
      `;let u={origin:A,destination:g,depart_date:m,return_date:y||null,adults:I,children:p,infants:l,children_ages:t,infant_ages:_,cabin_class:v,trip_type:h};if(h==="one_way"&&(u.return_date=null),h==="multi_city"){const c=document.getElementById("aviaframe-origin-2"),f=document.getElementById("aviaframe-destination-2"),C=document.getElementById("aviaframe-depart-date-2").value,E=c==null?void 0:c.dataset.code,S=f==null?void 0:f.dataset.code;if(!E||!S||!C){i.innerHTML=`
            <div class="aviaframe-error">
              <strong>Error:</strong> For Multi-city please fill second segment: From, To and Date.
            </div>
          `;return}u.segments=[{origin:A,destination:g,depart_date:m},{origin:E,destination:S,depart_date:C}]}const x=c=>String(c||"").replace(/\/+$/,""),N=c=>{const f=x(c);return f.endsWith("/search")?f:`${f}/search`},r=c=>{const f=x(c);return f.includes("/api/drct/")?f.replace("/api/drct/","/api/n8n/webhook-test/drct/"):f.endsWith("/api/drct")?f.replace("/api/drct","/api/n8n/webhook-test/drct"):f},s=c=>{const f=x(c),C=[f,N(f),r(f)];return[...new Set(C.filter(Boolean))]};try{let c=null;const f=s(e);for(const E of f)if(c=await fetch(E,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(u)}),c.ok||c.status!==404)break;if(!c.ok)throw new Error(`HTTP ${c.status}: ${c.statusText}`);const C=await c.json();if(C.offers&&C.offers.length>0){const E=C.offers.map(S=>{const L={...S,_searchOrigin:u.origin||(S==null?void 0:S._searchOrigin)||null,_searchDestination:u.destination||(S==null?void 0:S._searchDestination)||null,_searchReturnDate:u.return_date||(S==null?void 0:S._searchReturnDate)||null};if(!(L!=null&&L.return_origin&&L!=null&&L.return_destination||L!=null&&L.return_departure_time&&L!=null&&L.return_arrival_time)&&u.return_date){const k=Se(L);k&&Object.assign(L,k),L.return_origin||(L.return_origin=u.destination||null),L.return_destination||(L.return_destination=u.origin||null)}return L});fe(E)}else i.innerHTML=`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No flights found</div>
              <div>Try adjusting your search criteria</div>
            </div>
          `}catch(c){const f=String((c==null?void 0:c.message)||""),C=f.includes("HTTP 404");if((c==null?void 0:c.name)==="TypeError"||f.includes("Failed to fetch")||f.toLowerCase().includes("cors")||C){const E=Ne(u);fe(E),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",c);return}i.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${f}
          </div>
        `}})}function Ae(e){return e?`https://pics.avs.io/200/80/${e}.png`:null}function Ee(e){var E,S,L;const o={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,passengers:e.passengers||[],selected_at:new Date().toISOString()};localStorage.setItem("selectedOffer",JSON.stringify(o)),console.log("✅ Offer selected:",e.offer_id),window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:o},bubbles:!0}));const i=document.querySelector(".aviaframe-widget"),n=document.getElementById("aviaframe-results"),a=document.getElementById("aviaframe-search-form");if(!i){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:o},bubbles:!0})),j.checkoutUrl&&(window.location.href=j.checkoutUrl);return}a&&(a.style.display="none"),n&&(n.style.display="none");const d=document.getElementById("aviaframe-passenger-step");d&&d.remove();const m=((e==null?void 0:e.price)||{}).currency||"UAH",y=Math.round(((e==null?void 0:e.price)||{}).total||0).toLocaleString("en-US"),I=e.airline_name||e.airline||"Airline",p=e.origin||"---",l=e.destination||"---",h=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",v=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A",t=parseInt(((E=document.getElementById("aviaframe-adults"))==null?void 0:E.value)||"1",10)||1,_=parseInt(((S=document.getElementById("aviaframe-children"))==null?void 0:S.value)||"0",10)||0,A=parseInt(((L=document.getElementById("aviaframe-infants"))==null?void 0:L.value)||"0",10)||0,g=[];for(let k=0;k<t;k++)g.push({id:"ADT"+(k+1),type:"ADT"});for(let k=0;k<_;k++)g.push({id:"CHD"+(k+1),type:"CHD"});for(let k=0;k<A;k++)g.push({id:"INF"+(k+1),type:"INF"});g.length||g.push({id:"T1",type:"ADT"});const u={};function x(k){u[k]=(u[k]||0)+1;const R=u[k];return k==="ADT"?"Adult "+R:k==="CHD"?"Child "+R:k==="INF"?"Infant "+R:"Passenger "+R}function N(k,R){const G=k.type||"ADT",T=x(G),M=G==="ADT"?"18+ years":G==="CHD"?"2–11 years":"Under 2 years";return'<div class="avf-pax-section" data-pax-idx="'+R+'" data-pax-type="'+G+'" style="grid-column:1/-1;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:8px"><div style="font-size:18px;font-weight:700;color:#1f2937;margin-bottom:12px">'+T+' <span style="font-size:13px;font-weight:400;color:#94a3b8">'+M+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">First Name *</span><input required data-field="firstName" placeholder="John" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Last Name *</span><input required data-field="lastName" placeholder="Doe" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Gender *</span><select data-field="gender" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px"><option value="M">Male</option><option value="F">Female</option></select></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Date of Birth *</span><input required type="date" lang="en" data-field="dateOfBirth" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Number *</span><input required data-field="passportNumber" placeholder="AB1234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Expiry *</span><input required type="date" lang="en" data-field="passportExpiry" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label></div></div>'}const r=g.map((k,R)=>N(k,R)).join(""),s=document.createElement("div");s.id="aviaframe-passenger-step",s.style.marginTop="16px",s.style.border="1px solid #d9e3f3",s.style.borderRadius="12px",s.style.padding="16px",s.style.background="#fff",s.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px"><div><div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.1">Selected Flight</div><div style="margin-top:8px;font-size:20px;font-weight:700;color:#1f2937">'+p+" → "+l+' <span style="font-size:18px;font-weight:600;color:#64748b">'+I+'</span></div><div style="margin-top:6px;font-size:16px;color:#475569">Departure: '+h+" | Arrival: "+v+'</div></div><div style="text-align:right"><div style="font-size:56px;line-height:1;font-weight:800;color:#2563eb">'+y+" "+m+'</div><div style="margin-top:6px;font-size:20px;color:#64748b">total</div></div></div><div style="font-size:38px;font-weight:800;color:#0f172a;margin:16px 0 10px">Passenger Details</div><form id="aviaframe-passenger-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="grid-column:1/-1;font-size:20px;font-weight:700;color:#1f2937;margin-top:2px">Contact Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Email Address *</span><input required type="email" name="email" placeholder="name@example.com" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Phone Number *</span><input required name="phone" placeholder="+971501234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1/-1;height:1px;background:#e2e8f0;margin:6px 0"></div>'+r+'<div style="grid-column:1/-1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1/-1;font-size:20px;font-weight:700;color:#1f2937">Payment Method</div><div style="grid-column:1/-1;display:flex;flex-direction:column;gap:10px"><label style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #2563eb;border-radius:10px;cursor:pointer;background:#eff6ff"><input type="radio" name="paymentMethod" value="bank_transfer" checked style="width:18px;height:18px;accent-color:#2563eb" /><div><div style="font-size:15px;font-weight:700;color:#1e3a8a">Bank Transfer</div><div style="font-size:13px;color:#3b82f6">Transfer to agency bank account</div></div></label><label style="display:flex;align-items:center;gap:10px;padding:14px;border:2px solid #e2e8f0;border-radius:10px;cursor:pointer"><input type="radio" name="paymentMethod" value="cash" style="width:18px;height:18px;accent-color:#2563eb" /><div><div style="font-size:15px;font-weight:700;color:#1f2937">Cash at Office</div><div style="font-size:13px;color:#64748b">Pay in person at our office</div></div></label></div><div id="aviaframe-passenger-error" style="grid-column:1/-1;display:none;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px;font-size:14px"></div><div style="grid-column:1/-1;display:flex;justify-content:space-between;gap:10px;margin-top:6px"><button type="button" id="aviaframe-passenger-back" style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:600">Back</button><button type="submit" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer">Continue to booking</button></div></form>',i.appendChild(s),window.scrollTo({top:0,behavior:"smooth"});const c=s.querySelector("#aviaframe-passenger-back"),f=s.querySelector("#aviaframe-passenger-form"),C=s.querySelector("#aviaframe-passenger-error");c&&c.addEventListener("click",()=>{s.remove(),a&&(a.style.display=""),n&&(n.style.display="")}),function(R,G){if(!R)return;function T(w,D){let q=w.parentNode.querySelector(".avf-ferr");q||(q=document.createElement("span"),q.className="avf-ferr",q.style.cssText="color:#b91c1c;font-size:12px;margin-top:2px;display:block",w.parentNode.appendChild(q)),q.textContent=D,w.style.borderColor="#ef4444"}function M(w){const D=w.parentNode.querySelector(".avf-ferr");D&&(D.textContent=""),w.style.borderColor="#cbd5e1"}const P=R.querySelector('[name="email"]'),U=R.querySelector('[name="phone"]');function V(){const w=P.value.trim();w?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w)?M(P):T(P,"Invalid email address"):T(P,"Email is required")}function X(){const w=U.value.trim();w?/^\+\d{7,15}$/.test(w)?M(U):T(U,"Format: +971501234567"):T(U,"Phone is required")}P&&(P.addEventListener("input",V),P.addEventListener("blur",V)),U&&(U.addEventListener("input",X),U.addEventListener("blur",X)),R.querySelectorAll(".avf-pax-section").forEach(function(w){const D=w.dataset.paxType||"ADT";function q($){const F=$.value.trim();F?/^[A-Za-z\s\-']+$/.test(F)?M($):T($,"Latin letters only"):T($,"Required")}const W=w.querySelector('[data-field="firstName"]'),K=w.querySelector('[data-field="lastName"]'),Q=w.querySelector('[data-field="dateOfBirth"]'),B=w.querySelector('[data-field="passportNumber"]'),z=w.querySelector('[data-field="passportExpiry"]');W&&(W.addEventListener("input",function(){q(this)}),W.addEventListener("blur",function(){q(this)})),K&&(K.addEventListener("input",function(){q(this)}),K.addEventListener("blur",function(){q(this)})),Q&&Q.addEventListener("change",function(){const $=this.value;if(!$){T(this,"Date of birth required");return}const F=new Date($);if(isNaN(F.getTime())){T(this,"Invalid date");return}const J=(Date.now()-F.getTime())/(365.25*24*3600*1e3);D==="ADT"&&J<18?T(this,"Adult must be 18+ years old"):D==="CHD"&&J<2?T(this,"Child must be at least 2 years old"):D==="CHD"&&J>=12?T(this,"Child must be under 12 years old"):D==="INF"&&J>=2?T(this,"Infant must be under 2 years old"):M(this)}),B&&(B.addEventListener("input",function(){this.value=this.value.toUpperCase();const $=this.value.trim();$?$.length<6?T(this,"At least 6 characters"):/^[A-Z0-9]+$/.test($)?M(this):T(this,"Letters and digits only"):T(this,"Required")}),B.addEventListener("blur",function(){const $=this.value.trim();$?$.length<6?T(this,"At least 6 characters"):/^[A-Z0-9]+$/.test($)?M(this):T(this,"Letters and digits only"):T(this,"Required")})),z&&z.addEventListener("change",function(){const $=this.value;if(!$){T(this,"Expiry required");return}const F=new Date($+"T00:00:00");if(F<new Date){T(this,"Passport has expired");return}const O=new Date;if(O.setMonth(O.getMonth()+6),F<O){T(this,"Must be valid 6+ months");return}M(this)})})}(s.querySelector("#aviaframe-passenger-form")),f&&f.addEventListener("submit",k=>{var W,K,Q;k.preventDefault();const R=(e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10),G=new Date(R+"T00:00:00"),T=new Date(G);T.setMonth(T.getMonth()+6);const M=new Date,P=String(((W=f.querySelector('[name="email"]'))==null?void 0:W.value)||""),U=String(((K=f.querySelector('[name="phone"]'))==null?void 0:K.value)||""),V=String(((Q=f.querySelector('[name="paymentMethod"]:checked'))==null?void 0:Q.value)||"bank_transfer"),X=f.querySelectorAll(".avf-pax-section"),w=[];let D=null;for(let B=0;B<X.length;B++){const z=X[B],$=z.dataset.paxType||"ADT",F=parseInt(z.dataset.paxIdx,10),J=g[F]||{},O=H=>{var Z;return String(((Z=z.querySelector('[data-field="'+H+'"]'))==null?void 0:Z.value)||"")},me=O("firstName"),ue=O("lastName"),Re=O("gender")||"M",le=O("dateOfBirth"),Me=O("passportNumber"),de=O("passportExpiry");if(!me||!ue){D="Please fill in name for passenger "+(B+1)+".";break}if(!le){D="Please enter date of birth for passenger "+(B+1)+".";break}const ee=new Date(le);if(isNaN(ee.getTime())){D="Invalid date of birth for passenger "+(B+1)+".";break}if($==="ADT"){const H=new Date(ee);if(H.setFullYear(H.getFullYear()+18),H>M){D="Adult "+(B+1)+" must be at least 18 years old.";break}}else if($==="CHD"){const H=new Date(ee);H.setFullYear(H.getFullYear()+2);const Z=new Date(ee);if(Z.setFullYear(Z.getFullYear()+12),H>M){D="Child "+(B+1)+" must be at least 2 years old.";break}if(Z<=M){D="Child "+(B+1)+" must be under 12 years old.";break}}else if($==="INF"){const H=new Date(ee);if(H.setFullYear(H.getFullYear()+2),H<=M){D="Infant "+(B+1)+" must be under 2 years old.";break}}if(!de){D="Please enter passport expiry for passenger "+(B+1)+".";break}const ve=new Date(de+"T00:00:00");if(isNaN(ve.getTime())||ve<T){D="Passport for passenger "+(B+1)+" must be valid 6+ months from trip date.";break}w.push({type:$,pax_id:J.id||"T"+(F+1),first_name:me,last_name:ue,gender:Re,date_of_birth:le,email:P,phone:U,document:{type:"REGULAR_PASSPORT",number:Me,expiry_date:de,issuing_country:"AE",citizenship:"AE",country_of_issue:"AE"},payment_method:V})}if(D){C&&(C.textContent=D,C.style.display="block");return}C&&(C.style.display="none");const q=w[0]?{firstName:w[0].first_name,lastName:w[0].last_name,email:P,phone:U,gender:w[0].gender,dateOfBirth:w[0].date_of_birth,passportNumber:w[0].document.number,passportExpiry:w[0].document.expiry_date,paymentMethod:V}:null;localStorage.setItem("passengerData",JSON.stringify(q)),window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:o,passenger:q,passengers:w},bubbles:!0})),(()=>{const B=z=>{var F;const $=z?'<div style="font-size:13px;color:#64748b;margin-bottom:16px">Reference: <strong>'+z+"</strong></div>":"";s.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:52px;margin-bottom:16px">✅</div><div style="font-size:24px;font-weight:800;color:#166534;margin-bottom:10px">Booking Request Received!</div><div style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:16px">Thank you, <strong>'+(((F=w[0])==null?void 0:F.first_name)||"")+"</strong>! Your booking request has been received.<br>We will contact you at <strong>"+P+"</strong><br>to confirm the booking and send payment instructions.</div>"+$+'<button type="button" id="aviaframe-passenger-back2" style="border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600;font-size:14px">Search again</button></div>',s.querySelector("#aviaframe-passenger-back2")&&s.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{s.remove(),a&&(a.style.display=""),n&&(n.style.display="")})};j.checkoutUrl?window.location.href=j.checkoutUrl:j.bookingUrl?(s.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:36px;margin-bottom:12px">⏳</div><div style="font-size:16px;color:#374151">Sending booking request…</div></div>',fetch(j.bookingUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({offer:o,passengers:w,contacts:{email:P,phone:U}})}).then(z=>z.json().catch(()=>({}))).then(z=>{if(z.success===!1||z.statusCode>=400||z.error){s.innerHTML='<div style="text-align:center;padding:32px 24px"><div style="font-size:52px;margin-bottom:16px">❌</div><div style="font-size:24px;font-weight:800;color:#b91c1c;margin-bottom:12px">Booking Failed</div><div style="font-size:15px;color:#374151;margin-bottom:20px">'+(z.message||z.error||"Something went wrong. Please try again or contact us.")+'</div><button type="button" id="aviaframe-err-back" style="border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600">← Search again</button></div>';const $=s.querySelector("#aviaframe-err-back");$&&$.addEventListener("click",()=>{s.remove(),a&&(a.style.display=""),n&&(n.style.display="")});return}B(z.order_number||z.order_id||null)}).catch(()=>{B(null)})):B(null)})()})}function Y(e,o=0){const i=Number(e);return Number.isFinite(i)?i:o}function b(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ne(e,o){return`${Math.round(Y(e,0)).toLocaleString("uk-UA")} ${o||"UAH"}`}function te(e){if(!e)return"--:--";const o=String(e).match(/T(\d{2}:\d{2})/);return o?o[1]:String(e)}function ie(e){return e?String(e).trim().toUpperCase():null}function oe(e){var o;return ie((e==null?void 0:e.origin_code)||((o=e==null?void 0:e.departure_airport)==null?void 0:o.code)||(e==null?void 0:e.origin))}function se(e){var o;return ie((e==null?void 0:e.destination_code)||((o=e==null?void 0:e.arrival_airport)==null?void 0:o.code)||(e==null?void 0:e.destination))}function $e(e){return(e==null?void 0:e.departure)||[e==null?void 0:e.departure_date,e==null?void 0:e.departure_time].filter(Boolean).join("T")}function Te(e){return(e==null?void 0:e.arrival)||[e==null?void 0:e.arrival_date,e==null?void 0:e.arrival_time].filter(Boolean).join("T")}function Se(e){const o=Array.isArray(e==null?void 0:e.segments)?e.segments:[];if(!o.length)return null;const i=ie((e==null?void 0:e._searchOrigin)||(e==null?void 0:e.origin)),n=ie((e==null?void 0:e._searchDestination)||(e==null?void 0:e.destination));if(!i||!n)return null;let a=-1;for(let v=1;v<o.length;v+=1){const t=oe(o[v]),_=se(o[v]);if(t===n||_===i){a=v;break}}if(a<0)return null;const d=o.slice(a),m=d[0],y=d[d.length-1],I=oe(m)||n,p=se(y)||i,l=$e(m)||null,h=Te(y)||null;return!I||!p?null:{return_origin:I,return_destination:p,return_departure_time:l,return_arrival_time:h}}function Ce(e){if(e.duration_minutes)return Y(e.duration_minutes,0);if(e.durationMinutes)return Y(e.durationMinutes,0);if(e.journey_time)return Math.round(Y(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const o=new Date(e.departure_time).getTime(),i=new Date(e.arrival_time).getTime();return!Number.isFinite(o)||!Number.isFinite(i)||i<=o?0:Math.round((i-o)/6e4)}function Ie(e,o){if(!e||!o)return 0;const i=new Date(e).getTime(),n=new Date(o).getTime();return!Number.isFinite(i)||!Number.isFinite(n)||n<=i?0:Math.round((n-i)/6e4)}function pe(e){const o=Y(e,0),i=Math.floor(o/60),n=o%60;return o<=0?"n/a":`${i}h ${n}m`}function Le(e){return e.stops!==void 0?Y(e.stops,0):e.transfers_count!==void 0?Y(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function De(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function Be(e){const o=(e.airline_code||e.airline||"").toString().trim();return o?o.slice(0,2).toUpperCase():"NA"}function ze(e){var o,i;const n=Y((o=e==null?void 0:e.price)==null?void 0:o.total,0),a=((i=e==null?void 0:e.price)==null?void 0:i.currency)||"UAH",d=Le(e),m=Array.isArray(e==null?void 0:e.segments)?e.segments.map(t=>{var _,A,g;return{origin:(()=>{const u=oe(t),x=(t==null?void 0:t.origin)||((_=t==null?void 0:t.departure_city)==null?void 0:_.name)||"";return u?x&&x.toUpperCase()!==u?`${u} (${x})`:u:x||"N/A"})(),destination:(()=>{const u=se(t),x=(t==null?void 0:t.destination)||((A=t==null?void 0:t.arrival_city)==null?void 0:A.name)||"";return u?x&&x.toUpperCase()!==u?`${u} (${x})`:u:x||"N/A"})(),departure:(t==null?void 0:t.departure)||[t==null?void 0:t.departure_date,t==null?void 0:t.departure_time].filter(Boolean).join(" ")||"N/A",arrival:(t==null?void 0:t.arrival)||[t==null?void 0:t.arrival_date,t==null?void 0:t.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((g=t==null?void 0:t.carrier)==null?void 0:g.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:(t==null?void 0:t.flight_number)||"N/A"}}):[],y=!!(e!=null&&e.return_origin&&e!=null&&e.return_destination||e!=null&&e.return_departure_time&&e!=null&&e.return_arrival_time),I=y?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",p=y?te(e.return_departure_time):"--:--",l=y?te(e.return_arrival_time):"--:--",h=y?Ie(e.return_departure_time,e.return_arrival_time):0,v=y?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:Be(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:te(e.departure_time),arrive:te(e.arrival_time),durationMinutes:Ce(e),stops:d,stopsText:De(d),priceTotal:n,priceCurrency:a,baggageText:e.baggage_text||(e.with_baggage?"With baggage":"No baggage"),segments:m,hasReturnData:y,returnRoute:I,returnDepart:p,returnArrive:l,returnDurationMinutes:h,returnSummary:v}}function Ne(e){const o=e.origin||"WAW",i=e.destination||"YVR",n=e.depart_date||"2026-02-27",a=e.return_date||"",d=e.trip_type!=="one_way"&&!!a,m=(y,I,p,l=[])=>{const h=v=>({origin:v.from,destination:v.to,departure:v.depart,arrival:v.arrive,carrier:{airline_code:y,airline_name:I},flight_number:v.flight});return[...p.map(h),...l.map(h)]};return[{offer_id:"fallback_1",origin:o,destination:i,departure_time:`${n}T13:05:00`,arrival_time:`${n}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:d?i:null,return_destination:d?o:null,return_departure_time:d?`${a}T14:20:00`:null,return_arrival_time:d?`${a}T22:40:00`:null,segments:m("DL","DELTA",[{from:o,to:"CDG",depart:`${n}T13:05:00`,arrive:`${n}T16:10:00`,flight:"737"},{from:"CDG",to:i,depart:`${n}T17:05:00`,arrive:`${n}T23:25:00`,flight:"4200"}],d?[{from:i,to:"FRA",depart:`${a}T14:20:00`,arrive:`${a}T17:10:00`,flight:"9655"},{from:"FRA",to:o,depart:`${a}T18:30:00`,arrive:`${a}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"UAH"}},{offer_id:"fallback_2",origin:o,destination:i,departure_time:`${n}T08:10:00`,arrival_time:`${n}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:d?i:null,return_destination:d?o:null,return_departure_time:d?`${a}T09:00:00`:null,return_arrival_time:d?`${a}T20:30:00`:null,segments:m("LO","LOT",[{from:o,to:i,depart:`${n}T08:10:00`,arrive:`${n}T22:00:00`,flight:"441"}],d?[{from:i,to:o,depart:`${a}T09:00:00`,arrive:`${a}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"UAH"}},{offer_id:"fallback_3",origin:o,destination:i,departure_time:`${n}T06:45:00`,arrival_time:`${n}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:d?i:null,return_destination:d?o:null,return_departure_time:d?`${a}T07:10:00`:null,return_arrival_time:d?`${a}T19:55:00`:null,segments:m("AC","AIR CANADA",[{from:o,to:"MUC",depart:`${n}T06:45:00`,arrive:`${n}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${n}T11:50:00`,arrive:`${n}T14:50:00`,flight:"837"},{from:"YYZ",to:i,depart:`${n}T18:40:00`,arrive:`${n}T23:15:00`,flight:"835"}],d?[{from:i,to:"YYZ",depart:`${a}T07:10:00`,arrive:`${a}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${a}T12:00:00`,arrive:`${a}T16:00:00`,flight:"838"},{from:"MUC",to:o,depart:`${a}T17:20:00`,arrive:`${a}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"UAH"}}]}function fe(e,o={}){const i=document.getElementById("aviaframe-results"),n=e.map(ze).map((r,s)=>({...r,id:r.offer.offer_id||`offer_${s}`,airlineLogo:Ae(r.carrierCode)})),a={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set},d=r=>a.quickFilter==="nonstop"?r.filter(s=>s.stops===0):a.quickFilter==="one_stop"?r.filter(s=>s.stops===1):a.quickFilter==="baggage"?r.filter(s=>/baggage|bag/i.test(s.baggageText||"")):r,m=r=>r.length?{count:r.length,minPrice:Math.min(...r.map(s=>s.priceTotal))}:{count:0,minPrice:null},y=()=>({all:m(n),nonstop:m(n.filter(r=>r.stops===0)),one_stop:m(n.filter(r=>r.stops===1)),baggage:m(n.filter(r=>/baggage|bag/i.test(r.baggageText||"")))}),I=()=>{const r=d(n),s=new Map;return r.forEach(c=>{const f=c.carrierCode||"NA";if(!s.has(f))s.set(f,{code:f,name:c.airlineName||f,logo:c.airlineLogo,count:1,minPrice:c.priceTotal});else{const C=s.get(f);C.count+=1,C.minPrice=Math.min(C.minPrice,c.priceTotal)}}),Array.from(s.values()).sort((c,f)=>c.minPrice-f.minPrice).slice(0,8)},p=r=>`
      <div class="aviaframe-details-panel">
        ${r.segments.length?r.segments.map(s=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${b(s.origin)} → ${b(s.destination)}</div>
            <div class="aviaframe-detail-meta">${b(s.departure)} → ${b(s.arrival)}</div>
            <div class="aviaframe-detail-meta">${b(s.airline)} • flight ${b(s.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${b(r.route)}</div>
            <div class="aviaframe-detail-meta">${b(r.depart)} → ${b(r.arrive)}</div>
          </div>
        `}
      </div>
    `,l=(r,s="")=>`
      <article class="aviaframe-flight-card ${s}" data-offer-id="${b(r.id)}">
        <div class="aviaframe-flight-main">
          <div class="aviaframe-segment">
            <div>
              <div class="aviaframe-airline-header">
                ${r.airlineLogo?`<img class="aviaframe-airline-logo" src="${r.airlineLogo}" alt="${b(r.airlineName)}" onerror="this.style.display='none'">`:""}
                <div class="aviaframe-airline">${b(r.airlineName)}</div>
              </div>
              <div class="aviaframe-class">Economy class</div>
            </div>
            <div>
              <div class="aviaframe-time">${b(r.depart)} - ${b(r.arrive)}</div>
              <div class="aviaframe-duration">${b(pe(r.durationMinutes))} total travel time</div>
            </div>
            <div>
              <div class="aviaframe-route">${b(r.route)}</div>
              <div class="aviaframe-transfer">${b(r.stopsText)}</div>
            </div>
          </div>
          ${r.hasReturnData?`
            <div class="aviaframe-segment">
              <div>
                <div class="aviaframe-airline-header">
                  ${r.airlineLogo?`<img class="aviaframe-airline-logo" src="${r.airlineLogo}" alt="${b(r.airlineName)}" onerror="this.style.display='none'">`:""}
                  <div class="aviaframe-airline">${b(r.airlineName)}</div>
                </div>
                <div class="aviaframe-class">Economy class</div>
              </div>
              <div>
                <div class="aviaframe-time">${b(r.returnDepart)} - ${b(r.returnArrive)}</div>
                <div class="aviaframe-duration">${b(pe(r.returnDurationMinutes||r.durationMinutes))} total travel time</div>
              </div>
              <div>
                <div class="aviaframe-route">${b(r.returnRoute)}</div>
                <div class="aviaframe-transfer">${b(r.stopsText)}</div>
              </div>
            </div>
          `:""}
          <div class="aviaframe-card-actions">
            <button type="button" class="aviaframe-details-toggle" data-details-id="${b(r.id)}">
              ${a.expandedIds.has(r.id)?"Hide details":"Details"}
            </button>
          </div>
          ${a.expandedIds.has(r.id)?p(r):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${b(r.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${b(ne(r.priceTotal,r.priceCurrency))}</div>
          <button class="aviaframe-select-button" data-select-id="${b(r.id)}">Select</button>
        </aside>
      </article>
    `,h=()=>{let r=d(n);return a.selectedAirlines.size&&(r=r.filter(s=>a.selectedAirlines.has(s.carrierCode))),r=[...r],a.sort==="airline"?r.sort((s,c)=>s.airlineName.localeCompare(c.airlineName)):a.sort==="fastest"?r.sort((s,c)=>s.durationMinutes-c.durationMinutes):r.sort((s,c)=>s.priceTotal-c.priceTotal),r},v=(r,s,c)=>`
      <button type="button" class="aviaframe-quick-item ${a.quickFilter===r?"active":""}" data-quick="${r}">
        <div class="aviaframe-quick-title">${s}</div>
        <div class="aviaframe-quick-meta">${c.count} flights${c.minPrice!==null?` · from ${ne(c.minPrice,"UAH")}`:""}</div>
      </button>
    `,t=r=>r.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${r.map(s=>`
              <button type="button" class="aviaframe-airline-card ${a.selectedAirlines.has(s.code)?"active":""}" data-airline="${b(s.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${s.logo?`<img class="aviaframe-airline-logo-big" src="${s.logo}" alt="${b(s.name)}" onerror="this.style.display='none'">`:`<span>${b(s.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${b(s.name)}</div>
                <div class="aviaframe-airline-card-price">from ${b(ne(s.minPrice,"UAH"))}</div>
                <div class="aviaframe-airline-card-count">${s.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",_=`
      ${o.noticeHtml||""}
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
    `;i.innerHTML=_;const A=document.getElementById("aviaframe-cards-container"),g=document.getElementById("aviaframe-selected-flight"),u=document.getElementById("aviaframe-quick-grid"),x=document.getElementById("aviaframe-airline-filter-wrap"),N=()=>{const r=y();u.innerHTML=[v("all","All",r.all),v("nonstop","Non-stop",r.nonstop),v("one_stop","1 stop",r.one_stop),v("baggage","With baggage",r.baggage)].join("");const s=I();x.innerHTML=t(s);const c=h(),f=a.selectedId?c.find(E=>E.id===a.selectedId):null;g.innerHTML=f?`<div class="aviaframe-selected-title">Selected flight</div>${l(f,"selected")}`:"";const C=c.filter(E=>E.id!==a.selectedId);A.innerHTML=C.length?C.map(E=>l(E)).join(""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',i.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(E=>{E.addEventListener("click",()=>{const S=E.getAttribute("data-select-id"),L=n.find(k=>k.id===S);L&&(a.selectedId=S,Ee(L.offer))})}),i.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(E=>{E.addEventListener("click",()=>{const S=E.getAttribute("data-details-id");a.expandedIds.has(S)?a.expandedIds.delete(S):a.expandedIds.add(S),N()})}),i.querySelectorAll("[data-quick]").forEach(E=>{E.addEventListener("click",()=>{a.quickFilter=E.getAttribute("data-quick"),N()})}),i.querySelectorAll("[data-airline]").forEach(E=>{E.addEventListener("click",()=>{const S=E.getAttribute("data-airline");a.selectedAirlines.has(S)?a.selectedAirlines.delete(S):a.selectedAirlines.add(S),N()})})};i.querySelectorAll("[data-sort]").forEach(r=>{r.addEventListener("click",()=>{a.sort=r.getAttribute("data-sort"),i.querySelectorAll("[data-sort]").forEach(s=>s.classList.remove("active")),i.querySelectorAll(`[data-sort="${a.sort}"]`).forEach(s=>s.classList.add("active")),N()})}),N(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}function re(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const o=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";j.checkoutUrl=e.dataset.checkoutUrl||null,j.bookingUrl=String(e.dataset.bookingUrl||"").trim()||null;const i=String(e.dataset.primaryColor||"").trim(),n=String(e.dataset.logoUrl||"").trim(),a=String(e.dataset.title||"").trim(),d=String(localStorage.getItem("aviaframe_lang")||e.dataset.language||"en").toLowerCase(),m=document.createElement("style");if(m.textContent=he,document.head.appendChild(m),i&&/^#[0-9a-fA-F]{3,8}$/.test(i)){const p=document.createElement("style");p.textContent=`.aviaframe-select-button{background:${i}!important}.aviaframe-quick-item.active{background:${i}!important;border-color:${i}!important}.aviaframe-sort-btn.active{color:${i}!important}.aviaframe-flight-card.selected{border-color:${i}!important}.aviaframe-airline-card.active{border-color:${i}!important;color:${i}!important}`,document.head.appendChild(p)}e.className="aviaframe-widget",e.innerHTML=we();const y=e.querySelector(".aviaframe-title");if(y&&(a&&(y.innerHTML=a),n&&!/^javascript:/i.test(n))){const p=document.createElement("img");p.src=n,p.alt="",p.style.cssText="height:28px;max-width:110px;object-fit:contain;vertical-align:middle;margin-right:8px",p.onerror=function(){this.remove()},y.insertBefore(p,y.firstChild)}if(d==="ru"){const p={Return:"Туда-обратно","One-way":"В одну сторону","Multi-city":"Несколько городов",Economy:"Эконом","Premium Economy":"Эконом плюс",Business:"Бизнес",First:"Первый класс","Search flights":"Поиск рейсов",From:"Откуда",To:"Куда","Departure date":"Дата вылета","Return date":"Дата возврата",Adults:"Взрослые",Children:"Дети",Infants:"Младенцы","Cabin bags":"Ручная кладь","Checked bags":"Багаж",Passengers:"Пассажиры",Done:"Готово","✈️ Flight Search":"✈️ Поиск рейсов"};e.querySelectorAll("*").forEach(l=>{if(l.children.length===0){const h=l.textContent.trim();h in p&&(l.textContent=p[h])}})}if(d==="ar"){const p={Return:"ذهاب وعودة","One-way":"ذهاب فقط","Multi-city":"رحلات متعددة",Economy:"اقتصادية","Premium Economy":"اقتصادية مميزة",Business:"أعمال","First Class":"الدرجة الأولى",First:"أولى","Search Flights":"ابحث عن رحلات",From:"من",To:"إلى","Departure Date":"تاريخ المغادرة","Return Date":"تاريخ العودة","From (2nd segment)":"من (الرحلة الثانية)","To (2nd segment)":"إلى (الرحلة الثانية)","Departure Date (2nd segment)":"تاريخ المغادرة (الرحلة الثانية)",Adults:"بالغون","Over 11":"فوق 11 سنة",Children:"أطفال","2-11":"2-11 سنة",Infants:"رضّع","Under 2":"أقل من سنتين","Cabin bags":"حقائب المقصورة","Checked bags":"أمتعة مسجّلة",Done:"تم","✈️ Flight Search":"✈️ ابحث عن رحلات",All:"الكل","Non-stop":"مباشر","1 stop":"توقف واحد","With baggage":"مع أمتعة",Price:"السعر",Airline:"الشركة",Fastest:"الأسرع","Economy class":"درجة اقتصادية","No flights found":"لم يتم العثور على رحلات","No offers found for current sort/filter settings.":"لا توجد عروض للتصفية الحالية","Selected flight":"الرحلة المختارة","Selected Flight":"الرحلة المختارة","Passenger Details":"تفاصيل المسافرين","Contact Information":"معلومات الاتصال","Email Address *":"البريد الإلكتروني *","Phone Number *":"رقم الهاتف *","Payment Method":"طريقة الدفع","Bank Transfer":"تحويل بنكي","Transfer to agency bank account":"التحويل إلى حساب الوكالة","Cash at Office":"نقداً في المكتب","Pay in person at our office":"الدفع نقداً في مكتبنا",Back:"رجوع","Continue to booking":"متابعة الحجز","First Name *":"الاسم الأول *","Last Name *":"اسم العائلة *","Date of Birth *":"تاريخ الميلاد *","Passport Number *":"رقم الجواز *","Passport Expiry *":"انتهاء الجواز *","Nationality *":"الجنسية *","Gender *":"الجنس *",Male:"ذكر",Female:"أنثى",total:"الإجمالي","No baggage":"بدون أمتعة",details:"التفاصيل","hide details":"إخفاء التفاصيل",Select:"اختر"},l=v=>{v.querySelectorAll("*").forEach(t=>{if(t.children.length===0){const _=t.textContent.trim();_ in p&&(t.textContent=p[_])}})};if(l(e),e.dir="rtl",e.style.fontFamily="'Cairo',sans-serif",!document.getElementById("af-cairo")){const v=document.createElement("link");v.id="af-cairo",v.rel="stylesheet",v.href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap",document.head.appendChild(v)}new MutationObserver(()=>l(e)).observe(e,{childList:!0,subtree:!0})}else e.dir="ltr",e.style.fontFamily="";const I=e.querySelector(".aviaframe-title");if(I){const p=document.createElement("div");p.id="af-lang-sw",p.style.cssText="margin-left:auto;display:flex;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.08);flex-shrink:0";const l=(h,v)=>{const t=document.createElement("button");t.dataset.lang=h,t.textContent=v;const _=d===h;return t.style.cssText=`padding:5px 12px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:background 0.15s,color 0.15s;background:${_?"#2563eb":"#fff"};color:${_?"#fff":"#6b7280"}`,h==="ar"&&(t.style.borderLeft="1px solid #e5e7eb"),t.addEventListener("mouseover",()=>{var A;t.dataset.lang!==((A=t.closest("[id=af-lang-sw]"))==null?void 0:A.dataset.active)&&(t.style.background=_?"#1d4ed8":"#f9fafb")}),t.addEventListener("mouseout",()=>{var g;const A=((g=t.closest("[id=af-lang-sw]"))==null?void 0:g.dataset.active)||"en";t.style.background=t.dataset.lang===A?"#2563eb":"#fff",t.style.color=t.dataset.lang===A?"#fff":"#6b7280"}),t.addEventListener("click",A=>{A.preventDefault(),A.stopPropagation();const g=t.dataset.lang;localStorage.setItem("aviaframe_lang",g);const u=document.getElementById("aviaframe-widget");u&&(u.dataset.language=g,re())}),t};p.dataset.active=d,p.appendChild(l("en","EN")),p.appendChild(l("ar","عر")),I.style.cssText="display:flex;align-items:center;width:100%",I.appendChild(p)}setTimeout(()=>{_e(),ae("aviaframe-origin","aviaframe-origin-autocomplete"),ae("aviaframe-destination","aviaframe-destination-autocomplete"),ae("aviaframe-origin-2","aviaframe-origin-2-autocomplete"),ae("aviaframe-destination-2","aviaframe-destination-2-autocomplete"),ke(o),["aviaframe-depart-date","aviaframe-return-date","aviaframe-depart-date-2"].forEach(p=>{const l=document.getElementById(p);l&&l.setAttribute("lang","en")}),(()=>{const p=document.getElementById("aviaframe-depart-date"),l=document.getElementById("aviaframe-return-date"),h=document.getElementById("aviaframe-return-date-error");if(!p||!l||!h)return;const v=()=>{const t=p.value,_=l.value,A=document.getElementById("aviaframe-trip-type");if(!A||A.value==="one_way"||A.value==="multi_city"){h.style.display="none",l.classList.remove("aviaframe-input--error");return}_&&t&&_<=t?(h.textContent="Return date must be after the departure date.",h.style.display="block",l.classList.add("aviaframe-input--error")):(h.style.display="none",l.classList.remove("aviaframe-input--error"))};p.addEventListener("change",v),l.addEventListener("change",v)})()},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",re):re(),window.AviaframeWidget={init:re}})()})()})();
