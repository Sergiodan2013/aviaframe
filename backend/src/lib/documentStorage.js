'use strict';

const crypto = require('crypto');

function toSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function uploadPdfToStorage(supabaseClient, buffer, storagePath) {
  const { error } = await supabaseClient.storage
    .from(storagePath.split('/')[0])
    .upload(storagePath.slice(storagePath.indexOf('/') + 1), buffer, {
      contentType: 'application/pdf',
      upsert: true
    });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return storagePath;
}

async function saveDocumentMetadata(supabaseClient, meta) {
  const {
    docType,
    entityType,
    entityId,
    agencyId = null,
    orderId = null,
    invoiceId = null,
    fileName,
    storagePath,
    storageBucket,
    sizeBytes,
    checksum,
    createdBy,
    metadata = {}
  } = meta;

  const payload = {
    doc_type: docType,
    entity_type: entityType,
    entity_id: entityId,
    agency_id: agencyId,
    order_id: orderId,
    invoice_id: invoiceId,
    file_name: fileName,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    content_type: 'application/pdf',
    size_bytes: sizeBytes,
    checksum_sha256: checksum,
    created_by: createdBy,
    metadata
  };

  const { data, error } = await supabaseClient
    .from('document_files')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Document metadata save failed: ${error.message}`);
  }
  return data;
}

async function createSignedDocumentUrl(supabaseClient, storagePath, expiresInSeconds = 3600) {
  const slashIdx = storagePath.indexOf('/');
  const bucket = storagePath.slice(0, slashIdx);
  const path = storagePath.slice(slashIdx + 1);
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to create signed URL');
  }
  return data.signedUrl;
}

module.exports = {
  toSha256,
  uploadPdfToStorage,
  saveDocumentMetadata,
  createSignedDocumentUrl,
};
