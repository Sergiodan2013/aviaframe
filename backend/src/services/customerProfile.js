'use strict';

const supabase = require('../lib/supabase');

async function saveCustomerProfile({ agencyId, contactEmail, contactPhone, passenger }) {
  if (!agencyId || !contactEmail) return;

  const pax = passenger || {};
  const doc = pax.document || {};

  const { error } = await supabase
    .from('customer_profiles')
    .upsert({
      agency_id: agencyId,
      email: contactEmail.toLowerCase().trim(),
      phone: contactPhone || null,
      first_name: pax.first_name || null,
      last_name: pax.last_name || null,
      date_of_birth: pax.date_of_birth || null,
      gender: pax.gender || null,
      passport_number: doc.number || null,
      passport_expiry: doc.expiration_date || doc.expiry_date || null,
      nationality: doc.issuing_country || null,
      last_booking_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agency_id,email' });

  if (error) {
    console.error('[customerProfile] save failed:', error.message);
  }
}

async function lookupCustomerProfile({ agencyId, email }) {
  if (!agencyId || !email) return null;

  const { data } = await supabase
    .from('customer_profiles')
    .select('first_name,last_name,phone,date_of_birth,gender,passport_number,passport_expiry,nationality')
    .eq('agency_id', agencyId)
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  return data || null;
}

module.exports = { saveCustomerProfile, lookupCustomerProfile };
