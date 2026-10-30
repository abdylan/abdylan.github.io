# Public welcome and installation page

Self-contained static site for Evidence Recorder. Publish **only this directory**.
No framework, package installation, build step, external font, image service or
analytics is required. Relative asset paths support a GitHub Pages project URL.

## How it works

![Four illustrated stages from recording to sharing](assets/how-it-works-simple.png)

Illustrated example screens. Choose contacts and a delay, start recording, check
cloud backup and timer confirmation, stop or cancel sharing, and receive an email.
Stopping recording does not cancel sharing. Email attempts wait for the release
deadline and a verified combined video. Provider acceptance does not confirm delivery.
The [welcome page](https://abdylan.github.io/#how-it-works) includes a text version
and a link to the full-size image. The six-hour setting is an example.

## Local preview

From `/Users/abdylan/evidence-recorder`:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory website
```

Open `http://127.0.0.1:8765/`. Stop the server with Ctrl+C.

## Enable the APK download

The current download configuration selects signed `0.14-camera-setup`
(7,750,369 bytes). Debugging is disabled and the signing key is unchanged.
Release: https://github.com/abdylan/abdylan.github.io/releases/tag/android-0.14-camera-setup-20261030

APK SHA-256: `e6479b34f7dcfa3905660c5927f85bc224db567dc82ef66be00b6d75a02365f1`.
For a future update:

1. Publish the intended APK as a public download, such as a GitHub Release asset.
2. Set `apkUrl` to the public HTTPS URL ending in `.apk`, or to a relative path
   for an APK deliberately included in this site's public files.
3. Optionally set `appVersion` and `apkSizeMb` for that exact file.
4. Preview the page and verify the download on an Android phone.

Only HTTPS external downloads and same-origin HTTP preview paths are accepted.
URLs with user information, query strings or fragments are rejected. Do not put
signed storage URLs, credentials, enrollment files or connection codes in config.

## GitHub Pages

For a free public site, use a **separate public repository** containing only the
contents of `website/`. The app/backend repository does not need to become public.
Publish its root with GitHub Pages and enable HTTPS. Keep `.nojekyll` in the root.
Creating a repository, publishing the site and uploading an APK are separate actions.

### Published site — 29 October 2026

The owner-authorized publication is live at **https://abdylan.github.io/**.
Its separate public repository is `abdylan/abdylan.github.io`, publishing `main`
from `/`. HTTPS is enforced. Initial commit:
`b6b1192b5002bf1c8f6ef3a0560462dd585559c2`.

The page, CSS, JavaScript, configuration and icon returned HTTP 200 and matched
their published source hashes. The app repository `abdylan/evidence-recorder`
remains private. Only the six static runtime files and a public README were copied;
no app repository history, credentials or private data was published.

The release APK was subsequently published with the owner's approval, and its URL
is configured for the download button. Pages commit `a36dcc3` deployed successfully
and its live page/configuration/script hashes were verified. The APK downloads
without GitHub authentication and matches its published SHA-256.
Future webpage updates must reach the Pages repository's `main` branch; commits
to the app repository alone do not update this site.

## Private invitation support

Share this public README or the generic welcome URL freely. Send each person's
private invitation separately; do not add real invitation codes or QR images here.
The app owner creates invitations with the authenticated operator tooling in the
private application repository.

`/connect/` reads an invitation from the URL fragment and makes a read-only status
request to the fixed AWS API. The page shows available, expired, already-used and
offline states. It never claims an invitation. The explicit Android button opens
the installed app, where the user confirms; code entry is the browser fallback.
Install the APK first, then return to the original private invitation.

Keep `connect/`, `.well-known/assetlinks.json` and `.nojekyll` when publishing.
The association file lists the public release certificate only. Future APKs must
retain that signer and package. No AWS credentials belong in these files.

## Scope and privacy

The website uses Pakistan green (`#01411C`) with a white background. The shared
accent controls both pages, and the icon and active infographic use the same palette.
The previous infographic files remain as historical assets.

Theme publication: Pages commit `0968b65170a1d6b03458cba64c17695b48750eea`
deployed successfully (run `40999296949`). Both pages, styles, icon and green
infographic returned HTTP 200 with matching source hashes. Browser checks confirmed
RGB `1, 65, 28` accents and a white background. White/green contrast is 11.84:1.
Existing app behavior, APK assets and AWS resources were not changed.

- Installation instructions, purpose infographic, code-entry guidance, setup tips,
  estimated ten-minute upload sizes, and common questions.
- The welcome page makes no AWS calls. Only the private-invitation page can check
  invitation status. It cannot read recordings, connect a phone, or start capture.
- No device credentials, recordings, user lists, personal recipient addresses,
  cookies, browser storage or tracking. Invitation fragments can remain in browser
  history and messages; keep them private. Do not put codes in query strings.
- Content Security Policy blocks third-party scripts. Only `/connect/` allows
  requests to the fixed AWS API. The host can still log ordinary page requests;
  URL fragments are not sent in those requests. Download hosts have their own logs.
- The host controls HTTP headers. Meta CSP cannot enforce every server header;
  review hosting settings separately before publishing.

Content is grounded in the private repository's connection and qualification docs.
Invitation state is checked against AWS; an unavailable check is shown explicitly.
The infographic
describes intended release behavior, not a live recording or service status.

The invitation update is published in commit
`4f1ad2016d74663d86bfd6540dbcddb315cd8ec4` (Pages run `40920047247`). Its live
pages/assets match source hashes; the association JSON is served without redirect.
The generic invitation page rendered correctly in the browser with a disabled
connection button and the new APK download. Real QR scans and app handoff on the
A07 remain unqualified. See the private connection guide for operator commands.

## Compact invitation page — 30 October 2026

The invitation page now shows two steps: **Download app**, then **Open app**.
Installation help and manual code entry stay in closed disclosure sections.
Missing, expired and unavailable invitations show a short message without the steps.
Used invitations retain the original-phone retry, and offline checks retain the
native connection attempt. A download click only reveals the installation hint;
it never marks installation or enrollment complete.

Six Node checks cover request safety, state handling, download behavior, invitation
changes and late status replies. The shared welcome-page download behavior is
preserved. A browser preview at 360 × 800 pixels used synthetic status without AWS
requests. Manual-code disclosure and missing-invitation navigation were inspected.
The temporary fixture and screenshot remain under ignored `work/testing/`.

Pages commit `f25c1c71e5f84705411578951a5cbd387416519e` deployed successfully
(run `40998608537`). The live page and scripts matched published hashes. The newer
homepage and stylesheet from commit `73dfbd9` were preserved. The published empty
invitation page also showed the short message in the browser. No APK or AWS
deployment, invitation creation, recording or message was needed for this update.

## Data estimates

For ten minutes (600 seconds), decimal MB = `(video kbps + 48) × 600 / 8000`.

| Mode | Video bitrate | Video plus audio |
| --- | ---: | ---: |
| Economy HEVC | 280 kbps | 24.6 MB |
| Economy H.264 | 350 kbps | 29.85 MB |
| Standard HEVC | 480 kbps | 39.6 MB |
| Standard H.264 | 600 kbps | 48.6 MB |

These are configured-bitrate estimates for one active rear camera on the A07. They exclude protocol overhead, retries and video downloads. Actual
size varies. Simultaneous dual-camera capture needs a separate estimate.

## Implementation validation — 29 October 2026

- JavaScript syntax checks passed for both scripts.
- Fourteen offline checks passed for download URL validation, unavailable state,
  relative paths and metadata handling.
- HTML checks found one main heading, unique IDs, and valid local links/assets.
- All four ten-minute upload estimates matched the configured bitrate arithmetic.
- Visual/mobile browser qualification is outstanding: this session blocked local
  server binding and file-based browser navigation. No browser-rendered result is
  claimed. No app build, AWS operation, invitation or email test was required.

## Recording-limit release — 30 October 2026

The current download configuration targets `0.12-recording-limit`, code 12,
7,668,449 bytes, in release `android-0.12-recording-limit-20261030`. The public
app name remains Evidence Recorder. Both page cache keys select the new
configuration, and the screen-lock FAQ describes the mandatory 60-minute cap.
The public website source is preserved; only release metadata, cache keys, FAQ
and current installation guidance are updated.

Release 0.12 is published. Pages deployment `41022061204` succeeded for public
commit `1c53390aae3e643b2fc9bf69f4d03fed666586d3`. The live homepage, invitation
page, versioned configuration and association file matched source hashes. The
anonymous APK and checksum matched the exact 0.12 APK installed on the A07.
