require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bucket = process.env.SUPABASE_BUCKET || 'metadata';

supabase.storage.from(bucket).list('')
  .then(({ data, error }) => {
    if (error) console.error('Supabase list error:', error.message);
    else console.log('Supabase list success:', data);
  });
