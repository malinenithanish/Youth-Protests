/* Youth Protests: the Leaflet map and the text list beside it.
   The map is an optional extra. The country list carries the same
   information and works if Leaflet or the tiles fail to load. */

(function (global) {
  "use strict";

  var YP = global.YP || (global.YP = {});
  var TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  var TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">' +
    "OpenStreetMap</a> contributors";

  function buildMap(entries) {
    var container = document.getElementById("map");
    if (!container) {
      return;
    }
    if (!global.L || !global.L.map) {
      container.innerHTML = "<p class=\"note\">The map could not be loaded. " +
        "The list of countries below has the same information.</p>";
      return;
    }

    var map = global.L.map(container, {
      scrollWheelZoom: false,
      center: [20, 15],
      zoom: 2,
      minZoom: 2
    });

    global.L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      crossOrigin: true
    }).addTo(map);

    entries.forEach(function (entry) {
      var marker = global.L.marker([entry.lat, entry.lng], {
        title: entry.country + ": " + entry.movement_name,
        alt: entry.country + ": " + entry.movement_name,
        keyboard: true,
        riseOnHover: true
      });

      marker.on("add", function () {
        var element = marker.getElement();
        if (!element) {
          return;
        }
        element.setAttribute("role", "button");
        element.setAttribute("aria-label",
          entry.country + ", " + entry.movement_name + ". Open a short summary.");
        element.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            marker.openPopup();
          }
        });
      });

      marker.addTo(map);

      marker.bindPopup(
        "<h3>" + YP.escape(entry.country) + "</h3>" +
        "<p>" + YP.escape(YP.shortSummary(entry)) + "</p>" +
        '<p><a href="brief.html?c=' + YP.escape(entry.id) + '">Read the brief</a> ' +
        '<a href="compare.html?a=' + YP.escape(entry.id) + '&b=france">Compare</a></p>'
      );
    });

    var dark = global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)");
    function applyScheme() {
      container.classList.toggle("is-dark", !!(dark && dark.matches));
    }
    applyScheme();
    if (dark && dark.addEventListener) {
      dark.addEventListener("change", applyScheme);
    }
  }

  function buildList(entries) {
    var list = document.getElementById("country-list");
    if (!list) {
      return;
    }
    if (!entries.length) {
      list.innerHTML = "<li>No published countries.</li>";
      return;
    }
    list.innerHTML = entries.map(function (entry) {
      var info = YP.statusInfo(entry);
      return "<li><a href=\"brief.html?c=" + YP.escape(entry.id) + "\">" +
        YP.escape(entry.country) + "</a> " + YP.escape(info.label) +
        '<span class="meta">Started ' + YP.escape(YP.formatDate(entry.start_date)) +
        ". Last updated " + YP.escape(YP.formatDate(entry.last_updated)) +
        ". " + YP.escape(YP.shortSummary(entry)) + "</span></li>";
    }).join("");
  }

  function setStatus(message) {
    var node = document.getElementById("map-status");
    if (node) {
      node.textContent = message;
    }
  }

  function initMap(result) {
    var entries = result.ok ? YP.state.published : [];
    if (!result.ok) {
      var panel = document.getElementById("map");
      if (panel) {
        panel.innerHTML = YP.loadErrorHtml(result.error);
      }
      var list = document.getElementById("country-list");
      if (list) {
        list.innerHTML = "";
      }
      setStatus("");
      return;
    }
    buildMap(entries);
    buildList(entries);
    setStatus(entries.length + " of " + YP.state.entries.length +
      " countries are published on this site.");
  }

  YP.onData(function (result) {
    initMap(result);
  });

}(window));
