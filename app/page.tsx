'use client';

import { useEffect } from 'react';
import { ChinaMap } from '@/components/map/china-map';
import { Sidebar } from '@/components/sidebar/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useMapStore } from '@/lib/store';
import { loadGenres, loadAllBands } from '@/lib/data-loader';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { setBands, setGenres, setSidebarOpen } = useMapStore();

  useEffect(() => {
    // 加载数据
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
      {/* Map Container - Full Screen */}
      <div className="absolute inset-0">
        <ChinaMap />
      </div>

      {/* Overlay Header - Floating on Map */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between p-4 sm:p-6">
          {/* Left: Menu Button */}
          <div className="pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Center: Title */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
              中国独立音乐地图
            </h1>
          </div>

          {/* Right: Theme Toggle */}
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar />
    </main>
  );
}
