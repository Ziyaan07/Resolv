require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function setupBucket() {
  const { data, error } = await supabase.storage.createBucket('evidence', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists.');
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket created:', data);
  }
}

setupBucket();
