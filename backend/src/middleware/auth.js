'use strict';

const supabase = require('../lib/supabase');
const { config } = require('../config');
const { normalizeRole, isAdminRole, isStaffRole, isAgentRole } = require('../utils/helpers');

function forbidden(res, message = 'Access denied') {
  return res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message
    }
  });
}

function requireInternalToken(req, res) {
  const token = String(req.headers['x-internal-token'] || '').trim();
  if (!config.internalApiToken || token !== config.internalApiToken) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid internal token' } });
    return false;
  }
  return true;
}

function ensureAdmin(auth, res) {
  if (!isAdminRole(auth.profile.role)) {
    forbidden(res, 'Admin role required');
    return false;
  }
  return true;
}

function ensureSuperAdmin(auth, res) {
  if (normalizeRole(auth.profile.role) !== 'super_admin') {
    forbidden(res, 'Super admin role required');
    return false;
  }
  return true;
}

function ensureStaff(auth, res) {
  if (!isStaffRole(auth.profile.role)) {
    forbidden(res, 'Staff role required');
    return false;
  }
  return true;
}

async function canAccessOrder(auth, order) {
  if (!order) return false;
  if (isAdminRole(auth.profile.role)) return true;
  if (isAgentRole(auth.profile.role)) {
    return (
      (auth.profile.agency_id && order.agency_id && auth.profile.agency_id === order.agency_id) ||
      order.user_id === auth.profile.id
    );
  }
  return order.user_id === auth.profile.id;
}

async function resolveAuthContextFromToken(token) {
  try {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) return { error: 'MISSING_TOKEN' };

    const { data: userData, error: userError } = await supabase.auth.getUser(normalizedToken);
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

      if (config.enableContactEmailAutoLink && userEmail) {
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
    } else if (
      config.enableContactEmailAutoLink
      && userEmail
      && (!profile.agency_id || normalizeRole(profile.role) === 'user')
      && !['admin', 'super_admin'].includes(normalizeRole(profile.role))
    ) {
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

async function resolveAuthContext(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  return resolveAuthContextFromToken(token);
}

// Some payment routes (guest checkout: the widget and the anonymous parts of the
// booking flow) are only reachable today with the order_id itself as the sole
// piece of proof-of-possession — no login is required to pay for an order that
// was just created. Requiring a login for those routes would break that guest
// checkout flow, so this helper does NOT reject requests that carry no
// Authorization header at all: it preserves that existing behavior exactly.
//
// What it DOES close: when a request *does* carry a Bearer token (i.e. the
// caller is an authenticated portal/agency user), it verifies that identity
// actually owns or can access the order before letting the request proceed —
// closing the gap where any logged-in user could pay for, price-check, or
// cancel/refund an order belonging to a different customer or a different
// agency simply by knowing its order_id.
//
// Returns { ok: true, auth } when the request may proceed (auth is null for
// anonymous/guest requests). Returns { ok: false } after already writing the
// appropriate 401/403 response when the request must be rejected.
async function enforceOrderOwnershipIfAuthenticated(req, res, order) {
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    // No credentials presented — leave the existing guest-checkout behavior
    // (order_id as the capability) untouched.
    return { ok: true, auth: null };
  }

  const auth = await resolveAuthContextFromToken(token);
  if (auth.error) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
    return { ok: false };
  }

  const allowed = await canAccessOrder(auth, order);
  if (!allowed) {
    forbidden(res, 'You do not have access to this order');
    return { ok: false };
  }

  return { ok: true, auth };
}

module.exports = {
  forbidden,
  requireInternalToken,
  ensureAdmin,
  ensureSuperAdmin,
  ensureStaff,
  canAccessOrder,
  resolveAuthContext,
  resolveAuthContextFromToken,
  enforceOrderOwnershipIfAuthenticated
};
