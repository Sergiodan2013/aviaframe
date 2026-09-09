const {
  buildAgencyOnboardingState,
  applyAgencyOnboardingState,
  buildAgencyDeployState,
  assertAgencyDeployAllowed,
  markAgencyDeployStarted,
  markAgencyDeployFinished
} = require('../../src/services/agencyOnboardingService');

describe('agency onboarding service', () => {
  test('keeps invited status until manager starts saving settings', () => {
    const agency = {
      name: 'Demo Agency',
      domain: 'demo.aviaframe.com',
      contact_email: 'manager@example.com',
      contact_phone: '+966500000000',
      settings: {
        payment_methods: ['online'],
        site: {
          brand_color: '#1a3c8e',
          accent_color: '#2468c4'
        },
        onboarding: {
          status: 'invited',
          invite_sent_at: '2026-07-29T09:00:00.000Z',
          invite_sent_by: 'admin@example.com'
        }
      }
    };

    const state = buildAgencyOnboardingState(agency);

    expect(state.status).toBe('invited');
    expect(state.publish_ready).toBe(true);
    expect(state.manager_email).toBe('manager@example.com');
  });

  test('marks agency ready to publish after required setup is saved', () => {
    const agency = {
      name: 'Setup Agency',
      domain: 'setup.aviaframe.com',
      contact_email: 'owner@example.com',
      contact_phone: '+966511111111',
      settings: {
        payment_methods: ['online', 'invoice'],
        bank_details: {
          bank_name: 'Riyadh Bank',
          iban: 'SA1234567890123456789012'
        },
        site: {
          brand_color: '#112233',
          accent_color: '#445566'
        }
      }
    };

    const nextSettings = applyAgencyOnboardingState({
      agency,
      settings: agency.settings,
      patch: {
        last_saved_at: '2026-07-29T10:15:00.000Z',
        last_saved_by: 'owner@example.com'
      }
    });

    expect(nextSettings.onboarding.status).toBe('ready_to_publish');
    expect(nextSettings.onboarding.publish_ready).toBe(true);
    expect(nextSettings.onboarding.checklist.required_complete).toBe(true);
    expect(nextSettings.onboarding.checklist.items.find((item) => item.key === 'invoice_bank_details')).toMatchObject({
      required: true,
      done: true
    });
  });

  test('marks deploy as published after successful publish', () => {
    const agency = {
      name: 'Published Agency',
      domain: 'published.aviaframe.com',
      contact_email: 'owner@example.com',
      contact_phone: '+966522222222',
      settings: {
        payment_methods: ['online'],
        site: {
          brand_color: '#1a3c8e',
          accent_color: '#2468c4'
        }
      }
    };

    const startedSettings = markAgencyDeployStarted({
      agency,
      settings: agency.settings,
      actor: 'owner@example.com'
    });
    const startedState = buildAgencyDeployState({
      ...agency,
      settings: startedSettings
    });

    expect(startedState.status).toBe('deploying');
    expect(startedState.lock_expires_at).toBeTruthy();

    const finishedSettings = markAgencyDeployFinished({
      agency,
      settings: startedSettings,
      actor: 'owner@example.com',
      success: true
    });
    const onboardingState = buildAgencyOnboardingState({
      ...agency,
      settings: finishedSettings
    });
    const deployState = buildAgencyDeployState({
      ...agency,
      settings: finishedSettings
    });

    expect(onboardingState.status).toBe('published');
    expect(deployState.status).toBe('deployed');
    expect(deployState.last_error).toBeNull();
  });

  test('prevents overlapping deploy attempts while deploy lock is active', () => {
    const agency = {
      name: 'Locked Agency',
      domain: 'locked.aviaframe.com',
      settings: {
        deploy: {
          status: 'deploying',
          lock_expires_at: new Date(Date.now() + 60_000).toISOString()
        }
      }
    };

    expect(() => assertAgencyDeployAllowed(agency)).toThrow(/already in progress/i);
  });
});
