# App Store submission

Glassfin is an MPL-2.0 fork of Streamyfin, which is already on the App Store. App Review
rejects close copies under guidelines 4.1 (copycats) and 4.3(b) (spam), judging similarity
"in the app's binary, metadata, and/or concept". Everything below exists to make the
difference plain. Researched 2026-10-24 against the guidelines last updated 2026-10-16.

## Rules for every field

- Never write "Streamyfin" in any App Store Connect field (name, subtitle, keywords,
  description, promotional text, What's New, screenshots). Apple's copycat guidance: "Don't
  include references to popular app names or trademarked terms in any metadata field." The
  credit lives in the app (Settings > Acknowledgements) and in the README.
- "Jellyfin" may describe compatibility ("for Jellyfin"), as other listed clients do, but
  not as the app's name.
- Screenshots come from the public demo server (demo.jellyfin.org/stable, user `demo`, no
  password): public-domain and Creative Commons films only. Leave out Dracula (1931); it is
  still under copyright.
- Lead with the iPhone Duo. Upload both Duo screenshot sets (outer 1398×2034, inner
  2007×2853, plus landscape), not only the standard iPhone sizes.

## Listing draft

**Name:** Glassfin

**Subtitle (30):** Jellyfin player for iPhone Duo

**Promotional text:** Stand your iPhone Duo on a table and the video plays on top while the
bottom half holds the controls, what's up next and the chapters.

**Description:**

> Glassfin plays movies and shows from your own Jellyfin server, and it was designed around
> iPhone Duo.
>
> TABLETOP. Fold the phone halfway and stand it up: the video plays on the upper half, a
> soft reflection falls onto the lower half, and the lower half becomes a deck with the
> controls, what's up next and the chapters. Browse and queue without stopping playback.
>
> BOOK. Hold it open like a book: the video sits on one side, and the episodes, chapters and
> details sit on the other.
>
> UNFOLDED. Open it flat for a sidebar and side-by-side pages.
>
> FOLDED. On the outer screen, the controls step clear of the side bar and the camera.
>
> Also: a Liquid Glass design, offline downloads, picture in picture, skip intro and
> credits, subtitles and audio track switching, and SyncPlay to watch together.
>
> Glassfin needs a Jellyfin server you run yourself. It doesn't include or provide any
> media. Glassfin isn't affiliated with or endorsed by the Jellyfin project.

**Keywords (100):** jellyfin,media server,player,foldable,duo,tabletop,offline,home server,mpv,stream

**Support URL:** https://github.com/doombadroid/glassfin/issues

## App Review notes (paste into "Notes")

> Glassfin is an independent, open-source app published under the Mozilla Public License
> 2.0. It started as a fork of the open-source Jellyfin client Streamyfin by a different
> developer, as that licence allows, and it credits that project in Settings >
> Acknowledgements. It is not affiliated with Streamyfin, and its name, icon and branding
> are its own.
>
> What Glassfin adds that isn't available elsewhere: iPhone Duo layouts built on the iOS
> 27.1 APIs (UIHingeInteraction, reserved regions, vertical bar edge):
> - a tabletop player whose lower half browses up-next and chapters while the video plays
> - a book-pose split player
> - a sidebar and two-pane pages when unfolded
>
> It also has its own Liquid Glass design for the home, details, library, settings and
> sign-in screens.
>
> To review, sign in to the public Jellyfin demo server: address
> https://demo.jellyfin.org/stable, user "demo", no password. To see the tabletop player,
> play any title on iPhone Duo and fold the phone halfway.
>
> Source code: https://github.com/doombadroid/glassfin

## Before submitting

1. A paid Apple Developer Program membership. The free Apple ID that signs today's sideloaded
   builds can't publish.
2. Optional, but it closes the impersonation angle: a written no-objection from the
   Streamyfin maintainers (draft below). Mention it in the review notes if they reply.
3. If rejected under 4.3(b), reply in Resolution Center with the differences above, then
   appeal to the App Review Board. The last resort is contributing the Duo work upstream.

## Draft message to the Streamyfin maintainers

Send it from your own account (for example, a GitHub discussion on streamyfin/streamyfin).
It isn't sent automatically.

> Hi Fredrik and the Streamyfin team,
>
> I've been building Glassfin (https://github.com/doombadroid/glassfin), an MPL-2.0 fork of
> Streamyfin focused on iPhone Duo: a tabletop player, book and unfolded layouts, and its
> own Liquid Glass design. It carries a few bug fixes I'm happy to send upstream as PRs.
>
> I'd like to put it on the App Store under its own name and icon, with no Streamyfin
> branding in the listing and a credit to your project in the app. Would you be OK with
> that? A short "no objection" would help me answer App Review if they ask about the fork.
>
> Thanks for building Streamyfin.
