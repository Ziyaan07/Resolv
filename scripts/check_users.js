require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('id, email, name, role');
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  console.log("Current Users in DB:");
  console.table(data);
}

checkUsers();
