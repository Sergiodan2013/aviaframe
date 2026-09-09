#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: process.env.ENV_FILE || require('path').resolve(__dirname, '../.env') });

const supabase = require('../src/lib/supabase');
const { generateAgencySiteFiles, buildAgencyDeployFiles, deployToNetlify } = require('../src/services/agencyProvision');
const { resolveAgencyPaymentMode } = require('../src/services/agencyPaymentMode');
const {
  assertAgencyDeployAllowed,
  markAgencyDeployStarted,
  markAgencyDeployFinished,
} = require('../src/services/agencyOnboardingService');

const AGENCY_SELECT = 'id,name,domain,api_key,contact_email,contact_phone,country,address,is_active,commission_rate,settings,created_at,updated_at';

const AGENCY_IDS = [
  '2dbbba44-be91-4f30-aded-cb6b530ef7f2', // skyports.aviaframe.com
  'bc6fb662-f78e-4a1d-b209-7a75c64576be', // sahabalalam.aviaframe.com
  'e60d54b8-99cb-4ecc-8fb8-1b06262c3dd9', // almalektravel.aviaframe.com
  'cdab4d8b-f660-415f-8ba1-d3c9a91fe1a6', // airwings.aviaframe.com
];

function buildSite({ agency, cleanSubdomain }) {
  const s = agency.settings?.site || {};
  return generateAgencySiteFiles({
    agencyName: agency.name,
    agencyNameAr: s.name_ar || '',
    subdomain: cleanSubdomain,
    apiKey: agency.api_key,
    contactEmail: agency.contact_email || '',
    contactPhone: agency.contact_phone || '',
    contactPhone2: s.contact_phone2 || '',
    whatsappPhone: s.whatsapp_phone || '',
    brandColor: s.brand_color || '#1a3c8e',
    accentColor: s.accent_color || '#2468c4',
    supervisorName: s.supervisor_name || '',
    supervisorEmail: s.supervisor_email || '',
    language: agency.settings?.language || 'en',
    logoUrl: s.logo_url || '',
    aboutEn: s.about_en || '',
    aboutAr: s.about_ar || '',
    address: agency.address || '',
    workingHours: s.working_hours || '',
    workingHoursAr: s.working_hours_ar || '',
    licenseNumber: s.license_number || '',
    iataNumber: s.iata_number || '',
    foundedYear: s.founded_year || '',
    googleMapsUrl: s.google_maps_url || '',
    instagram: s.instagram || '',
    twitter: s.twitter || '',
    snapchat: s.snapchat || '',
    facebook: s.facebook || '',
    services: Array.isArray(s.services) ? s.services : [],
    heroTagline: s.hero_tagline || '',
    heroDescription: s.hero_description || '',
    destinations: Array.isArray(s.destinations) ? s.destinations : [],
    reviews: Array.isArray(s.reviews) ? s.reviews : [],
    featuredAirlines: Array.isArray(s.featured_airlines) ? s.featured_airlines : [],
    heroImageUrl: s.hero_image_url || '',
    headerBg: s.header_bg || '',
    footerBg: s.footer_bg || '',
  });
}

async function persistSettings(agencyId, settings) {
  return supabase
    .from('agencies')
    .update({ settings, updated_at: new Date().toISOString() })
    .eq('id', agencyId)
    .select(AGENCY_SELECT)
    .single();
}

async function redeployAgency(agencyId) {
  const { data: agency, error } = await supabase
    .from('agencies')
    .select(AGENCY_SELECT)
    .eq('id', agencyId)
    .single();

  if (error || !agency) {
    console.error(`[${agencyId}] Load failed:`, error?.message);
    return;
  }

  const domain = String(agency.domain || '').trim().toLowerCase()
    .replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  const match = domain.match(/^([a-z0-9-]+)\.aviaframe\.com$/i);
  if (!match) {
    console.error(`[${agency.name}] Unsupported domain: ${domain}`);
    return;
  }
  const cleanSubdomain = match[1];

  console.log(`→ ${agency.name} (${domain})`);

  try { assertAgencyDeployAllowed(agency); } catch (e) {
    console.error(`  Blocked: ${e.message}`);
    return;
  }

  const actor = 'system-redeploy';
  const startedSettings = markAgencyDeployStarted({ agency, settings: agency.settings || {}, actor });
  const { data: started, error: lockErr } = await persistSettings(agency.id, startedSettings);
  if (lockErr || !started) {
    console.error(`  Lock failed:`, lockErr?.message);
    return;
  }

  try {
    const site = buildSite({ agency: started, cleanSubdomain });
    const result = await deployToNetlify({
      subdomain: cleanSubdomain,
      files: buildAgencyDeployFiles({
        subdomain: cleanSubdomain,
        apiKey: started.api_key,
        landingHtml: site.html,
        landingCss: site.css,
        paymentMode: resolveAgencyPaymentMode(started),
      })
    });

    const doneSettings = markAgencyDeployFinished({
      agency: started, settings: started.settings || {}, actor,
      success: true, deployId: result.deploy_id, siteUrl: result.site_url,
    });
    await persistSettings(started.id, doneSettings);
    console.log(`  ✓ → ${result.site_url}`);
  } catch (err) {
    console.error(`  ✗ failed:`, err.message);
    const failSettings = markAgencyDeployFinished({
      agency: started, settings: started.settings || {}, actor,
      success: false, errorMessage: err.message,
    });
    await persistSettings(started.id, failSettings);
  }
}

(async () => {
  for (const id of AGENCY_IDS) {
    await redeployAgency(id);
  }
  console.log('\nAll done.');
  process.exit(0);
})();
