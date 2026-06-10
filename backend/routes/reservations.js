const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

// Generate tracking code: BM-XXXXXXXX
function generateTrackingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = 'BM-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/reservations/initiate - crear reserva (público)
router.post('/initiate', async (req, res) => {
  try {
    const { barbershop_id, service_id, client_name, client_email, client_phone, appointment_date, appointment_time, notes } = req.body;

    if (!barbershop_id || !service_id || !client_name || !client_email || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Todos los campos requeridos deben ser completados' });
    }

    // Validate service and get price
    const serviceResult = await pool.query(`
      SELECT s.id, s.price, s.duration_minutes, s.barbershop_id, 
             b.commission_percent, b.name as barbershop_name
      FROM services s
      JOIN barbershops b ON b.id = s.barbershop_id
      WHERE s.id = $1 AND s.is_active = true AND b.is_active = true
    `, [service_id]);

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no disponible' });
    }

    const service = serviceResult.rows[0];

    if (service.barbershop_id !== barbershop_id) {
      return res.status(400).json({ error: 'El servicio no pertenece a esta barbería' });
    }

    // Check slot availability
    const slotCheck = await pool.query(`
      SELECT r.id FROM reservations r
      JOIN services s ON s.id = r.service_id
      WHERE r.barbershop_id = $1 
        AND r.appointment_date = $2
        AND r.appointment_time = $3::time
        AND r.status NOT IN ('lost', 'completed')
    `, [barbershop_id, appointment_date, appointment_time]);

    if (slotCheck.rows.length > 0) {
      return res.status(409).json({ error: 'El horario seleccionado ya está ocupado' });
    }

    // Calculate amounts
    const total_amount = parseFloat(service.price);
    const commission_percent = parseFloat(service.commission_percent);
    const commission_amount = parseFloat((total_amount * commission_percent / 100).toFixed(2));
    const barbershop_amount = parseFloat((total_amount - commission_amount).toFixed(2));

    // Generate tracking code
    let tracking_code;
    let codeExists = true;
    while (codeExists) {
      tracking_code = generateTrackingCode();
      const check = await pool.query('SELECT id FROM reservations WHERE tracking_code = $1', [tracking_code]);
      codeExists = check.rows.length > 0;
    }

    // Create appointment_datetime
    const appointment_datetime = `${appointment_date} ${appointment_time}`;

    const result = await pool.query(`
      INSERT INTO reservations (
        tracking_code, barbershop_id, service_id, client_name, client_email, client_phone,
        appointment_date, appointment_time, appointment_datetime, status,
        total_amount, commission_amount, barbershop_amount, payment_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::time, $9::timestamptz, 'reserved',
                $10, $11, $12, 'pending', $13)
      RETURNING id, tracking_code, barbershop_id, service_id, client_name, client_email,
                client_phone, appointment_date, appointment_time, status, total_amount,
                commission_amount, barbershop_amount, payment_status, notes, created_at
    `, [
      tracking_code, barbershop_id, service_id, client_name, client_email, client_phone || null,
      appointment_date, appointment_time, appointment_datetime,
      total_amount, commission_amount, barbershop_amount, notes || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Initiate reservation error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/reservations/:id/pay - simular pago
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { card_number } = req.body;

    if (!card_number) {
      return res.status(400).json({ error: 'Número de tarjeta requerido' });
    }

    // Get reservation
    const reservationResult = await pool.query(`
      SELECT r.*, b.name as barbershop_name, s.name as service_name
      FROM reservations r
      JOIN barbershops b ON b.id = r.barbershop_id
      JOIN services s ON s.id = r.service_id
      WHERE r.id = $1
    `, [id]);

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const reservation = reservationResult.rows[0];

    if (reservation.payment_status !== 'pending') {
      return res.status(400).json({ error: 'Esta reserva ya ha sido pagada o procesada' });
    }

    // Simulate payment - cards starting with 0000 are rejected
    if (card_number.replace(/\s/g, '').startsWith('0000')) {
      return res.status(402).json({ error: 'Tarjeta rechazada. Por favor intenta con otra tarjeta.' });
    }

    // Approve payment
    const result = await pool.query(`
      UPDATE reservations SET
        payment_status = 'simulated',
        payment_simulated_at = NOW(),
        status = 'reserved',
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, tracking_code, barbershop_id, service_id, client_name, client_email,
                client_phone, appointment_date, appointment_time, status, total_amount,
                commission_amount, barbershop_amount, payment_status, payment_simulated_at,
                notes, created_at
    `, [id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Pay reservation error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/reservations/track/:code - rastrear por código (case-insensitive)
router.get('/track/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(`
      SELECT r.id, r.tracking_code, r.client_name, r.client_email, r.client_phone,
             TO_CHAR(r.appointment_date, 'YYYY-MM-DD') AS appointment_date,
             r.appointment_time, r.status, r.total_amount,
             r.commission_amount, r.barbershop_amount, r.payment_status, r.notes,
             r.created_at, r.updated_at,
             b.id as barbershop_id, b.name as barbershop_name, b.address as barbershop_address,
             s.id as service_id, s.name as service_name, s.duration_minutes
      FROM reservations r
      JOIN barbershops b ON b.id = r.barbershop_id
      JOIN services s ON s.id = r.service_id
      WHERE LOWER(r.tracking_code) = LOWER($1)
    `, [code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Track reservation error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/reservations/barbershop/mine?status=X&date=YYYY-MM-DD (auth barbershop)
router.get('/barbershop/mine', authenticate, requireRole('barbershop'), async (req, res) => {
  try {
    const { status, date } = req.query;

    const bsResult = await pool.query(
      'SELECT id FROM barbershops WHERE user_id = $1',
      [req.user.id]
    );

    if (bsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }

    const barbershopId = bsResult.rows[0].id;

    let query = `
      SELECT r.id, r.tracking_code, r.client_name, r.client_email, r.client_phone,
             r.appointment_date, r.appointment_time, r.status, r.total_amount,
             r.payment_status, r.notes, r.created_at,
             s.name as service_name
      FROM reservations r
      JOIN services s ON s.id = r.service_id
      WHERE r.barbershop_id = $1
    `;
    const params = [barbershopId];
    let paramIndex = 2;

    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (date) {
      query += ` AND r.appointment_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    query += ' ORDER BY r.appointment_date DESC, r.appointment_time DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get barbershop reservations error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/reservations/barbershop/stats - estadísticas de ingresos
router.get('/barbershop/stats', authenticate, requireRole('barbershop'), async (req, res) => {
  try {
    const bsResult = await pool.query(
      'SELECT id FROM barbershops WHERE user_id = $1',
      [req.user.id]
    );

    if (bsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }

    const barbershopId = bsResult.rows[0].id;

    // Totales generales
    const totalsResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_reservations,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_reservations,
        COUNT(*) FILTER (WHERE status = 'lost')::int AS lost_reservations,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'simulated'), 0) AS total_revenue,
        COALESCE(SUM(commission_amount) FILTER (WHERE payment_status = 'simulated'), 0) AS total_commission,
        COALESCE(SUM(barbershop_amount) FILTER (WHERE payment_status = 'simulated'), 0) AS net_income
      FROM reservations
      WHERE barbershop_id = $1 AND payment_status = 'simulated'
    `, [barbershopId]);

    // Ingresos hoy
    const todayResult = await pool.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS revenue,
        COALESCE(SUM(commission_amount), 0) AS commission,
        COALESCE(SUM(barbershop_amount), 0) AS net,
        COUNT(*)::int AS count
      FROM reservations
      WHERE barbershop_id = $1
        AND payment_status = 'simulated'
        AND appointment_date = CURRENT_DATE
    `, [barbershopId]);

    // Ingresos esta semana (lunes a domingo)
    const weekResult = await pool.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS revenue,
        COALESCE(SUM(commission_amount), 0) AS commission,
        COALESCE(SUM(barbershop_amount), 0) AS net,
        COUNT(*)::int AS count
      FROM reservations
      WHERE barbershop_id = $1
        AND payment_status = 'simulated'
        AND appointment_date >= date_trunc('week', CURRENT_DATE)
        AND appointment_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
    `, [barbershopId]);

    // Ingresos este mes
    const monthResult = await pool.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS revenue,
        COALESCE(SUM(commission_amount), 0) AS commission,
        COALESCE(SUM(barbershop_amount), 0) AS net,
        COUNT(*)::int AS count
      FROM reservations
      WHERE barbershop_id = $1
        AND payment_status = 'simulated'
        AND appointment_date >= date_trunc('month', CURRENT_DATE)
        AND appointment_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
    `, [barbershopId]);

    // Ingresos por servicio
    const byServiceResult = await pool.query(`
      SELECT
        s.name,
        COUNT(r.id)::int AS count,
        COALESCE(SUM(r.total_amount), 0) AS revenue,
        COALESCE(SUM(r.commission_amount), 0) AS commission,
        COALESCE(SUM(r.barbershop_amount), 0) AS net
      FROM reservations r
      JOIN services s ON s.id = r.service_id
      WHERE r.barbershop_id = $1
        AND r.payment_status = 'simulated'
      GROUP BY s.name
      ORDER BY revenue DESC
    `, [barbershopId]);

    res.json({
      totals: totalsResult.rows[0],
      today: todayResult.rows[0],
      thisWeek: weekResult.rows[0],
      thisMonth: monthResult.rows[0],
      byService: byServiceResult.rows,
    });
  } catch (err) {
    console.error('Get income stats error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /api/reservations/:id/complete - marcar como completada
router.patch('/:id/complete', authenticate, requireRole('barbershop'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership and current status
    const reservationResult = await pool.query(`
      SELECT r.id, r.status, r.barbershop_id
      FROM reservations r
      JOIN barbershops b ON b.id = r.barbershop_id
      WHERE r.id = $1 AND b.user_id = $2
    `, [id, req.user.id]);

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const reservation = reservationResult.rows[0];

    if (!['reserved', 'waiting'].includes(reservation.status)) {
      return res.status(400).json({ error: 'Solo se pueden completar reservas en estado "reservado" o "en espera"' });
    }

    const result = await pool.query(`
      UPDATE reservations SET status = 'completed', updated_at = NOW()
      WHERE id = $1
      RETURNING id, tracking_code, status, updated_at
    `, [id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Complete reservation error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
