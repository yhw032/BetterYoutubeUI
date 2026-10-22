# Stability regression tests

Run with Node.js 22 or later; no package installation is required:

```sh
node --check content-script.js
node --check popup.js
node --test tests/content-script.test.cjs
```

The tests execute the production content script in a Node VM with a minimal DOM,
asynchronous storage callbacks, a MutationObserver stub and a deterministic clock.
They cover state transitions and cancellation, not YouTube rendering or browser APIs.

Before releasing, load this directory as an unpacked extension in Chrome/Whale and
check these cases on YouTube:

- Enable legacy fullscreen comments, open them, exit and reenter fullscreen.
- Exit fullscreen immediately after entering it with the saved open preference.
- Open or close comments manually while automatic restoration is pending.
- Disable the feature with comments open; enable it again while fullscreen.
- Navigate between videos, home, search and Shorts with and without comments open.
- Resize below 1000px, close fullscreen comments and confirm they return below video.
- Open two YouTube tabs and change the related-video grid setting in one tab.
- Verify comments, replies, scrolling and player controls with the current YouTube UI.

The existing release workflow packages only runtime assets, so tests are not shipped.
