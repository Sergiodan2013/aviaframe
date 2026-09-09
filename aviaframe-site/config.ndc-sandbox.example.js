window.AVIAFRAME_RUNTIME_CONFIG = Object.assign(
  {
    environment: 'sandbox-ndc',
    backendUrl: 'https://peaceful-amazement-production-629f.up.railway.app',
    agencyKey: 'ag_eed8b706614bee6a4712686d1026f02b6a862485',
    moyasarPublicKey: 'pk_test_8FRQCpWq1UkQ55WexM6UEZ2moe711bwveGhyjg8i',
    // Keep the actual site on any domain you want, but route booking/payment
    // requests into the dedicated sandbox contour recognized by the backend.
    siteOriginHost: 'sandbox.aviaframe.com',
    portalUrl: 'https://admin.aviaframe.com',
    defaultDryRunIssue: false,
    showTestPaymentCards: true,
    enableCardFeePreview: true,
    enableOfferPriceFlow: true,
    paymentReturnUrl: `${window.location.origin}/booking.html`
  },
  window.AVIAFRAME_RUNTIME_CONFIG || {}
);
