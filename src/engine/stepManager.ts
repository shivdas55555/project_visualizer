import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExecutionTrace, ExecutionTraceStep } from './types';

export type PlaybackSpeed = 0.5 | 1 | 2;

export interface StepPlayer {
  currentIndex: number;
  currentStep: ExecutionTraceStep | null;
  /** Every step from 0..currentIndex — visualizers fold over this to build the "current snapshot". */
  stepsSoFar: ExecutionTraceStep[];
  isPlaying: boolean;
  speed: PlaybackSpeed;
  total: number;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  restart: () => void;
  seek: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
}

const BASE_INTERVAL_MS = 700;

/**
 * Drives playback over an ExecutionTrace. This is the ONE place that knows
 * about play/pause/speed timing — visualizers, the code viewer, and the
 * explanation panel all just read `currentStep` / `stepsSoFar` from here.
 */
export function useStepPlayer(trace: ExecutionTrace): StepPlayer {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = nothing shown yet
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const timerRef = useRef<number | null>(null);

  // Reset playback whenever the trace itself changes (new problem/strategy).
  useEffect(() => {
    setCurrentIndex(trace.length > 0 ? 0 : -1);
    setIsPlaying(false);
  }, [trace]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentIndex >= trace.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setCurrentIndex((i) => Math.min(i + 1, trace.length - 1));
    }, BASE_INTERVAL_MS / speed);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, speed, trace.length]);

  const play = useCallback(() => {
    if (trace.length === 0) return;
    if (currentIndex >= trace.length - 1) setCurrentIndex(0);
    setIsPlaying(true);
  }, [currentIndex, trace.length]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const next = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex((i) => Math.min(i + 1, trace.length - 1));
  }, [trace.length]);

  const prev = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const restart = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(trace.length > 0 ? 0 : -1);
  }, [trace.length]);

  const seek = useCallback(
    (index: number) => {
      setIsPlaying(false);
      setCurrentIndex(Math.max(0, Math.min(index, trace.length - 1)));
    },
    [trace.length]
  );

  const currentStep = currentIndex >= 0 ? trace[currentIndex] ?? null : null;
  const stepsSoFar = currentIndex >= 0 ? trace.slice(0, currentIndex + 1) : [];

  return {
    currentIndex,
    currentStep,
    stepsSoFar,
    isPlaying,
    speed,
    total: trace.length,
    play,
    pause,
    next,
    prev,
    restart,
    seek,
    setSpeed,
  };
}
