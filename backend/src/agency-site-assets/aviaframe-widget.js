(function(){"use strict";const Ce=`
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
`;(function(){(function(){const G={checkoutUrl:null,widgetSessionToken:null,widgetSessionTokenExpiresAt:0,widgetSessionPromise:null},V={en:{title:"Flight Search",trip_return:"Return",trip_oneway:"One-way",trip_multi:"Multi-city",cabin_economy:"Economy",cabin_premium:"Premium Economy",cabin_business:"Business",cabin_first:"First Class",cabin_mixed:"Apply mixed classes",passenger_singular:"Passenger",passenger_plural:"Passengers",pax_adults:"Adults",pax_adults_sub:"Over 11",pax_children:"Children",pax_children_sub:"2–11",pax_infants:"Infants",pax_infants_sub:"Under 2",pax_cabin_bags:"Cabin baggage",pax_checked_bags:"Checked baggage",from_label:"From",to_label:"To",depart_date:"Departure Date",return_date:"Return Date",from_2:"From (2nd segment)",to_2:"To (2nd segment)",depart_date_2:"Departure Date (2nd segment)",search_btn:"Search Flights",error_title:"Error",error_select_airports:"Please select airports from the dropdown.",error_select_depart_date:"Please select departure date.",error_select_return_date:"Please select a return date or switch to one-way.",error_search_invalid:"Please check your route, dates and passenger details, then try again.",error_return_before_depart:"Return date must be the same as or later than the departure date. Please update your travel dates.",error_return_before_depart_inline:"Return date must be after departure.",error_multicity_missing:"For Multi-city please fill second segment: From, To and Date.",error_multicity_before_first:"The second segment date must be the same as or later than the first departure date.",error_multicity_before_first_inline:"Second segment date must be after first departure.",searching_flights:"Searching for flights...",searching_routes:"Finding the best routes",searching_fares:"Checking current fares",searching_options:"Preparing your best options",no_results_title:"No flights found",no_results_body:"Try adjusting your search criteria.",filter_all:"All",filter_nonstop:"Non-stop",filter_one_stop:"1 stop",filter_with_baggage:"With baggage",badge_no_checked_bag:"No checked bag",badge_checked_bag_included:"1 checked bag included",badge_checked_bags_included:"{count} checked bags included",sandbox_no_results_title:"No sandbox offers for this route or date",sandbox_no_results_body:"DRCT sandbox inventory is limited and does not mirror full live availability. Try another route or date, or use the production domain for live search results."},ar:{title:"البحث عن رحلات",trip_return:"ذهاب وإياب",trip_oneway:"ذهاب فقط",trip_multi:"متعدد المدن",cabin_economy:"الاقتصادية",cabin_premium:"الاقتصادية المميزة",cabin_business:"رجال الأعمال",cabin_first:"الدرجة الأولى",cabin_mixed:"تطبيق درجات مختلطة",passenger_singular:"مسافر",passenger_plural:"مسافرون",pax_adults:"البالغون",pax_adults_sub:"أكبر من 11",pax_children:"الأطفال",pax_children_sub:"2–11",pax_infants:"الرضّع",pax_infants_sub:"أقل من 2",pax_cabin_bags:"أمتعة المقصورة",pax_checked_bags:"الأمتعة المسجّلة",from_label:"من",to_label:"إلى",depart_date:"تاريخ المغادرة",return_date:"تاريخ العودة",from_2:"من (المقطع الثاني)",to_2:"إلى (المقطع الثاني)",depart_date_2:"تاريخ المغادرة (المقطع الثاني)",search_btn:"البحث عن رحلات",error_title:"خطأ",error_select_airports:"يرجى اختيار المطارات من القائمة المنسدلة.",error_select_depart_date:"يرجى اختيار تاريخ المغادرة.",error_select_return_date:"يرجى اختيار تاريخ العودة أو التبديل إلى رحلة ذهاب فقط.",error_search_invalid:"يرجى التحقق من المسار والتواريخ وبيانات المسافرين ثم المحاولة مرة أخرى.",error_return_before_depart:"يجب أن يكون تاريخ العودة في نفس يوم المغادرة أو بعده. يرجى تعديل تواريخ السفر.",error_return_before_depart_inline:"يجب أن يكون تاريخ العودة بعد المغادرة.",error_multicity_missing:"للرحلات متعددة المدن، يرجى استكمال المقطع الثاني: من وإلى والتاريخ.",error_multicity_before_first:"يجب أن يكون تاريخ المقطع الثاني في نفس يوم المقطع الأول أو بعده.",error_multicity_before_first_inline:"يجب أن يكون تاريخ المقطع الثاني بعد الأول.",searching_flights:"جارٍ البحث عن الرحلات...",searching_routes:"جارٍ البحث عن أفضل المسارات",searching_fares:"جارٍ التحقق من الأسعار الحالية",searching_options:"جارٍ تجهيز أفضل الخيارات",no_results_title:"لم يتم العثور على رحلات",no_results_body:"يرجى تعديل معايير البحث والمحاولة مرة أخرى.",filter_all:"الكل",filter_nonstop:"مباشر",filter_one_stop:"توقف واحد",filter_with_baggage:"مع الأمتعة",badge_no_checked_bag:"بدون أمتعة مسجلة",badge_checked_bag_included:"حقيبة مسجلة واحدة مشمولة",badge_checked_bags_included:"{count} حقائب مسجلة مشمولة",sandbox_no_results_title:"لا توجد عروض sandbox لهذا المسار أو التاريخ",sandbox_no_results_body:"مخزون DRCT في بيئة sandbox محدود ولا يعكس التوفر الكامل في البيئة الحية. جرّب مساراً أو تاريخاً آخر، أو استخدم نطاق الإنتاج لرؤية النتائج الحية."}};let O=(()=>{try{return localStorage.getItem("aviaframe-widget-lang")||"en"}catch{return"en"}})();function re(e,a){if(a=a||document.getElementById("aviaframe-widget"),!a)return;O=e;try{localStorage.setItem("aviaframe-widget-lang",e)}catch{}const t=V[e]||V.en;a.setAttribute("dir",e==="ar"?"rtl":"ltr"),a.setAttribute("lang",e==="ar"?"ar":"en"),_a(),a.querySelectorAll("[data-wi18n]").forEach(c=>{const s=c.getAttribute("data-wi18n");t[s]!==void 0&&(c.textContent=t[s])});const i=a.querySelector("#aviaframe-trip-type"),r=a.querySelector("#aviaframe-trip-label");if(i&&r){const c=i.value;r.textContent=c==="one_way"?t.trip_oneway:c==="multi_city"?t.trip_multi:t.trip_return}const l=a.querySelector("#aviaframe-cabin"),n=a.querySelector("#aviaframe-cabin-label");if(l&&n){const c={economy:t.cabin_economy,premium_economy:t.cabin_premium,business:t.cabin_business,first:t.cabin_first};n.textContent=c[l.value]||t.cabin_economy}const p=parseInt(a.querySelector("#aviaframe-adults")?.value||"1"),y=parseInt(a.querySelector("#aviaframe-children")?.value||"0"),m=parseInt(a.querySelector("#aviaframe-infants")?.value||"0"),b=p+y+m,w=a.querySelector("#aviaframe-passengers-label");w&&(w.textContent=`${b} ${b===1?t.passenger_singular:t.passenger_plural}`),a.querySelectorAll("#aviaframe-lang-btn .wlt-opt").forEach(c=>c.classList.toggle("wlt-active",c.getAttribute("data-wl")===e)),a.querySelector("#aviaframe-search-form")&&Z(a)}function B(e){const a=V[O]||V.en;return a[e]!==void 0?a[e]:V.en[e]!==void 0?V.en[e]:e}function Te(e,a={}){return Object.entries(a).reduce((t,[i,r])=>String(t).replaceAll(`{${i}}`,String(r)),B(e))}function ie(e,a){e&&(e.classList.remove("aviaframe-input-invalid"),e.removeAttribute("aria-invalid")),a&&(a.textContent="",a.classList.remove("visible"))}function fe(e){document.querySelectorAll(".aviaframe-validation-popup").forEach(a=>a.remove()),document.querySelectorAll(".aviaframe-input-invalid").forEach(a=>{a.classList.remove("aviaframe-input-invalid"),a.removeAttribute("aria-invalid")})}function ee(e,a){if(!e)return;fe(),e.classList.add("aviaframe-input-invalid"),e.setAttribute("aria-invalid","true");const t=document.createElement("div");t.className="aviaframe-validation-popup",t.setAttribute("role","alert"),t.textContent=a,(e.closest(".aviaframe-field")||e.parentElement).appendChild(t),e.focus()}function Ie(e){e=e||document;const a=e.querySelector("#aviaframe-depart-date"),t=e.querySelector("#aviaframe-return-date"),i=e.querySelector("#aviaframe-depart-date-2");if(t&&a){const r=a.value||a.getAttribute("min")||"";r?t.setAttribute("min",r):t.removeAttribute("min")}if(i&&a){const r=a.value||a.getAttribute("min")||"";r?i.setAttribute("min",r):i.removeAttribute("min")}}function Z(e){e=e||document;const a=e.querySelector("#aviaframe-trip-type")?.value||"return",t=e.querySelector("#aviaframe-depart-date"),i=e.querySelector("#aviaframe-return-date"),r=e.querySelector("#aviaframe-depart-date-2"),l=e.querySelector("#aviaframe-return-date-error"),n=e.querySelector("#aviaframe-depart-date-2-error");return Ie(e),ie(i,l),ie(r,n),a==="return"&&t&&i&&t.value&&i.value&&i.value<t.value?(ie(i,l),{valid:!1,input:i,message:B("error_return_before_depart")}):a==="multi_city"&&t&&r&&t.value&&r.value&&r.value<t.value?(ie(r,n),{valid:!1,input:r,message:B("error_multicity_before_first")}):{valid:!0,input:null,message:""}}const Re=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1},{code:"LTN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Luton",priority:3},{code:"STN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Stansted",priority:4},{code:"LCY",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"City Airport",priority:5},{code:"LIN",city:"Milan",cityRu:"Милан",country:"Italy",name:"Linate",priority:3},{code:"BGY",city:"Milan",cityRu:"Милан",country:"Italy",name:"Bergamo",priority:4},{code:"PMF",city:"Milan",cityRu:"Милан",country:"Italy",name:"Parma",priority:5},{code:"IMR",city:"Milan",cityRu:"Милан",country:"Italy",name:"Rogoredo Railway Station",priority:6},{code:"SVO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Sheremetyevo",priority:1},{code:"DME",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Domodedovo",priority:2},{code:"VKO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Vnukovo",priority:3},{code:"ZIA",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Zhukovsky",priority:4},{code:"LED",city:"Saint Petersburg",cityRu:"Санкт-Петербург",country:"Russia",name:"Pulkovo",priority:1},{code:"ALA",city:"Almaty",cityRu:"Алматы",country:"Kazakhstan",name:"Almaty International",priority:1},{code:"TAS",city:"Tashkent",cityRu:"Ташкент",country:"Uzbekistan",name:"Tashkent International",priority:1}],Le="aviaframe_ac_v4:",De=1440*60*1e3,Ne=3500,de={London:"LON",Milan:"MIL",Moscow:"MOW","Saint Petersburg":"SPT","New York":"NYC",Dubai:"DXB",Istanbul:"IST",Brussels:"BRU",Tokyo:"TYO"},Be={"United Kingdom":"GB",France:"FR",Germany:"DE",Netherlands:"NL",Spain:"ES",Italy:"IT",Belgium:"BE",Austria:"AT",Switzerland:"CH",Denmark:"DK",Norway:"NO",Sweden:"SE",Finland:"FI",Ireland:"IE",Portugal:"PT",Greece:"GR",Turkey:"TR",Ukraine:"UA",Poland:"PL","Czech Republic":"CZ",Hungary:"HU",UAE:"AE",Qatar:"QA",Bahrain:"BH","Saudi Arabia":"SA",Thailand:"TH",Singapore:"SG","Hong Kong":"HK",Japan:"JP","South Korea":"KR",India:"IN",USA:"US",Canada:"CA",Mexico:"MX",Russia:"RU",Kazakhstan:"KZ",Uzbekistan:"UZ"};function me(e){return Be[e]||String(e||"").slice(0,2).toUpperCase()}function ge(e){return String(e||"").replace(/\/+$/,"")}function X(e){return String(e||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function Me(e){const a=ge(e),t=[];return a&&(t.push(a),/\/search$/i.test(a)||t.push(`${a}/search`),a.includes("/api/drct/")?t.push(a.replace("/api/drct/","/api/n8n/webhook-test/drct/")):/\/api\/drct$/i.test(a)&&t.push(a.replace("/api/drct","/api/n8n/webhook-test/drct"))),[...new Set(t.filter(Boolean))]}function qe(e){const a=ge(e),t=new Set,i=r=>{r&&t.add(r)};if(a){/\/search$/i.test(a)&&i(a.replace(/\/search$/i,"/airports/autocomplete")),i(`${a}/airports/autocomplete`);const r=a.match(/^(https?:\/\/[^/]+)/i);r&&i(`${r[1]}/public/airports/autocomplete`)}return typeof window<"u"&&window.location&&i(`${window.location.origin}/public/airports/autocomplete`),[...t]}function ze(e,a){return`${Le}${String(a).toLowerCase()}:${String(e||"").trim().toLowerCase()}`}function Oe(e){try{const a=localStorage.getItem(e);if(!a)return null;const t=JSON.parse(a);return!t||!t.cachedAt||Date.now()-t.cachedAt>De?(localStorage.removeItem(e),null):t.payload||null}catch{return null}}function Pe(e){return!!(e&&e.source!=="fallback"&&Array.isArray(e.groups)&&e.groups.some(a=>Array.isArray(a.items)&&a.items.length>0))}function ve(e,a){if(Pe(a))try{localStorage.setItem(e,JSON.stringify({cachedAt:Date.now(),payload:a}))}catch{}}function Fe(e,a){const t=X(a),i=X(e.code),r=X(e.city),l=X(e.cityRu),n=X(e.name),p=X(e.country),y=X(de[e.city]||""),m=[i,r,l,n,p,y].filter(Boolean);if(!m.some(w=>w.includes(t)))return 0;let b=0;return(i===t||y===t)&&(b+=1600),(r===t||l===t)&&(b+=1500),n===t&&(b+=1400),p===t&&(b+=1200),(i.startsWith(t)||y.startsWith(t))&&(b+=1e3),(r.startsWith(t)||l.startsWith(t))&&(b+=950),n.startsWith(t)&&(b+=900),p.startsWith(t)&&(b+=500),r.split(/[\s-]+/).some(w=>w.startsWith(t))&&(b+=220),n.split(/[\s-]+/).some(w=>w.startsWith(t))&&(b+=180),m.some(w=>w.includes(t))&&(b+=120),b-(e.priority||999)}function Ue(e,a=12){const t=X(e);if(t.length<1)return[];const i=Re.map(n=>({airport:n,score:Fe(n,t)})).filter(n=>n.score>0).sort((n,p)=>p.score-n.score||(n.airport.priority||999)-(p.airport.priority||999)||n.airport.city.localeCompare(p.airport.city)||n.airport.name.localeCompare(p.airport.name)).slice(0,Math.max(a*4,20)),r=new Map;for(const{airport:n,score:p}of i){const y=`${n.country}:${n.city}`;r.has(y)||r.set(y,{country_code:me(n.country),country_name:n.country,city_code:de[n.city]||n.code,city_name:n.city,airports:[],bestScore:0}),r.get(y).bestScore=Math.max(r.get(y).bestScore,p),r.get(y).airports.push({type:"airport",code:n.code,name:n.name,city_code:de[n.city]||n.code,city_name:n.city,country_code:me(n.country),country_name:n.country,priority:n.priority,score:p})}const l=new Map;for(const n of r.values()){const p=`${n.country_code}:${n.country_name}`;l.has(p)||l.set(p,{country_code:n.country_code,country_name:n.country_name,items:[],bestScore:0}),l.get(p).bestScore=Math.max(l.get(p).bestScore,n.bestScore);const y=n.airports.slice().sort((m,b)=>b.score-m.score||(m.priority||999)-(b.priority||999)||m.name.localeCompare(b.name)).map(m=>({type:"airport",code:m.code,name:m.name,city_code:m.city_code,city_name:m.city_name,country_code:m.country_code,country_name:m.country_name,score:m.score}));y.length>1?l.get(p).items.push({type:"city",code:n.city_code,name:n.city_name,city_code:n.city_code,city_name:n.city_name,country_code:n.country_code,country_name:n.country_name,airport_count:y.length,airports:y,score:n.bestScore}):y[0]&&l.get(p).items.push(y[0])}return Array.from(l.values()).sort((n,p)=>p.bestScore-n.bestScore||n.country_name.localeCompare(p.country_name)).map(n=>({...n,items:n.items.sort((p,y)=>(y.score||0)-(p.score||0)||(p.priority||999)-(y.priority||999)||String(p.city_name||p.name||"").localeCompare(String(y.city_name||y.name||"")))})).filter(n=>n.items.length>0)}function He(e,a=12){return Ue(e,a)}async function je(e,a){const t=O==="ar"?"ar":"en",i=ze(e,t),r=Oe(i);if(r)return r;const l=qe(a),n=`q=${encodeURIComponent(e)}&locale=${encodeURIComponent(t)}&limit=12`;for(const y of l){const m=new AbortController,b=setTimeout(()=>m.abort(),Ne);try{const w=await fetch(`${y}?${n}`,{method:"GET",headers:{Accept:"application/json"},signal:m.signal});if(clearTimeout(b),!w.ok){if(w.status===404)continue;throw new Error(`autocomplete ${w.status}`)}const c=await w.json();if(c&&Array.isArray(c.groups)&&c.groups.some(s=>Array.isArray(s.items)&&s.items.length>0)){const s={...c,cached:!1};return ve(i,s),s}}catch{clearTimeout(b)}}const p={query:e,locale:t,source:"fallback",groups:He(e,12),cached:!1};return ve(i,p),p}function Ye(e){const a=[],t=[];return(e.groups||[]).forEach(i=>{t.push(`<div class="aviaframe-autocomplete-group"><div class="aviaframe-autocomplete-group-header">${g(i.country_name)} (${g(i.country_code)})</div>${(i.items||[]).map(r=>{if(r.type==="city"){const n=(r.airports||[]).map(m=>String(m.code||"").trim()).filter(Boolean).join(","),p=a.length;a.push({label:`${r.city_name} (${r.code})`,code:r.code,airports:n,cityName:r.city_name});const y=(r.airports||[]).map(m=>{const b=a.length;return a.push({label:`${m.city_name} (${m.code})`,code:m.code,airports:"",cityName:m.city_name}),`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-child" data-index="${b}"><div><span class="aviaframe-airport-code">${g(m.code)}</span><span class="aviaframe-airport-city">${g(m.city_name)}</span></div><span class="aviaframe-airport-name">${g(m.name)}</span></div>`}).join("");return`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-parent" data-index="${p}"><div><span class="aviaframe-airport-code">${g(r.code)}</span><span class="aviaframe-airport-city">${g(r.city_name)}</span></div><span class="aviaframe-airport-name">All airports${r.airport_count?` · ${g(String(r.airport_count))}`:""}</span></div>${y}`}const l=a.length;return a.push({label:`${r.city_name||r.name} (${r.code})`,code:r.code,airports:"",cityName:r.city_name||r.name}),`<div class="aviaframe-autocomplete-item" data-index="${l}"><div><span class="aviaframe-airport-code">${g(r.code)}</span><span class="aviaframe-airport-city">${g(r.city_name||r.name)}</span></div><span class="aviaframe-airport-name">${g(r.name)}, ${g(r.country_name)}</span></div>`}).join("")} </div>`)}),{html:t.join(""),items:a}}function ye(e,a,t){t&&(e.value=t.label,e.dataset.code=t.code||"",e.dataset.airports=t.airports||"",e.dataset.cityName=t.cityName||"",a.style.display="none")}function Ve(e){delete e.dataset.code,delete e.dataset.airports,delete e.dataset.cityName}function Ge(e){const a=new Date(e),t=a.getFullYear(),i=String(a.getMonth()+1).padStart(2,"0"),r=String(a.getDate()).padStart(2,"0");return`${t}-${i}-${r}`}function We(){return Ge(new Date)}function ce(){return typeof window>"u"?{}:window.AVIAFRAME_RUNTIME_CONFIG||window.__AVIAFRAME_SITE_CONFIG__||{}}function Ke(){if(typeof window>"u")return!1;const e=String(window.location.hostname||"").toLowerCase();return e==="localhost"||e==="127.0.0.1"}function Je(){return!!ce().allowDemoSearchFallback||Ke()}function be(){const e=ce();return typeof e.searchIsSandbox=="boolean"?e.searchIsSandbox:/sandbox/i.test(String(e.environment||""))}function Ze(){const e=be()?B("sandbox_no_results_title"):B("no_results_title"),a=be()?B("sandbox_no_results_body"):B("no_results_body");return`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${e}</div>
              <div>${a}</div>
            </div>
          `}const Xe=`${Ce}
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
    .aviaframe-passenger-autofill { align-items: center; background: color-mix(in srgb, var(--af-widget-primary) 8%, white); border: 1px solid color-mix(in srgb, var(--af-widget-primary) 24%, white); border-radius: var(--af-widget-radius); display: flex; flex-wrap: wrap; gap: 12px; grid-column: 1 / -1; justify-content: space-between; margin-top: 4px; padding: 12px 16px; }
    .aviaframe-passenger-autofill-message { color: var(--af-widget-primary); font-size: 13px; }
    .aviaframe-passenger-autofill-undo { background: transparent; border: 1px solid color-mix(in srgb, var(--af-widget-primary) 30%, white); border-radius: var(--af-radius-sm, 8px); color: var(--af-widget-primary); cursor: pointer; flex-shrink: 0; font: 600 12px/1 var(--af-widget-font); padding: 6px 10px; }
    .aviaframe-passenger-autofill-undo:disabled { cursor: default; opacity: 0.55; }
    .aviaframe-passenger-autofill-row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
    .aviaframe-passenger-autofill-code-input { background: var(--af-widget-surface); border: 1px solid var(--af-widget-border); border-radius: var(--af-radius-sm, 8px); color: var(--af-widget-text); font: 600 14px/1 var(--af-widget-font); letter-spacing: 2px; min-height: 36px; padding: 6px 10px; width: 96px; }
    .aviaframe-passenger-autofill-code-input:focus { border-color: var(--af-widget-primary); outline: none; }
    .aviaframe-passenger-autofill-close { background: transparent; border: 0; color: var(--af-widget-muted); cursor: pointer; flex-shrink: 0; font: 600 16px/1 var(--af-widget-font); padding: 2px 4px; }
    .aviaframe-passenger-autofill-error { color: var(--af-widget-danger); flex-basis: 100%; font-size: 12px; }

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
  `;function Qe(){const e=We();return`
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
    `}function ea(){var e;const a=Array.from(document.querySelectorAll(".aviaframe-dropdown")),t=()=>a.forEach(u=>u.classList.remove("open"));a.forEach(u=>{const $=u.querySelector(".aviaframe-dropdown-btn");$&&$.addEventListener("click",R=>{R.stopPropagation();const _=u.classList.contains("open");t(),_||u.classList.add("open")})}),document.addEventListener("click",u=>{u.target.closest(".aviaframe-dropdown")||t()});const i=document.getElementById("aviaframe-trip-type"),r=document.getElementById("aviaframe-trip-label"),l=(e=document.getElementById("aviaframe-return-date"))==null?void 0:e.closest(".aviaframe-field"),n=document.getElementById("aviaframe-multi-city-fields"),p=document.getElementById("aviaframe-depart-date"),y=document.getElementById("aviaframe-return-date"),m=document.getElementById("aviaframe-depart-date-2");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(u=>{u.addEventListener("change",()=>{u.checked&&(i.value=u.value,r.textContent=u.value==="one_way"?(V[O]||V.en).trip_oneway:u.value==="multi_city"?(V[O]||V.en).trip_multi:(V[O]||V.en).trip_return,u.value==="one_way"?(l&&(l.style.display="none"),n&&(n.style.display="none")):u.value==="multi_city"?(l&&(l.style.display="none"),n&&(n.style.display="block")):(l&&(l.style.display="block"),n&&(n.style.display="none"))),Z(document)})}),p&&p.addEventListener("change",()=>{Z(document)}),y&&y.addEventListener("change",()=>{Z(document)}),m&&m.addEventListener("change",()=>{Z(document)}),Z(document);const b=document.getElementById("aviaframe-cabin"),w=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(u=>{u.addEventListener("change",()=>{u.checked&&(b.value=u.value,w.textContent=u.parentElement.textContent.trim())})});const c={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},s={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},F=()=>{document.getElementById("aviaframe-adults").value=s.adults,document.getElementById("aviaframe-children").value=s.children,document.getElementById("aviaframe-infants").value=s.infants,document.getElementById("aviaframe-cabin-bags").value=s.cabinBags,document.getElementById("aviaframe-checked-bags").value=s.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(s.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(s.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${s.adults+s.children+s.infants} ${s.adults+s.children+s.infants===1?(V[O]||V.en).passenger_singular:(V[O]||V.en).passenger_plural}`},f=()=>{const u=document.getElementById("aviaframe-age-selectors");for(;s.childrenAges.length<s.children;)s.childrenAges.push(2);for(;s.childrenAges.length>s.children;)s.childrenAges.pop();for(;s.infantAges.length<s.infants;)s.infantAges.push(1);for(;s.infantAges.length>s.infants;)s.infantAges.pop();const $=s.childrenAges.map((_,o)=>`
        <div class="aviaframe-age-item">
          <label>Child ${o+1} age</label>
          <select data-age-type="child" data-age-index="${o}">
            ${Array.from({length:10},(d,h)=>h+2).map(d=>`<option value="${d}" ${d===_?"selected":""}>${d}</option>`).join("")}
          </select>
        </div>
      `).join(""),R=s.infantAges.map((_,o)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${o+1} age</label>
          <select data-age-type="infant" data-age-index="${o}">
            ${Array.from({length:2},(d,h)=>h).map(d=>`<option value="${d}" ${d===_?"selected":""}>${d}</option>`).join("")}
          </select>
        </div>
      `).join("");u.innerHTML=$+R,u.querySelectorAll("select[data-age-type]").forEach(_=>{_.addEventListener("change",()=>{const o=_.getAttribute("data-age-type"),d=Number(_.getAttribute("data-age-index")),h=Number(_.value);o==="child"?s.childrenAges[d]=h:s.infantAges[d]=h,F()})}),F()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(u=>{u.addEventListener("click",()=>{const $=u.getAttribute("data-counter"),R=Number(u.getAttribute("data-delta")),_=c[$];if(!_)return;const o=Math.max(_.min,Math.min(_.max,s[$]+R));s[$]=o;const d=document.getElementById(`aviaframe-count-${$}`);d&&(d.textContent=o),f()})}),f()}function ne(e,a,t){const i=document.getElementById(e),r=document.getElementById(a);if(!i||!r)return;let l=-1,n=[],p=null,y=0;const m=()=>{r.style.display="none",n=[],l=-1},b=()=>{r.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach((c,s)=>{s===l?(c.classList.add("active"),c.scrollIntoView({block:"nearest"})):c.classList.remove("active")})},w=()=>{n.length?(r.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach(c=>{c.addEventListener("mousedown",function(s){s.preventDefault();const F=Number(this.getAttribute("data-index")),f=n[F];ye(i,r,f)})}),r.style.display="block"):(r.innerHTML="",m())};i.addEventListener("input",function(){const c=this.value.trim();Ve(i),p&&clearTimeout(p),c.length<1&&m(),c.length<1||(r.innerHTML='<div class="aviaframe-autocomplete-empty">Searching...</div>',r.style.display="block",p=setTimeout(async()=>{const s=++y;try{const F=await je(c,t);if(s!==y)return;const f=Ye(F);n=f.items,r.innerHTML=f.html||'<div class="aviaframe-autocomplete-empty">No airports found</div>',l=-1,w()}catch{n=[],r.innerHTML='<div class="aviaframe-autocomplete-empty">No airports found</div>',r.style.display="block"}},250))}),i.addEventListener("keydown",function(c){n.length&&(c.key==="ArrowDown"?(c.preventDefault(),l=Math.min(l+1,n.length-1),b()):c.key==="ArrowUp"?(c.preventDefault(),l=Math.max(l-1,0),b()):c.key==="Enter"&&l>=0?(c.preventDefault(),ye(i,r,n[l])):c.key==="Escape"&&m())}),document.addEventListener("click",function(c){!i.contains(c.target)&&!r.contains(c.target)&&m()})}function aa(e){const a=document.getElementById("aviaframe-search-form"),t=document.getElementById("aviaframe-results");a.addEventListener("submit",async function(i){i.preventDefault(),fe();const r=document.getElementById("aviaframe-origin"),l=document.getElementById("aviaframe-destination"),n=document.getElementById("aviaframe-depart-date").value,p=document.getElementById("aviaframe-return-date").value,y=parseInt(document.getElementById("aviaframe-adults").value,10),m=parseInt(document.getElementById("aviaframe-children").value,10)||0,b=parseInt(document.getElementById("aviaframe-infants").value,10)||0,w=document.getElementById("aviaframe-trip-type").value||"return",c=document.getElementById("aviaframe-cabin").value,s=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),F=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),f=r.dataset.code,u=l.dataset.code,$=r.dataset.airports||f,R=l.dataset.airports||u;if(!f||!u){ee(f?l:r,B("error_select_airports"));return}if(!n){ee(document.getElementById("aviaframe-depart-date"),B("error_select_depart_date"));return}if(w==="return"&&!p){const S=document.getElementById("aviaframe-return-date");ee(S,B("error_select_return_date"));return}const _=Z(document);if(!_.valid){ee(_.input,_.message);return}t.innerHTML=`
        <div class="aviaframe-loading" role="status" aria-live="polite" aria-atomic="true">
          <div class="aviaframe-search-radar" aria-hidden="true">
            <span class="aviaframe-search-radar__ring"></span>
            <span class="aviaframe-search-radar__ring aviaframe-search-radar__ring--inner"></span>
            <span class="aviaframe-search-radar__beacon"></span>
          </div>
          <div class="aviaframe-loading-title">${B("searching_flights")}</div>
          <div class="aviaframe-loading-steps">
            <span class="aviaframe-loading-step">${B("searching_routes")}</span>
            <span class="aviaframe-loading-step">${B("searching_fares")}</span>
            <span class="aviaframe-loading-step">${B("searching_options")}</span>
          </div>
          <div class="aviaframe-loading-progress" aria-hidden="true"><span></span></div>
        </div>
      `;let o={origin:$,destination:R,origin_city:f,destination_city:u,depart_date:n,return_date:p||null,adults:y,children:m,infants:b,children_ages:s,infant_ages:F,cabin_class:c,trip_type:w};const d=ce(),h=document.querySelector("[data-aviaframe-widget]")||document.getElementById("aviaframe-widget");if(Object.prototype.hasOwnProperty.call(d,"searchOriginHost")?d.searchOriginHost&&(o.origin_host=d.searchOriginHost):d.siteOriginHost&&(o.origin_host=d.siteOriginHost),h?.dataset?.agencyKey&&(o.agency_key=h.dataset.agencyKey),w==="one_way"&&(o.return_date=null),w==="multi_city"){const S=document.getElementById("aviaframe-origin-2"),P=document.getElementById("aviaframe-destination-2"),L=document.getElementById("aviaframe-depart-date-2").value,C=S?.dataset.code,I=P?.dataset.code,k=S?.dataset.airports||C,U=P?.dataset.airports||I;if(!C||!I||!L){ee(C?I?document.getElementById("aviaframe-depart-date-2"):P:S,B("error_multicity_missing"));return}const J=Z(document);if(!J.valid){ee(J.input,J.message);return}o.segments=[{origin:$,destination:R,origin_city:f,destination_city:u,depart_date:n},{origin:k,destination:U,origin_city:C,destination_city:I,depart_date:L}]}try{let S=null;const P=Me(e);for(const C of P)if(S=await fetch(C,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}),S.ok||S.status!==404)break;if(!S.ok)throw S.status===422?new Error(B("error_search_invalid")):new Error(`HTTP ${S.status}: ${S.statusText}`);const L=await S.json();if(L.offers&&L.offers.length>0){const C=L.offers.map(I=>{const k={...I,_searchOrigin:I?._searchOrigin||f||null,_searchDestination:I?._searchDestination||u||null,_searchReturnDate:I?._searchReturnDate||o.return_date||null};if(!(k!=null&&k.return_origin&&k!=null&&k.return_destination||k!=null&&k.return_departure_time&&k!=null&&k.return_arrival_time)&&o.return_date){const U=sa(k);U&&Object.assign(k,U),k.return_origin||(k.return_origin=u||null),k.return_destination||(k.return_destination=f||null)}return k});ke(C)}else t.innerHTML=Ze()}catch(S){const P=String(S?.message||""),L=P.includes("HTTP 404");if(S?.name==="TypeError"||P.includes("Failed to fetch")||P.toLowerCase().includes("cors")||L){if(Je()){const C=va({...o,origin:f,destination:u});ke(C,{noticeHtml:`
                <div class="aviaframe-warning">
                  Demo mode: backend is currently not reachable from the browser (CORS/network), so test offers are shown for UI validation.
                </div>
              `}),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",S);return}t.innerHTML=`
            <div class="aviaframe-error">
              <strong>${B("error_title")}:</strong> Live search is temporarily unavailable. Please refresh and try again.
            </div>
          `;return}t.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${g(P)}
          </div>
        `}})}function ta(e){const a=String(e||"").trim().toUpperCase();return/^[A-Z0-9]{2,3}$/.test(a)?`https://pics.avs.io/200/80/${encodeURIComponent(a)}.png`:null}function he(e){const a=String(e||"").trim(),t=a.match(/^(\d{4})-(\d{2})-(\d{2})$/),i=a.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/),r=Number(t?t[1]:i?i[3]:0),l=Number(t?t[2]:i?i[2]:0),n=Number(t?t[3]:i?i[1]:0),p=new Date(Date.UTC(r,l-1,n));return!r||p.getUTCFullYear()!==r||p.getUTCMonth()!==l-1||p.getUTCDate()!==n?"":`${String(r).padStart(4,"0")}-${String(l).padStart(2,"0")}-${String(n).padStart(2,"0")}`}function ra(e){const a=he(e);if(!a)return String(e||"");const[t,i,r]=a.split("-");return`${r}.${i}.${t}`}function ia(e){const a=String(e||"").replace(/\D/g,"").slice(0,8);return[a.slice(0,2),a.slice(2,4),a.slice(4,8)].filter(Boolean).join(".")}function _e(e){const a={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,selected_at:new Date().toISOString()};localStorage.setItem("selectedOffer",JSON.stringify(a)),console.log("✅ Offer selected:",e.offer_id),window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:a},bubbles:!0}));const t=document.querySelector(".aviaframe-widget"),i=document.getElementById("aviaframe-results"),r=document.getElementById("aviaframe-search-form");if(!t){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a},bubbles:!0})),G.checkoutUrl&&(window.location.href=G.checkoutUrl);return}r&&(r.style.display="none"),i&&(i.style.display="none");const l=document.getElementById("aviaframe-passenger-step");l&&l.remove();const n=(e?.price||{}).currency||"SAR",p=oe((e?.price||{}).total||0,n),y=e.airline_name||e.airline||"Airline",m=e.origin||"---",b=e.destination||"---",w=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",c=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A",s=document.createElement("div");s.id="aviaframe-passenger-step",s.className="aviaframe-passenger-step",s.innerHTML=`
        <div class="aviaframe-passenger-summary">
          <div>
            <div class="aviaframe-passenger-eyebrow">Selected Flight</div>
            <div class="aviaframe-passenger-route">${g(m)} → ${g(b)} <span class="aviaframe-passenger-airline">${g(y)}</span></div>
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
        </form>`,t.appendChild(s),window.scrollTo({top:0,behavior:"smooth"});const F=s.querySelector("#aviaframe-passenger-back"),f=s.querySelector("#aviaframe-passenger-form"),u=s.querySelector("#aviaframe-passenger-error"),$=f&&f.querySelector('input[name="dateOfBirth"]');if($&&$.addEventListener("input",()=>{const R=ia($.value);$.value!==R&&($.value=R)}),F&&F.addEventListener("click",()=>{s.remove(),r&&(r.style.display=""),i&&(i.style.display="")}),f&&f.addEventListener("submit",R=>{R.preventDefault();const _=new FormData(f),o={firstName:String(_.get("firstName")||""),lastName:String(_.get("lastName")||""),email:String(_.get("email")||""),phone:String(_.get("phone")||""),gender:String(_.get("gender")||"male"),dateOfBirth:he(_.get("dateOfBirth")),passportNumber:String(_.get("passportNumber")||""),passportExpiry:String(_.get("passportExpiry")||"")},d=new Date,h=new Date(`${o.dateOfBirth}T00:00:00`),M=new Date(h);if(!o.dateOfBirth||Number.isNaN(h.getTime())){u&&(u.textContent=O==="ar"?"أدخل تاريخ الميلاد بالصيغة يوم.شهر.سنة.":"Enter the date of birth as DD.MM.YYYY.",u.style.display="block");return}if(M.setFullYear(M.getFullYear()+18),M>d){u&&(u.textContent=O==="ar"?"يجب أن يكون عمر المسافر 18 عامًا على الأقل.":"Passenger must be at least 18 years old.",u.style.display="block");return}const S=(e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10),P=new Date(S+"T00:00:00"),L=new Date(P);L.setMonth(L.getMonth()+6);const C=new Date(o.passportExpiry+"T00:00:00");if(!o.passportExpiry||Number.isNaN(C.getTime())||C<L){u&&(u.textContent=O==="ar"?"يجب أن يكون جواز السفر صالحاً لمدة 6 أشهر على الأقل من تاريخ الرحلة.":"Passport must be valid for at least 6 months from the trip date.",u.style.display="block");return}u&&(u.style.display="none"),localStorage.setItem("passengerData",JSON.stringify(o)),window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a,passenger:o},bubbles:!0})),G.checkoutUrl?window.location.href=G.checkoutUrl:s.innerHTML='<div class="aviaframe-passenger-success"><h3>Passenger details saved</h3><p>Host app can continue booking via aviaframe:continueToBooking event.</p><button type="button" id="aviaframe-passenger-back2" class="aviaframe-passenger-button aviaframe-passenger-button--secondary">Back to search</button></div>',s.querySelector("#aviaframe-passenger-back2")&&s.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{s.remove(),r&&(r.style.display=""),i&&(i.style.display="")})}),f){const R=f.querySelector('input[name="email"]');if(R){let o=function(){const v=document.getElementById("aviaframe-widget");return v?String(v.dataset.agencyKey||v.dataset.agencyDomain||window.location.hostname||"default").trim():"default"},d=function(v){return`af_verified_profile:${o()}:${String(v).toLowerCase()}`},h=function(v){try{return localStorage.getItem(d(v))||""}catch{return""}},M=function(v,x){try{localStorage.setItem(d(v),x)}catch{}},S=function(v){try{localStorage.removeItem(d(v))}catch{}},C=function(v,x){const T=v.querySelector(".aviaframe-passenger-autofill-error");T&&T.remove();const E=document.createElement("span");E.className="aviaframe-passenger-autofill-error",E.textContent=x,v.appendChild(E)},I=function(v,x,T){const E=window.location.origin,A=`${P}?return_origin=${encodeURIComponent(E)}`,q=window.open(A,"aviaframe_google_signin","width=460,height=580");if(!q){C(T,O==="ar"?"يرجى السماح بالنوافذ المنبثقة للمتابعة عبر جوجل.":"Please allow pop-ups to continue with Google.");return}let D=!1;function N(){D||(D=!0,clearTimeout(Y),clearInterval(H),window.removeEventListener("message",te))}const Y=setTimeout(()=>{if(!D){N();try{q.close()}catch{}}},12e4),H=setInterval(()=>{D||!q.closed||(N(),C(T,K()))},500);async function te(ae){if(ae.origin!==L)return;const z=ae.data;if(!(!z||z.source!=="aviaframe_google_signin")&&!D){N();try{q.close()}catch{}if(z.status!=="success"||!z.credential){C(T,K());return}try{const W=await fetch(`${v}/public/customer-profile/verify-google`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${x}`},body:JSON.stringify({credential:z.credential})}),j=await W.json().catch(()=>({}));if(!W.ok){C(T,K(j?.error?.code));return}j.verified_token&&j.email&&M(j.email,j.verified_token),j.found&&j.profile?J(j.profile):T.remove()}catch{C(T,K())}}}window.addEventListener("message",te)},k=function(){const v=f.querySelector("#_af_banner");v&&v.remove()},U=function(v){k();const x=R.closest("label");return x?x.insertAdjacentElement("afterend",v):f.insertBefore(v,f.firstChild),v},J=function(v){const x=O==="ar",T=v.first_name||"",E=document.getElementById("aviaframe-passenger-form")||f,A={phone:v.phone,gender:v.gender,dateOfBirth:v.date_of_birth,firstName:v.first_name,lastName:v.last_name,passportNumber:v.passport_number,passportExpiry:v.passport_expiry},q={};Object.entries(A).forEach(([N,Y])=>{if(!Y)return;const H=E.querySelector(`[name="${N}"]`);H&&(q[N]=H.value,H.value=N==="dateOfBirth"?ra(Y):Y,H.dispatchEvent(new Event("input",{bubbles:!0})),H.dispatchEvent(new Event("change",{bubbles:!0})))});const D=U(document.createElement("div"));D.id="_af_banner",D.className="aviaframe-passenger-autofill",D.innerHTML=`<span class="aviaframe-passenger-autofill-message">${x?"✓ تم تعبئة بياناتك المحفوظة":`✓ Prefilled your saved details${T?", "+g(T):""}`}</span><button type="button" id="_af_undo_btn" class="aviaframe-passenger-autofill-undo">${x?"تراجع":"Undo"}</button>`,D.querySelector("#_af_undo_btn").addEventListener("click",()=>{Object.entries(q).forEach(([N,Y])=>{const H=E.querySelector(`[name="${N}"]`);H&&(H.value=Y,H.dispatchEvent(new Event("input",{bubbles:!0})))}),D.remove()})},K=function(v){const x=O==="ar";return{TOO_MANY_REQUESTS:x?"محاولات كثيرة جداً. يرجى المحاولة لاحقاً.":"Too many attempts. Please try again later.",EMAIL_DELIVERY_FAILED:x?"تعذر إرسال الرمز. يرجى المحاولة مرة أخرى.":"Couldn't send the code. Please try again.",VERIFICATION_INCORRECT_CODE:x?"رمز غير صحيح. حاول مرة أخرى.":"Incorrect code. Please try again.",VERIFICATION_EXPIRED:x?"انتهت صلاحية هذا الرمز. أرسل رمزاً جديداً.":"This code expired. Send a new one.",VERIFICATION_TOO_MANY_ATTEMPTS:x?"محاولات غير صحيحة كثيرة جداً. أرسل رمزاً جديداً.":"Too many incorrect attempts. Send a new code.",VERIFICATION_NOT_REQUESTED:x?"يرجى طلب رمز جديد.":"Please request a new code.",INVALID_CREDENTIAL:x?"تعذر التحقق من تسجيل الدخول عبر جوجل.":"Couldn't verify that Google sign-in. Please try again.",GOOGLE_SIGNIN_NOT_CONFIGURED:x?"تسجيل الدخول عبر جوجل غير متاح حالياً.":"Google sign-in is not available right now."}[v]||(x?"حدث خطأ ما. يرجى المحاولة مرة أخرى.":"Something went wrong. Please try again.")},xa=function(v,x,T){const E=O==="ar",A=U(document.createElement("div"));A.id="_af_banner",A.className="aviaframe-passenger-autofill",A.innerHTML=`
              <div class="aviaframe-passenger-autofill-row" style="flex:1 1 auto">
                <span class="aviaframe-passenger-autofill-message">${E?`أرسلنا رمزاً مكوناً من 6 أرقام إلى ${g(T)}`:`We sent a 6-digit code to ${g(T)}`}</span>
              </div>
              <div class="aviaframe-passenger-autofill-row">
                <input type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" id="_af_code_input" class="aviaframe-passenger-autofill-code-input" placeholder="${E?"أدخل الرمز":"Enter code"}" />
                <button type="button" id="_af_verify_btn" class="aviaframe-passenger-autofill-undo">${E?"تحقق":"Verify"}</button>
                <button type="button" id="_af_resend_btn" class="aviaframe-passenger-autofill-undo">${E?"إعادة الإرسال":"Resend"}</button>
                <button type="button" id="_af_close_btn" class="aviaframe-passenger-autofill-close" aria-label="${E?"إغلاق":"Dismiss"}">×</button>
              </div>`;const q=A.querySelector("#_af_code_input"),D=A.querySelector("#_af_verify_btn"),N=A.querySelector("#_af_resend_btn"),Y=A.querySelector("#_af_close_btn");function H(z){const W=A.querySelector(".aviaframe-passenger-autofill-error");W&&W.remove();const j=document.createElement("span");j.className="aviaframe-passenger-autofill-error",j.textContent=z,A.appendChild(j)}function te(){let z=30;N.disabled=!0,N.textContent=`${E?"إعادة الإرسال":"Resend"} (${z}s)`;const W=setInterval(()=>{if(z-=1,z<=0){clearInterval(W),N.disabled=!1,N.textContent=E?"إعادة الإرسال":"Resend";return}N.textContent=`${E?"إعادة الإرسال":"Resend"} (${z}s)`},1e3)}te(),Y.addEventListener("click",()=>A.remove()),N.addEventListener("click",async()=>{if(!N.disabled)try{const z=await fetch(`${v}/public/customer-profile/request-code`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${x}`},body:JSON.stringify({email:T})});if(!z.ok){const W=await z.json().catch(()=>({}));H(K(W?.error?.code));return}te()}catch{H(K())}});async function ae(){const z=q.value.trim();if(!/^\d{6}$/.test(z)){H(K("VERIFICATION_INCORRECT_CODE"));return}D.disabled=!0;try{const W=await fetch(`${v}/public/customer-profile/verify-code`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${x}`},body:JSON.stringify({email:T,code:z})}),j=await W.json().catch(()=>({}));if(!W.ok){D.disabled=!1,H(K(j?.error?.code));return}j.verified_token&&M(T,j.verified_token),j.found&&j.profile?J(j.profile):A.remove()}catch{D.disabled=!1,H(K())}}D.addEventListener("click",ae),q.addEventListener("keydown",z=>{z.key==="Enter"&&(z.preventDefault(),ae())})},wa=function(v,x,T){const E=O==="ar",A=U(document.createElement("div"));A.id="_af_banner",A.className="aviaframe-passenger-autofill",A.innerHTML=`
              <span class="aviaframe-passenger-autofill-message">${E?"هل لديك بيانات محفوظة؟":"Have a saved profile?"}</span>
              <div class="aviaframe-passenger-autofill-row">
                <button type="button" id="_af_google_btn" class="aviaframe-passenger-autofill-undo">${E?"المتابعة عبر جوجل":"Continue with Google"}</button>
                <button type="button" id="_af_start_btn" class="aviaframe-passenger-autofill-undo">${E?"تعبئة بياناتي المحفوظة":"Autofill my details"}</button>
                <button type="button" id="_af_close_btn" class="aviaframe-passenger-autofill-close" aria-label="${E?"إغلاق":"Dismiss"}">×</button>
              </div>`,A.querySelector("#_af_close_btn").addEventListener("click",()=>A.remove()),A.querySelector("#_af_google_btn").addEventListener("click",()=>{I(v,x,A)}),A.querySelector("#_af_start_btn").addEventListener("click",async()=>{const q=A.querySelector("#_af_start_btn");q.disabled=!0,q.textContent=E?"جارٍ إرسال الرمز...":"Sending code...";try{const D=await fetch(`${v}/public/customer-profile/request-code`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${x}`},body:JSON.stringify({email:T})});if(!D.ok){const N=await D.json().catch(()=>({}));q.disabled=!1,q.textContent=E?"تعبئة بياناتي المحفوظة":"Autofill my details";const Y=document.createElement("span");Y.className="aviaframe-passenger-autofill-error",Y.textContent=K(N?.error?.code),A.appendChild(Y);return}xa(v,x,T)}catch{q.disabled=!1,q.textContent=E?"تعبئة بياناتي المحفوظة":"Autofill my details"}})};const _=async()=>{const v=Date.now();return G.widgetSessionToken&&G.widgetSessionTokenExpiresAt>v+5e3?G.widgetSessionToken:(G.widgetSessionPromise||(G.widgetSessionPromise=(async()=>{const x=document.getElementById("aviaframe-widget"),T=x&&x.dataset.apiUrl||"",E=x?String(x.dataset.agencyKey||"").trim():"",A=x?String(x.dataset.agencyDomain||"").trim():"";if(!T||!E&&!A&&!window.location.hostname)return null;const q=new URL(T).origin,D=await fetch(`${q}/api/widget/session`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({agency_key:E||void 0,agency_domain:E?void 0:A||window.location.hostname||void 0,origin_host:window.location.hostname||void 0})});if(!D.ok)return null;const N=await D.json().catch(()=>({})),Y=String(N.widget_token||"").trim(),H=Math.max(parseInt(N.expires_in,10)||0,0);return Y?(G.widgetSessionToken=Y,G.widgetSessionTokenExpiresAt=Date.now()+H*1e3,Y):null})().catch(()=>null).finally(()=>{G.widgetSessionPromise=null})),G.widgetSessionPromise)},P="https://aviaframe.com/auth/google.html",L="https://aviaframe.com";R.addEventListener("blur",async function(){const v=this.value.trim();if(!(!v||!v.includes("@")))try{const x=document.getElementById("aviaframe-widget"),T=x&&x.dataset.apiUrl||"";if(!T)return;const E=new URL(T).origin,A=await _();if(!A)return;const q=h(v);if(q){const D=await fetch(`${E}/public/customer-profile?email=${encodeURIComponent(v)}&verified_token=${encodeURIComponent(q)}`,{headers:{Authorization:`Bearer ${A}`}});if(D.ok){const N=await D.json();N.found&&N.profile&&J(N.profile);return}S(v)}wa(E,A,v)}catch{}})}}}function Q(e,a=0){const t=Number(e);return Number.isFinite(t)?t:a}function g(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function oe(e,a){const t=String(a||"SAR").trim().toUpperCase(),i=/^[A-Z]{3}$/.test(t)?t:"SAR";let r;return window.AviaframeDisplayCurrency&&typeof window.AviaframeDisplayCurrency.formatAmount=="function"?r=window.AviaframeDisplayCurrency.formatAmount(e,i):r=`${Math.round(Q(e,0)).toLocaleString("en-US")} ${i}`,`<span class="_afp" data-a="${Number(e)||0}" data-c="${i}">${g(r)}</span>`}window.__aviaframeWidgetCurrencyRefresh=function(){document.querySelectorAll("._afp").forEach(function(e){const a=parseFloat(e.getAttribute("data-a")),t=e.getAttribute("data-c");!isNaN(a)&&window.AviaframeDisplayCurrency&&typeof window.AviaframeDisplayCurrency.formatAmount=="function"&&(e.textContent=window.AviaframeDisplayCurrency.formatAmount(a,t))})};function se(e){if(!e)return"--:--";const a=String(e).match(/T(\d{2}:\d{2})/);return a?a[1]:String(e)}function le(e){return e?String(e).trim().toUpperCase():null}function xe(e){var a;return le(e?.origin_code||((a=e?.departure_airport)==null?void 0:a.code)||e?.origin)}function we(e){var a;return le(e?.destination_code||((a=e?.arrival_airport)==null?void 0:a.code)||e?.destination)}function na(e){return e?.departure||[e?.departure_date,e?.departure_time].filter(Boolean).join("T")}function oa(e){return e?.arrival||[e?.arrival_date,e?.arrival_time].filter(Boolean).join("T")}function sa(e){const a=Array.isArray(e?.segments)?e.segments:[];if(!a.length)return null;const t=le(e?._searchOrigin||e?.origin),i=le(e?._searchDestination||e?.destination);if(!t||!i)return null;let r=-1;for(let c=1;c<a.length;c+=1){const s=xe(a[c]),F=we(a[c]);if(s===i||F===t){r=c;break}}if(r<0)return null;const l=a.slice(r),n=l[0],p=l[l.length-1],y=xe(n)||i,m=we(p)||t,b=na(n)||null,w=oa(p)||null;return!y||!m?null:{return_origin:y,return_destination:m,return_departure_time:b,return_arrival_time:w}}function la(e){if(e.duration_minutes)return Q(e.duration_minutes,0);if(e.durationMinutes)return Q(e.durationMinutes,0);if(e.journey_time)return Math.round(Q(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const a=new Date(e.departure_time).getTime(),t=new Date(e.arrival_time).getTime();return!Number.isFinite(a)||!Number.isFinite(t)||t<=a?0:Math.round((t-a)/6e4)}function da(e,a){if(!e||!a)return 0;const t=new Date(e).getTime(),i=new Date(a).getTime();return!Number.isFinite(t)||!Number.isFinite(i)||i<=t?0:Math.round((i-t)/6e4)}function Se(e){const a=Q(e,0),t=Math.floor(a/60),i=a%60;return a<=0?"n/a":`${t}h ${i}m`}function ca(e){return e.stops!==void 0?Q(e.stops,0):e.transfers_count!==void 0?Q(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function pa(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function ua(e){const a=Array.isArray(e?.baggage)?e.baggage:[],t=a.find(r=>r?.type==="checked"),i=Number(t?.quantity);return Number.isFinite(i)?i:0}function fa(e){const a=ua(e);return a>1?Te("badge_checked_bags_included",{count:a}):a===1?B("badge_checked_bag_included"):e!=null&&e.with_baggage===!1?B("badge_no_checked_bag"):typeof e?.baggage_text=="string"&&e.baggage_text.trim()?e.baggage_text.trim():e!=null&&e.with_baggage?B("filter_with_baggage"):B("badge_no_checked_bag")}function ma(e){const a=(e.airline_code||e.airline||"").toString().trim();return a?a.slice(0,2).toUpperCase():"NA"}function ga(e){var a,t;const i=Q((a=e?.price)==null?void 0:a.total,0),r=((t=e?.price)==null?void 0:t.currency)||"SAR",l=ca(e),n=Array.isArray(e?.segments)?e.segments.map(s=>{var F,f,u,$,R;return{origin:s?.origin||((F=s?.departure_city)==null?void 0:F.name)||((f=s?.departure_airport)==null?void 0:f.code)||"N/A",destination:s?.destination||((u=s?.arrival_city)==null?void 0:u.name)||(($=s?.arrival_airport)==null?void 0:$.code)||"N/A",departure:s?.departure||[s?.departure_date,s?.departure_time].filter(Boolean).join(" ")||"N/A",arrival:s?.arrival||[s?.arrival_date,s?.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((R=s?.carrier)==null?void 0:R.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:s?.flight_number||"N/A"}}):[],p=!!(e!=null&&e.return_origin&&e!=null&&e.return_destination||e!=null&&e.return_departure_time&&e!=null&&e.return_arrival_time),y=p?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",m=p?se(e.return_departure_time):"--:--",b=p?se(e.return_arrival_time):"--:--",w=p?da(e.return_departure_time,e.return_arrival_time):0,c=p?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:ma(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:se(e.departure_time),arrive:se(e.arrival_time),durationMinutes:la(e),stops:l,stopsText:pa(l),priceTotal:i,priceCurrency:r,with_baggage:e.with_baggage===!0,baggageText:fa(e),segments:n,hasReturnData:p,returnRoute:y,returnDepart:m,returnArrive:b,returnDurationMinutes:w,returnSummary:c}}function va(e){const a=e.origin||"WAW",t=e.destination||"YVR",i=e.depart_date||"2026-02-27",r=e.return_date||"",l=e.trip_type!=="one_way"&&!!r,n=(p,y,m,b=[])=>{const w=c=>({origin:c.from,destination:c.to,departure:c.depart,arrival:c.arrive,carrier:{airline_code:p,airline_name:y},flight_number:c.flight});return[...m.map(w),...b.map(w)]};return[{offer_id:"fallback_1",origin:a,destination:t,departure_time:`${i}T13:05:00`,arrival_time:`${i}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:l?t:null,return_destination:l?a:null,return_departure_time:l?`${r}T14:20:00`:null,return_arrival_time:l?`${r}T22:40:00`:null,segments:n("DL","DELTA",[{from:a,to:"CDG",depart:`${i}T13:05:00`,arrive:`${i}T16:10:00`,flight:"737"},{from:"CDG",to:t,depart:`${i}T17:05:00`,arrive:`${i}T23:25:00`,flight:"4200"}],l?[{from:t,to:"FRA",depart:`${r}T14:20:00`,arrive:`${r}T17:10:00`,flight:"9655"},{from:"FRA",to:a,depart:`${r}T18:30:00`,arrive:`${r}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"SAR"}},{offer_id:"fallback_2",origin:a,destination:t,departure_time:`${i}T08:10:00`,arrival_time:`${i}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:l?t:null,return_destination:l?a:null,return_departure_time:l?`${r}T09:00:00`:null,return_arrival_time:l?`${r}T20:30:00`:null,segments:n("LO","LOT",[{from:a,to:t,depart:`${i}T08:10:00`,arrive:`${i}T22:00:00`,flight:"441"}],l?[{from:t,to:a,depart:`${r}T09:00:00`,arrive:`${r}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"SAR"}},{offer_id:"fallback_3",origin:a,destination:t,departure_time:`${i}T06:45:00`,arrival_time:`${i}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:l?t:null,return_destination:l?a:null,return_departure_time:l?`${r}T07:10:00`:null,return_arrival_time:l?`${r}T19:55:00`:null,segments:n("AC","AIR CANADA",[{from:a,to:"MUC",depart:`${i}T06:45:00`,arrive:`${i}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${i}T11:50:00`,arrive:`${i}T14:50:00`,flight:"837"},{from:"YYZ",to:t,depart:`${i}T18:40:00`,arrive:`${i}T23:15:00`,flight:"835"}],l?[{from:t,to:"YYZ",depart:`${r}T07:10:00`,arrive:`${r}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${r}T12:00:00`,arrive:`${r}T16:00:00`,flight:"838"},{from:"MUC",to:a,depart:`${r}T17:20:00`,arrive:`${r}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"SAR"}}]}function ke(e,a={}){const t=document.getElementById("aviaframe-results"),i=e.map(ga).map((o,d)=>({...o,id:o.offer.offer_id||`offer_${d}`,airlineLogo:ta(o.carrierCode)})),r={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set,visibleCount:20},l=o=>r.quickFilter==="nonstop"?o.filter(d=>d.stops===0):r.quickFilter==="one_stop"?o.filter(d=>d.stops===1):r.quickFilter==="baggage"?o.filter(d=>d.with_baggage===!0):o,n=o=>{if(!o.length)return{count:0,minPrice:null,currency:null};const d=o.reduce((h,M)=>M.priceTotal<h.priceTotal?M:h,o[0]);return{count:o.length,minPrice:d.priceTotal,currency:d.priceCurrency||"SAR"}},p=()=>({all:n(i),nonstop:n(i.filter(o=>o.stops===0)),one_stop:n(i.filter(o=>o.stops===1)),baggage:n(i.filter(o=>o.with_baggage===!0))}),y=()=>{const o=l(i),d=new Map;return o.forEach(h=>{const M=h.carrierCode||"NA";if(!d.has(M))d.set(M,{code:M,name:h.airlineName||M,logo:h.airlineLogo,count:1,minPrice:h.priceTotal,currency:h.priceCurrency||"SAR"});else{const S=d.get(M);S.count+=1,h.priceTotal<S.minPrice&&(S.minPrice=h.priceTotal,S.currency=h.priceCurrency||S.currency)}}),Array.from(d.values()).sort((h,M)=>h.minPrice-M.minPrice)},m=o=>`
      <div class="aviaframe-details-panel">
        ${o.segments.length?o.segments.map(d=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${g(d.origin)} → ${g(d.destination)}</div>
            <div class="aviaframe-detail-meta">${g(d.departure)} → ${g(d.arrival)}</div>
            <div class="aviaframe-detail-meta">${g(d.airline)} • flight ${g(d.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${g(o.route)}</div>
            <div class="aviaframe-detail-meta">${g(o.depart)} → ${g(o.arrive)}</div>
          </div>
        `}
      </div>
    `,b=(o,d="")=>`
      <article class="aviaframe-flight-card ${d}" data-offer-id="${g(o.id)}">
        <div class="aviaframe-flight-main">
          <div class="aviaframe-segment">
            <div>
              <div class="aviaframe-airline-header">
                ${o.airlineLogo?`<img class="aviaframe-airline-logo" src="${o.airlineLogo}" alt="${g(o.airlineName)}" onerror="this.style.display='none'">`:""}
                <div class="aviaframe-airline">${g(o.airlineName)}</div>
              </div>
              <div class="aviaframe-class">Economy class</div>
            </div>
            <div>
              <div class="aviaframe-time">${g(o.depart)} - ${g(o.arrive)}</div>
              <div class="aviaframe-duration">${g(Se(o.durationMinutes))} total travel time</div>
            </div>
            <div>
              <div class="aviaframe-route">${g(o.route)}</div>
              <div class="aviaframe-transfer">${g(o.stopsText)}</div>
            </div>
          </div>
          ${o.hasReturnData?`
            <div class="aviaframe-segment">
              <div>
                <div class="aviaframe-airline-header">
                  ${o.airlineLogo?`<img class="aviaframe-airline-logo" src="${o.airlineLogo}" alt="${g(o.airlineName)}" onerror="this.style.display='none'">`:""}
                  <div class="aviaframe-airline">${g(o.airlineName)}</div>
                </div>
                <div class="aviaframe-class">Economy class</div>
              </div>
              <div>
                <div class="aviaframe-time">${g(o.returnDepart)} - ${g(o.returnArrive)}</div>
                <div class="aviaframe-duration">${g(Se(o.returnDurationMinutes||o.durationMinutes))} total travel time</div>
              </div>
              <div>
                <div class="aviaframe-route">${g(o.returnRoute)}</div>
                <div class="aviaframe-transfer">${g(o.stopsText)}</div>
              </div>
            </div>
          `:""}
          <div class="aviaframe-card-actions">
            <button type="button" class="aviaframe-details-toggle" data-details-id="${g(o.id)}">
              ${r.expandedIds.has(o.id)?"Hide details":"Details"}
            </button>
          </div>
          ${r.expandedIds.has(o.id)?m(o):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${g(o.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${oe(o.priceTotal,o.priceCurrency)}</div>
          <button class="aviaframe-select-button" data-select-id="${g(o.id)}">Select</button>
        </aside>
      </article>
    `,w=()=>{let o=l(i);return r.selectedAirlines.size&&(o=o.filter(d=>r.selectedAirlines.has(d.carrierCode))),o=[...o],r.sort==="airline"?o.sort((d,h)=>d.airlineName.localeCompare(h.airlineName)):r.sort==="fastest"?o.sort((d,h)=>d.durationMinutes-h.durationMinutes):o.sort((d,h)=>d.priceTotal-h.priceTotal),o},c=(o,d,h)=>`
      <button type="button" class="aviaframe-quick-item ${r.quickFilter===o?"active":""}" data-quick="${o}">
        <div class="aviaframe-quick-title">${d}</div>
        <div class="aviaframe-quick-meta">${h.count} flights${h.minPrice!==null?` · from ${oe(h.minPrice,h.currency||"SAR")}`:""}</div>
      </button>
    `,s=o=>o.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${o.map(d=>`
              <button type="button" class="aviaframe-airline-card ${r.selectedAirlines.has(d.code)?"active":""}" data-airline="${g(d.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${d.logo?`<img class="aviaframe-airline-logo-big" src="${d.logo}" alt="${g(d.name)}" onerror="this.style.display='none'">`:`<span>${g(d.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${g(d.name)}</div>
                <div class="aviaframe-airline-card-price">from ${oe(d.minPrice,d.currency||"SAR")}</div>
                <div class="aviaframe-airline-card-count">${d.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",F=`
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
    `;t.innerHTML=F;const f=document.getElementById("aviaframe-cards-container"),u=document.getElementById("aviaframe-selected-flight"),$=document.getElementById("aviaframe-quick-grid"),R=document.getElementById("aviaframe-airline-filter-wrap"),_=()=>{const o=p();$.innerHTML=[c("all",B("filter_all"),o.all),c("nonstop",B("filter_nonstop"),o.nonstop),c("one_stop",B("filter_one_stop"),o.one_stop),c("baggage",B("filter_with_baggage"),o.baggage)].join("");const d=y();R.innerHTML=s(d);const h=w(),M=r.selectedId?h.find(k=>k.id===r.selectedId):null;u.innerHTML=M?`<div class="aviaframe-selected-title">Selected flight</div>${b(M,"selected")}`:"";const S=h.filter(k=>k.id!==r.selectedId),P=S.slice(0,r.visibleCount),L=S.length>r.visibleCount,C=(O||"en")==="ar"?"المزيد":"More";f.innerHTML=S.length?P.map(k=>b(k)).join("")+(L?`<div class="aviaframe-more-wrap"><button type="button" class="aviaframe-more-btn" id="aviaframe-more-btn">${C}</button></div>`:""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',t.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(k=>{k.addEventListener("click",()=>{const U=k.getAttribute("data-select-id"),J=i.find(K=>K.id===U);J&&(r.selectedId=U,_e(J.offer))})}),t.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(k=>{k.addEventListener("click",()=>{const U=k.getAttribute("data-details-id");r.expandedIds.has(U)?r.expandedIds.delete(U):r.expandedIds.add(U),_()})}),t.querySelectorAll("[data-quick]").forEach(k=>{k.addEventListener("click",()=>{r.quickFilter=k.getAttribute("data-quick"),r.visibleCount=20,_()})}),t.querySelectorAll("[data-airline]").forEach(k=>{k.addEventListener("click",()=>{const U=k.getAttribute("data-airline");r.selectedAirlines.has(U)?r.selectedAirlines.delete(U):r.selectedAirlines.add(U),r.visibleCount=20,_()})});const I=f.querySelector("#aviaframe-more-btn");I&&I.addEventListener("click",()=>{r.visibleCount+=20,_()})};t.querySelectorAll("[data-sort]").forEach(o=>{o.addEventListener("click",()=>{r.sort=o.getAttribute("data-sort"),r.visibleCount=20,t.querySelectorAll("[data-sort]").forEach(d=>d.classList.remove("active")),t.querySelectorAll(`[data-sort="${r.sort}"]`).forEach(d=>d.classList.add("active")),_()})}),_(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}const Ae={en:["January","February","March","April","May","June","July","August","September","October","November","December"],ar:["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]},Ee={en:["Su","Mo","Tu","We","Th","Fr","Sa"],ar:["ح","ن","ث","ر","خ","ج","س"]},$e=[];function pe(){const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function ya(e){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return"";const[a,t,i]=e.split("-");return`${i}/${t}/${a}`}function ba(e){const a=document.createElement("div");a.className="wdp-wrapper",e.parentNode.insertBefore(a,e.nextSibling),e.style.display="none";const t=document.createElement("div");t.className="aviaframe-input wdp-trigger",t.setAttribute("tabindex","0"),t.setAttribute("role","button"),t.setAttribute("aria-haspopup","true"),t.innerHTML='<span class="wdp-display wdp-empty"></span><span class="wdp-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>',a.appendChild(t);const i=document.createElement("div");i.className="wdp-popup",i.style.display="none",i.innerHTML='<div class="wdp-header"><button class="wdp-nav wdp-prev" type="button">&#8249;</button><span class="wdp-month-label"></span><button class="wdp-nav wdp-next" type="button">&#8250;</button></div><div class="wdp-days-hdr"></div><div class="wdp-grid"></div>',a.appendChild(i);let r=!1,l,n;function p(){return O||"en"}function y(){const f=e.value;if(f&&/^\d{4}-\d{2}-\d{2}$/.test(f)){const[u,$]=f.split("-").map(Number);l=u,n=$-1}else{const u=e.getAttribute("min"),$=u&&/^\d{4}-\d{2}-\d{2}$/.test(u)?u:pe(),[R,_]=$.split("-").map(Number);l=R,n=_-1}}function m(){const f=t.querySelector(".wdp-display"),u=ya(e.value);u?(f.textContent=u,f.classList.remove("wdp-empty")):(f.textContent="DD/MM/YYYY",f.classList.add("wdp-empty"))}function b(){const f=p(),u=Ae[f]||Ae.en,$=Ee[f]||Ee.en;i.querySelector(".wdp-month-label").textContent=`${u[n]} ${l}`;const R=i.querySelector(".wdp-days-hdr");R.innerHTML=$.map(L=>`<span class="wdp-dh">${L}</span>`).join("");const _=i.querySelector(".wdp-grid");_.innerHTML="";const o=new Date(l,n,1).getDay(),d=new Date(l,n+1,0).getDate(),h=e.getAttribute("min")||pe(),M=e.getAttribute("max")||"",S=e.value||"",P=pe();for(let L=0;L<o;L++){const C=document.createElement("span");_.appendChild(C)}for(let L=1;L<=d;L++){const C=`${l}-${String(n+1).padStart(2,"0")}-${String(L).padStart(2,"0")}`,I=document.createElement("button");I.type="button",I.textContent=L,I.className="wdp-day",C===S&&I.classList.add("wdp-day-selected"),C===P&&I.classList.add("wdp-day-today"),h&&C<h||M&&C>M?(I.disabled=!0,I.classList.add("wdp-day-disabled")):I.addEventListener("click",()=>{e.value=C,e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("input",{bubbles:!0})),m(),c()}),_.appendChild(I)}}function w(){y(),b(),i.style.display="block",r=!0,setTimeout(()=>document.addEventListener("click",s),0)}function c(){i.style.display="none",r=!1,document.removeEventListener("click",s)}function s(f){a.contains(f.target)||c()}return t.addEventListener("click",()=>{r?c():w()}),t.addEventListener("keydown",f=>{(f.key==="Enter"||f.key===" ")&&(f.preventDefault(),r?c():w()),f.key==="Escape"&&c()}),i.querySelector(".wdp-prev").addEventListener("click",f=>{f.stopPropagation(),n--,n<0&&(n=11,l--),b()}),i.querySelector(".wdp-next").addEventListener("click",f=>{f.stopPropagation(),n++,n>11&&(n=0,l++),b()}),e.classList.add.bind(e.classList),new MutationObserver(()=>{t.classList.toggle("aviaframe-input-invalid",e.classList.contains("aviaframe-input-invalid"))}).observe(e,{attributes:!0,attributeFilter:["class"]}),e.addEventListener("change",m),m(),{refresh(){m(),r&&b()}}}function ha(e){e.querySelectorAll('input[type="date"]').forEach(a=>{const t=ba(a);$e.push(t)})}function _a(){$e.forEach(e=>e.refresh())}function ue(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const a=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";G.checkoutUrl=e.dataset.disableCheckoutRedirect==="true"?null:e.dataset.checkoutUrl||"/booking";const t=document.createElement("style");t.textContent=Xe,document.head.appendChild(t),e.className="aviaframe-widget",e.innerHTML=Qe(),setTimeout(()=>{ea(),ha(e),re(O),ne("aviaframe-origin","aviaframe-origin-autocomplete",a),ne("aviaframe-destination","aviaframe-destination-autocomplete",a),ne("aviaframe-origin-2","aviaframe-origin-2-autocomplete",a),ne("aviaframe-destination-2","aviaframe-destination-2-autocomplete",a),aa(a);const i=document.getElementById("aviaframe-lang-btn");i&&i.addEventListener("click",()=>re(O==="en"?"ar":"en"))},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ue):ue(),window.AviaframeWidget={init:ue,setLang:re,openPassengerStep:_e},window.__aviaLangToggle=()=>re(O==="en"?"ar":"en")})()})()})();
