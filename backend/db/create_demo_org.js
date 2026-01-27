#!/usr/bin/env node
// Script to create a demo organization in Supabase
// Run: node backend/db/create_demo_org.js

require('dotenv').config();
const supabase = require('../src/lib/supabase');

async function createDemoOrganization() {
  console.log('Creating demo organization in Supabase...\n');

  try {
    // Check if organization already exists
    const { data: existing, error: checkError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', 'Aviaframe Demo')
      .single();

    if (existing) {
      console.log('✅ Demo organization already exists:');
      console.log(JSON.stringify(existing, null, 2));
      return existing;
    }

    // Create new organization
    const { data, error } = await supabase
      .from('organizations')
      .insert([
        {
          name: 'Aviaframe Demo',
          legal_name: 'Aviaframe Demo LLC',
          primary_country: 'AE',
          default_currency: 'AED',
          default_locale: 'en-US',
          status: 'active',
          metadata: {
            demo: true,
            created_by: 'setup_script',
            description: 'Demo organization for testing'
          }
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating organization:', error);
      throw error;
    }

    console.log('✅ Demo organization created successfully:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📋 Save this tenant_id for your .env file:');
    console.log(`DEMO_TENANT_ID=${data.id}`);

    return data;
  } catch (err) {
    console.error('❌ Failed to create demo organization:', err.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createDemoOrganization()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = createDemoOrganization;
