'use client';

import { motion } from 'framer-motion';
import type { Band } from '@/types/band';

interface BandCardProps {
  band: Band;
  index?: number;
  onClick?: () => void;
}

export function BandCard({ band, index = 0, onClick }: BandCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: Math.min(index * 0.02, 0.3),
        ease: [0.4, 0, 0.2, 1]
      }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left group"
    >
      {/* 头像 */}
      <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 overflow-hidden">
        {band.avatar ? (
          <img
            src={band.avatar}
            alt={band.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-background text-sm font-semibold">
            {band.name[0]}
          </span>
        )}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {band.name}
        </h4>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {band.genre} · {band.city}
        </p>
      </div>

      {/* 箭头 */}
      <svg
        className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}
