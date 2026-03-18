'use strict';

const supabase = require('../lib/supabase');
const { normalizeRole } = require('../lib/utils');

async function resolveAuthContext(req) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) return { error: 'MISSING_TOKEN' };

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return { error: 'INVALID_TOKEN' };
    }

    const userId = userData.user.id;
    const userEmail = String(userData.user.email || '').trim().toLowerCase();
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email,role,agency_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return { error: 'PROFILE_LOAD_FAILED' };
    }

    if (!profile) {
      let role = 'user';
      let agencyId = null;

      if (userEmail) {
        const { data: agenciesByEmail } = await supabase
          .from('agencies')
          .select('id')
          .eq('contact_email', userEmail)
          .limit(2);
        const linked = Array.isArray(agenciesByEmail) ? agenciesByEmail : [];
        if (linked.length === 1) {
          role = 'agent';
          agencyId = linked[0].id;
        }
      }

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail || null,
          role,
          agency_id: agencyId
        })
        .select('id,email,role,agency_id')
        .single();

      if (createError || !created) {
        return { error: 'PROFILE_NOT_FOUND' };
      }
      profile = created;
    } else if (userEmail && (!profile.agency_id || normalizeRole(profile.role) === 'user')) {
      const { data: agenciesByEmail } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', userEmail)
        .limit(2);
      const linked = Array.isArray(agenciesByEmail) ? agenciesByEmail : [];
      if (linked.length === 1) {
        const targetAgencyId = linked[0].id;
        if (profile.agency_id !== targetAgencyId || normalizeRole(profile.role) !== 'agent') {
          const { data: patched } = await supabase
            .from('profiles')
            .update({
              role: 'agent',
              agency_id: targetAgencyId,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('id,email,role,agency_id')
            .single();
          if (patched) {
            profile = patched;
          }
        }
      }
    }

    profile = {
      ...profile,
      role: normalizeRole(profile?.role)
    };

    return {
      user: userData.user,
      profile
    };
  } catch (err) {
    console.error('Auth context error:', err);
    return { error: 'AUTH_CONTEXT_FAILED' };
  }
}

function requireInternalToken(req, res, internalApiToken) {
  const token = String(req.headers['x-internal-token'] || '').trim();
  if (!internalApiToken || token !== internalApiToken) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid internal token' } });
    return false;
  }
  return true;
}

module.exports = { resolveAuthContext, requireInternalToken };
