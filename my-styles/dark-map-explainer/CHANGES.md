# Changes — Dark Map Explainer 暗棕地图讲解 (blank page; technique base: satellite-briefing)

Why satellite-briefing: it is Lemo's style for *one real place told on its own ground* — map plates in world coordinates, one 2D camera, time rings in a locked frame, the range line, one finding per screen. Those are exactly this style's bones. What changes is the ground (drawn vector map on dark paper instead of photographs) and the voice (typed text instead of an analyst). dataviz is borrowed for its rule that every mark is a real number on a real geometry, and for the big-number card.
Next closest: dataviz (map charts, but no paper ground or typed narration), visual-investigation (one clock, but evidence frames, not a map).

| Section | Base (satellite-briefing) | Now | Why |
|---|---|---|---|
| §1 Essence | real satellite imagery graded grey, white hairlines, analyst voice | drawn 2D vector map on dark-brown paper; the story is typed in heavy serif at the top left; no voice | the user's reference (来龙去脉 account) and their channel; code draws everything |
| §2 Materials | georeferenced raster plates in a WebGL shader, globe, claim layer | SVG paths from OSM / Natural Earth in one projection, paper grain overlay + vignette, glow lines; no rasters, no 3D | faster, clearer, every element editable in code; 3D white-model was rejected (slow, dizzy) |
| §3 Colour | grey 3–65 %, white = measured, one amber accent | dark-brown land one step lighter than a deep teal sea, cream type, two emphasis inks (blue = place/evidence, red = disaster/number), cyan rivers, warm-gold points | user: maps must not be too dark; the reference's two-ink emphasis |
| §4 Type | condensed grotesk reading + mono instruments + transcript strip | top-left heavy CJK serif typed glyph by glyph at reading speed (≤ 5 lines), underlined emphasis words, small sans place labels, no subtitles strip | the text *is* the narration |
| §5 Motion | camera never stops, creep in holds | camera holds still between moves; things change on the map instead (lines draw, rings advance, cards land) | user gets dizzy |
| §6 Camera | orbit, dive, whip pan, climb to orbit | 2D push / pull / slide only, one move per beat, 3.5–5 s, peak zoom ≤ 40 %/s, pan ≤ ~170 px/s, zoom about a fixed point, no cuts, no orbit, no whip | user gets dizzy; checked by script |
| §7 Sound | telemetry pings, timpani, analyst voice, ducking | no voice by default; the user's own score at constant level, no ducking, looped + faded; quiet code-synth SFX (typing ticks, soft bells, whooshes); −14 LUFS | user's standing audio rules |
| §8 Native moves | map vs photograph, time rings, range line, dive/climb, colour returns | typed telling, coastline tree rings, glow-line drawing, bottom timeline with cursor, big-number card with leader, vertical scroll quote with rays, range line kept, "示意" corner note | the reference's signatures, mapped to code components |
| §9 Pitfalls | imagery licences, float precision | facts verified or marked 示意; no "代码生成"/watermark in picture; font loading; heavy SVG renders hang → chunked renders | lessons from the Yancheng film |
| §10 Engine | Lemo core/render + WebGL plate shader | Remotion + SVG kit /workspace/templates/dark-map-explainer; demo source in demo/ | proven pipeline |
| Size | 1920×1080 | 1920×1080 | unchanged (landscape) |
