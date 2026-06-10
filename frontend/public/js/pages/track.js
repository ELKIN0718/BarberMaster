// Track Reservation Page
const TrackPage = {
  init() {
    this.render();
  },

  render() {
    render(`
      <div class="page">
        <div class="track-container">
          <div class="section-header">
            <h2>Rastrear reserva</h2>
            <p>Ingresa tu código de seguimiento para ver el estado de tu cita</p>
          </div>

          <div class="track-form">
            <input type="text" class="form-input" id="track-code" 
                   placeholder="BM-XXXXXXXX" maxlength="11"
                   style="text-transform:uppercase;letter-spacing:2px;font-family:'Courier New',monospace">
            <button class="btn btn-primary" id="track-btn" onclick="TrackPage.search()">
              <span class="btn-text">Buscar</span>
              <span class="btn-spinner"></span>
            </button>
          </div>

          <div id="track-result"></div>
        </div>
      </div>
    `);

    // Allow enter key to search
    const input = document.getElementById('track-code');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.search();
    });

    // Allow lowercase/uppercase (the backend handles case-insensitive search)
  },

  async search() {
    const code = document.getElementById('track-code')?.value.trim();
    if (!code) {
      toast('Ingresa un código de seguimiento', 'error');
      return;
    }

    const btn = document.getElementById('track-btn');
    setLoading(btn, true);

    try {
      const reservation = await API.trackReservation(code);
      this.showResult(reservation);
    } catch (err) {
      document.getElementById('track-result').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Reserva no encontrada</h3>
          <p>No encontramos ninguna reserva con el código "${code}". Verifica e intenta de nuevo.</p>
        </div>
      `;
    } finally {
      setLoading(btn, false);
    }
  },

  showResult(reservation) {
    const container = document.getElementById('track-result');

    const statusOrder = ['reserved', 'waiting', 'completed', 'lost'];
    const currentIndex = statusOrder.indexOf(reservation.status);
    const showTimelineStatuses = ['reserved', 'waiting', 'completed'];

    // Determine which statuses to show (lost or completed is final)
    const showCompleted = reservation.status === 'completed';
    const showLost = reservation.status === 'lost';

    container.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:2rem">
        <div style="text-align:center;margin-bottom:1.5rem">
          <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;margin-bottom:0.5rem">
            Código de seguimiento
          </div>
          <div style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--primary);letter-spacing:3px">
            ${reservation.tracking_code}
            <button class="copy-btn" onclick="TrackPage.copyCode('${reservation.tracking_code}')">📋 Copiar</button>
          </div>
        </div>

        <div style="text-align:center;margin-bottom:1.5rem">
          ${getStatusBadge(reservation.status)}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
          <div>
            <p style="font-size:0.82rem;color:var(--text-muted)">Barbería</p>
            <p style="font-weight:600">${reservation.barbershop_name}</p>
            ${reservation.barbershop_address ? `<p style="font-size:0.85rem;color:var(--text-secondary)">📍 ${reservation.barbershop_address}</p>` : ''}
          </div>
          <div>
            <p style="font-size:0.82rem;color:var(--text-muted)">Servicio</p>
            <p style="font-weight:600">${reservation.service_name}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary)">⏱ ${reservation.duration_minutes} min</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
          <div>
            <p style="font-size:0.82rem;color:var(--text-muted)">Cliente</p>
            <p style="font-weight:600">${reservation.client_name}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary)">${reservation.client_email}</p>
            ${reservation.client_phone ? `<p style="font-size:0.85rem;color:var(--text-secondary)">${reservation.client_phone}</p>` : ''}
          </div>
          <div>
            <p style="font-size:0.82rem;color:var(--text-muted)">Fecha y hora</p>
            <p style="font-weight:600">${formatDate(reservation.appointment_date)}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary)">${reservation.appointment_time?.slice(0, 5)}</p>
          </div>
        </div>

        <div style="border-top:1px solid var(--border);padding-top:1rem;margin-bottom:1.5rem">
          <div class="summary-row">
            <span class="summary-label">Total</span>
            <span style="font-weight:700">${formatCOP(reservation.total_amount)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Estado de pago</span>
            <span>${getPaymentStatusBadge(reservation.payment_status)}</span>
          </div>
        </div>

        <!-- Timeline -->
        <h4 style="font-family:var(--font-display);margin-bottom:0.75rem;font-size:1rem">Estado de la reserva</h4>
        <div class="timeline">
          <div class="timeline-item ${currentIndex >= 0 ? 'completed' : ''}">
            <div class="timeline-dot">✓</div>
            <div class="timeline-content">
              <h4>Reservado</h4>
              <p>Reserva creada y confirmada</p>
            </div>
          </div>
          <div class="timeline-item ${currentIndex >= 1 ? 'active' : ''}">
            <div class="timeline-dot">⏳</div>
            <div class="timeline-content">
              <h4>En espera</h4>
              <p>30 minutos antes de la cita</p>
            </div>
          </div>
          ${showLost ? `
            <div class="timeline-item active">
              <div class="timeline-dot">❌</div>
              <div class="timeline-content">
                <h4>Perdido</h4>
                <p>El cliente no asistió a la cita</p>
              </div>
            </div>
          ` : ''}
          ${showCompleted ? `
            <div class="timeline-item active">
              <div class="timeline-dot">✓</div>
              <div class="timeline-content">
                <h4>Completado</h4>
                <p>Servicio realizado exitosamente</p>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      toast('Código copiado al portapapeles', 'success');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      toast('Código copiado al portapapeles', 'success');
    });
  },
};
