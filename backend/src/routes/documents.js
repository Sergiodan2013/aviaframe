'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { config } = require('../config');
const { resolveAuthContext, forbidden } = require('../middleware/auth');
const { canAccessDocument, createSignedDocumentUrl } = require('../services/orderService');

// GET /api/documents/:documentId/download (mounted at /api)
router.get('/documents/:documentId/download', async (req, res) => {
  const auth = await resolveAuthContext(req);
  if (auth.error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: auth.error } });
  }

  const { documentId } = req.params;
  try {
    const { data: doc, error } = await supabase
      .from('document_files')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !doc) {
      return res.status(404).json({
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' }
      });
    }

    const canAccess = await canAccessDocument(auth, doc);
    if (!canAccess) {
      return forbidden(res);
    }

    const signedUrl = await createSignedDocumentUrl(doc.storage_bucket, doc.storage_path, 3600);
    return res.json({ url: signedUrl });
  } catch (err) {
    console.error('Document download error:', err);
    return res.status(500).json({
      error: {
        code: 'DOCUMENT_DOWNLOAD_FAILED',
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
      }
    });
  }
});

module.exports = router;
