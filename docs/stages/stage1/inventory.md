# Stage 1 — інвентар значень експорту

Згенеровано `scripts/design-audit.ts`. Джерело: `docs/design-export/*.dc.html` (64 файлів).

Пас 1 (декларації) — інлайн `style`, `style-hover`, `style-focus` та `<style>`; добре категоризовано за властивістю.
Пас 2 (обчислювані) — px/кольори/тривалості всередині `<script>`-логіки, де лежать значення під брейкпоінти (side/block padding, 1312px контейнер тощо); категоризація наближена.

Дробові (напр. 13.5px) і непарні (7, 15, 23) значення позначені в таблиці розходжень в AUDIT.md.


## Відступи (padding / margin / gap)

Унікальних значень: 38.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `-168px` | 3 | 1 | DLSRecommend |
| `-32px` | 2 | 2 | DLSHeaderHero, DLSStatsNotch |
| `-28px` | 4 | 2 | DLSServicesVideo, DLSVideos |
| `-24px` | 9 | 4 | DLSBrandIndex-v3, DLSProduct, DLSProduct-v1, DLSRecommend |
| `-20px` | 6 | 3 | DLSProduct, DLSProduct-v1, DLSQuickView |
| `-16px` | 7 | 5 | DLSBrandIndex-v3, DLSHeaderHero, DLSPickups, DLSProductCard, DLSSuvs |
| `-12px` | 3 | 3 | DLSAuto-Головна-B, DLSMegaMenu, DLSStatsNotch |
| `-10px` | 8 | 4 | DLSAuto-Головна-B, DLSCatalog, DLSFooter, DLSSearch |
| `-8px` | 5 | 3 | DLSBrandIndex-v2, DLSCategoriesNotch, DLSCheckout |
| `-4px` | 3 | 2 | DLSBrandIndex, DLSProduct |
| `-3px` | 1 | 1 | DLSProduct |
| `-1px` | 3 | 3 | DLSCompare, DLSDonors, DLSStatsNotch |
| `1px` | 7 | 2 | DLSProduct, DLSProduct-v1 |
| `2px` | 37 | 18 | DLSAuto-Головна-B, DLSCart, DLSCatalog, DLSCheckout, DLSCompare, DLSFavorites … +12 |
| `3px` | 2 | 2 | DLSServicesVideo, DLSVideos |
| `4px` | 183 | 35 | DLSAuto-Home, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2 … +29 |
| `5px` | 4 | 1 | DLSHeaderHero |
| `6px` | 75 | 21 | DLSAuto-Контакти, DLSBenefits, DLSBrandIndex-v4, DLSCart, DLSCatalog, DLSCheckout … +15 |
| `8px` | 343 | 44 | DLSAuto-404, DLSAuto-Home, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v3 … +38 |
| `9px` | 3 | 1 | DLSAuto-Контакти |
| `10px` | 37 | 8 | DLSBenefits, DLSBrandIndex, DLSCatalog, DLSCheckout, DLSProduct, DLSProduct-v1 … +2 |
| `12px` | 247 | 40 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію-v1, DLSBenefits, DLSBrandIndex, DLSBrandIndex-v3 … +34 |
| `14px` | 7 | 3 | DLSAuto-Контакти, DLSCheckout, DLSProduct-v1 |
| `16px` | 333 | 46 | DLSAuto-404, DLSAuto-Home, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSBenefits … +40 |
| `18px` | 5 | 1 | DLSCheckout |
| `20px` | 11 | 8 | DLSCatalog, DLSCategoryCard, DLSMegaMenu2, DLSMegaMenu3, DLSProduct, DLSProduct-v1 … +2 |
| `22px` | 9 | 4 | DLSAuto-Контакти, DLSHeaderHero, DLSReviews, DLSSearch |
| `24px` | 175 | 47 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v2, DLSAuto-Про-компанію-v3 … +41 |
| `26px` | 1 | 1 | DLSCheckout |
| `28px` | 5 | 3 | DLSBrandIndex-v4, DLSMegaMenu, DLSReviews |
| `32px` | 60 | 28 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію-v2, DLSBrandIndex, DLSBrandIndex-v2 … +22 |
| `36px` | 2 | 2 | DLSCatalog, DLSSearch |
| `40px` | 12 | 7 | DLSCatalog, DLSCheckout, DLSPickups, DLSProduct, DLSProduct-v1, DLSSearch … +1 |
| `48px` | 32 | 12 | DLSBrandIndex-v4, DLSCart-Стани, DLSCatalog, DLSCheckout, DLSCompare-Стани, DLSDonors … +6 |
| `64px` | 13 | 6 | DLSAuto-Home, DLSCatalog, DLSHeaderHero, DLSMegaMenu-Стани, DLSProductCard-Ряд, DLSReviews |
| `96px` | 3 | 3 | DLSCompare, DLSHeaderHero, DLSPickups-Стан-2 |
| `168px` | 5 | 3 | DLSPickups, DLSRecommend, DLSSuvs |
| `200px` | 1 | 1 | DLSProductCard-Ряд |

## Розміри (width / height / min / max / flex-basis)

Унікальних значень: 57.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `1px` | 31 | 16 | DLSAuto-404, DLSAuto-Контакти, DLSBenefits, DLSBrandIndex-v2, DLSBrandIndex-v3, DLSCheckout … +10 |
| `2px` | 2 | 2 | DLSServices, DLSServicesVideo |
| `4px` | 8 | 4 | DLSAuto-Головна-B, DLSCatalog, DLSQuickView, DLSSearch |
| `6px` | 7 | 2 | DLSAuto-Контакти, DLSCart |
| `8px` | 22 | 9 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSCart, DLSCheckout, DLSCompare, DLSProduct … +3 |
| `11px` | 4 | 1 | DLSPartPath |
| `14px` | 3 | 2 | DLSProduct-v1, DLSQuickView |
| `16px` | 38 | 16 | DLSAuto-404, DLSCategoriesNotch, DLSCheckout, DLSCompare, DLSDonorChips, DLSFavorites … +10 |
| `17px` | 2 | 1 | DLSCategoriesNotch |
| `18px` | 8 | 1 | DLSHeaderHero |
| `20px` | 71 | 11 | DLSBrandIndex-v4, DLSCatalog, DLSCheckout, DLSCompare, DLSFavorites, DLSHeaderHero … +5 |
| `22px` | 2 | 2 | DLSProduct, DLSProductCard |
| `24px` | 43 | 9 | DLSAuto-Контакти, DLSCatalog, DLSCompare, DLSHeaderHero, DLSProduct, DLSProduct-v1 … +3 |
| `28px` | 15 | 5 | DLSMegaMenu, DLSMegaMenu3, DLSProduct, DLSProduct-v1, DLSQuickView |
| `29px` | 4 | 1 | DLSBrandIndex |
| `32px` | 61 | 16 | DLSAuto-Контакти, DLSBrandIndex, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSBrandTabs, DLSCatalog … +10 |
| `36px` | 13 | 3 | DLSMegaMenu3, DLSPartPath, DLSProduct-v1 |
| `40px` | 102 | 22 | DLSBrandIndex, DLSBrandIndex-v3, DLSBrandTabs, DLSCatalog, DLSCategoriesList, DLSCompare … +16 |
| `44px` | 77 | 17 | DLSBrandIndex, DLSCatalog, DLSCategoriesBento, DLSCompare, DLSFavorites, DLSFooter … +11 |
| `48px` | 166 | 35 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3 … +29 |
| `52px` | 2 | 1 | DLSAuto-Контакти |
| `56px` | 76 | 25 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v3, DLSBrandIndex … +19 |
| `64px` | 15 | 8 | DLSCheckout, DLSHeaderHero, DLSMegaMenu, DLSMegaMenu2, DLSMegaMenu3, DLSQuickView … +2 |
| `72px` | 11 | 6 | DLSAuto-Контакти, DLSBrandTabs, DLSProduct, DLSProduct-v1, DLSReviews, DLSSearch |
| `76px` | 2 | 2 | DLSMegaMenu3, DLSProduct |
| `80px` | 2 | 1 | DLSHeaderHero |
| `96px` | 6 | 3 | DLSBrandIndex-v3, DLSCart, DLSHeaderHero |
| `144px` | 1 | 1 | DLSReviews |
| `170px` | 1 | 1 | DLSBrandIndex-v3 |
| `224px` | 8 | 6 | DLSNewArrivals, DLSPickups, DLSProductCard-Ряд, DLSRecent, DLSRecommend, DLSSuvs |
| `240px` | 3 | 2 | DLSHeaderHero, DLSSearch |
| `280px` | 3 | 3 | DLSCheckout, DLSHeaderHero, DLSStatsNotch |
| `320px` | 6 | 6 | DLSCompare, DLSHeaderHero, DLSProduct, DLSProduct-v1, DLSReviews, DLSServices |
| `360px` | 4 | 4 | DLSAuto-Контакти, DLSHeaderHero, DLSReviews, DLSSearch |
| `390px` | 7 | 2 | DLSAuto-Home, DLSMegaMenu-Стани |
| `400px` | 1 | 1 | DLSStatsSteps |
| `420px` | 2 | 2 | DLSCompare, DLSFavorites |
| `440px` | 1 | 1 | DLSPartPath |
| `480px` | 4 | 4 | DLSCart, DLSFavorites, DLSFooter, DLSHeaderHero |
| `520px` | 2 | 2 | DLSAuto-404, DLSCatalog |
| `560px` | 6 | 6 | DLSAuto-Головна-B, DLSBrandTabs, DLSDonorChips, DLSHeaderHero, DLSPartPath, DLSVisitCta-v1 |
| `640px` | 11 | 9 | DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2, DLSAuto-Про-компанію-v3, DLSDonors, DLSFaq, DLSHeaderHero … +3 |
| `704px` | 1 | 1 | DLSHeaderHero |
| `760px` | 4 | 2 | DLSAuto-Політика-конфіденційності, DLSCart-Стани |
| `768px` | 4 | 2 | DLSAuto-Home, DLSMegaMenu-Стани |
| `814px` | 3 | 1 | DLSMegaMenu-Стани |
| `844px` | 5 | 1 | DLSMegaMenu-Стани |
| `878px` | 1 | 1 | DLSMegaMenu-Стани |
| `900px` | 3 | 1 | DLSCart-Стани |
| `960px` | 1 | 1 | DLSHeaderHero |
| `1024px` | 5 | 1 | DLSMegaMenu-Стани |
| `1088px` | 1 | 1 | DLSHeaderHero |
| `1200px` | 3 | 3 | DLSProduct, DLSProduct-v1, DLSServicesVideo |
| `1264px` | 1 | 1 | DLSProduct |
| `1312px` | 54 | 46 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2, DLSAuto-Про-компанію-v3, DLSBrandIndex, DLSBrandIndex-v2 … +40 |
| `1440px` | 11 | 3 | DLSAuto-Home, DLSCompare-Стани, DLSMegaMenu-Стани |
| `3136px` | 1 | 1 | DLSAuto-Home |

## Висоти контролів (height на button/input/select/form/a)

Унікальних значень: 11.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `48px` | 100 | 31 | DLSAuto-Контакти, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3, DLSBrandTabs, DLSCart … +25 |
| `40px` | 48 | 18 | DLSBrandIndex, DLSBrandTabs, DLSCatalog, DLSDonorChips, DLSHeaderHero, DLSMegaMenu … +12 |
| `56px` | 42 | 20 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію-v3, DLSBrandIndex-v3, DLSCart … +14 |
| `44px` | 36 | 11 | DLSBrandIndex, DLSCatalog, DLSFooter, DLSHeaderHero, DLSMegaMenu, DLSMegaMenu2 … +5 |
| `32px` | 16 | 7 | DLSCatalog, DLSCompare, DLSFavorites, DLSHeaderHero, DLSMegaMenu3, DLSProductCard … +1 |
| `24px` | 12 | 6 | DLSAuto-Контакти, DLSCatalog, DLSHeaderHero, DLSReviews, DLSSearch, DLSServicesVideo |
| `28px` | 8 | 4 | DLSMegaMenu3, DLSProduct, DLSProduct-v1, DLSQuickView |
| `1px` | 5 | 4 | DLSAuto-Контакти, DLSCheckout, DLSReviews, DLSSearch |
| `36px` | 3 | 2 | DLSMegaMenu3, DLSPartPath |
| `64px` | 2 | 2 | DLSQuickView, DLSReviews |
| `72px` | 2 | 2 | DLSProduct, DLSProduct-v1 |

## Радіуси (border-radius)

Унікальних значень: 11.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `1px` | 1 | 1 | DLSServicesVideo |
| `4px` | 20 | 7 | DLSAuto-Home, DLSCatalog, DLSCategoriesBento, DLSCheckout, DLSHeaderHero, DLSSearch … +1 |
| `6px` | 3 | 2 | DLSProduct, DLSProduct-v1 |
| `7px` | 1 | 1 | DLSBrandIndex-v4 |
| `8px` | 345 | 47 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v3, DLSBenefits … +41 |
| `9px` | 4 | 1 | DLSHeaderHero |
| `10px` | 4 | 3 | DLSCatalog, DLSHeaderHero, DLSSearch |
| `12px` | 10 | 6 | DLSCategoriesList, DLSCompare, DLSMegaMenu3, DLSProduct, DLSProduct-v1, DLSServicesVideo |
| `15px` | 1 | 1 | DLSCategories-v2 |
| `16px` | 101 | 44 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію-v2, DLSBenefits, DLSBrandIndex-v2, DLSBrandIndex-v3 … +38 |
| `999px` | 9 | 4 | DLSCart, DLSCatalog, DLSQuickView, DLSSearch |

## Товщина рамок / outline

Унікальних значень: 4.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `1px` | 229 | 41 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSBenefits, DLSBrandIndex, DLSBrandIndex-v2 … +35 |
| `1.5px` | 8 | 4 | DLSAuto-Головна-B, DLSCatalog, DLSProductCard, DLSSearch |
| `2px` | 190 | 38 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3 … +32 |
| `3px` | 1 | 1 | DLSAuto-Контакти |

## Іконки (width/height на <svg>/<img>)

Унікальних значень: 24.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `2px` | 1 | 1 | DLSAuto-404 |
| `10px` | 6 | 3 | DLSAuto-Контакти, DLSReviews, DLSSearch |
| `14px` | 54 | 9 | DLSCatalog, DLSCheckout, DLSMegaMenu3, DLSProduct, DLSProduct-v1, DLSProductCard … +3 |
| `16px` | 102 | 18 | DLSBrandIndex, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCart, DLSCategoriesList, DLSCategoryCard … +12 |
| `18px` | 90 | 12 | DLSCatalog, DLSFavorites, DLSHeaderHero, DLSMegaMenu, DLSMegaMenu2, DLSMegaMenu3 … +6 |
| `20px` | 192 | 27 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v3, DLSBenefits, DLSCart, DLSCheckout, DLSCompare … +21 |
| `22px` | 28 | 5 | DLSHeaderHero, DLSMegaMenu3, DLSProduct, DLSProduct-v1, DLSQuickView |
| `24px` | 66 | 17 | DLSAuto-Головна-B, DLSCategoriesBento, DLSCompare, DLSFaq, DLSFooter, DLSHeaderHero … +11 |
| `26px` | 6 | 2 | DLSAuto-Контакти, DLSBrandIndex |
| `28px` | 12 | 3 | DLSAuto-Контакти, DLSSearch, DLSServicesVideo |
| `32px` | 2 | 1 | DLSBrandTabs |
| `36px` | 2 | 1 | DLSReviews |
| `48px` | 10 | 5 | DLSCart, DLSCatalog, DLSCompare, DLSDonors, DLSFavorites |
| `56px` | 9 | 5 | DLSAuto-Контакти, DLSHeaderHero, DLSNewArrivals, DLSReviews, DLSSearch |
| `59px` | 1 | 1 | DLSNewArrivals |
| `60px` | 2 | 1 | DLSNewArrivals |
| `61px` | 1 | 1 | DLSNewArrivals |
| `63px` | 1 | 1 | DLSNewArrivals |
| `64px` | 1 | 1 | DLSNewArrivals |
| `66px` | 2 | 1 | DLSNewArrivals |
| `76px` | 1 | 1 | DLSNewArrivals |
| `80px` | 2 | 1 | DLSNewArrivals |
| `100px` | 1 | 1 | DLSProduct |
| `112px` | 1 | 1 | DLSProduct |

## Товщина штриха іконок (stroke-width)

Унікальних значень: 6.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `2` | 163 | 39 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Про-компанію-v3, DLSBrandIndex, DLSBrandIndex-v3, DLSBrandIndex-v4 … +33 |
| `1.5` | 64 | 23 | DLSAuto-Головна-B, DLSBenefits, DLSBrandIndex, DLSBrandTabs, DLSCart, DLSCheckout … +17 |
| `1.75` | 17 | 8 | DLSAuto-Контакти, DLSCategoriesList, DLSMegaMenu3, DLSProduct, DLSProduct-v1, DLSQuickView … +2 |
| `2.5` | 13 | 5 | DLSHeaderHero, DLSMegaMenu, DLSMegaMenu3, DLSProduct, DLSProduct-v1 |
| `3` | 6 | 3 | DLSCatalog, DLSCheckout, DLSSearch |
| `1.25` | 3 | 3 | DLSCatalog, DLSFavorites, DLSReviews |

## Позиціонування (top/left/right/bottom/inset)

Унікальних значень: 25.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `-40px` | 1 | 1 | DLSProduct |
| `-32px` | 1 | 1 | DLSStatsNotch |
| `-28px` | 1 | 1 | DLSProduct |
| `-22px` | 1 | 1 | DLSNewArrivals |
| `-20px` | 6 | 1 | DLSNewArrivals |
| `-18px` | 4 | 1 | DLSNewArrivals |
| `-16px` | 4 | 2 | DLSNewArrivals, DLSProductCard |
| `-4px` | 8 | 1 | DLSHeaderHero |
| `1px` | 1 | 1 | DLSCategories-v2 |
| `2px` | 6 | 3 | DLSCatalog, DLSCompare, DLSSearch |
| `4px` | 7 | 4 | DLSAuto-Контакти, DLSReviews, DLSSearch, DLSStatsNotch |
| `5px` | 5 | 1 | DLSPartPath |
| `8px` | 18 | 6 | DLSCompare, DLSFavorites, DLSHeaderHero, DLSProduct, DLSProduct-v1, DLSProductCard |
| `10px` | 4 | 2 | DLSCatalog, DLSSearch |
| `12px` | 41 | 9 | DLSCatalog, DLSCheckout, DLSPickups, DLSProduct, DLSProduct-v1, DLSQuickView … +3 |
| `14px` | 1 | 1 | DLSCheckout |
| `15px` | 8 | 4 | DLSCatalog, DLSProduct, DLSProduct-v1, DLSSearch |
| `16px` | 53 | 10 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSCheckout, DLSHeaderHero, DLSProduct, DLSProduct-v1 … +4 |
| `17px` | 3 | 1 | DLSCheckout |
| `18px` | 3 | 1 | DLSPartPath |
| `24px` | 10 | 6 | DLSCheckout, DLSHeaderHero, DLSProduct, DLSProduct-v1, DLSSuvs, DLSTeam |
| `32px` | 4 | 2 | DLSHeaderHero, DLSServices |
| `52px` | 1 | 1 | DLSCheckout |
| `60px` | 3 | 1 | DLSCheckout |
| `64px` | 5 | 3 | DLSAuto-404, DLSAuto-Головна-B, DLSHeaderHero |

## Translate (у transform)

Унікальних значень: 10.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `-8px` | 4 | 1 | DLSStatsNotch |
| `-6px` | 3 | 3 | DLSBrandIndex-v4, DLSPickups, DLSSuvs |
| `-3px` | 3 | 1 | DLSAuto-Контакти |
| `-2px` | 1 | 1 | DLSStatsNotch |
| `-1px` | 1 | 1 | DLSStatsNotch |
| `1px` | 1 | 1 | DLSStatsNotch |
| `2px` | 1 | 1 | DLSStatsNotch |
| `6px` | 3 | 3 | DLSBrandIndex-v4, DLSPickups, DLSSuvs |
| `8px` | 1 | 1 | DLSHeaderHero |
| `9px` | 3 | 1 | DLSAuto-Контакти |

## Розмір шрифту (font-size)

Унікальних значень: 18.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `11px` | 7 | 4 | DLSHeaderHero, DLSProduct, DLSProduct-v1, DLSQuickView |
| `12px` | 39 | 18 | DLSBenefits, DLSBrandIndex-v3, DLSBrandTabs, DLSCatalog, DLSCategoriesBento, DLSCategoriesList … +12 |
| `13px` | 117 | 23 | DLSAuto-Контакти, DLSBenefits, DLSBrandTabs, DLSCart, DLSCatalog, DLSCategoriesList … +17 |
| `14px` | 202 | 44 | DLSAuto-Home, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2 … +38 |
| `15px` | 68 | 20 | DLSBrandIndex, DLSBrandIndex-v2, DLSBrandTabs, DLSCart, DLSCatalog, DLSCategoriesBento … +14 |
| `16px` | 201 | 43 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію-v3, DLSBrandIndex, DLSBrandIndex-v2 … +37 |
| `17px` | 1 | 1 | DLSMegaMenu3 |
| `18px` | 32 | 15 | DLSAuto-Контакти, DLSBrandIndex-v4, DLSCart, DLSCatalog, DLSCheckout, DLSDonors … +9 |
| `20px` | 21 | 14 | DLSAuto-Контакти, DLSBrandIndex-v4, DLSCategoriesBento, DLSCheckout, DLSCompare, DLSFavorites … +8 |
| `21px` | 2 | 1 | DLSBrandIndex |
| `22px` | 1 | 1 | DLSProduct-v1 |
| `24px` | 6 | 6 | DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCart, DLSCheckout, DLSDonors, DLSSearch |
| `28px` | 4 | 3 | DLSHeaderHero, DLSPickups, DLSSuvs |
| `32px` | 3 | 3 | DLSHeaderHero, DLSQuickView, DLSReviews |
| `36px` | 2 | 2 | DLSProduct, DLSProduct-v1 |
| `40px` | 5 | 3 | DLSFooter, DLSHeaderHero, DLSMegaMenu-Стани |
| `48px` | 2 | 2 | DLSCategoryCard, DLSFooter |
| `56px` | 1 | 1 | DLSHeaderHero |

## Міжрядковий (line-height)

Унікальних значень: 20.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `1` | 24 | 10 | DLSFooter, DLSHeaderHero, DLSMegaMenu, DLSMegaMenu2, DLSMegaMenu3, DLSPartPath … +4 |
| `1.05` | 5 | 5 | DLSAuto-404, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v2, DLSAuto-Про-компанію-v3, DLSBenefits |
| `1.1` | 10 | 9 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v1, DLSCategoryCard, DLSHeaderHero, DLSPickups, DLSProduct … +3 |
| `1.15` | 62 | 41 | DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3, DLSBrandIndex-v4 … +35 |
| `1.2` | 36 | 18 | DLSAuto-Контакти, DLSAuto-Про-компанію-v2, DLSCart, DLSCategoriesList, DLSCheckout, DLSCompare … +12 |
| `1.25` | 3 | 2 | DLSAuto-Головна-B, DLSServicesVideo |
| `1.3` | 7 | 2 | DLSCheckout, DLSTeam |
| `1.4` | 35 | 25 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2, DLSBenefits, DLSCart … +19 |
| `1.45` | 2 | 1 | DLSServicesVideo |
| `1.5` | 57 | 38 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1 … +32 |
| `1.6` | 1 | 1 | DLSFaq |
| `14px` | 4 | 4 | DLSBrandIndex-v4, DLSProduct, DLSProduct-v1, DLSQuickView |
| `16px` | 34 | 16 | DLSBenefits, DLSBrandIndex-v3, DLSBrandTabs, DLSCatalog, DLSCategoriesBento, DLSCategoriesList … +10 |
| `18px` | 110 | 21 | DLSAuto-Контакти, DLSBenefits, DLSCart, DLSCatalog, DLSCategoriesList, DLSCategoryCard … +15 |
| `20px` | 213 | 34 | DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSBenefits, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3 … +28 |
| `22px` | 44 | 16 | DLSAuto-Контакти, DLSCatalog, DLSCategoriesList, DLSCheckout, DLSCompare, DLSFavorites … +10 |
| `24px` | 50 | 22 | DLSAuto-404, DLSAuto-Контакти, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCart, DLSCatalog … +16 |
| `28px` | 7 | 4 | DLSBrandIndex-v4, DLSCategoriesBento, DLSDonors, DLSMegaMenu |
| `30px` | 2 | 1 | DLSBrandIndex |
| `32px` | 2 | 2 | DLSBrandIndex-v3, DLSBrandIndex-v4 |

## Вага шрифту (font-weight)

Унікальних значень: 5.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `600` | 336 | 58 | DLSAuto-404, DLSAuto-Home, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v1 … +52 |
| `500` | 117 | 32 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію-v1, DLSBenefits, DLSBrandIndex-v3, DLSBrandIndex-v4 … +26 |
| `400` | 18 | 18 | DLSAuto-Про-компанію, DLSAuto-Про-компанію-v2, DLSAuto-Про-компанію-v3, DLSBenefits, DLSBrandIndex, DLSBrandIndex-v3 … +12 |
| `700` | 9 | 5 | DLSDonors, DLSMegaMenu3, DLSProduct, DLSProduct-v1, DLSQuickView |
| `300` | 1 | 1 | DLSCategoryCard |

## Letter-spacing

Унікальних значень: 7.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `-0.02em` | 83 | 49 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v1, DLSBrandIndex, DLSBrandIndex-v2 … +43 |
| `-0.01em` | 27 | 19 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v2, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCategories-v2, DLSCategoriesBento … +13 |
| `0.08em` | 16 | 8 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v1, DLSCategoriesBento, DLSMegaMenu, DLSMegaMenu2, DLSMegaMenu3 … +2 |
| `-0.03em` | 6 | 6 | DLSAuto-404, DLSAuto-Про-компанію-v2, DLSBenefits, DLSStats, DLSStatsNotch, DLSStatsSteps |
| `0.12em` | 3 | 3 | DLSBenefits, DLSPickups, DLSSuvs |
| `-0.035em` | 2 | 2 | DLSAuto-Про-компанію, DLSAuto-Про-компанію-v3 |
| `0.04em` | 1 | 1 | DLSDonors |

## Тривалості анімацій

Унікальних значень: 25.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `1ms` | 1 | 1 | DLSStatsNotch |
| `60ms` | 2 | 1 | DLSReviews |
| `150ms` | 224 | 37 | DLSAuto-404, DLSAuto-Контакти, DLSAuto-Про-компанію-v3, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3 … +31 |
| `160ms` | 1 | 1 | DLSReviews |
| `200ms` | 145 | 28 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSBrandIndex-v4, DLSBrandTabs, DLSCatalog, DLSCategories-v2 … +22 |
| `220ms` | 1 | 1 | DLSReviews |
| `250ms` | 53 | 13 | DLSBenefits, DLSCatalog, DLSCategoriesList, DLSCategoryCard, DLSHeaderHero, DLSMegaMenu … +7 |
| `260ms` | 2 | 1 | DLSBrandIndex-v4 |
| `280ms` | 62 | 23 | DLSAuto-Головна-B, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSBrandTabs … +17 |
| `300ms` | 51 | 17 | DLSBrandIndex-v2, DLSBrandIndex-v3, DLSCart, DLSFooter, DLSHeaderHero, DLSMegaMenu … +11 |
| `320ms` | 3 | 3 | DLSAuto-Головна, DLSReviews, DLSServicesVideo |
| `360ms` | 1 | 1 | DLSReviews |
| `400ms` | 18 | 6 | DLSAuto-404, DLSHeaderHero, DLSServices, DLSServicesVideo, DLSStatsNotch, DLSVisitCta |
| `420ms` | 6 | 3 | DLSBrandIndex-v4, DLSReviews, DLSServicesVideo |
| `450ms` | 4 | 1 | DLSFooter |
| `480ms` | 69 | 27 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3 … +21 |
| `500ms` | 16 | 7 | DLSBenefits, DLSPartPath, DLSServicesCards, DLSServicesWide, DLSStatsNotch, DLSStatsSteps … +1 |
| `520ms` | 7 | 2 | DLSHeaderHero, DLSReviews |
| `560ms` | 3 | 1 | DLSBrandIndex-v4 |
| `600ms` | 5 | 4 | DLSAuto-Головна-B, DLSPartPath, DLSServicesVideo, DLSStatsNotch |
| `700ms` | 3 | 1 | DLSServicesVideo |
| `900ms` | 1 | 1 | DLSServicesVideo |
| `1200ms` | 2 | 1 | DLSAuto-404 |
| `1600ms` | 3 | 3 | DLSBrandIndex-v4, DLSPickups, DLSSuvs |
| `1800ms` | 4 | 4 | DLSProduct, DLSProduct-v1, DLSProductCard, DLSQuickView |

## Тіні (box-shadow)

Унікальних значень: 22.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `0 12px 32px rgba(18,22,28,0.16)` | 16 | 11 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSCheckout, DLSFavorites, DLSHeaderHero … +5 |
| `0 1px 3px rgba(18,22,28,0.16)` | 13 | 5 | DLSCatalog, DLSProduct, DLSProduct-v1, DLSQuickView, DLSSearch |
| `{{ c.shadow }}` | 6 | 6 | DLSBenefits, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCategoriesBento, DLSCategoriesList, DLSStatsNotch |
| `0 4px 16px rgba(18,22,28,0.08)` | 5 | 4 | DLSCompare, DLSMegaMenu3, DLSProduct, DLSProduct-v1 |
| `0 8px 24px rgba(18,22,28,0.16)` | 5 | 1 | DLSHeaderHero |
| `{{ barShadow }}` | 3 | 1 | DLSHeaderHero |
| `{{ aShadow }}` | 2 | 2 | DLSCatalog, DLSSearch |
| `{{ shadow }}` | 2 | 2 | DLSCategoryCard, DLSProductCard |
| `0 1px 3px rgba(18,22,28,0.12)` | 2 | 2 | DLSCompare, DLSFavorites |
| `0 24px 64px rgba(18,22,28,0.24)` | 2 | 2 | DLSHeaderHero, DLSReviews |
| `{{ st.ring }}` | 2 | 1 | DLSPartPath |
| `inset 0 1px 0 rgba(252,252,253,0.25)` | 1 | 1 | DLSAuto-Головна-B |
| `{{ brandRing }}` | 1 | 1 | DLSAuto-Головна-B |
| `{{ modelRing }}` | 1 | 1 | DLSAuto-Головна-B |
| `{{ partRing }}` | 1 | 1 | DLSAuto-Головна-B |
| `0 8px 24px rgba(0,0,0,0.45)` | 1 | 1 | DLSAuto-Контакти |
| `0 -4px 16px rgba(18,22,28,0.08)` | 1 | 1 | DLSCheckout |
| `0 1px 3px rgba(18,22,28,0.24)` | 1 | 1 | DLSCompare |
| `0 16px 24px -12px rgba(18,22,28,0.24)` | 1 | 1 | DLSMegaMenu3 |
| `0 -4px 16px rgba(18,22,28,0.06)` | 1 | 1 | DLSProduct-v1 |
| `0 -12px 32px rgba(18,22,28,0.16)` | 1 | 1 | DLSProduct |
| `1px 0 0 #E6E9EE` | 1 | 1 | DLSCompare |

## Кольори (hex + rgba)

Унікальних значень: 101.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `#1E232B` | 941 | 58 | DLSAuto-404, DLSAuto-Home, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v2 … +52 |
| `#FCFCFD` | 344 | 52 | DLSAuto-404, DLSAuto-Home, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1 … +46 |
| `#4A5260` | 244 | 48 | DLSAuto-404, DLSAuto-Home, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v2 … +42 |
| `#E0001B` | 235 | 44 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSBenefits, DLSBrandIndex … +38 |
| `#E6E9EE` | 226 | 52 | DLSAuto-404, DLSAuto-Home, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v2 … +46 |
| `#F3F5F7` | 171 | 27 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3 … +21 |
| `#6B7380` | 114 | 39 | DLSAuto-404, DLSAuto-Home, DLSAuto-Головна, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності … +33 |
| `#A9B0BB` | 93 | 29 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v3, DLSCatalog … +23 |
| `#FFFFFF` | 91 | 22 | DLSAuto-404, DLSAuto-Контакти, DLSBrandIndex, DLSBrandIndex-v2, DLSCart, DLSCatalog … +16 |
| `#CDD2DA` | 72 | 32 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію-v2, DLSBrandIndex, DLSBrandIndex-v4 … +26 |
| `rgba(0,0,0,0)` | 70 | 27 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3 … +21 |
| `#F6F6F6` | 59 | 43 | DLSAuto-404, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію-v2, DLSBenefits, DLSBrandIndex … +37 |
| `rgba(224,0,27,0.08)` | 50 | 26 | DLSAuto-Контакти, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSBrandTabs … +20 |
| `#12161C` | 42 | 21 | DLSAuto-Головна, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2 … +15 |
| `rgba(18,22,28,0.16)` | 40 | 15 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSBenefits, DLSCatalog, DLSCheckout … +9 |
| `#1F8A4C` | 27 | 10 | DLSBenefits, DLSCart, DLSCheckout, DLSCompare, DLSFooter, DLSProduct … +4 |
| `rgba(18,22,28,0)` | 16 | 8 | DLSPickups, DLSServices-v1, DLSServicesCards, DLSServicesVideo, DLSServicesWide, DLSStatsNotch … +2 |
| `rgba(224,0,27,0)` | 15 | 11 | DLSAuto-Про-компанію, DLSAuto-Про-компанію-v3, DLSBrandIndex, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCategories-v2 … +5 |
| `#C00017` | 14 | 8 | DLSAuto-Головна-B, DLSFavorites, DLSHeaderHero, DLSMegaMenu, DLSProduct, DLSProduct-v1 … +2 |
| `rgba(18,22,28,0.6)` | 13 | 8 | DLSHeaderHero, DLSPickups, DLSProduct, DLSProduct-v1, DLSQuickView, DLSReviews … +2 |
| `#B80016` | 12 | 9 | DLSAuto-404, DLSAuto-Контакти, DLSDonors, DLSFooter, DLSHeaderHero, DLSPickups … +3 |
| `rgba(18,22,28,0.08)` | 11 | 10 | DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCategoriesList, DLSCategoryCard, DLSCheckout, DLSCompare … +4 |
| `rgba(30,35,43,0)` | 9 | 6 | DLSAuto-Головна-B, DLSBrandIndex-v3, DLSMegaMenu3, DLSProduct, DLSProduct-v1, DLSProductCard |
| `#2A303A` | 9 | 6 | DLSPickups, DLSServices-v1, DLSServicesCards, DLSServicesVideo, DLSServicesWide, DLSSuvs |
| `rgba(252,252,253,0.12)` | 9 | 3 | DLSProduct, DLSProduct-v1, DLSServicesVideo |
| `#000` | 8 | 3 | DLSCategories-v2, DLSNewArrivals, DLSProductCard |
| `rgba(18,22,28,0.55)` | 6 | 5 | DLSAuto-Про-компанію-v1, DLSProduct, DLSProduct-v1, DLSQuickView, DLSServicesVideo |
| `rgba(224,0,27,0.12)` | 6 | 6 | DLSAuto-Про-компанію-v3, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCategories-v2, DLSCategoryCard, DLSMegaMenu3 |
| `rgba(252,252,253,0.24)` | 6 | 2 | DLSProduct, DLSProduct-v1 |
| `rgba(18,22,28,0.3)` | 5 | 5 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v1, DLSMegaMenu, DLSMegaMenu2, DLSMegaMenu3 |
| `rgba(252,252,253,0.8)` | 5 | 5 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v1, DLSPickups, DLSStatsNotch, DLSSuvs |
| `rgba(18,22,28,0.72)` | 5 | 5 | DLSAuto-Контакти, DLSPickups, DLSReviews, DLSSearch, DLSSuvs |
| `rgba(0,0,0,0.3)` | 5 | 2 | DLSNewArrivals, DLSProduct |
| `rgba(0,0,0,0.2)` | 5 | 2 | DLSNewArrivals, DLSProduct |
| `rgba(252,252,253,0.7)` | 5 | 2 | DLSPickups, DLSSuvs |
| `rgba(18,22,28,0.2)` | 5 | 3 | DLSPickups, DLSServices-v1, DLSSuvs |
| `rgba(18,22,28,0.7)` | 5 | 3 | DLSServices-v1, DLSServicesCards, DLSServicesWide |
| `rgba(18,22,28,0.85)` | 4 | 4 | DLSAuto-Головна-B, DLSReviews, DLSServicesCards, DLSServicesWide |
| `rgba(18,22,28,0.24)` | 4 | 4 | DLSCompare, DLSHeaderHero, DLSMegaMenu3, DLSReviews |
| `#E7F4EC` | 4 | 4 | DLSCompare, DLSProduct, DLSProduct-v1, DLSQuickView |
| `rgba(252,252,253,0.85)` | 4 | 4 | DLSServicesCards, DLSServicesWide, DLSVisitCta, DLSVisitCta-v1 |
| `rgba(252,252,253,0.6)` | 3 | 3 | DLSAuto-Головна-B, DLSVisitCta, DLSVisitCta-v1 |
| `rgba(252,252,253,0.15)` | 3 | 2 | DLSAuto-Про-компанію-v1, DLSTeam |
| `rgba(18,22,28,0.5)` | 3 | 3 | DLSCatalog, DLSQuickView, DLSSearch |
| `rgba(252,252,253,0.4)` | 3 | 3 | DLSFavorites, DLSPickups, DLSSuvs |
| `#B2B3B5` | 3 | 3 | DLSMegaMenu, DLSMegaMenu2, DLSMegaMenu3 |
| `rgba(18,22,28,0.35)` | 3 | 1 | DLSServices-v1 |
| `rgba(252,252,253,0.9)` | 3 | 1 | DLSServices-v1 |
| `rgba(18,22,28,0.64)` | 3 | 1 | DLSVideos |
| `rgba(18,22,28,0.65)` | 2 | 2 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v1 |
| `rgba(252,252,253,0.06)` | 2 | 2 | DLSAuto-Головна-B, DLSCategoriesNotch |
| `rgba(0,0,0,0.45)` | 2 | 1 | DLSAuto-Контакти |
| `rgba(224,0,27,0.14)` | 2 | 2 | DLSAuto-Про-компанію, DLSAuto-Про-компанію-v3 |
| `rgba(252,252,253,0.75)` | 2 | 2 | DLSAuto-Про-компанію, DLSAuto-Про-компанію-v3 |
| `rgba(224,0,27,0.35)` | 2 | 1 | DLSAuto-Про-компанію |
| `rgba(252,252,253,0)` | 2 | 2 | DLSCategoriesNotch, DLSHeaderHero |
| `rgba(18,22,28,0.12)` | 2 | 2 | DLSCompare, DLSFavorites |
| `#C62828` | 2 | 1 | DLSFooter |
| `rgba(224,0,27,0.6)` | 2 | 1 | DLSPartPath |
| `rgba(18,22,28,0.32)` | 2 | 2 | DLSPickups, DLSSuvs |
| `rgba(18,22,28,0.92)` | 2 | 2 | DLSProduct, DLSProduct-v1 |
| `rgba(18,22,28,0.95)` | 2 | 2 | DLSServicesCards, DLSServicesWide |
| `rgba(18,22,28,0.9)` | 2 | 1 | DLSServicesVideo |
| `rgba(252,252,253,0.88)` | 2 | 2 | DLSServicesVideo, DLSVideos |
| `rgba(252,252,253,0.25)` | 1 | 1 | DLSAuto-Головна-B |
| `rgba(252,252,253,0.1)` | 1 | 1 | DLSAuto-Головна-B |
| `rgba(30,35,43,0.08)` | 1 | 1 | DLSAuto-Головна-B |
| `#050608` | 1 | 1 | DLSAuto-Головна |
| `rgba(245,130,32,0.85)` | 1 | 1 | DLSAuto-Головна |
| `rgba(255,180,90,0.9)` | 1 | 1 | DLSAuto-Головна |
| `#7B3FE4` | 1 | 1 | DLSAuto-Контакти |
| `#002F34` | 1 | 1 | DLSAuto-Контакти |
| `#F26522` | 1 | 1 | DLSAuto-Контакти |
| `#E4405F` | 1 | 1 | DLSAuto-Контакти |
| `#0866FF` | 1 | 1 | DLSAuto-Контакти |
| `#1E9E5A` | 1 | 1 | DLSAuto-Контакти |
| `rgba(18,22,28,0.8)` | 1 | 1 | DLSAuto-Про-компанію-v1 |
| `rgba(224,0,27,0.3)` | 1 | 1 | DLSAuto-Про-компанію-v3 |
| `rgba(224,0,27,0.28)` | 1 | 1 | DLSAuto-Про-компанію-v3 |
| `#16141A` | 1 | 1 | DLSAuto-Про-компанію |
| `rgba(224,0,27,0.18)` | 1 | 1 | DLSAuto-Про-компанію |
| `rgba(92,26,22,0.55)` | 1 | 1 | DLSAuto-Про-компанію |
| `rgba(60,20,20,0.3)` | 1 | 1 | DLSAuto-Про-компанію |
| `rgba(40,16,18,0)` | 1 | 1 | DLSAuto-Про-компанію |
| `rgba(255,255,255,0.1)` | 1 | 1 | DLSBenefits |
| `rgba(31,138,76,0.15)` | 1 | 1 | DLSBenefits |
| `rgba(18,22,28,0.4)` | 1 | 1 | DLSCart |
| `#FDEDEF` | 1 | 1 | DLSCart |
| `#232830` | 1 | 1 | DLSCategoriesBento |
| `#2A3039` | 1 | 1 | DLSCategoriesBento |
| `rgba(252,252,253,1)` | 1 | 1 | DLSHeaderHero |
| `rgba(0,0,0,0.28)` | 1 | 1 | DLSNewArrivals |
| `rgba(0,0,0,0.35)` | 1 | 1 | DLSNewArrivals |
| `rgba(0,0,0,0.25)` | 1 | 1 | DLSNewArrivals |
| `rgba(18,22,28,0.06)` | 1 | 1 | DLSProduct-v1 |
| `#5F6368` | 1 | 1 | DLSProduct |
| `rgba(224,0,27,0.04)` | 1 | 1 | DLSQuickView |
| `rgba(252,252,253,0.32)` | 1 | 1 | DLSServicesVideo |
| `rgba(18,22,28,0.94)` | 1 | 1 | DLSServicesVideo |
| `rgba(252,252,253,0.2)` | 1 | 1 | DLSServicesVideo |
| `#181C23` | 1 | 1 | DLSStatsSteps |

## px-літерали зі <script> (обчислювані)

Унікальних значень: 92.

| значення | частота | файлів | де (приклади) |
|---|---|---|---|
| `-168px` | 2 | 2 | DLSPickups, DLSSuvs |
| `-146px` | 1 | 1 | DLSProductCard |
| `-144px` | 2 | 2 | DLSPickups, DLSSuvs |
| `-60px` | 1 | 1 | DLSVisitCta-v1 |
| `-56px` | 1 | 1 | DLSQuickView |
| `-40px` | 1 | 1 | DLSVisitCta-v1 |
| `-24px` | 2 | 1 | DLSProduct |
| `-16px` | 5 | 4 | DLSBrandTabs, DLSProduct, DLSProductCard, DLSSearch |
| `-12px` | 1 | 1 | DLSPartPath |
| `-8px` | 8 | 8 | DLSBenefits, DLSBrandIndex-v4, DLSCompare, DLSMegaMenu, DLSMegaMenu2, DLSMegaMenu3 … +2 |
| `-6px` | 1 | 1 | DLSQuickView |
| `-4px` | 6 | 5 | DLSBrandIndex, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSProductCard, DLSVideos |
| `0px` | 25 | 14 | DLSAuto-404, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v3, DLSBrandIndex, DLSBrandIndex-v4, DLSCategoriesBento … +8 |
| `1px` | 24 | 12 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v2, DLSCatalog, DLSCategoriesBento, DLSCheckout, DLSFooter … +6 |
| `2px` | 9 | 6 | DLSAuto-Головна, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCategoriesBento, DLSHeaderHero, DLSServices |
| `3px` | 1 | 1 | DLSAuto-Контакти |
| `4px` | 14 | 10 | DLSAuto-Головна-B, DLSBrandIndex-v3, DLSBrandIndex-v4, DLSCategoriesList, DLSCategoryCard, DLSPartPath … +4 |
| `5px` | 3 | 2 | DLSCheckout, DLSPartPath |
| `6px` | 6 | 4 | DLSAuto-Головна, DLSBrandIndex-v4, DLSCheckout, DLSQuickView |
| `7px` | 1 | 1 | DLSServices |
| `8px` | 29 | 17 | DLSAuto-Контакти, DLSBrandTabs, DLSCatalog, DLSFavorites, DLSHeaderHero, DLSMegaMenu3 … +11 |
| `9px` | 1 | 1 | DLSServices |
| `10px` | 3 | 3 | DLSBrandIndex-v4, DLSBrandTabs, DLSReviews |
| `11px` | 1 | 1 | DLSBrandIndex-v4 |
| `12px` | 43 | 24 | DLSAuto-Контакти, DLSBenefits, DLSCatalog, DLSCategories, DLSCategoriesBento, DLSCategoriesList … +18 |
| `13px` | 2 | 2 | DLSAuto-Контакти, DLSBrandIndex-v4 |
| `14px` | 20 | 17 | DLSAuto-404, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2 … +11 |
| `15px` | 2 | 2 | DLSBenefits, DLSProduct |
| `16px` | 183 | 56 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1 … +50 |
| `18px` | 38 | 29 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1 … +23 |
| `20px` | 21 | 15 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v2, DLSBenefits, DLSCategories-v2, DLSCategoriesList, DLSCategoriesNotch … +9 |
| `22px` | 1 | 1 | DLSAuto-Головна |
| `24px` | 143 | 51 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2 … +45 |
| `26px` | 2 | 2 | DLSPickups, DLSSuvs |
| `28px` | 56 | 42 | DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3 … +36 |
| `32px` | 155 | 53 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1 … +47 |
| `36px` | 5 | 5 | DLSAuto-404, DLSBenefits, DLSPartPath, DLSProduct, DLSProduct-v1 |
| `40px` | 50 | 45 | DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2 … +39 |
| `44px` | 1 | 1 | DLSFavorites |
| `48px` | 75 | 42 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1 … +36 |
| `50px` | 1 | 1 | DLSAuto-Головна |
| `52px` | 2 | 1 | DLSAuto-Контакти |
| `56px` | 10 | 10 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2, DLSAuto-Про-компанію-v3 … +4 |
| `64px` | 87 | 43 | DLSAuto-404, DLSAuto-Головна-B, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2 … +37 |
| `72px` | 10 | 10 | DLSAuto-Про-компанію-v2, DLSAuto-Про-компанію-v3, DLSBrandIndex-v4, DLSBrandTabs, DLSCategories-v2, DLSFavorites … +4 |
| `75px` | 34 | 17 | DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3, DLSBrandTabs, DLSCategories-v2, DLSCategoriesList … +11 |
| `76px` | 5 | 4 | DLSCheckout, DLSStats, DLSStatsNotch, DLSStatsSteps |
| `80px` | 6 | 6 | DLSCheckout, DLSProduct, DLSProduct-v1, DLSServicesCards, DLSServicesVideo, DLSServicesWide |
| `88px` | 1 | 1 | DLSBrandIndex-v4 |
| `96px` | 19 | 13 | DLSAuto-404, DLSAuto-Контакти, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v1, DLSAuto-Про-компанію-v2, DLSAuto-Про-компанію-v3 … +7 |
| `100px` | 18 | 17 | DLSBrandIndex, DLSBrandIndex-v2, DLSBrandIndex-v3, DLSBrandTabs, DLSCategories-v2, DLSCategoriesList … +11 |
| `104px` | 1 | 1 | DLSProduct |
| `112px` | 3 | 3 | DLSCategories-v2, DLSCategoriesList, DLSRecommend |
| `120px` | 3 | 2 | DLSCategoriesList, DLSCheckout |
| `128px` | 10 | 9 | DLSAuto-Головна-B, DLSAuto-Про-компанію-v3, DLSCategories-v2, DLSCategoriesNotch, DLSCompare, DLSFavorites … +3 |
| `136px` | 1 | 1 | DLSMegaMenu3 |
| `140px` | 1 | 1 | DLSAuto-Про-компанію |
| `144px` | 1 | 1 | DLSCategoriesList |
| `148px` | 1 | 1 | DLSMegaMenu3 |
| `160px` | 6 | 6 | DLSAuto-Про-компанію, DLSAuto-Про-компанію-v3, DLSCatalog, DLSProduct, DLSProduct-v1, DLSSearch |
| `164px` | 1 | 1 | DLSMegaMenu3 |
| `176px` | 2 | 2 | DLSCategories-v2, DLSCategoriesNotch |
| `192px` | 2 | 1 | DLSAuto-Про-компанію-v3 |
| `196px` | 1 | 1 | DLSMegaMenu3 |
| `200px` | 3 | 3 | DLSCatalog, DLSCompare, DLSSearch |
| `208px` | 1 | 1 | DLSAuto-Про-компанію |
| `220px` | 3 | 3 | DLSAuto-Про-компанію, DLSAuto-Про-компанію-v2, DLSCompare |
| `224px` | 3 | 1 | DLSRecommend |
| `240px` | 5 | 5 | DLSAuto-Контакти, DLSAuto-Про-компанію, DLSCategories-v2, DLSCategoriesNotch, DLSCompare |
| `256px` | 1 | 1 | DLSAuto-Про-компанію |
| `272px` | 2 | 2 | DLSPickups, DLSSuvs |
| `280px` | 5 | 4 | DLSAuto-Про-компанію-v2, DLSCategoriesBento, DLSRecommend, DLSServices-v1 |
| `296px` | 1 | 1 | DLSServices-v1 |
| `300px` | 1 | 1 | DLSVisitCta-v1 |
| `320px` | 10 | 7 | DLSAuto-404, DLSAuto-Контакти, DLSAuto-Про-компанію, DLSAuto-Про-компанію-v2, DLSCategories-v2, DLSCategoriesBento … +1 |
| `328px` | 2 | 2 | DLSPickups, DLSSuvs |
| `360px` | 4 | 4 | DLSAuto-Про-компанію, DLSAuto-Про-компанію-v2, DLSCategoriesBento, DLSServices-v1 |
| `380px` | 1 | 1 | DLSVisitCta-v1 |
| `400px` | 4 | 4 | DLSCatalog, DLSCategoriesBento, DLSSearch, DLSServicesWide |
| `440px` | 4 | 4 | DLSAuto-404, DLSAuto-Контакти, DLSCategoriesBento, DLSServicesWide |
| `480px` | 1 | 1 | DLSVisitCta-v1 |
| `520px` | 2 | 2 | DLSAuto-Контакти, DLSServicesWide |
| `560px` | 1 | 1 | DLSVisitCta-v1 |
| `600px` | 1 | 1 | DLSServicesVideo |
| `630px` | 1 | 1 | DLSMegaMenu |
| `640px` | 1 | 1 | DLSAuto-404 |
| `720px` | 1 | 1 | DLSAuto-Про-компанію |
| `1008px` | 1 | 1 | DLSCompare |
| `1040px` | 1 | 1 | DLSQuickView |
| `1160px` | 1 | 1 | DLSCompare |
| `1312px` | 18 | 15 | DLSAuto-404, DLSAuto-Контакти, DLSAuto-Політика-конфіденційності, DLSAuto-Про-компанію, DLSBenefits, DLSCatalog … +9 |
| `1440px` | 1 | 1 | DLSFavorites |

## Рідкісні кольори (≤2 входжень) — рішення по кожному

| колір | разів | де (файл · властивість) |
|---|---|---|
| `#002F34` | 1 | DLSAuto-Контакти · `script` |
| `#050608` | 1 | DLSAuto-Головна · `script` |
| `#0866FF` | 1 | DLSAuto-Контакти · `script` |
| `#16141A` | 1 | DLSAuto-Про-компанію · `background` |
| `#181C23` | 1 | DLSStatsSteps · `background` |
| `#1E9E5A` | 1 | DLSAuto-Контакти · `script` |
| `#232830` | 1 | DLSCategoriesBento · `background` |
| `#2A3039` | 1 | DLSCategoriesBento · `background` |
| `#5F6368` | 1 | DLSProduct · `color` |
| `#7B3FE4` | 1 | DLSAuto-Контакти · `script` |
| `#C62828` | 2 | DLSFooter · `color`<br>DLSFooter · `script` |
| `#E4405F` | 1 | DLSAuto-Контакти · `script` |
| `#F26522` | 1 | DLSAuto-Контакти · `script` |
| `#FDEDEF` | 1 | DLSCart · `background` |
| `rgba(0,0,0,0.25)` | 1 | DLSNewArrivals · `filter` |
| `rgba(0,0,0,0.28)` | 1 | DLSNewArrivals · `filter` |
| `rgba(0,0,0,0.35)` | 1 | DLSNewArrivals · `filter` |
| `rgba(0,0,0,0.45)` | 2 | DLSAuto-Контакти · `box-shadow`<br>DLSAuto-Контакти · `script` |
| `rgba(18,22,28,0.06)` | 1 | DLSProduct-v1 · `box-shadow` |
| `rgba(18,22,28,0.12)` | 2 | DLSCompare · `box-shadow`<br>DLSFavorites · `box-shadow` |
| `rgba(18,22,28,0.32)` | 2 | DLSPickups · `background`<br>DLSSuvs · `background` |
| `rgba(18,22,28,0.4)` | 1 | DLSCart · `background` |
| `rgba(18,22,28,0.65)` | 2 | DLSAuto-Головна-B · `background`<br>DLSAuto-Про-компанію-v1 · `script` |
| `rgba(18,22,28,0.8)` | 1 | DLSAuto-Про-компанію-v1 · `script` |
| `rgba(18,22,28,0.9)` | 2 | DLSServicesVideo · `background`<br>DLSServicesVideo · `background` |
| `rgba(18,22,28,0.92)` | 2 | DLSProduct-v1 · `background`<br>DLSProduct · `background` |
| `rgba(18,22,28,0.94)` | 1 | DLSServicesVideo · `background` |
| `rgba(18,22,28,0.95)` | 2 | DLSServicesCards · `background`<br>DLSServicesWide · `background` |
| `rgba(224,0,27,0.04)` | 1 | DLSQuickView · `script` |
| `rgba(224,0,27,0.14)` | 2 | DLSAuto-Про-компанію-v3 · `background`<br>DLSAuto-Про-компанію · `background` |
| `rgba(224,0,27,0.18)` | 1 | DLSAuto-Про-компанію · `background` |
| `rgba(224,0,27,0.28)` | 1 | DLSAuto-Про-компанію-v3 · `background` |
| `rgba(224,0,27,0.3)` | 1 | DLSAuto-Про-компанію-v3 · `background` |
| `rgba(224,0,27,0.35)` | 2 | DLSAuto-Про-компанію · `background`<br>DLSAuto-Про-компанію · `background` |
| `rgba(224,0,27,0.6)` | 2 | DLSPartPath · `script`<br>DLSPartPath · `script` |
| `rgba(245,130,32,0.85)` | 1 | DLSAuto-Головна · `script` |
| `rgba(252,252,253,0.06)` | 2 | DLSAuto-Головна-B · `background`<br>DLSCategoriesNotch · `background` |
| `rgba(252,252,253,0.1)` | 1 | DLSAuto-Головна-B · `background` |
| `rgba(252,252,253,0.2)` | 1 | DLSServicesVideo · `background` |
| `rgba(252,252,253,0.25)` | 1 | DLSAuto-Головна-B · `box-shadow` |
| `rgba(252,252,253,0.32)` | 1 | DLSServicesVideo · `background` |
| `rgba(252,252,253,0.75)` | 2 | DLSAuto-Про-компанію-v3 · `color`<br>DLSAuto-Про-компанію · `color` |
| `rgba(252,252,253,0.88)` | 2 | DLSServicesVideo · `background`<br>DLSVideos · `background` |
| `rgba(252,252,253,0)` | 2 | DLSCategoriesNotch · `background`<br>DLSHeaderHero · `script` |
| `rgba(252,252,253,1)` | 1 | DLSHeaderHero · `script` |
| `rgba(255,180,90,0.9)` | 1 | DLSAuto-Головна · `script` |
| `rgba(255,255,255,0.1)` | 1 | DLSBenefits · `border` |
| `rgba(30,35,43,0.08)` | 1 | DLSAuto-Головна-B · `script` |
| `rgba(31,138,76,0.15)` | 1 | DLSBenefits · `background` |
| `rgba(40,16,18,0)` | 1 | DLSAuto-Про-компанію · `background` |
| `rgba(60,20,20,0.3)` | 1 | DLSAuto-Про-компанію · `background` |
| `rgba(92,26,22,0.55)` | 1 | DLSAuto-Про-компанію · `background` |
