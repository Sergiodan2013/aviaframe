const widget = require('../src/index');

test('widget returns html', () => {
  expect(widget()).toContain('aviaframe-widget');
});