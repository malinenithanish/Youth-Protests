# Data schema for `data/countries.json`

`data/countries.json` is a JSON array. Each element is one country entry.
The site reads it with `fetch()` at runtime, so it must stay a plain array of
plain objects. No comments, no trailing commas, no extra top level keys.

Run `python3 scripts/validate.py` after any edit. The script exits non-zero
when the file breaks one of the rules below.

## Entry fields

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | Lowercase slug, unique across the file. Used in URLs. |
| `country` | string | yes | Name of the country in English. |
| `iso2` | string | yes | Two letter country code, uppercase. |
| `lat` | number | yes | Latitude of the capital or main protest city. |
| `lng` | number | yes | Longitude of the capital or main protest city. |
| `movement_name` | string | yes | Short name of the movement, year included. |
| `status` | string | yes | One of `ongoing`, `concluded`, `unclear`. |
| `start_date` | string | yes | `YYYY-MM-DD`, or `YYYY-MM` when only the month is known. |
| `last_updated` | string | yes | `YYYY-MM-DD`. The date of the most recent source read for this entry. |
| `trigger_categories` | array of strings | yes | Every value must be one of `taxes`, `corruption`, `public_services`, `censorship`, `education`, `electoral`, `other`. |
| `trigger_summary` | string | yes | Maximum 60 words. What set the movement off. |
| `government_response` | string | yes | Maximum 60 words. What the state did. |
| `outcome_so_far` | string | yes | Maximum 60 words. What changed. Say plainly when a movement is still unfolding. |
| `contested_claims` | array of objects | yes | May be empty. Each object has `topic`, `account_a`, `account_b`, `sources`. |
| `sources` | array of objects | yes | Each object has `title`, `publisher`, `url`, `type`, `accessed`. |
| `verification` | string | yes | One of `seed`, `checked`, `needs_verification`. |
| `published` | boolean | yes | Whether the entry appears on the public site. |

## Contested claim objects

| Field | Type | Rules |
| --- | --- | --- |
| `topic` | string | The question the two accounts answer. |
| `account_a` | string | First account. Attribute it: "Reuters reported", "according to Amnesty". |
| `account_b` | string | Second account, or the reason the first cannot be confirmed. |
| `sources` | array of strings | Publisher names, as they appear in that entry's `sources` list. |

## Source objects

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | Article title as published. |
| `publisher` | string | Organisation that published it. |
| `url` | string | `https://` link to the page that was actually opened. |
| `type` | string | One of `news`, `wire`, `analysis`, `opinion`, `academic`. |
| `accessed` | string | `YYYY-MM-DD`, the day the page was read. |

## Rules the validator enforces

1. The file parses as JSON and the top level is an array.
2. Every required field is present on every entry.
3. Enum fields only use allowed values.
4. Dates match `YYYY-MM-DD` or `YYYY-MM`.
5. `id` values are unique.
6. `trigger_summary`, `government_response` and `outcome_so_far` are 60 words or fewer.
7. Every entry with `published: true` has at least two sources with `https://` URLs.
8. No string anywhere in the file contains an em dash (U+2014).
9. The `brazil` entry is only published if its `verification` is `checked`.
10. `published` and `verification` have the right type.

## House rules for writing entries

- Say "needs verification" when a fact could not be confirmed. Do not guess.
- For contested claims, put the two accounts side by side instead of picking one.
- Name officials, institutions and organisations freely. Do not name individual
  protesters or victims, and do not show graphic detail.
- Casualty and arrest figures must be attributed to the named source that
  reported them, with the date of the report.
- Never use an em dash. Use commas, colons and hyphens instead.
- Set `verification` to `checked` only after opening and reading every cited
  page. Everything else stays `seed` or `needs_verification`.
