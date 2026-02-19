const supabase = require('../services/supabaseClient');

async function multiTenantHardeningMiddleware(req, res, next) {
  try {
    if (!req.path.startsWith('/api/') || !req.user) return next();
    
    if (req.user.role === 'super_admin') return next();

    const userAgencyId = req.user.agencyId;
    if (!userAgencyId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'No agency' });
    }

    const { data: membership } = await supabase
      .from('agency_members')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('agency_id', userAgencyId)
      .single();

    if (!membership || membership.status !== 'active') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Inactive membership' });
    }

    const { data: agency } = await supabase
      .from('agencies')
      .select('status')
      .eq('id', userAgencyId)
      .single();

    if (!agency || agency.status !== 'active') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Agency inactive' });
    }

    if (req.body?.agency_id && req.body.agency_id !== userAgencyId) {
      throw new Error('TENANT_MISMATCH');
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

async function validateOrderBelongsToAgency(orderId, agencyId) {
  const { data: order } = await supabase
    .from('orders')
    .select('agency_id')
    .eq('id', orderId)
    .single();

  if (!order || order.agency_id !== agencyId) {
    throw { status: 403, error: 'FORBIDDEN', message: 'Not your order' };
  }
  return true;
}

function validateWriteAccess(resourceType) {
  return async (req, res, next) => {
    if (resourceType === 'order' && req.params.orderId) {
      try {
        await validateOrderBelongsToAgency(req.params.orderId, req.user.agencyId);
      } catch (err) {
        return res.status(err.status || 403).json({ error: err.error, message: err.message });
      }
    }
    next();
  };
}

module.exports = {
  multiTenantHardeningMiddleware,
  validateOrderBelongsToAgency,
  validateWriteAccess,
};
