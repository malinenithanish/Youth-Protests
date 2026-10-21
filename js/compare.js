/* Youth Protests: the compare page. Two dropdowns, side by side rows.
   The selection is kept in the query string as ?a=france&b=india. */

(function (global) {
  "use strict";

  var YP = global.YP || (global.YP = {});

  var ROWS = [
    {
      label: "Movement",
      value: function (entry) {
        return YP.escape(entry.movement_name);
      }
    },
    {
      label: "Status",
      value: function (entry) {
        return YP.statusBadge(entry);
      }
    },
    {
      label: "Start date",
      value: function (entry) {
        return YP.escape(YP.formatDate(entry.start_date));
      }
    },
    {
      label: "Trigger",
      value: function (entry) {
        return YP.escape(entry.trigger_summary);
      }
    },
    {
      label: "Trigger categories",
      value: function (entry) {
        return YP.categoryTags(entry);
      }
    },
    {
      label: "Government response",
      value: function (entry) {
        return YP.escape(entry.government_response);
      }
    },
    {
      label: "Outcome so far",
      value: function (entry) {
        return YP.escape(entry.outcome_so_far);
      }
    },
    {
      label: "Contested claims",
      value: function (entry) {
        return YP.contestedList(entry);
      }
    },
    {
      label: "Sources",
      value: function (entry) {
        return YP.sourceLinks(entry, "card-sources-list");
      }
    }
  ];

  function optionHtml(entry) {
    return '<option value="' + YP.escape(entry.id) + '">' +
      YP.escape(entry.country) + "</option>";
  }

  function fillSelect(select, entries) {
    select.innerHTML = entries.map(optionHtml).join("");
  }

  function readQuery() {
    return { a: YP.query("a"), b: YP.query("b") };
  }

  function writeQuery(a, b) {
    if (!global.history || !global.history.replaceState) {
      return;
    }
    var url = global.location.pathname + "?a=" + encodeURIComponent(a) +
      "&b=" + encodeURIComponent(b);
    global.history.replaceState(null, "", url);
  }

  function renderRow(label, a, b) {
    return "<tr><th scope=\"row\">" + YP.escape(label) + "</th>" +
      "<td>" + a + "</td><td>" + b + "</td></tr>";
  }

  function render() {
    var selectA = document.getElementById("compare-a");
    var selectB = document.getElementById("compare-b");
    var body = document.getElementById("compare-body");
    var headA = document.getElementById("head-a");
    var headB = document.getElementById("head-b");
    var status = document.getElementById("compare-status");
    if (!selectA || !selectB || !body) {
      return;
    }

    var entryA = YP.state.byId[selectA.value];
    var entryB = YP.state.byId[selectB.value];
    if (!entryA || !entryB) {
      body.innerHTML = "";
      if (status) {
        status.textContent = "Pick two countries to compare.";
      }
      return;
    }

    if (headA) { headA.textContent = entryA.country; }
    if (headB) { headB.textContent = entryB.country; }

    body.innerHTML = ROWS.map(function (row) {
      return renderRow(row.label, row.value(entryA), row.value(entryB));
    }).join("");

    if (status) {
      status.textContent = "Comparing " + entryA.country + " with " + entryB.country +
        ". Last checked " + YP.formatDate(entryA.last_updated) + " and " +
        YP.formatDate(entryB.last_updated) + ".";
    }
  }

  function init(result) {
    var selectA = document.getElementById("compare-a");
    var selectB = document.getElementById("compare-b");
    if (!result.ok) {
      var body = document.getElementById("compare-body");
      if (body) {
        body.innerHTML = "";
        body.insertAdjacentHTML("afterend", YP.loadErrorHtml(result.error));
      }
      var form = document.getElementById("compare-form");
      if (form) { form.hidden = true; }
      return;
    }

    var entries = YP.state.published;
    if (!entries.length) {
      return;
    }
    fillSelect(selectA, entries);
    fillSelect(selectB, entries);

    var query = readQuery();
    var ids = entries.map(function (entry) { return entry.id; });
    selectA.value = ids.indexOf(query.a) !== -1 ? query.a : ids[0];
    selectB.value = ids.indexOf(query.b) !== -1 ? query.b : ids[1 % ids.length];

    function update() {
      writeQuery(selectA.value, selectB.value);
      render();
    }
    selectA.addEventListener("change", update);
    selectB.addEventListener("change", update);

    update();
  }

  YP.onData(init);

}(window));
