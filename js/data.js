/* Youth Protests: data loading and shared helpers.
   Plain script, no build step. Everything hangs off the global YP object. */

(function (global) {
  "use strict";

  var YP = global.YP || (global.YP = {});

  YP.DATA_URL = "data/countries.json";

  YP.STATUS = {
    ongoing: { label: "Ongoing", badge: "badge-ongoing" },
    concluded: { label: "Concluded", badge: "badge-concluded" },
    unclear: { label: "Unclear", badge: "badge-unclear" }
  };

  YP.CATEGORIES = {
    taxes: "Taxes",
    corruption: "Corruption",
    public_services: "Public services",
    censorship: "Censorship",
    education: "Education",
    electoral: "Elections",
    other: "Other"
  };

  YP.TYPE_LABELS = {
    news: "news",
    wire: "wire service",
    analysis: "analysis",
    opinion: "opinion",
    academic: "academic"
  };

  YP.state = { entries: [], published: [], byId: {} };

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  /* ---------- loading ---------- */

  var initializers = [];
  var loadResult = null;

  /* Register a function to run once the data has loaded. Each page script
     registers its own, so the file is fetched only once. If the data has
     already arrived the function runs straight away, so a page script can
     never miss the result. */
  YP.onData = function (fn) {
    if (loadResult) {
      fn(loadResult);
      return;
    }
    initializers.push(fn);
  };

  YP.load = function () {
    return fetch(YP.DATA_URL, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("The server replied with " + response.status + ".");
        }
        return response.json();
      })
      .then(function (entries) {
        if (!Array.isArray(entries)) {
          throw new Error("The data file did not contain a list of countries.");
        }
        YP.state.entries = entries;
        YP.state.byId = {};
        entries.forEach(function (entry) {
          YP.state.byId[entry.id] = entry;
        });
        YP.state.published = entries.filter(function (entry) {
          return entry.published === true;
        });
        return { ok: true, entries: entries, error: null };
      })
      .catch(function (error) {
        return { ok: false, entries: [], error: error };
      });
  };

  /* ---------- helpers ---------- */

  YP.escape = function (value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  YP.formatDate = function (value) {
    if (typeof value !== "string" || !value) {
      return "date not recorded";
    }
    var parts = value.split("-");
    var month = MONTHS[parseInt(parts[1], 10) - 1];
    if (!month) {
      return value;
    }
    if (parts.length === 2) {
      return month + " " + parts[0];
    }
    return parseInt(parts[2], 10) + " " + month + " " + parts[0];
  };

  YP.statusInfo = function (entry) {
    return YP.STATUS[entry.status] || { label: entry.status, badge: "badge-unclear" };
  };

  YP.statusBadge = function (entry) {
    var info = YP.statusInfo(entry);
    return '<span class="badge ' + info.badge + '">' + YP.escape(info.label) + "</span>";
  };

  YP.categoryTags = function (entry) {
    var list = entry.trigger_categories || [];
    if (!list.length) {
      return "";
    }
    return '<ul class="tags">' + list.map(function (key) {
      return "<li>" + YP.escape(YP.CATEGORIES[key] || key) + "</li>";
    }).join("") + "</ul>";
  };

  YP.sourceLinks = function (entry, className) {
    var sources = entry.sources || [];
    if (!sources.length) {
      return "<p>No sources listed.</p>";
    }
    return '<ul class="' + (className || "card-sources-list") + '">' +
      sources.map(function (source) {
        var label = YP.escape(source.title);
        var meta = YP.escape(source.publisher) + ", " +
          YP.escape(YP.TYPE_LABELS[source.type] || source.type) +
          ", read on " + YP.escape(YP.formatDate(source.accessed));
        return "<li><a href=\"" + YP.escape(source.url) + "\">" + label + "</a> " +
          '<span class="pub">' + meta + "</span></li>";
      }).join("") + "</ul>";
  };

  YP.contestedList = function (entry) {
    var claims = entry.contested_claims || [];
    if (!claims.length) {
      return "<p>No contested claims recorded for this country.</p>";
    }
    return claims.map(function (claim) {
      return '<div class="claim"><h4>' + YP.escape(claim.topic) + "</h4>" +
        '<p><span class="label">Account one:</span> ' + YP.escape(claim.account_a) + "</p>" +
        '<p><span class="label">Account two:</span> ' + YP.escape(claim.account_b) + "</p>" +
        '<p class="note">Sources for this claim: ' +
        YP.escape((claim.sources || []).join(", ")) + "</p></div>";
    }).join("");
  };

  YP.linksFor = function (entry) {
    var id = YP.escape(entry.id);
    var other = YP.state.published.filter(function (row) {
      return row.id !== entry.id;
    })[0];
    var compare = other
      ? "compare.html?a=" + id + "&b=" + YP.escape(other.id)
      : "compare.html?a=" + id;
    return '<div class="card-links">' +
      '<a href="brief.html?c=' + id + '">One page brief</a>' +
      '<a href="' + compare + '">Compare with another country</a>' +
      "</div>";
  };

  /* A short plain summary used in map popups and the country list. */
  YP.shortSummary = function (entry) {
    var text = entry.trigger_summary || "";
    if (text.length > 170) {
      text = text.slice(0, text.lastIndexOf(" ", 160) + 1) + "...";
    }
    return text;
  };

  YP.query = function (name) {
    if (!global.location || !global.location.search) {
      return "";
    }
    var match = new RegExp("[?&]" + name + "=([^&]*)").exec(global.location.search);
    return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
  };

  /* ---------- start up ---------- */

  function boot() {
    YP.load().then(function (result) {
      loadResult = result;
      initializers.forEach(function (fn) {
        try {
          fn(result);
        } catch (error) {
          if (global.console && global.console.error) {
            global.console.error("Youth Protests: a page script failed.", error);
          }
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* Shown when the JSON cannot be loaded, most often because the page was
     opened straight from the file system. */
  YP.loadErrorHtml = function (error) {
    return '<div class="panel" style="border:2px solid var(--badge-ongoing-bg);' +
      'border-radius:6px;padding:1rem;">' +
      "<h2>The country data could not be loaded</h2>" +
      "<p>The file <code>" + YP.escape(YP.DATA_URL) + "</code> could not be read" +
      (error && error.message ? ": " + YP.escape(error.message) : "") + "</p>" +
      "<p>This page loads its data with <code>fetch()</code>, which browsers block on " +
      "<code>file://</code> addresses. Serve the folder over HTTP instead. From the " +
      "folder that holds this site, run:</p>" +
      '<pre><code>python3 -m http.server</code></pre>' +
      "<p>Then open <code>http://localhost:8000/</code> in your browser.</p></div>";
  };

}(window));
