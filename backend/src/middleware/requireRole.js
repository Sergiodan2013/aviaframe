/**
 * RBAC Middleware - Role-Based Access Control
 * Checks if authenticated user has required role
 *
 * Usage:
 *   app.get('/api/admin/*', requireRole('super_admin', 'admin'), handler)
 *
 * Roles hierarchy:
 *   - super_admin: Full platform access, sees all agencies
 *   - admin: Agency admin, sees only their agency
 *   - agent: Agency staff
 *   - client: Regular user
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials for RBAC middleware');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Require user to have one of the specified roles
 * @param {...string} allowedRoles - Roles that are allowed to access
 * @returns {Function} Express middleware
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify token and get user
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
      }

      // Get user profile with role and agency_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, agency_id, full_name')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User profile not found'
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(profile.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${profile.role}`
        });
      }

      // Attach user and profile to request for later use
      req.user = user;
      req.userProfile = profile;

      // Log access for audit
      console.log(`[RBAC] ${profile.role} ${profile.email} accessed ${req.method} ${req.path}`);

      next();
    } catch (error) {
      console.error('[RBAC] Error checking role:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify user role'
      });
    }
  };
};

/**
 * Helper: Require super_admin only
 */
const requireSuperAdmin = () => requireRole('super_admin');

/**
 * Helper: Require any admin (super_admin or agency admin)
 */
const requireAdmin = () => requireRole('super_admin', 'admin');

/**
 * Helper: Require agency staff (admin or agent)
 */
const requireAgencyStaff = () => requireRole('super_admin', 'admin', 'agent');

const { isAdminRole, isStaffRole, normalizeRole } = require('../lib/utils');
const { forbidden } = require('../lib/authorization');

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

module.exports = {
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireAgencyStaff,
  ensureAdmin,
  ensureSuperAdmin,
  ensureStaff
};
