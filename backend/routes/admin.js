const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM barbershops WHERE is_active = true) AS active_barbershops,
        (SELECT COUNT(*) FROM barbershops) AS total_barbershops,
        (SELECT COUNT(*) FROM reservations WHERE payment_status = 'simulated') AS total_reservations,
        (SELECT COUNT(*) FROM reservations WHERE status IN ('reserved', 'waiting') AND payment_status = 'simulated') AS active_reservations,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM reservations WHERE payment_status = 'simulated') AS total_commission,
        (SELECT COALESCE(SUM(total_amount), 0) FROM reservations WHERE payment_status = 'simulated') AS total_volume
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/admin/barbershops
router.get('/barbershops', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id, b.name, b.description, b.address, b.phone, b.email,
        b.commission_percent, b.is_active, b.created_at,
        u.email AS user_email, u.is_active AS user_is_active,
        COUNT(DISTINCT r.id) FILTER (WHERE r.payment_status = 'simulated') AS total_reservations,
        COALESCE(SUM(r.commission_amount) FILTER (WHERE r.payment_status = 'simulated'), 0) AS total_commission_earned
      FROM barbershops b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN reservations r ON r.barbershop_id = b.id
      GROUP BY b.id, u.email, u.is_active
      ORDER BY b.name ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get admin barbershops error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/admin/barbershops/create-account
router.post('/barbershops/create-account', async (req, res) => {
  try {
    const { email, password, name, commission_percent } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Check existing email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const commission = commission_percent !== undefined ? parseFloat(commission_percent) : 10;

    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email.toLowerCase().trim(), password_hash, 'barbershop']
    );

    const user = userResult.rows[0];

    const bsResult = await pool.query(`
      INSERT INTO barbershops (user_id, name, commission_percent)
      VALUES ($1, $2, $3)
      RETURNING id, name, commission_percent, is_active
    `, [user.id, name, commission]);

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      barbershop: bsResult.rows[0],
    });
  } catch (err) {
    console.error('Create barbershop account error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /api/admin/barbershops/:id/commission
router.patch('/barbershops/:id/commission', async (req, res) => {
  try {
    const { id } = req.params;
    const { commission_percent } = req.body;

    if (commission_percent === undefined || commission_percent < 0 || commission_percent > 100) {
      return res.status(400).json({ error: 'Comisión debe ser entre 0 y 100' });
    }

    const result = await pool.query(`
      UPDATE barbershops SET commission_percent = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, commission_percent
    `, [parseFloat(commission_percent), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update commission error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /api/admin/barbershops/:id/toggle
router.patch('/barbershops/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const bsResult = await pool.query(
      'SELECT id, is_active, user_id FROM barbershops WHERE id = $1',
      [id]
    );

    if (bsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }

    const barbershop = bsResult.rows[0];
    const newStatus = !barbershop.is_active;

    // Toggle both barbershop and user
    await pool.query('UPDATE barbershops SET is_active = $1, updated_at = NOW() WHERE id = $2', [newStatus, id]);
    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [newStatus, barbershop.user_id]);

    res.json({ id, is_active: newStatus, message: newStatus ? 'Barbería activada' : 'Barbería desactivada' });
  } catch (err) {
    console.error('Toggle barbershop error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/admin/barbershops/:id — elimina cuenta y barbería
router.delete('/barbershops/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the barbershop and its user_id first
    const bsResult = await pool.query(
      'SELECT id, name, user_id FROM barbershops WHERE id = $1',
      [id]
    );

    if (bsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }

    const { name, user_id } = bsResult.rows[0];

    // Delete the user account first (CASCADE will handle barbershop deletion)
    const userResult = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(500).json({ error: 'Error al eliminar la cuenta de usuario' });
    }

    res.json({ message: `Barbería "${name}" y su cuenta de usuario eliminadas correctamente` });
  } catch (err) {
    console.error('Delete barbershop error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/admin/reservations
router.get('/reservations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.tracking_code, r.client_name, r.client_email, r.client_phone,
             r.appointment_date, r.appointment_time, r.status, r.total_amount,
             r.commission_amount, r.barbershop_amount, r.payment_status, r.created_at,
             b.name AS barbershop_name,
             s.name AS service_name
      FROM reservations r
      JOIN barbershops b ON b.id = r.barbershop_id
      JOIN services s ON s.id = r.service_id
      WHERE r.payment_status = 'simulated'
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get admin reservations error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
