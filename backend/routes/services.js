const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/services/my - mis servicios
router.get('/my', authenticate, requireRole('barbershop'), async (req, res) => {
  try {
    // Get barbershop id from user
    const bsResult = await pool.query(
      'SELECT id FROM barbershops WHERE user_id = $1',
      [req.user.id]
    );

    if (bsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbería no encontrada. Completa tu perfil primero.' });
    }

    const barbershopId = bsResult.rows[0].id;

    const result = await pool.query(`
      SELECT id, name, description, price, duration_minutes, is_active, created_at
      FROM services
      WHERE barbershop_id = $1 AND is_active = true
      ORDER BY name ASC
    `, [barbershopId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Get my services error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/services - crear servicio
router.post('/', authenticate, requireRole('barbershop'), async (req, res) => {
  try {
    const { name, description, price, duration_minutes } = req.body;

    if (!name || !price || !duration_minutes) {
      return res.status(400).json({ error: 'Nombre, precio y duración son requeridos' });
    }

    if (price <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    const bsResult = await pool.query(
      'SELECT id FROM barbershops WHERE user_id = $1',
      [req.user.id]
    );

    if (bsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }

    const barbershopId = bsResult.rows[0].id;

    const result = await pool.query(`
      INSERT INTO services (barbershop_id, name, description, price, duration_minutes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, price, duration_minutes, is_active, created_at
    `, [barbershopId, name, description || '', price, duration_minutes]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/services/:id - actualizar servicio
router.put('/:id', authenticate, requireRole('barbershop'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration_minutes } = req.body;

    // Verify ownership
    const ownership = await pool.query(`
      SELECT s.id FROM services s
      JOIN barbershops b ON b.id = s.barbershop_id
      WHERE s.id = $1 AND b.user_id = $2
    `, [id, req.user.id]);

    if (ownership.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const result = await pool.query(`
      UPDATE services SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        duration_minutes = COALESCE($4, duration_minutes)
      WHERE id = $5
      RETURNING id, name, description, price, duration_minutes, is_active, created_at
    `, [name, description, price, duration_minutes, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/services/:id - soft delete
router.delete('/:id', authenticate, requireRole('barbershop'), async (req, res) => {
  try {
    const { id } = req.params;

    const ownership = await pool.query(`
      SELECT s.id FROM services s
      JOIN barbershops b ON b.id = s.barbershop_id
      WHERE s.id = $1 AND b.user_id = $2
    `, [id, req.user.id]);

    if (ownership.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    await pool.query(
      'UPDATE services SET is_active = false WHERE id = $1',
      [id]
    );

    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
