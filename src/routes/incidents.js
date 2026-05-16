const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
} = require('../data/store');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 52428800 } });
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const VALID_CATEGORIES = ['Physical Security', 'IT Security', 'Facilities', 'Other'];
const VALID_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const VALID_STATUSES = ['Pending', 'Investigating', 'Resolved'];
const LOCATION_REQUIRED_CATEGORIES = ['Physical Security', 'Facilities'];

function isValidCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    !Number.isNaN(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === 'number' &&
    !Number.isNaN(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

function parseCoordinates(body) {
  const hasLat = body.latitude !== undefined && body.latitude !== null && body.latitude !== '';
  const hasLng = body.longitude !== undefined && body.longitude !== null && body.longitude !== '';

  if (!hasLat && !hasLng) {
    return { latitude: null, longitude: null };
  }

  return {
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
  };
}

router.use(authenticate);

router.post('/', requireRole('employee'), upload.single('evidence'), async (req, res) => {
  const { title, category, description, severity, locationLabel } = req.body;
  const { latitude, longitude } = parseCoordinates(req.body);

  if (!title?.trim() || !category || !description?.trim() || !severity) {
    return res.status(400).json({
      error: 'Title, category, description, and severity are required',
    });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  if (!VALID_SEVERITIES.includes(severity)) {
    return res.status(400).json({ error: 'Invalid severity level' });
  }

  if (LOCATION_REQUIRED_CATEGORIES.includes(category)) {
    if (!isValidCoordinates(latitude, longitude)) {
      return res.status(400).json({
        error: 'Please mark the hazard location on the map for this category',
      });
    }
  } else if (
    (latitude !== null || longitude !== null) &&
    !isValidCoordinates(latitude, longitude)
  ) {
    return res.status(400).json({ error: 'Invalid map coordinates' });
  }

  try {
    let evidenceUrl = null;
    if (req.file) {
      const fileName = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload evidence file' });
      }
      
      const { data: publicUrlData } = supabase.storage.from('evidence').getPublicUrl(fileName);
      evidenceUrl = publicUrlData.publicUrl;
    }

    let finalDescription = description.trim();
    if (evidenceUrl) {
      finalDescription += `\n\n**Evidence Attached:** [View File](${evidenceUrl})`;
    }

    const incident = await createIncident({
      title: title.trim(),
      category,
      description: finalDescription,
      severity,
      latitude: isValidCoordinates(latitude, longitude) ? latitude : null,
      longitude: isValidCoordinates(latitude, longitude) ? longitude : null,
      locationLabel: locationLabel?.trim() || null,
      reporterId: req.user.id,
      reporterName: req.user.name,
      reporterEmail: req.user.email,
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

router.get('/', async (req, res) => {
  const { severity } = req.query;

  if (severity && !VALID_SEVERITIES.includes(severity)) {
    return res.status(400).json({ error: 'Invalid severity filter' });
  }

  if (req.user.role === 'admin') {
    const incidents = await getIncidents({ severity });
    return res.json(incidents);
  }

  const incidents = await getIncidents({ reporterId: req.user.id, severity });
  return res.json(incidents);
});

router.get('/:id', async (req, res) => {
  const incident = await getIncidentById(req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  if (req.user.role !== 'admin' && incident.reporterId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(incident);
});

router.patch('/:id/status', requireRole('admin'), async (req, res) => {
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'Status must be one of: Pending, Investigating, Resolved',
    });
  }

  const incident = await updateIncidentStatus(req.params.id, status, req.user.name);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  res.json(incident);
});

module.exports = router;
