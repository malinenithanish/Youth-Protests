#!/usr/bin/env python3
"""Validate data/countries.json against the schema in data/schema.md.

Python 3 standard library only. Exits non-zero when a rule is broken.

Usage:
    python3 scripts/validate.py [path/to/countries.json]
"""

import json
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_PATH = os.path.join(REPO_ROOT, "data", "countries.json")

REQUIRED_FIELDS = (
    "id",
    "country",
    "iso2",
    "lat",
    "lng",
    "movement_name",
    "status",
    "start_date",
    "last_updated",
    "trigger_categories",
    "trigger_summary",
    "government_response",
    "outcome_so_far",
    "contested_claims",
    "sources",
    "verification",
    "published",
)

STATUS_VALUES = {"ongoing", "concluded", "unclear"}
CATEGORY_VALUES = {
    "taxes",
    "corruption",
    "public_services",
    "censorship",
    "education",
    "electoral",
    "other",
}
SOURCE_TYPE_VALUES = {"news", "wire", "analysis", "opinion", "academic"}
VERIFICATION_VALUES = {"seed", "checked", "needs_verification"}

WORD_LIMIT_FIELDS = ("trigger_summary", "government_response", "outcome_so_far")
WORD_LIMIT = 60

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ISO_MONTH = re.compile(r"^\d{4}-\d{2}$")
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

EM_DASH = "\u2014"


class Report:
    """Collects errors and warnings so the whole file is checked in one run."""

    def __init__(self):
        self.errors = []
        self.warnings = []

    def error(self, where, message):
        self.errors.append("%s: %s" % (where, message))

    def warn(self, where, message):
        self.warnings.append("%s: %s" % (where, message))


def count_words(text):
    """Count words by splitting on whitespace."""
    return len(text.split())


def walk_strings(node, path=""):
    """Yield every string in the document with a dotted path for error messages."""
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for key, value in node.items():
            child = "%s.%s" % (path, key) if path else str(key)
            for item in walk_strings(value, child):
                yield item
    elif isinstance(node, list):
        for index, value in enumerate(node):
            child = "%s[%d]" % (path, index)
            for item in walk_strings(value, child):
                yield item


TEXT_FIELDS = ("id", "country", "iso2", "movement_name")
NUMBER_FIELDS = ("lat", "lng")


def check_required(entry, report):
    where = entry.get("id", "<no id>")
    for field in REQUIRED_FIELDS:
        if field not in entry:
            report.error(where, "missing required field '%s'" % field)
    for field in TEXT_FIELDS:
        if field in entry and not isinstance(entry[field], str):
            report.error(where, "'%s' must be a string" % field)
    for field in NUMBER_FIELDS:
        if field in entry and not isinstance(entry[field], (int, float)):
            report.error(where, "'%s' must be a number" % field)
    if "published" in entry and not isinstance(entry["published"], bool):
        report.error(where, "'published' must be true or false")


def check_enums(entry, report):
    where = entry.get("id", "<no id>")

    status = entry.get("status")
    if status is not None and status not in STATUS_VALUES:
        report.error(
            where,
            "status '%s' is not one of %s" % (status, ", ".join(sorted(STATUS_VALUES))),
        )
    verification = entry.get("verification")
    if verification is not None and verification not in VERIFICATION_VALUES:
        report.error(
            where,
            "verification '%s' is not one of %s"
            % (verification, ", ".join(sorted(VERIFICATION_VALUES))),
        )

    categories = entry.get("trigger_categories")
    if isinstance(categories, list):
        if not categories:
            report.error(where, "'trigger_categories' must not be empty")
        for value in categories:
            if not isinstance(value, str):
                report.error(where, "'trigger_categories' entries must be strings")
            elif value not in CATEGORY_VALUES:
                report.error(
                    where,
                    "trigger category '%s' is not one of %s"
                    % (value, ", ".join(sorted(CATEGORY_VALUES))),
                )
    elif categories is not None:
        report.error(where, "'trigger_categories' must be an array")


def check_dates(entry, report):
    where = entry.get("id", "<no id>")
    start = entry.get("start_date")
    if isinstance(start, str):
        if not (ISO_DATE.match(start) or ISO_MONTH.match(start)):
            report.error(
                where,
                "start_date '%s' must be YYYY-MM-DD or YYYY-MM" % start,
            )
    elif start is not None:
        report.error(where, "'start_date' must be a string")

    updated = entry.get("last_updated")
    if isinstance(updated, str):
        if not ISO_DATE.match(updated):
            report.error(
                where, "last_updated '%s' must be YYYY-MM-DD" % updated
            )
    elif updated is not None:
        report.error(where, "'last_updated' must be a string")


def check_word_limits(entry, report):
    where = entry.get("id", "<no id>")
    for field in WORD_LIMIT_FIELDS:
        value = entry.get(field)
        if not isinstance(value, str):
            continue
        words = count_words(value)
        if words > WORD_LIMIT:
            report.error(where, "'%s' is %d words, limit is %d" % (field, words, WORD_LIMIT))


def check_contested_claims(entry, report):
    where = entry.get("id", "<no id>")
    claims = entry.get("contested_claims")
    if not isinstance(claims, list):
        report.error(where, "'contested_claims' must be an array")
        return
    for index, claim in enumerate(claims):
        label = "%s contested_claims[%d]" % (where, index)
        if not isinstance(claim, dict):
            report.error(label, "must be an object")
            continue
        for field in ("topic", "account_a", "account_b", "sources"):
            if field not in claim:
                report.error(label, "missing '%s'" % field)
        if not isinstance(claim.get("sources"), list):
            report.error(label, "'sources' must be an array of publisher names")
        for key in ("topic", "account_a", "account_b"):
            value = claim.get(key)
            if isinstance(value, str) and not value.strip():
                report.error(label, "'%s' must not be empty" % key)


def check_sources(entry, report):
    where = entry.get("id", "<no id>")
    sources = entry.get("sources")
    if not isinstance(sources, list):
        report.error(where, "'sources' must be an array")
        return

    https_urls = 0
    for index, source in enumerate(sources):
        label = "%s sources[%d]" % (where, index)
        if not isinstance(source, dict):
            report.error(label, "must be an object")
            continue
        for field in ("title", "publisher", "url", "type", "accessed"):
            if field not in source:
                report.error(label, "missing '%s'" % field)
        url = source.get("url")
        if isinstance(url, str):
            if url.startswith("https://"):
                https_urls += 1
            else:
                report.error(label, "url '%s' must start with https://" % url)
        elif url is not None:
            report.error(label, "'url' must be a string")
        source_type = source.get("type")
        if source_type is not None and source_type not in SOURCE_TYPE_VALUES:
            report.error(
                label,
                "type '%s' is not one of %s"
                % (source_type, ", ".join(sorted(SOURCE_TYPE_VALUES))),
            )
        accessed = source.get("accessed")
        if isinstance(accessed, str):
            if not ISO_DATE.match(accessed):
                report.error(label, "accessed '%s' must be YYYY-MM-DD" % accessed)
        elif accessed is not None:
            report.error(label, "'accessed' must be a string")

    if entry.get("published") is True and https_urls < 2:
        report.error(
            where,
            "published entries need at least 2 sources with https URLs, found %d"
            % https_urls,
        )


def check_brazil_rule(entries, report):
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        if entry.get("id") != "brazil":
            continue
        if entry.get("published") is True and entry.get("verification") != "checked":
            report.error(
                "brazil",
                "brazil may only be published when verification is 'checked', "
                "found '%s'" % entry.get("verification"),
            )


def check_em_dash(document, report):
    for path, text in walk_strings(document):
        if EM_DASH in text:
            report.error(path, "contains an em dash (U+2014)")


def check_unverified_claims(entries, report):
    """Flag published entries that still carry the 'seed' marker."""
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        if entry.get("published") is True and entry.get("verification") == "seed":
            report.warn(entry.get("id", "<no id>"), "published entry is still marked 'seed'")


def main(argv):
    path = argv[1] if len(argv) > 1 else DEFAULT_PATH
    report = Report()

    if not os.path.exists(path):
        sys.stderr.write("ERROR: data file not found: %s\n" % path)
        return 2

    try:
        with open(path, "r", encoding="utf-8") as handle:
            document = json.load(handle)
    except json.JSONDecodeError as exc:
        sys.stderr.write("ERROR: %s is not valid JSON: %s\n" % (path, exc))
        return 1
    except OSError as exc:
        sys.stderr.write("ERROR: could not read %s: %s\n" % (path, exc))
        return 2

    if not isinstance(document, list):
        sys.stderr.write("ERROR: %s must contain a JSON array at the top level\n" % path)
        return 1

    check_em_dash(document, report)

    seen_ids = {}
    for index, entry in enumerate(document):
        if not isinstance(entry, dict):
            report.error("entry %d" % index, "must be an object")
            continue

        check_required(entry, report)
        check_enums(entry, report)
        check_dates(entry, report)
        check_word_limits(entry, report)
        check_contested_claims(entry, report)
        check_sources(entry, report)

        entry_id = entry.get("id")
        if isinstance(entry_id, str):
            if not SLUG.match(entry_id):
                report.error(entry_id, "'id' must be a lowercase slug")
            if entry_id in seen_ids:
                report.error(entry_id, "duplicate id, also used at index %d" % seen_ids[entry_id])
            else:
                seen_ids[entry_id] = index

    check_brazil_rule(document, report)
    check_unverified_claims(document, report)

    for warning in report.warnings:
        sys.stdout.write("WARNING  %s\n" % warning)

    if report.errors:
        for error in report.errors:
            sys.stderr.write("ERROR    %s\n" % error)
        sys.stderr.write(
            "\n%d problem(s) found in %s\n" % (len(report.errors), path)
        )
        return 1

    published = sum(
        1
        for entry in document
        if isinstance(entry, dict) and entry.get("published") is True
    )
    sys.stdout.write(
        "OK: %d entries, %d published, %d sources total.\n"
        % (
            len(document),
            published,
            sum(len(e.get("sources", [])) for e in document if isinstance(e, dict)),
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
