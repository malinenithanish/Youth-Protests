/* Youth Protests: filters and the card grid on the home page. */

(function (global) {
  "use strict";

  var YP = global.YP || (global.YP = {});

  function matches(entry, state) {
    if (state.category && (entry.trigger_categories || []).indexOf(state.category) === -1) {
      return false;
    }
    if (state.status && entry.status !== state.status) {
      return false;
    }
    if (state.search) {
      var haystack = (entry.country + " " + entry.movement_name + " " +
        (entry.trigger_summary || "")).toLowerCase();
      if (haystack.indexOf(state.search) === -1) {
        return false;
      }
    }
    return true;
  }

  function cardHtml(entry) {
    var info = YP.statusInfo(entry);
    var ongoing = entry.status === "ongoing";
    var claims = (entry.contested_claims || []).length;

    return '<article class="card" aria-labelledby="card-' + YP.escape(entry.id) + '">' +
      '<h3 id="card-' + YP.escape(entry.id) + '">' + YP.escape(entry.country) + "</h3>" +
      '<p class="movement">' + YP.escape(entry.movement_name) + "</p>" +
      "<p>" + YP.statusBadge(entry) +
      (ongoing ? '<span class="badge-ongoing-note">This movement is still ongoing.</span>' : "") +
      "</p>" +
      YP.categoryTags(entry) +
      YP.linksFor(entry) +
      "<dl>" +
      "<dt>Trigger</dt><dd>" + YP.escape(entry.trigger_summary) + "</dd>" +
      "<dt>Government response</dt><dd>" + YP.escape(entry.government_response) + "</dd>" +
      "<dt>Outcome so far</dt><dd>" + YP.escape(entry.outcome_so_far) + "</dd>" +
      "<dt>Started</dt><dd>" + YP.escape(YP.formatDate(entry.start_date)) + "</dd>" +
      "<dt>Last updated</dt><dd>" + YP.escape(YP.formatDate(entry.last_updated)) + "</dd>" +
      "<dt>Contested claims</dt><dd>" + claims + "</dd>" +
      "</dl>" +
      '<details class="card-sources"><summary>Sources (' +
      (entry.sources || []).length + ")</summary>" +
      YP.sourceLinks(entry) + "</details>" +
      "</article>";
  }

  function render(state) {
    var grid = document.getElementById("cards");
    var count = document.getElementById("card-count");
    var empty = document.getElementById("cards-empty");
    if (!grid) {
      return;
    }

    var shown = YP.state.published.filter(function (entry) {
      return matches(entry, state);
    });

    grid.innerHTML = shown.map(cardHtml).join("");
    if (empty) {
      empty.hidden = shown.length !== 0;
    }
    if (count) {
      var filtered = state.category || state.status || state.search;
      count.textContent = filtered
        ? "Showing " + shown.length + " of " + YP.state.published.length + " published countries."
        : "Showing all " + shown.length + " published countries.";
    }
  }

  function fillCategories() {
    var select = document.getElementById("filter-category");
    if (!select) {
      return;
    }
    var used = {};
    YP.state.published.forEach(function (entry) {
      (entry.trigger_categories || []).forEach(function (key) {
        used[key] = true;
      });
    });
    Object.keys(used).sort().forEach(function (key) {
      var option = document.createElement("option");
      option.value = key;
      option.textContent = YP.CATEGORIES[key] || key;
      select.appendChild(option);
    });
  }

  function wire() {
    var category = document.getElementById("filter-category");
    var status = document.getElementById("filter-status");
    var search = document.getElementById("filter-search");
    var reset = document.getElementById("filter-reset");
    var state = { category: "", status: "", search: "" };

    function update() {
      state.category = category ? category.value : "";
      state.status = status ? status.value : "";
      state.search = search ? search.value.trim().toLowerCase() : "";
      render(state);
    }

    if (category) { category.addEventListener("change", update); }
    if (status) { status.addEventListener("change", update); }
    if (search) { search.addEventListener("input", update); }
    if (reset) {
      reset.addEventListener("click", function () {
        if (category) { category.value = ""; }
        if (status) { status.value = ""; }
        if (search) { search.value = ""; }
        update();
        if (search) { search.focus(); }
      });
    }

    render(state);
  }

  function initCards(result) {
    var grid = document.getElementById("cards");
    if (!result.ok) {
      if (grid) {
        grid.innerHTML = "";
        grid.insertAdjacentHTML("afterend", YP.loadErrorHtml(result.error));
      }
      var count = document.getElementById("card-count");
      if (count) { count.textContent = ""; }
      var filters = document.getElementById("filters");
      if (filters) { filters.hidden = true; }
      return;
    }
    fillCategories();
    wire();
  }

  YP.onData(function (result) {
    initCards(result);
  });

}(window));
