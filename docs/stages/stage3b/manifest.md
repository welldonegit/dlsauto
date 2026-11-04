# Stage 3b — Головна (Home) — block manifest

Source of truth: `docs/design-export/DLSAuto-Головна-B.dc.html` and its `<dc-import>` component exports. Values below are measured from the export inline styles / `renderVals()`. Breakpoints: **desktop ≥1360 / laptop ≥1024 / tablet ≥768 / mobile <768**. Content band `max-width 1312px`; side gutter 64 / 32 / 16 (desktop/tablet/mobile). Base text `#1E232B`; light section bg `#F6F6F6`; dark `#12161C`; accent red `#E0001B`; brand-dark red `#C00017` / `#B80016`; easing `cubic-bezier(0.22,1,0.36,1)`. Fonts/colours are measured from the export, not the scale.

## Block order (Головна-B)
1. DLSHeaderHero (existing Header) — hosts the catalog **mega-menu** (variant TBD)
2. **heroB** — "Перший екран B" (inline section)
3. **DLSStatsNotch** → `stats` (exists, reuse)
4. **DLSBrandIndex-v4** → `modelsPicker` "Деталі для вашого авто" (marka→model picker)
5. **DLSCategoriesBento** → `categoriesBlock` variant a (bento)
6. **DLSNewArrivals** → `newArrivals` (tab carousel + ProductCard)
7. **DLSServicesWide** → `whatElseWeDo` (reuse About component, same content)
8. **DLSPickups** → `pickupsParts` (video banner + model-tab carousel)
9. **DLSSuvs** → `suvsParts` (video banner + model-tab carousel)
10. **DLSVideos** → `videoCheck`/videos (5-video hover-play carousel)
11. **DLSReviews** → `reviewsBlock` (exists, reuse)
12. **DLSFaq** → `faq` (6 Q/A, 2×3 multi-open accordion)
13. **DLSBenefits** → `benefits` (dark 3-card strip, live ship-day)
14. DLSFooter (existing) · DLSCart (stage 5) · DLSQuickView (modal)

Shared new components: **ProductCard** (keystone), **QuickView** modal, **MegaMenu** (in header), carousels (New Arrivals / Pickups / Suvs / Videos).

---

## 2. heroB — "Перший екран B"
Two columns (desktop/laptop `52fr 48fr`, colGap 64/48; tablet/mobile 1-col). Section bg `hero2.jpg` under `linear-gradient(90deg, rgba(18,22,28,.85), .65 @45%, .3 @100%)`. Pad desktop `64 64 128`, laptop `64 32 128`, tablet `64 32`, mobile `64 16`.
- **Left**: h1 (56/40/40/32, w600, lh1.1, ls-.02em, `#FCFCFD`, balance) = "Б/в запчастини, які підійдуть з першого разу"; lede p (18/…/16, rgba(252,252,253,.8), max 560); `<ul>` of **4 trust tiles** (icons tread/wrench/star/speed 20×20 `#FCFCFD`; tile bg rgba(252,252,253,.06), hover .1, blur(24px), radius 8, pad 12; value `<b>` 16/w600 `#FCFCFD`; caption 14 rgba(.6)). Mobile tiles 2×2 grid.
- **Right search card** (`#FCFCFD`, radius16, pad 32/24, shadow 0 12 32 rgba(18,22,28,.16)): h3 (24/20, w600 `#1E232B`) "Підібрати за моїм авто"; 3 progress tracks (h4, bg `#E6E9EE`, fill `#E0001B`, width 600ms); 3 field groups **Марка / Модель / Деталь** — brand `<select>` (logo 24×24 when set) → model `<select>` (disabled till brand) → part `<input>` + up-to-5 suggestion dropdown (stage-4 stub). Controls h56, radius8, border empty `#E6E9EE`/filled `#CDD2DA`/focus `#1E232B`, chevron 20 rotates 180° focus. Submit button h56 primary red (`.dls-fill` `#C00017`), label "Знайти деталі" → "Показати N деталей" when model chosen.
- Data: brands/models from Payload (getBrands/getModelsByBrand + partsCount); parts autocomplete = stage-4 stub.

## 3. stats (DLSStatsNotch) — EXISTS, reuse
4 count-up cards, alternating dark `#12161C` / red `#E0001B`, notch + plus-badge. Values: Досвід 4+ · Замовлення 5000+ · Марки **15** · Перевірка 100 %. numSize 76/40/64/40; IO count-up 1200ms; entrance stagger i*80; hover sway/shake keyframes. Verify current component matches on home (bg `#F6F6F6`, rhythm pad 96/64).

## 4. modelsPicker (DLSBrandIndex-v4) — "Деталі для вашого авто"
h2 (40/28/24) + h3 "Оберіть марку" + h3 "Моделі {brand}". **Brand chip tablist** (grid 8 cols wide / 4 mobile, gap16; chip h88/72, radius8, bg `#FCFCFD`, border `#E6E9EE`, 2 logos cross-fade color↔light, label 13/11 w500; active = dark `#1E232B` sliding indicator pill, morph transform/width/height 560ms EXPO). **Model grid** below (4/2/1 cols, min-height 200 = constant height on switch): up to 3 model cards (`#FCFCFD`, radius16, border `#E6E9EE`, h200, pad24; name 24/w600, years 14 `#4A5260`, partsCount 14 w500; circle-arrow 32 red) + "Усі моделі {brand}" dashed card only when >3 models. Card entrance choreography out→pre→in staggered on tab switch. Data: brands (16) with models [name,years,partsCount], logos color/ + tight-light/.

## 5. categoriesBlock (DLSCategoriesBento) variant a
h2 "Категорії запчастин". Bento grid: wide 4-col 320px rows, **lead card (engine) spans 2 cols**, 8 others 1×1; mobile/tablet 2-col, lead full-width (min-h 360/440), others min-h 280/320. Card `#FCFCFD`, radius16, inset-border `#E6E9EE`; photo object-contain scale 1.32→1.39 hover; footer h3 name 20/w600 + count 14 `#6B7380` + circle-arrow 56 red (glow + arrow translateX2). Then **dark promo panel** `#232830` spanning 2 cols: eyebrow "Часто шукають", 10 search chips (border `#4A5260`, h44, text 15 `#FCFCFD`, hover `#2A3039`), h3 "Усі категорії" + "1 200+ деталей" + circle-arrow. 9 categories from Payload (name, partsCount, slug, photo).

## 6. newArrivals (DLSNewArrivals)
Header: h2 "Нові надходження" + "Усі надходження" outline-red link (h48). **Category tablist** (7 tabs: Усі + 6 cats, h40, selected dark). **Horizontal snap carousel** (not grid): cards flex 0 0 **224px**, gap24, scroll-snap; cross-fade 200ms on tab switch; prev/next arrows (48, desktop/tablet only, disabled at edges). Optional seasonal decals per card index (pumpkin/hat/easter/… — season-gated). Car-fit filter via localStorage `dlsCar`. Data: 15 newest in_stock products (DEV_CONTEXT §5) + pinned; tabs by category.

## ProductCard (keystone shared) — all states
Width 224 (fixed), image **aspect 4/5** radius8. States:
- **in_stock**: price 20/w600 `#1E232B`; stock line (pulsing green dot `#1F8A4C` + "В наявності, {city}"); donor/model pill (brand logo 16 or ring) ; icon cart 40 red / full cart 48.
- **discount** (oldPrice): red "−N%" badge; old price strike + current `#E0001B`; **animated "running frame"** (conic-gradient border, dlsSpin 3.5s) when `promo && !sold`; grid z-index 2.
- **popular** (!promo,!sold): white "Популярне" badge.
- **sold**: img opacity .5; black "Продано" badge; price→"Деталі вже немає"; no cart; "Знайти схожу" outline link.
- **fits**: green "Підходить на ваше авто" pill replaces donor.
- Top-right: wishlist heart (pop anim, red when fav) + quick-view eye (32 round). Photo carousel (arrows+dots) hover-revealed. Hover: lift -4px, backing card, **specs panel** below (Характеристики dl, 4 rows). Badges top-left; cart ripple `#C00017`.
- Data per card: name, oem, price, oldPrice?, model/donor, brand(logo), status, discountPercent, featured, popular?, specs[], photos, pickupPoint(city).
- Open questions: `specs` field, `popular` source, running-frame=discount vs featured (see batch).

## 7. whatElseWeDo (DLSServicesWide) — reuse About component, same content
Wide gate photo (21/9 wide) + 2 cards (Ремонт у власному сервісі / Викуповуємо авто на розбірку) with arrow buttons. Already built — mount on home with same seed content.

## 8–9. pickupsParts / suvsParts (DLSPickups / DLSSuvs)
2-col grid (aside 328/272 + 1fr; mobile stacked). **Left aside**: 9/16 autoplay muted-loop `<video>` (pickup.mp4 / suv.mp4), radius16, bg `#2A303A`, gradient overlay, h2 (32/26/32 `#FCFCFD`) "Запчастини на пікапи"/"…позашляховики", subhead, CTA "Усі пікапи"/"Усі позашляховики". **Right**: model **tab rail** (pickups 7 / suvs 16 models, each tab = brand logo16 + label + count) → **snap carousel** of that model's ProductCards (224, gap24); cross-fade 200ms on tab; prev/next arrows (desktop/tablet). Data: models with bodyType pickup/suv + their in_stock products (§5). Models with 0 parts hidden.

## 10. videos (DLSVideos) — "Перевіряємо перед продажем"
h2 (40/28/24) + subhead "Знімаємо запуск двигунів…". **Carousel of 5 video tiles** (aspect 4/5, radius16, bg `#1E232B`, width 296/256/240, gap16): each `<video>` muted loop metadata (video1–5.mp4), bottom scrim, badge (category) top-left, duration chip top-right, center play button 56 (hover-to-play: play fades, duration shows). Arrows (desktop/tablet). Data: 5 videos + badge/duration/(optional product link) — editorial.

## 11. reviewsBlock (DLSReviews) — EXISTS, reuse
"Відгуки покупців", 2-col (3 at ≥1360), photo thumbnails, actions. Already built — mount on home.

## 12. faq (DLSFaq)
h2 "Часті питання" + subhead. **6 Q/A in 2 columns × 3** (flex 1 1 480). Card `#FFFFFF`, border `#E6E9EE`→open `#CDD2DA`, radius16, pad24/16. Toggle button: left "?"-in-circle icon (`#E0001B` on `#F3F5F7` 48/40) + question (18/16 w600, min-h 2.8em) + chevron-in-circle (32, rotates 180°). Answer panel grid-rows 0fr→1fr 280ms, answer 16 `#4A5260`. **Multi-open**. Data: 6 Q/A (fill [XX]% / [15:00] from settings).

## 13. benefits (DLSBenefits)
**Dark section `#12161C`**. 3 cards (wide 3-col, else stacked; gap 24/16), card bg `#F6F6F6`, radius16, border rgba(255,255,255,.1). Per card: eyebrow label (12 uppercase `#4A5260`) + badge pill; big value (56/40/48/36 w400 tabular) — **card 1 value = live Kyiv ship-day** (Сьогодні/Завтра/У понеділок per §5 rules); divider; `<dl>` 3 key/value pairs; bottom dark plate (`#1E232B`) with icon + note + green tag. Icons tread/card/wrench 20 `#CDD2DA`. IO reveal stagger 80ms. Content: Відправка / Оплата / Гарантія (export copy, richer than seed).

## Mega-menu (in header) + QuickView
- **MegaMenu**: production variant = **v3** (Марки / Моделі / Категорії) per owner — spec to extract from `DLSMegaMenu3.dc.html` when building the header. (v1 three-column spec kept here for reference: wide 3-col 25/30/45%, car banner, 9 cats + 15 brands + context panel, footer quick links; mobile right-slide drawer; Esc/outside-click/focus; dynamic import.)
- **QuickView** modal: desktop 1040 2-col (gallery 1/1 + 6 thumbs incl 1 video + details), tablet sticky action bar, mobile bottom-sheet. Gallery arrows, copy-OEM, stock/warranty/checked badges, price (32 w700) + −N%, add-to-cart + fav, condition, 6-row spec dl, service list, link to product page. Esc/scrim close, focus trap/restore. Dynamic import. Needs product `code`, `condition`, `specs`, optional product video.

## Behaviors from PROJECT_CONTEXT (not visible in export)
Dependent selects brand→model→part; constant block height on tab switch; dashed "Усі моделі" only when >3; plural деталь/деталі/деталей; "Підходить на ваше авто" by cookie car; wishlist/compare/viewed/cart in localStorage with header badges; "Сьогодні/Завтра" from `src/lib/rules`; newest-15 / bodyType selection from `src/lib/data`.

## Deferred (per prompt)
Search autocomplete (stage 4 — field + debounce, stub request). Cart / "В кошик" (stage 5 — button present, click → toast "Кошик — етап 5"). Catalog & product pages (3c — links are real URLs per §8).
