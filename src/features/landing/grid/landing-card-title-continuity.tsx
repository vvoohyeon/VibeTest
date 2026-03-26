'use client';

import {type RefObject, useEffect, useState} from 'react';
import {useLayoutEffect} from 'react';

interface LandingCardTitleSplit {
  line1Text: string;
  overflowText: string;
}

interface UseLandingCardTitleSplitInput {
  enabled: boolean;
  freeze: boolean;
  text: string;
  titleRef: RefObject<HTMLElement | null>;
}

function createDefaultSplit(text: string): LandingCardTitleSplit {
  return {
    line1Text: text,
    overflowText: ''
  };
}

function isSameSplit(left: LandingCardTitleSplit, right: LandingCardTitleSplit): boolean {
  return left.line1Text === right.line1Text && left.overflowText === right.overflowText;
}

function buildTitleProbe(titleElement: HTMLElement): HTMLElement {
  const probe = document.createElement(titleElement.tagName.toLowerCase());
  const computedStyle = window.getComputedStyle(titleElement);
  probe.className = 'landing-grid-card-title landing-grid-card-title-probe';
  probe.style.width = `${titleElement.getBoundingClientRect().width}px`;
  probe.style.font = computedStyle.font;
  probe.style.fontFamily = computedStyle.fontFamily;
  probe.style.fontSize = computedStyle.fontSize;
  probe.style.fontStyle = computedStyle.fontStyle;
  probe.style.fontStretch = computedStyle.fontStretch;
  probe.style.fontVariant = computedStyle.fontVariant;
  probe.style.fontWeight = computedStyle.fontWeight;
  probe.style.letterSpacing = computedStyle.letterSpacing;
  probe.style.lineHeight = computedStyle.lineHeight;
  probe.style.textTransform = computedStyle.textTransform;
  return probe;
}

function fitsSingleLine(probe: HTMLElement, text: string, singleLineHeight: number): boolean {
  probe.textContent = text;
  return probe.getBoundingClientRect().height <= singleLineHeight + 0.5;
}

function measureLandingCardTitleSplit(titleElement: HTMLElement, text: string): LandingCardTitleSplit {
  if (text.length <= 1) {
    return createDefaultSplit(text);
  }

  const titleWidth = titleElement.getBoundingClientRect().width;
  if (!Number.isFinite(titleWidth) || titleWidth <= 0) {
    return createDefaultSplit(text);
  }

  const probe = buildTitleProbe(titleElement);
  document.body.appendChild(probe);

  try {
    probe.textContent = 'A';
    const measuredSingleLineHeight = probe.getBoundingClientRect().height;
    const computedLineHeight = Number.parseFloat(window.getComputedStyle(titleElement).lineHeight);
    const singleLineHeight = Number.isFinite(computedLineHeight) ? computedLineHeight : measuredSingleLineHeight;

    if (!Number.isFinite(singleLineHeight) || singleLineHeight <= 0 || fitsSingleLine(probe, text, singleLineHeight)) {
      return createDefaultSplit(text);
    }

    let low = 1;
    let high = text.length - 1;
    let bestPrefixLength = 1;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);

      if (fitsSingleLine(probe, text.slice(0, middle), singleLineHeight)) {
        bestPrefixLength = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    return {
      line1Text: text.slice(0, bestPrefixLength),
      overflowText: text.slice(bestPrefixLength)
    };
  } finally {
    probe.remove();
  }
}

export function useLandingCardTitleSplit({
  enabled,
  freeze,
  text,
  titleRef
}: UseLandingCardTitleSplitInput): LandingCardTitleSplit {
  const [split, setSplit] = useState<LandingCardTitleSplit>(() => createDefaultSplit(text));

  useEffect(() => {
    setSplit(createDefaultSplit(text));
  }, [text]);

  useLayoutEffect(() => {
    if (!enabled) {
      setSplit(createDefaultSplit(text));
      return;
    }

    if (freeze) {
      return;
    }

    const titleElement = titleRef.current;
    if (!titleElement || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    let frame = 0;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const measure = () => {
      if (cancelled) {
        return;
      }

      const nextSplit = measureLandingCardTitleSplit(titleElement, text);
      setSplit((previous) => (isSameSplit(previous, nextSplit) ? previous : nextSplit));
    };

    const scheduleMeasure = () => {
      if (cancelled) {
        return;
      }

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    scheduleMeasure();

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleMeasure();
      });
      resizeObserver.observe(titleElement);
    }

    void document.fonts?.ready?.then(() => {
      scheduleMeasure();
    });

    return () => {
      cancelled = true;
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      resizeObserver?.disconnect();
    };
  }, [enabled, freeze, text, titleRef]);

  return split;
}
