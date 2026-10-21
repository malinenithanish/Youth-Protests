# Youth Protests

A small static website that answers one question: why did young people rise up
in these countries, and what changed afterward?

It is written for students, model United Nations delegates, and anyone who has
never heard of these movements. The tone is plain and neutral. There is no
hype, no call to action, and no opinion about any party, candidate or
government.

## What is on the site

| Page | What it does |
| --- | --- |
| `index.html` | The home page. A short explainer, a Leaflet map with one marker per published country, filters for trigger category and status, a card grid, a section on symbols and how the movements spread, and a section on method. |
| `compare.html` | Two dropdowns and a side by side table. The choice is kept in the query string, for example `compare.html?a=france&b=india`. |
| `brief.html` | A one page printable brief for a single country, for example `brief.html?c=france`. It prints in black on white on one US Letter page. |

The site is built with plain HTML, CSS and vanilla JavaScript. There is no
framework, no build step, no bundler and no backend.

## The only outside dependency

[Leaflet 1.9.4](https://leafletjs.com/), loaded from cdnjs with a pinned
version and a subresource integrity hash:

```
https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css
https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js
```

Map tiles come from OpenStreetMap and the attribution is shown on the map. If
Leaflet or the tiles fail to load, the country list under the map still works
and carries the same information.

## Running it locally

The data is loaded with `fetch()`, and browsers block that on `file://`
addresses. Serve the folder over HTTP instead.

```
python3 -m http.server
```

Then open <http://localhost:8000/>. On Windows, if `python3` is not on your
path, use `python -m http.server`.

To check the data file before you commit anything:

```
python3 scripts/validate.py
```

The script uses the Python 3 standard library only. It exits with a non-zero
status when a rule is broken.

## Adding a country

1. Open `data/countries.json` and add an object to the array.
2. Follow the field list in [`data/schema.md`](data/schema.md). Every field is
   described there, along with the house rules for writing entries.
3. Add at least two `https://` sources for a published entry.
4. Run `python3 scripts/validate.py` and fix anything it reports.
5. Open the new page over the local server and check the card, the compare
   page and the brief.

If a fact cannot be confirmed, write "needs verification" rather than
guessing. If two sources disagree, add a `contested_claims` entry with both
accounts instead of choosing one.

## Source policy

- Every fact on the site comes from a source that is listed with a link.
- Sources are named with the publisher and the type: news, wire service,
  analysis, opinion or academic. Opinion pieces are labelled as opinion.
- Casualty and arrest figures appear only when a named source reported them,
  and they are attributed to that source.
- Where sources disagree, both accounts are shown side by side in a
  contested claims section.
- Individual protesters and victims are not named, and no graphic detail is
  included. Officials, institutions and organisations are named where naming
  them is needed to understand what happened.
- No publisher images, logos or artwork are used. The only visuals are text,
  the map, and original inline drawings made for this project.
- The full list of sources is in [`SOURCES.md`](SOURCES.md).

## Project layout

```
index.html              home page
compare.html            side by side comparison
brief.html              printable one page brief
css/style.css           screen styles, light and dark
css/print.css           print styles for the brief
js/data.js              loads data/countries.json, shared helpers
js/map.js               Leaflet map and the country list
js/cards.js             filters and the card grid
js/compare.js           the compare page
js/brief.js             the brief page
data/countries.json     the data
data/schema.md          the data schema and house rules
scripts/validate.py     data validator, Python 3 standard library only
README.md               this file
SOURCES.md              every source with publisher, type and accessed date
PLAN.md                 what is done and what is open
.nojekyll               tells GitHub Pages not to run Jekyll
```

## Publishing on GitHub Pages

The site is static, so GitHub Pages can serve it straight from the repository.

1. Push the repository to GitHub.
2. Open the repository, then **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Set the branch to **main** and the folder to **/ (root)**.
5. Save. GitHub Pages will publish the site at
   `https://<user>.github.io/<repository>/` within a minute or two.

The `.nojekyll` file is already in the repository, so Pages will serve the
files exactly as they are, with no Jekyll build step.

## Accessibility

- Semantic landmarks, a skip link, and a heading order that makes sense.
- Every map marker is reachable with the keyboard, has an accessible name, and
  opens its summary when Enter or Space is pressed.
- The country list under the map carries the same information as the map, so
  the site works without the map.
- Visible focus outlines, and text contrast that meets WCAG AA in both the
  light and the dark colour scheme.
- The layout is mobile first and works with a keyboard alone.
- `prefers-reduced-motion` and `prefers-color-scheme` are both respected.
