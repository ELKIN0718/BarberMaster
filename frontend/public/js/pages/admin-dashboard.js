// Admin Dashboard
const AdminDashboard = {
  currentSection: 'dashboard',

  init() {
    if (!Auth.isAuthenticated() || !Auth.hasRole('admin')) {
      window.location.hash = '#login';
      return;
    }
    this.render();
    this.showSection('dashboard');
  },

  render() {
    render(`
      <div class="page">
        <div class="dashboard-layout">
          <aside class="dashboard-sidebar">
            <h3>Panel Admin</h3>
            <div class="sidebar-menu">
              <button class="sidebar-item active" data-section="dashboard" onclick="AdminDashboard.showSection('dashboard')">
                📊 Dashboard
              </button>
              <button class="sidebar-item" data-section="barbershops" onclick="AdminDashboard.showSection('barbershops')">
                🏪 Barberías
              </button>
              <button class="sidebar-item" data-section="reservations" onclick="AdminDashboard.showSection('reservations')">
                📋 Reservas
              </button>
            </div>
          </aside>
          <div class="dashboard-content" id="dashboard-content">
            <div style="text-align:center;padding:2rem">
              <p style="color:var(--text-muted)">Cargando...</p>
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
      case 'dashboard': this.showDashboard(); break;
      case 'barbershops': this.showBarbershops(); break;
      case 'reservations': this.showReservations(); break;
    }
  },

  // =========== DASHBOARD ===========
  async showDashboard() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    container.innerHTML = `
      <h2>Dashboard</h2>
      <div class="kpi-grid" id="kpi-grid">
        ${Array(4).fill(0).map(() => `
          <div class="kpi-card">
            <div class="skeleton skeleton-text" style="height:2rem;width:60%;margin:0 auto 0.5rem"></div>
            <div class="skeleton skeleton-text" style="width:80%;margin:0 auto"></div>
          </div>
        `).join('')}
      </div>
    `;

    try {
      const stats = await API.getAdminStats();
      this.displayStats(stats);
    } catch (err) {
      container.innerHTML += `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  },

  displayStats(stats) {
    const grid = document.getElementById('kpi-grid');
    if (!grid) return;

    grid.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-value">${stats.active_barbershops}</div>
        <div class="kpi-label">Barberías activas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${stats.total_reservations}</div>
        <div class="kpi-label">Reservas confirmadas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${formatCOP(stats.total_commission)}</div>
        <div class="kpi-label">Comisión total generada</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${formatCOP(stats.total_volume)}</div>
        <div class="kpi-label">Volumen transaccional total</div>
      </div>
    `;
  },

  // =========== BARBERSHOPS ===========
  async showBarbershops() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <h2 style="margin-bottom:0">Barberías</h2>
        <button class="btn btn-primary btn-sm" onclick="AdminDashboard.showCreateModal()">+ Crear cuenta</button>
      </div>
      <div class="table-container" id="barbershops-table">
        ${showSkeleton(4, 'list')}
      </div>
    `;

    this.loadBarbershops();
  },

  async loadBarbershops() {
    const container = document.getElementById('barbershops-table');
    if (!container) return;

    try {
      const barbershops = await API.getAdminBarbershops();
      this.displayBarbershopsList(barbershops);
    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  },

  displayBarbershopsList(barbershops) {
    const container = document.getElementById('barbershops-table');
    if (!container) return;

    if (barbershops.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏪</div>
          <h3>No hay barberías registradas</h3>
          <p>Crea la primera cuenta de barbería para empezar.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Comisión%</th>
            <th>Reservas</th>
            <th>Comisión ganada</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${barbershops.map(b => `
            <tr>
              <td><strong>${b.name}</strong></td>
              <td style="font-size:0.85rem">${b.user_email}</td>
              <td>${b.commission_percent}%</td>
              <td>${b.total_reservations}</td>
              <td>${formatCOP(b.total_commission_earned)}</td>
              <td>${b.is_active ? '<span style="color:var(--success);font-weight:600">Activo</span>' : '<span style="color:var(--danger);font-weight:600">Inactivo</span>'}</td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-sm btn-outline" onclick="AdminDashboard.showCommissionModal('${b.id}', '${b.name}', ${b.commission_percent})">
                    💰 Comisión
                  </button>
                  <button class="btn btn-sm ${b.is_active ? 'btn-danger' : 'btn-primary'}" onclick="AdminDashboard.toggleBarbershop('${b.id}', ${b.is_active})">
                    ${b.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="AdminDashboard.deleteBarbershop('${b.id}', '${b.name}')">
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  showCommissionModal(id, name, currentCommission) {
    showModal(`
      <h3>Editar comisión</h3>
      <p style="color:var(--text-secondary);margin-bottom:1rem">Barbería: <strong>${name}</strong></p>
      <div class="form-group">
        <label class="form-label">Porcentaje de comisión</label>
        <input type="number" class="form-input" id="commission-input" value="${currentCommission}" min="0" max="100" step="0.1">
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="AdminDashboard.updateCommission('${id}')">
        <span class="btn-text">Guardar</span>
        <span class="btn-spinner"></span>
      </button>
    `);
  },

  async updateCommission(id) {
    const commission = parseFloat(document.getElementById('commission-input')?.value);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast('La comisión debe estar entre 0 y 100', 'error');
      return;
    }

    try {
      await API.updateCommission(id, commission);
      toast('Comisión actualizada', 'success');
      closeModal();
      this.loadBarbershops();
    } catch (err) {
      toast(err.message, 'error');
    }
  },

  showCreateModal() {
    showModal(`
      <h3>Crear cuenta de barbería</h3>
      <div class="form-group">
        <label class="form-label">Email *</label>
        <input type="email" class="form-input" id="create-email" placeholder="barberia@email.com">
      </div>
      <div class="form-group">
        <label class="form-label">Contraseña *</label>
        <input type="password" class="form-input" id="create-password" placeholder="Mínimo 6 caracteres">
      </div>
      <div class="form-group">
        <label class="form-label">Nombre de la barbería *</label>
        <input type="text" class="form-input" id="create-name" placeholder="Ej: Barbería El Corte">
      </div>
      <div class="form-group">
        <label class="form-label">Comisión (%)</label>
        <input type="number" class="form-input" id="create-commission" value="10" min="0" max="100" step="0.1">
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="AdminDashboard.createAccount()">
        <span class="btn-text">Crear cuenta</span>
        <span class="btn-spinner"></span>
      </button>
    `);
  },

  async createAccount() {
    const email = document.getElementById('create-email')?.value.trim();
    const password = document.getElementById('create-password')?.value;
    const name = document.getElementById('create-name')?.value.trim();
    const commission = parseFloat(document.getElementById('create-commission')?.value) || 10;

    if (!email || !password || !name) {
      toast('Todos los campos son requeridos', 'error');
      return;
    }

    if (password.length < 6) {
      toast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    const btn = document.querySelector('#modal-body .btn');
    setLoading(btn, true);

    try {
      await API.createBarbershopAccount({ email, password, name, commission_percent: commission });
      toast('Cuenta creada exitosamente', 'success');
      closeModal();
      this.loadBarbershops();
    } catch (err) {
      setLoading(btn, false);
      toast(err.message, 'error');
    }
  },

  async toggleBarbershop(id, currentStatus) {
    try {
      const result = await API.toggleBarbershop(id);
      toast(result.message, 'success');
      this.loadBarbershops();
    } catch (err) {
      toast(err.message, 'error');
    }
  },

  async deleteBarbershop(id, name) {
    if (!confirm(`¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

    try {
      const result = await API.deleteBarbershop(id);
      toast(result.message || 'Barbería eliminada', 'success');
      this.loadBarbershops();
    } catch (err) {
      toast(err.message, 'error');
    }
  },

  // =========== RESERVATIONS ===========
  async showReservations() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    container.innerHTML = `
      <h2>Todas las Reservas</h2>
      <div class="table-container" id="admin-reservations-table">
        ${showSkeleton(5, 'list')}
      </div>
    `;

    try {
      const reservations = await API.getAdminReservations();
      this.displayAllReservations(reservations);
    } catch (err) {
      document.getElementById('admin-reservations-table').innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  },

  displayAllReservations(reservations) {
    const container = document.getElementById('admin-reservations-table');
    if (!container) return;

    if (reservations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No hay reservas confirmadas</h3>
          <p>Las reservas aparecerán aquí una vez que los clientes realicen el pago.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Barbería</th>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Fecha/Hora</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Comisión</th>
          </tr>
        </thead>
        <tbody>
          ${reservations.map(r => `
            <tr>
              <td><strong style="font-family:'Courier New',monospace;font-size:0.82rem">${r.tracking_code}</strong></td>
              <td>${r.barbershop_name}</td>
              <td>
                <div style="font-weight:600">${r.client_name}</div>
                <div style="font-size:0.8rem;color:var(--text-muted)">${r.client_email}</div>
              </td>
              <td>${r.service_name}</td>
              <td>
                <div>${r.appointment_date}</div>
                <div style="font-size:0.85rem;color:var(--text-muted)">${r.appointment_time?.slice(0, 5)}</div>
              </td>
              <td>${getStatusBadge(r.status)}</td>
              <td style="font-weight:600">${formatCOP(r.total_amount)}</td>
              <td style="color:var(--primary);font-weight:600">${formatCOP(r.commission_amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },
};
