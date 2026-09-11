(function(){"use strict";const Ee=`
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
`;(function(){(function(){const Y={checkoutUrl:null,widgetSessionToken:null,widgetSessionTokenExpiresAt:0,widgetSessionPromise:null},H={en:{title:"Flight Search",trip_return:"Return",trip_oneway:"One-way",trip_multi:"Multi-city",cabin_economy:"Economy",cabin_premium:"Premium Economy",cabin_business:"Business",cabin_first:"First Class",cabin_mixed:"Apply mixed classes",passenger_singular:"Passenger",passenger_plural:"Passengers",pax_adults:"Adults",pax_adults_sub:"Over 11",pax_children:"Children",pax_children_sub:"2–11",pax_infants:"Infants",pax_infants_sub:"Under 2",pax_cabin_bags:"Cabin baggage",pax_checked_bags:"Checked baggage",from_label:"From",to_label:"To",depart_date:"Departure Date",return_date:"Return Date",from_2:"From (2nd segment)",to_2:"To (2nd segment)",depart_date_2:"Departure Date (2nd segment)",search_btn:"Search Flights",error_title:"Error",error_select_airports:"Please select airports from the dropdown.",error_select_depart_date:"Please select departure date.",error_select_return_date:"Please select a return date or switch to one-way.",error_search_invalid:"Please check your route, dates and passenger details, then try again.",error_return_before_depart:"Return date must be the same as or later than the departure date. Please update your travel dates.",error_return_before_depart_inline:"Return date must be after departure.",error_multicity_missing:"For Multi-city please fill second segment: From, To and Date.",error_multicity_before_first:"The second segment date must be the same as or later than the first departure date.",error_multicity_before_first_inline:"Second segment date must be after first departure.",searching_flights:"Searching for flights...",searching_routes:"Finding the best routes",searching_fares:"Checking current fares",searching_options:"Preparing your best options",no_results_title:"No flights found",no_results_body:"Try adjusting your search criteria.",filter_all:"All",filter_nonstop:"Non-stop",filter_one_stop:"1 stop",filter_with_baggage:"With baggage",badge_no_checked_bag:"No checked bag",badge_checked_bag_included:"1 checked bag included",badge_checked_bags_included:"{count} checked bags included",sandbox_no_results_title:"No sandbox offers for this route or date",sandbox_no_results_body:"DRCT sandbox inventory is limited and does not mirror full live availability. Try another route or date, or use the production domain for live search results."},ar:{title:"البحث عن رحلات",trip_return:"ذهاب وإياب",trip_oneway:"ذهاب فقط",trip_multi:"متعدد المدن",cabin_economy:"الاقتصادية",cabin_premium:"الاقتصادية المميزة",cabin_business:"رجال الأعمال",cabin_first:"الدرجة الأولى",cabin_mixed:"تطبيق درجات مختلطة",passenger_singular:"مسافر",passenger_plural:"مسافرون",pax_adults:"البالغون",pax_adults_sub:"أكبر من 11",pax_children:"الأطفال",pax_children_sub:"2–11",pax_infants:"الرضّع",pax_infants_sub:"أقل من 2",pax_cabin_bags:"أمتعة المقصورة",pax_checked_bags:"الأمتعة المسجّلة",from_label:"من",to_label:"إلى",depart_date:"تاريخ المغادرة",return_date:"تاريخ العودة",from_2:"من (المقطع الثاني)",to_2:"إلى (المقطع الثاني)",depart_date_2:"تاريخ المغادرة (المقطع الثاني)",search_btn:"البحث عن رحلات",error_title:"خطأ",error_select_airports:"يرجى اختيار المطارات من القائمة المنسدلة.",error_select_depart_date:"يرجى اختيار تاريخ المغادرة.",error_select_return_date:"يرجى اختيار تاريخ العودة أو التبديل إلى رحلة ذهاب فقط.",error_search_invalid:"يرجى التحقق من المسار والتواريخ وبيانات المسافرين ثم المحاولة مرة أخرى.",error_return_before_depart:"يجب أن يكون تاريخ العودة في نفس يوم المغادرة أو بعده. يرجى تعديل تواريخ السفر.",error_return_before_depart_inline:"يجب أن يكون تاريخ العودة بعد المغادرة.",error_multicity_missing:"للرحلات متعددة المدن، يرجى استكمال المقطع الثاني: من وإلى والتاريخ.",error_multicity_before_first:"يجب أن يكون تاريخ المقطع الثاني في نفس يوم المقطع الأول أو بعده.",error_multicity_before_first_inline:"يجب أن يكون تاريخ المقطع الثاني بعد الأول.",searching_flights:"جارٍ البحث عن الرحلات...",searching_routes:"جارٍ البحث عن أفضل المسارات",searching_fares:"جارٍ التحقق من الأسعار الحالية",searching_options:"جارٍ تجهيز أفضل الخيارات",no_results_title:"لم يتم العثور على رحلات",no_results_body:"يرجى تعديل معايير البحث والمحاولة مرة أخرى.",filter_all:"الكل",filter_nonstop:"مباشر",filter_one_stop:"توقف واحد",filter_with_baggage:"مع الأمتعة",badge_no_checked_bag:"بدون أمتعة مسجلة",badge_checked_bag_included:"حقيبة مسجلة واحدة مشمولة",badge_checked_bags_included:"{count} حقائب مسجلة مشمولة",sandbox_no_results_title:"لا توجد عروض sandbox لهذا المسار أو التاريخ",sandbox_no_results_body:"مخزون DRCT في بيئة sandbox محدود ولا يعكس التوفر الكامل في البيئة الحية. جرّب مساراً أو تاريخاً آخر، أو استخدم نطاق الإنتاج لرؤية النتائج الحية."}};let N=(()=>{try{return localStorage.getItem("aviaframe-widget-lang")||"en"}catch{return"en"}})();function Q(e,a){if(a=a||document.getElementById("aviaframe-widget"),!a)return;N=e;try{localStorage.setItem("aviaframe-widget-lang",e)}catch{}const t=H[e]||H.en;a.setAttribute("dir",e==="ar"?"rtl":"ltr"),a.setAttribute("lang",e==="ar"?"ar":"en"),ba(),a.querySelectorAll("[data-wi18n]").forEach(c=>{const s=c.getAttribute("data-wi18n");t[s]!==void 0&&(c.textContent=t[s])});const i=a.querySelector("#aviaframe-trip-type"),r=a.querySelector("#aviaframe-trip-label");if(i&&r){const c=i.value;r.textContent=c==="one_way"?t.trip_oneway:c==="multi_city"?t.trip_multi:t.trip_return}const d=a.querySelector("#aviaframe-cabin"),n=a.querySelector("#aviaframe-cabin-label");if(d&&n){const c={economy:t.cabin_economy,premium_economy:t.cabin_premium,business:t.cabin_business,first:t.cabin_first};n.textContent=c[d.value]||t.cabin_economy}const p=parseInt(a.querySelector("#aviaframe-adults")?.value||"1"),y=parseInt(a.querySelector("#aviaframe-children")?.value||"0"),f=parseInt(a.querySelector("#aviaframe-infants")?.value||"0"),b=p+y+f,x=a.querySelector("#aviaframe-passengers-label");x&&(x.textContent=`${b} ${b===1?t.passenger_singular:t.passenger_plural}`),a.querySelectorAll("#aviaframe-lang-btn .wlt-opt").forEach(c=>c.classList.toggle("wlt-active",c.getAttribute("data-wl")===e)),a.querySelector("#aviaframe-search-form")&&G(a)}function R(e){const a=H[N]||H.en;return a[e]!==void 0?a[e]:H.en[e]!==void 0?H.en[e]:e}function $e(e,a={}){return Object.entries(a).reduce((t,[i,r])=>String(t).replaceAll(`{${i}}`,String(r)),R(e))}function ee(e,a){e&&(e.classList.remove("aviaframe-input-invalid"),e.removeAttribute("aria-invalid")),a&&(a.textContent="",a.classList.remove("visible"))}function le(e){document.querySelectorAll(".aviaframe-validation-popup").forEach(a=>a.remove()),document.querySelectorAll(".aviaframe-input-invalid").forEach(a=>{a.classList.remove("aviaframe-input-invalid"),a.removeAttribute("aria-invalid")})}function X(e,a){if(!e)return;le(),e.classList.add("aviaframe-input-invalid"),e.setAttribute("aria-invalid","true");const t=document.createElement("div");t.className="aviaframe-validation-popup",t.setAttribute("role","alert"),t.textContent=a,(e.closest(".aviaframe-field")||e.parentElement).appendChild(t),e.focus()}function Te(e){e=e||document;const a=e.querySelector("#aviaframe-depart-date"),t=e.querySelector("#aviaframe-return-date"),i=e.querySelector("#aviaframe-depart-date-2");if(t&&a){const r=a.value||a.getAttribute("min")||"";r?t.setAttribute("min",r):t.removeAttribute("min")}if(i&&a){const r=a.value||a.getAttribute("min")||"";r?i.setAttribute("min",r):i.removeAttribute("min")}}function G(e){e=e||document;const a=e.querySelector("#aviaframe-trip-type")?.value||"return",t=e.querySelector("#aviaframe-depart-date"),i=e.querySelector("#aviaframe-return-date"),r=e.querySelector("#aviaframe-depart-date-2"),d=e.querySelector("#aviaframe-return-date-error"),n=e.querySelector("#aviaframe-depart-date-2-error");return Te(e),ee(i,d),ee(r,n),a==="return"&&t&&i&&t.value&&i.value&&i.value<t.value?(ee(i,d),{valid:!1,input:i,message:R("error_return_before_depart")}):a==="multi_city"&&t&&r&&t.value&&r.value&&r.value<t.value?(ee(r,n),{valid:!1,input:r,message:R("error_multicity_before_first")}):{valid:!0,input:null,message:""}}const Ce=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1},{code:"LTN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Luton",priority:3},{code:"STN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Stansted",priority:4},{code:"LCY",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"City Airport",priority:5},{code:"LIN",city:"Milan",cityRu:"Милан",country:"Italy",name:"Linate",priority:3},{code:"BGY",city:"Milan",cityRu:"Милан",country:"Italy",name:"Bergamo",priority:4},{code:"PMF",city:"Milan",cityRu:"Милан",country:"Italy",name:"Parma",priority:5},{code:"IMR",city:"Milan",cityRu:"Милан",country:"Italy",name:"Rogoredo Railway Station",priority:6},{code:"SVO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Sheremetyevo",priority:1},{code:"DME",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Domodedovo",priority:2},{code:"VKO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Vnukovo",priority:3},{code:"ZIA",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Zhukovsky",priority:4},{code:"LED",city:"Saint Petersburg",cityRu:"Санкт-Петербург",country:"Russia",name:"Pulkovo",priority:1},{code:"ALA",city:"Almaty",cityRu:"Алматы",country:"Kazakhstan",name:"Almaty International",priority:1},{code:"TAS",city:"Tashkent",cityRu:"Ташкент",country:"Uzbekistan",name:"Tashkent International",priority:1}],Ie="aviaframe_ac_v4:",Re=1440*60*1e3,Le=3500,ne={London:"LON",Milan:"MIL",Moscow:"MOW","Saint Petersburg":"SPT","New York":"NYC",Dubai:"DXB",Istanbul:"IST",Brussels:"BRU",Tokyo:"TYO"},De={"United Kingdom":"GB",France:"FR",Germany:"DE",Netherlands:"NL",Spain:"ES",Italy:"IT",Belgium:"BE",Austria:"AT",Switzerland:"CH",Denmark:"DK",Norway:"NO",Sweden:"SE",Finland:"FI",Ireland:"IE",Portugal:"PT",Greece:"GR",Turkey:"TR",Ukraine:"UA",Poland:"PL","Czech Republic":"CZ",Hungary:"HU",UAE:"AE",Qatar:"QA",Bahrain:"BH","Saudi Arabia":"SA",Thailand:"TH",Singapore:"SG","Hong Kong":"HK",Japan:"JP","South Korea":"KR",India:"IN",USA:"US",Canada:"CA",Mexico:"MX",Russia:"RU",Kazakhstan:"KZ",Uzbekistan:"UZ"};function ce(e){return De[e]||String(e||"").slice(0,2).toUpperCase()}function pe(e){return String(e||"").replace(/\/+$/,"")}function J(e){return String(e||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function Be(e){const a=pe(e),t=[];return a&&(t.push(a),/\/search$/i.test(a)||t.push(`${a}/search`),a.includes("/api/drct/")?t.push(a.replace("/api/drct/","/api/n8n/webhook-test/drct/")):/\/api\/drct$/i.test(a)&&t.push(a.replace("/api/drct","/api/n8n/webhook-test/drct"))),[...new Set(t.filter(Boolean))]}function Ne(e){const a=pe(e),t=new Set,i=r=>{r&&t.add(r)};if(a){/\/search$/i.test(a)&&i(a.replace(/\/search$/i,"/airports/autocomplete")),i(`${a}/airports/autocomplete`);const r=a.match(/^(https?:\/\/[^/]+)/i);r&&i(`${r[1]}/public/airports/autocomplete`)}return typeof window<"u"&&window.location&&i(`${window.location.origin}/public/airports/autocomplete`),[...t]}function Me(e,a){return`${Ie}${String(a).toLowerCase()}:${String(e||"").trim().toLowerCase()}`}function qe(e){try{const a=localStorage.getItem(e);if(!a)return null;const t=JSON.parse(a);return!t||!t.cachedAt||Date.now()-t.cachedAt>Re?(localStorage.removeItem(e),null):t.payload||null}catch{return null}}function ze(e){return!!(e&&e.source!=="fallback"&&Array.isArray(e.groups)&&e.groups.some(a=>Array.isArray(a.items)&&a.items.length>0))}function ue(e,a){if(ze(a))try{localStorage.setItem(e,JSON.stringify({cachedAt:Date.now(),payload:a}))}catch{}}function Pe(e,a){const t=J(a),i=J(e.code),r=J(e.city),d=J(e.cityRu),n=J(e.name),p=J(e.country),y=J(ne[e.city]||""),f=[i,r,d,n,p,y].filter(Boolean);if(!f.some(x=>x.includes(t)))return 0;let b=0;return(i===t||y===t)&&(b+=1600),(r===t||d===t)&&(b+=1500),n===t&&(b+=1400),p===t&&(b+=1200),(i.startsWith(t)||y.startsWith(t))&&(b+=1e3),(r.startsWith(t)||d.startsWith(t))&&(b+=950),n.startsWith(t)&&(b+=900),p.startsWith(t)&&(b+=500),r.split(/[\s-]+/).some(x=>x.startsWith(t))&&(b+=220),n.split(/[\s-]+/).some(x=>x.startsWith(t))&&(b+=180),f.some(x=>x.includes(t))&&(b+=120),b-(e.priority||999)}function Oe(e,a=12){const t=J(e);if(t.length<1)return[];const i=Ce.map(n=>({airport:n,score:Pe(n,t)})).filter(n=>n.score>0).sort((n,p)=>p.score-n.score||(n.airport.priority||999)-(p.airport.priority||999)||n.airport.city.localeCompare(p.airport.city)||n.airport.name.localeCompare(p.airport.name)).slice(0,Math.max(a*4,20)),r=new Map;for(const{airport:n,score:p}of i){const y=`${n.country}:${n.city}`;r.has(y)||r.set(y,{country_code:ce(n.country),country_name:n.country,city_code:ne[n.city]||n.code,city_name:n.city,airports:[],bestScore:0}),r.get(y).bestScore=Math.max(r.get(y).bestScore,p),r.get(y).airports.push({type:"airport",code:n.code,name:n.name,city_code:ne[n.city]||n.code,city_name:n.city,country_code:ce(n.country),country_name:n.country,priority:n.priority,score:p})}const d=new Map;for(const n of r.values()){const p=`${n.country_code}:${n.country_name}`;d.has(p)||d.set(p,{country_code:n.country_code,country_name:n.country_name,items:[],bestScore:0}),d.get(p).bestScore=Math.max(d.get(p).bestScore,n.bestScore);const y=n.airports.slice().sort((f,b)=>b.score-f.score||(f.priority||999)-(b.priority||999)||f.name.localeCompare(b.name)).map(f=>({type:"airport",code:f.code,name:f.name,city_code:f.city_code,city_name:f.city_name,country_code:f.country_code,country_name:f.country_name,score:f.score}));y.length>1?d.get(p).items.push({type:"city",code:n.city_code,name:n.city_name,city_code:n.city_code,city_name:n.city_name,country_code:n.country_code,country_name:n.country_name,airport_count:y.length,airports:y,score:n.bestScore}):y[0]&&d.get(p).items.push(y[0])}return Array.from(d.values()).sort((n,p)=>p.bestScore-n.bestScore||n.country_name.localeCompare(p.country_name)).map(n=>({...n,items:n.items.sort((p,y)=>(y.score||0)-(p.score||0)||(p.priority||999)-(y.priority||999)||String(p.city_name||p.name||"").localeCompare(String(y.city_name||y.name||"")))})).filter(n=>n.items.length>0)}function Fe(e,a=12){return Oe(e,a)}async function Ue(e,a){const t=N==="ar"?"ar":"en",i=Me(e,t),r=qe(i);if(r)return r;const d=Ne(a),n=`q=${encodeURIComponent(e)}&locale=${encodeURIComponent(t)}&limit=12`;for(const y of d){const f=new AbortController,b=setTimeout(()=>f.abort(),Le);try{const x=await fetch(`${y}?${n}`,{method:"GET",headers:{Accept:"application/json"},signal:f.signal});if(clearTimeout(b),!x.ok){if(x.status===404)continue;throw new Error(`autocomplete ${x.status}`)}const c=await x.json();if(c&&Array.isArray(c.groups)&&c.groups.some(s=>Array.isArray(s.items)&&s.items.length>0)){const s={...c,cached:!1};return ue(i,s),s}}catch{clearTimeout(b)}}const p={query:e,locale:t,source:"fallback",groups:Fe(e,12),cached:!1};return ue(i,p),p}function He(e){const a=[],t=[];return(e.groups||[]).forEach(i=>{t.push(`<div class="aviaframe-autocomplete-group"><div class="aviaframe-autocomplete-group-header">${g(i.country_name)} (${g(i.country_code)})</div>${(i.items||[]).map(r=>{if(r.type==="city"){const n=(r.airports||[]).map(f=>String(f.code||"").trim()).filter(Boolean).join(","),p=a.length;a.push({label:`${r.city_name} (${r.code})`,code:r.code,airports:n,cityName:r.city_name});const y=(r.airports||[]).map(f=>{const b=a.length;return a.push({label:`${f.city_name} (${f.code})`,code:f.code,airports:"",cityName:f.city_name}),`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-child" data-index="${b}"><div><span class="aviaframe-airport-code">${g(f.code)}</span><span class="aviaframe-airport-city">${g(f.city_name)}</span></div><span class="aviaframe-airport-name">${g(f.name)}</span></div>`}).join("");return`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-parent" data-index="${p}"><div><span class="aviaframe-airport-code">${g(r.code)}</span><span class="aviaframe-airport-city">${g(r.city_name)}</span></div><span class="aviaframe-airport-name">All airports${r.airport_count?` · ${g(String(r.airport_count))}`:""}</span></div>${y}`}const d=a.length;return a.push({label:`${r.city_name||r.name} (${r.code})`,code:r.code,airports:"",cityName:r.city_name||r.name}),`<div class="aviaframe-autocomplete-item" data-index="${d}"><div><span class="aviaframe-airport-code">${g(r.code)}</span><span class="aviaframe-airport-city">${g(r.city_name||r.name)}</span></div><span class="aviaframe-airport-name">${g(r.name)}, ${g(r.country_name)}</span></div>`}).join("")} </div>`)}),{html:t.join(""),items:a}}function me(e,a,t){t&&(e.value=t.label,e.dataset.code=t.code||"",e.dataset.airports=t.airports||"",e.dataset.cityName=t.cityName||"",a.style.display="none")}function je(e){delete e.dataset.code,delete e.dataset.airports,delete e.dataset.cityName}function Ye(e){const a=new Date(e),t=a.getFullYear(),i=String(a.getMonth()+1).padStart(2,"0"),r=String(a.getDate()).padStart(2,"0");return`${t}-${i}-${r}`}function Ve(){return Ye(new Date)}function oe(){return typeof window>"u"?{}:window.AVIAFRAME_RUNTIME_CONFIG||window.__AVIAFRAME_SITE_CONFIG__||{}}function We(){if(typeof window>"u")return!1;const e=String(window.location.hostname||"").toLowerCase();return e==="localhost"||e==="127.0.0.1"}function Ke(){return!!oe().allowDemoSearchFallback||We()}function fe(){const e=oe();return typeof e.searchIsSandbox=="boolean"?e.searchIsSandbox:/sandbox/i.test(String(e.environment||""))}function Ge(){const e=fe()?R("sandbox_no_results_title"):R("no_results_title"),a=fe()?R("sandbox_no_results_body"):R("no_results_body");return`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${e}</div>
              <div>${a}</div>
            </div>
          `}const Je=`${Ee}
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
  `;function Ze(){const e=Ve();return`
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
    `}function Xe(){var e;const a=Array.from(document.querySelectorAll(".aviaframe-dropdown")),t=()=>a.forEach(u=>u.classList.remove("open"));a.forEach(u=>{const E=u.querySelector(".aviaframe-dropdown-btn");E&&E.addEventListener("click",C=>{C.stopPropagation();const _=u.classList.contains("open");t(),_||u.classList.add("open")})}),document.addEventListener("click",u=>{u.target.closest(".aviaframe-dropdown")||t()});const i=document.getElementById("aviaframe-trip-type"),r=document.getElementById("aviaframe-trip-label"),d=(e=document.getElementById("aviaframe-return-date"))==null?void 0:e.closest(".aviaframe-field"),n=document.getElementById("aviaframe-multi-city-fields"),p=document.getElementById("aviaframe-depart-date"),y=document.getElementById("aviaframe-return-date"),f=document.getElementById("aviaframe-depart-date-2");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(u=>{u.addEventListener("change",()=>{u.checked&&(i.value=u.value,r.textContent=u.value==="one_way"?(H[N]||H.en).trip_oneway:u.value==="multi_city"?(H[N]||H.en).trip_multi:(H[N]||H.en).trip_return,u.value==="one_way"?(d&&(d.style.display="none"),n&&(n.style.display="none")):u.value==="multi_city"?(d&&(d.style.display="none"),n&&(n.style.display="block")):(d&&(d.style.display="block"),n&&(n.style.display="none"))),G(document)})}),p&&p.addEventListener("change",()=>{G(document)}),y&&y.addEventListener("change",()=>{G(document)}),f&&f.addEventListener("change",()=>{G(document)}),G(document);const b=document.getElementById("aviaframe-cabin"),x=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(u=>{u.addEventListener("change",()=>{u.checked&&(b.value=u.value,x.textContent=u.parentElement.textContent.trim())})});const c={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},s={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},z=()=>{document.getElementById("aviaframe-adults").value=s.adults,document.getElementById("aviaframe-children").value=s.children,document.getElementById("aviaframe-infants").value=s.infants,document.getElementById("aviaframe-cabin-bags").value=s.cabinBags,document.getElementById("aviaframe-checked-bags").value=s.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(s.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(s.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${s.adults+s.children+s.infants} ${s.adults+s.children+s.infants===1?(H[N]||H.en).passenger_singular:(H[N]||H.en).passenger_plural}`},m=()=>{const u=document.getElementById("aviaframe-age-selectors");for(;s.childrenAges.length<s.children;)s.childrenAges.push(2);for(;s.childrenAges.length>s.children;)s.childrenAges.pop();for(;s.infantAges.length<s.infants;)s.infantAges.push(1);for(;s.infantAges.length>s.infants;)s.infantAges.pop();const E=s.childrenAges.map((_,o)=>`
        <div class="aviaframe-age-item">
          <label>Child ${o+1} age</label>
          <select data-age-type="child" data-age-index="${o}">
            ${Array.from({length:10},(l,h)=>h+2).map(l=>`<option value="${l}" ${l===_?"selected":""}>${l}</option>`).join("")}
          </select>
        </div>
      `).join(""),C=s.infantAges.map((_,o)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${o+1} age</label>
          <select data-age-type="infant" data-age-index="${o}">
            ${Array.from({length:2},(l,h)=>h).map(l=>`<option value="${l}" ${l===_?"selected":""}>${l}</option>`).join("")}
          </select>
        </div>
      `).join("");u.innerHTML=E+C,u.querySelectorAll("select[data-age-type]").forEach(_=>{_.addEventListener("change",()=>{const o=_.getAttribute("data-age-type"),l=Number(_.getAttribute("data-age-index")),h=Number(_.value);o==="child"?s.childrenAges[l]=h:s.infantAges[l]=h,z()})}),z()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(u=>{u.addEventListener("click",()=>{const E=u.getAttribute("data-counter"),C=Number(u.getAttribute("data-delta")),_=c[E];if(!_)return;const o=Math.max(_.min,Math.min(_.max,s[E]+C));s[E]=o;const l=document.getElementById(`aviaframe-count-${E}`);l&&(l.textContent=o),m()})}),m()}function ae(e,a,t){const i=document.getElementById(e),r=document.getElementById(a);if(!i||!r)return;let d=-1,n=[],p=null,y=0;const f=()=>{r.style.display="none",n=[],d=-1},b=()=>{r.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach((c,s)=>{s===d?(c.classList.add("active"),c.scrollIntoView({block:"nearest"})):c.classList.remove("active")})},x=()=>{n.length?(r.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach(c=>{c.addEventListener("mousedown",function(s){s.preventDefault();const z=Number(this.getAttribute("data-index")),m=n[z];me(i,r,m)})}),r.style.display="block"):(r.innerHTML="",f())};i.addEventListener("input",function(){const c=this.value.trim();je(i),p&&clearTimeout(p),c.length<1&&f(),c.length<1||(r.innerHTML='<div class="aviaframe-autocomplete-empty">Searching...</div>',r.style.display="block",p=setTimeout(async()=>{const s=++y;try{const z=await Ue(c,t);if(s!==y)return;const m=He(z);n=m.items,r.innerHTML=m.html||'<div class="aviaframe-autocomplete-empty">No airports found</div>',d=-1,x()}catch{n=[],r.innerHTML='<div class="aviaframe-autocomplete-empty">No airports found</div>',r.style.display="block"}},250))}),i.addEventListener("keydown",function(c){n.length&&(c.key==="ArrowDown"?(c.preventDefault(),d=Math.min(d+1,n.length-1),b()):c.key==="ArrowUp"?(c.preventDefault(),d=Math.max(d-1,0),b()):c.key==="Enter"&&d>=0?(c.preventDefault(),me(i,r,n[d])):c.key==="Escape"&&f())}),document.addEventListener("click",function(c){!i.contains(c.target)&&!r.contains(c.target)&&f()})}function Qe(e){const a=document.getElementById("aviaframe-search-form"),t=document.getElementById("aviaframe-results");a.addEventListener("submit",async function(i){i.preventDefault(),le();const r=document.getElementById("aviaframe-origin"),d=document.getElementById("aviaframe-destination"),n=document.getElementById("aviaframe-depart-date").value,p=document.getElementById("aviaframe-return-date").value,y=parseInt(document.getElementById("aviaframe-adults").value,10),f=parseInt(document.getElementById("aviaframe-children").value,10)||0,b=parseInt(document.getElementById("aviaframe-infants").value,10)||0,x=document.getElementById("aviaframe-trip-type").value||"return",c=document.getElementById("aviaframe-cabin").value,s=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),z=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),m=r.dataset.code,u=d.dataset.code,E=r.dataset.airports||m,C=d.dataset.airports||u;if(!m||!u){X(m?d:r,R("error_select_airports"));return}if(!n){X(document.getElementById("aviaframe-depart-date"),R("error_select_depart_date"));return}if(x==="return"&&!p){const w=document.getElementById("aviaframe-return-date");X(w,R("error_select_return_date"));return}const _=G(document);if(!_.valid){X(_.input,_.message);return}t.innerHTML=`
        <div class="aviaframe-loading" role="status" aria-live="polite" aria-atomic="true">
          <div class="aviaframe-search-radar" aria-hidden="true">
            <span class="aviaframe-search-radar__ring"></span>
            <span class="aviaframe-search-radar__ring aviaframe-search-radar__ring--inner"></span>
            <span class="aviaframe-search-radar__beacon"></span>
          </div>
          <div class="aviaframe-loading-title">${R("searching_flights")}</div>
          <div class="aviaframe-loading-steps">
            <span class="aviaframe-loading-step">${R("searching_routes")}</span>
            <span class="aviaframe-loading-step">${R("searching_fares")}</span>
            <span class="aviaframe-loading-step">${R("searching_options")}</span>
          </div>
          <div class="aviaframe-loading-progress" aria-hidden="true"><span></span></div>
        </div>
      `;let o={origin:E,destination:C,origin_city:m,destination_city:u,depart_date:n,return_date:p||null,adults:y,children:f,infants:b,children_ages:s,infant_ages:z,cabin_class:c,trip_type:x};const l=oe(),h=document.querySelector("[data-aviaframe-widget]")||document.getElementById("aviaframe-widget");if(Object.prototype.hasOwnProperty.call(l,"searchOriginHost")?l.searchOriginHost&&(o.origin_host=l.searchOriginHost):l.siteOriginHost&&(o.origin_host=l.siteOriginHost),h?.dataset?.agencyKey&&(o.agency_key=h.dataset.agencyKey),x==="one_way"&&(o.return_date=null),x==="multi_city"){const w=document.getElementById("aviaframe-origin-2"),M=document.getElementById("aviaframe-destination-2"),T=document.getElementById("aviaframe-depart-date-2").value,I=w?.dataset.code,A=M?.dataset.code,S=w?.dataset.airports||I,O=M?.dataset.airports||A;if(!I||!A||!T){X(I?A?document.getElementById("aviaframe-depart-date-2"):M:w,R("error_multicity_missing"));return}const v=G(document);if(!v.valid){X(v.input,v.message);return}o.segments=[{origin:E,destination:C,origin_city:m,destination_city:u,depart_date:n},{origin:S,destination:O,origin_city:I,destination_city:A,depart_date:T}]}try{let w=null;const M=Be(e);for(const I of M)if(w=await fetch(I,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}),w.ok||w.status!==404)break;if(!w.ok)throw w.status===422?new Error(R("error_search_invalid")):new Error(`HTTP ${w.status}: ${w.statusText}`);const T=await w.json();if(T.offers&&T.offers.length>0){const I=T.offers.map(A=>{const S={...A,_searchOrigin:A?._searchOrigin||m||null,_searchDestination:A?._searchDestination||u||null,_searchReturnDate:A?._searchReturnDate||o.return_date||null};if(!(S!=null&&S.return_origin&&S!=null&&S.return_destination||S!=null&&S.return_departure_time&&S!=null&&S.return_arrival_time)&&o.return_date){const O=na(S);O&&Object.assign(S,O),S.return_origin||(S.return_origin=u||null),S.return_destination||(S.return_destination=m||null)}return S});_e(I)}else t.innerHTML=Ge()}catch(w){const M=String(w?.message||""),T=M.includes("HTTP 404");if(w?.name==="TypeError"||M.includes("Failed to fetch")||M.toLowerCase().includes("cors")||T){if(Ke()){const I=fa({...o,origin:m,destination:u});_e(I,{noticeHtml:`
                <div class="aviaframe-warning">
                  Demo mode: backend is currently not reachable from the browser (CORS/network), so test offers are shown for UI validation.
                </div>
              `}),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",w);return}t.innerHTML=`
            <div class="aviaframe-error">
              <strong>${R("error_title")}:</strong> Live search is temporarily unavailable. Please refresh and try again.
            </div>
          `;return}t.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${g(M)}
          </div>
        `}})}function ea(e){const a=String(e||"").trim().toUpperCase();return/^[A-Z0-9]{2,3}$/.test(a)?`https://pics.avs.io/200/80/${encodeURIComponent(a)}.png`:null}function ge(e){const a=String(e||"").trim(),t=a.match(/^(\d{4})-(\d{2})-(\d{2})$/),i=a.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/),r=Number(t?t[1]:i?i[3]:0),d=Number(t?t[2]:i?i[2]:0),n=Number(t?t[3]:i?i[1]:0),p=new Date(Date.UTC(r,d-1,n));return!r||p.getUTCFullYear()!==r||p.getUTCMonth()!==d-1||p.getUTCDate()!==n?"":`${String(r).padStart(4,"0")}-${String(d).padStart(2,"0")}-${String(n).padStart(2,"0")}`}function aa(e){const a=ge(e);if(!a)return String(e||"");const[t,i,r]=a.split("-");return`${r}.${i}.${t}`}function ta(e){const a=String(e||"").replace(/\D/g,"").slice(0,8);return[a.slice(0,2),a.slice(2,4),a.slice(4,8)].filter(Boolean).join(".")}function ve(e){const a={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,selected_at:new Date().toISOString()};localStorage.setItem("selectedOffer",JSON.stringify(a)),console.log("✅ Offer selected:",e.offer_id),window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:a},bubbles:!0}));const t=document.querySelector(".aviaframe-widget"),i=document.getElementById("aviaframe-results"),r=document.getElementById("aviaframe-search-form");if(!t){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a},bubbles:!0})),Y.checkoutUrl&&(window.location.href=Y.checkoutUrl);return}r&&(r.style.display="none"),i&&(i.style.display="none");const d=document.getElementById("aviaframe-passenger-step");d&&d.remove();const n=(e?.price||{}).currency||"SAR",p=te((e?.price||{}).total||0,n),y=e.airline_name||e.airline||"Airline",f=e.origin||"---",b=e.destination||"---",x=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",c=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A",s=document.createElement("div");s.id="aviaframe-passenger-step",s.className="aviaframe-passenger-step",s.innerHTML=`
        <div class="aviaframe-passenger-summary">
          <div>
            <div class="aviaframe-passenger-eyebrow">Selected Flight</div>
            <div class="aviaframe-passenger-route">${g(f)} → ${g(b)} <span class="aviaframe-passenger-airline">${g(y)}</span></div>
            <div class="aviaframe-passenger-timing">Departure: ${g(x)} | Arrival: ${g(c)}</div>
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
        </form>`,t.appendChild(s),window.scrollTo({top:0,behavior:"smooth"});const z=s.querySelector("#aviaframe-passenger-back"),m=s.querySelector("#aviaframe-passenger-form"),u=s.querySelector("#aviaframe-passenger-error"),E=m&&m.querySelector('input[name="dateOfBirth"]');if(E&&E.addEventListener("input",()=>{const C=ta(E.value);E.value!==C&&(E.value=C)}),z&&z.addEventListener("click",()=>{s.remove(),r&&(r.style.display=""),i&&(i.style.display="")}),m&&m.addEventListener("submit",C=>{C.preventDefault();const _=new FormData(m),o={firstName:String(_.get("firstName")||""),lastName:String(_.get("lastName")||""),email:String(_.get("email")||""),phone:String(_.get("phone")||""),gender:String(_.get("gender")||"male"),dateOfBirth:ge(_.get("dateOfBirth")),passportNumber:String(_.get("passportNumber")||""),passportExpiry:String(_.get("passportExpiry")||"")},l=new Date,h=new Date(`${o.dateOfBirth}T00:00:00`),D=new Date(h);if(!o.dateOfBirth||Number.isNaN(h.getTime())){u&&(u.textContent=N==="ar"?"أدخل تاريخ الميلاد بالصيغة يوم.شهر.سنة.":"Enter the date of birth as DD.MM.YYYY.",u.style.display="block");return}if(D.setFullYear(D.getFullYear()+18),D>l){u&&(u.textContent=N==="ar"?"يجب أن يكون عمر المسافر 18 عامًا على الأقل.":"Passenger must be at least 18 years old.",u.style.display="block");return}const w=(e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10),M=new Date(w+"T00:00:00"),T=new Date(M);T.setMonth(T.getMonth()+6);const I=new Date(o.passportExpiry+"T00:00:00");if(!o.passportExpiry||Number.isNaN(I.getTime())||I<T){u&&(u.textContent=N==="ar"?"يجب أن يكون جواز السفر صالحاً لمدة 6 أشهر على الأقل من تاريخ الرحلة.":"Passport must be valid for at least 6 months from the trip date.",u.style.display="block");return}u&&(u.style.display="none"),localStorage.setItem("passengerData",JSON.stringify(o)),window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a,passenger:o},bubbles:!0})),Y.checkoutUrl?window.location.href=Y.checkoutUrl:s.innerHTML='<div class="aviaframe-passenger-success"><h3>Passenger details saved</h3><p>Host app can continue booking via aviaframe:continueToBooking event.</p><button type="button" id="aviaframe-passenger-back2" class="aviaframe-passenger-button aviaframe-passenger-button--secondary">Back to search</button></div>',s.querySelector("#aviaframe-passenger-back2")&&s.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{s.remove(),r&&(r.style.display=""),i&&(i.style.display="")})}),m){const C=m.querySelector('input[name="email"]');if(C){let o=function(){const v=document.getElementById("aviaframe-widget");return v?String(v.dataset.agencyKey||v.dataset.agencyDomain||window.location.hostname||"default").trim():"default"},l=function(v){return`af_verified_profile:${o()}:${String(v).toLowerCase()}`},h=function(v){try{return localStorage.getItem(l(v))||""}catch{return""}},D=function(v,k){try{localStorage.setItem(l(v),k)}catch{}},w=function(v){try{localStorage.removeItem(l(v))}catch{}},M=function(){const v=m.querySelector("#_af_banner");v&&v.remove()},T=function(v){M();const k=C.closest("label");return k?k.insertAdjacentElement("afterend",v):m.insertBefore(v,m.firstChild),v},I=function(v){const k=N==="ar",P=v.first_name||"",L=document.getElementById("aviaframe-passenger-form")||m,$={phone:v.phone,gender:v.gender,dateOfBirth:v.date_of_birth,firstName:v.first_name,lastName:v.last_name},F={};Object.entries($).forEach(([B,V])=>{if(!V)return;const U=L.querySelector(`[name="${B}"]`);U&&(F[B]=U.value,U.value=B==="dateOfBirth"?aa(V):V,U.dispatchEvent(new Event("input",{bubbles:!0})),U.dispatchEvent(new Event("change",{bubbles:!0})))});const q=T(document.createElement("div"));q.id="_af_banner",q.className="aviaframe-passenger-autofill",q.innerHTML=`<span class="aviaframe-passenger-autofill-message">${k?"✓ تم تعبئة بياناتك المحفوظة":`✓ Prefilled your saved details${P?", "+g(P):""}`}</span><button type="button" id="_af_undo_btn" class="aviaframe-passenger-autofill-undo">${k?"تراجع":"Undo"}</button>`,q.querySelector("#_af_undo_btn").addEventListener("click",()=>{Object.entries(F).forEach(([B,V])=>{const U=L.querySelector(`[name="${B}"]`);U&&(U.value=V,U.dispatchEvent(new Event("input",{bubbles:!0})))}),q.remove()})},A=function(v){const k=N==="ar";return{TOO_MANY_REQUESTS:k?"محاولات كثيرة جداً. يرجى المحاولة لاحقاً.":"Too many attempts. Please try again later.",EMAIL_DELIVERY_FAILED:k?"تعذر إرسال الرمز. يرجى المحاولة مرة أخرى.":"Couldn't send the code. Please try again.",VERIFICATION_INCORRECT_CODE:k?"رمز غير صحيح. حاول مرة أخرى.":"Incorrect code. Please try again.",VERIFICATION_EXPIRED:k?"انتهت صلاحية هذا الرمز. أرسل رمزاً جديداً.":"This code expired. Send a new one.",VERIFICATION_TOO_MANY_ATTEMPTS:k?"محاولات غير صحيحة كثيرة جداً. أرسل رمزاً جديداً.":"Too many incorrect attempts. Send a new code.",VERIFICATION_NOT_REQUESTED:k?"يرجى طلب رمز جديد.":"Please request a new code."}[v]||(k?"حدث خطأ ما. يرجى المحاولة مرة أخرى.":"Something went wrong. Please try again.")},S=function(v,k,P){const L=N==="ar",$=T(document.createElement("div"));$.id="_af_banner",$.className="aviaframe-passenger-autofill",$.innerHTML=`
              <div class="aviaframe-passenger-autofill-row" style="flex:1 1 auto">
                <span class="aviaframe-passenger-autofill-message">${L?`أرسلنا رمزاً مكوناً من 6 أرقام إلى ${g(P)}`:`We sent a 6-digit code to ${g(P)}`}</span>
              </div>
              <div class="aviaframe-passenger-autofill-row">
                <input type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" id="_af_code_input" class="aviaframe-passenger-autofill-code-input" placeholder="${L?"أدخل الرمز":"Enter code"}" />
                <button type="button" id="_af_verify_btn" class="aviaframe-passenger-autofill-undo">${L?"تحقق":"Verify"}</button>
                <button type="button" id="_af_resend_btn" class="aviaframe-passenger-autofill-undo">${L?"إعادة الإرسال":"Resend"}</button>
                <button type="button" id="_af_close_btn" class="aviaframe-passenger-autofill-close" aria-label="${L?"إغلاق":"Dismiss"}">×</button>
              </div>`;const F=$.querySelector("#_af_code_input"),q=$.querySelector("#_af_verify_btn"),B=$.querySelector("#_af_resend_btn"),V=$.querySelector("#_af_close_btn");function U(j){const W=$.querySelector(".aviaframe-passenger-autofill-error");W&&W.remove();const K=document.createElement("span");K.className="aviaframe-passenger-autofill-error",K.textContent=j,$.appendChild(K)}function ke(){let j=30;B.disabled=!0,B.textContent=`${L?"إعادة الإرسال":"Resend"} (${j}s)`;const W=setInterval(()=>{if(j-=1,j<=0){clearInterval(W),B.disabled=!1,B.textContent=L?"إعادة الإرسال":"Resend";return}B.textContent=`${L?"إعادة الإرسال":"Resend"} (${j}s)`},1e3)}ke(),V.addEventListener("click",()=>$.remove()),B.addEventListener("click",async()=>{if(!B.disabled)try{const j=await fetch(`${v}/public/customer-profile/request-code`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${k}`},body:JSON.stringify({email:P})});if(!j.ok){const W=await j.json().catch(()=>({}));U(A(W?.error?.code));return}ke()}catch{U(A())}});async function Ae(){const j=F.value.trim();if(!/^\d{6}$/.test(j)){U(A("VERIFICATION_INCORRECT_CODE"));return}q.disabled=!0;try{const W=await fetch(`${v}/public/customer-profile/verify-code`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${k}`},body:JSON.stringify({email:P,code:j})}),K=await W.json().catch(()=>({}));if(!W.ok){q.disabled=!1,U(A(K?.error?.code));return}K.verified_token&&D(P,K.verified_token),K.found&&K.profile?I(K.profile):$.remove()}catch{q.disabled=!1,U(A())}}q.addEventListener("click",Ae),F.addEventListener("keydown",j=>{j.key==="Enter"&&(j.preventDefault(),Ae())})},O=function(v,k,P){const L=N==="ar",$=T(document.createElement("div"));$.id="_af_banner",$.className="aviaframe-passenger-autofill",$.innerHTML=`
              <span class="aviaframe-passenger-autofill-message">${L?"هل لديك بيانات محفوظة؟":"Have a saved profile?"}</span>
              <div class="aviaframe-passenger-autofill-row">
                <button type="button" id="_af_start_btn" class="aviaframe-passenger-autofill-undo">${L?"تعبئة بياناتي المحفوظة":"Autofill my details"}</button>
                <button type="button" id="_af_close_btn" class="aviaframe-passenger-autofill-close" aria-label="${L?"إغلاق":"Dismiss"}">×</button>
              </div>`,$.querySelector("#_af_close_btn").addEventListener("click",()=>$.remove()),$.querySelector("#_af_start_btn").addEventListener("click",async()=>{const F=$.querySelector("#_af_start_btn");F.disabled=!0,F.textContent=L?"جارٍ إرسال الرمز...":"Sending code...";try{const q=await fetch(`${v}/public/customer-profile/request-code`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${k}`},body:JSON.stringify({email:P})});if(!q.ok){const B=await q.json().catch(()=>({}));F.disabled=!1,F.textContent=L?"تعبئة بياناتي المحفوظة":"Autofill my details";const V=document.createElement("span");V.className="aviaframe-passenger-autofill-error",V.textContent=A(B?.error?.code),$.appendChild(V);return}S(v,k,P)}catch{F.disabled=!1,F.textContent=L?"تعبئة بياناتي المحفوظة":"Autofill my details"}})};const _=async()=>{const v=Date.now();return Y.widgetSessionToken&&Y.widgetSessionTokenExpiresAt>v+5e3?Y.widgetSessionToken:(Y.widgetSessionPromise||(Y.widgetSessionPromise=(async()=>{const k=document.getElementById("aviaframe-widget"),P=k&&k.dataset.apiUrl||"",L=k?String(k.dataset.agencyKey||"").trim():"",$=k?String(k.dataset.agencyDomain||"").trim():"";if(!P||!L&&!$&&!window.location.hostname)return null;const F=new URL(P).origin,q=await fetch(`${F}/api/widget/session`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({agency_key:L||void 0,agency_domain:L?void 0:$||window.location.hostname||void 0,origin_host:window.location.hostname||void 0})});if(!q.ok)return null;const B=await q.json().catch(()=>({})),V=String(B.widget_token||"").trim(),U=Math.max(parseInt(B.expires_in,10)||0,0);return V?(Y.widgetSessionToken=V,Y.widgetSessionTokenExpiresAt=Date.now()+U*1e3,V):null})().catch(()=>null).finally(()=>{Y.widgetSessionPromise=null})),Y.widgetSessionPromise)};C.addEventListener("blur",async function(){const v=this.value.trim();if(!(!v||!v.includes("@")))try{const k=document.getElementById("aviaframe-widget"),P=k&&k.dataset.apiUrl||"";if(!P)return;const L=new URL(P).origin,$=await _();if(!$)return;const F=h(v);if(F){const q=await fetch(`${L}/public/customer-profile?email=${encodeURIComponent(v)}&verified_token=${encodeURIComponent(F)}`,{headers:{Authorization:`Bearer ${$}`}});if(q.ok){const B=await q.json();B.found&&B.profile&&I(B.profile);return}w(v)}O(L,$,v)}catch{}})}}}function Z(e,a=0){const t=Number(e);return Number.isFinite(t)?t:a}function g(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function te(e,a){const t=String(a||"SAR").trim().toUpperCase(),i=/^[A-Z]{3}$/.test(t)?t:"SAR";let r;return window.AviaframeDisplayCurrency&&typeof window.AviaframeDisplayCurrency.formatAmount=="function"?r=window.AviaframeDisplayCurrency.formatAmount(e,i):r=`${Math.round(Z(e,0)).toLocaleString("en-US")} ${i}`,`<span class="_afp" data-a="${Number(e)||0}" data-c="${i}">${g(r)}</span>`}window.__aviaframeWidgetCurrencyRefresh=function(){document.querySelectorAll("._afp").forEach(function(e){const a=parseFloat(e.getAttribute("data-a")),t=e.getAttribute("data-c");!isNaN(a)&&window.AviaframeDisplayCurrency&&typeof window.AviaframeDisplayCurrency.formatAmount=="function"&&(e.textContent=window.AviaframeDisplayCurrency.formatAmount(a,t))})};function re(e){if(!e)return"--:--";const a=String(e).match(/T(\d{2}:\d{2})/);return a?a[1]:String(e)}function ie(e){return e?String(e).trim().toUpperCase():null}function ye(e){var a;return ie(e?.origin_code||((a=e?.departure_airport)==null?void 0:a.code)||e?.origin)}function be(e){var a;return ie(e?.destination_code||((a=e?.arrival_airport)==null?void 0:a.code)||e?.destination)}function ra(e){return e?.departure||[e?.departure_date,e?.departure_time].filter(Boolean).join("T")}function ia(e){return e?.arrival||[e?.arrival_date,e?.arrival_time].filter(Boolean).join("T")}function na(e){const a=Array.isArray(e?.segments)?e.segments:[];if(!a.length)return null;const t=ie(e?._searchOrigin||e?.origin),i=ie(e?._searchDestination||e?.destination);if(!t||!i)return null;let r=-1;for(let c=1;c<a.length;c+=1){const s=ye(a[c]),z=be(a[c]);if(s===i||z===t){r=c;break}}if(r<0)return null;const d=a.slice(r),n=d[0],p=d[d.length-1],y=ye(n)||i,f=be(p)||t,b=ra(n)||null,x=ia(p)||null;return!y||!f?null:{return_origin:y,return_destination:f,return_departure_time:b,return_arrival_time:x}}function oa(e){if(e.duration_minutes)return Z(e.duration_minutes,0);if(e.durationMinutes)return Z(e.durationMinutes,0);if(e.journey_time)return Math.round(Z(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const a=new Date(e.departure_time).getTime(),t=new Date(e.arrival_time).getTime();return!Number.isFinite(a)||!Number.isFinite(t)||t<=a?0:Math.round((t-a)/6e4)}function sa(e,a){if(!e||!a)return 0;const t=new Date(e).getTime(),i=new Date(a).getTime();return!Number.isFinite(t)||!Number.isFinite(i)||i<=t?0:Math.round((i-t)/6e4)}function he(e){const a=Z(e,0),t=Math.floor(a/60),i=a%60;return a<=0?"n/a":`${t}h ${i}m`}function da(e){return e.stops!==void 0?Z(e.stops,0):e.transfers_count!==void 0?Z(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function la(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function ca(e){const a=Array.isArray(e?.baggage)?e.baggage:[],t=a.find(r=>r?.type==="checked"),i=Number(t?.quantity);return Number.isFinite(i)?i:0}function pa(e){const a=ca(e);return a>1?$e("badge_checked_bags_included",{count:a}):a===1?R("badge_checked_bag_included"):e!=null&&e.with_baggage===!1?R("badge_no_checked_bag"):typeof e?.baggage_text=="string"&&e.baggage_text.trim()?e.baggage_text.trim():e!=null&&e.with_baggage?R("filter_with_baggage"):R("badge_no_checked_bag")}function ua(e){const a=(e.airline_code||e.airline||"").toString().trim();return a?a.slice(0,2).toUpperCase():"NA"}function ma(e){var a,t;const i=Z((a=e?.price)==null?void 0:a.total,0),r=((t=e?.price)==null?void 0:t.currency)||"SAR",d=da(e),n=Array.isArray(e?.segments)?e.segments.map(s=>{var z,m,u,E,C;return{origin:s?.origin||((z=s?.departure_city)==null?void 0:z.name)||((m=s?.departure_airport)==null?void 0:m.code)||"N/A",destination:s?.destination||((u=s?.arrival_city)==null?void 0:u.name)||((E=s?.arrival_airport)==null?void 0:E.code)||"N/A",departure:s?.departure||[s?.departure_date,s?.departure_time].filter(Boolean).join(" ")||"N/A",arrival:s?.arrival||[s?.arrival_date,s?.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((C=s?.carrier)==null?void 0:C.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:s?.flight_number||"N/A"}}):[],p=!!(e!=null&&e.return_origin&&e!=null&&e.return_destination||e!=null&&e.return_departure_time&&e!=null&&e.return_arrival_time),y=p?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",f=p?re(e.return_departure_time):"--:--",b=p?re(e.return_arrival_time):"--:--",x=p?sa(e.return_departure_time,e.return_arrival_time):0,c=p?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:ua(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:re(e.departure_time),arrive:re(e.arrival_time),durationMinutes:oa(e),stops:d,stopsText:la(d),priceTotal:i,priceCurrency:r,with_baggage:e.with_baggage===!0,baggageText:pa(e),segments:n,hasReturnData:p,returnRoute:y,returnDepart:f,returnArrive:b,returnDurationMinutes:x,returnSummary:c}}function fa(e){const a=e.origin||"WAW",t=e.destination||"YVR",i=e.depart_date||"2026-02-27",r=e.return_date||"",d=e.trip_type!=="one_way"&&!!r,n=(p,y,f,b=[])=>{const x=c=>({origin:c.from,destination:c.to,departure:c.depart,arrival:c.arrive,carrier:{airline_code:p,airline_name:y},flight_number:c.flight});return[...f.map(x),...b.map(x)]};return[{offer_id:"fallback_1",origin:a,destination:t,departure_time:`${i}T13:05:00`,arrival_time:`${i}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:d?t:null,return_destination:d?a:null,return_departure_time:d?`${r}T14:20:00`:null,return_arrival_time:d?`${r}T22:40:00`:null,segments:n("DL","DELTA",[{from:a,to:"CDG",depart:`${i}T13:05:00`,arrive:`${i}T16:10:00`,flight:"737"},{from:"CDG",to:t,depart:`${i}T17:05:00`,arrive:`${i}T23:25:00`,flight:"4200"}],d?[{from:t,to:"FRA",depart:`${r}T14:20:00`,arrive:`${r}T17:10:00`,flight:"9655"},{from:"FRA",to:a,depart:`${r}T18:30:00`,arrive:`${r}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"SAR"}},{offer_id:"fallback_2",origin:a,destination:t,departure_time:`${i}T08:10:00`,arrival_time:`${i}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:d?t:null,return_destination:d?a:null,return_departure_time:d?`${r}T09:00:00`:null,return_arrival_time:d?`${r}T20:30:00`:null,segments:n("LO","LOT",[{from:a,to:t,depart:`${i}T08:10:00`,arrive:`${i}T22:00:00`,flight:"441"}],d?[{from:t,to:a,depart:`${r}T09:00:00`,arrive:`${r}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"SAR"}},{offer_id:"fallback_3",origin:a,destination:t,departure_time:`${i}T06:45:00`,arrival_time:`${i}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:d?t:null,return_destination:d?a:null,return_departure_time:d?`${r}T07:10:00`:null,return_arrival_time:d?`${r}T19:55:00`:null,segments:n("AC","AIR CANADA",[{from:a,to:"MUC",depart:`${i}T06:45:00`,arrive:`${i}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${i}T11:50:00`,arrive:`${i}T14:50:00`,flight:"837"},{from:"YYZ",to:t,depart:`${i}T18:40:00`,arrive:`${i}T23:15:00`,flight:"835"}],d?[{from:t,to:"YYZ",depart:`${r}T07:10:00`,arrive:`${r}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${r}T12:00:00`,arrive:`${r}T16:00:00`,flight:"838"},{from:"MUC",to:a,depart:`${r}T17:20:00`,arrive:`${r}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"SAR"}}]}function _e(e,a={}){const t=document.getElementById("aviaframe-results"),i=e.map(ma).map((o,l)=>({...o,id:o.offer.offer_id||`offer_${l}`,airlineLogo:ea(o.carrierCode)})),r={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set,visibleCount:20},d=o=>r.quickFilter==="nonstop"?o.filter(l=>l.stops===0):r.quickFilter==="one_stop"?o.filter(l=>l.stops===1):r.quickFilter==="baggage"?o.filter(l=>l.with_baggage===!0):o,n=o=>{if(!o.length)return{count:0,minPrice:null,currency:null};const l=o.reduce((h,D)=>D.priceTotal<h.priceTotal?D:h,o[0]);return{count:o.length,minPrice:l.priceTotal,currency:l.priceCurrency||"SAR"}},p=()=>({all:n(i),nonstop:n(i.filter(o=>o.stops===0)),one_stop:n(i.filter(o=>o.stops===1)),baggage:n(i.filter(o=>o.with_baggage===!0))}),y=()=>{const o=d(i),l=new Map;return o.forEach(h=>{const D=h.carrierCode||"NA";if(!l.has(D))l.set(D,{code:D,name:h.airlineName||D,logo:h.airlineLogo,count:1,minPrice:h.priceTotal,currency:h.priceCurrency||"SAR"});else{const w=l.get(D);w.count+=1,h.priceTotal<w.minPrice&&(w.minPrice=h.priceTotal,w.currency=h.priceCurrency||w.currency)}}),Array.from(l.values()).sort((h,D)=>h.minPrice-D.minPrice)},f=o=>`
      <div class="aviaframe-details-panel">
        ${o.segments.length?o.segments.map(l=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${g(l.origin)} → ${g(l.destination)}</div>
            <div class="aviaframe-detail-meta">${g(l.departure)} → ${g(l.arrival)}</div>
            <div class="aviaframe-detail-meta">${g(l.airline)} • flight ${g(l.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${g(o.route)}</div>
            <div class="aviaframe-detail-meta">${g(o.depart)} → ${g(o.arrive)}</div>
          </div>
        `}
      </div>
    `,b=(o,l="")=>`
      <article class="aviaframe-flight-card ${l}" data-offer-id="${g(o.id)}">
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
              <div class="aviaframe-duration">${g(he(o.durationMinutes))} total travel time</div>
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
                <div class="aviaframe-duration">${g(he(o.returnDurationMinutes||o.durationMinutes))} total travel time</div>
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
          ${r.expandedIds.has(o.id)?f(o):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${g(o.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${te(o.priceTotal,o.priceCurrency)}</div>
          <button class="aviaframe-select-button" data-select-id="${g(o.id)}">Select</button>
        </aside>
      </article>
    `,x=()=>{let o=d(i);return r.selectedAirlines.size&&(o=o.filter(l=>r.selectedAirlines.has(l.carrierCode))),o=[...o],r.sort==="airline"?o.sort((l,h)=>l.airlineName.localeCompare(h.airlineName)):r.sort==="fastest"?o.sort((l,h)=>l.durationMinutes-h.durationMinutes):o.sort((l,h)=>l.priceTotal-h.priceTotal),o},c=(o,l,h)=>`
      <button type="button" class="aviaframe-quick-item ${r.quickFilter===o?"active":""}" data-quick="${o}">
        <div class="aviaframe-quick-title">${l}</div>
        <div class="aviaframe-quick-meta">${h.count} flights${h.minPrice!==null?` · from ${te(h.minPrice,h.currency||"SAR")}`:""}</div>
      </button>
    `,s=o=>o.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${o.map(l=>`
              <button type="button" class="aviaframe-airline-card ${r.selectedAirlines.has(l.code)?"active":""}" data-airline="${g(l.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${l.logo?`<img class="aviaframe-airline-logo-big" src="${l.logo}" alt="${g(l.name)}" onerror="this.style.display='none'">`:`<span>${g(l.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${g(l.name)}</div>
                <div class="aviaframe-airline-card-price">from ${te(l.minPrice,l.currency||"SAR")}</div>
                <div class="aviaframe-airline-card-count">${l.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",z=`
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
    `;t.innerHTML=z;const m=document.getElementById("aviaframe-cards-container"),u=document.getElementById("aviaframe-selected-flight"),E=document.getElementById("aviaframe-quick-grid"),C=document.getElementById("aviaframe-airline-filter-wrap"),_=()=>{const o=p();E.innerHTML=[c("all",R("filter_all"),o.all),c("nonstop",R("filter_nonstop"),o.nonstop),c("one_stop",R("filter_one_stop"),o.one_stop),c("baggage",R("filter_with_baggage"),o.baggage)].join("");const l=y();C.innerHTML=s(l);const h=x(),D=r.selectedId?h.find(S=>S.id===r.selectedId):null;u.innerHTML=D?`<div class="aviaframe-selected-title">Selected flight</div>${b(D,"selected")}`:"";const w=h.filter(S=>S.id!==r.selectedId),M=w.slice(0,r.visibleCount),T=w.length>r.visibleCount,I=(N||"en")==="ar"?"المزيد":"More";m.innerHTML=w.length?M.map(S=>b(S)).join("")+(T?`<div class="aviaframe-more-wrap"><button type="button" class="aviaframe-more-btn" id="aviaframe-more-btn">${I}</button></div>`:""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',t.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(S=>{S.addEventListener("click",()=>{const O=S.getAttribute("data-select-id"),v=i.find(k=>k.id===O);v&&(r.selectedId=O,ve(v.offer))})}),t.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(S=>{S.addEventListener("click",()=>{const O=S.getAttribute("data-details-id");r.expandedIds.has(O)?r.expandedIds.delete(O):r.expandedIds.add(O),_()})}),t.querySelectorAll("[data-quick]").forEach(S=>{S.addEventListener("click",()=>{r.quickFilter=S.getAttribute("data-quick"),r.visibleCount=20,_()})}),t.querySelectorAll("[data-airline]").forEach(S=>{S.addEventListener("click",()=>{const O=S.getAttribute("data-airline");r.selectedAirlines.has(O)?r.selectedAirlines.delete(O):r.selectedAirlines.add(O),r.visibleCount=20,_()})});const A=m.querySelector("#aviaframe-more-btn");A&&A.addEventListener("click",()=>{r.visibleCount+=20,_()})};t.querySelectorAll("[data-sort]").forEach(o=>{o.addEventListener("click",()=>{r.sort=o.getAttribute("data-sort"),r.visibleCount=20,t.querySelectorAll("[data-sort]").forEach(l=>l.classList.remove("active")),t.querySelectorAll(`[data-sort="${r.sort}"]`).forEach(l=>l.classList.add("active")),_()})}),_(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}const xe={en:["January","February","March","April","May","June","July","August","September","October","November","December"],ar:["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]},we={en:["Su","Mo","Tu","We","Th","Fr","Sa"],ar:["ح","ن","ث","ر","خ","ج","س"]},Se=[];function se(){const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function ga(e){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return"";const[a,t,i]=e.split("-");return`${i}/${t}/${a}`}function va(e){const a=document.createElement("div");a.className="wdp-wrapper",e.parentNode.insertBefore(a,e.nextSibling),e.style.display="none";const t=document.createElement("div");t.className="aviaframe-input wdp-trigger",t.setAttribute("tabindex","0"),t.setAttribute("role","button"),t.setAttribute("aria-haspopup","true"),t.innerHTML='<span class="wdp-display wdp-empty"></span><span class="wdp-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>',a.appendChild(t);const i=document.createElement("div");i.className="wdp-popup",i.style.display="none",i.innerHTML='<div class="wdp-header"><button class="wdp-nav wdp-prev" type="button">&#8249;</button><span class="wdp-month-label"></span><button class="wdp-nav wdp-next" type="button">&#8250;</button></div><div class="wdp-days-hdr"></div><div class="wdp-grid"></div>',a.appendChild(i);let r=!1,d,n;function p(){return N||"en"}function y(){const m=e.value;if(m&&/^\d{4}-\d{2}-\d{2}$/.test(m)){const[u,E]=m.split("-").map(Number);d=u,n=E-1}else{const u=e.getAttribute("min"),E=u&&/^\d{4}-\d{2}-\d{2}$/.test(u)?u:se(),[C,_]=E.split("-").map(Number);d=C,n=_-1}}function f(){const m=t.querySelector(".wdp-display"),u=ga(e.value);u?(m.textContent=u,m.classList.remove("wdp-empty")):(m.textContent="DD/MM/YYYY",m.classList.add("wdp-empty"))}function b(){const m=p(),u=xe[m]||xe.en,E=we[m]||we.en;i.querySelector(".wdp-month-label").textContent=`${u[n]} ${d}`;const C=i.querySelector(".wdp-days-hdr");C.innerHTML=E.map(T=>`<span class="wdp-dh">${T}</span>`).join("");const _=i.querySelector(".wdp-grid");_.innerHTML="";const o=new Date(d,n,1).getDay(),l=new Date(d,n+1,0).getDate(),h=e.getAttribute("min")||se(),D=e.getAttribute("max")||"",w=e.value||"",M=se();for(let T=0;T<o;T++){const I=document.createElement("span");_.appendChild(I)}for(let T=1;T<=l;T++){const I=`${d}-${String(n+1).padStart(2,"0")}-${String(T).padStart(2,"0")}`,A=document.createElement("button");A.type="button",A.textContent=T,A.className="wdp-day",I===w&&A.classList.add("wdp-day-selected"),I===M&&A.classList.add("wdp-day-today"),h&&I<h||D&&I>D?(A.disabled=!0,A.classList.add("wdp-day-disabled")):A.addEventListener("click",()=>{e.value=I,e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("input",{bubbles:!0})),f(),c()}),_.appendChild(A)}}function x(){y(),b(),i.style.display="block",r=!0,setTimeout(()=>document.addEventListener("click",s),0)}function c(){i.style.display="none",r=!1,document.removeEventListener("click",s)}function s(m){a.contains(m.target)||c()}return t.addEventListener("click",()=>{r?c():x()}),t.addEventListener("keydown",m=>{(m.key==="Enter"||m.key===" ")&&(m.preventDefault(),r?c():x()),m.key==="Escape"&&c()}),i.querySelector(".wdp-prev").addEventListener("click",m=>{m.stopPropagation(),n--,n<0&&(n=11,d--),b()}),i.querySelector(".wdp-next").addEventListener("click",m=>{m.stopPropagation(),n++,n>11&&(n=0,d++),b()}),e.classList.add.bind(e.classList),new MutationObserver(()=>{t.classList.toggle("aviaframe-input-invalid",e.classList.contains("aviaframe-input-invalid"))}).observe(e,{attributes:!0,attributeFilter:["class"]}),e.addEventListener("change",f),f(),{refresh(){f(),r&&b()}}}function ya(e){e.querySelectorAll('input[type="date"]').forEach(a=>{const t=va(a);Se.push(t)})}function ba(){Se.forEach(e=>e.refresh())}function de(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const a=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";Y.checkoutUrl=e.dataset.disableCheckoutRedirect==="true"?null:e.dataset.checkoutUrl||"/booking";const t=document.createElement("style");t.textContent=Je,document.head.appendChild(t),e.className="aviaframe-widget",e.innerHTML=Ze(),setTimeout(()=>{Xe(),ya(e),Q(N),ae("aviaframe-origin","aviaframe-origin-autocomplete",a),ae("aviaframe-destination","aviaframe-destination-autocomplete",a),ae("aviaframe-origin-2","aviaframe-origin-2-autocomplete",a),ae("aviaframe-destination-2","aviaframe-destination-2-autocomplete",a),Qe(a);const i=document.getElementById("aviaframe-lang-btn");i&&i.addEventListener("click",()=>Q(N==="en"?"ar":"en"))},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",de):de(),window.AviaframeWidget={init:de,setLang:Q,openPassengerStep:ve},window.__aviaLangToggle=()=>Q(N==="en"?"ar":"en")})()})()})();
