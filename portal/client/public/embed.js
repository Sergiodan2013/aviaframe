(function () {
  var script = document.currentScript;
  if (!script) return;

  var agencyKey = script.getAttribute('data-agency-key');
  if (!agencyKey) {
    console.error('[Aviaframe Widget] data-agency-key is required');
    return;
  }

  var targetId = script.getAttribute('data-target-id') || 'aviaframe-widget';
  var target = document.getElementById(targetId);
  if (!target) {
    console.error('[Aviaframe Widget] target container not found:', targetId);
    return;
  }

  var scriptUrl = new URL(script.src, window.location.href);
  var widgetBase = script.getAttribute('data-widget-base') || scriptUrl.origin;
  var backendBase = script.getAttribute('data-backend-base') || (widgetBase.replace(/\/$/, '') + '/api/backend');
  var theme = script.getAttribute('data-theme') || 'light';
  var locale = script.getAttribute('data-locale') || 'en';
  var height = script.getAttribute('data-height') || '760px';
  var radius = script.getAttribute('data-radius') || '14px';

  var frameUrl = new URL('/widget-frame.html', widgetBase);
  frameUrl.searchParams.set('agency_key', agencyKey);
  frameUrl.searchParams.set('backend_base', backendBase);
  frameUrl.searchParams.set('theme', theme);
  frameUrl.searchParams.set('locale', locale);

  var iframe = document.createElement('iframe');
  iframe.src = frameUrl.toString();
  iframe.style.width = '100%';
  iframe.style.minHeight = height;
  iframe.style.border = '0';
  iframe.style.borderRadius = radius;
  iframe.style.background = '#fff';
  iframe.loading = 'lazy';
  iframe.setAttribute('title', 'Aviaframe Booking Widget');

  target.innerHTML = '';
  target.appendChild(iframe);
})();
