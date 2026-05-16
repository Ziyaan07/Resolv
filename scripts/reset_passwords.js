require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function resetPasswords() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const { error: err1 } = await supabase
    .from('users')
    .update({ passwordHash: hashedPassword })
    .in('email', ['employee@company.com', 'security@company.com']);

  if (err1) {
    console.error("Error updating passwords:", err1);
  } else {
    console.log("Passwords successfully reset to 'password123'");
  }
}

resetPasswords();
