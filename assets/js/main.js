/* El Pegolí · interacción mínima: parte del mediodía, índice móvil y apariciones. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var lang = root.lang === 'en' ? 'en' : 'es';

  /* ---------- Parte del mediodía ----------
     Horario publicado por la casa: martes a domingo, 13:00–16:00. Lunes cerrado. Sin cenas. */
  var ABRE = 13 * 60, CIERRA = 16 * 60;
  var DIAS = {
    es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };
  var T = {
    es: {
      abierto: function (m) { return 'Abierto ahora: servimos comidas hasta las 16:00' + (m <= 30 ? ' (quedan ' + m + ' min).' : '.'); },
      antes: 'Hoy abrimos a las 13:00. Solo comidas.',
      lunes: 'Hoy, lunes, descansamos. Mañana martes abrimos a las 13:00.',
      despues: function (d) { return 'Hoy ya hemos cerrado. ' + (d === 1 ? 'El martes' : 'Mañana') + ' abrimos a las 13:00.'; }
    },
    en: {
      abierto: function (m) { return 'Open now: serving lunch until 16:00' + (m <= 30 ? ' (' + m + ' min left).' : '.'); },
      antes: 'Open today from 13:00. Lunch only.',
      lunes: 'Closed today (Monday). We open tomorrow, Tuesday, at 13:00.',
      despues: function (d) { return 'We have closed for today. ' + (d === 1 ? 'Next opening: Tuesday' : 'Tomorrow') + ' at 13:00.'; }
    }
  };

  function horaMadrid() {
    try {
      var partes = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      var p = {};
      partes.forEach(function (x) { p[x.type] = x.value; });
      var dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
      return { dia: dia, min: parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function pintarEstado() {
    var el = document.querySelector('[data-estado]');
    if (!el) return;
    var ahora = horaMadrid(), t = T[lang], texto, abierto = false;
    var manana = (ahora.dia + 1) % 7;
    if (ahora.dia === 1) texto = t.lunes;
    else if (ahora.min < ABRE) texto = t.antes;
    else if (ahora.min < CIERRA) { texto = t.abierto(CIERRA - ahora.min); abierto = true; }
    else texto = t.despues(manana);
    el.classList.toggle('cerrado', !abierto);
    el.innerHTML = '<span class="punto" aria-hidden="true"></span>' + texto;
  }
  pintarEstado();
  setInterval(pintarEstado, 60 * 1000);

  /* ---------- Pasada de pincel del rótulo ---------- */
  var arrancar = function () { root.classList.add('listo'); };
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(arrancar);
    setTimeout(arrancar, 1200); // por si las fuentes tardan
  } else {
    arrancar();
  }

  /* ---------- Índice móvil ---------- */
  var dialogo = document.getElementById('indice');
  var abrir = document.querySelector('[data-abrir-indice]');
  if (dialogo && abrir && typeof dialogo.showModal === 'function') {
    abrir.addEventListener('click', function () {
      dialogo.showModal();
      abrir.setAttribute('aria-expanded', 'true');
    });
    dialogo.addEventListener('close', function () { abrir.setAttribute('aria-expanded', 'false'); });
    dialogo.addEventListener('click', function (e) {
      if (e.target === dialogo || e.target.closest('a') || e.target.closest('[data-cerrar-indice]')) dialogo.close();
    });
  } else if (abrir) {
    // Sin <dialog>: el botón lleva al pie de página con los enlaces
    abrir.addEventListener('click', function () { location.hash = '#llegar'; });
  }

  /* ---------- Apariciones de la línea de años ---------- */
  var items = document.querySelectorAll('[data-aparece]');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (i) { io.observe(i); });
  } else {
    items.forEach(function (i) { i.classList.add('visto'); });
  }
})();
