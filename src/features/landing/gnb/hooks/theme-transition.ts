"use client";

const THEME_SWITCH_MASK_SIZE_VAR = "--theme-switch-mask-size";
const THEME_SWITCH_MASK_X_VAR = "--theme-switch-mask-x";
const THEME_SWITCH_MASK_Y_VAR = "--theme-switch-mask-y";
const MASK_VIEWBOX_SIZE = 100;
const MASK_CIRCLE_RADIUS = 25;
const MASK_VISIBLE_RADIUS_RATIO = MASK_CIRCLE_RADIUS / MASK_VIEWBOX_SIZE;
const MASK_SIZE_SCALE = 1 / MASK_VISIBLE_RADIUS_RATIO;

export const THEME_TRANSITION_CONFIG = {
  durationMs: 2800,
  easing: "linear",
  blurAmount: 2,
  overscanPx: 96,
  progressBoost: 0.35,
  cleanupBufferMs: 120,
  styleId: "theme-switch-style",
  baseStyleId: "theme-switch-base-style",
} as const;

interface BlurCircleTransitionInput {
  sourceEl?: HTMLElement | null;
  applyThemeDomWrite: () => void;
  durationMs?: number;
}

interface ViewTransitionLike {
  ready: Promise<void>;
  finished?: Promise<void>;
}

interface ThemeSwitchGeometryInput {
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
}

interface ThemeSwitchGeometry {
  maxRadius: number;
  finalRadius: number;
}

interface ThemeSwitchMaskFrameInput {
  originX: number;
  originY: number;
  finalRadius: number;
  timeProgress: number;
}

interface ThemeSwitchMaskFrame {
  radius: number;
  maskSize: number;
  maskX: number;
  maskY: number;
}

type ThemeTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike;
};

let activeAnimationFrameId: number | null = null;
let activeCleanupTimeoutId: number | null = null;
let activeTransitionRunId = 0;

export function resolveThemeTransitionDuration(durationMs?: number): number {
  return durationMs ?? THEME_TRANSITION_CONFIG.durationMs;
}

export function createBlurCircleMask(blurAmount: number): string {
  return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100"><defs><filter id="blur"><feGaussianBlur stdDeviation="${blurAmount}" /></filter></defs><circle cx="0" cy="0" r="25" fill="white" filter="url(%23blur)"/></svg>')`;
}

export function resolveThemeSwitchRadiusProgress(timeProgress: number): number {
  const clampedProgress = Math.min(Math.max(timeProgress, 0), 1);
  const smootherstep =
    clampedProgress *
    clampedProgress *
    clampedProgress *
    (clampedProgress * (clampedProgress * 6 - 15) + 10);

  const baseProgress = Math.sqrt(smootherstep);

  return (
    baseProgress +
    THEME_TRANSITION_CONFIG.progressBoost *
      baseProgress *
      (1 - baseProgress)
  );
}

export function getThemeSwitchGeometry({
  x,
  y,
  viewportWidth,
  viewportHeight,
}: ThemeSwitchGeometryInput): ThemeSwitchGeometry {
  const topLeft = Math.hypot(x, y);
  const topRight = Math.hypot(viewportWidth - x, y);
  const bottomLeft = Math.hypot(x, viewportHeight - y);
  const bottomRight = Math.hypot(viewportWidth - x, viewportHeight - y);
  const maxRadius = Math.max(topLeft, topRight, bottomLeft, bottomRight);

  return {
    maxRadius,
    finalRadius: maxRadius + THEME_TRANSITION_CONFIG.overscanPx,
  };
}

export function getThemeSwitchMaskFrame({
  originX,
  originY,
  finalRadius,
  timeProgress,
}: ThemeSwitchMaskFrameInput): ThemeSwitchMaskFrame {
  const radius = finalRadius * resolveThemeSwitchRadiusProgress(timeProgress);
  const maskSize = radius * MASK_SIZE_SCALE;

  return {
    radius,
    maskSize,
    maskX: originX - maskSize / 2,
    maskY: originY - maskSize / 2,
  };
}

function isReducedMotionPreferred(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function supportsThemeTransition(
  sourceEl?: HTMLElement | null,
): boolean {
  if (typeof document === "undefined" || !sourceEl) {
    return false;
  }

  const transitionDocument = document as ThemeTransitionDocument;
  return (
    typeof transitionDocument.startViewTransition === "function" &&
    !isReducedMotionPreferred()
  );
}

export function getTransitionOrigin(sourceEl: HTMLElement): {
  x: number;
  y: number;
} {
  const { top, left, width, height } = sourceEl.getBoundingClientRect();

  return {
    x: left + width / 2,
    y: top + height / 2,
  };
}

function clearActiveAnimationFrame() {
  if (activeAnimationFrameId === null || typeof window === "undefined") {
    return;
  }

  window.cancelAnimationFrame(activeAnimationFrameId);
  activeAnimationFrameId = null;
}

function clearActiveCleanupTimeout() {
  if (activeCleanupTimeoutId === null || typeof window === "undefined") {
    return;
  }

  window.clearTimeout(activeCleanupTimeoutId);
  activeCleanupTimeoutId = null;
}

function setThemeSwitchMaskVariables(input: {
  maskSize: number;
  maskX: number;
  maskY: number;
}) {
  const rootStyle = document.documentElement.style;

  rootStyle.setProperty(THEME_SWITCH_MASK_SIZE_VAR, `${input.maskSize}px`);
  rootStyle.setProperty(THEME_SWITCH_MASK_X_VAR, `${input.maskX}px`);
  rootStyle.setProperty(THEME_SWITCH_MASK_Y_VAR, `${input.maskY}px`);
}

function clearThemeSwitchMaskVariables() {
  const rootStyle = document.documentElement.style;

  rootStyle.removeProperty(THEME_SWITCH_MASK_SIZE_VAR);
  rootStyle.removeProperty(THEME_SWITCH_MASK_X_VAR);
  rootStyle.removeProperty(THEME_SWITCH_MASK_Y_VAR);
}

function removeTransitionStyle() {
  document.getElementById(THEME_TRANSITION_CONFIG.styleId)?.remove();
}

function removeTransitionArtifacts() {
  clearActiveAnimationFrame();
  clearActiveCleanupTimeout();
  clearThemeSwitchMaskVariables();
  removeTransitionStyle();
}

function beginTransitionRun(): number {
  activeTransitionRunId += 1;
  removeTransitionArtifacts();
  return activeTransitionRunId;
}

function isActiveTransitionRun(runId: number): boolean {
  return runId === activeTransitionRunId;
}

function injectBaseStyles() {
  const existingStyle = document.getElementById(
    THEME_TRANSITION_CONFIG.baseStyleId,
  );
  if (existingStyle) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = THEME_TRANSITION_CONFIG.baseStyleId;
  styleElement.textContent = `
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
      mix-blend-mode: normal;
      backface-visibility: hidden;
    }
  `;
  document.head.appendChild(styleElement);
}

function buildBlurCircleStyle(input: {
  x: number;
  y: number;
  durationMs: number;
}): string {
  const blurMask = createBlurCircleMask(THEME_TRANSITION_CONFIG.blurAmount);

  return `
    ::view-transition-group(root) {
      animation: theme-switch-hold ${input.durationMs}ms ${THEME_TRANSITION_CONFIG.easing};
      isolation: isolate;
    }

    ::view-transition-old(root) {
      animation: theme-switch-hold ${input.durationMs}ms ${THEME_TRANSITION_CONFIG.easing};
      opacity: 1;
      z-index: -1;
    }

    ::view-transition-new(root) {
      animation: theme-switch-hold ${input.durationMs}ms ${THEME_TRANSITION_CONFIG.easing};
      z-index: 1;
      mask: ${blurMask}
        var(${THEME_SWITCH_MASK_X_VAR})
        var(${THEME_SWITCH_MASK_Y_VAR})
        /
        var(${THEME_SWITCH_MASK_SIZE_VAR})
        var(${THEME_SWITCH_MASK_SIZE_VAR})
        no-repeat;
      -webkit-mask: ${blurMask}
        var(${THEME_SWITCH_MASK_X_VAR})
        var(${THEME_SWITCH_MASK_Y_VAR})
        /
        var(${THEME_SWITCH_MASK_SIZE_VAR})
        var(${THEME_SWITCH_MASK_SIZE_VAR})
        no-repeat;
      transform-origin: ${input.x}px ${input.y}px;
      will-change: mask-size, mask-position;
    }

    @keyframes theme-switch-hold {
      from {
        opacity: 1;
      }

      to {
        opacity: 1;
      }
    }
  `;
}

function runThemeSwitchRuntime(input: {
  runId: number;
  durationMs: number;
  originX: number;
  originY: number;
  finalRadius: number;
}) {
  const startTime = performance.now();

  const step = (now: number) => {
    if (!isActiveTransitionRun(input.runId)) {
      return;
    }

    const elapsed = now - startTime;
    const timeProgress = Math.min(Math.max(elapsed / input.durationMs, 0), 1);
    const frame = getThemeSwitchMaskFrame({
      originX: input.originX,
      originY: input.originY,
      finalRadius: input.finalRadius,
      timeProgress,
    });

    setThemeSwitchMaskVariables({
      maskSize: frame.maskSize,
      maskX: frame.maskX,
      maskY: frame.maskY,
    });

    if (timeProgress >= 1) {
      activeAnimationFrameId = null;
      return;
    }

    activeAnimationFrameId = window.requestAnimationFrame(step);
  };

  clearActiveAnimationFrame();
  setThemeSwitchMaskVariables({
    maskSize: 0,
    maskX: input.originX,
    maskY: input.originY,
  });
  activeAnimationFrameId = window.requestAnimationFrame(step);
}

function scheduleCleanup(input: {
  runId: number;
  transition: ViewTransitionLike | undefined;
  durationMs: number;
}) {
  let cleaned = false;

  const cleanup = () => {
    if (cleaned || !isActiveTransitionRun(input.runId)) {
      return;
    }

    cleaned = true;
    removeTransitionArtifacts();
  };

  if (input.transition?.finished) {
    void input.transition.finished.catch(() => undefined).finally(cleanup);
  }

  clearActiveCleanupTimeout();
  activeCleanupTimeoutId = window.setTimeout(
    cleanup,
    input.durationMs + THEME_TRANSITION_CONFIG.cleanupBufferMs,
  );
}

async function startBlurCircleTransition(input: {
  runId: number;
  origin: {
    x: number;
    y: number;
  };
  transitionDocument: ThemeTransitionDocument;
  applyThemeDomWrite: () => void;
  durationMs: number;
}) {
  if (!isActiveTransitionRun(input.runId)) {
    return;
  }

  injectBaseStyles();
  removeTransitionStyle();

  const styleElement = document.createElement("style");
  styleElement.id = THEME_TRANSITION_CONFIG.styleId;
  styleElement.textContent = buildBlurCircleStyle({
    x: input.origin.x,
    y: input.origin.y,
    durationMs: input.durationMs,
  });
  document.head.appendChild(styleElement);

  setThemeSwitchMaskVariables({
    maskSize: 0,
    maskX: input.origin.x,
    maskY: input.origin.y,
  });

  const { finalRadius } = getThemeSwitchGeometry({
    x: input.origin.x,
    y: input.origin.y,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });

  let committed = false;

  try {
    const transition = input.transitionDocument.startViewTransition?.(() => {
      if (!isActiveTransitionRun(input.runId)) {
        return;
      }

      committed = true;
      input.applyThemeDomWrite();
    });

    await transition?.ready;

    if (!isActiveTransitionRun(input.runId)) {
      return;
    }

    runThemeSwitchRuntime({
      runId: input.runId,
      durationMs: input.durationMs,
      originX: input.origin.x,
      originY: input.origin.y,
      finalRadius,
    });
    scheduleCleanup({
      runId: input.runId,
      transition,
      durationMs: input.durationMs,
    });
  } catch {
    if (!isActiveTransitionRun(input.runId)) {
      return;
    }

    removeTransitionArtifacts();
    if (!committed) {
      input.applyThemeDomWrite();
    }
  }
}

export async function runBlurCircleTransition({
  sourceEl,
  applyThemeDomWrite,
  durationMs,
}: BlurCircleTransitionInput): Promise<void> {
  const runId = beginTransitionRun();

  if (!supportsThemeTransition(sourceEl)) {
    applyThemeDomWrite();
    return;
  }

  if (!sourceEl) {
    applyThemeDomWrite();
    return;
  }

  const transitionDocument = document as ThemeTransitionDocument;
  const origin = getTransitionOrigin(sourceEl);

  void startBlurCircleTransition({
    runId,
    origin,
    transitionDocument,
    applyThemeDomWrite,
    durationMs: resolveThemeTransitionDuration(durationMs),
  });
}
