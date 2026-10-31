// Smoothly moves a set of numbers toward new targets, for morphing drawings (Capy's face, the ring).
import { useEffect, useRef, useState } from 'react';
import { Easing } from 'react-native';

import { curves } from './theme';
import { useReducedMotion } from './useReducedMotion';

const ease = Easing.bezier(...curves.out);

export function useTween<T extends Record<string, number>>(target: T, ms = 420): T {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(target);
  const current = useRef(target);
  const key = JSON.stringify(target);

  useEffect(() => {
    if (reduce) {
      current.current = target;
      setValue(target);
      return;
    }
    const from = current.current;
    const start = Date.now();
    let frame = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / ms);
      const e = ease(t);
      const next = {} as Record<string, number>;
      for (const k of Object.keys(target)) next[k] = (from[k] ?? target[k]) + (target[k] - (from[k] ?? target[k])) * e;
      current.current = next as T;
      setValue(next as T);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [key, reduce]);

  return value;
}
