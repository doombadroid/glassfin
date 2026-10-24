<p align="center">
  <img src="./assets/images/icon.png" alt="Glassfin app icon: a clear glass film sail with a mint play mark on a mint hull" width="160">
</p>

<h1 align="center">Glassfin</h1>

<p align="center">
  <b>A Liquid Glass Jellyfin player for iPhone, built for iPhone Duo.</b><br>
  Folded, unfolded, held like a book or standing on a table, it fits the pose you're in.
</p>

<p align="center">
  <img alt="Platform: iOS only" src="https://img.shields.io/badge/platform-iOS%20only-8FE6CB?style=flat-square&logo=apple&logoColor=white">
  <img alt="Built with the iOS 27.1 SDK" src="https://img.shields.io/badge/iOS%20SDK-27.1-0E7A63?style=flat-square">
  <img alt="License: MPL-2.0" src="https://img.shields.io/badge/license-MPL--2.0-245F66?style=flat-square">
</p>

---

## 💚 Built on Streamyfin, with endless thanks

Glassfin exists because of **[Streamyfin](https://github.com/streamyfin/streamyfin)**, and we want to be loud about it.

Streamyfin is one of the finest Jellyfin clients ever made, and every good thing you feel in Glassfin started there. The silky native MPV player, the trickplay scrubbing, the offline downloads, skip intro and credits, Chromecast, Seerr requests, SyncPlay, the settings plugin, the music player, the translations into dozens of languages, the thousands of tests: all of it is their work, built with care, taste and an almost unreasonable amount of polish, and given away for free under an open licence. Glassfin is a coat of glass and a few new tricks on top of a ship they built.

**[Fredrik Burmester](https://github.com/fredrikburmester)** created Streamyfin. The core developers who carried it to where it is deserve every bit of credit too:

<p>
  <a href="https://github.com/Alexk2309">@Alexk2309</a> (who built the native MPV module the whole player stands on) ·
  <a href="https://github.com/herrrta">@herrrta</a> ·
  <a href="https://github.com/lostb1t">@lostb1t</a> ·
  <a href="https://github.com/Simon-Eklundh">@Simon-Eklundh</a> ·
  <a href="https://github.com/topiga">@topiga</a> ·
  <a href="https://github.com/lancechant">@lancechant</a> ·
  <a href="https://github.com/simoncaron">@simoncaron</a> ·
  <a href="https://github.com/jakequade">@jakequade</a> ·
  <a href="https://github.com/Ryan0204">@Ryan0204</a> ·
  <a href="https://github.com/retardgerman">@retardgerman</a> ·
  <a href="https://github.com/whoopsi-daisy">@whoopsi-daisy</a> ·
  <a href="https://github.com/Gauvino">@Gauvino</a>
</p>

…and every one of the [Streamyfin contributors](https://github.com/streamyfin/streamyfin/graphs/contributors) and translators. Thank you. Truly.

If Glassfin makes your evenings better, please thank them where it counts:
**[star Streamyfin](https://github.com/streamyfin/streamyfin)**, support it on [Patreon](https://www.patreon.com/streamyfin) or [Buy Me a Coffee](https://www.buymeacoffee.com/fredrikbur3), and use the official Streamyfin app on Android, Apple TV and Android TV.

> Glassfin is an independent, unofficial fork. It isn't affiliated with or endorsed by the Streamyfin project or Jellyfin. Please don't take Glassfin bugs to the Streamyfin team: open them [here](https://github.com/doombadroid/glassfin/issues) instead.

---

## 📱 iOS only

Glassfin is built and tested for **iPhone only** (iOS 16.4 or later; the iPhone Duo layouts need iOS 27.1).

The Android, Android TV and tvOS code from Streamyfin is still in the repository, untouched, so the fork can keep merging upstream changes. It isn't built, tested or supported here. On those platforms, please use [Streamyfin](https://github.com/streamyfin/streamyfin) itself.

## ✨ What Glassfin adds

### Frost: a Liquid Glass look
- A dark, glassy design with a mint accent.
- Each screen tints itself with a soft, blurred wash of the artwork in focus: the show you're watching on Home, the title you opened on its page.
- A native Liquid Glass tab bar, and glass controls throughout.
- A new app icon: a clear glass film sail, built as a layered iOS Icon Composer icon that adapts to light, dark and tinted home screens.

### Made for iPhone Duo
- **Folded:** buttons move into the vertical bar down the side, the way Apple's guidelines lay it out, and screens keep clear of the side strip and its camera.
- **Unfolded:** the tab bar becomes a sidebar, and a series page sets the show and its episodes side by side.
- **Held like a book:** the series page splits on the fold, so nothing sits in the crease.
- **Standing on a table (tabletop):** the video plays on the top half and a soft, blurred reflection of it falls onto the bottom half, the way Netflix does it. Every control rests on that lower half in glass capsules that glow and shift as the phone tilts and brighten as the room darkens. The volume level shows on the video half, clear of the fold.
- The fold, hinge angle and camera positions come from the iOS 27.1 APIs (`UIHingeInteraction`, reserved regions), not guesses.

### A calmer player
- A centred dock: close in the corner and the title at the top. At the bottom: the scrubber, a play/back/forward capsule, then one quiet row for picture in picture, episodes, audio, subtitles and more.
- The status bar stays hidden during playback (the iOS 27 SDK way, through the view controller).
- Brightness and volume sliders appear only while you use them.

### Fixes
Glassfin carries fixes for about 27 open Streamyfin bug reports. Among them:
- **iOS 27:** the search tab works with the iOS 27 SDK (#2234).
- **Playback:**
  - Music pauses when a video starts, and video owns the lock-screen controls (#1727, #442).
  - Episode and subtitle progress no longer gets lost.
  - The swipe gesture settings now reach the native player.
- **Library and Home:** column layout, custom Home sections paging past the first page, and refreshing when the app returns to the foreground.
- **Downloads:** a download lost while the app was closed is queued again instead of vanishing (#1701), without starting a second copy of one still running.
- **Small screens:** the intro sheet fits short screens, and HTML in descriptions shows as text.

Most come with a test next to the fix.

## 🌟 Everything else (all Streamyfin's work)

- 🎬 **[MPV](https://mpv.io/) player** through [MPVKit](https://github.com/mpvkit/MPVKit): plays almost anything, with burned-in subtitles.
- 🖼️ **Trickplay** previews while you scrub, and chapter markers.
- 🚀 **Skip intro, recap and credits.**
- 📥 **Downloads** for offline watching.
- 👥 **SyncPlay**, to watch together.
- 📡 **Chromecast**, plus picture in picture.
- 🤖 **[Seerr](https://github.com/seerr-team/seerr)** requests in the app.
- ⚙️ **Settings sync** across users through the [Streamyfin server plugin](https://github.com/streamyfin/jellyfin-plugin-streamyfin).
- 🔐 **Custom auth headers**, for servers behind an access gateway ([docs](./docs/custom-headers.md)).
- 🎵 **Music**, **Live TV**, **watchlists**, and [Jellysearch](https://gitlab.com/DomiStyle/jellysearch) and Marlin search.

## 📥 Install

Glassfin isn't on the App Store. Each build is an unsigned IPA that you sign with your own Apple ID.

- **SideStore / AltStore:** add this source, and updates arrive on their own:
  ```
  https://raw.githubusercontent.com/doombadroid/glassfin/develop/sidestore-source.json
  ```
- **Manual:** download `Glassfin-unsigned.ipa` from the [latest release](https://github.com/doombadroid/glassfin/releases/latest) and sign it with SideStore, AltStore or any other sideloading tool.

You'll need a Jellyfin server you own, reachable from your phone.

## 🛠️ Building

CI builds every push to `develop` with **Xcode 27.1 and the iOS 27.1 SDK** (`.github/workflows/build-next.yml`). That SDK is the first that lays an app out edge to edge on iPhone Duo. To build yourself on a Mac:

1. Install [Bun](https://bun.sh) 1.4 and Xcode 27.1.
2. `bun install`
3. `bun run prebuild`
4. `bun run ios` for a dev build in the simulator, or `bun run ios:unsigned-build` for an unsigned IPA.

The project uses Bun only (no npm, yarn or npx). Run `bun run test` before sending changes. The app icon is regenerated from `assets/icon-source/` with `render.sh`.

## 🙏 Acknowledgements

- The **Streamyfin** team and contributors, above all. See the top of this page, and then go star their repo.
- **[Jellyfin](https://jellyfin.org)**, for the free software media server that makes all of this possible, and its [TypeScript SDK](https://github.com/jellyfin/jellyfin-sdk-typescript).
- **[MPV](https://mpv.io/)** and **[MPVKit](https://github.com/mpvkit/MPVKit)**.
- **[Reiverr](https://github.com/aleksilassila/reiverr)**, which helped Streamyfin understand the Jellyfin API.
- **[Seerr](https://github.com/seerr-team/seerr)**.
- **Netflix's iPhone Duo app**, whose tabletop mode inspired Glassfin's.

## 📄 License

Glassfin is licensed under the **Mozilla Public License 2.0**, the same as Streamyfin. See [LICENSE.txt](./LICENSE.txt). The original Streamyfin copyright and licence notices are kept, as the MPL requires, and every change Glassfin makes is published here as source.

## ⚠️ Disclaimer

Glassfin doesn't promote, support or condone piracy in any form. It is meant only for streaming media you personally own and control, and it doesn't provide or include any media.
