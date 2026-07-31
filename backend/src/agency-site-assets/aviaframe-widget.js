(function(){"use strict";(function(){(function(){const q={checkoutUrl:null},T={en:{title:"Flight Search",trip_return:"Return",trip_oneway:"One-way",trip_multi:"Multi-city",cabin_economy:"Economy",cabin_premium:"Premium Economy",cabin_business:"Business",cabin_first:"First Class",cabin_mixed:"Apply mixed classes",passenger_singular:"Passenger",passenger_plural:"Passengers",pax_adults:"Adults",pax_adults_sub:"Over 11",pax_children:"Children",pax_children_sub:"2–11",pax_infants:"Infants",pax_infants_sub:"Under 2",pax_cabin_bags:"Cabin baggage",pax_checked_bags:"Checked baggage",from_label:"From",to_label:"To",depart_date:"Departure Date",return_date:"Return Date",from_2:"From (2nd segment)",to_2:"To (2nd segment)",depart_date_2:"Departure Date (2nd segment)",search_btn:"Search Flights",error_title:"Error",error_select_airports:"Please select airports from the dropdown.",error_select_depart_date:"Please select departure date.",error_return_before_depart:"Return date must be the same as or later than the departure date. Please update your travel dates.",error_return_before_depart_inline:"Return date must be after departure.",error_multicity_missing:"For Multi-city please fill second segment: From, To and Date.",error_multicity_before_first:"The second segment date must be the same as or later than the first departure date.",error_multicity_before_first_inline:"Second segment date must be after first departure.",searching_flights:"Searching for flights...",no_results_title:"No flights found",no_results_body:"Try adjusting your search criteria.",sandbox_no_results_title:"No sandbox offers for this route or date",sandbox_no_results_body:"DRCT sandbox inventory is limited and does not mirror full live availability. Try another route or date, or use the production domain for live search results."},ar:{title:"البحث عن رحلات",trip_return:"ذهاب وإياب",trip_oneway:"ذهاب فقط",trip_multi:"متعدد المدن",cabin_economy:"الاقتصادية",cabin_premium:"الاقتصادية المميزة",cabin_business:"رجال الأعمال",cabin_first:"الدرجة الأولى",cabin_mixed:"تطبيق درجات مختلطة",passenger_singular:"مسافر",passenger_plural:"مسافرون",pax_adults:"البالغون",pax_adults_sub:"أكبر من 11",pax_children:"الأطفال",pax_children_sub:"2–11",pax_infants:"الرضّع",pax_infants_sub:"أقل من 2",pax_cabin_bags:"أمتعة المقصورة",pax_checked_bags:"الأمتعة المسجّلة",from_label:"من",to_label:"إلى",depart_date:"تاريخ المغادرة",return_date:"تاريخ العودة",from_2:"من (المقطع الثاني)",to_2:"إلى (المقطع الثاني)",depart_date_2:"تاريخ المغادرة (المقطع الثاني)",search_btn:"البحث عن رحلات",error_title:"خطأ",error_select_airports:"يرجى اختيار المطارات من القائمة المنسدلة.",error_select_depart_date:"يرجى اختيار تاريخ المغادرة.",error_return_before_depart:"يجب أن يكون تاريخ العودة في نفس يوم المغادرة أو بعده. يرجى تعديل تواريخ السفر.",error_return_before_depart_inline:"يجب أن يكون تاريخ العودة بعد المغادرة.",error_multicity_missing:"للرحلات متعددة المدن، يرجى استكمال المقطع الثاني: من وإلى والتاريخ.",error_multicity_before_first:"يجب أن يكون تاريخ المقطع الثاني في نفس يوم المقطع الأول أو بعده.",error_multicity_before_first_inline:"يجب أن يكون تاريخ المقطع الثاني بعد الأول.",searching_flights:"جارٍ البحث عن الرحلات...",no_results_title:"لم يتم العثور على رحلات",no_results_body:"يرجى تعديل معايير البحث والمحاولة مرة أخرى.",sandbox_no_results_title:"لا توجد عروض sandbox لهذا المسار أو التاريخ",sandbox_no_results_body:"مخزون DRCT في بيئة sandbox محدود ولا يعكس التوفر الكامل في البيئة الحية. جرّب مساراً أو تاريخاً آخر، أو استخدم نطاق الإنتاج لرؤية النتائج الحية."}};let R=(()=>{try{return localStorage.getItem("aviaframe-widget-lang")||"en"}catch{return"en"}})();function H(e,a){var p,o,$;if(a=a||document.getElementById("aviaframe-widget"),!a)return;R=e;try{localStorage.setItem("aviaframe-widget-lang",e)}catch{}const i=T[e]||T.en;a.setAttribute("dir",e==="ar"?"rtl":"ltr"),a.querySelectorAll("[data-wi18n]").forEach(h=>{const u=h.getAttribute("data-wi18n");i[u]!==void 0&&(h.textContent=i[u])});const s=a.querySelector("#aviaframe-trip-type"),t=a.querySelector("#aviaframe-trip-label");if(s&&t){const h=s.value;t.textContent=h==="one_way"?i.trip_oneway:h==="multi_city"?i.trip_multi:i.trip_return}const d=a.querySelector("#aviaframe-cabin"),n=a.querySelector("#aviaframe-cabin-label");if(d&&n){const h={economy:i.cabin_economy,premium_economy:i.cabin_premium,business:i.cabin_business,first:i.cabin_first};n.textContent=h[d.value]||i.cabin_economy}const c=parseInt(((p=a.querySelector("#aviaframe-adults"))==null?void 0:p.value)||"1"),f=parseInt(((o=a.querySelector("#aviaframe-children"))==null?void 0:o.value)||"0"),m=parseInt((($=a.querySelector("#aviaframe-infants"))==null?void 0:$.value)||"0"),y=c+f+m,x=a.querySelector("#aviaframe-passengers-label");x&&(x.textContent=`${y} ${y===1?i.passenger_singular:i.passenger_plural}`),a.querySelectorAll("#aviaframe-lang-btn .wlt-opt").forEach(h=>h.classList.toggle("wlt-active",h.getAttribute("data-wl")===e)),a.querySelector("#aviaframe-search-form")&&M(a)}function k(e){const a=T[R]||T.en;return a[e]!==void 0?a[e]:T.en[e]!==void 0?T.en[e]:e}function J(e,a,i){e&&(e.classList.add("aviaframe-input-invalid"),e.setAttribute("aria-invalid","true")),a&&(a.textContent=i||"",a.classList.toggle("visible",!!i))}function V(e,a){e&&(e.classList.remove("aviaframe-input-invalid"),e.removeAttribute("aria-invalid")),a&&(a.textContent="",a.classList.remove("visible"))}function oe(e){e=e||document;const a=e.querySelector("#aviaframe-depart-date"),i=e.querySelector("#aviaframe-return-date"),s=e.querySelector("#aviaframe-depart-date-2");if(i&&a){const t=a.value||a.getAttribute("min")||"";t?i.setAttribute("min",t):i.removeAttribute("min")}if(s&&a){const t=a.value||a.getAttribute("min")||"";t?s.setAttribute("min",t):s.removeAttribute("min")}}function M(e){var c;e=e||document;const a=((c=e.querySelector("#aviaframe-trip-type"))==null?void 0:c.value)||"return",i=e.querySelector("#aviaframe-depart-date"),s=e.querySelector("#aviaframe-return-date"),t=e.querySelector("#aviaframe-depart-date-2"),d=e.querySelector("#aviaframe-return-date-error"),n=e.querySelector("#aviaframe-depart-date-2-error");if(oe(e),V(s,d),V(t,n),a==="return"&&i&&s&&i.value&&s.value&&s.value<i.value){const f=k("error_return_before_depart_inline");return J(s,d,f),{valid:!1,input:s,message:k("error_return_before_depart")}}if(a==="multi_city"&&i&&t&&i.value&&t.value&&t.value<i.value){const f=k("error_multicity_before_first_inline");return J(t,n,f),{valid:!1,input:t,message:k("error_multicity_before_first")}}return{valid:!0,input:null,message:""}}const se=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1},{code:"LTN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Luton",priority:3},{code:"STN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Stansted",priority:4},{code:"LCY",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"City Airport",priority:5},{code:"LIN",city:"Milan",cityRu:"Милан",country:"Italy",name:"Linate",priority:3},{code:"BGY",city:"Milan",cityRu:"Милан",country:"Italy",name:"Bergamo",priority:4},{code:"PMF",city:"Milan",cityRu:"Милан",country:"Italy",name:"Parma",priority:5},{code:"IMR",city:"Milan",cityRu:"Милан",country:"Italy",name:"Rogoredo Railway Station",priority:6},{code:"SVO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Sheremetyevo",priority:1},{code:"DME",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Domodedovo",priority:2},{code:"VKO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Vnukovo",priority:3},{code:"ZIA",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Zhukovsky",priority:4},{code:"LED",city:"Saint Petersburg",cityRu:"Санкт-Петербург",country:"Russia",name:"Pulkovo",priority:1},{code:"ALA",city:"Almaty",cityRu:"Алматы",country:"Kazakhstan",name:"Almaty International",priority:1},{code:"TAS",city:"Tashkent",cityRu:"Ташкент",country:"Uzbekistan",name:"Tashkent International",priority:1}],le="aviaframe_ac_v4:",de=24*60*60*1e3,ce=3500,K={London:"LON",Milan:"MIL",Moscow:"MOW","Saint Petersburg":"SPT","New York":"NYC",Dubai:"DXB",Istanbul:"IST",Brussels:"BRU",Tokyo:"TYO"},pe={"United Kingdom":"GB",France:"FR",Germany:"DE",Netherlands:"NL",Spain:"ES",Italy:"IT",Belgium:"BE",Austria:"AT",Switzerland:"CH",Denmark:"DK",Norway:"NO",Sweden:"SE",Finland:"FI",Ireland:"IE",Portugal:"PT",Greece:"GR",Turkey:"TR",Ukraine:"UA",Poland:"PL","Czech Republic":"CZ",Hungary:"HU",UAE:"AE",Qatar:"QA",Bahrain:"BH","Saudi Arabia":"SA",Thailand:"TH",Singapore:"SG","Hong Kong":"HK",Japan:"JP","South Korea":"KR",India:"IN",USA:"US",Canada:"CA",Mexico:"MX",Russia:"RU",Kazakhstan:"KZ",Uzbekistan:"UZ"};function Z(e){return pe[e]||String(e||"").slice(0,2).toUpperCase()}function X(e){return String(e||"").replace(/\/+$/,"")}function N(e){return String(e||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function ue(e){const a=X(e),i=[];return a&&(i.push(a),/\/search$/i.test(a)||i.push(`${a}/search`),a.includes("/api/drct/")?i.push(a.replace("/api/drct/","/api/n8n/webhook-test/drct/")):/\/api\/drct$/i.test(a)&&i.push(a.replace("/api/drct","/api/n8n/webhook-test/drct"))),[...new Set(i.filter(Boolean))]}function me(e){const a=X(e),i=new Set,s=t=>{t&&i.add(t)};if(a){/\/search$/i.test(a)&&s(a.replace(/\/search$/i,"/airports/autocomplete")),s(`${a}/airports/autocomplete`);const t=a.match(/^(https?:\/\/[^/]+)/i);t&&s(`${t[1]}/public/airports/autocomplete`)}return typeof window<"u"&&window.location&&s(`${window.location.origin}/public/airports/autocomplete`),[...i]}function fe(e,a){return`${le}${String(a).toLowerCase()}:${String(e||"").trim().toLowerCase()}`}function ve(e){try{const a=localStorage.getItem(e);if(!a)return null;const i=JSON.parse(a);return!i||!i.cachedAt||Date.now()-i.cachedAt>de?(localStorage.removeItem(e),null):i.payload||null}catch{return null}}function ge(e){return!!(e&&e.source!=="fallback"&&Array.isArray(e.groups)&&e.groups.some(a=>Array.isArray(a.items)&&a.items.length>0))}function Q(e,a){if(ge(a))try{localStorage.setItem(e,JSON.stringify({cachedAt:Date.now(),payload:a}))}catch{}}function ye(e,a){const i=N(a),s=N(e.code),t=N(e.city),d=N(e.cityRu),n=N(e.name),c=N(e.country),f=N(K[e.city]||""),m=[s,t,d,n,c,f].filter(Boolean);if(!m.some(x=>x.includes(i)))return 0;let y=0;return(s===i||f===i)&&(y+=1600),(t===i||d===i)&&(y+=1500),n===i&&(y+=1400),c===i&&(y+=1200),(s.startsWith(i)||f.startsWith(i))&&(y+=1e3),(t.startsWith(i)||d.startsWith(i))&&(y+=950),n.startsWith(i)&&(y+=900),c.startsWith(i)&&(y+=500),t.split(/[\s-]+/).some(x=>x.startsWith(i))&&(y+=220),n.split(/[\s-]+/).some(x=>x.startsWith(i))&&(y+=180),m.some(x=>x.includes(i))&&(y+=120),y-(e.priority||999)}function be(e,a=12){const i=N(e);if(i.length<1)return[];const s=se.map(n=>({airport:n,score:ye(n,i)})).filter(n=>n.score>0).sort((n,c)=>c.score-n.score||(n.airport.priority||999)-(c.airport.priority||999)||n.airport.city.localeCompare(c.airport.city)||n.airport.name.localeCompare(c.airport.name)).slice(0,Math.max(a*4,20)),t=new Map;for(const{airport:n,score:c}of s){const f=`${n.country}:${n.city}`;t.has(f)||t.set(f,{country_code:Z(n.country),country_name:n.country,city_code:K[n.city]||n.code,city_name:n.city,airports:[],bestScore:0}),t.get(f).bestScore=Math.max(t.get(f).bestScore,c),t.get(f).airports.push({type:"airport",code:n.code,name:n.name,city_code:K[n.city]||n.code,city_name:n.city,country_code:Z(n.country),country_name:n.country,priority:n.priority,score:c})}const d=new Map;for(const n of t.values()){const c=`${n.country_code}:${n.country_name}`;d.has(c)||d.set(c,{country_code:n.country_code,country_name:n.country_name,items:[],bestScore:0}),d.get(c).bestScore=Math.max(d.get(c).bestScore,n.bestScore);const f=n.airports.slice().sort((m,y)=>y.score-m.score||(m.priority||999)-(y.priority||999)||m.name.localeCompare(y.name)).map(m=>({type:"airport",code:m.code,name:m.name,city_code:m.city_code,city_name:m.city_name,country_code:m.country_code,country_name:m.country_name,score:m.score}));f.length>1?d.get(c).items.push({type:"city",code:n.city_code,name:n.city_name,city_code:n.city_code,city_name:n.city_name,country_code:n.country_code,country_name:n.country_name,airport_count:f.length,airports:f,score:n.bestScore}):f[0]&&d.get(c).items.push(f[0])}return Array.from(d.values()).sort((n,c)=>c.bestScore-n.bestScore||n.country_name.localeCompare(c.country_name)).map(n=>({...n,items:n.items.sort((c,f)=>(f.score||0)-(c.score||0)||(c.priority||999)-(f.priority||999)||String(c.city_name||c.name||"").localeCompare(String(f.city_name||f.name||"")))})).filter(n=>n.items.length>0)}function he(e,a=12){return be(e,a)}async function xe(e,a){const i=R==="ar"?"ar":"en",s=fe(e,i),t=ve(s);if(t)return t;const d=me(a),n=`q=${encodeURIComponent(e)}&locale=${encodeURIComponent(i)}&limit=12`;for(const f of d){const m=new AbortController,y=setTimeout(()=>m.abort(),ce);try{const x=await fetch(`${f}?${n}`,{method:"GET",headers:{Accept:"application/json"},signal:m.signal});if(clearTimeout(y),!x.ok){if(x.status===404)continue;throw new Error(`autocomplete ${x.status}`)}const p=await x.json();if(p&&Array.isArray(p.groups)&&p.groups.some(o=>Array.isArray(o.items)&&o.items.length>0)){const o={...p,cached:!1};return Q(s,o),o}}catch{clearTimeout(y)}}const c={query:e,locale:i,source:"fallback",groups:he(e,12),cached:!1};return Q(s,c),c}function _e(e){const a=[],i=[];return(e.groups||[]).forEach(s=>{i.push(`<div class="aviaframe-autocomplete-group"><div class="aviaframe-autocomplete-group-header">${v(s.country_name)} (${v(s.country_code)})</div>${(s.items||[]).map(t=>{if(t.type==="city"){const n=(t.airports||[]).map(m=>String(m.code||"").trim()).filter(Boolean).join(","),c=a.length;a.push({label:`${t.city_name} (${t.code})`,code:t.code,airports:n,cityName:t.city_name});const f=(t.airports||[]).map(m=>{const y=a.length;return a.push({label:`${m.city_name} (${m.code})`,code:m.code,airports:"",cityName:m.city_name}),`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-child" data-index="${y}"><div><span class="aviaframe-airport-code">${v(m.code)}</span><span class="aviaframe-airport-city">${v(m.city_name)}</span></div><span class="aviaframe-airport-name">${v(m.name)}</span></div>`}).join("");return`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-parent" data-index="${c}"><div><span class="aviaframe-airport-code">${v(t.code)}</span><span class="aviaframe-airport-city">${v(t.city_name)}</span></div><span class="aviaframe-airport-name">All airports${t.airport_count?` · ${v(String(t.airport_count))}`:""}</span></div>${f}`}const d=a.length;return a.push({label:`${t.city_name||t.name} (${t.code})`,code:t.code,airports:"",cityName:t.city_name||t.name}),`<div class="aviaframe-autocomplete-item" data-index="${d}"><div><span class="aviaframe-airport-code">${v(t.code)}</span><span class="aviaframe-airport-city">${v(t.city_name||t.name)}</span></div><span class="aviaframe-airport-name">${v(t.name)}, ${v(t.country_name)}</span></div>`}).join("")} </div>`)}),{html:i.join(""),items:a}}function ee(e,a,i){i&&(e.value=i.label,e.dataset.code=i.code||"",e.dataset.airports=i.airports||"",e.dataset.cityName=i.cityName||"",a.style.display="none")}function we(e){delete e.dataset.code,delete e.dataset.airports,delete e.dataset.cityName}function Ae(e){const a=new Date(e),i=a.getFullYear(),s=String(a.getMonth()+1).padStart(2,"0"),t=String(a.getDate()).padStart(2,"0");return`${i}-${s}-${t}`}function $e(){return Ae(new Date)}function W(){return typeof window>"u"?{}:window.AVIAFRAME_RUNTIME_CONFIG||window.__AVIAFRAME_SITE_CONFIG__||{}}function Se(){if(typeof window>"u")return!1;const e=String(window.location.hostname||"").toLowerCase();return e==="localhost"||e==="127.0.0.1"}function ke(){return!!W().allowDemoSearchFallback||Se()}function ae(){const e=W();return typeof e.searchIsSandbox=="boolean"?e.searchIsSandbox:/sandbox/i.test(String(e.environment||""))}function Ee(){const e=ae()?k("sandbox_no_results_title"):k("no_results_title"),a=ae()?k("sandbox_no_results_body"):k("no_results_body");return`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${e}</div>
              <div>${a}</div>
            </div>
          `}const Te=`
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

    .aviaframe-input-invalid {
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
    }

    .aviaframe-field-error {
      display: none;
      margin-top: 8px;
      font-size: 13px;
      line-height: 1.4;
      color: #b91c1c;
    }

    .aviaframe-field-error.visible {
      display: block;
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

    .aviaframe-autocomplete-group-header {
      padding: 10px 12px 6px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: #f8fafc;
      border-bottom: 1px solid #eef2f7;
    }

    .aviaframe-autocomplete-parent {
      background: linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%);
      font-weight: 600;
    }

    .aviaframe-autocomplete-child {
      padding-left: 28px;
      position: relative;
    }

    .aviaframe-autocomplete-child::before {
      content: "";
      position: absolute;
      left: 14px;
      top: 0;
      bottom: 0;
      width: 1px;
      background: #dbe7f5;
    }

    .aviaframe-autocomplete-empty {
      padding: 14px 12px;
      color: #64748b;
      font-size: 14px;
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

    .aviaframe-title {
      justify-content: space-between;
    }

    .aviaframe-lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 5px 11px;
      border: 1px solid #d3d9e6;
      border-radius: 999px;
      background: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: #64748b;
      font-family: inherit;
      transition: border-color .15s;
      flex-shrink: 0;
    }

    .aviaframe-lang-btn:hover { border-color: #1a4dff; }
    .wlt-sep { color: #c5cfe0; font-weight: 300; }
    .wlt-active { color: #1a4dff; }

    .aviaframe-widget[dir="rtl"] {
      direction: rtl;
      text-align: right;
    }

    .aviaframe-widget[dir="rtl"] .aviaframe-toolbar {
      flex-direction: row-reverse;
    }

    .aviaframe-widget[dir="rtl"] .aviaframe-dropdown-menu {
      left: auto;
      right: 0;
    }

    .aviaframe-widget[dir="rtl"] .aviaframe-autocomplete {
      text-align: right;
    }

    .aviaframe-widget[dir="rtl"] .aviaframe-row {
      direction: rtl;
    }

    .aviaframe-widget[dir="rtl"] .aviaframe-passenger-row {
      direction: rtl;
    }

    .aviaframe-widget[dir="rtl"] .aviaframe-lang-btn {
      margin-left: 0;
    }
  `;function Ie(){const e=$e();return`
      <div class="aviaframe-title">
        ✈️ <span data-wi18n="title">Flight Search</span>
        <button type="button" class="aviaframe-lang-btn" id="aviaframe-lang-btn" aria-label="Toggle language"><span class="wlt-opt wlt-active" data-wl="en">EN</span><span class="wlt-sep"> | </span><span class="wlt-opt" data-wl="ar">AR</span></button>
      </div>

      <div class="aviaframe-toolbar">
        <div class="aviaframe-dropdown" data-dd="trip">
          <button type="button" class="aviaframe-dropdown-btn" id="aviaframe-trip-btn">
            <span id="aviaframe-trip-label">Return</span> <span class="caret">▾</span>
          </button>
          <div class="aviaframe-dropdown-menu" id="aviaframe-trip-menu">
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-trip" value="return" checked> <span data-wi18n="trip_return">Return</span></label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-trip" value="one_way"> <span data-wi18n="trip_oneway">One-way</span></label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-trip" value="multi_city"> <span data-wi18n="trip_multi">Multi-city</span></label>
          </div>
        </div>

        <div class="aviaframe-dropdown" data-dd="cabin">
          <button type="button" class="aviaframe-dropdown-btn" id="aviaframe-cabin-btn">
            <span id="aviaframe-cabin-label">Economy</span> <span class="caret">▾</span>
          </button>
          <div class="aviaframe-dropdown-menu" id="aviaframe-cabin-menu">
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-cabin-class" value="economy" checked> <span data-wi18n="cabin_economy">Economy</span></label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-cabin-class" value="premium_economy"> <span data-wi18n="cabin_premium">Premium Economy</span></label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-cabin-class" value="business"> <span data-wi18n="cabin_business">Business</span></label>
            <label class="aviaframe-menu-option"><input type="radio" name="aviaframe-cabin-class" value="first"> <span data-wi18n="cabin_first">First Class</span></label>
            <label class="aviaframe-menu-option"><input type="checkbox" id="aviaframe-mixed-class"> <span data-wi18n="cabin_mixed">Apply mixed classes</span></label>
          </div>
        </div>

        <div class="aviaframe-dropdown" data-dd="passengers">
          <button type="button" class="aviaframe-dropdown-btn" id="aviaframe-passengers-btn">
            <span id="aviaframe-passengers-label">1 Passenger</span> <span class="caret">▾</span>
          </button>
          <div class="aviaframe-dropdown-menu" id="aviaframe-passengers-menu" style="min-width:340px;">
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label" data-wi18n="pax_adults">Adults</span><span class="aviaframe-passenger-sub" data-wi18n="pax_adults_sub">Over 11</span></div>
              <div class="aviaframe-stepper">
                <button type="button" class="aviaframe-step-btn" data-counter="adults" data-delta="-1">−</button>
                <span class="aviaframe-step-value" id="aviaframe-count-adults">1</span>
                <button type="button" class="aviaframe-step-btn" data-counter="adults" data-delta="1">+</button>
              </div>
            </div>
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label" data-wi18n="pax_children">Children</span><span class="aviaframe-passenger-sub" data-wi18n="pax_children_sub">2-11</span></div>
              <div class="aviaframe-stepper">
                <button type="button" class="aviaframe-step-btn" data-counter="children" data-delta="-1">−</button>
                <span class="aviaframe-step-value" id="aviaframe-count-children">0</span>
                <button type="button" class="aviaframe-step-btn" data-counter="children" data-delta="1">+</button>
              </div>
            </div>
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label" data-wi18n="pax_infants">Infants</span><span class="aviaframe-passenger-sub" data-wi18n="pax_infants_sub">Under 2</span></div>
              <div class="aviaframe-stepper">
                <button type="button" class="aviaframe-step-btn" data-counter="infants" data-delta="-1">−</button>
                <span class="aviaframe-step-value" id="aviaframe-count-infants">0</span>
                <button type="button" class="aviaframe-step-btn" data-counter="infants" data-delta="1">+</button>
              </div>
            </div>
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label" data-wi18n="pax_cabin_bags">Cabin baggage</span></div>
              <div class="aviaframe-stepper">
                <button type="button" class="aviaframe-step-btn" data-counter="cabinBags" data-delta="-1">−</button>
                <span class="aviaframe-step-value" id="aviaframe-count-cabinBags">0</span>
                <button type="button" class="aviaframe-step-btn" data-counter="cabinBags" data-delta="1">+</button>
              </div>
            </div>
            <div class="aviaframe-passenger-row">
              <div><span class="aviaframe-passenger-label" data-wi18n="pax_checked_bags">Checked baggage</span></div>
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
            <label class="aviaframe-label" data-wi18n="from_label">From</label>
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
            <label class="aviaframe-label" data-wi18n="to_label">To</label>
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
            <label class="aviaframe-label" data-wi18n="depart_date">Departure Date</label>
            <input
              type="date"
              class="aviaframe-input"
              id="aviaframe-depart-date"
              min="${e}"
              required
            />
          </div>

          <div class="aviaframe-field">
            <label class="aviaframe-label" data-wi18n="return_date">Return Date</label>
            <input
              type="date"
              class="aviaframe-input"
              id="aviaframe-return-date"
              min="${e}"
            />
            <div
              class="aviaframe-field-error"
              id="aviaframe-return-date-error"
              aria-live="polite"
            ></div>
          </div>
        </div>

        <div id="aviaframe-multi-city-fields" style="display:none;">
          <div class="aviaframe-row">
            <div class="aviaframe-field">
              <label class="aviaframe-label" data-wi18n="from_2">From (2nd segment)</label>
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
              <label class="aviaframe-label" data-wi18n="to_2">To (2nd segment)</label>
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
              <label class="aviaframe-label" data-wi18n="depart_date_2">Departure Date (2nd segment)</label>
              <input
                type="date"
                class="aviaframe-input"
                id="aviaframe-depart-date-2"
                min="${e}"
              />
              <div
                class="aviaframe-field-error"
                id="aviaframe-depart-date-2-error"
                aria-live="polite"
              ></div>
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

        <button type="submit" class="aviaframe-button" data-wi18n="search_btn">Search Flights</button>
      </form>

      <div id="aviaframe-results"></div>
    `}function Re(){var e;const a=Array.from(document.querySelectorAll(".aviaframe-dropdown")),i=()=>a.forEach(u=>u.classList.remove("open"));a.forEach(u=>{const S=u.querySelector(".aviaframe-dropdown-btn");S&&S.addEventListener("click",A=>{A.stopPropagation();const _=u.classList.contains("open");i(),_||u.classList.add("open")})}),document.addEventListener("click",u=>{u.target.closest(".aviaframe-dropdown")||i()});const s=document.getElementById("aviaframe-trip-type"),t=document.getElementById("aviaframe-trip-label"),d=(e=document.getElementById("aviaframe-return-date"))==null?void 0:e.closest(".aviaframe-field"),n=document.getElementById("aviaframe-multi-city-fields"),c=document.getElementById("aviaframe-depart-date"),f=document.getElementById("aviaframe-return-date"),m=document.getElementById("aviaframe-depart-date-2");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(u=>{u.addEventListener("change",()=>{u.checked&&(s.value=u.value,t.textContent=u.value==="one_way"?(T[R]||T.en).trip_oneway:u.value==="multi_city"?(T[R]||T.en).trip_multi:(T[R]||T.en).trip_return,u.value==="one_way"?(d&&(d.style.display="none"),n&&(n.style.display="none")):u.value==="multi_city"?(d&&(d.style.display="none"),n&&(n.style.display="block")):(d&&(d.style.display="block"),n&&(n.style.display="none"))),M(document)})}),c&&c.addEventListener("change",()=>{M(document)}),f&&f.addEventListener("change",()=>{M(document)}),m&&m.addEventListener("change",()=>{M(document)}),M(document);const y=document.getElementById("aviaframe-cabin"),x=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(u=>{u.addEventListener("change",()=>{u.checked&&(y.value=u.value,x.textContent=u.parentElement.textContent.trim())})});const p={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},o={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},$=()=>{document.getElementById("aviaframe-adults").value=o.adults,document.getElementById("aviaframe-children").value=o.children,document.getElementById("aviaframe-infants").value=o.infants,document.getElementById("aviaframe-cabin-bags").value=o.cabinBags,document.getElementById("aviaframe-checked-bags").value=o.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(o.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(o.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${o.adults+o.children+o.infants} ${o.adults+o.children+o.infants===1?(T[R]||T.en).passenger_singular:(T[R]||T.en).passenger_plural}`},h=()=>{const u=document.getElementById("aviaframe-age-selectors");for(;o.childrenAges.length<o.children;)o.childrenAges.push(2);for(;o.childrenAges.length>o.children;)o.childrenAges.pop();for(;o.infantAges.length<o.infants;)o.infantAges.push(1);for(;o.infantAges.length>o.infants;)o.infantAges.pop();const S=o.childrenAges.map((_,r)=>`
        <div class="aviaframe-age-item">
          <label>Child ${r+1} age</label>
          <select data-age-type="child" data-age-index="${r}">
            ${Array.from({length:10},(l,g)=>g+2).map(l=>`<option value="${l}" ${l===_?"selected":""}>${l}</option>`).join("")}
          </select>
        </div>
      `).join(""),A=o.infantAges.map((_,r)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${r+1} age</label>
          <select data-age-type="infant" data-age-index="${r}">
            ${Array.from({length:2},(l,g)=>g).map(l=>`<option value="${l}" ${l===_?"selected":""}>${l}</option>`).join("")}
          </select>
        </div>
      `).join("");u.innerHTML=S+A,u.querySelectorAll("select[data-age-type]").forEach(_=>{_.addEventListener("change",()=>{const r=_.getAttribute("data-age-type"),l=Number(_.getAttribute("data-age-index")),g=Number(_.value);r==="child"?o.childrenAges[l]=g:o.infantAges[l]=g,$()})}),$()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(u=>{u.addEventListener("click",()=>{const S=u.getAttribute("data-counter"),A=Number(u.getAttribute("data-delta")),_=p[S];if(!_)return;const r=Math.max(_.min,Math.min(_.max,o[S]+A));o[S]=r;const l=document.getElementById(`aviaframe-count-${S}`);l&&(l.textContent=r),h()})}),h()}function U(e,a,i){const s=document.getElementById(e),t=document.getElementById(a);if(!s||!t)return;let d=-1,n=[],c=null,f=0;const m=()=>{t.style.display="none",n=[],d=-1},y=()=>{t.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach((p,o)=>{o===d?(p.classList.add("active"),p.scrollIntoView({block:"nearest"})):p.classList.remove("active")})},x=()=>{n.length?(t.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach(p=>{p.addEventListener("mousedown",function(o){o.preventDefault();const $=Number(this.getAttribute("data-index")),h=n[$];ee(s,t,h)})}),t.style.display="block"):(t.innerHTML="",m())};s.addEventListener("input",function(){const p=this.value.trim();we(s),c&&clearTimeout(c),p.length<1&&m(),p.length<1||(t.innerHTML='<div class="aviaframe-autocomplete-empty">Searching...</div>',t.style.display="block",c=setTimeout(async()=>{const o=++f;try{const $=await xe(p,i);if(o!==f)return;const h=_e($);n=h.items,t.innerHTML=h.html||'<div class="aviaframe-autocomplete-empty">No airports found</div>',d=-1,x()}catch{n=[],t.innerHTML='<div class="aviaframe-autocomplete-empty">No airports found</div>',t.style.display="block"}},250))}),s.addEventListener("keydown",function(p){n.length&&(p.key==="ArrowDown"?(p.preventDefault(),d=Math.min(d+1,n.length-1),y()):p.key==="ArrowUp"?(p.preventDefault(),d=Math.max(d-1,0),y()):p.key==="Enter"&&d>=0?(p.preventDefault(),ee(s,t,n[d])):p.key==="Escape"&&m())}),document.addEventListener("click",function(p){!s.contains(p.target)&&!t.contains(p.target)&&m()})}function Le(e){const a=document.getElementById("aviaframe-search-form"),i=document.getElementById("aviaframe-results");a.addEventListener("submit",async function(s){var L;s.preventDefault();const t=document.getElementById("aviaframe-origin"),d=document.getElementById("aviaframe-destination"),n=document.getElementById("aviaframe-depart-date").value,c=document.getElementById("aviaframe-return-date").value,f=parseInt(document.getElementById("aviaframe-adults").value,10),m=parseInt(document.getElementById("aviaframe-children").value,10)||0,y=parseInt(document.getElementById("aviaframe-infants").value,10)||0,x=document.getElementById("aviaframe-trip-type").value||"return",p=document.getElementById("aviaframe-cabin").value,o=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),$=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),h=t.dataset.code,u=d.dataset.code,S=t.dataset.airports||h,A=d.dataset.airports||u;if(!h||!u){i.innerHTML=`
          <div class="aviaframe-error">
            <strong>${k("error_title")}:</strong> ${k("error_select_airports")}
          </div>
        `;return}if(!n){i.innerHTML=`
          <div class="aviaframe-error">
            <strong>${k("error_title")}:</strong> ${k("error_select_depart_date")}
          </div>
        `;return}const _=M(document);if(!_.valid){i.innerHTML=`
          <div class="aviaframe-error">
            <strong>${k("error_title")}:</strong> ${_.message}
          </div>
        `,_.input&&_.input.focus();return}i.innerHTML=`
        <div class="aviaframe-loading">
          <div class="aviaframe-spinner"></div>
          <div>${k("searching_flights")}</div>
        </div>
      `;let r={origin:S,destination:A,origin_city:h,destination_city:u,depart_date:n,return_date:c||null,adults:f,children:m,infants:y,children_ages:o,infant_ages:$,cabin_class:p,trip_type:x};const l=W(),g=document.querySelector("[data-aviaframe-widget]")||document.getElementById("aviaframe-widget");if(Object.prototype.hasOwnProperty.call(l,"searchOriginHost")?l.searchOriginHost&&(r.origin_host=l.searchOriginHost):l.siteOriginHost&&(r.origin_host=l.siteOriginHost),(L=g==null?void 0:g.dataset)!=null&&L.agencyKey&&(r.agency_key=g.dataset.agencyKey),x==="one_way"&&(r.return_date=null),x==="multi_city"){const b=document.getElementById("aviaframe-origin-2"),w=document.getElementById("aviaframe-destination-2"),C=document.getElementById("aviaframe-depart-date-2").value,B=b==null?void 0:b.dataset.code,D=w==null?void 0:w.dataset.code,E=(b==null?void 0:b.dataset.airports)||B,O=(w==null?void 0:w.dataset.airports)||D;if(!B||!D||!C){i.innerHTML=`
            <div class="aviaframe-error">
              <strong>${k("error_title")}:</strong> ${k("error_multicity_missing")}
            </div>
          `;return}const j=M(document);if(!j.valid){i.innerHTML=`
            <div class="aviaframe-error">
              <strong>${k("error_title")}:</strong> ${j.message}
            </div>
          `,j.input&&j.input.focus();return}r.segments=[{origin:S,destination:A,origin_city:h,destination_city:u,depart_date:n},{origin:E,destination:O,origin_city:B,destination_city:D,depart_date:C}]}try{let b=null;const w=ue(e);for(const B of w)if(b=await fetch(B,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}),b.ok||b.status!==404)break;if(!b.ok)throw new Error(`HTTP ${b.status}: ${b.statusText}`);const C=await b.json();if(C.offers&&C.offers.length>0){const B=C.offers.map(D=>{const E={...D,_searchOrigin:(D==null?void 0:D._searchOrigin)||h||null,_searchDestination:(D==null?void 0:D._searchDestination)||u||null,_searchReturnDate:(D==null?void 0:D._searchReturnDate)||r.return_date||null};if(!(E!=null&&E.return_origin&&E!=null&&E.return_destination||E!=null&&E.return_departure_time&&E!=null&&E.return_arrival_time)&&r.return_date){const O=Ne(E);O&&Object.assign(E,O),E.return_origin||(E.return_origin=u||null),E.return_destination||(E.return_destination=h||null)}return E});ne(B)}else i.innerHTML=Ee()}catch(b){const w=String((b==null?void 0:b.message)||""),C=w.includes("HTTP 404");if((b==null?void 0:b.name)==="TypeError"||w.includes("Failed to fetch")||w.toLowerCase().includes("cors")||C){if(ke()){const B=Oe({...r,origin:h,destination:u});ne(B,{noticeHtml:`
                <div class="aviaframe-warning">
                  Demo mode: backend is currently not reachable from the browser (CORS/network), so test offers are shown for UI validation.
                </div>
              `}),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",b);return}i.innerHTML=`
            <div class="aviaframe-error">
              <strong>${k("error_title")}:</strong> Live search is temporarily unavailable. Please refresh and try again.
            </div>
          `;return}i.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${w}
          </div>
        `}})}function Ce(e){return e?`https://pics.avs.io/200/80/${e}.png`:null}function Be(e){const a={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,selected_at:new Date().toISOString()};localStorage.setItem("selectedOffer",JSON.stringify(a)),console.log("✅ Offer selected:",e.offer_id),window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:a},bubbles:!0}));const i=document.querySelector(".aviaframe-widget"),s=document.getElementById("aviaframe-results"),t=document.getElementById("aviaframe-search-form");if(!i){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a},bubbles:!0})),q.checkoutUrl&&(window.location.href=q.checkoutUrl);return}t&&(t.style.display="none"),s&&(s.style.display="none");const d=document.getElementById("aviaframe-passenger-step");d&&d.remove();const n=((e==null?void 0:e.price)||{}).currency||"UAH",c=Math.round(((e==null?void 0:e.price)||{}).total||0).toLocaleString("en-US"),f=e.airline_name||e.airline||"Airline",m=e.origin||"---",y=e.destination||"---",x=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",p=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A",o=document.createElement("div");o.id="aviaframe-passenger-step",o.style.marginTop="16px",o.style.border="1px solid #d9e3f3",o.style.borderRadius="12px",o.style.padding="16px",o.style.background="#fff",o.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px"><div><div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.1">Selected Flight</div><div style="margin-top:8px;font-size:20px;font-weight:700;color:#1f2937">'+m+" → "+y+' <span style="font-size:18px;font-weight:600;color:#64748b">'+f+'</span></div><div style="margin-top:6px;font-size:16px;color:#475569">Departure: '+x+" | Arrival: "+p+'</div></div><div style="text-align:right"><div style="font-size:56px;line-height:1;font-weight:800;color:#2563eb">'+c+" "+n+'</div><div style="margin-top:6px;font-size:20px;color:#64748b">per person</div></div></div><div style="font-size:38px;font-weight:800;color:#0f172a;margin:16px 0 10px">Passenger Details</div><form id="aviaframe-passenger-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="grid-column:1 / -1;font-size:20px;font-weight:700;color:#1f2937;margin-top:2px">Contact Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Email Address *</span><input required type="email" name="email" placeholder="name@example.com" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Phone Number *</span><input required name="phone" placeholder="+971501234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1 / -1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1 / -1;font-size:20px;font-weight:700;color:#1f2937">Personal Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Gender *</span><select name="gender" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px"><option value="male">Male</option><option value="female">Female</option></select></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Date of Birth *</span><input required type="date" name="dateOfBirth" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">First Name *</span><input required name="firstName" placeholder="John" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Last Name *</span><input required name="lastName" placeholder="Doe" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1 / -1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1 / -1;font-size:20px;font-weight:700;color:#1f2937">Document Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Number *</span><input required name="passportNumber" placeholder="AB1234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Expiry Date *</span><input required type="date" name="passportExpiry" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div id="aviaframe-passenger-error" style="grid-column:1 / -1;display:none;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px;font-size:14px;direction:ltr;unicode-bidi:isolate"></div><div style="grid-column:1 / -1;display:flex;justify-content:space-between;gap:10px;margin-top:6px"><button type="button" id="aviaframe-passenger-back" style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:600">Back</button><button type="submit" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer">Continue to booking</button></div></form>',i.appendChild(o),window.scrollTo({top:0,behavior:"smooth"});const $=o.querySelector("#aviaframe-passenger-back"),h=o.querySelector("#aviaframe-passenger-form"),u=o.querySelector("#aviaframe-passenger-error");$&&$.addEventListener("click",()=>{o.remove(),t&&(t.style.display=""),s&&(s.style.display="")}),h&&h.addEventListener("submit",S=>{S.preventDefault();const A=new FormData(h),_={firstName:String(A.get("firstName")||""),lastName:String(A.get("lastName")||""),email:String(A.get("email")||""),phone:String(A.get("phone")||""),gender:String(A.get("gender")||"male"),dateOfBirth:String(A.get("dateOfBirth")||""),passportNumber:String(A.get("passportNumber")||""),passportExpiry:String(A.get("passportExpiry")||"")},r=new Date,l=new Date(_.dateOfBirth),g=new Date(l);if(g.setFullYear(g.getFullYear()+18),!_.dateOfBirth||Number.isNaN(l.getTime())||g>r){u&&(u.textContent=R==="ar"?"يجب أن يكون عمر المسافر 18 عامًا على الأقل.":"Passenger must be at least 18 years old.",u.style.display="block");return}const I=(e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10),L=new Date(I+"T00:00:00"),b=new Date(L);b.setMonth(b.getMonth()+6);const w=new Date(_.passportExpiry+"T00:00:00");if(!_.passportExpiry||Number.isNaN(w.getTime())||w<b){u&&(u.textContent=R==="ar"?"يجب أن يكون جواز السفر صالحاً لمدة 6 أشهر على الأقل من تاريخ الرحلة.":"Passport must be valid for at least 6 months from the trip date.",u.style.display="block");return}u&&(u.style.display="none"),localStorage.setItem("passengerData",JSON.stringify(_)),window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a,passenger:_},bubbles:!0})),q.checkoutUrl?window.location.href=q.checkoutUrl:o.innerHTML='<div style="padding:10px 0"><div style="font-size:20px;font-weight:700;color:#166534;margin-bottom:6px">Passenger details saved</div><div style="font-size:14px;color:#374151">Host app can continue booking via aviaframe:continueToBooking event.</div><button type="button" id="aviaframe-passenger-back2" style="margin-top:12px;border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:8px 12px;cursor:pointer">Back to search</button></div>',o.querySelector("#aviaframe-passenger-back2")&&o.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{o.remove(),t&&(t.style.display=""),s&&(s.style.display="")})})}function z(e,a=0){const i=Number(e);return Number.isFinite(i)?i:a}function v(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function G(e,a){return`${Math.round(z(e,0)).toLocaleString("uk-UA")} ${a||"UAH"}`}function F(e){if(!e)return"--:--";const a=String(e).match(/T(\d{2}:\d{2})/);return a?a[1]:String(e)}function P(e){return e?String(e).trim().toUpperCase():null}function te(e){var a;return P((e==null?void 0:e.origin_code)||((a=e==null?void 0:e.departure_airport)==null?void 0:a.code)||(e==null?void 0:e.origin))}function ie(e){var a;return P((e==null?void 0:e.destination_code)||((a=e==null?void 0:e.arrival_airport)==null?void 0:a.code)||(e==null?void 0:e.destination))}function De(e){return(e==null?void 0:e.departure)||[e==null?void 0:e.departure_date,e==null?void 0:e.departure_time].filter(Boolean).join("T")}function Me(e){return(e==null?void 0:e.arrival)||[e==null?void 0:e.arrival_date,e==null?void 0:e.arrival_time].filter(Boolean).join("T")}function Ne(e){const a=Array.isArray(e==null?void 0:e.segments)?e.segments:[];if(!a.length)return null;const i=P((e==null?void 0:e._searchOrigin)||(e==null?void 0:e.origin)),s=P((e==null?void 0:e._searchDestination)||(e==null?void 0:e.destination));if(!i||!s)return null;let t=-1;for(let p=1;p<a.length;p+=1){const o=te(a[p]),$=ie(a[p]);if(o===s||$===i){t=p;break}}if(t<0)return null;const d=a.slice(t),n=d[0],c=d[d.length-1],f=te(n)||s,m=ie(c)||i,y=De(n)||null,x=Me(c)||null;return!f||!m?null:{return_origin:f,return_destination:m,return_departure_time:y,return_arrival_time:x}}function ze(e){if(e.duration_minutes)return z(e.duration_minutes,0);if(e.durationMinutes)return z(e.durationMinutes,0);if(e.journey_time)return Math.round(z(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const a=new Date(e.departure_time).getTime(),i=new Date(e.arrival_time).getTime();return!Number.isFinite(a)||!Number.isFinite(i)||i<=a?0:Math.round((i-a)/6e4)}function qe(e,a){if(!e||!a)return 0;const i=new Date(e).getTime(),s=new Date(a).getTime();return!Number.isFinite(i)||!Number.isFinite(s)||s<=i?0:Math.round((s-i)/6e4)}function re(e){const a=z(e,0),i=Math.floor(a/60),s=a%60;return a<=0?"n/a":`${i}h ${s}m`}function He(e){return e.stops!==void 0?z(e.stops,0):e.transfers_count!==void 0?z(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function Ue(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function Fe(e){const a=(e.airline_code||e.airline||"").toString().trim();return a?a.slice(0,2).toUpperCase():"NA"}function Pe(e){var a,i;const s=z((a=e==null?void 0:e.price)==null?void 0:a.total,0),t=((i=e==null?void 0:e.price)==null?void 0:i.currency)||"UAH",d=He(e),n=Array.isArray(e==null?void 0:e.segments)?e.segments.map(o=>{var $,h,u,S,A;return{origin:(o==null?void 0:o.origin)||(($=o==null?void 0:o.departure_city)==null?void 0:$.name)||((h=o==null?void 0:o.departure_airport)==null?void 0:h.code)||"N/A",destination:(o==null?void 0:o.destination)||((u=o==null?void 0:o.arrival_city)==null?void 0:u.name)||((S=o==null?void 0:o.arrival_airport)==null?void 0:S.code)||"N/A",departure:(o==null?void 0:o.departure)||[o==null?void 0:o.departure_date,o==null?void 0:o.departure_time].filter(Boolean).join(" ")||"N/A",arrival:(o==null?void 0:o.arrival)||[o==null?void 0:o.arrival_date,o==null?void 0:o.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((A=o==null?void 0:o.carrier)==null?void 0:A.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:(o==null?void 0:o.flight_number)||"N/A"}}):[],c=!!(e!=null&&e.return_origin&&e!=null&&e.return_destination||e!=null&&e.return_departure_time&&e!=null&&e.return_arrival_time),f=c?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",m=c?F(e.return_departure_time):"--:--",y=c?F(e.return_arrival_time):"--:--",x=c?qe(e.return_departure_time,e.return_arrival_time):0,p=c?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:Fe(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:F(e.departure_time),arrive:F(e.arrival_time),durationMinutes:ze(e),stops:d,stopsText:Ue(d),priceTotal:s,priceCurrency:t,baggageText:e.baggage_text||(e.with_baggage?"With baggage":"No baggage"),segments:n,hasReturnData:c,returnRoute:f,returnDepart:m,returnArrive:y,returnDurationMinutes:x,returnSummary:p}}function Oe(e){const a=e.origin||"WAW",i=e.destination||"YVR",s=e.depart_date||"2026-02-27",t=e.return_date||"",d=e.trip_type!=="one_way"&&!!t,n=(c,f,m,y=[])=>{const x=p=>({origin:p.from,destination:p.to,departure:p.depart,arrival:p.arrive,carrier:{airline_code:c,airline_name:f},flight_number:p.flight});return[...m.map(x),...y.map(x)]};return[{offer_id:"fallback_1",origin:a,destination:i,departure_time:`${s}T13:05:00`,arrival_time:`${s}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:d?i:null,return_destination:d?a:null,return_departure_time:d?`${t}T14:20:00`:null,return_arrival_time:d?`${t}T22:40:00`:null,segments:n("DL","DELTA",[{from:a,to:"CDG",depart:`${s}T13:05:00`,arrive:`${s}T16:10:00`,flight:"737"},{from:"CDG",to:i,depart:`${s}T17:05:00`,arrive:`${s}T23:25:00`,flight:"4200"}],d?[{from:i,to:"FRA",depart:`${t}T14:20:00`,arrive:`${t}T17:10:00`,flight:"9655"},{from:"FRA",to:a,depart:`${t}T18:30:00`,arrive:`${t}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"UAH"}},{offer_id:"fallback_2",origin:a,destination:i,departure_time:`${s}T08:10:00`,arrival_time:`${s}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:d?i:null,return_destination:d?a:null,return_departure_time:d?`${t}T09:00:00`:null,return_arrival_time:d?`${t}T20:30:00`:null,segments:n("LO","LOT",[{from:a,to:i,depart:`${s}T08:10:00`,arrive:`${s}T22:00:00`,flight:"441"}],d?[{from:i,to:a,depart:`${t}T09:00:00`,arrive:`${t}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"UAH"}},{offer_id:"fallback_3",origin:a,destination:i,departure_time:`${s}T06:45:00`,arrival_time:`${s}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:d?i:null,return_destination:d?a:null,return_departure_time:d?`${t}T07:10:00`:null,return_arrival_time:d?`${t}T19:55:00`:null,segments:n("AC","AIR CANADA",[{from:a,to:"MUC",depart:`${s}T06:45:00`,arrive:`${s}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${s}T11:50:00`,arrive:`${s}T14:50:00`,flight:"837"},{from:"YYZ",to:i,depart:`${s}T18:40:00`,arrive:`${s}T23:15:00`,flight:"835"}],d?[{from:i,to:"YYZ",depart:`${t}T07:10:00`,arrive:`${t}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${t}T12:00:00`,arrive:`${t}T16:00:00`,flight:"838"},{from:"MUC",to:a,depart:`${t}T17:20:00`,arrive:`${t}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"UAH"}}]}function ne(e,a={}){const i=document.getElementById("aviaframe-results"),s=e.map(Pe).map((r,l)=>({...r,id:r.offer.offer_id||`offer_${l}`,airlineLogo:Ce(r.carrierCode)})),t={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set},d=r=>t.quickFilter==="nonstop"?r.filter(l=>l.stops===0):t.quickFilter==="one_stop"?r.filter(l=>l.stops===1):t.quickFilter==="baggage"?r.filter(l=>/baggage|bag/i.test(l.baggageText||"")):r,n=r=>{if(!r.length)return{count:0,minPrice:null,currency:null};const l=r.reduce((g,I)=>I.priceTotal<g.priceTotal?I:g,r[0]);return{count:r.length,minPrice:l.priceTotal,currency:l.priceCurrency||"SAR"}},c=()=>({all:n(s),nonstop:n(s.filter(r=>r.stops===0)),one_stop:n(s.filter(r=>r.stops===1)),baggage:n(s.filter(r=>/baggage|bag/i.test(r.baggageText||"")))}),f=()=>{const r=d(s),l=new Map;return r.forEach(g=>{const I=g.carrierCode||"NA";if(!l.has(I))l.set(I,{code:I,name:g.airlineName||I,logo:g.airlineLogo,count:1,minPrice:g.priceTotal,currency:g.priceCurrency||"SAR"});else{const L=l.get(I);L.count+=1,g.priceTotal<L.minPrice&&(L.minPrice=g.priceTotal,L.currency=g.priceCurrency||L.currency)}}),Array.from(l.values()).sort((g,I)=>g.minPrice-I.minPrice)},m=r=>`
      <div class="aviaframe-details-panel">
        ${r.segments.length?r.segments.map(l=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${v(l.origin)} → ${v(l.destination)}</div>
            <div class="aviaframe-detail-meta">${v(l.departure)} → ${v(l.arrival)}</div>
            <div class="aviaframe-detail-meta">${v(l.airline)} • flight ${v(l.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${v(r.route)}</div>
            <div class="aviaframe-detail-meta">${v(r.depart)} → ${v(r.arrive)}</div>
          </div>
        `}
      </div>
    `,y=(r,l="")=>`
      <article class="aviaframe-flight-card ${l}" data-offer-id="${v(r.id)}">
        <div class="aviaframe-flight-main">
          <div class="aviaframe-segment">
            <div>
              <div class="aviaframe-airline-header">
                ${r.airlineLogo?`<img class="aviaframe-airline-logo" src="${r.airlineLogo}" alt="${v(r.airlineName)}" onerror="this.style.display='none'">`:""}
                <div class="aviaframe-airline">${v(r.airlineName)}</div>
              </div>
              <div class="aviaframe-class">Economy class</div>
            </div>
            <div>
              <div class="aviaframe-time">${v(r.depart)} - ${v(r.arrive)}</div>
              <div class="aviaframe-duration">${v(re(r.durationMinutes))} total travel time</div>
            </div>
            <div>
              <div class="aviaframe-route">${v(r.route)}</div>
              <div class="aviaframe-transfer">${v(r.stopsText)}</div>
            </div>
          </div>
          ${r.hasReturnData?`
            <div class="aviaframe-segment">
              <div>
                <div class="aviaframe-airline-header">
                  ${r.airlineLogo?`<img class="aviaframe-airline-logo" src="${r.airlineLogo}" alt="${v(r.airlineName)}" onerror="this.style.display='none'">`:""}
                  <div class="aviaframe-airline">${v(r.airlineName)}</div>
                </div>
                <div class="aviaframe-class">Economy class</div>
              </div>
              <div>
                <div class="aviaframe-time">${v(r.returnDepart)} - ${v(r.returnArrive)}</div>
                <div class="aviaframe-duration">${v(re(r.returnDurationMinutes||r.durationMinutes))} total travel time</div>
              </div>
              <div>
                <div class="aviaframe-route">${v(r.returnRoute)}</div>
                <div class="aviaframe-transfer">${v(r.stopsText)}</div>
              </div>
            </div>
          `:""}
          <div class="aviaframe-card-actions">
            <button type="button" class="aviaframe-details-toggle" data-details-id="${v(r.id)}">
              ${t.expandedIds.has(r.id)?"Hide details":"Details"}
            </button>
          </div>
          ${t.expandedIds.has(r.id)?m(r):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${v(r.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${v(G(r.priceTotal,r.priceCurrency))}</div>
          <button class="aviaframe-select-button" data-select-id="${v(r.id)}">Select</button>
        </aside>
      </article>
    `,x=()=>{let r=d(s);return t.selectedAirlines.size&&(r=r.filter(l=>t.selectedAirlines.has(l.carrierCode))),r=[...r],t.sort==="airline"?r.sort((l,g)=>l.airlineName.localeCompare(g.airlineName)):t.sort==="fastest"?r.sort((l,g)=>l.durationMinutes-g.durationMinutes):r.sort((l,g)=>l.priceTotal-g.priceTotal),r},p=(r,l,g)=>`
      <button type="button" class="aviaframe-quick-item ${t.quickFilter===r?"active":""}" data-quick="${r}">
        <div class="aviaframe-quick-title">${l}</div>
        <div class="aviaframe-quick-meta">${g.count} flights${g.minPrice!==null?` · from ${G(g.minPrice,g.currency||"SAR")}`:""}</div>
      </button>
    `,o=r=>r.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${r.map(l=>`
              <button type="button" class="aviaframe-airline-card ${t.selectedAirlines.has(l.code)?"active":""}" data-airline="${v(l.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${l.logo?`<img class="aviaframe-airline-logo-big" src="${l.logo}" alt="${v(l.name)}" onerror="this.style.display='none'">`:`<span>${v(l.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${v(l.name)}</div>
                <div class="aviaframe-airline-card-price">from ${v(G(l.minPrice,l.currency||"SAR"))}</div>
                <div class="aviaframe-airline-card-count">${l.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",$=`
      ${a.noticeHtml||""}
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
    `;i.innerHTML=$;const h=document.getElementById("aviaframe-cards-container"),u=document.getElementById("aviaframe-selected-flight"),S=document.getElementById("aviaframe-quick-grid"),A=document.getElementById("aviaframe-airline-filter-wrap"),_=()=>{const r=c();S.innerHTML=[p("all","All",r.all),p("nonstop","Non-stop",r.nonstop),p("one_stop","1 stop",r.one_stop),p("baggage","With baggage",r.baggage)].join("");const l=f();A.innerHTML=o(l);const g=x(),I=t.selectedId?g.find(b=>b.id===t.selectedId):null;u.innerHTML=I?`<div class="aviaframe-selected-title">Selected flight</div>${y(I,"selected")}`:"";const L=g.filter(b=>b.id!==t.selectedId);h.innerHTML=L.length?L.map(b=>y(b)).join(""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',i.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(b=>{b.addEventListener("click",()=>{const w=b.getAttribute("data-select-id"),C=s.find(B=>B.id===w);C&&(t.selectedId=w,Be(C.offer))})}),i.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(b=>{b.addEventListener("click",()=>{const w=b.getAttribute("data-details-id");t.expandedIds.has(w)?t.expandedIds.delete(w):t.expandedIds.add(w),_()})}),i.querySelectorAll("[data-quick]").forEach(b=>{b.addEventListener("click",()=>{t.quickFilter=b.getAttribute("data-quick"),_()})}),i.querySelectorAll("[data-airline]").forEach(b=>{b.addEventListener("click",()=>{const w=b.getAttribute("data-airline");t.selectedAirlines.has(w)?t.selectedAirlines.delete(w):t.selectedAirlines.add(w),_()})})};i.querySelectorAll("[data-sort]").forEach(r=>{r.addEventListener("click",()=>{t.sort=r.getAttribute("data-sort"),i.querySelectorAll("[data-sort]").forEach(l=>l.classList.remove("active")),i.querySelectorAll(`[data-sort="${t.sort}"]`).forEach(l=>l.classList.add("active")),_()})}),_(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}function Y(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const a=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";q.checkoutUrl=e.dataset.checkoutUrl||"/booking";const i=document.createElement("style");i.textContent=Te,document.head.appendChild(i),e.className="aviaframe-widget",e.innerHTML=Ie(),setTimeout(()=>{Re(),H(R),U("aviaframe-origin","aviaframe-origin-autocomplete",a),U("aviaframe-destination","aviaframe-destination-autocomplete",a),U("aviaframe-origin-2","aviaframe-origin-2-autocomplete",a),U("aviaframe-destination-2","aviaframe-destination-2-autocomplete",a),Le(a);const s=document.getElementById("aviaframe-lang-btn");s&&s.addEventListener("click",()=>H(R==="en"?"ar":"en"))},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Y):Y(),window.AviaframeWidget={init:Y,setLang:H},window.__aviaLangToggle=()=>H(R==="en"?"ar":"en")})()})()})();
