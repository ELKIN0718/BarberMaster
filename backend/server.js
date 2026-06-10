const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// No cache for index.html (so script cache-busting with ?v= works)
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

// Serve static files from frontend/public
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// API Routes
const authRoutes = require('./routes/auth');
const barbershopsRoutes = require('./routes/barbershops');
const servicesRoutes = require('./routes/services');
const reservationsRoutes = require('./routes/reservations');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/barbershops', barbershopsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/admin', adminRoutes);

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

// Status update scheduler - runs every 60 seconds
async function updateReservationStatuses() {
  try {
    // reserved -> waiting (30 min before appointment)
    const waitingResult = await pool.query(`
      UPDATE reservations
      SET status = 'waiting', updated_at = NOW()
      WHERE status = 'reserved'
        AND payment_status = 'simulated'
        AND appointment_datetime <= NOW() + INTERVAL '30 minutes'
        AND appointment_datetime > NOW()
      RETURNING id, tracking_code
    `);

    if (waitingResult.rows.length > 0) {
      console.log(`[Scheduler] ${waitingResult.rows.length} reservas cambiadas a "waiting"`);
    }

    // reserved/waiting -> lost (5 min after appointment)
    const lostResult = await pool.query(`
      UPDATE reservations
      SET status = 'lost', updated_at = NOW()
      WHERE status IN ('reserved', 'waiting')
        AND appointment_datetime <= NOW() - INTERVAL '5 minutes'
      RETURNING id, tracking_code
    `);

    if (lostResult.rows.length > 0) {
      console.log(`[Scheduler] ${lostResult.rows.length} reservas cambiadas a "lost"`);
    }
  } catch (err) {
    console.error('[Scheduler] Error updating statuses:', err.message);
  }
}

// Run status update every 60 seconds
setInterval(updateReservationStatuses, 60 * 1000);

// Initial status update on startup
updateReservationStatuses();

// Start server
app.listen(PORT, () => {
  console.log(`BarberMaster server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`pgAdmin: http://localhost:5050 (admin@barbermaster.com / admin123)`);
});

module.exports = app;
