/*
 * junta.js — nombre de la junta en todas las páginas públicas
 *
 * Las páginas traen escrito por defecto el nombre de la junta original
 * (Población Nueva Independencia). Este archivo, que todas las páginas cargan,
 * lee de la URL qué junta se está viendo (?junta=...) y, si NO es la original,
 * busca su nombre en Firestore y reemplaza esos textos. Así cada junta nueva
 * se ve con su propio nombre sin editar las páginas una por una.
 */
(function () {
  var JUNTA_ORIGINAL = 'nueva-independencia';
  var PROJECT_ID = 'multicancha-8h';
  var API_KEY = 'AIzaSyBYkzafSjJL43B3OVJjXwba3B5L98WybCE';
  var SIN_NOMBRE = 'Junta de vecinos';

  var id = new URLSearchParams(location.search).get('junta') || JUNTA_ORIGINAL;
  if (id === JUNTA_ORIGINAL) return; // la junta original conserva sus textos

  // Oculta los textos de la junta original hasta tener el nombre correcto,
  // para que no se vea un instante "Nueva Independencia" en otra junta.
  var estilo = document.createElement('style');
  estilo.textContent =
    '.header-text, footer, [data-junta-nombre], [data-junta-sub], .info-strip { visibility:hidden !important; }';
  document.head.appendChild(estilo);

  var nombre = null;
  var domListo = document.readyState !== 'loading';
  if (!domListo) document.addEventListener('DOMContentLoaded', function () { domListo = true; intentar(); });

  function intentar() {
    if (nombre !== null && domListo) aplicar(nombre);
  }

  function reemplazarTexto(raiz, regex, nuevo) {
    var walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    var nodo;
    while ((nodo = walker.nextNode())) {
      if (regex.test(nodo.nodeValue)) nodo.nodeValue = nodo.nodeValue.replace(regex, nuevo);
    }
  }

  function aplicar(n) {
    var todos = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

    // nombre de la junta en los encabezados
    todos('[data-junta-nombre], .h-pobl').forEach(function (el) { el.textContent = n; });
    // referencias a "8•H" / unidad vecinal, que son de la junta original
    todos('[data-junta-sub], .h-jjvv').forEach(function (el) { el.style.display = 'none'; });
    todos('.header-text h1:not([data-junta-nombre])').forEach(function (el) {
      el.textContent = el.textContent.replace(/\s*8•H/g, '');
    });

    // pie de página
    todos('footer').forEach(function (f) {
      reemplazarTexto(f, /Junta de Vecinos Unidad Vecinal N\.° 8H/, n);
    });
    // franja de la portada
    todos('.info-strip').forEach(function (f) {
      reemplazarTexto(f, /de la 8•H/, 'de este barrio');
    });

    // título de la pestaña del navegador
    var partes = document.title
      .replace(/Población Nueva Independencia/g, n)
      .replace(/Junta de Vecinos 8•H( Nueva Independencia)?/g, n)
      .split(' — ');
    var unicas = partes.filter(function (p, i) { return partes.indexOf(p) === i; });
    document.title = unicas.join(' — ');

    estilo.remove();
  }

  var url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
    '/databases/(default)/documents/juntas/' + encodeURIComponent(id) + '?key=' + API_KEY;

  fetch(url)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var campo = data && data.fields && data.fields.nombre && data.fields.nombre.stringValue;
      nombre = campo || SIN_NOMBRE;
      intentar();
    })
    .catch(function () { nombre = SIN_NOMBRE; intentar(); });
})();
