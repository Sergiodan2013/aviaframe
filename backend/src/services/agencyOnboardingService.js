'use strict';

const APP_URL = process.env.APP_URL || 'https://admin.aviaframe.com';
const DEPLOY_COOLDOWN_MS = Number(process.env.AGENCY_DEPLOY_COOLDOWN_MS || 60 * 1000);
const DEPLOY_LOCK_MS = Number(process.env.AGENCY_DEPLOY_LOCK_MS || 5 * 60 * 1000);

function cloneSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return {};
  return JSON.parse(JSON.stringify(settings));
}

function isNonEmpty(value) {
  return String(value || '').trim().length > 0;
}

function isValidEmail(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return Boolean(normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized));
}

function hasPaymentMethod(settings, code) {
  return Array.isArray(settings?.payment_methods) && settings.payment_methods.includes(code);
}

function inferSiteUrl(agency = {}) {
  const domain = String(agency?.domain || '').trim().toLowerCase();
  if (!domain) return null;
  return `https://${domain}`;
}

function getLifecycleState(settings = {}) {
  return {
    onboarding: settings.onboarding && typeof settings.onboarding === 'object' ? settings.onboarding : {},
    deploy: settings.deploy && typeof settings.deploy === 'object' ? settings.deploy : {}
  };
}

function buildAgencyOnboardingChecklist(agency = {}) {
  const settings = agency?.settings || {};
  const site = settings.site || {};
  const bankDetails = settings.bank_details || {};
  const widgetDomains = Array.isArray(settings.widget_allowed_domains) ? settings.widget_allowed_domains : [];
  const items = [
    {
      key: 'agency_name',
      label: 'Agency name',
      required: true,
      done: isNonEmpty(agency?.name)
    },
    {
      key: 'subdomain',
      label: 'Agency domain / subdomain',
      required: true,
      done: isNonEmpty(agency?.domain)
    },
    {
      key: 'manager_email',
      label: 'Agency manager email',
      required: true,
      done: isValidEmail(agency?.contact_email)
    },
    {
      key: 'primary_phone',
      label: 'Primary contact phone',
      required: true,
      done: isNonEmpty(agency?.contact_phone)
    },
    {
      key: 'brand_colors',
      label: 'Brand colors',
      required: false,
      done: isNonEmpty(site.brand_color) && isNonEmpty(site.accent_color)
    },
    {
      key: 'payment_methods',
      label: 'Enabled payment methods',
      required: true,
      done: Array.isArray(settings.payment_methods) && settings.payment_methods.length > 0
    },
    {
      key: 'invoice_bank_details',
      label: 'Invoice bank details',
      required: hasPaymentMethod(settings, 'invoice'),
      done: !hasPaymentMethod(settings, 'invoice') || (isNonEmpty(bankDetails.bank_name) && isNonEmpty(bankDetails.iban))
    },
    {
      key: 'logo',
      label: 'Agency logo',
      required: false,
      done: isNonEmpty(site.logo_url)
    },
    {
      key: 'about',
      label: 'Agency description',
      required: false,
      done: isNonEmpty(site.about_en) || isNonEmpty(site.about_ar)
    },
    {
      key: 'manager_contact',
      label: 'Manager / supervisor contact',
      required: false,
      done: isNonEmpty(settings?.contact_person?.full_name) || isNonEmpty(site.supervisor_name)
    },
    {
      key: 'allowed_domains',
      label: 'Allowed widget domains',
      required: false,
      done: widgetDomains.length > 0
    }
  ];

  const requiredItems = items.filter((item) => item.required);
  const completedRequired = requiredItems.filter((item) => item.done).length;
  const completedTotal = items.filter((item) => item.done).length;

  return {
    items,
    required_complete: requiredItems.length > 0 && completedRequired === requiredItems.length,
    required_completed_count: completedRequired,
    required_total_count: requiredItems.length,
    total_completed_count: completedTotal,
    total_count: items.length,
    completion_percent: items.length > 0 ? Math.round((completedTotal / items.length) * 100) : 0
  };
}

function buildAgencyOnboardingState(agency = {}) {
  const settings = agency?.settings || {};
  const lifecycle = getLifecycleState(settings);
  const checklist = buildAgencyOnboardingChecklist(agency);
  const current = lifecycle.onboarding || {};
  const deploy = lifecycle.deploy || {};
  let status = String(current.status || '').trim().toLowerCase();

  if (deploy.status === 'deployed') {
    status = 'published';
  } else if (status !== 'published') {
    if (status === 'invited' && !current.last_saved_at && !current.last_saved_by) {
      status = 'invited';
    } else if (checklist.required_complete) {
      status = 'ready_to_publish';
    } else if (current.last_saved_at || current.last_saved_by) {
      status = 'setup_in_progress';
    } else if (current.invite_sent_at) {
      status = 'invited';
    } else {
      status = 'draft';
    }
  }

  return {
    status,
    invite_sent_at: current.invite_sent_at || null,
    invite_sent_by: current.invite_sent_by || null,
    manager_email: agency?.contact_email || null,
    last_saved_at: current.last_saved_at || null,
    last_saved_by: current.last_saved_by || null,
    published_at: current.published_at || null,
    setup_url: `${APP_URL}/`,
    site_url: deploy.site_url || inferSiteUrl(agency),
    publish_ready: checklist.required_complete,
    checklist
  };
}

function applyAgencyOnboardingState({ agency = {}, settings = {}, patch = {} }) {
  const nextSettings = cloneSettings(settings);
  const lifecycle = getLifecycleState(nextSettings);
  const snapshot = {
    ...agency,
    settings: nextSettings
  };
  const currentState = buildAgencyOnboardingState(snapshot);
  const nextOnboarding = {
    ...(lifecycle.onboarding || {}),
    ...currentState,
    ...patch
  };

  let nextStatus = String(nextOnboarding.status || '').trim().toLowerCase();
  if (nextStatus !== 'published') {
    if (nextStatus === 'invited' && !nextOnboarding.last_saved_at && !nextOnboarding.last_saved_by) {
      nextStatus = 'invited';
    } else if (currentState.publish_ready) {
      nextStatus = 'ready_to_publish';
    } else if (nextOnboarding.last_saved_at || nextOnboarding.last_saved_by) {
      nextStatus = 'setup_in_progress';
    } else if (nextOnboarding.invite_sent_at) {
      nextStatus = 'invited';
    } else {
      nextStatus = 'draft';
    }
  }

  nextSettings.onboarding = {
    ...(lifecycle.onboarding || {}),
    ...nextOnboarding,
    status: nextStatus,
    publish_ready: currentState.publish_ready,
    checklist: currentState.checklist
  };

  return nextSettings;
}

function buildAgencyDeployState(agency = {}) {
  const lifecycle = getLifecycleState(agency?.settings || {});
  const deploy = lifecycle.deploy || {};

  return {
    status: deploy.status || 'not_deployed',
    site_url: deploy.site_url || inferSiteUrl(agency),
    last_deploy_at: deploy.last_deploy_at || null,
    last_deploy_by: deploy.last_deploy_by || null,
    last_attempt_at: deploy.last_attempt_at || null,
    last_error: deploy.last_error || null,
    lock_expires_at: deploy.lock_expires_at || null
  };
}

function assertAgencyDeployAllowed(agency = {}) {
  const deploy = buildAgencyDeployState(agency);
  const now = Date.now();
  const lockExpiresAt = deploy.lock_expires_at ? new Date(deploy.lock_expires_at).getTime() : 0;
  const lastDeployAt = deploy.last_deploy_at ? new Date(deploy.last_deploy_at).getTime() : 0;

  if (deploy.status === 'deploying' && lockExpiresAt && lockExpiresAt > now) {
    const secondsLeft = Math.max(1, Math.ceil((lockExpiresAt - now) / 1000));
    const err = new Error(`A site deployment is already in progress. Please wait about ${secondsLeft} seconds.`);
    err.code = 'DEPLOY_IN_PROGRESS';
    throw err;
  }

  if (lastDeployAt && now - lastDeployAt < DEPLOY_COOLDOWN_MS) {
    const secondsLeft = Math.max(1, Math.ceil((DEPLOY_COOLDOWN_MS - (now - lastDeployAt)) / 1000));
    const err = new Error(`Please wait ${secondsLeft} seconds before starting another site deploy.`);
    err.code = 'DEPLOY_COOLDOWN';
    throw err;
  }
}

function markAgencyDeployStarted({ agency = {}, settings = {}, actor = null }) {
  const nextSettings = cloneSettings(settings);
  const lifecycle = getLifecycleState(nextSettings);
  const now = new Date();
  nextSettings.deploy = {
    ...(lifecycle.deploy || {}),
    status: 'deploying',
    site_url: inferSiteUrl(agency),
    last_attempt_at: now.toISOString(),
    last_deploy_by: actor || null,
    last_error: null,
    lock_expires_at: new Date(now.getTime() + DEPLOY_LOCK_MS).toISOString()
  };
  return nextSettings;
}

function markAgencyDeployFinished({ agency = {}, settings = {}, actor = null, success = false, errorMessage = null }) {
  const nextSettings = cloneSettings(settings);
  const lifecycle = getLifecycleState(nextSettings);
  const currentDeploy = lifecycle.deploy || {};
  const nowIso = new Date().toISOString();

  nextSettings.deploy = {
    ...currentDeploy,
    status: success ? 'deployed' : 'failed',
    site_url: inferSiteUrl(agency),
    last_deploy_at: nowIso,
    last_attempt_at: nowIso,
    last_deploy_by: actor || currentDeploy.last_deploy_by || null,
    last_error: success ? null : (errorMessage || 'Deploy failed'),
    lock_expires_at: null
  };

  const onboardingPatch = success
    ? { status: 'published', published_at: nowIso }
    : {};
  return applyAgencyOnboardingState({
    agency,
    settings: nextSettings,
    patch: onboardingPatch
  });
}

module.exports = {
  APP_URL,
  DEPLOY_COOLDOWN_MS,
  DEPLOY_LOCK_MS,
  inferSiteUrl,
  buildAgencyOnboardingChecklist,
  buildAgencyOnboardingState,
  buildAgencyDeployState,
  applyAgencyOnboardingState,
  assertAgencyDeployAllowed,
  markAgencyDeployStarted,
  markAgencyDeployFinished
};
