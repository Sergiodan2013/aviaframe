const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../../services/supabaseClient');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

async function ensureSuperAdmin(req, res, next) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Only super admins can manage super admins',
    });
  }
  next();
}

router.post('/create', authMiddleware, ensureSuperAdmin, async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        error: 'INVALID_EMAIL',
        message: 'Valid email is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    let isNewUser = false;

    try {
      const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
      if (!searchError && existingUsers?.users) {
        user = existingUsers.users.find(u => u.email === normalizedEmail);
      }
    } catch (err) {
      console.warn('[SuperAdmin] Could not search existing users:', err.message);
    }

    if (!user) {
      try {
        const { data: newUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          normalizedEmail,
          {
            data: {
              name: name || normalizedEmail.split('@')[0],
              invited_at: new Date().toISOString(),
            },
          }
        );

        if (inviteError) {
          return res.status(400).json({
            error: 'INVITE_FAILED',
            message: inviteError.message || 'Failed to invite user',
          });
        }

        user = newUser.user;
        isNewUser = true;
      } catch (err) {
        return res.status(500).json({
          error: 'INVITE_ERROR',
          message: 'Failed to invite user: ' + err.message,
        });
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError?.code === 'PGRST116') {
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: normalizedEmail,
          name: name || normalizedEmail.split('@')[0],
          role: 'super_admin',
          created_at: new Date().toISOString(),
        });

      if (createProfileError) {
        return res.status(400).json({
          error: 'PROFILE_CREATE_FAILED',
          message: 'Failed to create user profile',
        });
      }
    } else if (!profileError && profile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', user.id);

      if (updateError) {
        return res.status(400).json({
          error: 'PROFILE_UPDATE_FAILED',
          message: 'Failed to update user role',
        });
      }
    }

    res.status(200).json({
      success: true,
      user_id: user.id,
      email: normalizedEmail,
      name: name || normalizedEmail.split('@')[0],
      invited: isNewUser,
      message: isNewUser
        ? 'User invited successfully and assigned super admin role'
        : 'User promoted to super admin',
    });

    console.log(`[SuperAdmin] ${req.user.email} created super admin: ${normalizedEmail}`);
  } catch (error) {
    console.error('[SuperAdmin Create] Unexpected error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create super admin: ' + error.message,
    });
  }
});

router.get('/', authMiddleware, ensureSuperAdmin, async (req, res) => {
  try {
    const { data: superAdmins, error } = await supabase
      .from('profiles')
      .select('id, email, name, created_at')
      .eq('role', 'super_admin')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: superAdmins?.length || 0,
      data: superAdmins || [],
    });
  } catch (error) {
    console.error('[SuperAdmin List] Error:', error);
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to fetch super admins',
    });
  }
});

router.delete('/:userId', authMiddleware, ensureSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'CANNOT_REMOVE_SELF',
        message: 'You cannot remove your own super admin role',
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return res.status(404).json({
        error: 'NOT_SUPER_ADMIN',
        message: 'User is not a super admin',
      });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: `Super admin role removed from ${profile.email}`,
    });

    console.log(`[SuperAdmin] ${req.user.email} removed super admin from: ${profile.email}`);
  } catch (error) {
    console.error('[SuperAdmin Delete] Error:', error);
    res.status(500).json({
      error: 'DELETE_FAILED',
      message: 'Failed to remove super admin role',
    });
  }
});

module.exports = router;
