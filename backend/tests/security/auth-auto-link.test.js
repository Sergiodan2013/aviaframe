describe('auth auto-link hardening', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('does not auto-promote a new user to agent when contact-email auto-link is disabled', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-1', email: 'agent@agency.test' } },
      error: null
    });

    const profileMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const profileEq = jest.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = jest.fn(() => ({ eq: profileEq }));
    const profileInsertSingle = jest.fn().mockResolvedValue({
      data: { id: 'user-1', email: 'agent@agency.test', role: 'user', agency_id: null },
      error: null
    });
    const profileInsert = jest.fn(() => ({
      select: jest.fn(() => ({
        single: profileInsertSingle
      }))
    }));

    const from = jest.fn((table) => {
      if (table === 'profiles') {
        return { select: profileSelect, insert: profileInsert };
      }
      if (table === 'agencies') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({ data: [{ id: 'agency-1' }] })
            }))
          }))
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    jest.doMock('../../src/lib/supabase', () => ({
      auth: { getUser },
      from
    }));
    jest.doMock('../../src/config', () => ({
      config: { enableContactEmailAutoLink: false }
    }));

    const { resolveAuthContext } = require('../../src/middleware/auth');
    const auth = await resolveAuthContext({
      headers: { authorization: 'Bearer token-1' }
    });

    expect(auth.error).toBeUndefined();
    expect(auth.profile.role).toBe('user');
    expect(auth.profile.agency_id).toBeNull();
    expect(from).not.toHaveBeenCalledWith('agencies');
  });

  test('does not patch an existing user profile into agent when contact-email auto-link is disabled', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-2', email: 'agent@agency.test' } },
      error: null
    });

    const profileMaybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'user-2', email: 'agent@agency.test', role: 'user', agency_id: null },
      error: null
    });
    const profileEq = jest.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileSelect = jest.fn(() => ({ eq: profileEq }));
    const profileUpdate = jest.fn();

    const from = jest.fn((table) => {
      if (table === 'profiles') {
        return { select: profileSelect, update: profileUpdate };
      }
      if (table === 'agencies') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({ data: [{ id: 'agency-1' }] })
            }))
          }))
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    jest.doMock('../../src/lib/supabase', () => ({
      auth: { getUser },
      from
    }));
    jest.doMock('../../src/config', () => ({
      config: { enableContactEmailAutoLink: false }
    }));

    const { resolveAuthContext } = require('../../src/middleware/auth');
    const auth = await resolveAuthContext({
      headers: { authorization: 'Bearer token-2' }
    });

    expect(auth.error).toBeUndefined();
    expect(auth.profile.role).toBe('user');
    expect(auth.profile.agency_id).toBeNull();
    expect(profileUpdate).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalledWith('agencies');
  });
});
