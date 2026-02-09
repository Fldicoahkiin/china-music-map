'use client';

import { useEffect, useState, useRef } from 'react';
import { ChinaMap } from '@/components/map/china-map';
import { Sidebar } from '@/components/sidebar/sidebar';
import { ZoomControl } from '@/components/map/zoom-control';
import { ThemeToggle } from '@/components/theme-toggle';
import { useMapStore } from '@/lib/store';
import { loadGenres, loadAllBands } from '@/lib/data-loader';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function GenreSelector() {
  const { genres, selectedGenre, selectGenre } = useMapStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentGenreName = selectedGenre || '独立音乐';

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-1"
      >
        <h1
          className="text-lg sm:text-xl font-semibold tracking-tight text-foreground"
          style={{ fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif' }}
        >
          中国
          <span className="text-primary">{currentGenreName}</span>
          地图
        </h1>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-all duration-200",
            (isHovered || isOpen) ? "opacity-100" : "opacity-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 py-2 px-1 bg-background border border-border rounded-lg shadow-lg min-w-[140px] z-50"
          >
            <button
              onClick={() => {
                selectGenre(null);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 text-sm text-left rounded hover:bg-muted transition-colors",
                !selectedGenre && "text-primary font-medium"
              )}
            >
              全部流派
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => {
                  selectGenre(genre.name);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-1.5 text-sm text-left rounded hover:bg-muted transition-colors",
                  selectedGenre === genre.name && "text-primary font-medium"
                )}
              >
                {genre.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BandCount() {
  const { bands, selectedGenre, genreFilteredBands } = useMapStore();
  const count = selectedGenre ? genreFilteredBands.length : bands.length;

  return (
    <div className="text-xs text-muted-foreground">
      共 <span className="font-medium text-foreground">{count}</span> 支乐队
    </div>
  );
}

export default function Home() {
  const { setBands, setGenres } = useMapStore();

  useEffect(() => {
    const loadData = async () => {
      const [genres, bands] = await Promise.all([
        loadGenres(),
        loadAllBands(),
      ]);
      setGenres(genres);
      setBands(bands);
    };
    loadData();
  }, [setBands, setGenres]);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0">
        <ChinaMap />
      </div>

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-center p-4 sm:p-6">
          {/* Center: Title with Genre Selector */}
          <div className="pointer-events-auto">
            <GenreSelector />
          </div>

          {/* Right: Theme Toggle */}
          <div className="absolute right-4 sm:right-6 pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Bottom Left: Band Count */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10">
        <BandCount />
      </div>

      {/* Right: Zoom Control */}
      <ZoomControl />

      {/* Sidebar */}
      <Sidebar />
    </main>
  );
}
