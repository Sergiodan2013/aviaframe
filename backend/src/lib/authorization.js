'use strict';

const supabase = require('./supabase');
const { isAdminRole, isAgentRole, normalizeRole } = require('./utils');

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

async function canAccessDocument(auth, doc) {
  if (!doc) return false;
  if (isAdminRole(auth.profile.role)) return true;

  if (isAgentRole(auth.profile.role)) {
    if (auth.profile.agency_id && doc.agency_id && auth.profile.agency_id === doc.agency_id) {
      return true;
    }
  }

  if (doc.order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('id,user_id')
      .eq('id', doc.order_id)
      .single();
    if (order && order.user_id === auth.profile.id) return true;
  }

  return false;
}

function forbidden(res, message = 'Access denied') {
  return res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message
    }
  });
}

/**
 * Check if user has one of the required roles
 * @param {Object} auth - Auth context from resolveAuthContext()
 * @param {...string} allowedRoles - Roles that are allowed
 * @returns {boolean} - true if user has required role
 */
function hasRole(auth, ...allowedRoles) {
  if (auth.error || !auth.profile) return false;
  const userRole = normalizeRole(auth.profile.role);
  return allowedRoles.some(role => normalizeRole(role) === userRole);
}

module.exports = {
  canAccessOrder,
  canAccessDocument,
  forbidden,
  hasRole,
};
