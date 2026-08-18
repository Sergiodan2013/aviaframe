const escapeXml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const toSvgDataUri = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const buildSceneMarkup = ({ scene, accent = '#ffffff' }) => {
  switch (scene) {
    case 'bangkok':
      return `
        <g fill="rgba(30,18,8,0.52)">
          <rect x="186" y="394" width="204" height="116" rx="12"/>
          <rect x="230" y="332" width="118" height="72" rx="10"/>
          <path d="M290 218 L332 332 H248 Z"/>
          <path d="M290 176 L314 248 H266 Z"/>
          <path d="M430 278 L474 392 H386 Z"/>
          <path d="M134 300 L178 392 H90 Z"/>
          <rect x="554" y="312" width="66" height="210" rx="8"/>
          <rect x="982" y="292" width="78" height="220" rx="8"/>
        </g>`;
    case 'manila':
      return `
        <ellipse cx="822" cy="510" rx="278" ry="48" fill="rgba(255,255,255,0.12)"/>
        <g fill="rgba(11,20,44,0.52)">
          <rect x="566" y="252" width="98" height="260" rx="8"/>
          <rect x="680" y="318" width="76" height="194" rx="8"/>
          <rect x="770" y="278" width="126" height="234" rx="8"/>
          <rect x="912" y="332" width="64" height="180" rx="8"/>
          <rect x="990" y="292" width="92" height="220" rx="8"/>
        </g>
        <path d="M670 522 C752 470 856 470 954 522" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity="0.9"/>`;
    case 'paris':
      return `
        <g fill="rgba(30,10,28,0.52)">
          <path d="M842 166 L904 514 H780 Z"/>
          <rect x="818" y="252" width="108" height="18" rx="9"/>
          <rect x="800" y="328" width="146" height="18" rx="9"/>
          <rect x="836" y="514" width="38" height="56" rx="8"/>
          <rect x="686" y="356" width="72" height="156" rx="8"/>
          <rect x="950" y="372" width="82" height="140" rx="8"/>
        </g>`;
    case 'prague':
      return `
        <path d="M600 470 C668 426 748 422 842 470" fill="none" stroke="rgba(44,25,13,0.62)" stroke-width="24" stroke-linecap="round"/>
        <g fill="rgba(44,25,13,0.52)">
          <rect x="654" y="238" width="54" height="274" rx="8"/>
          <path d="M681 184 L714 238 H648 Z"/>
          <rect x="934" y="268" width="58" height="244" rx="8"/>
          <path d="M962 212 L998 268 H926 Z"/>
          <rect x="746" y="338" width="158" height="174" rx="8"/>
        </g>`;
    case 'zurich':
      return `
        <path d="M546 470 L690 244 L814 470 Z" fill="rgba(18,34,46,0.54)"/>
        <path d="M706 470 L860 208 L1024 470 Z" fill="rgba(11,24,36,0.6)"/>
        <path d="M574 470 L690 298 L780 470 Z" fill="rgba(255,255,255,0.18)"/>
        <path d="M732 470 L860 254 L958 470 Z" fill="rgba(255,255,255,0.14)"/>
        <ellipse cx="864" cy="532" rx="242" ry="34" fill="rgba(255,255,255,0.16)"/>`;
    case 'cairo':
      return `
        <circle cx="1014" cy="176" r="58" fill="rgba(255,222,148,0.22)"/>
        <g fill="rgba(60,34,8,0.56)">
          <path d="M676 500 L818 258 L950 500 Z"/>
          <path d="M842 500 L956 314 L1068 500 Z"/>
          <rect x="582" y="410" width="64" height="90" rx="8"/>
        </g>`;
    case 'istanbul':
      return `
        <g fill="rgba(18,32,54,0.56)">
          <ellipse cx="836" cy="410" rx="124" ry="62"/>
          <ellipse cx="770" cy="452" rx="72" ry="38"/>
          <ellipse cx="904" cy="452" rx="76" ry="40"/>
          <rect x="724" y="452" width="230" height="78" rx="12"/>
          <rect x="702" y="252" width="18" height="278" rx="9"/>
          <rect x="972" y="224" width="18" height="306" rx="9"/>
          <path d="M711 218 L732 252 H690 Z"/>
          <path d="M981 190 L1002 224 H960 Z"/>
        </g>`;
    case 'delhi':
      return `
        <g fill="rgba(62,28,10,0.56)">
          <rect x="738" y="300" width="208" height="212" rx="12"/>
          <path d="M812 300 L812 254 Q842 224 872 254 L872 300 Z"/>
          <path d="M776 384 Q842 330 908 384 L908 444 Q842 492 776 444 Z"/>
          <rect x="838" y="206" width="10" height="94" rx="5"/>
        </g>`;
    case 'dhaka':
      return `
        <ellipse cx="860" cy="528" rx="248" ry="34" fill="rgba(255,255,255,0.14)"/>
        <g fill="rgba(8,48,36,0.56)">
          <rect x="632" y="292" width="118" height="220" rx="8"/>
          <rect x="770" y="342" width="82" height="170" rx="8"/>
          <rect x="872" y="254" width="136" height="258" rx="8"/>
          <path d="M1048 502 C1012 468 956 466 916 502 C954 512 1010 514 1048 502 Z"/>
        </g>`;
    case 'kuala-lumpur':
      return `
        <g fill="rgba(18,26,48,0.58)">
          <rect x="742" y="170" width="56" height="344" rx="12"/>
          <rect x="836" y="170" width="56" height="344" rx="12"/>
          <rect x="764" y="260" width="106" height="18" rx="9"/>
          <path d="M770 170 L798 108 L826 170 Z"/>
          <path d="M864 170 L892 108 L920 170 Z"/>
          <rect x="946" y="314" width="92" height="200" rx="10"/>
        </g>`;
    case 'singapore':
      return `
        <g fill="rgba(10,42,54,0.58)">
          <rect x="688" y="250" width="70" height="262" rx="16"/>
          <rect x="786" y="224" width="72" height="288" rx="16"/>
          <rect x="886" y="248" width="70" height="264" rx="16"/>
          <path d="M662 228 C748 178 900 176 982 226 L952 258 L690 258 Z"/>
          <ellipse cx="1020" cy="508" rx="102" ry="26" fill="rgba(255,255,255,0.16)"/>
        </g>`;
    case 'jeddah':
      return `
        <ellipse cx="880" cy="536" rx="272" ry="34" fill="rgba(255,255,255,0.16)"/>
        <path d="M948 514 Q970 334 996 214 Q1022 334 1044 514" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="16" stroke-linecap="round"/>
        <g fill="rgba(12,54,66,0.56)">
          <rect x="644" y="320" width="102" height="192" rx="10"/>
          <rect x="764" y="272" width="84" height="240" rx="10"/>
          <rect x="1084" y="296" width="76" height="216" rx="10"/>
        </g>`;
    case 'riyadh':
      return `
        <g fill="rgba(28,16,56,0.58)">
          <path d="M836 184 L918 184 L958 514 L796 514 Z"/>
          <path d="M862 184 L890 126 L918 184 Z"/>
          <rect x="708" y="324" width="88" height="190" rx="10"/>
          <rect x="972" y="292" width="104" height="222" rx="10"/>
        </g>`;
    case 'dubai':
      return `
        <g fill="rgba(34,18,8,0.6)">
          <path d="M870 118 L896 514 L842 514 Z"/>
          <path d="M898 160 L930 514 L884 514 Z"/>
          <rect x="736" y="286" width="82" height="228" rx="10"/>
          <rect x="958" y="250" width="96" height="264" rx="10"/>
          <rect x="1080" y="326" width="70" height="188" rx="10"/>
        </g>`;
    case 'jakarta':
      return `
        <g fill="rgba(56,16,28,0.58)">
          <rect x="854" y="246" width="24" height="266" rx="12"/>
          <path d="M866 176 L904 246 H828 Z"/>
          <rect x="736" y="320" width="88" height="192" rx="10"/>
          <rect x="914" y="294" width="118" height="218" rx="10"/>
        </g>`;
    case 'casablanca':
      return `
        <ellipse cx="954" cy="536" rx="264" ry="30" fill="rgba(255,255,255,0.16)"/>
        <g fill="rgba(10,46,42,0.58)">
          <rect x="822" y="276" width="188" height="236" rx="12"/>
          <rect x="910" y="164" width="26" height="348" rx="12"/>
          <path d="M923 130 L946 164 H900 Z"/>
          <rect x="742" y="356" width="64" height="156" rx="10"/>
        </g>`;
    case 'baku':
      return `
        <g fill="rgba(44,26,10,0.58)">
          <path d="M764 514 Q758 324 806 232 Q832 186 858 232 Q900 322 894 514 Z"/>
          <path d="M874 514 Q866 304 926 206 Q952 166 980 214 Q1022 298 1016 514 Z"/>
          <path d="M970 514 Q966 352 1010 286 Q1036 250 1062 286 Q1098 338 1094 514 Z"/>
        </g>`;
    case 'tbilisi':
      return `
        <path d="M678 446 C752 410 842 410 926 446" fill="none" stroke="rgba(48,22,62,0.62)" stroke-width="18" stroke-linecap="round"/>
        <g fill="rgba(48,22,62,0.56)">
          <rect x="726" y="314" width="72" height="198" rx="10"/>
          <rect x="812" y="272" width="62" height="240" rx="10"/>
          <rect x="890" y="336" width="84" height="176" rx="10"/>
          <path d="M710 286 L824 230" stroke="${accent}" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.85"/>
        </g>`;
    default:
      return `
        <g fill="rgba(7,15,35,0.46)">
          <rect x="74" y="338" width="76" height="220" rx="6"/>
          <rect x="158" y="296" width="88" height="262" rx="6"/>
          <rect x="260" y="362" width="64" height="196" rx="6"/>
          <rect x="342" y="270" width="102" height="288" rx="6"/>
          <rect x="462" y="330" width="70" height="228" rx="6"/>
          <rect x="548" y="242" width="116" height="316" rx="6"/>
          <rect x="682" y="352" width="58" height="206" rx="6"/>
          <rect x="756" y="286" width="98" height="272" rx="6"/>
          <rect x="868" y="334" width="82" height="224" rx="6"/>
          <rect x="968" y="254" width="124" height="304" rx="6"/>
        </g>`;
  }
};

const buildDestinationSvgDataUri = ({ city, country, price, accent = '#ffffff', skyStart, skyEnd, landmark = '', scene = 'generic' }) => {
  const safeCity = escapeXml(city);
  const safeCountry = escapeXml(country);
  const safePrice = escapeXml(String(price));
  const safeLandmark = escapeXml(landmark);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${safeCity}, ${safeCountry}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${skyStart}"/>
          <stop offset="100%" stop-color="${skyEnd}"/>
        </linearGradient>
        <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.32)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0.12)"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="675" rx="0" fill="url(#bg)"/>
      <circle cx="992" cy="118" r="88" fill="rgba(255,255,255,0.16)"/>
      <circle cx="1040" cy="172" r="42" fill="rgba(255,255,255,0.10)"/>
      <path d="M0 452 C174 387 286 383 432 426 C558 463 679 482 816 438 C924 402 1045 365 1200 408 L1200 675 L0 675 Z" fill="rgba(255,255,255,0.08)"/>
      <path d="M0 520 C189 466 353 470 512 512 C664 552 845 565 1012 511 C1083 487 1147 474 1200 478 L1200 675 L0 675 Z" fill="rgba(0,0,0,0.18)"/>
      ${buildSceneMarkup({ scene, accent })}
      <g>
        <rect x="54" y="58" width="470" height="172" rx="28" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)"/>
        <text x="86" y="118" fill="#ffffff" font-size="30" font-family="Arial, sans-serif" font-weight="700" opacity="0.92">${safeCountry}</text>
        <text x="84" y="176" fill="#ffffff" font-size="64" font-family="Arial, sans-serif" font-weight="800">${safeCity}</text>
        <text x="86" y="214" fill="#ffffff" font-size="24" font-family="Arial, sans-serif" opacity="0.88">from SAR ${safePrice}</text>
      </g>
      <g>
        <rect x="54" y="571" width="245" height="54" rx="27" fill="${accent}"/>
        <text x="177" y="606" text-anchor="middle" fill="#08203a" font-size="24" font-family="Arial, sans-serif" font-weight="800">Search Flights</text>
      </g>
      <text x="1135" y="616" text-anchor="end" fill="rgba(255,255,255,0.76)" font-size="30" font-family="Arial, sans-serif" font-weight="700">${safeLandmark}</text>
      <text x="1135" y="648" text-anchor="end" fill="rgba(255,255,255,0.66)" font-size="18" font-family="Arial, sans-serif">AviaFrame destination preset</text>
    </svg>
  `.trim();

  return toSvgDataUri(svg);
};

const PRESET_SEED = [
  {
    id: "dubai-uae",
    countryKey: "uae",
    country: "UAE",
    city: "Dubai",
    price: "309",
    landmark: "Downtown Dubai",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-dubai-uae.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Flynas",
  },
  {
    id: "doha-qatar",
    countryKey: "qatar",
    country: "Qatar",
    city: "Doha",
    price: "410",
    landmark: "West Bay",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-doha-qatar.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-27",
    price_channel: "Flynas",
  },
  {
    id: "muscat-oman",
    countryKey: "oman",
    country: "Oman",
    city: "Muscat",
    price: "591",
    landmark: "Mutrah",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-muscat-oman.png",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "istanbul-turkey",
    countryKey: "turkey",
    country: "Turkey",
    city: "Istanbul",
    price: "401",
    landmark: "Bosphorus",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-istanbul-turkey.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-27",
    price_channel: "Pegasus",
  },
  {
    id: "trabzon-turkey",
    countryKey: "turkey",
    country: "Turkey",
    city: "Trabzon",
    price: "519",
    landmark: "Black Sea Coast",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-trabzon-turkey.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Flynas",
  },
  {
    id: "antalya-turkey",
    countryKey: "turkey",
    country: "Turkey",
    city: "Antalya",
    price: "553",
    landmark: "Old Harbour",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-antalya-turkey.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-27",
    price_channel: "Pegasus",
  },
  {
    id: "tbilisi-georgia",
    countryKey: "georgia",
    country: "Georgia",
    city: "Tbilisi",
    price: "660",
    landmark: "Old Tbilisi",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-tbilisi-georgia.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-27",
    price_channel: "Flynas",
  },
  {
    id: "baku-azerbaijan",
    countryKey: "azerbaijan",
    country: "Azerbaijan",
    city: "Baku",
    price: "489",
    landmark: "Flame Towers",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-baku-azerbaijan.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Flynas",
  },
  {
    id: "yerevan-armenia",
    countryKey: "armenia",
    country: "Armenia",
    city: "Yerevan",
    price: "766",
    landmark: "Cascade",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-yerevan-armenia.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Air Arabia UAE",
  },
  {
    id: "delhi-india",
    countryKey: "india",
    country: "India",
    city: "Delhi",
    price: "570",
    landmark: "New Delhi",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-delhi-india.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-27",
    price_channel: "Air Arabia UAE",
  },
  {
    id: "mumbai-india",
    countryKey: "india",
    country: "India",
    city: "Mumbai",
    price: "430",
    landmark: "Marine Drive",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-mumbai-india.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-27",
    price_channel: "Flynas",
  },
  {
    id: "colombo-sri-lanka",
    countryKey: "sri-lanka",
    country: "Sri Lanka",
    city: "Colombo",
    price: "664",
    landmark: "Galle Face",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-colombo-sri-lanka.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-27",
    price_channel: "Air Arabia UAE",
  },
  {
    id: "dhaka-bangladesh",
    countryKey: "bangladesh",
    country: "Bangladesh",
    city: "Dhaka",
    price: "616",
    landmark: "Old Dhaka",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-dhaka-bangladesh.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Air Arabia UAE",
  },
  {
    id: "kathmandu-nepal",
    countryKey: "nepal",
    country: "Nepal",
    city: "Kathmandu",
    price: "692",
    landmark: "Kathmandu Valley",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-kathmandu-nepal.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Air Arabia UAE",
  },
  {
    id: "bangkok-thailand",
    countryKey: "thailand",
    country: "Thailand",
    city: "Bangkok",
    price: "815",
    landmark: "Sukhumvit Skyline",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-bangkok-thailand.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "phuket-thailand",
    countryKey: "thailand",
    country: "Thailand",
    city: "Phuket",
    price: "904",
    landmark: "Patong Coast",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-phuket-thailand.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "kuala-lumpur-malaysia",
    countryKey: "malaysia",
    country: "Malaysia",
    city: "Kuala Lumpur",
    price: "957",
    landmark: "Petronas Towers",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-kuala-lumpur-malaysia.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "singapore-singapore",
    countryKey: "singapore",
    country: "Singapore",
    city: "Singapore",
    price: "765",
    landmark: "Marina Bay",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-singapore-singapore.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "manila-philippines",
    countryKey: "philippines",
    country: "Philippines",
    city: "Manila",
    price: "1212",
    landmark: "Manila Bay",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-manila-philippines.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "jakarta-indonesia",
    countryKey: "indonesia",
    country: "Indonesia",
    city: "Jakarta",
    price: "1190",
    landmark: "Central Jakarta",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-jakarta-indonesia.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "bali-indonesia",
    countryKey: "indonesia",
    country: "Indonesia",
    city: "Bali",
    price: "1500",
    landmark: "Island Escape",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-bali-indonesia.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "hong-kong-hong-kong",
    countryKey: "hong-kong",
    country: "Hong Kong",
    city: "Hong Kong",
    price: "1618",
    landmark: "Victoria Harbour",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-hong-kong-hong-kong.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "shanghai-china",
    countryKey: "china",
    country: "China",
    city: "Shanghai",
    price: "1382",
    landmark: "Pudong Skyline",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-shanghai-china.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-27",
    price_channel: "Cashback",
  },
  {
    id: "seoul-south-korea",
    countryKey: "south-korea",
    country: "South Korea",
    city: "Seoul",
    price: "1168",
    landmark: "Han River",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-seoul-south-korea.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "tokyo-japan",
    countryKey: "japan",
    country: "Japan",
    city: "Tokyo",
    price: "1855",
    landmark: "Tokyo Skyline",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-tokyo-japan.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-27",
    price_channel: "Cashback",
  },
  {
    id: "osaka-japan",
    countryKey: "japan",
    country: "Japan",
    city: "Osaka",
    price: "1633",
    landmark: "Osaka Bay",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-osaka-japan.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "london-united-kingdom",
    countryKey: "united-kingdom",
    country: "United Kingdom",
    city: "London",
    price: "911",
    landmark: "London Skyline",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-london-united-kingdom.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "paris-france",
    countryKey: "france",
    country: "France",
    city: "Paris",
    price: "726",
    landmark: "Eiffel District",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-paris-france.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Ajet",
  },
  {
    id: "milan-italy",
    countryKey: "italy",
    country: "Italy",
    city: "Milan",
    price: "475",
    landmark: "Duomo District",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-milan-italy.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-27",
    price_channel: "Low-cost",
  },
  {
    id: "rome-italy",
    countryKey: "italy",
    country: "Italy",
    city: "Rome",
    price: "329",
    landmark: "Historic Centre",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-rome-italy.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-27",
    price_channel: "Low-cost",
  },
  {
    id: "madrid-spain",
    countryKey: "spain",
    country: "Spain",
    city: "Madrid",
    price: "675",
    landmark: "Gran Via",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-madrid-spain.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-27",
    price_channel: "Pegasus",
  },
  {
    id: "barcelona-spain",
    countryKey: "spain",
    country: "Spain",
    city: "Barcelona",
    price: "749",
    landmark: "Barcelona Waterfront",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-barcelona-spain.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-27",
    price_channel: "Pegasus",
  },
  {
    id: "vienna-austria",
    countryKey: "austria",
    country: "Austria",
    city: "Vienna",
    price: "688",
    landmark: "Ringstrasse",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-vienna-austria.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-27",
    price_channel: "Pegasus",
  },
  {
    id: "munich-germany",
    countryKey: "germany",
    country: "Germany",
    city: "Munich",
    price: "693",
    landmark: "Munich Centre",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-munich-germany.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-27",
    price_channel: "Pegasus",
  },
  {
    id: "zurich-switzerland",
    countryKey: "switzerland",
    country: "Switzerland",
    city: "Zurich",
    price: "710",
    landmark: "Lake Zurich",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-zurich-switzerland.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Pegasus",
  },
  {
    id: "prague-czech-republic",
    countryKey: "czech-republic",
    country: "Czech Republic",
    city: "Prague",
    price: "640",
    landmark: "Charles Bridge",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-prague-czech-republic.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-27",
    price_channel: "Pegasus",
  },
  {
    id: "budapest-hungary",
    countryKey: "hungary",
    country: "Hungary",
    city: "Budapest",
    price: "267",
    landmark: "Danube View",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-budapest-hungary.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-27",
    price_channel: "Low-cost",
  },
  {
    id: "athens-greece",
    countryKey: "greece",
    country: "Greece",
    city: "Athens",
    price: "762",
    landmark: "Acropolis View",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-athens-greece.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Pegasus",
  },
  {
    id: "amsterdam-netherlands",
    countryKey: "netherlands",
    country: "Netherlands",
    city: "Amsterdam",
    price: "893",
    landmark: "Canal District",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-amsterdam-netherlands.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Pegasus",
  },
  {
    id: "berlin-germany",
    countryKey: "germany",
    country: "Germany",
    city: "Berlin",
    price: "690",
    landmark: "Berlin Centre",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-berlin-germany.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Ajet",
  },
  {
    id: "geneva-switzerland",
    countryKey: "switzerland",
    country: "Switzerland",
    city: "Geneva",
    price: "606",
    landmark: "Lac Leman",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-geneva-switzerland.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-27",
    price_channel: "Pegasus",
  },
  {
    id: "lisbon-portugal",
    countryKey: "portugal",
    country: "Portugal",
    city: "Lisbon",
    price: "1037",
    landmark: "Lisbon Waterfront",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-lisbon-portugal.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "casablanca-morocco",
    countryKey: "morocco",
    country: "Morocco",
    city: "Casablanca",
    price: "741",
    landmark: "Atlantic Coast",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-casablanca-morocco.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Pegasus",
  },
  {
    id: "marrakech-morocco",
    countryKey: "morocco",
    country: "Morocco",
    city: "Marrakech",
    price: "1374",
    landmark: "Medina",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-marrakech-morocco.png",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "tunis-tunisia",
    countryKey: "tunisia",
    country: "Tunisia",
    city: "Tunis",
    price: "900",
    landmark: "Tunis Centre",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-tunis-tunisia.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "zanzibar-tanzania",
    countryKey: "tanzania",
    country: "Tanzania",
    city: "Zanzibar",
    price: "961",
    landmark: "Stone Town",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-zanzibar-tanzania.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "nairobi-kenya",
    countryKey: "kenya",
    country: "Kenya",
    city: "Nairobi",
    price: "665",
    landmark: "Nairobi Skyline",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-nairobi-kenya.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "new-york-united-states",
    countryKey: "united-states",
    country: "United States",
    city: "New York",
    price: "1419",
    landmark: "Manhattan Skyline",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-new-york-united-states.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "toronto-canada",
    countryKey: "canada",
    country: "Canada",
    city: "Toronto",
    price: "1878",
    landmark: "CN Tower View",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-toronto-canada.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "los-angeles-united-states",
    countryKey: "united-states",
    country: "United States",
    city: "Los Angeles",
    price: "2195",
    landmark: "LA Skyline",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-los-angeles-united-states.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-27",
    price_channel: "Cashback",
  },
  {
    id: "abu-dhabi-uae",
    countryKey: "uae",
    country: "UAE",
    city: "Abu Dhabi",
    price: "306",
    landmark: "Corniche",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-abu-dhabi-uae.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "kuwait-city-kuwait",
    countryKey: "kuwait",
    country: "Kuwait",
    city: "Kuwait City",
    price: "393",
    landmark: "Kuwait Towers",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-kuwait-city-kuwait.jpg",
    price_origin: "JED",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "cairo-egypt",
    countryKey: "egypt",
    country: "Egypt",
    city: "Cairo",
    price: "338",
    landmark: "Pyramids of Giza",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-cairo-egypt.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Flynas",
  },
  {
    id: "amman-jordan",
    countryKey: "jordan",
    country: "Jordan",
    city: "Amman",
    price: "307",
    landmark: "Citadel View",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-amman-jordan.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
  {
    id: "kochi-india",
    countryKey: "india",
    country: "India",
    city: "Kochi",
    price: "550",
    landmark: "Fort Kochi",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-kochi-india.jpg",
    price_origin: "DMM",
    price_depart_date: "2026-10-27",
    price_channel: "Flynas",
  },
  {
    id: "washington-united-states",
    countryKey: "united-states",
    country: "United States",
    city: "Washington",
    price: "1696",
    landmark: "National Mall",
    image_url: "https://kirvqjgyxjyvwflghchw.supabase.co/storage/v1/object/public/agency-assets/media/shared/destination-washington-united-states.jpg",
    price_origin: "RUH",
    price_depart_date: "2026-10-20",
    price_channel: "Cashback",
  },
];

export const DESTINATION_PRESETS = PRESET_SEED.map((preset) => ({
  ...preset,
  image_url: preset.image_url || buildDestinationSvgDataUri(preset)
}));

export const DESTINATION_PRESET_COUNTRIES = Array.from(
  new Map(
    DESTINATION_PRESETS.map((preset) => [
      preset.countryKey,
      { value: preset.countryKey, label: preset.country }
    ])
  ).values()
);

export const buildDestinationPresetEntry = (preset) => ({
  city: preset.city,
  country: preset.country,
  price: preset.price,
  // Never store SVG data URIs in Supabase — only real https:// URLs
  image_url: (preset.image_url && preset.image_url.startsWith('https://')) ? preset.image_url : null,
  landmark: preset.landmark || ''
});
