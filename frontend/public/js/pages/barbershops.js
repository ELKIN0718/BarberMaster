// Barbershops Page
const BarbershopsPage = {
  init() {
    this.render();
    this.loadBarbershops();
  },

  render() {
    render(`
      <div class="page barbershops-page">
        <div class="section-header">
          <h2>Barberías disponibles</h2>
          <p>Encuentra la barbería perfecta para tu estilo</p>
        </div>
        <div class="barbershops-grid" id="barbershops-grid">
          ${showSkeleton(6, 'card')}
        </div>
      </div>
    `);
  },

  async loadBarbershops() {
    try {
      const barbershops = await API.getBarbershops();
      this.displayBarbershops(barbershops);
    } catch (err) {
      document.getElementById('barbershops-grid').innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1">
          <div class="empty-icon">🏪</div>
          <h3>No hay barberías disponibles</h3>
          <p>Por el momento no hay barberías activas. ¡Vuelve pronto!</p>
        </div>
      `;
    }
  },

  displayBarbershops(barbershops) {
    const grid = document.getElementById('barbershops-grid');
    if (!grid) return;

    if (barbershops.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1">
          <div class="empty-icon">🏪</div>
          <h3>No hay barberías disponibles</h3>
          <p>Por el momento no hay barberías activas. ¡Vuelve pronto!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = barbershops.map(bs => `
      <div class="barbershop-card">
        <div class="barbershop-card-body">
          <h3>${bs.name}</h3>
          <p class="description">${bs.description || 'Sin descripción'}</p>
          <div class="barbershop-meta">
            ${bs.address ? `<span><span class="icon">📍</span> ${bs.address}</span>` : ''}
            ${bs.phone ? `<span><span class="icon">📞</span> ${bs.phone}</span>` : ''}
            <span><span class="icon">🕐</span> ${bs.open_time?.slice(0, 5) || '09:00'} - ${bs.close_time?.slice(0, 5) || '20:00'}</span>
            <span><span class="icon">✂️</span> ${bs.service_count || 0} servicios</span>
          </div>
          <a href="#booking/${bs.id}" class="btn btn-primary" style="width:100%">
            Reservar ahora
          </a>
        </div>
      </div>
    `).join('');
  },
};
