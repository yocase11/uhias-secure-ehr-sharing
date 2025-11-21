// Script to re-upload missing metadata for all .ehr files in local_ehr
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'metadata';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LOCAL_EHR_DIR = path.join(__dirname, 'local_ehr');

async function main() {
  const files = fs.readdirSync(LOCAL_EHR_DIR).filter(f => f.endsWith('.ehr'));
  for (const file of files) {
    const uid = file.replace('.ehr', '');
    // Check if metadata exists in Supabase
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .download(`${uid}.json`);
    let exists = false;
    if (data && !error) {
      try {
        for await (const _ of data.stream()) {
          exists = true;
          break;
        }
      } catch {}
    }
    if (exists) {
      console.log(`Metadata for ${uid} already exists in Supabase.`);
      continue;
    }
    // Prompt user for reportName and date
    const readline = require('readline-sync');
    const reportName = readline.question(`Enter report/scan name for UID ${uid}: `);
    const date = readline.question(`Enter date (YYYY-MM-DD) for UID ${uid}: `);
    const metaObj = { recordId: uid, reportName, date };
    const uploadRes = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .upload(`${uid}.json`, JSON.stringify(metaObj), { contentType: 'application/json', upsert: true });
    if (uploadRes.error) {
      console.error(`Failed to upload metadata for ${uid}:`, uploadRes.error.message);
    } else {
      console.log(`Uploaded metadata for ${uid}.`);
    }
  }
}

main();
