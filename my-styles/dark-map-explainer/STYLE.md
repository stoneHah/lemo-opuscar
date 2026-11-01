# Dark Map Explainer 暗棕地图讲解 — Style Prompt

Made from a blank page; techniques from Satellite Briefing (satellite-briefing) in Lemo-Opuscar.

> The history and geography of one real place, told on a dark-brown paper map drawn entirely in code. There is no voice: the story is typed, glyph by glyph, in a heavy Chinese serif at the top left, and the map answers it — a river glows as it is drawn, a coastline moves outward like tree rings, a number lands on a card with a leader line to the spot it belongs to. Camera and animation are designed freely, to a professional standard; the only rule is: don't make anyone dizzy.
> Reference (grammar only): the Douyin account 来龙去脉's 2D map explainers. Copy none of its layouts, maps or text; never name it in the film.

**Build note — read first.** This style does **not** use Lemo's `core/render`. Films are built in Remotion + SVG (TypeScript) on the kit **`/workspace/templates/dark-map-explainer`** (tokens + optional components + render/audio/QA scripts; its `README.md` has the commands). Copy the kit per film and write the film's own composition. See §10. The style fixes only what is below; everything else is the film's own (§11).

## 1. Essence, and what it is not

- **A real place on a drawn map.** Real geometry (OSM, Natural Earth, published maps) in one projection, drawn as flat vector on a dark paper ground. What can't be known exactly (old coastlines, routes, people) is drawn and marked 示意.
- **The words are the narration.** One short beat of text at a time, typed at reading speed at the top left; the map shows what the sentence says while you read it.
- **Time is drawn on the ground**: boundaries advance, lines draw, places light up — the map acts the sentence out.
- **Camera and animation are free.** Design them as a professional motion designer would; the only rule is **don't make anyone dizzy**.
- **Anti-references**: the Yancheng (盐城) and Shanghai (上海) films are slow and flat (camera barely moves, boundaries only change colour, text and numbers only fade in). Don't copy their pacing or animation. The reference worth studying is 来龙去脉's Haikou (海口) film, for its richness.
- **Facts are real.** Dates, numbers, quotes are verified; a quote shows its source on screen.

Not Satellite Briefing (no photographs, no globe), not Data Storytelling (a map with a story, not a chart with axes), not a slideshow (no title cards, no chapter headers, no hard cuts), not a talking-head or voice-over film, not a 3D white-model city.

## 2. Materials & rendering

- **Map**: SVG paths from GeoJSON through one projection (`makeProjection(lon0, lat0, k)`), in a world layer under a 2D camera (centre + zoom). Sea as a near→far gradient, land as flat fills, focus area one step lighter. Coast a clear light line; admin borders thin and dim; rivers as layered glow lines.
- **Paper**: a full-frame grain texture in `overlay` blend (~40 %) plus a soft vignette over everything, type included.
- **Glow**: lines and points glow with 2–3 stacked strokes of falling opacity (no blur filters on large areas).
- **Cards and objects**: dark translucent cards with a thin light rim; small flat silhouette illustrations (faceless people, animals, turbines) only when the sentence needs them, always simple and marked 示意 if invented.
- **No bitmaps** of the place (no satellite, no photos, no generated images). No 3D.
- **The picture never says how it was made**: no "代码生成", no account watermark, no LemoLab credit. The only permanent corner text is the small 示意 note.

## 3. Colour logic

- **Ground**: dark-brown land (≈ #37312A, focus area ≈ #433B2F) one step **lighter** than a deep teal sea (#173A3A near → #0D1A1D far). Never pure black; the coast must read at a glance.
- **Type**: warm cream (#EFEADB) on the dark ground.
- **Two emphasis inks with fixed meanings**: blue (#8CCBD2) for places, names and evidence; red (#CE5E54) for disasters, turning points and key numbers. At most two emphasised phrases per beat.
- **Map accents**: rivers and water cyan (#58C3C5, bright core); points and dikes warm gold (#CCBA92 / #F1E2B8 core); big numbers on cards light blue (#86DDFD).
- Exact values live in the kit's `src/tokens.ts`; a film may shift them as long as the logic holds (brown land above teal sea, cream type, blue = place, red = turn).

## 4. Type & subtitles

- **Narration text**: top left (x ≈ 110, y ≈ 72 at 1080p), heavy CJK serif (Noto Serif SC Black, OFL), ≈ 70 px, line height ≈ 110 px, short lines broken by sense, **at most 5 lines**; the whole beat clears (≈ 0.35 s fade) before the next.
- **Typing**: each glyph lands at reading speed (≈ 0.13 s per character), arriving larger, translucent and slightly blurred, then settling to cream. Emphasised words get a hand-drawn underline in their ink after they finish typing. Hold after typing ≈ 1.6–3 s + a little per character.
- **Labels**: small sans (Noto Sans CJK SC, 21–26 px) for place names, with a dark shadow; never below 20 px.
- **Cards**: big serif number + small unit, a one-line explanation, a small source line.
- **No** chapter titles at the top left, no title card, no subtitle strip (the typed text is the subtitle), no rhetorical-question or 「你敢相信吗」 openings; the topic is clear within 3 seconds.

## 5. Motion quality

- Free, designed to a professional standard; the only rule is **don't make anyone dizzy**. Camera, map animation, type and cards may move together and overlap.
- Things can arrive by being made (a line drawing itself, a boundary advancing, a card landing with its leader); these are examples, not a checklist.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Push toward a point | singling out | a town, a dike, a battlefield |
| Pull back | context, consequence | the whole region; a river from its source |
| Slide at one scale | following a line | a coast, a road, a front |
| Locked frame | time running in one place | rings advancing, a line drawing, cards |

- The table is a vocabulary, not a rulebook. Camera and animation are free, designed to a professional standard; the only rule is **don't make anyone dizzy**.
- The kit's `scripts/camrate.ts` is an optional reference tool that prints each move's zoom and pan speed; it is not an acceptance gate.

## 7. Sound palette

- **No voice by default** (the text is the narration). If a film needs one: Gemini TTS at normal speed, never sped up.
- **Music**: the user's own score (default their "老配乐"), constant level for the whole film, no ducking, looped with crossfades and faded out at the end. Not shipped in any repo.
- **SFX, synthesised in code, quiet**: soft typing ticks per glyph, a faint whoosh for underlines and camera moves, soft bell pairs when a card lands, low pulses for rings, a riser for a river drawing.
- **Master**: −14 LUFS integrated, true peak ≤ −1.2 dBTP, AAC 256k.

## 8. Native moves

- **Typed telling**: the beat types itself at the top left while the map acts it out.
- **Tree rings**: dated boundaries (coast, city wall, lake, desert edge) advance one after another in a locked frame, each leaving a thin ring with its year. *Fits:* coasts that grew, lakes that shrank, cities that sprawled.
- **The glow line**: a river, dike, road or route draws itself from head to tail in layered light. *Fits:* an old river course, a wall, a migration.
- **The timeline**: a thin axis at the bottom with marked years and a glowing cursor that travels with the story; red dots for disasters.
- **Big-number card with a leader** from the place it describes.
- **The scroll**: a vertical classical quote unrolls sideways with soft rays behind it and its source under it — only for verified original text.
- **The range line**: a measured line between two points with its reading (e.g. old dike → today's coast, ≈ 50 km).
- **Return to the opening frame** is available, not required.

## 9. Pitfalls of the medium

- **Facts**: years, numbers, names and quotes only from checked sources; a quote that can't be checked is not put in a scroll. Historic lines, routes and people are 示意, said in the corner note.
- **Never** write "代码生成" or put a watermark in the picture; the "made with code" positioning lives in the title, description and tags only.
- **Dizziness**: the user is sensitive; whatever the camera does, it must not make anyone dizzy. (A 3D white-model camera was tried once and dropped.)
- **Flatness**: a camera that barely moves, boundaries that only change colour and numbers that only fade in read as dull (the Yancheng and Shanghai films). Study the Haikou reference for richness.
- **Too dark**: check a frame on a phone; the coast and land must separate from the sea.
- **Text density**: more than 5 lines or more than two emphasis words per beat is unreadable on a phone; split the beat.
- **Overlaps**: cards can cover labels or the text block; check every card's frame (the Yancheng film shipped with a 2019 card half-covering a label at 113 s).
- **Fonts**: load the serif with `FontFace` + `delayRender`, or the first frames render in a fallback font.
- **Heavy SVG** (big GeoJSON, many glow layers) makes Remotion chunks hang: simplify geometry at prep time, render in 150-frame chunks with timeout + retry (`render_chunks.sh`), under nohup.
- **Map data licences**: OSM is ODbL (credit "© OpenStreetMap contributors"), Natural Earth public domain; list both in `CREDITS`.

## 10. Engine

**Remotion 4 + SVG, TypeScript — not Lemo's `core/render`.** Kit: `/workspace/templates/dark-map-explainer` (`README.md` = commands and the user's hard rules).
- `src/tokens.ts`: colours, fonts, type metrics, safe area, grain, audio targets.
- `src/lib/`: `geo.ts` (projection, GeoJSON → path, partial lines), `camera.ts` (camera, zoom about a fixed point, optional rate measurement), `time.ts` (easing, ramps), `fonts.ts`.
- `src/components/` (all optional): `MapStage`, `MapBase`, `PaperGrain`, `TypeParagraph` + `planParagraphs`, `InfoCard` + `BigNumber`, `Scroll`, `TimelineBar`, `GlowLine`, `Ruler`, `RingAdvance`, `GlowPoint` / `MapLabel`, `ParticleFlow`, `CornerNote`, `CoverStill`.
- `scripts/`: `render_chunks.sh`, `finish.sh`, `camrate.ts` (optional reference), `stills.mjs`, `contact_sheet.py`, `covers.sh`, `events.ts`; `audio/sfx.py`, `audio/master.py`.
- Example film: [`demo/`](demo/) (see [DEMO.md](DEMO.md)) — `src/Main.tsx` (whole film), `src/Text.tsx` (typing), `src/geo.ts` (projection, rings, camera moves), `src/Art.tsx` (silhouettes), `scripts/make_audio.py`.
- Technique base for map-in-world-coordinates, rings and range line: `$LIB/styles/satellite-briefing/STYLE.md`.
- Workflow: Grok skill `dark-map-explainer`. Render 1080p directly (a low-res preview is optional) and self-check a keyframe sheet. Deliver the mp4 plus separately composed 3:4 and 4:3 covers.

## 11. Variation space

Free in every film, and expected to be re-invented: the place and topic, story and structure, number and length of beats, total length, opening and ending, which native moves appear (any can be left out), new components (sections, split comparisons, illustrations — any 2D technique), camera and animation (free; just don't make anyone dizzy), card and scroll designs, SFX, the size (a vertical 1080×1920 cut is fine with the text block re-laid). Fixed: the §3 colour logic, the typed top-left serif telling, no voice by default with the user's score at constant level, verified facts with 示意 marked, no "代码生成" or watermark in the picture.

---

How the demo was made: [DEMO.md](DEMO.md). Read it after your own treatment exists; don't reuse its story, order or shots.
