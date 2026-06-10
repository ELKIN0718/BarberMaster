// Barbershop Dashboard
const BarbershopDashboard = {
  currentSection: 'reservations',

  init() {
    if (!Auth.isAuthenticated() || !Auth.hasRole('barbershop')) {
      window.location.hash = '#login';
      return;
    }
    this.render();
    this.showSection('reservations');
  },

  render() {
    render(`
      <div class="page">
        <div class="dashboard-layout">
          <aside class="dashboard-sidebar">
            <h3>Panel de Barbería</h3>
            <div class="sidebar-menu">
              <button class="sidebar-item active" data-section="reservations" onclick="BarbershopDashboard.showSection('reservations')">
                📋 Mis Reservas
              </button>
              <button class="sidebar-item" data-section="services" onclick="BarbershopDashboard.showSection('services')">
                ✂️ Mis Servicios
              </button>
              <button class="sidebar-item" data-section="income" onclick="BarbershopDashboard.showSection('income')">
                💰 Ingresos
              </button>
              <button class="sidebar-item" data-section="profile" onclick="BarbershopDashboard.showSection('profile')">
                👤 Mi Perfil
              </button>
            </div>
          </aside>
          <div class="dashboard-content" id="dashboard-content">
            <div style="text-align:center;padding:2rem">
              <p style="color:var(--text-muted)">Selecciona una sección</p>
            </div>
          </div>
        </div>
      </div>
    `);
  },

  showSection(section) {
    this.currentSection = section;
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    switch (section) {
      case 'reservations': this.showReservations(); break;
      case 'services': this.showServices(); break;
      case 'income': this.showIncome(); break;
      case 'profile': this.showProfile(); break;
    }
  },

  // =========== RESERVATIONS ===========
  async showReservations() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    container.innerHTML = `
      <h2>Mis Reservas</h2>
      <div class="filters-bar">
        <select class="filter-select" id="reservation-status-filter" onchange="BarbershopDashboard.loadReservations()">
          <option value="">Todos los estados</option>
          <option value="reserved">Reservado</option>
          <option value="waiting">En espera</option>
          <option value="completed">Completado</option>
          <option value="lost">Perdido</option>
        </select>
        <input type="date" class="filter-select" id="reservation-date-filter" onchange="BarbershopDashboard.loadReservations()">
        <button class="btn btn-sm btn-outline" onclick="document.getElementById('reservation-status-filter').value='';document.getElementById('reservation-date-filter').value='';BarbershopDashboard.loadReservations()">Limpiar filtros</button>
      </div>
      <div class="table-container" id="reservations-table">
        <div style="text-align:center;padding:2rem">
          <div class="skeleton skeleton-title" style="margin:0 auto 1rem"></div>
          <div class="skeleton skeleton-text" style="margin:0 auto;width:60%"></div>
        </div>
      </div>
    `;

    this.loadReservations();
  },

  async loadReservations() {
    const container = document.getElementById('reservations-table');
    if (!container) return;

    container.innerHTML = showSkeleton(5, 'list');

    try {
      const status = document.getElementById('reservation-status-filter')?.value;
      const date = document.getElementById('reservation-date-filter')?.value;
      const params = {};
      if (status) params.status = status;
      if (date) params.date = date;

      const reservations = await API.getMyReservations(params);
      this.displayReservations(reservations);
    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger);text-align:center">Error: ${err.message}</p>`;
    }
  },

  displayReservations(reservations) {
    const container = document.getElementById('reservations-table');
    if (!container) return;

    if (reservations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No hay reservas</h3>
          <p>No se encontraron reservas con los filtros seleccionados.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Fecha/Hora</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${reservations.map(r => `
            <tr>
              <td><strong style="font-family:'Courier New',monospace;font-size:0.82rem">${r.tracking_code}</strong></td>
              <td>
                <div style="font-weight:600">${r.client_name}</div>
                <div style="font-size:0.8rem;color:var(--text-muted)">${r.client_email}</div>
                ${r.client_phone ? `<div style="font-size:0.8rem;color:var(--text-muted)">${r.client_phone}</div>` : ''}
              </td>
              <td>${r.service_name}</td>
              <td>
                <div>${r.appointment_date}</div>
                <div style="font-size:0.85rem;color:var(--text-muted)">${r.appointment_time?.slice(0, 5)}</div>
              </td>
              <td>${getStatusBadge(r.status)}</td>
              <td>
                ${['reserved', 'waiting'].includes(r.status) ? `
                  <button class="btn btn-sm btn-primary" onclick="BarbershopDashboard.completeReservation('${r.id}')">
                    ✓ Completar
                  </button>
                ` : `<span style="color:var(--text-muted);font-size:0.85rem">—</span>`}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  async completeReservation(id) {
    try {
      const result = await API.completeReservation(id);
      toast('Reserva marcada como completada', 'success');
      this.loadReservations();
    } catch (err) {
      toast(err.message, 'error');
    }
  },

  // =========== SERVICES ===========
  async showServices() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <h2 style="margin-bottom:0">Mis Servicios</h2>
        <button class="btn btn-primary btn-sm" onclick="BarbershopDashboard.showServiceModal()">+ Nuevo servicio</button>
      </div>
      <div id="services-list">
        ${showSkeleton(3, 'list')}
      </div>
    `;

    this.loadServices();
  },

  async loadServices() {
    const container = document.getElementById('services-list');
    if (!container) return;

    try {
      const services = await API.getMyServices();
      this.displayServices(services);
    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  },

  displayServices(services) {
    const container = document.getElementById('services-list');
    if (!container) return;

    if (services.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✂️</div>
          <h3>No tienes servicios</h3>
          <p>Crea tu primer servicio para empezar a recibir reservas.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = services.map(s => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:0.75rem">
        <div>
          <h4 style="font-weight:600;margin-bottom:0.25rem">${s.name}</h4>
          ${s.description ? `<p style="font-size:0.85rem;color:var(--text-secondary)">${s.description}</p>` : ''}
          <div style="display:flex;gap:1rem;margin-top:0.5rem">
            <span style="font-size:0.85rem;font-weight:600;color:var(--primary)">${formatCOP(s.price)}</span>
            <span style="font-size:0.85rem;color:var(--text-muted)">⏱ ${s.duration_minutes} min</span>
          </div>
        </div>
        <div class="table-actions">
          <button class="btn btn-sm btn-outline" onclick="BarbershopDashboard.showServiceModal('${s.id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="BarbershopDashboard.deleteService('${s.id}')">Eliminar</button>
        </div>
      </div>
    `).join('');
  },

  showServiceModal(serviceId) {
    const isEdit = !!serviceId;

    showModal(`
      <h3>${isEdit ? 'Editar servicio' : 'Nuevo servicio'}</h3>
      <div id="service-modal-form">
        <div class="form-group">
          <label class="form-label">Nombre del servicio *</label>
          <input type="text" class="form-input" id="service-name" placeholder="Ej: Corte clásico">
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" id="service-desc" placeholder="Descripción del servicio"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-group">
            <label class="form-label">Precio (COP) *</label>
            <input type="number" class="form-input" id="service-price" placeholder="25000" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Duración (min) *</label>
            <input type="number" class="form-input" id="service-duration" placeholder="30" min="5" value="30">
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:1rem" id="service-save-btn" onclick="BarbershopDashboard.saveService('${serviceId || ''}')">
          <span class="btn-text">${isEdit ? 'Guardar cambios' : 'Crear servicio'}</span>
          <span class="btn-spinner"></span>
        </button>
      </div>
    `);
  },

  async saveService(serviceId) {
    const name = document.getElementById('service-name')?.value.trim();
    const description = document.getElementById('service-desc')?.value.trim();
    const price = parseFloat(document.getElementById('service-price')?.value);
    const duration = parseInt(document.getElementById('service-duration')?.value);

    if (!name) { toast('El nombre del servicio es requerido', 'error'); return; }
    if (!price || price <= 0) { toast('Ingresa un precio válido', 'error'); return; }
    if (!duration || duration < 5) { toast('La duración debe ser al menos 5 minutos', 'error'); return; }

    const btn = document.getElementById('service-save-btn');
    setLoading(btn, true);

    try {
      if (serviceId) {
        await API.updateService(serviceId, { name, description, price, duration_minutes: duration });
        toast('Servicio actualizado', 'success');
      } else {
        await API.createService({ name, description, price, duration_minutes: duration });
        toast('Servicio creado', 'success');
      }
      closeModal();
      this.loadServices();
    } catch (err) {
      setLoading(btn, false);
      toast(err.message, 'error');
    }
  },

  async deleteService(id) {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      await API.deleteService(id);
      toast('Servicio eliminado', 'success');
      this.loadServices();
    } catch (err) {
      toast(err.message, 'error');
    }
  },

  // =========== INCOME ===========
  async showIncome() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    container.innerHTML = `
      <h2>💰 Ingresos</h2>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem">Resumen de ingresos generados por tus servicios</p>

      <div class="kpi-grid" id="income-kpi-grid">
        ${Array(4).fill(0).map(() => `
          <div class="kpi-card">
            <div class="skeleton skeleton-text" style="height:2rem;width:60%;margin:0 auto 0.5rem"></div>
            <div class="skeleton skeleton-text" style="width:80%;margin:0 auto"></div>
          </div>
        `).join('')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:2rem">
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem">
          <h4 style="font-family:var(--font-display);font-size:0.95rem;margin-bottom:0.75rem">📅 Hoy</h4>
          <div id="income-today">
            <p style="color:var(--text-muted)">Cargando...</p>
          </div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem">
          <h4 style="font-family:var(--font-display);font-size:0.95rem;margin-bottom:0.75rem">📅 Esta semana</h4>
          <div id="income-week">
            <p style="color:var(--text-muted)">Cargando...</p>
          </div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem">
          <h4 style="font-family:var(--font-display);font-size:0.95rem;margin-bottom:0.75rem">📅 Este mes</h4>
          <div id="income-month">
            <p style="color:var(--text-muted)">Cargando...</p>
          </div>
        </div>
      </div>

      <div style="margin-top:2rem">
        <h4 style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:1rem">📊 Ingresos por servicio</h4>
        <div id="income-by-service">
          <div class="skeleton skeleton-text" style="height:1rem;width:80%;margin-bottom:0.5rem"></div>
          <div class="skeleton skeleton-text" style="height:1rem;width:60%"></div>
        </div>
      </div>
    `;

    this.loadIncome();
  },

  async loadIncome() {
    try {
      const stats = await API.getMyIncomeStats();
      this.displayIncome(stats);
    } catch (err) {
      document.getElementById('income-kpi-grid').innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  },

  displayIncome(stats) {
    const { totals, today, thisWeek, thisMonth, byService } = stats;

    // KPIs generales
    const kpiGrid = document.getElementById('income-kpi-grid');
    if (kpiGrid) {
      kpiGrid.innerHTML = `
        <div class="kpi-card">
          <div class="kpi-value">${totals.total_reservations}</div>
          <div class="kpi-label">Reservas pagadas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${totals.completed_reservations}</div>
          <div class="kpi-label">Completadas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${formatCOP(totals.total_revenue)}</div>
          <div class="kpi-label">Ingreso bruto total</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value" style="color:var(--success)">${formatCOP(totals.net_income)}</div>
          <div class="kpi-label">Ingreso neto (sin comisión)</div>
        </div>
      `;
    }

    // Períodos
    this.renderPeriodCard('income-today', today);
    this.renderPeriodCard('income-week', thisWeek);
    this.renderPeriodCard('income-month', thisMonth);

    // Por servicio
    const byServiceContainer = document.getElementById('income-by-service');
    if (!byServiceContainer) return;

    if (!byService || byService.length === 0) {
      byServiceContainer.innerHTML = `
        <div class="empty-state" style="padding:1rem">
          <div class="empty-icon">📊</div>
          <h3>Sin datos</h3>
          <p>Aún no hay ingresos registrados por servicio.</p>
        </div>
      `;
      return;
    }

    byServiceContainer.innerHTML = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th style="text-align:center">Cantidad</th>
              <th style="text-align:right">Ingreso total</th>
              <th style="text-align:right">Lo que recibes</th>
            </tr>
          </thead>
          <tbody>
            ${byService.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td style="text-align:center">${s.count}</td>
                <td style="text-align:right">${formatCOP(s.revenue)}</td>
                <td style="text-align:right;font-weight:600;color:var(--success)">${formatCOP(s.net)}</td>
              </tr>
            `).join('')}
            <tr style="font-weight:700;background:var(--primary-glow)">
              <td><strong>Total</strong></td>
              <td style="text-align:center">${byService.reduce((a, s) => a + Number(s.count), 0)}</td>
              <td style="text-align:right">${formatCOP(byService.reduce((a, s) => a + Number(s.revenue), 0))}</td>
              <td style="text-align:right;color:var(--success)">${formatCOP(byService.reduce((a, s) => a + Number(s.net), 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  renderPeriodCard(elementId, data) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.4rem">
        <div style="display:flex;justify-content:space-between;font-size:0.9rem">
          <span style="color:var(--text-secondary)">Reservas</span>
          <span style="font-weight:600">${data.count}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.9rem">
          <span style="color:var(--text-secondary)">Ingreso bruto</span>
          <span style="font-weight:600">${formatCOP(data.revenue)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.9rem">
          <span style="color:var(--text-secondary)">Comisión</span>
          <span style="color:var(--text-muted)">- ${formatCOP(data.commission)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1rem;border-top:1px solid var(--border);padding-top:0.4rem;margin-top:0.2rem">
          <span style="font-weight:600">Neto</span>
          <span style="font-weight:700;color:var(--success)">${formatCOP(data.net)}</span>
        </div>
      </div>
    `;
  },

  // =========== PROFILE ===========
  async showProfile() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    container.innerHTML = `
      <h2>Mi Perfil</h2>
      <div id="profile-form">
        ${showSkeleton(4, 'list')}
      </div>
    `;

    this.loadProfile();
  },

  async loadProfile() {
    try {
      const profile = await API.getMyProfile();
      this.displayProfile(profile);
    } catch (err) {
      document.getElementById('profile-form').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>Completa tu perfil</h3>
          <p>No tienes un perfil aún. Llena el formulario para empezar.</p>
        </div>
        ${this.profileFormHtml(null)}
      `;
    }
  },

  profileFormHtml(profile) {
    return `
      <form onsubmit="BarbershopDashboard.saveProfile(event)" style="max-width:600px">
        <div class="form-group">
          <label class="form-label">Nombre de la barbería</label>
          <input type="text" class="form-input" id="prof-name" value="${profile?.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" id="prof-desc">${profile?.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-input" id="prof-address" value="${profile?.address || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input type="text" class="form-input" id="prof-phone" value="${profile?.phone || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Email de contacto</label>
          <input type="email" class="form-input" id="prof-email" value="${profile?.email || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">URL del logo</label>
          <input type="url" class="form-input" id="prof-logo" value="${profile?.logo_url || ''}" placeholder="https://ejemplo.com/logo.png">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem">
          <div class="form-group">
            <label class="form-label">Hora apertura</label>
            <input type="time" class="form-input" id="prof-open" value="${profile?.open_time?.slice(0, 5) || '09:00'}">
          </div>
          <div class="form-group">
            <label class="form-label">Hora cierre</label>
            <input type="time" class="form-input" id="prof-close" value="${profile?.close_time?.slice(0, 5) || '20:00'}">
          </div>
          <div class="form-group">
            <label class="form-label">Duración slot (min)</label>
            <input type="number" class="form-input" id="prof-slot" value="${profile?.slot_duration_minutes || 30}" min="15" step="15">
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:1rem" id="profile-save-btn">
          <span class="btn-text">Guardar perfil</span>
          <span class="btn-spinner"></span>
        </button>
      </form>
    `;
  },

  displayProfile(profile) {
    const container = document.getElementById('profile-form');
    if (!container) return;
    container.innerHTML = this.profileFormHtml(profile);
  },

  async saveProfile(e) {
    e.preventDefault();

    const data = {
      name: document.getElementById('prof-name')?.value.trim(),
      description: document.getElementById('prof-desc')?.value.trim(),
      address: document.getElementById('prof-address')?.value.trim(),
      phone: document.getElementById('prof-phone')?.value.trim(),
      email: document.getElementById('prof-email')?.value.trim(),
      logo_url: document.getElementById('prof-logo')?.value.trim() || null,
      open_time: document.getElementById('prof-open')?.value,
      close_time: document.getElementById('prof-close')?.value,
      slot_duration_minutes: parseInt(document.getElementById('prof-slot')?.value) || 30,
    };

    if (!data.name) { toast('El nombre de la barbería es requerido', 'error'); return; }

    const btn = document.getElementById('profile-save-btn');
    setLoading(btn, true);

    try {
      await API.updateMyProfile(data);
      toast('Perfil actualizado correctamente', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  },
};
