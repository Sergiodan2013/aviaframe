import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPaymentReturnUrl,
  buildTamaraReturnUrls,
  getTamaraReturnState,
  isAdminHostname,
  shouldOfferTamara,
  shouldRequireAuthForCheckout,
} from './checkoutFlow.js';

test('isAdminHostname matches only the admin portal domain', () => {
  assert.equal(isAdminHostname('admin.aviaframe.com'), true);
  assert.equal(isAdminHostname('ADMIN.AVIAFRAME.COM'), true);
  assert.equal(isAdminHostname('aesthetic-kleicha-fb98f4.netlify.app'), false);
  assert.equal(isAdminHostname('aviaframe.com'), false);
});

test('shouldRequireAuthForCheckout keeps auth-gated checkout only on admin domain', () => {
  assert.equal(shouldRequireAuthForCheckout('admin.aviaframe.com'), true);
  assert.equal(shouldRequireAuthForCheckout('testenvavia.netlify.app'), false);
  assert.equal(shouldRequireAuthForCheckout('6a4821569d70514983db89d0--aesthetic-kleicha-fb98f4.netlify.app'), false);
});

test('buildPaymentReturnUrl preserves current path and strips search/hash state', () => {
  assert.equal(
    buildPaymentReturnUrl({
      origin: 'https://testenvavia.netlify.app',
      pathname: '/booking.html',
      search: '?foo=bar',
      hash: '#payment',
    }),
    'https://testenvavia.netlify.app/booking.html'
  );

  assert.equal(
    buildPaymentReturnUrl({
      origin: 'https://6a4821569d70514983db89d0--aesthetic-kleicha-fb98f4.netlify.app',
      pathname: '/',
    }),
    'https://6a4821569d70514983db89d0--aesthetic-kleicha-fb98f4.netlify.app/'
  );
});

test('shouldOfferTamara only enables Tamara for SAR flows with config enabled', () => {
  assert.equal(shouldOfferTamara({ tamaraEnabled: true, currency: 'SAR' }), true);
  assert.equal(shouldOfferTamara({ tamaraEnabled: true, currency: 'sar' }), true);
  assert.equal(shouldOfferTamara({ tamaraEnabled: false, currency: 'SAR' }), false);
  assert.equal(shouldOfferTamara({ tamaraEnabled: true, currency: 'UAH' }), false);
});

test('buildTamaraReturnUrls keeps the current page and adds the result markers', () => {
  const urls = buildTamaraReturnUrls({
    origin: 'https://aesthetic-kleicha-fb98f4.netlify.app',
    pathname: '/',
  }, 'ord-123');

  assert.equal(urls.success_url, 'https://aesthetic-kleicha-fb98f4.netlify.app/?tamara_result=success&order_id=ord-123');
  assert.equal(urls.cancel_url, 'https://aesthetic-kleicha-fb98f4.netlify.app/?tamara_result=cancel&order_id=ord-123');
  assert.equal(urls.failure_url, 'https://aesthetic-kleicha-fb98f4.netlify.app/?tamara_result=failure&order_id=ord-123');
});

test('getTamaraReturnState detects both query-based and path-based Tamara returns', () => {
  assert.deepEqual(
    getTamaraReturnState({
      pathname: '/',
      search: '?tamara_result=success&order_id=ord-123',
    }),
    { isTamaraReturn: true, result: 'success', orderId: 'ord-123' }
  );

  assert.deepEqual(
    getTamaraReturnState({
      pathname: '/payments/tamara/cancel',
      search: '?order_id=ord-555',
    }),
    { isTamaraReturn: true, result: 'cancel', orderId: 'ord-555' }
  );
});
