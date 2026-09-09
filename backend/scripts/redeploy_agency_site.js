#!/usr/bin/env node

require('dotenv').config();

let supabase = null;
let agencyProvision = null;
let resolveAgencyPaymentMode = null;

function parseArgs(argv) {
  const args = { domain: null, all: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--all') {
      args.all = true;
      continue;
    }
    if (value === '--domain') {
      args.domain = argv[index + 1] || null;
      index += 1;
    }
  }
  return args;
}

function resolveSubdomain(domain) {
  const match = String(domain || '').trim().toLowerCase().match(/^([a-z0-9-]+)\.aviaframe\.com$/i);
  return match ? match[1] : null;
}

async function loadAgencies({ domain, all }) {
  let query = supabase
    .from('agencies')
    .select('id,name,domain,api_key,contact_email,contact_phone,address,settings')
    .ilike('domain', '%.aviaframe.com')
    .order('created_at', { ascending: true });

  if (!all && domain) {
    query = query.eq('domain', domain);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function persistResolvedPaymentMode(agency) {
  const paymentMode = resolveAgencyPaymentMode(agency);
  if (agency.settings?.payment_mode === paymentMode) return agency;

  const settings = { ...(agency.settings || {}), payment_mode: paymentMode };
  const { error } = await supabase
    .from('agencies')
    .update({ settings })
    .eq('id', agency.id);

  if (error) throw error;
  return { ...agency, settings };
}

async function buildFilesForAgency(agency) {
  const {
    buildAgencyDeployFiles,
    generateAgencySiteFiles
  } = agencyProvision;
  const subdomain = resolveSubdomain(agency.domain);
  if (!subdomain) {
    throw new Error(`Unsupported agency domain: ${agency.domain}`);
  }

  const siteSettings = agency.settings?.site || {};
  const generated = generateAgencySiteFiles({
    agencyName: agency.name,
    agencyNameAr: siteSettings.name_ar || '',
    subdomain,
    apiKey: agency.api_key,
    contactEmail: agency.contact_email || '',
    contactPhone: agency.contact_phone || '',
    contactPhone2: siteSettings.contact_phone2 || '',
    whatsappPhone: siteSettings.whatsapp_phone || '',
    brandColor: siteSettings.brand_color || '#1a3c8e',
    accentColor: siteSettings.accent_color || '#2468c4',
    supervisorName: siteSettings.supervisor_name || '',
    supervisorEmail: siteSettings.supervisor_email || '',
    language: agency.settings?.language || 'en',
    logoUrl: siteSettings.logo_url || '',
    aboutEn: siteSettings.about_en || '',
    aboutAr: siteSettings.about_ar || '',
    address: agency.address || '',
    workingHours: siteSettings.working_hours || '',
    workingHoursAr: siteSettings.working_hours_ar || '',
    licenseNumber: siteSettings.license_number || '',
    iataNumber: siteSettings.iata_number || '',
    foundedYear: siteSettings.founded_year || '',
    googleMapsUrl: siteSettings.google_maps_url || '',
    instagram: siteSettings.instagram || '',
    twitter: siteSettings.twitter || '',
    snapchat: siteSettings.snapchat || '',
    facebook: siteSettings.facebook || '',
    services: Array.isArray(siteSettings.services) ? siteSettings.services : [],
    heroTagline: siteSettings.hero_tagline || '',
    heroDescription: siteSettings.hero_description || '',
    destinations: Array.isArray(siteSettings.destinations) ? siteSettings.destinations : [],
    reviews: Array.isArray(siteSettings.reviews) ? siteSettings.reviews : [],
    featuredAirlines: Array.isArray(siteSettings.featured_airlines) ? siteSettings.featured_airlines : [],
    heroImageUrl: siteSettings.hero_image_url || '',
    headerBg: siteSettings.header_bg || '',
    footerBg: siteSettings.footer_bg || ''
  });

  return buildAgencyDeployFiles({
    subdomain,
    apiKey: agency.api_key,
    landingHtml: generated.html,
    landingCss: generated.css,
    paymentMode: resolveAgencyPaymentMode(agency)
  });
}

async function redeployAgency(agency) {
  const { deployToNetlify } = agencyProvision;
  const files = await buildFilesForAgency(agency);
  const subdomain = resolveSubdomain(agency.domain);
  const result = await deployToNetlify({ subdomain, files });

  return {
    id: agency.id,
    name: agency.name,
    domain: agency.domain,
    deployId: result.deployId,
    siteUrl: result.siteUrl
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.all && !args.domain) {
    console.error('Usage: node scripts/redeploy_agency_site.js --domain sahabalalam.aviaframe.com');
    console.error('   or: node scripts/redeploy_agency_site.js --all');
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Railway runtime env. Run this via: railway run npm run redeploy:agency-site -- --domain <subdomain>.aviaframe.com');
    process.exit(1);
  }

  supabase = require('../src/lib/supabase');
  agencyProvision = require('../src/services/agencyProvision');
  ({ resolveAgencyPaymentMode } = require('../src/services/agencyPaymentMode'));

  const agencies = await loadAgencies(args);
  if (!agencies.length) {
    console.error('No matching aviaframe.com agencies found.');
    process.exit(1);
  }

  const results = [];
  for (const agency of agencies) {
    const configuredAgency = await persistResolvedPaymentMode(agency);
    const result = await redeployAgency(configuredAgency);
    results.push(result);
    console.log(JSON.stringify(result));
  }

  console.log(`Redeployed ${results.length} agency site(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
