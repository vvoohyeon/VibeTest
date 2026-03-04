# Reimplementation Checklist (SSOT-Aligned)

## 0. Routing / i18n / 404 Baseline
- [ ] Keep `proxy.ts` single-entry locale policy and allowlist behavior (`§5.3`).
- [ ] Keep root vs locale layout split (`§5.1`).
- [ ] Keep typed route builder as locale-free input/output (`§5.4`).

## 1. Landing Grid / Slot / Height Contracts
- [ ] Implement Desktop/Tablet/Mobile grid plan and row composition (`§6.1`, `§6.2`).
- [ ] Enforce Normal slot order and Expanded slot swap contract (`§6.5`, `§6.8`).
- [ ] Enforce Normal compact behavior and tags-terminal policy (`§6.7`).
- [ ] Enforce no synthetic gap between thumbnail and tags on non-compensated cards (`§6.7`, `§14.3-10`).

## 2. Expanded Motion / Row Stability
- [ ] Enforce shell scale 1.1 and no content crop (`§8.4`).
- [ ] Compute transform-origin from settled row edges (first/last/center, single-card row left) (`§8.4`, `§14.3-11`).
- [ ] Freeze non-target card top/bottom/outer-height across row1 and row2+ during expanded/handoff (`§6.7`, `§14.3-12`).
- [ ] Enforce handoff snapshot release only after target settled (`§6.7`).

## 3. Mobile Expanded Lifecycle
- [ ] Enforce lifecycle `OPENING -> OPEN -> CLOSING -> NORMAL` and queue-close semantics (`§8.5`).
- [ ] Keep in-flow full-bleed card expansion and scroll lock/backdrop layering (`§8.5`).
- [ ] Show `X` icon in first row header, keep visible through OPENING/OPEN/CLOSING, disable during CLOSING (`§8.5`, `§14.3-13`).
- [ ] Enforce viewport-based top y-anchor zero drift across index/scroll/content cases (`§8.5`, `§14.3-13`).

## 4. Handshake / Test / History / Telemetry Minimum
- [ ] Enforce CTA-only transition start + transition correlation closure (`§8.6`, `§13.3`, `§12.2`).
- [ ] Enforce Test pre-answer + ingress flag + Q2 start rule (`§13.4`, `§13.6`).
- [ ] Keep history per-run storage (max 50, newest-first, delete/clear, invalid mark) (global req + `§13`).
- [ ] Keep consent default OPTED_OUT and no client send under UNKNOWN/OPTED_OUT (`§12.1`, `§12.4`, `§15 EX-002`).

## 5. Verification Gate
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run test:e2e:smoke`
- [ ] `npm run qa:gate` (3/3)
