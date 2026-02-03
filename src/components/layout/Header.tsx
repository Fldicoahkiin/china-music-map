'use client';

import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/useThemeStore';

export default function Header() {
  const { currentGenre } = useThemeStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4">
        <motion.h1
          className="text-2xl font-bold"
          style={{ color: currentGenre.accentColor }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          China Music Map
        </motion.h1>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            Search
          </button>
        </div>
      </div>
    </header>
  );
}
