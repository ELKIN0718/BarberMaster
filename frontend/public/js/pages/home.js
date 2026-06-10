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

        <!-- ===== Política de Protección de Datos ===== -->
        <section class="privacy-section" id="privacidad">
          <div class="section-header">
            <h2>🔒 Política de Protección de Datos</h2>
            <p>Tu privacidad es nuestra prioridad. Conoce cómo protegemos tu información.</p>
          </div>

          <div class="privacy-card">
            <div class="privacy-icon">📋</div>
            <h3>1. Información que recopilamos</h3>
            <p>Recopilamos los datos personales que nos proporcionas directamente al realizar una reserva: nombre completo, número de teléfono y correo electrónico. Estos datos son estrictamente necesarios para gestionar tu cita y comunicarnos contigo.</p>
          </div>

          <div class="privacy-card">
            <div class="privacy-icon">🎯</div>
            <h3>2. Finalidad del tratamiento</h3>
            <p>Tus datos se utilizan exclusivamente para:</p>
            <ul>
              <li>Gestionar y confirmar tus reservas en las barberías.</li>
              <li>Enviarte notificaciones sobre el estado de tu cita.</li>
              <li>Generar tu código de seguimiento único.</li>
              <li>Permitir que la barbería te identifique al llegar a tu cita.</li>
            </ul>
          </div>

          <div class="privacy-card">
            <div class="privacy-icon">🔐</div>
            <h3>3. Almacenamiento y seguridad</h3>
            <p>Tus datos se almacenan en bases de datos seguras con acceso restringido. Implementamos medidas técnicas y organizativas para proteger tu información contra accesos no autorizados, pérdida o alteración. Las contraseñas se almacenan utilizando cifrado bcrypt.</p>
          </div>

          <div class="privacy-card">
            <div class="privacy-icon">🤝</div>
            <h3>4. Compartición de datos</h3>
            <p>No compartimos tus datos personales con terceros. La información que proporcionas solo es visible para la barbería que elegiste y para los administradores de la plataforma, únicamente con fines operativos.</p>
          </div>

          <div class="privacy-card">
            <div class="privacy-icon">⏳</div>
            <h3>5. Conservación de datos</h3>
            <p>Conservamos tus datos personales únicamente durante el tiempo necesario para cumplir con la finalidad de la reserva y durante un período adicional por motivos estadísticos y de control interno, tras el cual son anonimizados.</p>
          </div>

          <div class="privacy-card">
            <div class="privacy-icon">✉️</div>
            <h3>6. Contacto</h3>
            <p>Si tienes dudas sobre el tratamiento de tus datos personales, puedes contactarnos a través de nuestro correo electrónico de soporte o directamente con el administrador de la plataforma. Tienes derecho a acceder, rectificar y solicitar la eliminación de tus datos en cualquier momento.</p>
          </div>

          <div class="privacy-note">
            <p>📅 Última actualización: Junio de 2026. Esta política puede ser actualizada periódicamente. Te recomendamos revisarla cada vez que uses nuestros servicios.</p>
          </div>
        </section>

        <!-- ===== Footer ===== -->
        <footer class="site-footer">
          <div class="footer-content">
            <div class="footer-brand">
              <div class="footer-logo">
                <svg width="28" height="28" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="#1a6b5a"/>
                  <circle cx="50" cy="50" r="40" fill="#f5efe0"/>
                  <path d="M50 20 L55 35 L70 35 L58 45 L62 60 L50 50 L38 60 L42 45 L30 35 L45 35 Z" fill="#1a6b5a"/>
                  <circle cx="50" cy="50" r="12" fill="#1a6b5a"/>
                  <circle cx="50" cy="50" r="8" fill="#f5efe0"/>
                  <circle cx="50" cy="50" r="4" fill="#1a6b5a"/>
                </svg>
                <span>BarberMaster</span>
              </div>
              <p class="footer-desc">Tu plataforma de reservas para las mejores barberías de Cartagena.</p>
            </div>
            <div class="footer-links">
              <h4>Enlaces</h4>
              <a href="#barbershops">Barberías</a>
              <a href="#track">Rastrear reserva</a>
              <a href="#login">Iniciar sesión</a>
            </div>
            <div class="footer-links">
              <h4>Legal</h4>
              <a href="#home" onclick="HomePage.scrollToPrivacy(event)">Política de privacidad</a>
              <a href="#home">Términos de uso</a>
            </div>
            <div class="footer-links">
              <h4>Contacto</h4>
              <span>soporte@barbermaster.com</span>
              <span>Cartagena, Colombia</span>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} BarberMaster. Proyecto académico — Universidad de Cartagena.</p>
          </div>
        </footer>
      </div>
    `);
  },

  scrollToPrivacy(e) {
    e.preventDefault();
    const el = document.getElementById('privacidad');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },
};
