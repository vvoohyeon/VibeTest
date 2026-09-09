# 포인터 아래 노드가 unmount 되면 hover leave 가 유실된다 — `state-smoke:1010` 의 원인

**Date:** 2026-09-10 · **Task mode:** Implementation · **Branch:** `claude/hover-leave-lost-node` · **Wave:** rebaseline programme 밖의 결함 수정(5c 착지 뒤, 6 단계 착수 전) · **Opens `src/**`:** yes

**High-Risk 파일:** `src/features/landing/grid/use-hover-intent-controller.ts` — `use-landing-interaction-controller.ts` 가 소비하는 hover 계약의 일부다(`AGENTS.md §4 High-Risk`). **Ask-First 파일 없음.** `docs/design/ds/**` · `globals.css` · 시각 baseline 은 이 계획이 열지 않는다.

---

## 무엇이 잘못돼 있나

`CARD_HOVER_LEAVE` 로 이어지는 유일한 경로는 카드 루트의 React `onMouseLeave` 이고, 그것은 브라우저의 `mouseout` 에 실린다. **포인터가 올라앉은 노드가 그 사이 DOM 에서 제거되면 Chromium 은 그 노드로 `mouseout` 을 보낼 수 없고**, 카드 루트까지 올라오는 전파 경로가 통째로 사라진다. 그러면 `use-hover-intent-controller.ts:231` 의 `onMouseLeave` 가 한 번도 실행되지 않아 collapse 가 **예약조차 되지 않고**, `hoverLock` 이 그 카드에 고정된 채 남는다. 카드는 `steady` 로 갇히고, 사용자가 다른 카드에 hover 할 때까지 닫히지 않는다.

**실측 (2026-09-10, chromium, preview 빌드).** 카드 A 가 확장된 상태에서 카드 B 로 hover 를 넘긴 뒤 중간 `mousemove` 없이 한 번에 카드 밖으로 나가면 재현된다.

| `mouse.move` 직전 포인터가 앉은 노드 | `isConnected` | 결과 |
|:---|:---:|:---|
| `IMG.landing-grid-card-thumbnail` — 접힌 상태의 썸네일, 확장하며 unmount 된다 | **false** | 갇힘 4/4 |
| `P.landing-grid-card-preview-question` — 확장된 본문, 살아남는다 | true | 정상 2/2 |

이벤트 로그가 짝이 맞지 않는 것을 그대로 보여 준다 — `mouseover` 는 오는데 짝이 될 `mouseout` 이 없다:

```
mouseout  target=BUTTON card=qmbti    connected=true  rel=rhythm-b  t=2398
mouseover target=IMG    card=rhythm-b connected=true  rel=qmbti     t=2399
mouseover target=HEADER card=—        connected=true  rel=rhythm-b  t=2424   ← mouseout 없음
```

**경계.** 포인터가 카드 안에서 한 번이라도 움직인 뒤 나가면 0/6 으로 재현되지 않는다(살아 있는 노드에 다시 얹힌다). handoff 없이 단일 카드를 hover 했다 나오는 것도 0/6 이다. 즉 조건은 **⑴ 카드 사이 hover handoff ⑵ 중간 `mousemove` 없는 즉시 이탈** 둘이 겹칠 때다. 실사용에서는 확장 직후의 빠른 flick 이 여기에 해당한다.

**선행성.** `08648e5`(5c 시리즈 전체 이전)에서 같은 프로브가 6 회 중 2 실패 · 1px 후 이탈 0 실패로 같은 서명을 낸다. 5c 묶음 B·C 가 만든 결함이 아니다.

## 어디를 고치나 — 그리고 왜 거기인가

`recordPointerInput`(`use-hover-intent-controller.ts:92`)은 이미 window `pointermove` 에 물려 있고(`use-landing-interaction-controller.ts:516`), **이미 "직전에 어느 카드 안이었나 → 지금 어느 카드 안인가"를 계산한다.** 그런데 그 전이를 기록만 하고 버린다. 유실된 leave 를 복구할 정보가 이미 그 함수 안에 있다.

**이벤트 순서가 이 자리를 안전하게 만든다.** 실측한 순서는 `pointerout → pointerover → mouseout → mouseover → pointermove → mousemove` 다. 정상 경로에서는 `pointermove` 가 오기 전에 React `onMouseLeave` 가 이미 실행돼 `pointerWithinCardVariantRef` 를 `null` 로 만든다. 그러므로 `recordPointerInput` 이 "직전 값이 카드였다"를 보는 경우는 **leave 가 유실됐을 때뿐이다.** 이중 예약이 구조적으로 불가능하다.

기각한 대안 둘. ⑴ document `mouseover` 에서 `relatedTarget` 으로 떠난 카드를 알아내기 — 제거된 노드는 부모가 끊겨 `closest('[data-card-variant]')` 가 `null` 을 돌려주므로 어느 카드였는지 알 수 없다(실측 확인). ⑵ `pointermove` 마다 기하로 재조정 — `scheduleHoverIntent` 가 호출마다 타이머를 다시 걸어, 포인터가 밖에서 움직이는 동안 collapse 가 영원히 미뤄진다.

## 바꾸는 파일

| 파일 | 무엇 |
|:---|:---|
| `src/features/landing/grid/use-hover-intent-controller.ts` | `recordPointerInput` 이 카드 → 카드 밖 전이를 감지하면 `onMouseLeave` 와 **같은** collapse 를 예약한다. 지연·가드·`setDesktopTransitionReason('collapse')` 를 그대로 쓴다 — 새 동작을 만들지 않고 유실된 것을 되돌린다 |
| `tests/unit/landing-interaction-controller-handlers.test.ts` | 결정론적 회귀 검사(아래) |
| `docs/LESSONS_LEARNED.md` | L15 등재 — leave 계약을 `mouseout` 하나에 걸면 포인터 아래 노드의 수명에 걸리게 된다 |
| `docs/decision-register.md` | 변경 이력 한 줄 |

## 회귀 검사 — 무엇을 고정하고, 무엇은 못 고정하나

**결정론적 고정은 단위 검사가 한다.** E2E 로는 이 결함을 결정론으로 만들 수 없다. 실패 조건이 「노드가 제거되고 **브라우저가 다시 hit-test 하기 전에** 포인터가 나간다」이기 때문이다 — 카드 안에 노드를 심어 떼어내는 방식(8 회 중 1 실패)도, 썸네일을 직접 겨냥하는 방식(8 회 중 3 실패)도 시점을 제어하지 못한다. 시점에 기대는 검사를 새로 만들면 원장 `L14` 가 적은 함정을 하나 더 만드는 것이다.

그래서 `tests/unit/landing-interaction-controller-handlers.test.ts` 에 실제 컨트롤러 훅을 렌더해 **유실 조건 자체를 직접 만든다**: 카드에 `onMouseEnter` 를 주어 확장시킨 뒤, `onMouseLeave` 를 **부르지 않고** 카드 밖을 target 으로 하는 window `pointermove` 를 보낸다. `DESKTOP_COLLAPSE_DELAY_MS` 를 넘긴 뒤 카드가 접혔는지 본다. jsdom 은 브라우저의 hit-test 를 흉내 내지 않으므로 시점 의존이 없다. 이 검사는 `npm test` 안에 있어 매 단위 검증에서 돈다(`AGENTS.md §5`, 프로젝트 메모리의 「하네스 가드는 vitest 에 있다」).

**고장 주입으로 발화를 확인한다** — 새 코드를 되돌린 상태에서 이 검사가 혼자 붉어야 한다.

**E2E 는 이미 있는 것이 회귀 검사다.** `tests/e2e/state-smoke.spec.ts:1010` 이 바로 이 경로에서 붉다. 고치면 초록이어야 하며, 그것이 이 계획의 인수 조건이다.

## 인수 조건

1. 새 단위 검사가 수정 전 붉고 수정 후 초록이다(고장 주입으로 양방향 확인).
2. 프로브(순간이동 형태) 수정 전 6 회 중 4 실패 → 수정 후 **12 회 중 0 실패**.
3. `state-smoke.spec.ts:1010` 을 저장소 자신의 구성으로 **10 회 연속** 통과.
4. 값 불변: 랜딩 라우트 전면 계산값 지문이 수정 전후 불일치 0 — 이 수정은 이벤트 유실만 되돌리고 시각을 바꾸지 않는다.
5. 기본 게이트 초록 + chromium E2E(theme-matrix 제외) 초록.

## 위험 다섯 차원 (High-Risk 파일)

- **usability** — 갇힌 카드가 닫히므로 개선 방향이다. 정상 경로에서는 코드가 실행되지 않는다(직전 값이 항상 `null`).
- **a11y** — 키보드 경로는 `hoverLock.keyboardMode` 가 지키며 이 수정은 `interactionMode !== 'hover'` 와 모바일에서 빠져나온다. 포커스 이동·탭 순서를 건드리지 않는다.
- **responsiveness** — 모바일 뷰포트에서 빠져나오므로 모바일 생애주기와 만나지 않는다.
- **performance** — 이미 물려 있는 passive `pointermove` 리스너 안의 비교 한 번. 새 리스너·새 타이머 종류 없음.
- **design-system consistency** — 시각 토큰·클래스를 열지 않는다.

## 검증 명령

```bash
npm run lint && npm run typecheck && npm test && npm run build
node output/probe/repro-1010d.mjs 12          # 순간이동/연속이동 두 형태
PLAYWRIGHT_SERVER_MODE=preview npx playwright test --project=chromium --workers=1 tests/e2e/state-smoke.spec.ts
PLAYWRIGHT_BASE_URL=… npx playwright test --project=chromium tests/e2e/{a11y,consent,gnb,grid,qualifier-overlay,routing,state,transition-telemetry}-smoke.spec.ts
```

`theme-matrix-smoke` 는 돌리지 않고 `--update` 도 치지 않는다(`BQ-07`, `L11`). 매 E2E 실행 뒤 생성된 baseline 을 지워 추적 수와 디스크 수를 맞춘다.

## 사용자 확인이 필요한 결정

없다. 값·시각·계약을 바꾸지 않고 유실된 이벤트만 되돌린다. 다만 **`state-smoke:1010` 이 이 수정으로도 초록이 되지 않으면 멈추고 보고한다** — 그때는 원인이 하나 더 있는 것이고, 검사를 통과시키려 손대는 것은 이 계획의 일이 아니다.
