#!/usr/bin/env node
// Check searches in Supabase database
require('dotenv').config();
const supabase = require('../src/lib/supabase');

async function checkSearches() {
  console.log('📊 Checking searches in database...\n');

  try {
    const { data, error } = await supabase
      .from('searches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching searches:', error);
      throw error;
    }

    console.log(`✅ Found ${data.length} search(es) in database:\n`);

    data.forEach((search, index) => {
      console.log(`${index + 1}. Search ID: ${search.id}`);
      console.log(`   Route: ${search.origin} → ${search.destination}`);
      console.log(`   Date: ${search.depart_date}${search.return_date ? ' - ' + search.return_date : ' (one-way)'}`);
      console.log(`   Passengers: ${search.adults} adults, ${search.children} children, ${search.infants} infants`);
      console.log(`   Cabin: ${search.cabin_class}`);
      console.log(`   Offers: ${search.offers_count}`);
      console.log(`   Duration: ${search.search_duration_ms}ms`);
      console.log(`   Source: ${search.source}`);
      console.log(`   Tenant ID: ${search.tenant_id}`);
      console.log(`   Created: ${search.created_at}`);
      console.log('');
    });

    if (data.length === 0) {
      console.log('⚠️  No searches found. Try making a search request first.');
    }

  } catch (err) {
    console.error('❌ Failed to check searches:', err.message);
    process.exit(1);
  }
}

// Run
checkSearches()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
