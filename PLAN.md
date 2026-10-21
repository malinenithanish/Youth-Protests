# Plan

A running list of what is done, what is still open, and what has to be checked
before the next release. Updated 19 October 2026.

## Done

- Data file `data/countries.json` with six countries: France, India, Nepal,
  Madagascar, Kenya and Brazil.
- Schema and house rules written up in `data/schema.md`.
- Validator `scripts/validate.py`, Python 3 standard library only, exits
  non-zero on failure. It checks JSON validity, required fields, enum values,
  date formats, duplicate ids, word limits, the two source rule for published
  entries, em dashes, and the rule that Brazil stays unpublished until it is
  checked.
- Home page with the explainer, a Leaflet map with one marker per published
  country, filters for trigger category and status, a search box, a card grid
  showing trigger, government response, outcome so far, status badge, last
  updated and sources, a symbols section and an about and method section.
- Compare page with two dropdowns, query string support and a side by side
  table.
- Brief page with background, trigger, government response, outcome so far,
  contested claims, key dates and sources.
- Print stylesheet that fits the brief on one US Letter page in black on
  white, hides the navigation, and prints the address of every link.
- Mobile first layout, semantic landmarks, skip link, keyboard operable map
  markers, visible focus styles, WCAG AA contrast in both colour schemes,
  reduced motion support, and a text list as an alternative to the map.
- README, SOURCES and this file.
- `.nojekyll` in place.

## Verification status

Every entry is marked `checked`. That means every source listed for it was
opened and read on 19 October 2026, and the wording of the entry was checked
against those pages.

| Country | Status | Verification | Notes |
| --- | --- | --- | --- |
| France | ongoing | checked | Updated well past the seed data. The movement grew from school blockades into nationwide marches, and the police response and curfews are now a large part of the story. |
| India | ongoing | checked | The education minister left office in July 2026, which the seed data did not have. The demand has since moved to the chief election commissioner. |
| Nepal | concluded | checked | Election result and the new government confirmed with a wire service and a parliamentary research briefing. |
| Madagascar | concluded | checked | The year after the protests is now covered, including the new constitution timetable. |
| Kenya | concluded | checked | Government response and outcome filled in from the 2024 withdrawal of the Finance Bill through to the 2026 statement by the interior minister. |
| Brazil | ongoing | checked | The seed data warned that the evidence was weak. It has since been confirmed by three mainstream publishers, so the entry is now published. See the note below. |

## Open questions and things that need verification

- **Nepal, exact first day of the protests.** The start date is recorded as
  `2025-09` because the sources that were read place the start in early
  September but do not agree on the day. The trigger summary says so.
- **India, exact first demonstration.** The contested claims section records
  the disagreement between the accounts that put the first large protest on 6
  June 2026 and the account that puts the Jantar Mantar sit-in at 20 June
  2026.
- **France, the figure of 18 police watchdog investigations** that appeared
  in the seed notes could not be confirmed. The checked sources give 24
  investigations on 10 October and "at least two dozen" on 17 October, and
  both are shown.
- **France, the seed note about about 5,000 arrests and more than 700 schools
  disrupted.** The arrest figure is now confirmed with a date attached, and
  the school figure is recorded from a different source with its own date.
  The original caption-only figure is not used.
- **Brazil, the Rio de Janeiro police investigation with three arrests** that
  appeared in the seed notes could not be matched to any mainstream report.
  What was found is a Federal District investigation reported by Valor
  International. The record says so in a contested claim.
- **Brazil, intimidation of participants.** This rests on a single outlet.
  The entry says so, and asks for a second source.
- **Kenya, total deaths across the 2024 and 2025 waves.** Rights groups say
  more than 100 people died, the Kenya National Commission on Human Rights
  recorded 60 deaths and 601 injuries for 2024, and the ACLED project recorded
  82 reported fatalities. The figures are shown side by side rather than
  merged.
- **Madagascar, the date the government was dissolved.** The BBC account
  places it on the Monday before 9 October 2025, while other coverage puts
  the military phase in October. Both are in the contested claims.

## Next steps

1. Re-check the France, India and Brazil entries first. Those are the three
   that were still moving when the data was last reviewed.
2. Add countries where the pattern is clear and the sources are strong, for
   example Morocco, Indonesia, Peru and the 2025 events in Bangladesh. Use
   the same rules, and keep the neutral wording.
3. Consider adding a `key_dates` array to the schema so the brief can show
   real key dates instead of the dates that are currently pulled out of the
   prose.
4. Check the brief against a printed page from a real printer, not only a PDF
   export, because printer margins vary.

## Known limits of the project

- The site is a snapshot. Nothing on it updates by itself.
- The map is an aid, not the point. The text carries everything.
- The site says what named sources reported. It does not check whether they
  are right, only that they were read and are shown accurately.
