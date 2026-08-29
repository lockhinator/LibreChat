const express = require('express');
const { createDeveloperAccessHandler } = require('@librechat/api');
const { requireJwtAuth } = require('~/server/middleware');

const router = express.Router();
const bridgeUrl = process.env.LIBRECHAT_BRIDGE_URL;
const bridgeKey = process.env.LIBRECHAT_BRIDGE_KEY;

router.get(
  '/',
  requireJwtAuth,
  createDeveloperAccessHandler({
    bridgeUrl,
    bridgeKey,
  }),
);

module.exports = router;
