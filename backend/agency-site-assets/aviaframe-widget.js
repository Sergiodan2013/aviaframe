(function(){"use strict";const ye=`
  .aviaframe-widget {
    --af-widget-primary: var(--af-primary, #0f5ea8);
    --af-widget-primary-hover: var(--af-primary-hover, #0b4a85);
    --af-widget-surface: var(--af-surface, #ffffff);
    --af-widget-text: var(--af-text, #12263f);
    --af-widget-muted: var(--af-text-muted, #61758a);
    --af-widget-border: var(--af-border, #d9e2ec);
    --af-widget-success: var(--af-success, #18794e);
    --af-widget-warning: var(--af-warning, #b45309);
    --af-widget-danger: var(--af-danger, #b42318);
    --af-widget-radius: var(--af-radius, 12px);
    --af-widget-font: var(--af-font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  }
`;(function(){(function(){const M={checkoutUrl:null,widgetSessionToken:null,widgetSessionTokenExpiresAt:0,widgetSessionPromise:null},B={en:{title:"Flight Search",trip_return:"Return",trip_oneway:"One-way",trip_multi:"Multi-city",cabin_economy:"Economy",cabin_premium:"Premium Economy",cabin_business:"Business",cabin_first:"First Class",cabin_mixed:"Apply mixed classes",passenger_singular:"Passenger",passenger_plural:"Passengers",pax_adults:"Adults",pax_adults_sub:"Over 11",pax_children:"Children",pax_children_sub:"2–11",pax_infants:"Infants",pax_infants_sub:"Under 2",pax_cabin_bags:"Cabin baggage",pax_checked_bags:"Checked baggage",from_label:"From",to_label:"To",depart_date:"Departure Date",return_date:"Return Date",from_2:"From (2nd segment)",to_2:"To (2nd segment)",depart_date_2:"Departure Date (2nd segment)",search_btn:"Search Flights",error_title:"Error",error_select_airports:"Please select airports from the dropdown.",error_select_depart_date:"Please select departure date.",error_select_return_date:"Please select a return date or switch to one-way.",error_search_invalid:"Please check your route, dates and passenger details, then try again.",error_return_before_depart:"Return date must be the same as or later than the departure date. Please update your travel dates.",error_return_before_depart_inline:"Return date must be after departure.",error_multicity_missing:"For Multi-city please fill second segment: From, To and Date.",error_multicity_before_first:"The second segment date must be the same as or later than the first departure date.",error_multicity_before_first_inline:"Second segment date must be after first departure.",searching_flights:"Searching for flights...",searching_routes:"Finding the best routes",searching_fares:"Checking current fares",searching_options:"Preparing your best options",no_results_title:"No flights found",no_results_body:"Try adjusting your search criteria.",filter_all:"All",filter_nonstop:"Non-stop",filter_one_stop:"1 stop",filter_with_baggage:"With baggage",badge_no_checked_bag:"No checked bag",badge_checked_bag_included:"1 checked bag included",badge_checked_bags_included:"{count} checked bags included",sandbox_no_results_title:"No sandbox offers for this route or date",sandbox_no_results_body:"DRCT sandbox inventory is limited and does not mirror full live availability. Try another route or date, or use the production domain for live search results."},ar:{title:"البحث عن رحلات",trip_return:"ذهاب وإياب",trip_oneway:"ذهاب فقط",trip_multi:"متعدد المدن",cabin_economy:"الاقتصادية",cabin_premium:"الاقتصادية المميزة",cabin_business:"رجال الأعمال",cabin_first:"الدرجة الأولى",cabin_mixed:"تطبيق درجات مختلطة",passenger_singular:"مسافر",passenger_plural:"مسافرون",pax_adults:"البالغون",pax_adults_sub:"أكبر من 11",pax_children:"الأطفال",pax_children_sub:"2–11",pax_infants:"الرضّع",pax_infants_sub:"أقل من 2",pax_cabin_bags:"أمتعة المقصورة",pax_checked_bags:"الأمتعة المسجّلة",from_label:"من",to_label:"إلى",depart_date:"تاريخ المغادرة",return_date:"تاريخ العودة",from_2:"من (المقطع الثاني)",to_2:"إلى (المقطع الثاني)",depart_date_2:"تاريخ المغادرة (المقطع الثاني)",search_btn:"البحث عن رحلات",error_title:"خطأ",error_select_airports:"يرجى اختيار المطارات من القائمة المنسدلة.",error_select_depart_date:"يرجى اختيار تاريخ المغادرة.",error_select_return_date:"يرجى اختيار تاريخ العودة أو التبديل إلى رحلة ذهاب فقط.",error_search_invalid:"يرجى التحقق من المسار والتواريخ وبيانات المسافرين ثم المحاولة مرة أخرى.",error_return_before_depart:"يجب أن يكون تاريخ العودة في نفس يوم المغادرة أو بعده. يرجى تعديل تواريخ السفر.",error_return_before_depart_inline:"يجب أن يكون تاريخ العودة بعد المغادرة.",error_multicity_missing:"للرحلات متعددة المدن، يرجى استكمال المقطع الثاني: من وإلى والتاريخ.",error_multicity_before_first:"يجب أن يكون تاريخ المقطع الثاني في نفس يوم المقطع الأول أو بعده.",error_multicity_before_first_inline:"يجب أن يكون تاريخ المقطع الثاني بعد الأول.",searching_flights:"جارٍ البحث عن الرحلات...",searching_routes:"جارٍ البحث عن أفضل المسارات",searching_fares:"جارٍ التحقق من الأسعار الحالية",searching_options:"جارٍ تجهيز أفضل الخيارات",no_results_title:"لم يتم العثور على رحلات",no_results_body:"يرجى تعديل معايير البحث والمحاولة مرة أخرى.",filter_all:"الكل",filter_nonstop:"مباشر",filter_one_stop:"توقف واحد",filter_with_baggage:"مع الأمتعة",badge_no_checked_bag:"بدون أمتعة مسجلة",badge_checked_bag_included:"حقيبة مسجلة واحدة مشمولة",badge_checked_bags_included:"{count} حقائب مسجلة مشمولة",sandbox_no_results_title:"لا توجد عروض sandbox لهذا المسار أو التاريخ",sandbox_no_results_body:"مخزون DRCT في بيئة sandbox محدود ولا يعكس التوفر الكامل في البيئة الحية. جرّب مساراً أو تاريخاً آخر، أو استخدم نطاق الإنتاج لرؤية النتائج الحية."}};let D=(()=>{try{return localStorage.getItem("aviaframe-widget-lang")||"en"}catch{return"en"}})();function j(e,a){if(a=a||document.getElementById("aviaframe-widget"),!a)return;D=e;try{localStorage.setItem("aviaframe-widget-lang",e)}catch{}const t=B[e]||B.en;a.setAttribute("dir",e==="ar"?"rtl":"ltr"),a.setAttribute("lang",e==="ar"?"ar":"en"),da(),a.querySelectorAll("[data-wi18n]").forEach(c=>{const s=c.getAttribute("data-wi18n");t[s]!==void 0&&(c.textContent=t[s])});const i=a.querySelector("#aviaframe-trip-type"),r=a.querySelector("#aviaframe-trip-label");if(i&&r){const c=i.value;r.textContent=c==="one_way"?t.trip_oneway:c==="multi_city"?t.trip_multi:t.trip_return}const d=a.querySelector("#aviaframe-cabin"),o=a.querySelector("#aviaframe-cabin-label");if(d&&o){const c={economy:t.cabin_economy,premium_economy:t.cabin_premium,business:t.cabin_business,first:t.cabin_first};o.textContent=c[d.value]||t.cabin_economy}const p=parseInt(a.querySelector("#aviaframe-adults")?.value||"1"),y=parseInt(a.querySelector("#aviaframe-children")?.value||"0"),f=parseInt(a.querySelector("#aviaframe-infants")?.value||"0"),b=p+y+f,w=a.querySelector("#aviaframe-passengers-label");w&&(w.textContent=`${b} ${b===1?t.passenger_singular:t.passenger_plural}`),a.querySelectorAll("#aviaframe-lang-btn .wlt-opt").forEach(c=>c.classList.toggle("wlt-active",c.getAttribute("data-wl")===e)),a.querySelector("#aviaframe-search-form")&&q(a)}function C(e){const a=B[D]||B.en;return a[e]!==void 0?a[e]:B.en[e]!==void 0?B.en[e]:e}function be(e,a={}){return Object.entries(a).reduce((t,[i,r])=>String(t).replaceAll(`{${i}}`,String(r)),C(e))}function Y(e,a){e&&(e.classList.remove("aviaframe-input-invalid"),e.removeAttribute("aria-invalid")),a&&(a.textContent="",a.classList.remove("visible"))}function ae(e){document.querySelectorAll(".aviaframe-validation-popup").forEach(a=>a.remove()),document.querySelectorAll(".aviaframe-input-invalid").forEach(a=>{a.classList.remove("aviaframe-input-invalid"),a.removeAttribute("aria-invalid")})}function U(e,a){if(!e)return;ae(),e.classList.add("aviaframe-input-invalid"),e.setAttribute("aria-invalid","true");const t=document.createElement("div");t.className="aviaframe-validation-popup",t.setAttribute("role","alert"),t.textContent=a,(e.closest(".aviaframe-field")||e.parentElement).appendChild(t),e.focus()}function he(e){e=e||document;const a=e.querySelector("#aviaframe-depart-date"),t=e.querySelector("#aviaframe-return-date"),i=e.querySelector("#aviaframe-depart-date-2");if(t&&a){const r=a.value||a.getAttribute("min")||"";r?t.setAttribute("min",r):t.removeAttribute("min")}if(i&&a){const r=a.value||a.getAttribute("min")||"";r?i.setAttribute("min",r):i.removeAttribute("min")}}function q(e){e=e||document;const a=e.querySelector("#aviaframe-trip-type")?.value||"return",t=e.querySelector("#aviaframe-depart-date"),i=e.querySelector("#aviaframe-return-date"),r=e.querySelector("#aviaframe-depart-date-2"),d=e.querySelector("#aviaframe-return-date-error"),o=e.querySelector("#aviaframe-depart-date-2-error");return he(e),Y(i,d),Y(r,o),a==="return"&&t&&i&&t.value&&i.value&&i.value<t.value?(Y(i,d),{valid:!1,input:i,message:C("error_return_before_depart")}):a==="multi_city"&&t&&r&&t.value&&r.value&&r.value<t.value?(Y(r,o),{valid:!1,input:r,message:C("error_multicity_before_first")}):{valid:!0,input:null,message:""}}const xe=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1},{code:"LTN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Luton",priority:3},{code:"STN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Stansted",priority:4},{code:"LCY",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"City Airport",priority:5},{code:"LIN",city:"Milan",cityRu:"Милан",country:"Italy",name:"Linate",priority:3},{code:"BGY",city:"Milan",cityRu:"Милан",country:"Italy",name:"Bergamo",priority:4},{code:"PMF",city:"Milan",cityRu:"Милан",country:"Italy",name:"Parma",priority:5},{code:"IMR",city:"Milan",cityRu:"Милан",country:"Italy",name:"Rogoredo Railway Station",priority:6},{code:"SVO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Sheremetyevo",priority:1},{code:"DME",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Domodedovo",priority:2},{code:"VKO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Vnukovo",priority:3},{code:"ZIA",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Zhukovsky",priority:4},{code:"LED",city:"Saint Petersburg",cityRu:"Санкт-Петербург",country:"Russia",name:"Pulkovo",priority:1},{code:"ALA",city:"Almaty",cityRu:"Алматы",country:"Kazakhstan",name:"Almaty International",priority:1},{code:"TAS",city:"Tashkent",cityRu:"Ташкент",country:"Uzbekistan",name:"Tashkent International",priority:1}],_e="aviaframe_ac_v4:",we=1440*60*1e3,ke=3500,Z={London:"LON",Milan:"MIL",Moscow:"MOW","Saint Petersburg":"SPT","New York":"NYC",Dubai:"DXB",Istanbul:"IST",Brussels:"BRU",Tokyo:"TYO"},Se={"United Kingdom":"GB",France:"FR",Germany:"DE",Netherlands:"NL",Spain:"ES",Italy:"IT",Belgium:"BE",Austria:"AT",Switzerland:"CH",Denmark:"DK",Norway:"NO",Sweden:"SE",Finland:"FI",Ireland:"IE",Portugal:"PT",Greece:"GR",Turkey:"TR",Ukraine:"UA",Poland:"PL","Czech Republic":"CZ",Hungary:"HU",UAE:"AE",Qatar:"QA",Bahrain:"BH","Saudi Arabia":"SA",Thailand:"TH",Singapore:"SG","Hong Kong":"HK",Japan:"JP","South Korea":"KR",India:"IN",USA:"US",Canada:"CA",Mexico:"MX",Russia:"RU",Kazakhstan:"KZ",Uzbekistan:"UZ"};function te(e){return Se[e]||String(e||"").slice(0,2).toUpperCase()}function re(e){return String(e||"").replace(/\/+$/,"")}function P(e){return String(e||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function Ae(e){const a=re(e),t=[];return a&&(t.push(a),/\/search$/i.test(a)||t.push(`${a}/search`),a.includes("/api/drct/")?t.push(a.replace("/api/drct/","/api/n8n/webhook-test/drct/")):/\/api\/drct$/i.test(a)&&t.push(a.replace("/api/drct","/api/n8n/webhook-test/drct"))),[...new Set(t.filter(Boolean))]}function $e(e){const a=re(e),t=new Set,i=r=>{r&&t.add(r)};if(a){/\/search$/i.test(a)&&i(a.replace(/\/search$/i,"/airports/autocomplete")),i(`${a}/airports/autocomplete`);const r=a.match(/^(https?:\/\/[^/]+)/i);r&&i(`${r[1]}/public/airports/autocomplete`)}return typeof window<"u"&&window.location&&i(`${window.location.origin}/public/airports/autocomplete`),[...t]}function Ee(e,a){return`${_e}${String(a).toLowerCase()}:${String(e||"").trim().toLowerCase()}`}function Te(e){try{const a=localStorage.getItem(e);if(!a)return null;const t=JSON.parse(a);return!t||!t.cachedAt||Date.now()-t.cachedAt>we?(localStorage.removeItem(e),null):t.payload||null}catch{return null}}function Ce(e){return!!(e&&e.source!=="fallback"&&Array.isArray(e.groups)&&e.groups.some(a=>Array.isArray(a.items)&&a.items.length>0))}function ie(e,a){if(Ce(a))try{localStorage.setItem(e,JSON.stringify({cachedAt:Date.now(),payload:a}))}catch{}}function Ie(e,a){const t=P(a),i=P(e.code),r=P(e.city),d=P(e.cityRu),o=P(e.name),p=P(e.country),y=P(Z[e.city]||""),f=[i,r,d,o,p,y].filter(Boolean);if(!f.some(w=>w.includes(t)))return 0;let b=0;return(i===t||y===t)&&(b+=1600),(r===t||d===t)&&(b+=1500),o===t&&(b+=1400),p===t&&(b+=1200),(i.startsWith(t)||y.startsWith(t))&&(b+=1e3),(r.startsWith(t)||d.startsWith(t))&&(b+=950),o.startsWith(t)&&(b+=900),p.startsWith(t)&&(b+=500),r.split(/[\s-]+/).some(w=>w.startsWith(t))&&(b+=220),o.split(/[\s-]+/).some(w=>w.startsWith(t))&&(b+=180),f.some(w=>w.includes(t))&&(b+=120),b-(e.priority||999)}function Le(e,a=12){const t=P(e);if(t.length<1)return[];const i=xe.map(o=>({airport:o,score:Ie(o,t)})).filter(o=>o.score>0).sort((o,p)=>p.score-o.score||(o.airport.priority||999)-(p.airport.priority||999)||o.airport.city.localeCompare(p.airport.city)||o.airport.name.localeCompare(p.airport.name)).slice(0,Math.max(a*4,20)),r=new Map;for(const{airport:o,score:p}of i){const y=`${o.country}:${o.city}`;r.has(y)||r.set(y,{country_code:te(o.country),country_name:o.country,city_code:Z[o.city]||o.code,city_name:o.city,airports:[],bestScore:0}),r.get(y).bestScore=Math.max(r.get(y).bestScore,p),r.get(y).airports.push({type:"airport",code:o.code,name:o.name,city_code:Z[o.city]||o.code,city_name:o.city,country_code:te(o.country),country_name:o.country,priority:o.priority,score:p})}const d=new Map;for(const o of r.values()){const p=`${o.country_code}:${o.country_name}`;d.has(p)||d.set(p,{country_code:o.country_code,country_name:o.country_name,items:[],bestScore:0}),d.get(p).bestScore=Math.max(d.get(p).bestScore,o.bestScore);const y=o.airports.slice().sort((f,b)=>b.score-f.score||(f.priority||999)-(b.priority||999)||f.name.localeCompare(b.name)).map(f=>({type:"airport",code:f.code,name:f.name,city_code:f.city_code,city_name:f.city_name,country_code:f.country_code,country_name:f.country_name,score:f.score}));y.length>1?d.get(p).items.push({type:"city",code:o.city_code,name:o.city_name,city_code:o.city_code,city_name:o.city_name,country_code:o.country_code,country_name:o.country_name,airport_count:y.length,airports:y,score:o.bestScore}):y[0]&&d.get(p).items.push(y[0])}return Array.from(d.values()).sort((o,p)=>p.bestScore-o.bestScore||o.country_name.localeCompare(p.country_name)).map(o=>({...o,items:o.items.sort((p,y)=>(y.score||0)-(p.score||0)||(p.priority||999)-(y.priority||999)||String(p.city_name||p.name||"").localeCompare(String(y.city_name||y.name||"")))})).filter(o=>o.items.length>0)}function Re(e,a=12){return Le(e,a)}async function De(e,a){const t=D==="ar"?"ar":"en",i=Ee(e,t),r=Te(i);if(r)return r;const d=$e(a),o=`q=${encodeURIComponent(e)}&locale=${encodeURIComponent(t)}&limit=12`;for(const y of d){const f=new AbortController,b=setTimeout(()=>f.abort(),ke);try{const w=await fetch(`${y}?${o}`,{method:"GET",headers:{Accept:"application/json"},signal:f.signal});if(clearTimeout(b),!w.ok){if(w.status===404)continue;throw new Error(`autocomplete ${w.status}`)}const c=await w.json();if(c&&Array.isArray(c.groups)&&c.groups.some(s=>Array.isArray(s.items)&&s.items.length>0)){const s={...c,cached:!1};return ie(i,s),s}}catch{clearTimeout(b)}}const p={query:e,locale:t,source:"fallback",groups:Re(e,12),cached:!1};return ie(i,p),p}function Be(e){const a=[],t=[];return(e.groups||[]).forEach(i=>{t.push(`<div class="aviaframe-autocomplete-group"><div class="aviaframe-autocomplete-group-header">${g(i.country_name)} (${g(i.country_code)})</div>${(i.items||[]).map(r=>{if(r.type==="city"){const o=(r.airports||[]).map(f=>String(f.code||"").trim()).filter(Boolean).join(","),p=a.length;a.push({label:`${r.city_name} (${r.code})`,code:r.code,airports:o,cityName:r.city_name});const y=(r.airports||[]).map(f=>{const b=a.length;return a.push({label:`${f.city_name} (${f.code})`,code:f.code,airports:"",cityName:f.city_name}),`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-child" data-index="${b}"><div><span class="aviaframe-airport-code">${g(f.code)}</span><span class="aviaframe-airport-city">${g(f.city_name)}</span></div><span class="aviaframe-airport-name">${g(f.name)}</span></div>`}).join("");return`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-parent" data-index="${p}"><div><span class="aviaframe-airport-code">${g(r.code)}</span><span class="aviaframe-airport-city">${g(r.city_name)}</span></div><span class="aviaframe-airport-name">All airports${r.airport_count?` · ${g(String(r.airport_count))}`:""}</span></div>${y}`}const d=a.length;return a.push({label:`${r.city_name||r.name} (${r.code})`,code:r.code,airports:"",cityName:r.city_name||r.name}),`<div class="aviaframe-autocomplete-item" data-index="${d}"><div><span class="aviaframe-airport-code">${g(r.code)}</span><span class="aviaframe-airport-city">${g(r.city_name||r.name)}</span></div><span class="aviaframe-airport-name">${g(r.name)}, ${g(r.country_name)}</span></div>`}).join("")} </div>`)}),{html:t.join(""),items:a}}function ne(e,a,t){t&&(e.value=t.label,e.dataset.code=t.code||"",e.dataset.airports=t.airports||"",e.dataset.cityName=t.cityName||"",a.style.display="none")}function Me(e){delete e.dataset.code,delete e.dataset.airports,delete e.dataset.cityName}function Ne(e){const a=new Date(e),t=a.getFullYear(),i=String(a.getMonth()+1).padStart(2,"0"),r=String(a.getDate()).padStart(2,"0");return`${t}-${i}-${r}`}function ze(){return Ne(new Date)}function X(){return typeof window>"u"?{}:window.AVIAFRAME_RUNTIME_CONFIG||window.__AVIAFRAME_SITE_CONFIG__||{}}function qe(){if(typeof window>"u")return!1;const e=String(window.location.hostname||"").toLowerCase();return e==="localhost"||e==="127.0.0.1"}function Pe(){return!!X().allowDemoSearchFallback||qe()}function oe(){const e=X();return typeof e.searchIsSandbox=="boolean"?e.searchIsSandbox:/sandbox/i.test(String(e.environment||""))}function Fe(){const e=oe()?C("sandbox_no_results_title"):C("no_results_title"),a=oe()?C("sandbox_no_results_body"):C("no_results_body");return`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${e}</div>
              <div>${a}</div>
            </div>
          `}const Ue=`${ye}
    .aviaframe-widget {
      font-family: var(--af-widget-font);
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      background: var(--af-widget-surface);
      border-radius: var(--af-widget-radius);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .aviaframe-widget * {
      box-sizing: border-box;
    }

    .aviaframe-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--af-widget-text);
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
      border-color: var(--af-widget-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--af-widget-primary) 16%, transparent);
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

    .aviaframe-validation-popup {
      position: absolute;
      z-index: 30;
      top: calc(100% + 8px);
      inset-inline-start: 0;
      max-width: min(320px, 100%);
      padding: 10px 12px;
      border: 1px solid #fdba74;
      border-radius: 8px;
      background: #fff7ed;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
      color: #9a3412;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.35;
    }

    .aviaframe-validation-popup::before {
      position: absolute;
      top: -7px;
      inset-inline-start: 18px;
      width: 12px;
      height: 12px;
      border-top: 1px solid #fdba74;
      border-left: 1px solid #fdba74;
      background: #fff7ed;
      content: "";
      transform: rotate(45deg);
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
      color: var(--af-widget-primary);
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
      background: var(--af-widget-primary);
      border: none;
      border-radius: var(--af-widget-radius);
      cursor: pointer;
      transition: all 0.2s;
    }

    .aviaframe-button:hover:not(:disabled) {
      background: var(--af-widget-primary-hover);
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
      color: var(--af-widget-text);
      min-height: 220px;
      padding: 48px 24px;
      text-align: center;
    }

    .aviaframe-search-radar {
      height: 72px;
      margin-bottom: 14px;
      position: relative;
      width: 72px;
    }

    .aviaframe-search-radar__ring {
      animation: aviaframe-search-pulse 1.8s ease-out infinite;
      border: 1px solid color-mix(in srgb, var(--af-widget-primary) 40%, transparent);
      border-radius: 50%;
      inset: 0;
      position: absolute;
    }

    .aviaframe-search-radar__ring--inner { animation-delay: -0.9s; inset: 18px; }
    .aviaframe-search-radar__beacon { animation: aviaframe-search-beacon 1.2s ease-in-out infinite alternate; background: var(--af-widget-primary); border-radius: 50%; box-shadow: 0 0 0 8px color-mix(in srgb, var(--af-widget-primary) 12%, transparent); height: 12px; left: 30px; position: absolute; top: 30px; width: 12px; }
    .aviaframe-loading-title { font-size: 17px; font-weight: 750; }
    .aviaframe-loading-steps { color: var(--af-widget-muted); font-size: 14px; margin-top: 8px; min-height: 20px; position: relative; width: 100%; }
    .aviaframe-loading-step { animation: aviaframe-search-copy 5.4s infinite; inset: 0; opacity: 0; position: absolute; }
    .aviaframe-loading-step:nth-child(2) { animation-delay: 1.8s; }
    .aviaframe-loading-step:nth-child(3) { animation-delay: 3.6s; }
    .aviaframe-loading-progress { background: color-mix(in srgb, var(--af-widget-border) 70%, transparent); border-radius: 999px; height: 4px; margin-top: 16px; max-width: 210px; overflow: hidden; width: 100%; }
    .aviaframe-loading-progress span { animation: aviaframe-search-progress 1.8s ease-in-out infinite; background: var(--af-widget-primary); border-radius: inherit; display: block; height: 100%; width: 38%; }

    @keyframes aviaframe-search-pulse { 0% { opacity: 0.8; transform: scale(0.35); } 100% { opacity: 0; transform: scale(1); } }
    @keyframes aviaframe-search-beacon { to { transform: scale(1.18); } }
    @keyframes aviaframe-search-copy { 0%, 25% { opacity: 0; transform: translateY(4px); } 8%, 18% { opacity: 1; transform: translateY(0); } }
    @keyframes aviaframe-search-progress { 0% { transform: translateX(-130%); } 55%, 100% { transform: translateX(180%); } }

    @media (prefers-reduced-motion: reduce) {
      .aviaframe-search-radar__ring,
      .aviaframe-search-radar__beacon,
      .aviaframe-loading-step,
      .aviaframe-loading-progress span { animation: none; }
      .aviaframe-loading-step:first-child { opacity: 1; position: static; transform: none; }
    }

    .aviaframe-results {
      margin-top: 24px;
    }

    .aviaframe-passenger-step {
      background: var(--af-widget-surface);
      border: 1px solid var(--af-widget-border);
      border-radius: var(--af-widget-radius);
      color: var(--af-widget-text);
      margin-top: 16px;
      padding: 20px;
    }

    .aviaframe-passenger-summary {
      align-items: flex-start;
      display: flex;
      gap: 16px;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .aviaframe-passenger-eyebrow,
    .aviaframe-passenger-section-title {
      color: var(--af-widget-text);
      font-weight: 800;
    }

    .aviaframe-passenger-eyebrow { font-size: 24px; line-height: 1.15; }
    .aviaframe-passenger-route { color: var(--af-widget-text); font-size: 18px; font-weight: 700; margin-top: 8px; }
    .aviaframe-passenger-airline { color: var(--af-widget-muted); font-size: 15px; font-weight: 600; }
    .aviaframe-passenger-timing { color: var(--af-widget-muted); font-size: 14px; margin-top: 6px; }
    .aviaframe-passenger-price { color: var(--af-widget-primary); font-size: 34px; font-weight: 800; line-height: 1; text-align: end; }
    .aviaframe-passenger-price-label { color: var(--af-widget-muted); font-size: 13px; margin-top: 6px; text-align: end; }
    .aviaframe-passenger-section-title { font-size: 18px; grid-column: 1 / -1; }

    .aviaframe-passenger-form {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .aviaframe-passenger-field { display: flex; flex-direction: column; gap: 6px; }
    .aviaframe-passenger-form-label { color: var(--af-widget-text); font-size: 14px; font-weight: 600; }
    .aviaframe-passenger-field-help { color: var(--af-widget-muted); font-size: 12px; margin-top: -6px; }
    .aviaframe-passenger-input {
      background: var(--af-widget-surface);
      border: 1px solid var(--af-widget-border);
      border-radius: var(--af-widget-radius);
      color: var(--af-widget-text);
      font: inherit;
      min-height: 46px;
      outline: none;
      padding: 10px 12px;
    }

    .aviaframe-passenger-input:focus {
      border-color: var(--af-widget-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--af-widget-primary) 16%, transparent);
    }

    .aviaframe-passenger-divider { background: var(--af-widget-border); grid-column: 1 / -1; height: 1px; margin: 2px 0; }
    .aviaframe-passenger-error {
      background: color-mix(in srgb, var(--af-widget-danger) 8%, white);
      border: 1px solid color-mix(in srgb, var(--af-widget-danger) 24%, white);
      border-radius: var(--af-widget-radius);
      color: var(--af-widget-danger);
      display: none;
      font-size: 14px;
      grid-column: 1 / -1;
      padding: 10px 12px;
    }

    .aviaframe-passenger-actions { display: flex; gap: 10px; grid-column: 1 / -1; justify-content: space-between; margin-top: 4px; }
    .aviaframe-passenger-button {
      border-radius: var(--af-widget-radius);
      cursor: pointer;
      font: 700 14px/1 var(--af-widget-font);
      min-height: 44px;
      padding: 12px 18px;
    }

    .aviaframe-passenger-button--secondary { background: var(--af-widget-surface); border: 1px solid var(--af-widget-border); color: var(--af-widget-text); }
    .aviaframe-passenger-button--primary { background: var(--af-widget-primary); border: 1px solid var(--af-widget-primary); color: #fff; }
    .aviaframe-passenger-button--primary:hover { background: var(--af-widget-primary-hover); border-color: var(--af-widget-primary-hover); }
    .aviaframe-passenger-success { padding: 10px 0; }
    .aviaframe-passenger-success h3 { color: var(--af-widget-success); font-size: 20px; margin: 0 0 6px; }
    .aviaframe-passenger-success p { color: var(--af-widget-muted); font-size: 14px; margin: 0; }
    .aviaframe-passenger-success .aviaframe-passenger-button { margin-top: 12px; }
    .aviaframe-passenger-autofill { align-items: center; background: color-mix(in srgb, var(--af-widget-primary) 8%, white); border: 1px solid color-mix(in srgb, var(--af-widget-primary) 24%, white); border-radius: var(--af-widget-radius); display: flex; gap: 12px; grid-column: 1 / -1; justify-content: space-between; margin-top: 4px; padding: 12px 16px; }
    .aviaframe-passenger-autofill-message { color: var(--af-widget-primary); font-size: 13px; }
    .aviaframe-passenger-autofill-undo { background: transparent; border: 1px solid color-mix(in srgb, var(--af-widget-primary) 30%, white); border-radius: var(--af-radius-sm, 8px); color: var(--af-widget-primary); cursor: pointer; flex-shrink: 0; font: 600 12px/1 var(--af-widget-font); padding: 6px 10px; }

    @media (max-width: 640px) {
      .aviaframe-passenger-step { padding: 16px; }
      .aviaframe-passenger-summary { flex-direction: column; }
      .aviaframe-passenger-price, .aviaframe-passenger-price-label { text-align: start; }
      .aviaframe-passenger-form { grid-template-columns: 1fr; }
      .aviaframe-passenger-actions { flex-direction: column-reverse; }
      .aviaframe-passenger-button { width: 100%; }
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

    .aviaframe-more-wrap {
      display: flex;
      justify-content: center;
      padding: 24px 0 8px;
    }

    .aviaframe-more-btn {
      padding: 10px 32px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      background: #fff;
      color: #374151;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .aviaframe-more-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
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

    /* ── Custom date picker ── */
    .wdp-wrapper { position: relative; }
    .wdp-trigger {
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; user-select: none;
    }
    .wdp-display { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #111827; }
    .wdp-display.wdp-empty { color: #9ca3af; }
    .wdp-icon { margin-left: 8px; flex-shrink: 0; color: #6b7280; }
    .wdp-popup {
      position: absolute; top: calc(100% + 4px); left: 0; z-index: 99999;
      background: white; border: 1px solid #d1d5db; border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14); padding: 12px; min-width: 268px;
      font-size: 14px;
    }
    .aviaframe-widget[dir="rtl"] .wdp-popup { left: auto; right: 0; }
    .aviaframe-widget[dir="rtl"] .wdp-icon { margin-left: 0; margin-right: 8px; }
    .wdp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .wdp-month-label { font-weight: 700; font-size: 14px; color: #111827; }
    .wdp-nav {
      background: none; border: 1px solid #e5e7eb; border-radius: 6px;
      width: 28px; height: 28px; cursor: pointer; font-size: 16px; line-height: 1;
      color: #374151; padding: 0; display: flex; align-items: center; justify-content: center;
    }
    .wdp-nav:hover { background: #f3f4f6; }
    .wdp-days-hdr { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 4px; }
    .wdp-dh { text-align: center; font-size: 11px; font-weight: 600; color: #9ca3af; padding: 2px 0; }
    .wdp-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
    .wdp-day {
      aspect-ratio: 1; border: none; background: none; border-radius: 6px;
      cursor: pointer; font-size: 13px; color: #374151; width: 100%;
      display: flex; align-items: center; justify-content: center;
    }
    .wdp-day:hover:not(:disabled) { background: color-mix(in srgb, var(--af-widget-primary) 9%, white); color: var(--af-widget-primary); }
    .wdp-day-today { font-weight: 700; color: var(--af-widget-primary); }
    .wdp-day-selected { background: var(--af-widget-primary) !important; color: white !important; }
    .wdp-day-disabled { opacity: 0.3; cursor: not-allowed; }
  `;function Oe(){const e=ze();return`
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

      <form class="aviaframe-form" id="aviaframe-search-form" novalidate>
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
    `}function He(){var e;const a=Array.from(document.querySelectorAll(".aviaframe-dropdown")),t=()=>a.forEach(m=>m.classList.remove("open"));a.forEach(m=>{const A=m.querySelector(".aviaframe-dropdown-btn");A&&A.addEventListener("click",T=>{T.stopPropagation();const h=m.classList.contains("open");t(),h||m.classList.add("open")})}),document.addEventListener("click",m=>{m.target.closest(".aviaframe-dropdown")||t()});const i=document.getElementById("aviaframe-trip-type"),r=document.getElementById("aviaframe-trip-label"),d=(e=document.getElementById("aviaframe-return-date"))==null?void 0:e.closest(".aviaframe-field"),o=document.getElementById("aviaframe-multi-city-fields"),p=document.getElementById("aviaframe-depart-date"),y=document.getElementById("aviaframe-return-date"),f=document.getElementById("aviaframe-depart-date-2");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(m=>{m.addEventListener("change",()=>{m.checked&&(i.value=m.value,r.textContent=m.value==="one_way"?(B[D]||B.en).trip_oneway:m.value==="multi_city"?(B[D]||B.en).trip_multi:(B[D]||B.en).trip_return,m.value==="one_way"?(d&&(d.style.display="none"),o&&(o.style.display="none")):m.value==="multi_city"?(d&&(d.style.display="none"),o&&(o.style.display="block")):(d&&(d.style.display="block"),o&&(o.style.display="none"))),q(document)})}),p&&p.addEventListener("change",()=>{q(document)}),y&&y.addEventListener("change",()=>{q(document)}),f&&f.addEventListener("change",()=>{q(document)}),q(document);const b=document.getElementById("aviaframe-cabin"),w=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(m=>{m.addEventListener("change",()=>{m.checked&&(b.value=m.value,w.textContent=m.parentElement.textContent.trim())})});const c={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},s={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},L=()=>{document.getElementById("aviaframe-adults").value=s.adults,document.getElementById("aviaframe-children").value=s.children,document.getElementById("aviaframe-infants").value=s.infants,document.getElementById("aviaframe-cabin-bags").value=s.cabinBags,document.getElementById("aviaframe-checked-bags").value=s.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(s.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(s.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${s.adults+s.children+s.infants} ${s.adults+s.children+s.infants===1?(B[D]||B.en).passenger_singular:(B[D]||B.en).passenger_plural}`},u=()=>{const m=document.getElementById("aviaframe-age-selectors");for(;s.childrenAges.length<s.children;)s.childrenAges.push(2);for(;s.childrenAges.length>s.children;)s.childrenAges.pop();for(;s.infantAges.length<s.infants;)s.infantAges.push(1);for(;s.infantAges.length>s.infants;)s.infantAges.pop();const A=s.childrenAges.map((h,n)=>`
        <div class="aviaframe-age-item">
          <label>Child ${n+1} age</label>
          <select data-age-type="child" data-age-index="${n}">
            ${Array.from({length:10},(l,v)=>v+2).map(l=>`<option value="${l}" ${l===h?"selected":""}>${l}</option>`).join("")}
          </select>
        </div>
      `).join(""),T=s.infantAges.map((h,n)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${n+1} age</label>
          <select data-age-type="infant" data-age-index="${n}">
            ${Array.from({length:2},(l,v)=>v).map(l=>`<option value="${l}" ${l===h?"selected":""}>${l}</option>`).join("")}
          </select>
        </div>
      `).join("");m.innerHTML=A+T,m.querySelectorAll("select[data-age-type]").forEach(h=>{h.addEventListener("change",()=>{const n=h.getAttribute("data-age-type"),l=Number(h.getAttribute("data-age-index")),v=Number(h.value);n==="child"?s.childrenAges[l]=v:s.infantAges[l]=v,L()})}),L()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(m=>{m.addEventListener("click",()=>{const A=m.getAttribute("data-counter"),T=Number(m.getAttribute("data-delta")),h=c[A];if(!h)return;const n=Math.max(h.min,Math.min(h.max,s[A]+T));s[A]=n;const l=document.getElementById(`aviaframe-count-${A}`);l&&(l.textContent=n),u()})}),u()}function K(e,a,t){const i=document.getElementById(e),r=document.getElementById(a);if(!i||!r)return;let d=-1,o=[],p=null,y=0;const f=()=>{r.style.display="none",o=[],d=-1},b=()=>{r.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach((c,s)=>{s===d?(c.classList.add("active"),c.scrollIntoView({block:"nearest"})):c.classList.remove("active")})},w=()=>{o.length?(r.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach(c=>{c.addEventListener("mousedown",function(s){s.preventDefault();const L=Number(this.getAttribute("data-index")),u=o[L];ne(i,r,u)})}),r.style.display="block"):(r.innerHTML="",f())};i.addEventListener("input",function(){const c=this.value.trim();Me(i),p&&clearTimeout(p),c.length<1&&f(),c.length<1||(r.innerHTML='<div class="aviaframe-autocomplete-empty">Searching...</div>',r.style.display="block",p=setTimeout(async()=>{const s=++y;try{const L=await De(c,t);if(s!==y)return;const u=Be(L);o=u.items,r.innerHTML=u.html||'<div class="aviaframe-autocomplete-empty">No airports found</div>',d=-1,w()}catch{o=[],r.innerHTML='<div class="aviaframe-autocomplete-empty">No airports found</div>',r.style.display="block"}},250))}),i.addEventListener("keydown",function(c){o.length&&(c.key==="ArrowDown"?(c.preventDefault(),d=Math.min(d+1,o.length-1),b()):c.key==="ArrowUp"?(c.preventDefault(),d=Math.max(d-1,0),b()):c.key==="Enter"&&d>=0?(c.preventDefault(),ne(i,r,o[d])):c.key==="Escape"&&f())}),document.addEventListener("click",function(c){!i.contains(c.target)&&!r.contains(c.target)&&f()})}function je(e){const a=document.getElementById("aviaframe-search-form"),t=document.getElementById("aviaframe-results");a.addEventListener("submit",async function(i){i.preventDefault(),ae();const r=document.getElementById("aviaframe-origin"),d=document.getElementById("aviaframe-destination"),o=document.getElementById("aviaframe-depart-date").value,p=document.getElementById("aviaframe-return-date").value,y=parseInt(document.getElementById("aviaframe-adults").value,10),f=parseInt(document.getElementById("aviaframe-children").value,10)||0,b=parseInt(document.getElementById("aviaframe-infants").value,10)||0,w=document.getElementById("aviaframe-trip-type").value||"return",c=document.getElementById("aviaframe-cabin").value,s=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),L=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),u=r.dataset.code,m=d.dataset.code,A=r.dataset.airports||u,T=d.dataset.airports||m;if(!u||!m){U(u?d:r,C("error_select_airports"));return}if(!o){U(document.getElementById("aviaframe-depart-date"),C("error_select_depart_date"));return}if(w==="return"&&!p){const x=document.getElementById("aviaframe-return-date");U(x,C("error_select_return_date"));return}const h=q(document);if(!h.valid){U(h.input,h.message);return}t.innerHTML=`
        <div class="aviaframe-loading" role="status" aria-live="polite" aria-atomic="true">
          <div class="aviaframe-search-radar" aria-hidden="true">
            <span class="aviaframe-search-radar__ring"></span>
            <span class="aviaframe-search-radar__ring aviaframe-search-radar__ring--inner"></span>
            <span class="aviaframe-search-radar__beacon"></span>
          </div>
          <div class="aviaframe-loading-title">${C("searching_flights")}</div>
          <div class="aviaframe-loading-steps">
            <span class="aviaframe-loading-step">${C("searching_routes")}</span>
            <span class="aviaframe-loading-step">${C("searching_fares")}</span>
            <span class="aviaframe-loading-step">${C("searching_options")}</span>
          </div>
          <div class="aviaframe-loading-progress" aria-hidden="true"><span></span></div>
        </div>
      `;let n={origin:A,destination:T,origin_city:u,destination_city:m,depart_date:o,return_date:p||null,adults:y,children:f,infants:b,children_ages:s,infant_ages:L,cabin_class:c,trip_type:w};const l=X(),v=document.querySelector("[data-aviaframe-widget]")||document.getElementById("aviaframe-widget");if(Object.prototype.hasOwnProperty.call(l,"searchOriginHost")?l.searchOriginHost&&(n.origin_host=l.searchOriginHost):l.siteOriginHost&&(n.origin_host=l.siteOriginHost),v?.dataset?.agencyKey&&(n.agency_key=v.dataset.agencyKey),w==="one_way"&&(n.return_date=null),w==="multi_city"){const x=document.getElementById("aviaframe-origin-2"),I=document.getElementById("aviaframe-destination-2"),S=document.getElementById("aviaframe-depart-date-2").value,$=x?.dataset.code,k=I?.dataset.code,_=x?.dataset.airports||$,R=I?.dataset.airports||k;if(!$||!k||!S){U($?k?document.getElementById("aviaframe-depart-date-2"):I:x,C("error_multicity_missing"));return}const N=q(document);if(!N.valid){U(N.input,N.message);return}n.segments=[{origin:A,destination:T,origin_city:u,destination_city:m,depart_date:o},{origin:_,destination:R,origin_city:$,destination_city:k,depart_date:S}]}try{let x=null;const I=Ae(e);for(const $ of I)if(x=await fetch($,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),x.ok||x.status!==404)break;if(!x.ok)throw x.status===422?new Error(C("error_search_invalid")):new Error(`HTTP ${x.status}: ${x.statusText}`);const S=await x.json();if(S.offers&&S.offers.length>0){const $=S.offers.map(k=>{const _={...k,_searchOrigin:k?._searchOrigin||u||null,_searchDestination:k?._searchDestination||m||null,_searchReturnDate:k?._searchReturnDate||n.return_date||null};if(!(_!=null&&_.return_origin&&_!=null&&_.return_destination||_!=null&&_.return_departure_time&&_!=null&&_.return_arrival_time)&&n.return_date){const R=Ve(_);R&&Object.assign(_,R),_.return_origin||(_.return_origin=m||null),_.return_destination||(_.return_destination=u||null)}return _});me($)}else t.innerHTML=Fe()}catch(x){const I=String(x?.message||""),S=I.includes("HTTP 404");if(x?.name==="TypeError"||I.includes("Failed to fetch")||I.toLowerCase().includes("cors")||S){if(Pe()){const $=na({...n,origin:u,destination:m});me($,{noticeHtml:`
                <div class="aviaframe-warning">
                  Demo mode: backend is currently not reachable from the browser (CORS/network), so test offers are shown for UI validation.
                </div>
              `}),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",x);return}t.innerHTML=`
            <div class="aviaframe-error">
              <strong>${C("error_title")}:</strong> Live search is temporarily unavailable. Please refresh and try again.
            </div>
          `;return}t.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${g(I)}
          </div>
        `}})}function Ye(e){const a=String(e||"").trim().toUpperCase();return/^[A-Z0-9]{2,3}$/.test(a)?`https://pics.avs.io/200/80/${encodeURIComponent(a)}.png`:null}function se(e){const a=String(e||"").trim(),t=a.match(/^(\d{4})-(\d{2})-(\d{2})$/),i=a.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/),r=Number(t?t[1]:i?i[3]:0),d=Number(t?t[2]:i?i[2]:0),o=Number(t?t[3]:i?i[1]:0),p=new Date(Date.UTC(r,d-1,o));return!r||p.getUTCFullYear()!==r||p.getUTCMonth()!==d-1||p.getUTCDate()!==o?"":`${String(r).padStart(4,"0")}-${String(d).padStart(2,"0")}-${String(o).padStart(2,"0")}`}function Ke(e){const a=se(e);if(!a)return String(e||"");const[t,i,r]=a.split("-");return`${r}.${i}.${t}`}function We(e){const a=String(e||"").replace(/\D/g,"").slice(0,8);return[a.slice(0,2),a.slice(2,4),a.slice(4,8)].filter(Boolean).join(".")}function le(e){const a={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,selected_at:new Date().toISOString()};localStorage.setItem("selectedOffer",JSON.stringify(a)),console.log("✅ Offer selected:",e.offer_id),window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:a},bubbles:!0}));const t=document.querySelector(".aviaframe-widget"),i=document.getElementById("aviaframe-results"),r=document.getElementById("aviaframe-search-form");if(!t){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a},bubbles:!0})),M.checkoutUrl&&(window.location.href=M.checkoutUrl);return}r&&(r.style.display="none"),i&&(i.style.display="none");const d=document.getElementById("aviaframe-passenger-step");d&&d.remove();const o=(e?.price||{}).currency||"SAR",p=W((e?.price||{}).total||0,o),y=e.airline_name||e.airline||"Airline",f=e.origin||"---",b=e.destination||"---",w=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",c=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A",s=document.createElement("div");s.id="aviaframe-passenger-step",s.className="aviaframe-passenger-step",s.innerHTML=`
        <div class="aviaframe-passenger-summary">
          <div>
            <div class="aviaframe-passenger-eyebrow">Selected Flight</div>
            <div class="aviaframe-passenger-route">${g(f)} → ${g(b)} <span class="aviaframe-passenger-airline">${g(y)}</span></div>
            <div class="aviaframe-passenger-timing">Departure: ${g(w)} | Arrival: ${g(c)}</div>
          </div>
          <div>
            <div class="aviaframe-passenger-price">${p}</div>
            <div class="aviaframe-passenger-price-label">per person</div>
          </div>
        </div>
        <div class="aviaframe-passenger-section-title">Passenger Details</div>
        <form id="aviaframe-passenger-form" class="aviaframe-passenger-form">
          <div class="aviaframe-passenger-section-title">Contact Information</div>
          <label class="aviaframe-passenger-field"><span class="aviaframe-passenger-form-label">Email Address *</span><input class="aviaframe-passenger-input" required type="email" name="email" placeholder="name@example.com" /></label>
          <label class="aviaframe-passenger-field"><span class="aviaframe-passenger-form-label">Phone Number *</span><input class="aviaframe-passenger-input" required name="phone" placeholder="+971501234567" /></label>
          <div class="aviaframe-passenger-divider"></div>
          <div class="aviaframe-passenger-section-title">Personal Information</div>
          <label class="aviaframe-passenger-field"><span class="aviaframe-passenger-form-label">Gender *</span><select class="aviaframe-passenger-input" name="gender"><option value="male">Male</option><option value="female">Female</option></select></label>
          <label class="aviaframe-passenger-field"><span class="aviaframe-passenger-form-label">Date of Birth *</span><input class="aviaframe-passenger-input" required type="text" name="dateOfBirth" inputmode="numeric" autocomplete="bday" maxlength="10" placeholder="DD.MM.YYYY" pattern="[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}" aria-describedby="aviaframe-date-of-birth-help" /><small id="aviaframe-date-of-birth-help" class="aviaframe-passenger-field-help">Enter day, month and year</small></label>
          <label class="aviaframe-passenger-field"><span class="aviaframe-passenger-form-label">First Name *</span><input class="aviaframe-passenger-input" required name="firstName" placeholder="John" /></label>
          <label class="aviaframe-passenger-field"><span class="aviaframe-passenger-form-label">Last Name *</span><input class="aviaframe-passenger-input" required name="lastName" placeholder="Doe" /></label>
          <div class="aviaframe-passenger-divider"></div>
          <div class="aviaframe-passenger-section-title">Document Information</div>
          <label class="aviaframe-passenger-field"><span class="aviaframe-passenger-form-label">Passport Number *</span><input class="aviaframe-passenger-input" required name="passportNumber" placeholder="AB1234567" /></label>
          <label class="aviaframe-passenger-field"><span class="aviaframe-passenger-form-label">Passport Expiry Date *</span><input class="aviaframe-passenger-input" required type="date" name="passportExpiry" /></label>
          <div id="aviaframe-passenger-error" class="aviaframe-passenger-error" role="alert" aria-live="assertive"></div>
          <div class="aviaframe-passenger-actions"><button type="button" id="aviaframe-passenger-back" class="aviaframe-passenger-button aviaframe-passenger-button--secondary">Back</button><button type="submit" class="aviaframe-passenger-button aviaframe-passenger-button--primary">Continue to booking</button></div>
        </form>`,t.appendChild(s),window.scrollTo({top:0,behavior:"smooth"});const L=s.querySelector("#aviaframe-passenger-back"),u=s.querySelector("#aviaframe-passenger-form"),m=s.querySelector("#aviaframe-passenger-error"),A=u&&u.querySelector('input[name="dateOfBirth"]');if(A&&A.addEventListener("input",()=>{const T=We(A.value);A.value!==T&&(A.value=T)}),L&&L.addEventListener("click",()=>{s.remove(),r&&(r.style.display=""),i&&(i.style.display="")}),u&&u.addEventListener("submit",T=>{T.preventDefault();const h=new FormData(u),n={firstName:String(h.get("firstName")||""),lastName:String(h.get("lastName")||""),email:String(h.get("email")||""),phone:String(h.get("phone")||""),gender:String(h.get("gender")||"male"),dateOfBirth:se(h.get("dateOfBirth")),passportNumber:String(h.get("passportNumber")||""),passportExpiry:String(h.get("passportExpiry")||"")},l=new Date,v=new Date(`${n.dateOfBirth}T00:00:00`),E=new Date(v);if(!n.dateOfBirth||Number.isNaN(v.getTime())){m&&(m.textContent=D==="ar"?"أدخل تاريخ الميلاد بالصيغة يوم.شهر.سنة.":"Enter the date of birth as DD.MM.YYYY.",m.style.display="block");return}if(E.setFullYear(E.getFullYear()+18),E>l){m&&(m.textContent=D==="ar"?"يجب أن يكون عمر المسافر 18 عامًا على الأقل.":"Passenger must be at least 18 years old.",m.style.display="block");return}const x=(e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10),I=new Date(x+"T00:00:00"),S=new Date(I);S.setMonth(S.getMonth()+6);const $=new Date(n.passportExpiry+"T00:00:00");if(!n.passportExpiry||Number.isNaN($.getTime())||$<S){m&&(m.textContent=D==="ar"?"يجب أن يكون جواز السفر صالحاً لمدة 6 أشهر على الأقل من تاريخ الرحلة.":"Passport must be valid for at least 6 months from the trip date.",m.style.display="block");return}m&&(m.style.display="none"),localStorage.setItem("passengerData",JSON.stringify(n)),window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a,passenger:n},bubbles:!0})),M.checkoutUrl?window.location.href=M.checkoutUrl:s.innerHTML='<div class="aviaframe-passenger-success"><h3>Passenger details saved</h3><p>Host app can continue booking via aviaframe:continueToBooking event.</p><button type="button" id="aviaframe-passenger-back2" class="aviaframe-passenger-button aviaframe-passenger-button--secondary">Back to search</button></div>',s.querySelector("#aviaframe-passenger-back2")&&s.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{s.remove(),r&&(r.style.display=""),i&&(i.style.display="")})}),u){const T=u.querySelector('input[name="email"]');if(T){const h=async()=>{const n=Date.now();return M.widgetSessionToken&&M.widgetSessionTokenExpiresAt>n+5e3?M.widgetSessionToken:(M.widgetSessionPromise||(M.widgetSessionPromise=(async()=>{const l=document.getElementById("aviaframe-widget"),v=l&&l.dataset.apiUrl||"",E=l?String(l.dataset.agencyKey||"").trim():"",x=l?String(l.dataset.agencyDomain||"").trim():"";if(!v||!E&&!x&&!window.location.hostname)return null;const I=new URL(v).origin,S=await fetch(`${I}/api/widget/session`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({agency_key:E||void 0,agency_domain:E?void 0:x||window.location.hostname||void 0,origin_host:window.location.hostname||void 0})});if(!S.ok)return null;const $=await S.json().catch(()=>({})),k=String($.widget_token||"").trim(),_=Math.max(parseInt($.expires_in,10)||0,0);return k?(M.widgetSessionToken=k,M.widgetSessionTokenExpiresAt=Date.now()+_*1e3,k):null})().catch(()=>null).finally(()=>{M.widgetSessionPromise=null})),M.widgetSessionPromise)};T.addEventListener("blur",async function(){const n=this.value.trim();if(!(!n||!n.includes("@")))try{const l=document.getElementById("aviaframe-widget"),v=l&&l.dataset.apiUrl||"";if(!v)return;const E=new URL(v).origin,x=await h();if(!x)return;const I=await fetch(`${E}/public/customer-profile?email=${encodeURIComponent(n)}`,{headers:{Authorization:`Bearer ${x}`}});if(!I.ok)return;const S=await I.json();if(!S.found||!S.profile)return;const $=u.querySelector("#_af_banner");$&&$.remove();const k=document.createElement("div");k.id="_af_banner",k.className="aviaframe-passenger-autofill";const _=S.profile.first_name||"",R=D==="ar";k.innerHTML=`<span class="aviaframe-passenger-autofill-message">⏳ ${R?"جارٍ تعبئة البيانات...":"Prefilling your saved details..."}</span>`;const N=T.closest("label");N?N.insertAdjacentElement("afterend",k):u.insertBefore(k,u.firstChild);const V=document.getElementById("aviaframe-passenger-form")||u,ca={phone:S.profile.phone,gender:S.profile.gender,dateOfBirth:S.profile.date_of_birth,firstName:S.profile.first_name,lastName:S.profile.last_name},ve={};Object.entries(ca).forEach(([O,H])=>{if(!H)return;const z=V.querySelector(`[name="${O}"]`);z&&(ve[O]=z.value,z.value=O==="dateOfBirth"?Ke(H):H,z.dispatchEvent(new Event("input",{bubbles:!0})),z.dispatchEvent(new Event("change",{bubbles:!0})))}),k.innerHTML=`<span class="aviaframe-passenger-autofill-message">${R?"✓ تم تعبئة بياناتك المحفوظة":`✓ Prefilled your saved details${_?", "+g(_):""}`}</span><button type="button" id="_af_undo_btn" class="aviaframe-passenger-autofill-undo">${R?"تراجع":"Undo"}</button>`,k.querySelector("#_af_undo_btn").addEventListener("click",()=>{Object.entries(ve).forEach(([O,H])=>{const z=V.querySelector(`[name="${O}"]`);z&&(z.value=H,z.dispatchEvent(new Event("input",{bubbles:!0})))}),k.remove()})}catch{}})}}}function F(e,a=0){const t=Number(e);return Number.isFinite(t)?t:a}function g(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function W(e,a){const t=String(a||"SAR").trim().toUpperCase(),i=/^[A-Z]{3}$/.test(t)?t:"SAR";let r;return window.AviaframeDisplayCurrency&&typeof window.AviaframeDisplayCurrency.formatAmount=="function"?r=window.AviaframeDisplayCurrency.formatAmount(e,i):r=`${Math.round(F(e,0)).toLocaleString("en-US")} ${i}`,`<span class="_afp" data-a="${Number(e)||0}" data-c="${i}">${g(r)}</span>`}window.__aviaframeWidgetCurrencyRefresh=function(){document.querySelectorAll("._afp").forEach(function(e){const a=parseFloat(e.getAttribute("data-a")),t=e.getAttribute("data-c");!isNaN(a)&&window.AviaframeDisplayCurrency&&typeof window.AviaframeDisplayCurrency.formatAmount=="function"&&(e.textContent=window.AviaframeDisplayCurrency.formatAmount(a,t))})};function G(e){if(!e)return"--:--";const a=String(e).match(/T(\d{2}:\d{2})/);return a?a[1]:String(e)}function J(e){return e?String(e).trim().toUpperCase():null}function de(e){var a;return J(e?.origin_code||((a=e?.departure_airport)==null?void 0:a.code)||e?.origin)}function ce(e){var a;return J(e?.destination_code||((a=e?.arrival_airport)==null?void 0:a.code)||e?.destination)}function Ge(e){return e?.departure||[e?.departure_date,e?.departure_time].filter(Boolean).join("T")}function Je(e){return e?.arrival||[e?.arrival_date,e?.arrival_time].filter(Boolean).join("T")}function Ve(e){const a=Array.isArray(e?.segments)?e.segments:[];if(!a.length)return null;const t=J(e?._searchOrigin||e?.origin),i=J(e?._searchDestination||e?.destination);if(!t||!i)return null;let r=-1;for(let c=1;c<a.length;c+=1){const s=de(a[c]),L=ce(a[c]);if(s===i||L===t){r=c;break}}if(r<0)return null;const d=a.slice(r),o=d[0],p=d[d.length-1],y=de(o)||i,f=ce(p)||t,b=Ge(o)||null,w=Je(p)||null;return!y||!f?null:{return_origin:y,return_destination:f,return_departure_time:b,return_arrival_time:w}}function Ze(e){if(e.duration_minutes)return F(e.duration_minutes,0);if(e.durationMinutes)return F(e.durationMinutes,0);if(e.journey_time)return Math.round(F(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const a=new Date(e.departure_time).getTime(),t=new Date(e.arrival_time).getTime();return!Number.isFinite(a)||!Number.isFinite(t)||t<=a?0:Math.round((t-a)/6e4)}function Xe(e,a){if(!e||!a)return 0;const t=new Date(e).getTime(),i=new Date(a).getTime();return!Number.isFinite(t)||!Number.isFinite(i)||i<=t?0:Math.round((i-t)/6e4)}function pe(e){const a=F(e,0),t=Math.floor(a/60),i=a%60;return a<=0?"n/a":`${t}h ${i}m`}function Qe(e){return e.stops!==void 0?F(e.stops,0):e.transfers_count!==void 0?F(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function ea(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function aa(e){const a=Array.isArray(e?.baggage)?e.baggage:[],t=a.find(r=>r?.type==="checked"),i=Number(t?.quantity);return Number.isFinite(i)?i:0}function ta(e){const a=aa(e);return a>1?be("badge_checked_bags_included",{count:a}):a===1?C("badge_checked_bag_included"):e!=null&&e.with_baggage===!1?C("badge_no_checked_bag"):typeof e?.baggage_text=="string"&&e.baggage_text.trim()?e.baggage_text.trim():e!=null&&e.with_baggage?C("filter_with_baggage"):C("badge_no_checked_bag")}function ra(e){const a=(e.airline_code||e.airline||"").toString().trim();return a?a.slice(0,2).toUpperCase():"NA"}function ia(e){var a,t;const i=F((a=e?.price)==null?void 0:a.total,0),r=((t=e?.price)==null?void 0:t.currency)||"SAR",d=Qe(e),o=Array.isArray(e?.segments)?e.segments.map(s=>{var L,u,m,A,T;return{origin:s?.origin||((L=s?.departure_city)==null?void 0:L.name)||((u=s?.departure_airport)==null?void 0:u.code)||"N/A",destination:s?.destination||((m=s?.arrival_city)==null?void 0:m.name)||((A=s?.arrival_airport)==null?void 0:A.code)||"N/A",departure:s?.departure||[s?.departure_date,s?.departure_time].filter(Boolean).join(" ")||"N/A",arrival:s?.arrival||[s?.arrival_date,s?.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((T=s?.carrier)==null?void 0:T.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:s?.flight_number||"N/A"}}):[],p=!!(e!=null&&e.return_origin&&e!=null&&e.return_destination||e!=null&&e.return_departure_time&&e!=null&&e.return_arrival_time),y=p?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",f=p?G(e.return_departure_time):"--:--",b=p?G(e.return_arrival_time):"--:--",w=p?Xe(e.return_departure_time,e.return_arrival_time):0,c=p?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:ra(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:G(e.departure_time),arrive:G(e.arrival_time),durationMinutes:Ze(e),stops:d,stopsText:ea(d),priceTotal:i,priceCurrency:r,with_baggage:e.with_baggage===!0,baggageText:ta(e),segments:o,hasReturnData:p,returnRoute:y,returnDepart:f,returnArrive:b,returnDurationMinutes:w,returnSummary:c}}function na(e){const a=e.origin||"WAW",t=e.destination||"YVR",i=e.depart_date||"2026-02-27",r=e.return_date||"",d=e.trip_type!=="one_way"&&!!r,o=(p,y,f,b=[])=>{const w=c=>({origin:c.from,destination:c.to,departure:c.depart,arrival:c.arrive,carrier:{airline_code:p,airline_name:y},flight_number:c.flight});return[...f.map(w),...b.map(w)]};return[{offer_id:"fallback_1",origin:a,destination:t,departure_time:`${i}T13:05:00`,arrival_time:`${i}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:d?t:null,return_destination:d?a:null,return_departure_time:d?`${r}T14:20:00`:null,return_arrival_time:d?`${r}T22:40:00`:null,segments:o("DL","DELTA",[{from:a,to:"CDG",depart:`${i}T13:05:00`,arrive:`${i}T16:10:00`,flight:"737"},{from:"CDG",to:t,depart:`${i}T17:05:00`,arrive:`${i}T23:25:00`,flight:"4200"}],d?[{from:t,to:"FRA",depart:`${r}T14:20:00`,arrive:`${r}T17:10:00`,flight:"9655"},{from:"FRA",to:a,depart:`${r}T18:30:00`,arrive:`${r}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"SAR"}},{offer_id:"fallback_2",origin:a,destination:t,departure_time:`${i}T08:10:00`,arrival_time:`${i}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:d?t:null,return_destination:d?a:null,return_departure_time:d?`${r}T09:00:00`:null,return_arrival_time:d?`${r}T20:30:00`:null,segments:o("LO","LOT",[{from:a,to:t,depart:`${i}T08:10:00`,arrive:`${i}T22:00:00`,flight:"441"}],d?[{from:t,to:a,depart:`${r}T09:00:00`,arrive:`${r}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"SAR"}},{offer_id:"fallback_3",origin:a,destination:t,departure_time:`${i}T06:45:00`,arrival_time:`${i}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:d?t:null,return_destination:d?a:null,return_departure_time:d?`${r}T07:10:00`:null,return_arrival_time:d?`${r}T19:55:00`:null,segments:o("AC","AIR CANADA",[{from:a,to:"MUC",depart:`${i}T06:45:00`,arrive:`${i}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${i}T11:50:00`,arrive:`${i}T14:50:00`,flight:"837"},{from:"YYZ",to:t,depart:`${i}T18:40:00`,arrive:`${i}T23:15:00`,flight:"835"}],d?[{from:t,to:"YYZ",depart:`${r}T07:10:00`,arrive:`${r}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${r}T12:00:00`,arrive:`${r}T16:00:00`,flight:"838"},{from:"MUC",to:a,depart:`${r}T17:20:00`,arrive:`${r}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"SAR"}}]}function me(e,a={}){const t=document.getElementById("aviaframe-results"),i=e.map(ia).map((n,l)=>({...n,id:n.offer.offer_id||`offer_${l}`,airlineLogo:Ye(n.carrierCode)})),r={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set,visibleCount:20},d=n=>r.quickFilter==="nonstop"?n.filter(l=>l.stops===0):r.quickFilter==="one_stop"?n.filter(l=>l.stops===1):r.quickFilter==="baggage"?n.filter(l=>l.with_baggage===!0):n,o=n=>{if(!n.length)return{count:0,minPrice:null,currency:null};const l=n.reduce((v,E)=>E.priceTotal<v.priceTotal?E:v,n[0]);return{count:n.length,minPrice:l.priceTotal,currency:l.priceCurrency||"SAR"}},p=()=>({all:o(i),nonstop:o(i.filter(n=>n.stops===0)),one_stop:o(i.filter(n=>n.stops===1)),baggage:o(i.filter(n=>n.with_baggage===!0))}),y=()=>{const n=d(i),l=new Map;return n.forEach(v=>{const E=v.carrierCode||"NA";if(!l.has(E))l.set(E,{code:E,name:v.airlineName||E,logo:v.airlineLogo,count:1,minPrice:v.priceTotal,currency:v.priceCurrency||"SAR"});else{const x=l.get(E);x.count+=1,v.priceTotal<x.minPrice&&(x.minPrice=v.priceTotal,x.currency=v.priceCurrency||x.currency)}}),Array.from(l.values()).sort((v,E)=>v.minPrice-E.minPrice)},f=n=>`
      <div class="aviaframe-details-panel">
        ${n.segments.length?n.segments.map(l=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${g(l.origin)} → ${g(l.destination)}</div>
            <div class="aviaframe-detail-meta">${g(l.departure)} → ${g(l.arrival)}</div>
            <div class="aviaframe-detail-meta">${g(l.airline)} • flight ${g(l.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${g(n.route)}</div>
            <div class="aviaframe-detail-meta">${g(n.depart)} → ${g(n.arrive)}</div>
          </div>
        `}
      </div>
    `,b=(n,l="")=>`
      <article class="aviaframe-flight-card ${l}" data-offer-id="${g(n.id)}">
        <div class="aviaframe-flight-main">
          <div class="aviaframe-segment">
            <div>
              <div class="aviaframe-airline-header">
                ${n.airlineLogo?`<img class="aviaframe-airline-logo" src="${n.airlineLogo}" alt="${g(n.airlineName)}" onerror="this.style.display='none'">`:""}
                <div class="aviaframe-airline">${g(n.airlineName)}</div>
              </div>
              <div class="aviaframe-class">Economy class</div>
            </div>
            <div>
              <div class="aviaframe-time">${g(n.depart)} - ${g(n.arrive)}</div>
              <div class="aviaframe-duration">${g(pe(n.durationMinutes))} total travel time</div>
            </div>
            <div>
              <div class="aviaframe-route">${g(n.route)}</div>
              <div class="aviaframe-transfer">${g(n.stopsText)}</div>
            </div>
          </div>
          ${n.hasReturnData?`
            <div class="aviaframe-segment">
              <div>
                <div class="aviaframe-airline-header">
                  ${n.airlineLogo?`<img class="aviaframe-airline-logo" src="${n.airlineLogo}" alt="${g(n.airlineName)}" onerror="this.style.display='none'">`:""}
                  <div class="aviaframe-airline">${g(n.airlineName)}</div>
                </div>
                <div class="aviaframe-class">Economy class</div>
              </div>
              <div>
                <div class="aviaframe-time">${g(n.returnDepart)} - ${g(n.returnArrive)}</div>
                <div class="aviaframe-duration">${g(pe(n.returnDurationMinutes||n.durationMinutes))} total travel time</div>
              </div>
              <div>
                <div class="aviaframe-route">${g(n.returnRoute)}</div>
                <div class="aviaframe-transfer">${g(n.stopsText)}</div>
              </div>
            </div>
          `:""}
          <div class="aviaframe-card-actions">
            <button type="button" class="aviaframe-details-toggle" data-details-id="${g(n.id)}">
              ${r.expandedIds.has(n.id)?"Hide details":"Details"}
            </button>
          </div>
          ${r.expandedIds.has(n.id)?f(n):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${g(n.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${W(n.priceTotal,n.priceCurrency)}</div>
          <button class="aviaframe-select-button" data-select-id="${g(n.id)}">Select</button>
        </aside>
      </article>
    `,w=()=>{let n=d(i);return r.selectedAirlines.size&&(n=n.filter(l=>r.selectedAirlines.has(l.carrierCode))),n=[...n],r.sort==="airline"?n.sort((l,v)=>l.airlineName.localeCompare(v.airlineName)):r.sort==="fastest"?n.sort((l,v)=>l.durationMinutes-v.durationMinutes):n.sort((l,v)=>l.priceTotal-v.priceTotal),n},c=(n,l,v)=>`
      <button type="button" class="aviaframe-quick-item ${r.quickFilter===n?"active":""}" data-quick="${n}">
        <div class="aviaframe-quick-title">${l}</div>
        <div class="aviaframe-quick-meta">${v.count} flights${v.minPrice!==null?` · from ${W(v.minPrice,v.currency||"SAR")}`:""}</div>
      </button>
    `,s=n=>n.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${n.map(l=>`
              <button type="button" class="aviaframe-airline-card ${r.selectedAirlines.has(l.code)?"active":""}" data-airline="${g(l.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${l.logo?`<img class="aviaframe-airline-logo-big" src="${l.logo}" alt="${g(l.name)}" onerror="this.style.display='none'">`:`<span>${g(l.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${g(l.name)}</div>
                <div class="aviaframe-airline-card-price">from ${W(l.minPrice,l.currency||"SAR")}</div>
                <div class="aviaframe-airline-card-count">${l.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",L=`
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
    `;t.innerHTML=L;const u=document.getElementById("aviaframe-cards-container"),m=document.getElementById("aviaframe-selected-flight"),A=document.getElementById("aviaframe-quick-grid"),T=document.getElementById("aviaframe-airline-filter-wrap"),h=()=>{const n=p();A.innerHTML=[c("all",C("filter_all"),n.all),c("nonstop",C("filter_nonstop"),n.nonstop),c("one_stop",C("filter_one_stop"),n.one_stop),c("baggage",C("filter_with_baggage"),n.baggage)].join("");const l=y();T.innerHTML=s(l);const v=w(),E=r.selectedId?v.find(_=>_.id===r.selectedId):null;m.innerHTML=E?`<div class="aviaframe-selected-title">Selected flight</div>${b(E,"selected")}`:"";const x=v.filter(_=>_.id!==r.selectedId),I=x.slice(0,r.visibleCount),S=x.length>r.visibleCount,$=(D||"en")==="ar"?"المزيد":"More";u.innerHTML=x.length?I.map(_=>b(_)).join("")+(S?`<div class="aviaframe-more-wrap"><button type="button" class="aviaframe-more-btn" id="aviaframe-more-btn">${$}</button></div>`:""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',t.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(_=>{_.addEventListener("click",()=>{const R=_.getAttribute("data-select-id"),N=i.find(V=>V.id===R);N&&(r.selectedId=R,le(N.offer))})}),t.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(_=>{_.addEventListener("click",()=>{const R=_.getAttribute("data-details-id");r.expandedIds.has(R)?r.expandedIds.delete(R):r.expandedIds.add(R),h()})}),t.querySelectorAll("[data-quick]").forEach(_=>{_.addEventListener("click",()=>{r.quickFilter=_.getAttribute("data-quick"),r.visibleCount=20,h()})}),t.querySelectorAll("[data-airline]").forEach(_=>{_.addEventListener("click",()=>{const R=_.getAttribute("data-airline");r.selectedAirlines.has(R)?r.selectedAirlines.delete(R):r.selectedAirlines.add(R),r.visibleCount=20,h()})});const k=u.querySelector("#aviaframe-more-btn");k&&k.addEventListener("click",()=>{r.visibleCount+=20,h()})};t.querySelectorAll("[data-sort]").forEach(n=>{n.addEventListener("click",()=>{r.sort=n.getAttribute("data-sort"),r.visibleCount=20,t.querySelectorAll("[data-sort]").forEach(l=>l.classList.remove("active")),t.querySelectorAll(`[data-sort="${r.sort}"]`).forEach(l=>l.classList.add("active")),h()})}),h(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}const ue={en:["January","February","March","April","May","June","July","August","September","October","November","December"],ar:["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]},fe={en:["Su","Mo","Tu","We","Th","Fr","Sa"],ar:["ح","ن","ث","ر","خ","ج","س"]},ge=[];function Q(){const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function oa(e){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return"";const[a,t,i]=e.split("-");return`${i}/${t}/${a}`}function sa(e){const a=document.createElement("div");a.className="wdp-wrapper",e.parentNode.insertBefore(a,e.nextSibling),e.style.display="none";const t=document.createElement("div");t.className="aviaframe-input wdp-trigger",t.setAttribute("tabindex","0"),t.setAttribute("role","button"),t.setAttribute("aria-haspopup","true"),t.innerHTML='<span class="wdp-display wdp-empty"></span><span class="wdp-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>',a.appendChild(t);const i=document.createElement("div");i.className="wdp-popup",i.style.display="none",i.innerHTML='<div class="wdp-header"><button class="wdp-nav wdp-prev" type="button">&#8249;</button><span class="wdp-month-label"></span><button class="wdp-nav wdp-next" type="button">&#8250;</button></div><div class="wdp-days-hdr"></div><div class="wdp-grid"></div>',a.appendChild(i);let r=!1,d,o;function p(){return D||"en"}function y(){const u=e.value;if(u&&/^\d{4}-\d{2}-\d{2}$/.test(u)){const[m,A]=u.split("-").map(Number);d=m,o=A-1}else{const m=e.getAttribute("min"),A=m&&/^\d{4}-\d{2}-\d{2}$/.test(m)?m:Q(),[T,h]=A.split("-").map(Number);d=T,o=h-1}}function f(){const u=t.querySelector(".wdp-display"),m=oa(e.value);m?(u.textContent=m,u.classList.remove("wdp-empty")):(u.textContent="DD/MM/YYYY",u.classList.add("wdp-empty"))}function b(){const u=p(),m=ue[u]||ue.en,A=fe[u]||fe.en;i.querySelector(".wdp-month-label").textContent=`${m[o]} ${d}`;const T=i.querySelector(".wdp-days-hdr");T.innerHTML=A.map(S=>`<span class="wdp-dh">${S}</span>`).join("");const h=i.querySelector(".wdp-grid");h.innerHTML="";const n=new Date(d,o,1).getDay(),l=new Date(d,o+1,0).getDate(),v=e.getAttribute("min")||Q(),E=e.getAttribute("max")||"",x=e.value||"",I=Q();for(let S=0;S<n;S++){const $=document.createElement("span");h.appendChild($)}for(let S=1;S<=l;S++){const $=`${d}-${String(o+1).padStart(2,"0")}-${String(S).padStart(2,"0")}`,k=document.createElement("button");k.type="button",k.textContent=S,k.className="wdp-day",$===x&&k.classList.add("wdp-day-selected"),$===I&&k.classList.add("wdp-day-today"),v&&$<v||E&&$>E?(k.disabled=!0,k.classList.add("wdp-day-disabled")):k.addEventListener("click",()=>{e.value=$,e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("input",{bubbles:!0})),f(),c()}),h.appendChild(k)}}function w(){y(),b(),i.style.display="block",r=!0,setTimeout(()=>document.addEventListener("click",s),0)}function c(){i.style.display="none",r=!1,document.removeEventListener("click",s)}function s(u){a.contains(u.target)||c()}return t.addEventListener("click",()=>{r?c():w()}),t.addEventListener("keydown",u=>{(u.key==="Enter"||u.key===" ")&&(u.preventDefault(),r?c():w()),u.key==="Escape"&&c()}),i.querySelector(".wdp-prev").addEventListener("click",u=>{u.stopPropagation(),o--,o<0&&(o=11,d--),b()}),i.querySelector(".wdp-next").addEventListener("click",u=>{u.stopPropagation(),o++,o>11&&(o=0,d++),b()}),e.classList.add.bind(e.classList),new MutationObserver(()=>{t.classList.toggle("aviaframe-input-invalid",e.classList.contains("aviaframe-input-invalid"))}).observe(e,{attributes:!0,attributeFilter:["class"]}),e.addEventListener("change",f),f(),{refresh(){f(),r&&b()}}}function la(e){e.querySelectorAll('input[type="date"]').forEach(a=>{const t=sa(a);ge.push(t)})}function da(){ge.forEach(e=>e.refresh())}function ee(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const a=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";M.checkoutUrl=e.dataset.disableCheckoutRedirect==="true"?null:e.dataset.checkoutUrl||"/booking";const t=document.createElement("style");t.textContent=Ue,document.head.appendChild(t),e.className="aviaframe-widget",e.innerHTML=Oe(),setTimeout(()=>{He(),la(e),j(D),K("aviaframe-origin","aviaframe-origin-autocomplete",a),K("aviaframe-destination","aviaframe-destination-autocomplete",a),K("aviaframe-origin-2","aviaframe-origin-2-autocomplete",a),K("aviaframe-destination-2","aviaframe-destination-2-autocomplete",a),je(a);const i=document.getElementById("aviaframe-lang-btn");i&&i.addEventListener("click",()=>j(D==="en"?"ar":"en"))},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ee):ee(),window.AviaframeWidget={init:ee,setLang:j,openPassengerStep:le},window.__aviaLangToggle=()=>j(D==="en"?"ar":"en")})()})()})();
