const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/barbershops - lista barberías activas con conteo de servicios
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id, b.name, b.description, b.address, b.phone, b.email, 
        b.logo_url, b.open_time, b.close_time, b.slot_duration_minutes,
        b.is_active, b.created_at,
        COUNT(s.id) FILTER (WHERE s.is_active = true) AS service_count
      FROM barbershops b
      LEFT JOIN services s ON s.barbershop_id = b.id
      WHERE b.is_active = true
      GROUP BY b.id
      ORDER BY b.name ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get barbershops error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/barbershops/me/profile - perfil propio (auth barbershop)
// IMPORTANT: Must be defined BEFORE /:id routes to avoid Express matching "me" as :id
router.get('/me/profile', authenticate, requireRole('barbershop'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, address, phone, email, logo_url,
             open_time, close_time, slot_duration_minutes, is_active,
             created_at, updated_at
      FROM barbershops
      WHERE user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil de barbería no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/barbershops/me/profile - crea/actualiza perfil
// IMPORTANT: Must be defined BEFORE /:id routes
router.post('/me/profile', authenticate, requireRole('barbershop'), async (req, res) => {
  try {
    const { name, description, address, phone, email, logo_url, open_time, close_time, slot_duration_minutes } = req.body;

    // Check if profile exists
    const existing = await pool.query(
      'SELECT id FROM barbershops WHERE user_id = $1',
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      // Update
      const result = await pool.query(`
        UPDATE barbershops SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          address = COALESCE($3, address),
          phone = COALESCE($4, phone),
          email = COALESCE($5, email),
          logo_url = COALESCE($6, logo_url),
          open_time = COALESCE($7::time, open_time),
          close_time = COALESCE($8::time, close_time),
          slot_duration_minutes = COALESCE($9, slot_duration_minutes),
          updated_at = NOW()
        WHERE user_id = $10
        RETURNING id, name, description, address, phone, email, logo_url, 
                  open_time, close_time, slot_duration_minutes, is_active
      `, [name, description, address, phone, email, logo_url, open_time, close_time, slot_duration_minutes, req.user.id]);

      return res.json(result.rows[0]);
    } else {
      // Create
      const result = await pool.query(`
        INSERT INTO barbershops (user_id, name, description, address, phone, email, logo_url, open_time, close_time, slot_duration_minutes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::time, $9::time, $10)
        RETURNING id, name, description, address, phone, email, logo_url,
                  open_time, close_time, slot_duration_minutes, is_active
      `, [req.user.id, name, description, address, phone, email, logo_url, open_time, close_time, slot_duration_minutes]);

      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    console.error('Upsert profile error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/barbershops/:id - detalle + servicios activos
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const barbershopResult = await pool.query(`
      SELECT id, name, description, address, phone, email, logo_url, 
             open_time, close_time, slot_duration_minutes, is_active
      FROM barbershops 
      WHERE id = $1 AND is_active = true
    `, [id]);

    if (barbershopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }

    const servicesResult = await pool.query(`
      SELECT id, name, description, price, duration_minutes, is_active
      FROM services
      WHERE barbershop_id = $1 AND is_active = true
      ORDER BY name ASC
    `, [id]);

    res.json({
      ...barbershopResult.rows[0],
      services: servicesResult.rows,
    });
  } catch (err) {
    console.error('Get barbershop detail error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/barbershops/:id/availability?date=YYYY-MM-DD
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Parámetro date requerido (YYYY-MM-DD)' });
    }

    const barbershopResult = await pool.query(`
      SELECT open_time, close_time, slot_duration_minutes
      FROM barbershops WHERE id = $1 AND is_active = true
    `, [id]);

    if (barbershopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }

    const { open_time, close_time, slot_duration_minutes } = barbershopResult.rows[0];

    // Get existing reservations for that date
    const reservationsResult = await pool.query(`
      SELECT appointment_time, duration_minutes
      FROM reservations r
      JOIN services s ON s.id = r.service_id
      WHERE r.barbershop_id = $1 
        AND r.appointment_date = $2
        AND r.status NOT IN ('lost', 'completed')
    `, [id, date]);

    const occupiedSlots = new Set();
    reservationsResult.rows.forEach(r => {
      const startMinutes = timeToMinutes(r.appointment_time);
      const duration = r.duration_minutes || slot_duration_minutes;
      for (let m = 0; m < duration; m += slot_duration_minutes) {
        occupiedSlots.add(minutesToTime(startMinutes + m));
      }
    });

    // Generate slots
    const openMinutes = timeToMinutes(open_time);
    const closeMinutes = timeToMinutes(close_time);
    const slots = [];

    for (let m = openMinutes; m + slot_duration_minutes <= closeMinutes; m += slot_duration_minutes) {
      const time = minutesToTime(m);
      slots.push({
        time,
        available: !occupiedSlots.has(time),
      });
    }

    res.json({ date, slots });
  } catch (err) {
    console.error('Get availability error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Helper functions
function timeToMinutes(time) {
  const [h, m] = time.toString().split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

module.exports = router;
