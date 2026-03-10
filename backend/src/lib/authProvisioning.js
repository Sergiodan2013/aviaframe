'use strict';

const crypto = require('crypto');
const supabase = require('./supabase');
const { normalizeEmail } = require('./utils');

async function linkAgencyAdminProfileByEmail({ email, agencyId }) {
  const normalizedEmailVal = String(email || '').trim().toLowerCase();
  if (!normalizedEmailVal) return { linkedProfile: null };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,role,agency_id')
    .eq('email', normalizedEmailVal)
    .maybeSingle();

  if (profileError) {
    return { linkedProfile: null, error: profileError };
  }
  if (!profile) {
    return { linkedProfile: null };
  }

  if (profile.agency_id && profile.agency_id !== agencyId) {
    return {
      conflict: true,
      linkedProfile: profile,
      message: `User ${normalizedEmailVal} is already linked to another agency`
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      agency_id: agencyId,
      role: 'agent',
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)
    .select('id,email,role,agency_id')
    .single();

  if (updateError) {
    return { linkedProfile: null, error: updateError };
  }

  return { linkedProfile: updated };
}

async function findAuthUserByEmail(email) {
  const normalizedEmailVal = String(email || '').trim().toLowerCase();
  if (!normalizedEmailVal) return null;

  // Supabase Admin API doesn't provide direct lookup by email in this SDK path,
  // so we page through users and match by normalized email.
  const perPage = 100;
  const maxPages = 20;
  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`AUTH_USERS_LIST_FAILED: ${error.message}`);
    }
    const users = Array.isArray(data?.users) ? data.users : [];
    const matched = users.find((u) => String(u?.email || '').trim().toLowerCase() === normalizedEmailVal);
    if (matched) return matched;
    if (users.length < perPage) break;
  }
  return null;
}

async function ensureAuthUserByEmail(email) {
  const normalizedEmailVal = String(email || '').trim().toLowerCase();
  if (!normalizedEmailVal) {
    throw new Error('INVALID_EMAIL');
  }

  const existing = await findAuthUserByEmail(normalizedEmailVal);
  if (existing?.id) {
    return { user: existing, created: false, invited: false };
  }

  // Preferred flow: create invited user so they can set password from email link.
  try {
    const { data: invitedData, error: invitedError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmailVal);
    if (!invitedError && invitedData?.user?.id) {
      return { user: invitedData.user, created: true, invited: true };
    }
    if (invitedError) {
      console.warn('inviteUserByEmail failed, fallback to createUser:', invitedError.message);
    }
  } catch (err) {
    console.warn('inviteUserByEmail exception, fallback to createUser:', err?.message);
  }

  // Fallback: create auth user directly with temporary password.
  const temporaryPassword = `Tmp!${crypto.randomBytes(10).toString('hex')}Aa1`;
  const { data: createdData, error: createdError } = await supabase.auth.admin.createUser({
    email: normalizedEmailVal,
    password: temporaryPassword,
    email_confirm: false,
    user_metadata: {
      provisioned_by: 'admin_panel'
    }
  });
  if (createdError || !createdData?.user?.id) {
    throw new Error(`AUTH_USER_PROVISION_FAILED: ${createdError?.message || 'unknown'}`);
  }
  return { user: createdData.user, created: true, invited: false };
}

module.exports = {
  linkAgencyAdminProfileByEmail,
  findAuthUserByEmail,
  ensureAuthUserByEmail,
};
