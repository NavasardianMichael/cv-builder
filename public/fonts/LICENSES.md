# CV fonts — provenance and licences

Twenty Armenian fonts from [fonter.am's popular list](https://fonter.am/en/fonts?sortby=popular)
(checked 2026-10-29). Every one is labelled `free` on its own fonter.am page, whose licence
line reads **"The font is free for commercial or personal use."**

Fonts in the top 20 that were **left out**: SHK Dzeragir (non-commercial), Arial (proprietary
Microsoft font, not needed), ArmAllegro (no licence stated). They were replaced by the next
free ones in popularity order: GAA Gayane, Braind Yerevan, Amar.

| Font | Author | Source |
|---|---|---|
| GHEA Grapalat | Էդիկ Ղաբուզյան | https://fonter.am/en/fonts/ghea-grapalat |
| Vrdznagir | Levon Chkolyan | https://fonter.am/en/fonts/vrdznagir |
| Arm Hmk's Bebas Neue | Hamik Mayilyan, Ryoichi Tsunekawa | https://fonter.am/en/fonts/arm-hmks-bebas-neue |
| Montserrat Armenian | Vahan Hovhannisyan | https://fonter.am/en/fonts/montserrat-armenian — SIL OFL 1.1, `montserrat-armenian/OFL.txt` |
| Tumanian's Handwriting | Ruben Tarumian | https://fonter.am/en/fonts/tumanian-dzeragir |
| Braind Amanor | Էդուարդ Քանքանյան | https://fonter.am/en/fonts/braind-amanor |
| Artsakh | Sargis Qalajyan, Narek Tsarukyan | https://fonter.am/en/fonts/artsakh |
| Davel Aghvor | Levon Chkolyan | https://fonter.am/en/fonts/davel-aghvor |
| Free Sans | GNU FreeFont contributors | https://fonter.am/en/fonts/free-sans — GPL with font exception |
| Poqrik dzeragir | poqrik.am | https://fonter.am/en/fonts/poqrik-dzeragir |
| Mardoto | Christian Robertson, Vahan Hovhannisyan | https://fonter.am/en/fonts/mardoto |
| Arian AMU | Ruben Tarumian | https://fonter.am/en/fonts/arian-amu — `arian-amu/LICENSE.txt` (must ship with copies) |
| Free Serif | GNU FreeFont contributors | https://fonter.am/en/fonts/free-serif — GPL with font exception |
| NASA Font | Narek Tsarukyan, Sargis Qalajyan | https://fonter.am/en/fonts/nasa-font |
| Arti | Համազգային հայ կրթական և մշակութային միություն | https://fonter.am/en/fonts/arti |
| 90 | Levon Chkolyan | https://fonter.am/en/fonts/90 |
| Reactive | Mariam Hovhannesyan | https://fonter.am/en/fonts/reactive |
| GAA Gayane | Gayane Andreasyan | https://fonter.am/en/fonts/gaa-gayane |
| Braind Yerevan | Էդուարդ Քանքանյան | https://fonter.am/en/fonts/braind-yerevan |
| Amar | VooDoo Marketing | https://fonter.am/en/fonts/amar |

## How the files were made

`scripts/fonts/build_fonts.py` converts each downloaded zip to woff2, subset to Latin,
Latin-1/Extended-A, Cyrillic, Armenian and punctuation, and writes `manifest.json`;
`pnpm fonts:css` turns the manifest into `cv-fonts.css`. Subsetting is a format conversion
the licences above permit; nothing was otherwise modified.

Embedding note: the font `90` declares bitmap-only embedding (OS/2 fsType 0x200), so Chrome
may draw it as outlines in a PDF rather than embedding it — it still looks the same, but text
in that font may not be selectable.
