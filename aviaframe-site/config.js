(() => {
  const hostname = window.location.hostname || 'aviaframe.com';
  const isTestEnvHost = /(^|\.)testenvavia\.netlify\.app$/i.test(hostname);
  const isPublicDemoHost =
    /^aviaframe\.com$/i.test(hostname) ||
    /^www\.aviaframe\.com$/i.test(hostname);

  const liveConfig = {
    environment: 'production',
    backendUrl: 'https://peaceful-amazement-production-629f.up.railway.app',
    agencyKey: 'ag_eed8b706614bee6a4712686d1026f02b6a862485',
    moyasarPublicKey: 'pk_live_iXhEB7xrWqPoh2SMRBt45fA73mVoKKa8EjZt5end',
    supabaseUrl: 'https://kirvqjgyxjyvwflghchw.supabase.co',
    supabaseAnonKey: 'sb_publishable_d4W5pK3xjBVqFRb3Y1h06Q_tIUmCwCa',
    siteOriginHost: hostname,
    portalUrl: 'https://admin.aviaframe.com',
    defaultDryRunIssue: false,
    showTestPaymentCards: false,
    enableCardFeePreview: true,
    enableOfferPriceFlow: true,
    displayCurrencyEnabled: true,
    defaultDisplayCurrency: 'SAR',
    supportedDisplayCurrencies: ['SAR', 'USD', 'EUR'],
    paymentReturnUrl: `${window.location.origin}/booking.html`
  };

  const publicDemoConfig = {
    environment: 'sandbox-demo',
    backendUrl: 'https://peaceful-amazement-production-629f.up.railway.app',
    agencyKey: 'ag_eed8b706614bee6a4712686d1026f02b6a862485',
    moyasarPublicKey: 'pk_test_8FRQCpWq1UkQ55WexM6UEZ2moe711bwveGhyjg8i',
    supabaseUrl: 'https://kirvqjgyxjyvwflghchw.supabase.co',
    supabaseAnonKey: 'sb_publishable_d4W5pK3xjBVqFRb3Y1h06Q_tIUmCwCa',
    // Public demo must stay in the sandbox contour even when hosted on
    // aviaframe.com, so force the backend-recognized sandbox host markers.
    searchOriginHost: 'sandbox.aviaframe.com',
    bookingOriginHost: 'sandbox.aviaframe.com',
    siteOriginHost: 'sandbox.aviaframe.com',
    portalUrl: 'https://admin.aviaframe.com',
    defaultDryRunIssue: true,
    showTestPaymentCards: true,
    searchIsSandbox: true,
    enableCardFeePreview: true,
    enableOfferPriceFlow: true,
    displayCurrencyEnabled: true,
    defaultDisplayCurrency: 'SAR',
    supportedDisplayCurrencies: ['SAR', 'USD', 'EUR'],
    paymentReturnUrl: `${window.location.origin}/booking.html`
  };

  // Staging uses live search availability while keeping checkout non-production.
  // The NDC sandbox is intentionally reserved for sandbox.aviaframe.com.
  const stagingConfig = {
    ...liveConfig,
    environment: 'staging',
    // testenvavia routes to the GitHub-connected staging backend service
    // (peaceful-amazement-staging.up.railway.app), which auto-deploys from
    // main. The other Railway service in this environment
    // (peaceful-amazement-staging-staging.up.railway.app) has no source
    // connected at all and can never receive new code — do not point
    // anything at it again without first wiring it to GitHub.
    backendUrl: 'https://peaceful-amazement-staging.up.railway.app',
    supabaseUrl: 'https://hvlxvzjioaiiquekecpp.supabase.co',
    supabaseAnonKey: 'sb_publishable_xdHrudkMA6uLh97vMQc0jg_iQ4qv3LV',
    moyasarPublicKey: 'pk_test_8FRQCpWq1UkQ55WexM6UEZ2moe711bwveGhyjg8i',
    siteOriginHost: hostname,
    bookingOriginHost: hostname,
    defaultDryRunIssue: true,
    showTestPaymentCards: true,
    enableCardFeePreview: true,
    enableOfferPriceFlow: true,
    paymentReturnUrl: `${window.location.origin}/booking.html`
  };

  const sandboxConfig = {
    environment: 'sandbox-ndc',
    backendUrl: 'https://peaceful-amazement-production-629f.up.railway.app',
    agencyKey: 'ag_eed8b706614bee6a4712686d1026f02b6a862485',
    moyasarPublicKey: 'pk_test_8FRQCpWq1UkQ55WexM6UEZ2moe711bwveGhyjg8i',
    supabaseUrl: 'https://kirvqjgyxjyvwflghchw.supabase.co',
    supabaseAnonKey: 'sb_publishable_d4W5pK3xjBVqFRb3Y1h06Q_tIUmCwCa',
    // siteOriginHost is hardcoded to sandbox.aviaframe.com so the backend
    // routes all requests from this config through its DRCT sandbox + Moyasar
    // test paths, regardless of the actual browser hostname.
    siteOriginHost: 'sandbox.aviaframe.com',
    portalUrl: 'https://admin.aviaframe.com',
    defaultDryRunIssue: false,
    showTestPaymentCards: true,
    enableCardFeePreview: true,
    enableOfferPriceFlow: true,
    displayCurrencyEnabled: true,
    defaultDisplayCurrency: 'SAR',
    supportedDisplayCurrencies: ['SAR', 'USD', 'EUR'],
    paymentReturnUrl: `${window.location.origin}/booking.html`
  };

  window.AVIAFRAME_RUNTIME_CONFIG = Object.assign(
    isPublicDemoHost ? publicDemoConfig : (isTestEnvHost ? stagingConfig : sandboxConfig),
    window.AVIAFRAME_RUNTIME_CONFIG || {}
  );
})();
