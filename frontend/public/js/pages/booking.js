// Booking Page - 4 Step Flow
const BookingPage = {
  barbershopId: null,
  barbershop: null,
  services: null,
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
  slots: null,
  reservationId: null,
  reservation: null,
  currentStep: 1,

  init(params) {
    this.barbershopId = params ? params[0] : null;
    if (!this.barbershopId) {
      window.location.hash = '#barbershops';
      return;
    }
    this.currentStep = 1;
    this.selectedService = null;
    this.selectedDate = null;
    this.selectedTime = null;
    this.slots = null;
    this.reservationId = null;
    this.reservation = null;
    this.render();
    this.loadBarbershop();
  },

  render() {
    render(`
      <div class="page booking-page">
        <div class="booking-container">
          <div class="booking-steps" id="booking-steps">
            <div class="booking-step active" data-step="1">
              <span class="booking-step-number">1</span>
              <span>Servicio</span>
            </div>
            <div class="booking-step" data-step="2">
              <span class="booking-step-number">2</span>
              <span>Fecha y hora</span>
            </div>
            <div class="booking-step" data-step="3">
              <span class="booking-step-number">3</span>
              <span>Tus datos</span>
            </div>
            <div class="booking-step" data-step="4">
              <span class="booking-step-number">4</span>
              <span>Pago</span>
            </div>
          </div>
          <div id="booking-content">
            <div style="text-align:center;padding:3rem 0">
              <div class="skeleton skeleton-title" style="margin:0 auto 1rem"></div>
              <div class="skeleton skeleton-text" style="margin:0 auto;width:60%"></div>
            </div>
          </div>
        </div>
      </div>
    `);
  },

  updateSteps() {
    const steps = document.querySelectorAll('.booking-step');
    steps.forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active', 'completed');
      if (stepNum < this.currentStep) step.classList.add('completed');
      if (stepNum === this.currentStep) step.classList.add('active');
    });
  },

  async loadBarbershop() {
    try {
      const data = await API.getBarbershop(this.barbershopId);
      this.barbershop = data;
      this.services = data.services || [];
      this.showStep1();
    } catch (err) {
      document.getElementById('booking-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏪</div>
          <h3>Barbería no encontrada</h3>
          <p>${err.message}</p>
          <a href="#barbershops" class="btn btn-primary" style="margin-top:1rem">Volver a barberías</a>
        </div>
      `;
    }
  },

  showStep1() {
    this.currentStep = 1;
    this.updateSteps();
    const content = document.getElementById('booking-content');
    if (!content) return;

    if (!this.services.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✂️</div>
          <h3>Esta barbería no tiene servicios disponibles</h3>
          <a href="#barbershops" class="btn btn-primary" style="margin-top:1rem">Volver</a>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div style="margin-bottom:1.5rem">
        <h3 style="font-family:var(--font-display);font-weight:700;font-size:1.3rem">${this.barbershop.name}</h3>
        ${this.barbershop.address ? `<p style="color:var(--text-secondary);font-size:0.9rem">📍 ${this.barbershop.address}</p>` : ''}
      </div>
      <h4 style="margin-bottom:1rem;font-size:1rem;color:var(--text-secondary)">Selecciona un servicio:</h4>
      <div class="service-list">
        ${this.services.map(s => `
          <div class="service-item" data-id="${s.id}" onclick="BookingPage.selectService('${s.id}')">
            <div class="service-info">
              <h4>${s.name}</h4>
              ${s.description ? `<p>${s.description}</p>` : ''}
              <span class="service-duration">⏱ ${s.duration_minutes} min</span>
            </div>
            <div style="text-align:right">
              <div class="service-price">${formatCOP(s.price)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  selectService(serviceId) {
    const items = document.querySelectorAll('.service-item');
    items.forEach(i => i.classList.remove('selected'));
    const selected = document.querySelector(`.service-item[data-id="${serviceId}"]`);
    if (selected) selected.classList.add('selected');

    this.selectedService = this.services.find(s => s.id === serviceId);
    if (this.selectedService) {
      this.showStep2();
    }
  },

  showStep2() {
    this.currentStep = 2;
    this.updateSteps();
    const content = document.getElementById('booking-content');
    if (!content) return;

    const today = new Date().toISOString().split('T')[0];

    content.innerHTML = `
      <h4 style="margin-bottom:0.5rem">Servicio seleccionado: <strong>${this.selectedService.name}</strong> - ${formatCOP(this.selectedService.price)}</h4>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem;font-size:0.9rem">⏱ ${this.selectedService.duration_minutes} minutos</p>

      <label class="form-label">Selecciona una fecha:</label>
      <input type="date" class="date-input" id="date-input" min="${today}" value="${this.selectedDate || ''}">

      <label class="form-label">Selecciona un horario:</label>
      <div id="time-slots" style="margin-top:0.5rem">
        <p style="color:var(--text-muted);font-size:0.9rem">Primero selecciona una fecha</p>
      </div>
    `;

    const dateInput = document.getElementById('date-input');
    dateInput.addEventListener('change', () => {
      this.selectedDate = dateInput.value;
      if (this.selectedDate) {
        this.loadSlots();
      }
    });

    if (this.selectedDate) {
      dateInput.value = this.selectedDate;
      this.loadSlots();
    }
  },

  async loadSlots() {
    const slotsContainer = document.getElementById('time-slots');
    if (!slotsContainer) return;

    slotsContainer.innerHTML = '<p style="color:var(--text-muted)">Cargando horarios...</p>';

    try {
      const data = await API.getAvailability(this.barbershopId, this.selectedDate);
      this.slots = data.slots || [];

      if (!this.slots.length) {
        slotsContainer.innerHTML = '<p style="color:var(--text-muted)">No hay horarios disponibles para esta fecha</p>';
        return;
      }

      slotsContainer.innerHTML = `
        <div class="time-grid">
          ${this.slots.map(s => `
            <button class="time-slot ${this.selectedTime === s.time ? 'selected' : ''}" 
                    ${!s.available ? 'disabled' : ''}
                    onclick="BookingPage.selectTime('${s.time}')">
              ${s.time.slice(0, 5)}
            </button>
          `).join('')}
        </div>
      `;
    } catch (err) {
      slotsContainer.innerHTML = `<p style="color:var(--danger)">Error al cargar horarios: ${err.message}</p>`;
    }
  },

  selectTime(time) {
    this.selectedTime = time;
    const slots = document.querySelectorAll('.time-slot');
    slots.forEach(s => s.classList.remove('selected'));
    const selected = Array.from(slots).find(s => s.textContent.trim() === time.slice(0, 5));
    if (selected) selected.classList.add('selected');
    this.showStep3();
  },

  showStep3() {
    this.currentStep = 3;
    this.updateSteps();
    const content = document.getElementById('booking-content');
    if (!content) return;

    content.innerHTML = `
      <h4 style="margin-bottom:0.5rem">Resumen de tu selección:</h4>
      <div style="background:var(--primary-glow);padding:1rem;border-radius:var(--radius-sm);margin-bottom:1.5rem">
        <p><strong>${this.selectedService.name}</strong> - ${formatCOP(this.selectedService.price)}</p>
        <p style="font-size:0.9rem;color:var(--text-secondary)">📅 ${formatDate(this.selectedDate)} - ${this.selectedTime.slice(0, 5)}</p>
      </div>

      <h4 style="margin-bottom:1rem">Tus datos:</h4>
      <div class="form-group">
        <label class="form-label">Nombre completo *</label>
        <input type="text" class="form-input" id="client-name" placeholder="Ej: Juan Pérez" required>
        <div class="form-error" id="name-error">El nombre es requerido</div>
      </div>
      <div class="form-group">
        <label class="form-label">Correo electrónico *</label>
        <input type="email" class="form-input" id="client-email" placeholder="Ej: juan@email.com" required>
        <div class="form-error" id="email-error">Ingresa un email válido</div>
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono (opcional)</label>
        <input type="tel" class="form-input" id="client-phone" placeholder="Ej: 3001234567">
      </div>
      <div class="form-group">
        <label class="form-label">Notas (opcional)</label>
        <textarea class="form-textarea" id="client-notes" placeholder="Alguna preferencia o comentario..."></textarea>
      </div>
      <button class="btn btn-primary btn-lg" style="width:100%;margin-top:1rem" onclick="BookingPage.confirmBooking()">
        <span class="btn-text">Confirmar reserva</span>
        <span class="btn-spinner"></span>
      </button>
    `;
  },

  async confirmBooking() {
    const name = document.getElementById('client-name')?.value.trim();
    const email = document.getElementById('client-email')?.value.trim();
    const phone = document.getElementById('client-phone')?.value.trim();
    const notes = document.getElementById('client-notes')?.value.trim();

    // Validate
    let valid = true;
    if (!name) {
      document.getElementById('name-error')?.classList.add('visible');
      document.getElementById('client-name')?.classList.add('error');
      valid = false;
    }
    if (!email || !email.includes('@')) {
      document.getElementById('email-error')?.classList.add('visible');
      document.getElementById('client-email')?.classList.add('error');
      valid = false;
    }

    if (!valid) return;

    const btn = document.querySelector('#booking-content .btn');
    setLoading(btn, true);

    try {
      const reservation = await API.initiateReservation({
        barbershop_id: this.barbershopId,
        service_id: this.selectedService.id,
        client_name: name,
        client_email: email,
        client_phone: phone || null,
        appointment_date: this.selectedDate,
        appointment_time: this.selectedTime,
        notes: notes || null,
      });

      this.reservationId = reservation.id;
      this.reservation = reservation;
      this.showStep4();
    } catch (err) {
      setLoading(btn, false);
      toast(err.message, 'error');
    }
  },

  showStep4() {
    this.currentStep = 4;
    this.updateSteps();
    const content = document.getElementById('booking-content');
    if (!content) return;

    content.innerHTML = `
      <h4 style="margin-bottom:1rem">Resumen de reserva</h4>
      <div class="reservation-summary">
        <div class="summary-row">
          <span class="summary-label">Barbería</span>
          <span>${this.barbershop.name}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Servicio</span>
          <span>${this.selectedService.name}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Fecha</span>
          <span>${formatDate(this.selectedDate)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Hora</span>
          <span>${this.selectedTime.slice(0, 5)}</span>
        </div>
        <div class="summary-row total">
          <span class="summary-label">Total</span>
          <span>${formatCOP(this.selectedService.price)}</span>
        </div>
      </div>

      <h4 style="margin-bottom:1rem">Simulación de pago</h4>

      <!-- Card Preview -->
      <div class="card-preview" id="card-preview">
        <div class="card-chip"></div>
        <div class="card-number-display" id="card-number-display">•••• •••• •••• ••••</div>
        <div class="card-details">
          <div>
            <div class="card-detail-label">Titular</div>
            <div class="card-detail-value" id="card-name-display">Tu nombre</div>
          </div>
          <div>
            <div class="card-detail-label">Vence</div>
            <div class="card-detail-value" id="card-expiry-display">MM/AA</div>
          </div>
        </div>
      </div>

      <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem">
        💡 Usa cualquier número de tarjeta que NO empiece con 0000. Las tarjetas 0000 son de prueba y serán rechazadas.
      </p>

      <div class="form-group">
        <label class="form-label">Número de tarjeta</label>
        <input type="text" class="form-input" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19" inputmode="numeric">
      </div>
      <div class="form-group">
        <label class="form-label">Nombre del titular</label>
        <input type="text" class="form-input" id="card-name" placeholder="Como aparece en la tarjeta">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="form-group">
          <label class="form-label">Fecha expiración</label>
          <input type="text" class="form-input" id="card-expiry" placeholder="MM/AA" maxlength="5">
        </div>
        <div class="form-group">
          <label class="form-label">CVV</label>
          <input type="text" class="form-input" id="card-cvv" placeholder="123" maxlength="4" inputmode="numeric">
        </div>
      </div>
      <button class="btn btn-primary btn-lg" style="width:100%;margin-top:1rem" onclick="BookingPage.processPayment()">
        <span class="btn-text">Pagar ${formatCOP(this.selectedService.price)}</span>
        <span class="btn-spinner"></span>
      </button>
    `;

    // Card auto-format
    const cardNumber = document.getElementById('card-number');
    cardNumber?.addEventListener('input', (e) => {
      const formatted = formatCardNumber(e.target.value);
      e.target.value = formatted;
      document.getElementById('card-number-display').textContent = formatted || '•••• •••• •••• ••••';
    });

    const cardName = document.getElementById('card-name');
    cardName?.addEventListener('input', (e) => {
      document.getElementById('card-name-display').textContent = e.target.value || 'Tu nombre';
    });

    const cardExpiry = document.getElementById('card-expiry');
    cardExpiry?.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
      e.target.value = v;
      document.getElementById('card-expiry-display').textContent = v || 'MM/AA';
    });
  },

  async processPayment() {
    const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '');
    const cardName = document.getElementById('card-name')?.value.trim();
    const cardExpiry = document.getElementById('card-expiry')?.value.trim();
    const cardCvv = document.getElementById('card-cvv')?.value.trim();

    if (!cardNumber || cardNumber.length < 13) {
      toast('Ingresa un número de tarjeta válido', 'error');
      return;
    }
    if (!cardName) {
      toast('Ingresa el nombre del titular', 'error');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      toast('Ingresa la fecha de expiración', 'error');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      toast('Ingresa el CVV', 'error');
      return;
    }

    const btn = document.querySelector('#booking-content .btn');
    setLoading(btn, true);

    try {
      const result = await API.payReservation(this.reservationId, {
        card_number: cardNumber,
        card_name: cardName,
        expiry: cardExpiry,
        cvv: cardCvv,
      });

      this.reservation = result;
      this.showSuccess();
    } catch (err) {
      setLoading(btn, false);
      if (err.message.includes('rechazada')) {
        toast('❌ Tarjeta rechazada. Intenta con otro número que no empiece con 0000.', 'error');
      } else {
        toast(err.message, 'error');
      }
    }
  },

  showSuccess() {
    const content = document.getElementById('booking-content');
    if (!content) return;

    content.innerHTML = `
      <div class="success-page">
        <div class="success-icon">✅</div>
        <h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:700;margin-bottom:0.5rem">
          ¡Reserva confirmada!
        </h2>
        <p style="color:var(--text-secondary);margin-bottom:2rem">
          Tu reserva ha sido procesada exitosamente. Guarda tu código de seguimiento:
        </p>
        <div class="tracking-code-display">
          ${this.reservation.tracking_code}
          <button class="copy-btn" onclick="BookingPage.copyCode()">
            📋 Copiar
          </button>
        </div>
        <div class="reservation-summary" style="text-align:left;margin-top:2rem">
          <div class="summary-row">
            <span class="summary-label">Barbería</span>
            <span>${this.barbershop.name}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Servicio</span>
            <span>${this.selectedService.name}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Fecha</span>
            <span>${formatDate(this.selectedDate)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Hora</span>
            <span>${this.selectedTime.slice(0, 5)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Estado</span>
            <span>${getStatusBadge(this.reservation.status)}</span>
          </div>
          <div class="summary-row total">
            <span class="summary-label">Total pagado</span>
            <span>${formatCOP(this.selectedService.price)}</span>
          </div>
        </div>
        <div style="display:flex;gap:1rem;justify-content:center;margin-top:1.5rem;flex-wrap:wrap">
          <a href="#track" class="btn btn-outline">Rastrear reserva</a>
          <a href="#barbershops" class="btn btn-primary">Reservar otra cita</a>
        </div>
      </div>
    `;
  },

  copyCode() {
    const code = this.reservation?.tracking_code;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        toast('Código copiado al portapapeles', 'success');
      }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        toast('Código copiado al portapapeles', 'success');
      });
    }
  },
};
