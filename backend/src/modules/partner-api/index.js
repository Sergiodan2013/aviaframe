'use strict';

const express = require('express');

// Keep initialization lazy. Several legacy route-isolation tests load app.js
// without database environment variables and never call Partner API routes.
const router = express.Router();
let delegate = null;

router.use((req, res, next) => {
  if (!delegate) {
    const supabase = require('../../lib/supabase');
    const logger = require('../../lib/logger');
    const drctClient = require('../../services/drctDirectClient');
    const { createPartnerApiAuth } = require('./auth');
    const { createPartnerRepository } = require('./repository');
    const { createPartnerApiRouter } = require('./routes');

    delegate = createPartnerApiRouter({
      authenticate: createPartnerApiAuth(supabase),
      repository: createPartnerRepository(supabase),
      drctClient,
      logger,
    });
  }
  return delegate(req, res, next);
});

module.exports = router;
