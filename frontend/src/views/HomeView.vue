<script setup>
import { useAuth } from '@/composables/useAuth'

const { isAutenticado } = useAuth()
</script>

<template>
  <!-- HERO -->
  <section class="hero">
    <div class="hero__bg" aria-hidden="true"></div>

    <div class="hero__content">
      <p class="hero__eyebrow">Servicio funerario de confianza</p>
      <h1 class="hero__title">Funeraria</h1>
      <p class="hero__sub">
        Brindando apoyo y tranquilidad<br>en los momentos más importantes.
      </p>

      <router-link v-if="!isAutenticado" to="/login" class="hero__btn">
        Iniciar Sesión
      </router-link>

      <div class="hero__stats">
        <div class="hero__stat">
          <span class="hero__stat-num">24/7</span>
          <span class="hero__stat-label">Disponibilidad</span>
        </div>
        <div class="hero__stat-div"></div>
        <div class="hero__stat">
          <span class="hero__stat-num">+</span>
          <span class="hero__stat-label">Años de experiencia</span>
        </div>
        <div class="hero__stat-div"></div>
        <div class="hero__stat">
          <span class="hero__stat-num">100%</span>
          <span class="hero__stat-label">Compromiso familiar</span>
        </div>
      </div>
    </div>

    <div class="hero__scroll" aria-hidden="true">
      <div class="hero__scroll-dot"></div>
    </div>
  </section>

  <!-- SERVICIOS -->
  <section class="services">
    <div class="services__inner">
      <div class="services__header">
        <span class="services__tag">Lo que ofrecemos</span>
        <h2 class="services__title">Nuestros servicios</h2>
        <p class="services__desc">
          Acompañamos a cada familia con respeto, discreción y calidez humana.
        </p>
      </div>

      <div class="services__grid">
        <div class="svc-card">
          <div class="svc-card__icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <h3 class="svc-card__title">Velación</h3>
          <p class="svc-card__desc">Espacios cómodos y tranquilos para la despedida familiar, con toda la dignidad que merece.</p>
        </div>

        <div class="svc-card svc-card--accent">
          <div class="svc-card__icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <h3 class="svc-card__title">Traslados</h3>
          <p class="svc-card__desc">Servicio de traslado local y foráneo disponible las 24 horas del día, los 7 días de la semana.</p>
        </div>

        <div class="svc-card">
          <div class="svc-card__icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 class="svc-card__title">Asesoría</h3>
          <p class="svc-card__desc">Orientación y apoyo administrativo durante todo el proceso, sin complicaciones para la familia.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CONTACTO / CIERRE -->
  <section class="contact-band">
    <p class="contact-band__text">¿Necesita orientación? Estamos disponibles en todo momento.</p>
    <a href="tel:+52" class="contact-band__btn">Llamar ahora</a>
  </section>
</template>

<style scoped>
/* ── Hero ─────────────────────────────────────────── */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(160deg, rgba(30,45,61,0.88) 0%, rgba(86,124,141,0.80) 100%),
    url('https://i.pinimg.com/1200x/03/0c/56/030c563080782c95417a96112e07a129.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  z-index: 0;
}

.hero__content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px 24px;
  max-width: 680px;
  width: 100%;
  animation: fadeUp 0.8s ease both;
}

.hero__eyebrow {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #C8D9E6;
  margin-bottom: 18px;
  opacity: 0.85;
}

.hero__title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(3rem, 8vw, 5.5rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 20px;
  letter-spacing: 1px;
}

.hero__sub {
  font-size: clamp(1rem, 2.5vw, 1.18rem);
  color: rgba(245,239,235,0.85);
  font-weight: 300;
  line-height: 1.7;
  margin-bottom: 36px;
}

.hero__btn {
  display: inline-block;
  background: #fff;
  color: #2F4156;
  font-weight: 700;
  font-size: 0.92rem;
  letter-spacing: 0.3px;
  padding: 14px 40px;
  border-radius: 50px;
  text-decoration: none;
  transition: all 0.25s ease;
  margin-bottom: 52px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.18);
}

.hero__btn:hover {
  background: #C8D9E6;
  color: #2F4156;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.22);
}

/* Stats bar */
.hero__stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 22px 40px;
}

.hero__stat { text-align: center; }
.hero__stat-num {
  display: block;
  font-family: 'Playfair Display', serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 4px;
}
.hero__stat-label {
  font-size: 0.76rem;
  color: rgba(200, 217, 230, 0.8);
  letter-spacing: 0.3px;
}
.hero__stat-div {
  width: 1px;
  height: 36px;
  background: rgba(255,255,255,0.2);
}

/* Scroll indicator */
.hero__scroll {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}
.hero__scroll-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  margin: 0 auto;
  animation: bounce 1.6s ease infinite;
}

/* ── Services ─────────────────────────────────────── */
.services {
  background: #F5EFEB;
  padding: 88px 24px;
}

.services__inner {
  max-width: 960px;
  margin: 0 auto;
}

.services__header {
  text-align: center;
  margin-bottom: 56px;
}

.services__tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #567C8D;
  margin-bottom: 14px;
}

.services__title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  color: #2F4156;
  margin-bottom: 14px;
}

.services__desc {
  color: #6b7f8f;
  font-size: 1rem;
  max-width: 440px;
  margin: 0 auto;
  line-height: 1.7;
}

.services__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.svc-card {
  background: #fff;
  border-radius: 18px;
  padding: 36px 28px;
  border: 1px solid rgba(47,65,86,0.10);
  transition: all 0.25s ease;
  text-align: center;
}

.svc-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 14px 40px rgba(47,65,86,0.13);
}

.svc-card--accent {
  background: linear-gradient(145deg, #2F4156, #567C8D);
  border-color: transparent;
}

.svc-card--accent .svc-card__title,
.svc-card--accent .svc-card__desc { color: #fff; }
.svc-card--accent .svc-card__icon { color: #C8D9E6; }

.svc-card__icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 22px;
  color: #567C8D;
}

.svc-card__icon svg { width: 100%; height: 100%; }

.svc-card__title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.22rem;
  color: #2F4156;
  margin-bottom: 10px;
  font-weight: 600;
}

.svc-card__desc {
  color: #6b7f8f;
  font-size: 0.9rem;
  line-height: 1.65;
}

/* ── Contact band ─────────────────────────────────── */
.contact-band {
  background: linear-gradient(90deg, #2F4156 0%, #567C8D 100%);
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  text-align: center;
}

.contact-band__text {
  color: rgba(245,239,235,0.9);
  font-size: 1.05rem;
  font-weight: 300;
  letter-spacing: 0.2px;
  margin: 0;
}

.contact-band__btn {
  display: inline-block;
  border: 1.5px solid rgba(255,255,255,0.6);
  color: #fff;
  padding: 11px 34px;
  border-radius: 50px;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.contact-band__btn:hover {
  background: rgba(255,255,255,0.12);
  border-color: #fff;
  transform: translateY(-1px);
}

/* ── Animations ───────────────────────────────────── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50%       { transform: translateY(8px); opacity: 1; }
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 600px) {
  .hero__stats { gap: 18px; padding: 18px 22px; }
  .hero__stat-num { font-size: 1.3rem; }
  .services { padding: 60px 16px; }
  .svc-card { padding: 28px 20px; }
  .contact-band { padding: 40px 20px; }
}
</style>