# Utilities for ExpertFlyer

[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/utilities-for-expertflyer/pkadldhlfkfikppkplbpdbpchlpkkelo)

Utilities for automating repetitive manual actions in [ExpertFlyer](https://www.expertflyer.com/), namely creating flight alerts for multiple dates at once.

Note: This extension is not affiliated with ExpertFlyer.

## How to use

1. Login to [ExpertFlyer](https://www.expertflyer.com/), then click [Create New Flight Alert](https://www.expertflyer.com/flightAlert.do).

2. In the form at the bottom of the page, specify a flight route (including origin and destination airports in the format of e.g. `NH7 SFO-NRT`), a date range, the [fare class code](https://www.expertflyer.com/sessionlessClassList.do), and quantity. Click Queue Alerts.

3. Click Start, then don't touch or open other ExpertFlyer tabs until the runner is done.

Remember to be mindful of ExpertFlyer's limit of 200 active flight alerts. The extension will not stop you from trying to make more than 200 extensions, though it does rate limit the form submissions.

## Troubleshooting

This extension uses Chrome's [Manifest Version 3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/) which requires the use of Service Workers. This support seems to be a bit [buggy](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/LQ_VpMCpksw) still and sometimes the Service Worker is suspended by the browser and not correctly re-awoken when incoming messages occur. If the runner appears to stop, try loading the [Create New Flight Alert](https://www.expertflyer.com/flightAlert.do) form page anew.

## Development notes

For this simple browser extension I wanted to avoid the need for any compilation step and learn about a new frontend library, so this extension uses [Lit](https://lit.dev/) and [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## Acknowledgements

This extension is not affiliated with ExpertFlyer. Open source libraries [Lit](https://lit.dev/) and [iFrame Resizer](https://github.com/davidjbradshaw/iframe-resizer) are used.

This extension is provided "AS IS". The developer makes no warranties, express or implied, and hereby disclaims all implied warranties, including any warranty of merchantability and warranty of fitness for a particular purpose.

## Version history

- 0.1: initial release with support for creating flight alerts in bulk
- 0.2: adds ability to de-paginate the alerts list and delete alerts in bulk
