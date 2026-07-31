(function(){"use strict";(function(){(function(){const q={checkoutUrl:null},C={en:{title:"Flight Search",trip_return:"Return",trip_oneway:"One-way",trip_multi:"Multi-city",cabin_economy:"Economy",cabin_premium:"Premium Economy",cabin_business:"Business",cabin_first:"First Class",cabin_mixed:"Apply mixed classes",passenger_singular:"Passenger",passenger_plural:"Passengers",pax_adults:"Adults",pax_adults_sub:"Over 11",pax_children:"Children",pax_children_sub:"2–11",pax_infants:"Infants",pax_infants_sub:"Under 2",pax_cabin_bags:"Cabin baggage",pax_checked_bags:"Checked baggage",from_label:"From",to_label:"To",depart_date:"Departure Date",return_date:"Return Date",from_2:"From (2nd segment)",to_2:"To (2nd segment)",depart_date_2:"Departure Date (2nd segment)",search_btn:"Search Flights",error_title:"Error",error_select_airports:"Please select airports from the dropdown.",error_select_depart_date:"Please select departure date.",error_return_before_depart:"Return date must be the same as or later than the departure date. Please update your travel dates.",error_return_before_depart_inline:"Return date must be after departure.",error_multicity_missing:"For Multi-city please fill second segment: From, To and Date.",error_multicity_before_first:"The second segment date must be the same as or later than the first departure date.",error_multicity_before_first_inline:"Second segment date must be after first departure.",searching_flights:"Searching for flights...",no_results_title:"No flights found",no_results_body:"Try adjusting your search criteria.",sandbox_no_results_title:"No sandbox offers for this route or date",sandbox_no_results_body:"DRCT sandbox inventory is limited and does not mirror full live availability. Try another route or date, or use the production domain for live search results."},ar:{title:"البحث عن رحلات",trip_return:"ذهاب وإياب",trip_oneway:"ذهاب فقط",trip_multi:"متعدد المدن",cabin_economy:"الاقتصادية",cabin_premium:"الاقتصادية المميزة",cabin_business:"رجال الأعمال",cabin_first:"الدرجة الأولى",cabin_mixed:"تطبيق درجات مختلطة",passenger_singular:"مسافر",passenger_plural:"مسافرون",pax_adults:"البالغون",pax_adults_sub:"أكبر من 11",pax_children:"الأطفال",pax_children_sub:"2–11",pax_infants:"الرضّع",pax_infants_sub:"أقل من 2",pax_cabin_bags:"أمتعة المقصورة",pax_checked_bags:"الأمتعة المسجّلة",from_label:"من",to_label:"إلى",depart_date:"تاريخ المغادرة",return_date:"تاريخ العودة",from_2:"من (المقطع الثاني)",to_2:"إلى (المقطع الثاني)",depart_date_2:"تاريخ المغادرة (المقطع الثاني)",search_btn:"البحث عن رحلات",error_title:"خطأ",error_select_airports:"يرجى اختيار المطارات من القائمة المنسدلة.",error_select_depart_date:"يرجى اختيار تاريخ المغادرة.",error_return_before_depart:"يجب أن يكون تاريخ العودة في نفس يوم المغادرة أو بعده. يرجى تعديل تواريخ السفر.",error_return_before_depart_inline:"يجب أن يكون تاريخ العودة بعد المغادرة.",error_multicity_missing:"للرحلات متعددة المدن، يرجى استكمال المقطع الثاني: من وإلى والتاريخ.",error_multicity_before_first:"يجب أن يكون تاريخ المقطع الثاني في نفس يوم المقطع الأول أو بعده.",error_multicity_before_first_inline:"يجب أن يكون تاريخ المقطع الثاني بعد الأول.",searching_flights:"جارٍ البحث عن الرحلات...",no_results_title:"لم يتم العثور على رحلات",no_results_body:"يرجى تعديل معايير البحث والمحاولة مرة أخرى.",sandbox_no_results_title:"لا توجد عروض sandbox لهذا المسار أو التاريخ",sandbox_no_results_body:"مخزون DRCT في بيئة sandbox محدود ولا يعكس التوفر الكامل في البيئة الحية. جرّب مساراً أو تاريخاً آخر، أو استخدم نطاق الإنتاج لرؤية النتائج الحية."}};let D=(()=>{try{return localStorage.getItem("aviaframe-widget-lang")||"en"}catch{return"en"}})();function H(e,a){var u,s,S;if(a=a||document.getElementById("aviaframe-widget"),!a)return;D=e;try{localStorage.setItem("aviaframe-widget-lang",e)}catch{}const t=C[e]||C.en;a.setAttribute("dir",e==="ar"?"rtl":"ltr"),a.setAttribute("lang",e==="ar"?"ar":"en"),Ze(),a.querySelectorAll("[data-wi18n]").forEach(m=>{const p=m.getAttribute("data-wi18n");t[p]!==void 0&&(m.textContent=t[p])});const n=a.querySelector("#aviaframe-trip-type"),i=a.querySelector("#aviaframe-trip-label");if(n&&i){const m=n.value;i.textContent=m==="one_way"?t.trip_oneway:m==="multi_city"?t.trip_multi:t.trip_return}const l=a.querySelector("#aviaframe-cabin"),r=a.querySelector("#aviaframe-cabin-label");if(l&&r){const m={economy:t.cabin_economy,premium_economy:t.cabin_premium,business:t.cabin_business,first:t.cabin_first};r.textContent=m[l.value]||t.cabin_economy}const c=parseInt(((u=a.querySelector("#aviaframe-adults"))==null?void 0:u.value)||"1"),v=parseInt(((s=a.querySelector("#aviaframe-children"))==null?void 0:s.value)||"0"),f=parseInt(((S=a.querySelector("#aviaframe-infants"))==null?void 0:S.value)||"0"),g=c+v+f,_=a.querySelector("#aviaframe-passengers-label");_&&(_.textContent=`${g} ${g===1?t.passenger_singular:t.passenger_plural}`),a.querySelectorAll("#aviaframe-lang-btn .wlt-opt").forEach(m=>m.classList.toggle("wlt-active",m.getAttribute("data-wl")===e)),a.querySelector("#aviaframe-search-form")&&M(a)}function I(e){const a=C[D]||C.en;return a[e]!==void 0?a[e]:C.en[e]!==void 0?C.en[e]:e}function V(e,a,t){e&&(e.classList.add("aviaframe-input-invalid"),e.setAttribute("aria-invalid","true")),a&&(a.textContent=t||"",a.classList.toggle("visible",!!t))}function Z(e,a){e&&(e.classList.remove("aviaframe-input-invalid"),e.removeAttribute("aria-invalid")),a&&(a.textContent="",a.classList.remove("visible"))}function ce(e){e=e||document;const a=e.querySelector("#aviaframe-depart-date"),t=e.querySelector("#aviaframe-return-date"),n=e.querySelector("#aviaframe-depart-date-2");if(t&&a){const i=a.value||a.getAttribute("min")||"";i?t.setAttribute("min",i):t.removeAttribute("min")}if(n&&a){const i=a.value||a.getAttribute("min")||"";i?n.setAttribute("min",i):n.removeAttribute("min")}}function M(e){var c;e=e||document;const a=((c=e.querySelector("#aviaframe-trip-type"))==null?void 0:c.value)||"return",t=e.querySelector("#aviaframe-depart-date"),n=e.querySelector("#aviaframe-return-date"),i=e.querySelector("#aviaframe-depart-date-2"),l=e.querySelector("#aviaframe-return-date-error"),r=e.querySelector("#aviaframe-depart-date-2-error");if(ce(e),Z(n,l),Z(i,r),a==="return"&&t&&n&&t.value&&n.value&&n.value<t.value){const v=I("error_return_before_depart_inline");return V(n,l,v),{valid:!1,input:n,message:I("error_return_before_depart")}}if(a==="multi_city"&&t&&i&&t.value&&i.value&&i.value<t.value){const v=I("error_multicity_before_first_inline");return V(i,r,v),{valid:!1,input:i,message:I("error_multicity_before_first")}}return{valid:!0,input:null,message:""}}const pe=[{code:"LHR",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Heathrow",priority:1},{code:"CDG",city:"Paris",cityRu:"Париж",country:"France",name:"Charles de Gaulle",priority:1},{code:"FRA",city:"Frankfurt",cityRu:"Франкфурт",country:"Germany",name:"Frankfurt am Main",priority:1},{code:"AMS",city:"Amsterdam",cityRu:"Амстердам",country:"Netherlands",name:"Schiphol",priority:1},{code:"MAD",city:"Madrid",cityRu:"Мадрид",country:"Spain",name:"Adolfo Suárez",priority:1},{code:"BCN",city:"Barcelona",cityRu:"Барселона",country:"Spain",name:"El Prat",priority:2},{code:"FCO",city:"Rome",cityRu:"Рим",country:"Italy",name:"Fiumicino",priority:1},{code:"MXP",city:"Milan",cityRu:"Милан",country:"Italy",name:"Malpensa",priority:2},{code:"MUC",city:"Munich",cityRu:"Мюнхен",country:"Germany",name:"Franz Josef Strauss",priority:2},{code:"LGW",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Gatwick",priority:2},{code:"BRU",city:"Brussels",cityRu:"Брюссель",country:"Belgium",name:"Brussels Airport",priority:1},{code:"CRL",city:"Charleroi",cityRu:"Шарлеруа",country:"Belgium",name:"Brussels South",priority:2},{code:"VIE",city:"Vienna",cityRu:"Вена",country:"Austria",name:"Vienna International",priority:1},{code:"ZRH",city:"Zurich",cityRu:"Цюрих",country:"Switzerland",name:"Zurich Airport",priority:1},{code:"CPH",city:"Copenhagen",cityRu:"Копенгаген",country:"Denmark",name:"Kastrup",priority:1},{code:"OSL",city:"Oslo",cityRu:"Осло",country:"Norway",name:"Gardermoen",priority:1},{code:"ARN",city:"Stockholm",cityRu:"Стокгольм",country:"Sweden",name:"Arlanda",priority:1},{code:"HEL",city:"Helsinki",cityRu:"Хельсинки",country:"Finland",name:"Vantaa",priority:1},{code:"DUB",city:"Dublin",cityRu:"Дублин",country:"Ireland",name:"Dublin Airport",priority:1},{code:"LIS",city:"Lisbon",cityRu:"Лиссабон",country:"Portugal",name:"Portela",priority:1},{code:"ATH",city:"Athens",cityRu:"Афины",country:"Greece",name:"Eleftherios Venizelos",priority:1},{code:"IST",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Istanbul Airport",priority:1},{code:"SAW",city:"Istanbul",cityRu:"Стамбул",country:"Turkey",name:"Sabiha Gökçen",priority:2},{code:"KBP",city:"Kyiv",cityRu:"Киев",country:"Ukraine",name:"Boryspil",priority:1},{code:"WAW",city:"Warsaw",cityRu:"Варшава",country:"Poland",name:"Chopin",priority:1},{code:"PRG",city:"Prague",cityRu:"Прага",country:"Czech Republic",name:"Václav Havel",priority:1},{code:"BUD",city:"Budapest",cityRu:"Будапешт",country:"Hungary",name:"Ferenc Liszt",priority:1},{code:"DXB",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Dubai International",priority:1},{code:"DWC",city:"Dubai",cityRu:"Дубай",country:"UAE",name:"Al Maktoum",priority:2},{code:"AUH",city:"Abu Dhabi",cityRu:"Абу-Даби",country:"UAE",name:"Abu Dhabi International",priority:1},{code:"DOH",city:"Doha",cityRu:"Доха",country:"Qatar",name:"Hamad International",priority:1},{code:"BAH",city:"Bahrain",cityRu:"Бахрейн",country:"Bahrain",name:"Bahrain International",priority:1},{code:"RUH",city:"Riyadh",cityRu:"Эр-Рияд",country:"Saudi Arabia",name:"King Khalid",priority:1},{code:"JED",city:"Jeddah",cityRu:"Джидда",country:"Saudi Arabia",name:"King Abdulaziz",priority:2},{code:"BKK",city:"Bangkok",cityRu:"Бангкок",country:"Thailand",name:"Suvarnabhumi",priority:1},{code:"SIN",city:"Singapore",cityRu:"Сингапур",country:"Singapore",name:"Changi",priority:1},{code:"HKG",city:"Hong Kong",cityRu:"Гонконг",country:"Hong Kong",name:"Chek Lap Kok",priority:1},{code:"NRT",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Narita",priority:1},{code:"HND",city:"Tokyo",cityRu:"Токио",country:"Japan",name:"Haneda",priority:2},{code:"ICN",city:"Seoul",cityRu:"Сеул",country:"South Korea",name:"Incheon",priority:1},{code:"DEL",city:"Delhi",cityRu:"Дели",country:"India",name:"Indira Gandhi",priority:1},{code:"BOM",city:"Mumbai",cityRu:"Мумбаи",country:"India",name:"Chhatrapati Shivaji",priority:2},{code:"JFK",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"JFK",priority:1},{code:"EWR",city:"New York",cityRu:"Нью-Йорк",country:"USA",name:"Newark",priority:2},{code:"LAX",city:"Los Angeles",cityRu:"Лос-Анджелес",country:"USA",name:"Los Angeles Int'l",priority:1},{code:"ORD",city:"Chicago",cityRu:"Чикаго",country:"USA",name:"O'Hare",priority:1},{code:"MIA",city:"Miami",cityRu:"Майами",country:"USA",name:"Miami International",priority:1},{code:"YYZ",city:"Toronto",cityRu:"Торонто",country:"Canada",name:"Pearson",priority:1},{code:"MEX",city:"Mexico City",cityRu:"Мехико",country:"Mexico",name:"Benito Juarez",priority:1},{code:"LTN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Luton",priority:3},{code:"STN",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"Stansted",priority:4},{code:"LCY",city:"London",cityRu:"Лондон",country:"United Kingdom",name:"City Airport",priority:5},{code:"LIN",city:"Milan",cityRu:"Милан",country:"Italy",name:"Linate",priority:3},{code:"BGY",city:"Milan",cityRu:"Милан",country:"Italy",name:"Bergamo",priority:4},{code:"PMF",city:"Milan",cityRu:"Милан",country:"Italy",name:"Parma",priority:5},{code:"IMR",city:"Milan",cityRu:"Милан",country:"Italy",name:"Rogoredo Railway Station",priority:6},{code:"SVO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Sheremetyevo",priority:1},{code:"DME",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Domodedovo",priority:2},{code:"VKO",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Vnukovo",priority:3},{code:"ZIA",city:"Moscow",cityRu:"Москва",country:"Russia",name:"Zhukovsky",priority:4},{code:"LED",city:"Saint Petersburg",cityRu:"Санкт-Петербург",country:"Russia",name:"Pulkovo",priority:1},{code:"ALA",city:"Almaty",cityRu:"Алматы",country:"Kazakhstan",name:"Almaty International",priority:1},{code:"TAS",city:"Tashkent",cityRu:"Ташкент",country:"Uzbekistan",name:"Tashkent International",priority:1}],ue="aviaframe_ac_v4:",me=24*60*60*1e3,fe=3500,K={London:"LON",Milan:"MIL",Moscow:"MOW","Saint Petersburg":"SPT","New York":"NYC",Dubai:"DXB",Istanbul:"IST",Brussels:"BRU",Tokyo:"TYO"},ve={"United Kingdom":"GB",France:"FR",Germany:"DE",Netherlands:"NL",Spain:"ES",Italy:"IT",Belgium:"BE",Austria:"AT",Switzerland:"CH",Denmark:"DK",Norway:"NO",Sweden:"SE",Finland:"FI",Ireland:"IE",Portugal:"PT",Greece:"GR",Turkey:"TR",Ukraine:"UA",Poland:"PL","Czech Republic":"CZ",Hungary:"HU",UAE:"AE",Qatar:"QA",Bahrain:"BH","Saudi Arabia":"SA",Thailand:"TH",Singapore:"SG","Hong Kong":"HK",Japan:"JP","South Korea":"KR",India:"IN",USA:"US",Canada:"CA",Mexico:"MX",Russia:"RU",Kazakhstan:"KZ",Uzbekistan:"UZ"};function X(e){return ve[e]||String(e||"").slice(0,2).toUpperCase()}function Q(e){return String(e||"").replace(/\/+$/,"")}function N(e){return String(e||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function ge(e){const a=Q(e),t=[];return a&&(t.push(a),/\/search$/i.test(a)||t.push(`${a}/search`),a.includes("/api/drct/")?t.push(a.replace("/api/drct/","/api/n8n/webhook-test/drct/")):/\/api\/drct$/i.test(a)&&t.push(a.replace("/api/drct","/api/n8n/webhook-test/drct"))),[...new Set(t.filter(Boolean))]}function ye(e){const a=Q(e),t=new Set,n=i=>{i&&t.add(i)};if(a){/\/search$/i.test(a)&&n(a.replace(/\/search$/i,"/airports/autocomplete")),n(`${a}/airports/autocomplete`);const i=a.match(/^(https?:\/\/[^/]+)/i);i&&n(`${i[1]}/public/airports/autocomplete`)}return typeof window<"u"&&window.location&&n(`${window.location.origin}/public/airports/autocomplete`),[...t]}function be(e,a){return`${ue}${String(a).toLowerCase()}:${String(e||"").trim().toLowerCase()}`}function he(e){try{const a=localStorage.getItem(e);if(!a)return null;const t=JSON.parse(a);return!t||!t.cachedAt||Date.now()-t.cachedAt>me?(localStorage.removeItem(e),null):t.payload||null}catch{return null}}function xe(e){return!!(e&&e.source!=="fallback"&&Array.isArray(e.groups)&&e.groups.some(a=>Array.isArray(a.items)&&a.items.length>0))}function ee(e,a){if(xe(a))try{localStorage.setItem(e,JSON.stringify({cachedAt:Date.now(),payload:a}))}catch{}}function _e(e,a){const t=N(a),n=N(e.code),i=N(e.city),l=N(e.cityRu),r=N(e.name),c=N(e.country),v=N(K[e.city]||""),f=[n,i,l,r,c,v].filter(Boolean);if(!f.some(_=>_.includes(t)))return 0;let g=0;return(n===t||v===t)&&(g+=1600),(i===t||l===t)&&(g+=1500),r===t&&(g+=1400),c===t&&(g+=1200),(n.startsWith(t)||v.startsWith(t))&&(g+=1e3),(i.startsWith(t)||l.startsWith(t))&&(g+=950),r.startsWith(t)&&(g+=900),c.startsWith(t)&&(g+=500),i.split(/[\s-]+/).some(_=>_.startsWith(t))&&(g+=220),r.split(/[\s-]+/).some(_=>_.startsWith(t))&&(g+=180),f.some(_=>_.includes(t))&&(g+=120),g-(e.priority||999)}function we(e,a=12){const t=N(e);if(t.length<1)return[];const n=pe.map(r=>({airport:r,score:_e(r,t)})).filter(r=>r.score>0).sort((r,c)=>c.score-r.score||(r.airport.priority||999)-(c.airport.priority||999)||r.airport.city.localeCompare(c.airport.city)||r.airport.name.localeCompare(c.airport.name)).slice(0,Math.max(a*4,20)),i=new Map;for(const{airport:r,score:c}of n){const v=`${r.country}:${r.city}`;i.has(v)||i.set(v,{country_code:X(r.country),country_name:r.country,city_code:K[r.city]||r.code,city_name:r.city,airports:[],bestScore:0}),i.get(v).bestScore=Math.max(i.get(v).bestScore,c),i.get(v).airports.push({type:"airport",code:r.code,name:r.name,city_code:K[r.city]||r.code,city_name:r.city,country_code:X(r.country),country_name:r.country,priority:r.priority,score:c})}const l=new Map;for(const r of i.values()){const c=`${r.country_code}:${r.country_name}`;l.has(c)||l.set(c,{country_code:r.country_code,country_name:r.country_name,items:[],bestScore:0}),l.get(c).bestScore=Math.max(l.get(c).bestScore,r.bestScore);const v=r.airports.slice().sort((f,g)=>g.score-f.score||(f.priority||999)-(g.priority||999)||f.name.localeCompare(g.name)).map(f=>({type:"airport",code:f.code,name:f.name,city_code:f.city_code,city_name:f.city_name,country_code:f.country_code,country_name:f.country_name,score:f.score}));v.length>1?l.get(c).items.push({type:"city",code:r.city_code,name:r.city_name,city_code:r.city_code,city_name:r.city_name,country_code:r.country_code,country_name:r.country_name,airport_count:v.length,airports:v,score:r.bestScore}):v[0]&&l.get(c).items.push(v[0])}return Array.from(l.values()).sort((r,c)=>c.bestScore-r.bestScore||r.country_name.localeCompare(c.country_name)).map(r=>({...r,items:r.items.sort((c,v)=>(v.score||0)-(c.score||0)||(c.priority||999)-(v.priority||999)||String(c.city_name||c.name||"").localeCompare(String(v.city_name||v.name||"")))})).filter(r=>r.items.length>0)}function Ae(e,a=12){return we(e,a)}async function ke(e,a){const t=D==="ar"?"ar":"en",n=be(e,t),i=he(n);if(i)return i;const l=ye(a),r=`q=${encodeURIComponent(e)}&locale=${encodeURIComponent(t)}&limit=12`;for(const v of l){const f=new AbortController,g=setTimeout(()=>f.abort(),fe);try{const _=await fetch(`${v}?${r}`,{method:"GET",headers:{Accept:"application/json"},signal:f.signal});if(clearTimeout(g),!_.ok){if(_.status===404)continue;throw new Error(`autocomplete ${_.status}`)}const u=await _.json();if(u&&Array.isArray(u.groups)&&u.groups.some(s=>Array.isArray(s.items)&&s.items.length>0)){const s={...u,cached:!1};return ee(n,s),s}}catch{clearTimeout(g)}}const c={query:e,locale:t,source:"fallback",groups:Ae(e,12),cached:!1};return ee(n,c),c}function Se(e){const a=[],t=[];return(e.groups||[]).forEach(n=>{t.push(`<div class="aviaframe-autocomplete-group"><div class="aviaframe-autocomplete-group-header">${b(n.country_name)} (${b(n.country_code)})</div>${(n.items||[]).map(i=>{if(i.type==="city"){const r=(i.airports||[]).map(f=>String(f.code||"").trim()).filter(Boolean).join(","),c=a.length;a.push({label:`${i.city_name} (${i.code})`,code:i.code,airports:r,cityName:i.city_name});const v=(i.airports||[]).map(f=>{const g=a.length;return a.push({label:`${f.city_name} (${f.code})`,code:f.code,airports:"",cityName:f.city_name}),`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-child" data-index="${g}"><div><span class="aviaframe-airport-code">${b(f.code)}</span><span class="aviaframe-airport-city">${b(f.city_name)}</span></div><span class="aviaframe-airport-name">${b(f.name)}</span></div>`}).join("");return`<div class="aviaframe-autocomplete-item aviaframe-autocomplete-parent" data-index="${c}"><div><span class="aviaframe-airport-code">${b(i.code)}</span><span class="aviaframe-airport-city">${b(i.city_name)}</span></div><span class="aviaframe-airport-name">All airports${i.airport_count?` · ${b(String(i.airport_count))}`:""}</span></div>${v}`}const l=a.length;return a.push({label:`${i.city_name||i.name} (${i.code})`,code:i.code,airports:"",cityName:i.city_name||i.name}),`<div class="aviaframe-autocomplete-item" data-index="${l}"><div><span class="aviaframe-airport-code">${b(i.code)}</span><span class="aviaframe-airport-city">${b(i.city_name||i.name)}</span></div><span class="aviaframe-airport-name">${b(i.name)}, ${b(i.country_name)}</span></div>`}).join("")} </div>`)}),{html:t.join(""),items:a}}function ae(e,a,t){t&&(e.value=t.label,e.dataset.code=t.code||"",e.dataset.airports=t.airports||"",e.dataset.cityName=t.cityName||"",a.style.display="none")}function $e(e){delete e.dataset.code,delete e.dataset.airports,delete e.dataset.cityName}function Ee(e){const a=new Date(e),t=a.getFullYear(),n=String(a.getMonth()+1).padStart(2,"0"),i=String(a.getDate()).padStart(2,"0");return`${t}-${n}-${i}`}function Te(){return Ee(new Date)}function W(){return typeof window>"u"?{}:window.AVIAFRAME_RUNTIME_CONFIG||window.__AVIAFRAME_SITE_CONFIG__||{}}function Ie(){if(typeof window>"u")return!1;const e=String(window.location.hostname||"").toLowerCase();return e==="localhost"||e==="127.0.0.1"}function Le(){return!!W().allowDemoSearchFallback||Ie()}function te(){const e=W();return typeof e.searchIsSandbox=="boolean"?e.searchIsSandbox:/sandbox/i.test(String(e.environment||""))}function Ce(){const e=te()?I("sandbox_no_results_title"):I("no_results_title"),a=te()?I("sandbox_no_results_body"):I("no_results_body");return`
            <div class="aviaframe-no-results">
              <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${e}</div>
              <div>${a}</div>
            </div>
          `}const Re=`
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
    .wdp-day:hover:not(:disabled) { background: #eff6ff; color: #2563eb; }
    .wdp-day-today { font-weight: 700; color: #2563eb; }
    .wdp-day-selected { background: #2563eb !important; color: white !important; }
    .wdp-day-disabled { opacity: 0.3; cursor: not-allowed; }
  `;function De(){const e=Te();return`
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
    `}function Be(){var e;const a=Array.from(document.querySelectorAll(".aviaframe-dropdown")),t=()=>a.forEach(p=>p.classList.remove("open"));a.forEach(p=>{const k=p.querySelector(".aviaframe-dropdown-btn");k&&k.addEventListener("click",A=>{A.stopPropagation();const x=p.classList.contains("open");t(),x||p.classList.add("open")})}),document.addEventListener("click",p=>{p.target.closest(".aviaframe-dropdown")||t()});const n=document.getElementById("aviaframe-trip-type"),i=document.getElementById("aviaframe-trip-label"),l=(e=document.getElementById("aviaframe-return-date"))==null?void 0:e.closest(".aviaframe-field"),r=document.getElementById("aviaframe-multi-city-fields"),c=document.getElementById("aviaframe-depart-date"),v=document.getElementById("aviaframe-return-date"),f=document.getElementById("aviaframe-depart-date-2");document.querySelectorAll('input[name="aviaframe-trip"]').forEach(p=>{p.addEventListener("change",()=>{p.checked&&(n.value=p.value,i.textContent=p.value==="one_way"?(C[D]||C.en).trip_oneway:p.value==="multi_city"?(C[D]||C.en).trip_multi:(C[D]||C.en).trip_return,p.value==="one_way"?(l&&(l.style.display="none"),r&&(r.style.display="none")):p.value==="multi_city"?(l&&(l.style.display="none"),r&&(r.style.display="block")):(l&&(l.style.display="block"),r&&(r.style.display="none"))),M(document)})}),c&&c.addEventListener("change",()=>{M(document)}),v&&v.addEventListener("change",()=>{M(document)}),f&&f.addEventListener("change",()=>{M(document)}),M(document);const g=document.getElementById("aviaframe-cabin"),_=document.getElementById("aviaframe-cabin-label");document.querySelectorAll('input[name="aviaframe-cabin-class"]').forEach(p=>{p.addEventListener("change",()=>{p.checked&&(g.value=p.value,_.textContent=p.parentElement.textContent.trim())})});const u={adults:{min:1,max:9},children:{min:0,max:8},infants:{min:0,max:4},cabinBags:{min:0,max:9},checkedBags:{min:0,max:9}},s={adults:1,children:0,infants:0,cabinBags:0,checkedBags:0,childrenAges:[],infantAges:[]},S=()=>{document.getElementById("aviaframe-adults").value=s.adults,document.getElementById("aviaframe-children").value=s.children,document.getElementById("aviaframe-infants").value=s.infants,document.getElementById("aviaframe-cabin-bags").value=s.cabinBags,document.getElementById("aviaframe-checked-bags").value=s.checkedBags,document.getElementById("aviaframe-children-ages").value=JSON.stringify(s.childrenAges),document.getElementById("aviaframe-infant-ages").value=JSON.stringify(s.infantAges),document.getElementById("aviaframe-passengers-label").textContent=`${s.adults+s.children+s.infants} ${s.adults+s.children+s.infants===1?(C[D]||C.en).passenger_singular:(C[D]||C.en).passenger_plural}`},m=()=>{const p=document.getElementById("aviaframe-age-selectors");for(;s.childrenAges.length<s.children;)s.childrenAges.push(2);for(;s.childrenAges.length>s.children;)s.childrenAges.pop();for(;s.infantAges.length<s.infants;)s.infantAges.push(1);for(;s.infantAges.length>s.infants;)s.infantAges.pop();const k=s.childrenAges.map((x,o)=>`
        <div class="aviaframe-age-item">
          <label>Child ${o+1} age</label>
          <select data-age-type="child" data-age-index="${o}">
            ${Array.from({length:10},(d,y)=>y+2).map(d=>`<option value="${d}" ${d===x?"selected":""}>${d}</option>`).join("")}
          </select>
        </div>
      `).join(""),A=s.infantAges.map((x,o)=>`
        <div class="aviaframe-age-item">
          <label>Infant ${o+1} age</label>
          <select data-age-type="infant" data-age-index="${o}">
            ${Array.from({length:2},(d,y)=>y).map(d=>`<option value="${d}" ${d===x?"selected":""}>${d}</option>`).join("")}
          </select>
        </div>
      `).join("");p.innerHTML=k+A,p.querySelectorAll("select[data-age-type]").forEach(x=>{x.addEventListener("change",()=>{const o=x.getAttribute("data-age-type"),d=Number(x.getAttribute("data-age-index")),y=Number(x.value);o==="child"?s.childrenAges[d]=y:s.infantAges[d]=y,S()})}),S()};document.querySelectorAll(".aviaframe-step-btn[data-counter]").forEach(p=>{p.addEventListener("click",()=>{const k=p.getAttribute("data-counter"),A=Number(p.getAttribute("data-delta")),x=u[k];if(!x)return;const o=Math.max(x.min,Math.min(x.max,s[k]+A));s[k]=o;const d=document.getElementById(`aviaframe-count-${k}`);d&&(d.textContent=o),m()})}),m()}function F(e,a,t){const n=document.getElementById(e),i=document.getElementById(a);if(!n||!i)return;let l=-1,r=[],c=null,v=0;const f=()=>{i.style.display="none",r=[],l=-1},g=()=>{i.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach((u,s)=>{s===l?(u.classList.add("active"),u.scrollIntoView({block:"nearest"})):u.classList.remove("active")})},_=()=>{r.length?(i.querySelectorAll(".aviaframe-autocomplete-item[data-index]").forEach(u=>{u.addEventListener("mousedown",function(s){s.preventDefault();const S=Number(this.getAttribute("data-index")),m=r[S];ae(n,i,m)})}),i.style.display="block"):(i.innerHTML="",f())};n.addEventListener("input",function(){const u=this.value.trim();$e(n),c&&clearTimeout(c),u.length<1&&f(),u.length<1||(i.innerHTML='<div class="aviaframe-autocomplete-empty">Searching...</div>',i.style.display="block",c=setTimeout(async()=>{const s=++v;try{const S=await ke(u,t);if(s!==v)return;const m=Se(S);r=m.items,i.innerHTML=m.html||'<div class="aviaframe-autocomplete-empty">No airports found</div>',l=-1,_()}catch{r=[],i.innerHTML='<div class="aviaframe-autocomplete-empty">No airports found</div>',i.style.display="block"}},250))}),n.addEventListener("keydown",function(u){r.length&&(u.key==="ArrowDown"?(u.preventDefault(),l=Math.min(l+1,r.length-1),g()):u.key==="ArrowUp"?(u.preventDefault(),l=Math.max(l-1,0),g()):u.key==="Enter"&&l>=0?(u.preventDefault(),ae(n,i,r[l])):u.key==="Escape"&&f())}),document.addEventListener("click",function(u){!n.contains(u.target)&&!i.contains(u.target)&&f()})}function Me(e){const a=document.getElementById("aviaframe-search-form"),t=document.getElementById("aviaframe-results");a.addEventListener("submit",async function(n){var R;n.preventDefault();const i=document.getElementById("aviaframe-origin"),l=document.getElementById("aviaframe-destination"),r=document.getElementById("aviaframe-depart-date").value,c=document.getElementById("aviaframe-return-date").value,v=parseInt(document.getElementById("aviaframe-adults").value,10),f=parseInt(document.getElementById("aviaframe-children").value,10)||0,g=parseInt(document.getElementById("aviaframe-infants").value,10)||0,_=document.getElementById("aviaframe-trip-type").value||"return",u=document.getElementById("aviaframe-cabin").value,s=JSON.parse(document.getElementById("aviaframe-children-ages").value||"[]"),S=JSON.parse(document.getElementById("aviaframe-infant-ages").value||"[]"),m=i.dataset.code,p=l.dataset.code,k=i.dataset.airports||m,A=l.dataset.airports||p;if(!m||!p){t.innerHTML=`
          <div class="aviaframe-error">
            <strong>${I("error_title")}:</strong> ${I("error_select_airports")}
          </div>
        `;return}if(!r){t.innerHTML=`
          <div class="aviaframe-error">
            <strong>${I("error_title")}:</strong> ${I("error_select_depart_date")}
          </div>
        `;return}const x=M(document);if(!x.valid){t.innerHTML=`
          <div class="aviaframe-error">
            <strong>${I("error_title")}:</strong> ${x.message}
          </div>
        `,x.input&&x.input.focus();return}t.innerHTML=`
        <div class="aviaframe-loading">
          <div class="aviaframe-spinner"></div>
          <div>${I("searching_flights")}</div>
        </div>
      `;let o={origin:k,destination:A,origin_city:m,destination_city:p,depart_date:r,return_date:c||null,adults:v,children:f,infants:g,children_ages:s,infant_ages:S,cabin_class:u,trip_type:_};const d=W(),y=document.querySelector("[data-aviaframe-widget]")||document.getElementById("aviaframe-widget");if(Object.prototype.hasOwnProperty.call(d,"searchOriginHost")?d.searchOriginHost&&(o.origin_host=d.searchOriginHost):d.siteOriginHost&&(o.origin_host=d.siteOriginHost),(R=y==null?void 0:y.dataset)!=null&&R.agencyKey&&(o.agency_key=y.dataset.agencyKey),_==="one_way"&&(o.return_date=null),_==="multi_city"){const h=document.getElementById("aviaframe-origin-2"),w=document.getElementById("aviaframe-destination-2"),T=document.getElementById("aviaframe-depart-date-2").value,$=h==null?void 0:h.dataset.code,B=w==null?void 0:w.dataset.code,L=(h==null?void 0:h.dataset.airports)||$,O=(w==null?void 0:w.dataset.airports)||B;if(!$||!B||!T){t.innerHTML=`
            <div class="aviaframe-error">
              <strong>${I("error_title")}:</strong> ${I("error_multicity_missing")}
            </div>
          `;return}const j=M(document);if(!j.valid){t.innerHTML=`
            <div class="aviaframe-error">
              <strong>${I("error_title")}:</strong> ${j.message}
            </div>
          `,j.input&&j.input.focus();return}o.segments=[{origin:k,destination:A,origin_city:m,destination_city:p,depart_date:r},{origin:L,destination:O,origin_city:$,destination_city:B,depart_date:T}]}try{let h=null;const w=ge(e);for(const $ of w)if(h=await fetch($,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}),h.ok||h.status!==404)break;if(!h.ok)throw new Error(`HTTP ${h.status}: ${h.statusText}`);const T=await h.json();if(T.offers&&T.offers.length>0){const $=T.offers.map(B=>{const L={...B,_searchOrigin:(B==null?void 0:B._searchOrigin)||m||null,_searchDestination:(B==null?void 0:B._searchDestination)||p||null,_searchReturnDate:(B==null?void 0:B._searchReturnDate)||o.return_date||null};if(!(L!=null&&L.return_origin&&L!=null&&L.return_destination||L!=null&&L.return_departure_time&&L!=null&&L.return_arrival_time)&&o.return_date){const O=Fe(L);O&&Object.assign(L,O),L.return_origin||(L.return_origin=p||null),L.return_destination||(L.return_destination=m||null)}return L});oe($)}else t.innerHTML=Ce()}catch(h){const w=String((h==null?void 0:h.message)||""),T=w.includes("HTTP 404");if((h==null?void 0:h.name)==="TypeError"||w.includes("Failed to fetch")||w.toLowerCase().includes("cors")||T){if(Le()){const $=Ye({...o,origin:m,destination:p});oe($,{noticeHtml:`
                <div class="aviaframe-warning">
                  Demo mode: backend is currently not reachable from the browser (CORS/network), so test offers are shown for UI validation.
                </div>
              `}),console.warn("Aviaframe Widget: CORS/network error, showing fallback UI results",h);return}t.innerHTML=`
            <div class="aviaframe-error">
              <strong>${I("error_title")}:</strong> Live search is temporarily unavailable. Please refresh and try again.
            </div>
          `;return}t.innerHTML=`
          <div class="aviaframe-error">
            <strong>Error:</strong> ${w}
          </div>
        `}})}function Ne(e){return e?`https://pics.avs.io/200/80/${e}.png`:null}function ze(e){const a={offer_id:e.offer_id,price:e.price,origin:e.origin,destination:e.destination,departure_time:e.departure_time,arrival_time:e.arrival_time,airline_code:e.airline_code||e.airline,airline_name:e.airline_name,selected_at:new Date().toISOString()};localStorage.setItem("selectedOffer",JSON.stringify(a)),console.log("✅ Offer selected:",e.offer_id),window.dispatchEvent(new CustomEvent("aviaframe:offerSelected",{detail:{offer:a},bubbles:!0}));const t=document.querySelector(".aviaframe-widget"),n=document.getElementById("aviaframe-results"),i=document.getElementById("aviaframe-search-form");if(!t){window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a},bubbles:!0})),q.checkoutUrl&&(window.location.href=q.checkoutUrl);return}i&&(i.style.display="none"),n&&(n.style.display="none");const l=document.getElementById("aviaframe-passenger-step");l&&l.remove();const r=((e==null?void 0:e.price)||{}).currency||"UAH",c=Math.round(((e==null?void 0:e.price)||{}).total||0).toLocaleString("en-US"),v=e.airline_name||e.airline||"Airline",f=e.origin||"---",g=e.destination||"---",_=e.departure_time?String(e.departure_time).slice(0,16).replace("T"," "):"N/A",u=e.arrival_time?String(e.arrival_time).slice(0,16).replace("T"," "):"N/A",s=document.createElement("div");s.id="aviaframe-passenger-step",s.style.marginTop="16px",s.style.border="1px solid #d9e3f3",s.style.borderRadius="12px",s.style.padding="16px",s.style.background="#fff",s.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px"><div><div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.1">Selected Flight</div><div style="margin-top:8px;font-size:20px;font-weight:700;color:#1f2937">'+f+" → "+g+' <span style="font-size:18px;font-weight:600;color:#64748b">'+v+'</span></div><div style="margin-top:6px;font-size:16px;color:#475569">Departure: '+_+" | Arrival: "+u+'</div></div><div style="text-align:right"><div style="font-size:56px;line-height:1;font-weight:800;color:#2563eb">'+c+" "+r+'</div><div style="margin-top:6px;font-size:20px;color:#64748b">per person</div></div></div><div style="font-size:38px;font-weight:800;color:#0f172a;margin:16px 0 10px">Passenger Details</div><form id="aviaframe-passenger-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="grid-column:1 / -1;font-size:20px;font-weight:700;color:#1f2937;margin-top:2px">Contact Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Email Address *</span><input required type="email" name="email" placeholder="name@example.com" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Phone Number *</span><input required name="phone" placeholder="+971501234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1 / -1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1 / -1;font-size:20px;font-weight:700;color:#1f2937">Personal Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Gender *</span><select name="gender" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px"><option value="male">Male</option><option value="female">Female</option></select></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Date of Birth *</span><input required type="date" name="dateOfBirth" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">First Name *</span><input required name="firstName" placeholder="John" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Last Name *</span><input required name="lastName" placeholder="Doe" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div style="grid-column:1 / -1;height:1px;background:#e2e8f0;margin:6px 0"></div><div style="grid-column:1 / -1;font-size:20px;font-weight:700;color:#1f2937">Document Information</div><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Number *</span><input required name="passportNumber" placeholder="AB1234567" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><label style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:#334155;font-weight:600">Passport Expiry Date *</span><input required type="date" name="passportExpiry" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px" /></label><div id="aviaframe-passenger-error" style="grid-column:1 / -1;display:none;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px;font-size:14px;direction:ltr;unicode-bidi:isolate"></div><div style="grid-column:1 / -1;display:flex;justify-content:space-between;gap:10px;margin-top:6px"><button type="button" id="aviaframe-passenger-back" style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:600">Back</button><button type="submit" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer">Continue to booking</button></div></form>',t.appendChild(s),window.scrollTo({top:0,behavior:"smooth"});const S=s.querySelector("#aviaframe-passenger-back"),m=s.querySelector("#aviaframe-passenger-form"),p=s.querySelector("#aviaframe-passenger-error");S&&S.addEventListener("click",()=>{s.remove(),i&&(i.style.display=""),n&&(n.style.display="")}),m&&m.addEventListener("submit",k=>{k.preventDefault();const A=new FormData(m),x={firstName:String(A.get("firstName")||""),lastName:String(A.get("lastName")||""),email:String(A.get("email")||""),phone:String(A.get("phone")||""),gender:String(A.get("gender")||"male"),dateOfBirth:String(A.get("dateOfBirth")||""),passportNumber:String(A.get("passportNumber")||""),passportExpiry:String(A.get("passportExpiry")||"")},o=new Date,d=new Date(x.dateOfBirth),y=new Date(d);if(y.setFullYear(y.getFullYear()+18),!x.dateOfBirth||Number.isNaN(d.getTime())||y>o){p&&(p.textContent=D==="ar"?"يجب أن يكون عمر المسافر 18 عامًا على الأقل.":"Passenger must be at least 18 years old.",p.style.display="block");return}const E=(e.return_departure_time||"").slice(0,10)||(e.departure_time||"").slice(0,10)||new Date().toISOString().slice(0,10),R=new Date(E+"T00:00:00"),h=new Date(R);h.setMonth(h.getMonth()+6);const w=new Date(x.passportExpiry+"T00:00:00");if(!x.passportExpiry||Number.isNaN(w.getTime())||w<h){p&&(p.textContent=D==="ar"?"يجب أن يكون جواز السفر صالحاً لمدة 6 أشهر على الأقل من تاريخ الرحلة.":"Passport must be valid for at least 6 months from the trip date.",p.style.display="block");return}p&&(p.style.display="none"),localStorage.setItem("passengerData",JSON.stringify(x)),window.dispatchEvent(new CustomEvent("aviaframe:continueToBooking",{detail:{offer:a,passenger:x},bubbles:!0})),q.checkoutUrl?window.location.href=q.checkoutUrl:s.innerHTML='<div style="padding:10px 0"><div style="font-size:20px;font-weight:700;color:#166534;margin-bottom:6px">Passenger details saved</div><div style="font-size:14px;color:#374151">Host app can continue booking via aviaframe:continueToBooking event.</div><button type="button" id="aviaframe-passenger-back2" style="margin-top:12px;border:1px solid #d0d7e5;background:#f8fafc;border-radius:8px;padding:8px 12px;cursor:pointer">Back to search</button></div>',s.querySelector("#aviaframe-passenger-back2")&&s.querySelector("#aviaframe-passenger-back2").addEventListener("click",()=>{s.remove(),i&&(i.style.display=""),n&&(n.style.display="")})})}function z(e,a=0){const t=Number(e);return Number.isFinite(t)?t:a}function b(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Y(e,a){return`${Math.round(z(e,0)).toLocaleString("uk-UA")} ${a||"UAH"}`}function P(e){if(!e)return"--:--";const a=String(e).match(/T(\d{2}:\d{2})/);return a?a[1]:String(e)}function U(e){return e?String(e).trim().toUpperCase():null}function ie(e){var a;return U((e==null?void 0:e.origin_code)||((a=e==null?void 0:e.departure_airport)==null?void 0:a.code)||(e==null?void 0:e.origin))}function re(e){var a;return U((e==null?void 0:e.destination_code)||((a=e==null?void 0:e.arrival_airport)==null?void 0:a.code)||(e==null?void 0:e.destination))}function qe(e){return(e==null?void 0:e.departure)||[e==null?void 0:e.departure_date,e==null?void 0:e.departure_time].filter(Boolean).join("T")}function He(e){return(e==null?void 0:e.arrival)||[e==null?void 0:e.arrival_date,e==null?void 0:e.arrival_time].filter(Boolean).join("T")}function Fe(e){const a=Array.isArray(e==null?void 0:e.segments)?e.segments:[];if(!a.length)return null;const t=U((e==null?void 0:e._searchOrigin)||(e==null?void 0:e.origin)),n=U((e==null?void 0:e._searchDestination)||(e==null?void 0:e.destination));if(!t||!n)return null;let i=-1;for(let u=1;u<a.length;u+=1){const s=ie(a[u]),S=re(a[u]);if(s===n||S===t){i=u;break}}if(i<0)return null;const l=a.slice(i),r=l[0],c=l[l.length-1],v=ie(r)||n,f=re(c)||t,g=qe(r)||null,_=He(c)||null;return!v||!f?null:{return_origin:v,return_destination:f,return_departure_time:g,return_arrival_time:_}}function Pe(e){if(e.duration_minutes)return z(e.duration_minutes,0);if(e.durationMinutes)return z(e.durationMinutes,0);if(e.journey_time)return Math.round(z(e.journey_time,0)/60);if(!e.departure_time||!e.arrival_time)return 0;const a=new Date(e.departure_time).getTime(),t=new Date(e.arrival_time).getTime();return!Number.isFinite(a)||!Number.isFinite(t)||t<=a?0:Math.round((t-a)/6e4)}function Ue(e,a){if(!e||!a)return 0;const t=new Date(e).getTime(),n=new Date(a).getTime();return!Number.isFinite(t)||!Number.isFinite(n)||n<=t?0:Math.round((n-t)/6e4)}function ne(e){const a=z(e,0),t=Math.floor(a/60),n=a%60;return a<=0?"n/a":`${t}h ${n}m`}function Oe(e){return e.stops!==void 0?z(e.stops,0):e.transfers_count!==void 0?z(e.transfers_count,0):Array.isArray(e.segments)&&e.segments.length>0?Math.max(e.segments.length-1,0):0}function je(e){return e<=0?"Non-stop":e===1?"1 stop":`${e} stops`}function Ke(e){const a=(e.airline_code||e.airline||"").toString().trim();return a?a.slice(0,2).toUpperCase():"NA"}function We(e){var a,t;const n=z((a=e==null?void 0:e.price)==null?void 0:a.total,0),i=((t=e==null?void 0:e.price)==null?void 0:t.currency)||"UAH",l=Oe(e),r=Array.isArray(e==null?void 0:e.segments)?e.segments.map(s=>{var S,m,p,k,A;return{origin:(s==null?void 0:s.origin)||((S=s==null?void 0:s.departure_city)==null?void 0:S.name)||((m=s==null?void 0:s.departure_airport)==null?void 0:m.code)||"N/A",destination:(s==null?void 0:s.destination)||((p=s==null?void 0:s.arrival_city)==null?void 0:p.name)||((k=s==null?void 0:s.arrival_airport)==null?void 0:k.code)||"N/A",departure:(s==null?void 0:s.departure)||[s==null?void 0:s.departure_date,s==null?void 0:s.departure_time].filter(Boolean).join(" ")||"N/A",arrival:(s==null?void 0:s.arrival)||[s==null?void 0:s.arrival_date,s==null?void 0:s.arrival_time].filter(Boolean).join(" ")||"N/A",airline:((A=s==null?void 0:s.carrier)==null?void 0:A.airline_name)||e.airline_name||e.airline||"Unknown",flightNumber:(s==null?void 0:s.flight_number)||"N/A"}}):[],c=!!(e!=null&&e.return_origin&&e!=null&&e.return_destination||e!=null&&e.return_departure_time&&e!=null&&e.return_arrival_time),v=c?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"}`:"",f=c?P(e.return_departure_time):"--:--",g=c?P(e.return_arrival_time):"--:--",_=c?Ue(e.return_departure_time,e.return_arrival_time):0,u=c?`${e.return_origin||e.destination||"---"} → ${e.return_destination||e.origin||"---"} • ${e.return_departure_time||e._searchReturnDate||"n/a"}`:"";return{offer:e,carrierCode:Ke(e),airlineName:e.airline_name||e.airline||"Unknown",route:`${e.origin||"---"} → ${e.destination||"---"}`,depart:P(e.departure_time),arrive:P(e.arrival_time),durationMinutes:Pe(e),stops:l,stopsText:je(l),priceTotal:n,priceCurrency:i,with_baggage:e.with_baggage===!0,baggageText:e.baggage_text||(e.with_baggage?"With baggage":"No baggage"),segments:r,hasReturnData:c,returnRoute:v,returnDepart:f,returnArrive:g,returnDurationMinutes:_,returnSummary:u}}function Ye(e){const a=e.origin||"WAW",t=e.destination||"YVR",n=e.depart_date||"2026-02-27",i=e.return_date||"",l=e.trip_type!=="one_way"&&!!i,r=(c,v,f,g=[])=>{const _=u=>({origin:u.from,destination:u.to,departure:u.depart,arrival:u.arrive,carrier:{airline_code:c,airline_name:v},flight_number:u.flight});return[...f.map(_),...g.map(_)]};return[{offer_id:"fallback_1",origin:a,destination:t,departure_time:`${n}T13:05:00`,arrival_time:`${n}T23:25:00`,airline_code:"DL",airline_name:"DELTA",with_baggage:!1,stops:1,duration_minutes:860,return_origin:l?t:null,return_destination:l?a:null,return_departure_time:l?`${i}T14:20:00`:null,return_arrival_time:l?`${i}T22:40:00`:null,segments:r("DL","DELTA",[{from:a,to:"CDG",depart:`${n}T13:05:00`,arrive:`${n}T16:10:00`,flight:"737"},{from:"CDG",to:t,depart:`${n}T17:05:00`,arrive:`${n}T23:25:00`,flight:"4200"}],l?[{from:t,to:"FRA",depart:`${i}T14:20:00`,arrive:`${i}T17:10:00`,flight:"9655"},{from:"FRA",to:a,depart:`${i}T18:30:00`,arrive:`${i}T22:40:00`,flight:"988"}]:[]),price:{total:62727,currency:"UAH"}},{offer_id:"fallback_2",origin:a,destination:t,departure_time:`${n}T08:10:00`,arrival_time:`${n}T22:00:00`,airline_code:"LO",airline_name:"LOT",with_baggage:!0,stops:0,duration_minutes:830,return_origin:l?t:null,return_destination:l?a:null,return_departure_time:l?`${i}T09:00:00`:null,return_arrival_time:l?`${i}T20:30:00`:null,segments:r("LO","LOT",[{from:a,to:t,depart:`${n}T08:10:00`,arrive:`${n}T22:00:00`,flight:"441"}],l?[{from:t,to:a,depart:`${i}T09:00:00`,arrive:`${i}T20:30:00`,flight:"442"}]:[]),price:{total:67100,currency:"UAH"}},{offer_id:"fallback_3",origin:a,destination:t,departure_time:`${n}T06:45:00`,arrival_time:`${n}T23:15:00`,airline_code:"AC",airline_name:"AIR CANADA",with_baggage:!0,stops:2,duration_minutes:910,return_origin:l?t:null,return_destination:l?a:null,return_departure_time:l?`${i}T07:10:00`:null,return_arrival_time:l?`${i}T19:55:00`:null,segments:r("AC","AIR CANADA",[{from:a,to:"MUC",depart:`${n}T06:45:00`,arrive:`${n}T10:00:00`,flight:"33"},{from:"MUC",to:"YYZ",depart:`${n}T11:50:00`,arrive:`${n}T14:50:00`,flight:"837"},{from:"YYZ",to:t,depart:`${n}T18:40:00`,arrive:`${n}T23:15:00`,flight:"835"}],l?[{from:t,to:"YYZ",depart:`${i}T07:10:00`,arrive:`${i}T10:10:00`,flight:"836"},{from:"YYZ",to:"MUC",depart:`${i}T12:00:00`,arrive:`${i}T16:00:00`,flight:"838"},{from:"MUC",to:a,depart:`${i}T17:20:00`,arrive:`${i}T19:55:00`,flight:"1615"}]:[]),price:{total:70886,currency:"UAH"}}]}function oe(e,a={}){const t=document.getElementById("aviaframe-results"),n=e.map(We).map((o,d)=>({...o,id:o.offer.offer_id||`offer_${d}`,airlineLogo:Ne(o.carrierCode)})),i={sort:"price",quickFilter:"all",selectedAirlines:new Set,selectedId:null,expandedIds:new Set},l=o=>i.quickFilter==="nonstop"?o.filter(d=>d.stops===0):i.quickFilter==="one_stop"?o.filter(d=>d.stops===1):i.quickFilter==="baggage"?o.filter(d=>d.with_baggage===!0):o,r=o=>{if(!o.length)return{count:0,minPrice:null,currency:null};const d=o.reduce((y,E)=>E.priceTotal<y.priceTotal?E:y,o[0]);return{count:o.length,minPrice:d.priceTotal,currency:d.priceCurrency||"SAR"}},c=()=>({all:r(n),nonstop:r(n.filter(o=>o.stops===0)),one_stop:r(n.filter(o=>o.stops===1)),baggage:r(n.filter(o=>o.with_baggage===!0))}),v=()=>{const o=l(n),d=new Map;return o.forEach(y=>{const E=y.carrierCode||"NA";if(!d.has(E))d.set(E,{code:E,name:y.airlineName||E,logo:y.airlineLogo,count:1,minPrice:y.priceTotal,currency:y.priceCurrency||"SAR"});else{const R=d.get(E);R.count+=1,y.priceTotal<R.minPrice&&(R.minPrice=y.priceTotal,R.currency=y.priceCurrency||R.currency)}}),Array.from(d.values()).sort((y,E)=>y.minPrice-E.minPrice)},f=o=>`
      <div class="aviaframe-details-panel">
        ${o.segments.length?o.segments.map(d=>`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${b(d.origin)} → ${b(d.destination)}</div>
            <div class="aviaframe-detail-meta">${b(d.departure)} → ${b(d.arrival)}</div>
            <div class="aviaframe-detail-meta">${b(d.airline)} • flight ${b(d.flightNumber)}</div>
          </div>
        `).join(""):`
          <div class="aviaframe-detail-leg">
            <div class="aviaframe-detail-route">${b(o.route)}</div>
            <div class="aviaframe-detail-meta">${b(o.depart)} → ${b(o.arrive)}</div>
          </div>
        `}
      </div>
    `,g=(o,d="")=>`
      <article class="aviaframe-flight-card ${d}" data-offer-id="${b(o.id)}">
        <div class="aviaframe-flight-main">
          <div class="aviaframe-segment">
            <div>
              <div class="aviaframe-airline-header">
                ${o.airlineLogo?`<img class="aviaframe-airline-logo" src="${o.airlineLogo}" alt="${b(o.airlineName)}" onerror="this.style.display='none'">`:""}
                <div class="aviaframe-airline">${b(o.airlineName)}</div>
              </div>
              <div class="aviaframe-class">Economy class</div>
            </div>
            <div>
              <div class="aviaframe-time">${b(o.depart)} - ${b(o.arrive)}</div>
              <div class="aviaframe-duration">${b(ne(o.durationMinutes))} total travel time</div>
            </div>
            <div>
              <div class="aviaframe-route">${b(o.route)}</div>
              <div class="aviaframe-transfer">${b(o.stopsText)}</div>
            </div>
          </div>
          ${o.hasReturnData?`
            <div class="aviaframe-segment">
              <div>
                <div class="aviaframe-airline-header">
                  ${o.airlineLogo?`<img class="aviaframe-airline-logo" src="${o.airlineLogo}" alt="${b(o.airlineName)}" onerror="this.style.display='none'">`:""}
                  <div class="aviaframe-airline">${b(o.airlineName)}</div>
                </div>
                <div class="aviaframe-class">Economy class</div>
              </div>
              <div>
                <div class="aviaframe-time">${b(o.returnDepart)} - ${b(o.returnArrive)}</div>
                <div class="aviaframe-duration">${b(ne(o.returnDurationMinutes||o.durationMinutes))} total travel time</div>
              </div>
              <div>
                <div class="aviaframe-route">${b(o.returnRoute)}</div>
                <div class="aviaframe-transfer">${b(o.stopsText)}</div>
              </div>
            </div>
          `:""}
          <div class="aviaframe-card-actions">
            <button type="button" class="aviaframe-details-toggle" data-details-id="${b(o.id)}">
              ${i.expandedIds.has(o.id)?"Hide details":"Details"}
            </button>
          </div>
          ${i.expandedIds.has(o.id)?f(o):""}
        </div>
        <aside class="aviaframe-price-col">
          <div class="aviaframe-baggage">${b(o.baggageText||"No baggage")}</div>
          <div class="aviaframe-flight-price">${b(Y(o.priceTotal,o.priceCurrency))}</div>
          <button class="aviaframe-select-button" data-select-id="${b(o.id)}">Select</button>
        </aside>
      </article>
    `,_=()=>{let o=l(n);return i.selectedAirlines.size&&(o=o.filter(d=>i.selectedAirlines.has(d.carrierCode))),o=[...o],i.sort==="airline"?o.sort((d,y)=>d.airlineName.localeCompare(y.airlineName)):i.sort==="fastest"?o.sort((d,y)=>d.durationMinutes-y.durationMinutes):o.sort((d,y)=>d.priceTotal-y.priceTotal),o},u=(o,d,y)=>`
      <button type="button" class="aviaframe-quick-item ${i.quickFilter===o?"active":""}" data-quick="${o}">
        <div class="aviaframe-quick-title">${d}</div>
        <div class="aviaframe-quick-meta">${y.count} flights${y.minPrice!==null?` · from ${Y(y.minPrice,y.currency||"SAR")}`:""}</div>
      </button>
    `,s=o=>o.length?`
        <section class="aviaframe-airline-filter">
          <div class="aviaframe-airline-filter-title">Filter by airline</div>
          <div class="aviaframe-airline-grid">
            ${o.map(d=>`
              <button type="button" class="aviaframe-airline-card ${i.selectedAirlines.has(d.code)?"active":""}" data-airline="${b(d.code)}">
                <div class="aviaframe-airline-card-logo">
                  ${d.logo?`<img class="aviaframe-airline-logo-big" src="${d.logo}" alt="${b(d.name)}" onerror="this.style.display='none'">`:`<span>${b(d.code)}</span>`}
                </div>
                <div class="aviaframe-airline-card-name">${b(d.name)}</div>
                <div class="aviaframe-airline-card-price">from ${b(Y(d.minPrice,d.currency||"SAR"))}</div>
                <div class="aviaframe-airline-card-count">${d.count} flights</div>
              </button>
            `).join("")}
          </div>
        </section>
      `:"",S=`
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
    `;t.innerHTML=S;const m=document.getElementById("aviaframe-cards-container"),p=document.getElementById("aviaframe-selected-flight"),k=document.getElementById("aviaframe-quick-grid"),A=document.getElementById("aviaframe-airline-filter-wrap"),x=()=>{const o=c();k.innerHTML=[u("all","All",o.all),u("nonstop","Non-stop",o.nonstop),u("one_stop","1 stop",o.one_stop),u("baggage","With baggage",o.baggage)].join("");const d=v();A.innerHTML=s(d);const y=_(),E=i.selectedId?y.find(h=>h.id===i.selectedId):null;p.innerHTML=E?`<div class="aviaframe-selected-title">Selected flight</div>${g(E,"selected")}`:"";const R=y.filter(h=>h.id!==i.selectedId);m.innerHTML=R.length?R.map(h=>g(h)).join(""):'<div class="aviaframe-no-results">No offers found for current sort/filter settings.</div>',t.querySelectorAll(".aviaframe-select-button[data-select-id]").forEach(h=>{h.addEventListener("click",()=>{const w=h.getAttribute("data-select-id"),T=n.find($=>$.id===w);T&&(i.selectedId=w,ze(T.offer))})}),t.querySelectorAll(".aviaframe-details-toggle[data-details-id]").forEach(h=>{h.addEventListener("click",()=>{const w=h.getAttribute("data-details-id");i.expandedIds.has(w)?i.expandedIds.delete(w):i.expandedIds.add(w),x()})}),t.querySelectorAll("[data-quick]").forEach(h=>{h.addEventListener("click",()=>{i.quickFilter=h.getAttribute("data-quick"),x()})}),t.querySelectorAll("[data-airline]").forEach(h=>{h.addEventListener("click",()=>{const w=h.getAttribute("data-airline");i.selectedAirlines.has(w)?i.selectedAirlines.delete(w):i.selectedAirlines.add(w),x()})})};t.querySelectorAll("[data-sort]").forEach(o=>{o.addEventListener("click",()=>{i.sort=o.getAttribute("data-sort"),t.querySelectorAll("[data-sort]").forEach(d=>d.classList.remove("active")),t.querySelectorAll(`[data-sort="${i.sort}"]`).forEach(d=>d.classList.add("active")),x()})}),x(),document.dispatchEvent(new CustomEvent("aviaframe:results",{detail:{offers:e}}))}const se={en:["January","February","March","April","May","June","July","August","September","October","November","December"],ar:["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]},le={en:["Su","Mo","Tu","We","Th","Fr","Sa"],ar:["ح","ن","ث","ر","خ","ج","س"]},de=[];function G(){const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function Ge(e){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return"";const[a,t,n]=e.split("-");return`${n}/${t}/${a}`}function Je(e){const a=document.createElement("div");a.className="wdp-wrapper",e.parentNode.insertBefore(a,e.nextSibling),e.style.display="none";const t=document.createElement("div");t.className="aviaframe-input wdp-trigger",t.setAttribute("tabindex","0"),t.setAttribute("role","button"),t.setAttribute("aria-haspopup","true"),t.innerHTML='<span class="wdp-display wdp-empty"></span><span class="wdp-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>',a.appendChild(t);const n=document.createElement("div");n.className="wdp-popup",n.style.display="none",n.innerHTML='<div class="wdp-header"><button class="wdp-nav wdp-prev" type="button">&#8249;</button><span class="wdp-month-label"></span><button class="wdp-nav wdp-next" type="button">&#8250;</button></div><div class="wdp-days-hdr"></div><div class="wdp-grid"></div>',a.appendChild(n);let i=!1,l,r;function c(){return D||"en"}function v(){const m=e.value;if(m&&/^\d{4}-\d{2}-\d{2}$/.test(m)){const[p,k]=m.split("-").map(Number);l=p,r=k-1}else{const p=e.getAttribute("min"),k=p&&/^\d{4}-\d{2}-\d{2}$/.test(p)?p:G(),[A,x]=k.split("-").map(Number);l=A,r=x-1}}function f(){const m=t.querySelector(".wdp-display"),p=Ge(e.value);p?(m.textContent=p,m.classList.remove("wdp-empty")):(m.textContent="DD/MM/YYYY",m.classList.add("wdp-empty"))}function g(){const m=c(),p=se[m]||se.en,k=le[m]||le.en;n.querySelector(".wdp-month-label").textContent=`${p[r]} ${l}`;const A=n.querySelector(".wdp-days-hdr");A.innerHTML=k.map(w=>`<span class="wdp-dh">${w}</span>`).join("");const x=n.querySelector(".wdp-grid");x.innerHTML="";const o=new Date(l,r,1).getDay(),d=new Date(l,r+1,0).getDate(),y=e.getAttribute("min")||G(),E=e.getAttribute("max")||"",R=e.value||"",h=G();for(let w=0;w<o;w++){const T=document.createElement("span");x.appendChild(T)}for(let w=1;w<=d;w++){const T=`${l}-${String(r+1).padStart(2,"0")}-${String(w).padStart(2,"0")}`,$=document.createElement("button");$.type="button",$.textContent=w,$.className="wdp-day",T===R&&$.classList.add("wdp-day-selected"),T===h&&$.classList.add("wdp-day-today"),y&&T<y||E&&T>E?($.disabled=!0,$.classList.add("wdp-day-disabled")):$.addEventListener("click",()=>{e.value=T,e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("input",{bubbles:!0})),f(),u()}),x.appendChild($)}}function _(){v(),g(),n.style.display="block",i=!0,setTimeout(()=>document.addEventListener("click",s),0)}function u(){n.style.display="none",i=!1,document.removeEventListener("click",s)}function s(m){a.contains(m.target)||u()}return t.addEventListener("click",()=>{i?u():_()}),t.addEventListener("keydown",m=>{(m.key==="Enter"||m.key===" ")&&(m.preventDefault(),i?u():_()),m.key==="Escape"&&u()}),n.querySelector(".wdp-prev").addEventListener("click",m=>{m.stopPropagation(),r--,r<0&&(r=11,l--),g()}),n.querySelector(".wdp-next").addEventListener("click",m=>{m.stopPropagation(),r++,r>11&&(r=0,l++),g()}),e.classList.add.bind(e.classList),new MutationObserver(()=>{t.classList.toggle("aviaframe-input-invalid",e.classList.contains("aviaframe-input-invalid"))}).observe(e,{attributes:!0,attributeFilter:["class"]}),e.addEventListener("change",f),f(),{refresh(){f(),i&&g()}}}function Ve(e){e.querySelectorAll('input[type="date"]').forEach(a=>{const t=Je(a);de.push(t)})}function Ze(){de.forEach(e=>e.refresh())}function J(){const e=document.getElementById("aviaframe-widget");if(!e){console.error('Aviaframe Widget: Container element not found. Add <div id="aviaframe-widget"></div> to your page.');return}const a=e.dataset.apiUrl||"http://localhost:5678/webhook/drct/search";q.checkoutUrl=e.dataset.checkoutUrl||"/booking";const t=document.createElement("style");t.textContent=Re,document.head.appendChild(t),e.className="aviaframe-widget",e.innerHTML=De(),setTimeout(()=>{Be(),Ve(e),H(D),F("aviaframe-origin","aviaframe-origin-autocomplete",a),F("aviaframe-destination","aviaframe-destination-autocomplete",a),F("aviaframe-origin-2","aviaframe-origin-2-autocomplete",a),F("aviaframe-destination-2","aviaframe-destination-2-autocomplete",a),Me(a);const n=document.getElementById("aviaframe-lang-btn");n&&n.addEventListener("click",()=>H(D==="en"?"ar":"en"))},0)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",J):J(),window.AviaframeWidget={init:J,setLang:H},window.__aviaLangToggle=()=>H(D==="en"?"ar":"en")})()})()})();
