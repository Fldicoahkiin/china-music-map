'use client';

import { useMemo } from 'react';
import { useMapStore } from '@/lib/store';
import { BandCard } from '@/components/band/band-card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { Band } from '@/types/band';

function BandDetail({ band, onBack }: { band: Band; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-full"
    >
      {/* 返回按钮 */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回列表</span>
        </button>
      </div>

      {/* 乐队信息 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* 头像和基本信息 */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 overflow-hidden">
            {band.avatar ? (
              <img
                src={band.avatar}
                alt={band.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-background text-2xl font-semibold">
                {band.name[0]}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {band.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {band.genre} · {band.city}
              {band.foundedYear && ` · ${band.foundedYear}`}
            </p>
          </div>
        </div>

        {/* 代表作品 */}
        {band.albums && band.albums.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              代表作品
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {band.albums.map((album) => (
                <span
                  key={album}
                  className="px-2.5 py-1 text-sm bg-muted rounded"
                >
                  {album}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 简介 */}
        {band.description && (
          <section className="mb-6">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              简介
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {band.description}
            </p>
          </section>
        )}

        {/* 外链 */}
        {band.links && Object.keys(band.links).length > 0 && (
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              链接
            </h3>
            <div className="flex flex-wrap gap-2">
              {band.links.netease && (
                <a
                  href={band.links.netease}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
                >
                  网易云
                </a>
              )}
              {band.links.douban && (
                <a
                  href={band.links.douban}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
                >
                  豆瓣
                </a>
              )}
              {band.links.spotify && (
                <a
                  href={band.links.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
                >
                  Spotify
                </a>
              )}
              {band.links.bandcamp && (
                <a
                  href={band.links.bandcamp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
                >
                  Bandcamp
                </a>
              )}
              {band.links.bilibili && (
                <a
                  href={band.links.bilibili}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
                >
                  B站
                </a>
              )}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
}

export function Sidebar() {
  const {
    selectedProvince,
    selectProvince,
    provinceBands,
    searchQuery,
    setSearchQuery,
    selectedBand,
    setSelectedBand,
  } = useMapStore();

  const filteredBands = useMemo(() => {
    if (!searchQuery.trim()) return provinceBands;
    const query = searchQuery.toLowerCase();
    return provinceBands.filter(band =>
      band.name.toLowerCase().includes(query) ||
      band.city.toLowerCase().includes(query) ||
      band.genre.toLowerCase().includes(query)
    );
  }, [provinceBands, searchQuery]);

  const genreStats = useMemo(() => {
    const stats: Record<string, number> = {};
    provinceBands.forEach(band => {
      stats[band.genre] = (stats[band.genre] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [provinceBands]);

  return (
    <AnimatePresence>
      {selectedProvince && (
        <motion.aside
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="fixed left-0 top-0 bottom-0 w-[380px] bg-background border-r border-border z-50 flex flex-col"
        >
          <AnimatePresence mode="wait">
            {selectedBand ? (
              <BandDetail
                key="detail"
                band={selectedBand}
                onBack={() => setSelectedBand(null)}
              />
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col h-full"
              >
                {/* 头部 */}
                <header className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => selectProvince(null)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm">返回</span>
                    </button>
                  </div>

                  <h1 className="text-2xl font-semibold tracking-tight">
                    {selectedProvince}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {provinceBands.length} 支乐队
                  </p>

                  {/* 流派标签 */}
                  {genreStats.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {genreStats.slice(0, 4).map(([genre, count]) => (
                        <span
                          key={genre}
                          className="px-2.5 py-1 text-xs bg-muted text-muted-foreground rounded"
                        >
                          {genre} · {count}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                {/* 搜索 */}
                <div className="flex-shrink-0 px-6 py-4">
                  <input
                    type="text"
                    placeholder="搜索乐队..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 px-4 bg-muted border-0 rounded text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                  />
                </div>

                {/* 乐队列表 */}
                <div className="flex-1 overflow-y-auto px-4 pb-6">
                  {filteredBands.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? '没有匹配的乐队' : '暂无乐队'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredBands.map((band, index) => (
                        <BandCard
                          key={band.id}
                          band={band}
                          index={index}
                          onClick={() => setSelectedBand(band)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
