<template>
  <section class="home-container">

    <div class="overlay">

      <div class="container text-center text-white">

        <h1 class="display-3 fw-bold mb-4">
          Funeraria
        </h1>

        <p class="lead mb-4">
          Brindando apoyo y tranquilidad
          en los momentos más importantes.
        </p>

        <router-link
          to="/login"
          class="btn btn-custom btn-lg mb-5"
        >
          Iniciar Sesión
        </router-link>

        <!-- SERVICIOS -->

        <div class="services-box">

          <h2 class="mb-4">
            Servicios
          </h2>

          <div class="row g-4">

            <div class="col-md-4">
              <div class="service-item">
                <h5>Velación</h5>

                <p>
                  Espacios cómodos y tranquilos
                  para despedidas familiares.
                </p>
              </div>
            </div>

            <div class="col-md-4">
              <div class="service-item">
                <h5>Traslados</h5>

                <p>
                  Servicio de traslado local
                  y nacional disponible 24/7.
                </p>
              </div>
            </div>

            <div class="col-md-4">
              <div class="service-item">
                <h5>Asesoría</h5>

                <p>
                  Apoyo administrativo y orientación
                  durante todo el proceso.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>

  </section>
</template>