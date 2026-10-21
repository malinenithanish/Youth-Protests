/* Youth Protests: the printable one page country brief.
   Reads ?c=france from the query string and fills the page from the data
   file. Everything printed comes from data/countries.json. */

(function (global) {
  "use strict";

  var YP = global.YP || (global.YP = {});

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  var MONTH_INDEX = {};
  MONTHS.forEach(function (name, index) { MONTH_INDEX[name] = index; });

  /* Pull dates such as "21 September 2026" out of the entry text so the
     key dates list is built from the same words as the rest of the brief. */
  function findDates(entry) {
    var found = [];
    var seen = {};

    function add(date, label, context) {
      var key = date.getTime() + "|" + label;
      if (seen[key]) { return; }
      seen[key] = true;
      found.push({ date: date, label: label, context: context });
    }

    function scan(text, context) {
      if (typeof text !== "string") { return; }
      var dayFirst = new RegExp("\\b(\\d{1,2}) (" + MONTHS.join("|") + ") (\\d{4})\\b", "g");
      var leftover = text;
      var match = dayFirst.exec(text);
      while (match) {
        var day = parseInt(match[1], 10);
        var month = MONTH_INDEX[match[2]];
        var year = parseInt(match[3], 10);
        add(new Date(year, month, day), match[1] + " " + match[2] + " " + match[3], context);
        leftover = leftover.replace(match[0], " ");
        match = dayFirst.exec(text);
      }
      var monthOnly = new RegExp("\\b(" + MONTHS.join("|") + ") (\\d{4})\\b", "g");
      var second = monthOnly.exec(leftover);
      while (second) {
        var m = MONTH_INDEX[second[1]];
        var y = parseInt(second[2], 10);
        add(new Date(y, m, 1), second[1] + " " + second[2], context);
        second = monthOnly.exec(leftover);
      }
    }

    scan(entry.trigger_summary, "Trigger");
    scan(entry.government_response, "Government response");
    scan(entry.outcome_so_far, "Outcome");

    (entry.contested_claims || []).forEach(function (claim) {
      scan(claim.account_a, "Contested claim");
      scan(claim.account_b, "Contested claim");
    });

    return found;
  }

  function firstSentence(text) {
    if (typeof text !== "string") { return ""; }
    var cut = text.indexOf(". ");
    return cut === -1 ? text : text.slice(0, cut + 1);
  }

  /* The most recent day a source for this country was read. */
  function latestAccessed(sources) {
    var latest = "";
    sources.forEach(function (source) {
      if (source.accessed && source.accessed > latest) {
        latest = source.accessed;
      }
    });
    return latest;
  }

  function keyDateRows(entry) {
    var rows = [];
    rows.push({ sort: new Date(entry.start_date), label: YP.formatDate(entry.start_date),
      context: "Movement start" });
    rows.push({ sort: new Date(entry.last_updated), label: YP.formatDate(entry.last_updated),
      context: "Last updated" });

    findDates(entry).forEach(function (item) {
      rows.push({ sort: item.date, label: item.label, context: item.context });
    });

    rows.sort(function (a, b) { return a.sort - b.sort; });

    var seen = {};
    return rows.filter(function (row) {
      var key = row.label + "|" + row.context;
      if (seen[key]) { return false; }
      seen[key] = true;
      return true;
    });
  }

  function set(id, html) {
    var node = document.getElementById(id);
    if (node) {
      node.innerHTML = html;
    }
  }

  function render(entry) {
    document.title = entry.country + " brief | Youth Protests";
    set("brief-country", YP.escape(entry.country));

    var info = YP.statusInfo(entry);
    var readOn = latestAccessed(entry.sources || []);
    set("brief-meta",
      YP.escape(entry.movement_name) + " | " + info.label +
      " | started " + YP.escape(YP.formatDate(entry.start_date)) +
      " | last updated " + YP.escape(YP.formatDate(entry.last_updated)) +
      " | sources read on " + YP.escape(YP.formatDate(readOn)));

    set("brief-background-body",
      "<p>The movement recorded on this site is " + YP.escape(entry.movement_name) +
      ", in " + YP.escape(entry.country) + ". It is listed as " +
      YP.escape(info.label.toLowerCase()) + " and it started on " +
      YP.escape(YP.formatDate(entry.start_date)) + ".</p>" +
      "<p>The grievances reported fall into these categories:</p>" +
      YP.categoryTags(entry) +
      '<p class="note">The site keeps one summary of the background for each ' +
      "country, and that summary is the trigger section below. Every sentence in " +
      "this brief comes from the sources listed at the end.</p>");

    set("brief-trigger-body", "<p>" + YP.escape(entry.trigger_summary) + "</p>");

    set("brief-response-body", "<p>" + YP.escape(entry.government_response) + "</p>");

    set("brief-outcome-body",
      "<p>" + YP.escape(entry.outcome_so_far) + "</p>" +
      (entry.status === "ongoing"
        ? '<p class="note">This movement is still ongoing, so this section will change.</p>'
        : ""));

    set("brief-contested-body", YP.contestedList(entry));

    set("brief-dates-body",
      "<ul>" + keyDateRows(entry).map(function (row) {
        return "<li><strong>" + YP.escape(row.label) + "</strong>: " +
          YP.escape(row.context) + "</li>";
      }).join("") + "</ul>");

    set("brief-sources-body",
      '<ul class="source-list">' + (entry.sources || []).map(function (source) {
        return "<li>" + YP.escape(source.publisher) + ", " +
          YP.escape(YP.TYPE_LABELS[source.type] || source.type) + ": " +
          '<a href="' + YP.escape(source.url) + '">' + YP.escape(source.title) + "</a>" +
          " (read on " + YP.escape(YP.formatDate(source.accessed)) + ")</li>";
      }).join("") + "</ul>" +
      '<p class="note">Every fact above is taken from these sources. Where they ' +
      "disagree, both accounts are shown above.</p>");
  }

  function init(result) {
    var printButton = document.getElementById("print-button");
    if (printButton) {
      printButton.addEventListener("click", function () { global.print(); });
    }

    if (!result.ok) {
      var article = document.getElementById("brief");
      if (article) {
        article.innerHTML = YP.loadErrorHtml(result.error);
      }
      return;
    }

    var requested = YP.query("c");
    var entry = YP.state.byId[requested];
    if (!entry) {
      entry = YP.state.published[0];
    }
    if (!entry) {
      set("brief-meta", "No published countries are available.");
      return;
    }
    if (requested && !YP.state.byId[requested]) {
      set("brief-meta", "No country called " + requested +
        " is published, so the first published country is shown instead.");
    }
    render(entry);
  }

  YP.onData(init);

}(window));
