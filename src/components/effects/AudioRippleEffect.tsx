'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export default function AudioRippleEffect() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleClick = (e: MouseEvent) => {
      const ripple: Ripple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        size: 0,
        opacity: 1,
      };
      setRipples((prev) => [...prev, ripple]);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    const updateRipples = () => {
      setRipples((prev) =>
        prev
          .map((r) => ({
            ...r,
            size: r.size + 2,
            opacity: r.opacity - 0.02,
          }))
          .filter((r) => r.opacity > 0)
      );
    };

    const interval = setInterval(updateRipples, 16);
    return () => clearInterval(interval);
  }, [isMounted]);

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ opacity: 1, scale: 0 }}
          animate={{ opacity: ripple.opacity, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed pointer-events-none rounded-full border-2 border-white/50"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size * 2,
            height: ripple.size * 2,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </AnimatePresence>
  );
}
