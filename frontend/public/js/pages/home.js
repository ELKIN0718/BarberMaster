// Home Page
const HomePage = {
  init() {
    this.render();
  },

  render() {
    render(`
      <div class="page home-page">
        <section class="hero">
          <div class="hero-badge">
            <span>✂️</span>
            <span>Tu estilo, tu momento</span>
          </div>
          <h1 class="hero-title">Reserva tu estilo<br>sin esperas</h1>
          <p class="hero-subtitle">
            Encuentra las mejores barberías de Cartagena, reserva tu cita en segundos 
            y olvídate de las largas filas. Tu próximo corte está a un clic.
          </p>
          <div class="hero-actions">
            <a href="#barbershops" class="btn btn-primary btn-lg">
              <span>Ver barberías</span>
              <span>→</span>
            </a>
            <a href="#track" class="btn btn-outline btn-lg">
              <span>Rastrear reserva</span>
            </a>
          </div>
        </section>

        <section class="benefits-grid">
          <div class="benefit-card">
            <span class="benefit-icon">⏱️</span>
            <h3>Sin filas</h3>
            <p>Reserva tu cita desde casa y llega justo a tiempo. Tu tiempo vale oro.</p>
          </div>
          <div class="benefit-card">
            <span class="benefit-icon">📍</span>
            <h3>Las mejores barberías</h3>
            <p>Descubre las barberías mejor calificadas de Cartagena, todas en un solo lugar.</p>
          </div>
          <div class="benefit-card">
            <span class="benefit-icon">💳</span>
            <h3>Pago seguro</h3>
            <p>Reserva con total tranquilidad. Sin sorpresas, sin compromisos.</p>
          </div>
          <div class="benefit-card">
            <span class="benefit-icon">🔍</span>
            <h3>Seguimiento en vivo</h3>
            <p>Rastrea el estado de tu reserva en tiempo real con tu código único.</p>
          </div>
        </section>
      </div>
    `);
  },
};
