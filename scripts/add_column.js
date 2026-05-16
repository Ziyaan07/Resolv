require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function addColumn() {
  const { data, error } = await supabase.rpc('add_evidence_url_column');
  if (error) {
    console.error('RPC Error:', error);
    // Let's try raw SQL query if RPC is not defined. Oh wait, we can't run raw SQL from client unless it's a function.
  }
}

addColumn();
