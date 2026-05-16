const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase = null;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn("WARNING: SUPABASE_URL or SUPABASE_KEY is missing. Database operations will fail.");
  }
} catch (e) {
  console.error("Failed to initialize Supabase:", e.message);
}

async function load() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key missing. Database operations will fail.');
  }
}

async function seedDefaults() {
  if (!supabaseUrl || !supabaseKey) return;

  if (!supabase) return;
  const { data: users, error: selectError } = await supabase.from('users').select('id').limit(1);
  if (selectError) {
    console.error('Error checking users in Supabase:', selectError);
    return;
  }

  if (users.length === 0) {
    const defaultPassword = await bcrypt.hash('password123', 10);
    const { error: insertError } = await supabase.from('users').insert([
      {
        email: 'employee@company.com',
        passwordHash: defaultPassword,
        name: 'Alex Morgan',
        role: 'employee',
      },
      {
        email: 'security@company.com',
        passwordHash: defaultPassword,
        name: 'Jordan Chen',
        role: 'admin',
      },
    ]);
    if (insertError) {
      console.error('Error seeding default users:', insertError);
    }
  }
}

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .single();
  if (error) return null;
  return data;
}

async function findUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

async function createUser(payload) {
  const { email, password, name, role } = payload;
  const passwordHash = await bcrypt.hash(password, 10);
  
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email: email.toLowerCase(),
      passwordHash,
      name,
      role
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user. Email may already exist.');
  }
  return data;
}

async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role')
    .order('id', { ascending: true });
    
  if (error) return [];
  return data;
}

async function createIncident(payload) {
  const incidentData = {
    ...payload,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('incidents')
    .insert([incidentData])
    .select()
    .single();

  if (error) {
    console.error('Error creating incident:', error);
    throw new Error('Failed to create incident');
  }
  return data;
}

async function getIncidents({ reporterId, severity } = {}) {
  let query = supabase
    .from('incidents')
    .select('*, incident_logs(*)')
    .order('createdAt', { ascending: false });

  if (reporterId) {
    query = query.eq('reporterId', reporterId);
  }
  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error getting incidents:', error);
    return [];
  }
  return data;
}

async function getIncidentById(id) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*, incident_logs(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

async function updateIncidentStatus(id, status, changedBy = 'System', note = null) {
  const { data: currentIncident, error: getError } = await supabase
    .from('incidents')
    .select('status')
    .eq('id', id)
    .single();
    
  if (getError || !currentIncident) return null;
  const fromStatus = currentIncident.status;

  const { data, error } = await supabase
    .from('incidents')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating incident status:', error);
    return null;
  }

  if (fromStatus !== status || note) {
    await supabase.from('incident_logs').insert([{
      incidentId: id,
      changedBy,
      fromStatus,
      toStatus: status,
      note,
      createdAt: new Date().toISOString()
    }]);
  }

  return data;
}

module.exports = {
  load,
  seedDefaults,
  findUserByEmail,
  findUserById,
  createUser,
  getUsers,
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
};
