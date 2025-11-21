// upload_metadata.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET;

const filePath = './local_ehr/e8a9410e-f27f-445e-895c-e81258b71d19.json';
const fileName = 'e8a9410e-f27f-445e-895c-e81258b71d19.json';

async function uploadFile() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const fileContent = fs.readFileSync(filePath);

  const { data, error } = await supabase
    .storage
    .from(SUPABASE_BUCKET)
    .upload(fileName, fileContent, { upsert: true, contentType: 'application/json' });

  if (error) {
    console.error('Upload error:', error);
  } else {
    console.log('Upload success:', data);
  }
}

uploadFile();
