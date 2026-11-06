# Decision log

🇬🇧 English | [🇵🇱 Polski](DECISIONS.pl.md)

Short notes on what I decided and why. Back to the [README](README.md).

---

## Both variants

- **No framework, no bundler.** Plain scripts loaded in order, exposing a small global each (`Game`, `Intro`, `Sync`, ...). That keeps the ads small, and there is nothing to set up to run them.
- **SCSS with BEM, compiled CSS committed.** SCSS partials keep the styles organised, and variables (and `px2x()` in Variant A) keep the numbers traceable to the design; the compiled `css/style.css` is in the repository so an ad can be opened without a build. `npm run build:css` regenerates it.
- **2x assets rendered at 50%.** Every layer is placed at its measured position in CSS pixels (design pixel ÷ 2); nothing was redrawn or replaced.
- **Click tag as specified.** `window.clickTag || 'https://example.com/landing'`, opened in a new tab with `noopener`.
- **Animate only `transform` and `opacity`.** Layout properties are never animated. `will-change` is applied only to the layers that really move, because promoting everything softened text on the endcards.
- **`prefers-reduced-motion`** is respected in both ads (GSAP `matchMedia` in A, final state at once in B).
- **Pause when hidden.** Both ads stop on `visibilitychange` and resume from the same point.
- **Weight.** Variant A ships 1.45 MB and Variant B 0.50 / 0.55 / 0.83 MB per part (limit 3 MB each). `design/`, `tools/`, `scss/` and `node_modules/` are not referenced by any ad, so they do not count.
- **Debug modes** (`?debug=1`) are in both ads and do nothing unless the parameter is in the URL.
- **No comments in the code** (except the GSAP licence header, which must stay). I tried to let names and small functions explain the code; the reasons are written down here.
- **Git.** One feature branch per step, merged into `develop` with merge commits, and a single squash into `main`, so the history shows the work in steps.

---

## Variant A: Gut Run

**DOM + CSS transforms instead of canvas.**
The assets are layered PNGs and the endcards are made of many animated sprites, which GSAP handles well on DOM elements. The scrolling world (gut and obstacles) is one container moved with a single `translate3d`, so a frame costs one transform instead of 15 separate ones. Canvas would have meant redrawing and re-implementing text, hit areas and the endcard animations for no visible gain.

**Scaling to the viewport.**
The game is designed at 360×640 and scaled to fit ("contain") with the visual viewport size (`100dvh` as a fallback), so mobile browser toolbars do not cut anything off. The scaled stage is snapped to whole device pixels, which removed a hairline seam that appeared on tall screens. On screens narrower than 9:16 the free area is filled with a gradient that matches the bottom of the artwork, and on the endcards it switches to the endcard background.

**Fixed-step simulation.**
Physics runs at 1/120 s with an accumulator and the render interpolates between the last two states. Jump height and fall speed are therefore the same on 60 Hz and 120 Hz phones, and a dropped frame does not change the outcome of a jump. The values: gravity 1300, jump velocity −380, first-jump velocity −220, max fall speed 620 (px/s units of the 360×640 design).

**Collision.**
- Hitboxes are generated from each sprite's alpha mask by `tools/gen-hitboxes.py`: the opaque shape is covered by a small set of rectangles (the player as well), written to `js/hitboxes.js`. This avoids the "I died without touching anything" problem of a full bounding box and keeps collision to a few integer comparisons.
- I checked fairness against the real pixels: over 108,000 player positions no death happened more than 2 px away from a visible touch. That check found the text obstacles too generous, and I tightened them.
- The collision loops are allocation-free (indexed loops, precomputed rectangles) to avoid garbage-collector pauses; this cut GC work by about 76% in a trace.

**Obstacle course.**
The 15 obstacles are placed by a fixed list in `js/config.js`. `tools/check-course.py` proves with the game's own physics that every gap can be passed, which is why the course is repeatable and fair. A random course would have needed the same proof at runtime.

**Get-ready and difficulty.**
The first tap triggers a short rewind of the gut so the player has a moment before the first obstacle. The scroll speed ramps gently from 100 to 130 px/s over the run.

**Audio.**
- Web Audio API: the context is created suspended and resumed synchronously inside the first user gesture (`pointerdown`, `pointerup`, `touchend`, `keydown`), as iOS requires. A silent buffer is played to unlock it, and `navigator.audioSession.type = 'playback'` is set so sound is not silenced by the ringer switch.
- The music loop window is calculated from the decoded buffer, so the loop does not leave an audible gap that a plain `loop = true` produced.
- One-shot sounds are tracked and stopped on reset, so replay never stacks voices.
- Mute is a master gain plus `localStorage` (wrapped, so private mode cannot break the ad).
- Sound effects are re-encoded at 96 kbps; the music (720 KB) is the largest single asset.

**Endcards.**
Entrance animations are built per card with GSAP and reverted through `gsap.matchMedia` when the user prefers reduced motion or when the game is reset, so replay starts from a clean state. Only the layer that moves is promoted to its own compositor layer.

**Mobile performance.**
Testing on a mid-range Android phone showed occasional dropped frames. The fixes were removing per-frame allocations, avoiding style recalculation of the whole world (one transform on the container), and cutting raster work on the endcards (about 92% less). The final run on the phone: 60 fps, worst frame 17 ms.

**Limits I accepted.**
Portrait phones are the target; landscape keeps the 9:16 shape with navy sides. I chose not to add a rotate hint or to stretch the texture, because the brief asks for a portrait phone ad.

---

## Variant B: Fireplace

**Three documents plus a preview.**
Each part is its own HTML file because they are delivered as three ads. They share one stylesheet and a few scripts only for convenience in this repository. `preview.html` embeds them in iframes with a 4 px gap, an empty middle for the website and a **Replay intro** button; the stage is scaled to fit the window.

**Layout.**
Every layer (`bg`, panel, copy, logo) is a full-size 640×1950 (skyscraper) or 2064×500 (top) image placed at 0,0 and shown at 50%, so they line up without per-layer offsets. Only the CTA needed a measured position (73.75, 837.5 px). I checked the result against `layout.png` by rendering the preview and diffing it; the debug overlay (`?debug=1`) lets anyone repeat the check.

**Background: pre-cut `bg.jpg` plus seam strips, not `bg-big.jpg` alone.**
The brief asks me to choose and explain. What I measured:
- Stitching the three pre-cut backgrounds shows a visible seam (the moss does not continue, especially between the top banner and the right skyscraper).
- `bg-big.jpg` is one continuous surface, but its products differ from the design (another pose and a blue artefact above the left box), and the product is baked into the image, so I could not use it for the skyscrapers without breaking the "pixel-accurate" requirement.
- So the pre-cut files provide the look of the design, and four thin strips (64×250 px) cut from `bg-big.jpg` are blended in at the seams with a CSS mask. At the joint both sides show the same pixels of the same source, so there is no visible step at the joint. The strips are about 83 KB in total (`tools/slice-seams.py`).
- The 4 px gap between the parts is an assumption from the width of `bg-big.jpg` (1680 = 320 + 4 + 1032 + 4 + 320).

**Why the seam strips do not zoom.**
A zoom around one shared point would keep the parts consistent, but scaling around a point outside a part exposes its edge, because the pre-cut images have no spare pixels. Each part therefore zooms its background around its own centre, and the strips stay still: the blend zone hides the difference, which stays under a pixel per second at 4% zoom over 30 s.

**Provided PNG-8 files had lost their transparency.**
`box.png`, `cta.png` and both skyscraper `hl.png` files had no transparency chunk, so they covered the background with solid black. `tools/fix-alpha.py` restores it: the black index becomes transparent, the copy gets an alpha ramp reconstructed from its palette, and the panel gets 0.8 opacity fitted to the design. Fixing the files, instead of using `mix-blend-mode`, avoids the extra compositing that blend modes need.

**Animation.**
- Intro of about 4.6 s: background zoom 1.1 → 1 with `power2.out`, logos with a small overshoot (`back.out`), the panel with `expo.out`, copy and CTA last, and the two skyscrapers offset by 0.12 s so they do not look mechanical.
- The product is part of the background image, so it cannot slide in alone. The zoom and fade of the background carry the intro.
- The top headline is three copies of one image, each clipped to a line (`clip-path: inset`), so the lines can build up one by one without extra assets.
- After the intro the background drifts to 1.04 and the CTA pulses softly; everything ends at 30 s. At that point the GSAP ticker is put to sleep, so the ad stops using animation frames.

**Starting three documents together.**
`preview.html` loads each part with `?sync=1`. A part decodes its images, tells its parent `fireplace:ready`, and starts when it receives `fireplace:start`, which the preview sends once all three are ready (with a 5 s safety start). Without `?sync=1`, as in production, a part just starts when it is ready. Messages are checked against the real parent window.

**Reduced motion and pause.**
With `prefers-reduced-motion: reduce` the timeline jumps to the end of the intro and the ticker sleeps. When the tab is hidden, the timeline pauses and resumes from the same point.

**Debug overlay.**
`?debug=1` draws `design/layout.png` at 50% opacity over each part. The scale (0.975) and offsets were fitted by minimising the difference with my own render, so it is good for checking alignment, but it is not an exact measurement of the original design file.

**Preview on small screens.**
The preview stage is a fixed 1680×975 and is scaled with `transform` to fit the window (never above 100%). The ads themselves keep their delivered sizes.

**Known gap in the supplied assets.**
`top/hl.png` does not contain the word "NATÜRLICH" that appears in `layout.png`, and lines two and three are arranged differently. I used the asset as supplied and noted it instead of redrawing the text.
