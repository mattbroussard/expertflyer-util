# Utilities for ExpertFlyer

[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/utilities-for-expertflyer/pkadldhlfkfikppkplbpdbpchlpkkelo)

Utilities for automating repetitive manual actions in [ExpertFlyer](https://www.expertflyer.com/), namely creating flight alerts for multiple dates at once.

Note: This extension is not affiliated with ExpertFlyer.

## How to use: Bulk Alerts

1. Login to [ExpertFlyer](https://www.expertflyer.com/), then click [Create New Flight Alert](https://www.expertflyer.com/flightAlert.do).

2. In the form at the bottom of the page, specify a flight route (including origin and destination airports in the format of e.g. `NH7 SFO-NRT`), a date range, the [fare class code](https://www.expertflyer.com/sessionlessClassList.do), and quantity. Click Queue Alerts.

(Note: As of version 0.10, this form can be accessed from the Flight Availability and Awards & Upgrades search result pages by clicking the 🤖 button)

3. Click Start, then don't touch or open other ExpertFlyer tabs until the runner is done.

Remember to be mindful of ExpertFlyer's limit of 200 active flight alerts. The extension will not stop you from trying to make more than 200 extensions, though it does rate limit the form submissions.

## Other features

- A "Depaginate" button appears the bottom of paginated flight alert lists. This removes pagination and shows everything on one page.
- Flight alerts can be selected with a checkbox on the right side, then deleted or resubmitted in bulk.
  - Optionally, deleted alerts can be re-added back to the queue used by the bulk adding feature described above.
  - You can shift-click to select a range of consecutive rows
- Rows with "Yes" or non-zero availability are highlighted in green for easier visual identification on the Awards & Upgrades search page.
- Lists of flight alerts (in queue) can be imported or exported as JSON
- On the Flight Timetables page, you can easily save and restore filter settings in a single click (useful when switching between endpoints)
- On the Awards & Upgrades and Flight Availability search result pages, you can navigate to previous/next date ranges with a single click
- On the Flight Timetables page, you can view individual flights or the whole page worth of flights on GCMap
- On the Flight Timetables page, you can filter by some additional properties: origin/destination country/state, number of stops, flight frequency

## Troubleshooting

This extension uses Chrome's [Manifest Version 3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/) which requires the use of Service Workers. This support seems to be a bit [buggy](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/LQ_VpMCpksw) still and sometimes the Service Worker is suspended by the browser and not correctly re-awoken when incoming messages occur (maybe/hopefully [fixed](https://bugs.chromium.org/p/chromium/issues/detail?id=1371876#c5) in Chrome 110?). If the runner appears to stop, try loading the [Create New Flight Alert](https://www.expertflyer.com/flightAlert.do) form page anew.

## Development notes

For this simple browser extension I wanted to avoid the need for any compilation step and learn about a new frontend library, so this extension uses [Lit](https://lit.dev/) and [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## Acknowledgements

This extension is not affiliated with ExpertFlyer. The open source libraries [Lit](https://lit.dev/) and [Lodash](https://lodash.com/) are used.

This extension is provided "AS IS". The developer makes no warranties, express or implied, and hereby disclaims all implied warranties, including any warranty of merchantability and warranty of fitness for a particular purpose.

## Version history

- 0.1: initial release with support for creating flight alerts in bulk
- 0.2: adds ability to de-paginate the alerts list and delete alerts in bulk
- 0.3: adds highlighting of "yes" rows in award availability search
- 0.4: adds import/export buttons for alerts queue
- 0.5: adds ability to bulk resubmit previously-notified alerts; reorganized files in repo
- 0.6: minor bugfix to silence Lit warnings
- 0.7: adds GCMap links and ability to save filter configuation on the Flight Timetables page
- 0.8: adds previous/next calendar navigation buttons to award and availability search result pages
- 0.9: adds ability to add prefix to alert names and set alerts for flights that operate only on certain weekdays
- 0.10: adds the ability to add alerts to the queue from the award and availability search result pages; removes iframe
- 0.11: adds the ability to filter the timetable page by nonstops, daily flights, and origin/destination countries/states
- 0.12: extends the saved filter feature on the timetables page to support up to 6 saved filters
- 0.13: CSS fix for z-ordering of "add to queue" button on award and availability pages
- 0.14: tabbed view of awards page now highlights the tab in green if any results within it have availability
- 0.15: add Export JSON button to Timetables page
