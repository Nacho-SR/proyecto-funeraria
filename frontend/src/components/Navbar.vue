<template>
  <nav class="navbar navbar-expand-lg navbar-custom shadow-sm">
    <div class="container">
      <router-link class="navbar-brand fw-bold text-white" to="/">
        Funeraria 
      </router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link class="nav-link text-white" to="/">
              Inicio
            </router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link text-white" to="/login">
              Iniciar Sesión
            </router-link>
          </li>
          <li class="nav-item">
  <router-link
    class="nav-link text-white"
    to="/register"
  >
    Registrarse
  </router-link>
</li>
        </ul>
      </div>
    </div>
  </nav>
</template>