'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Band } from '@/types/band';

interface BandDetailDialogProps {
  band: Band | null;
  open: boolean;
  onClose: () => void;
}

export function BandDetailDialog({ band, open, onClose }: BandDetailDialogProps) {
  if (!band) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-[60]"
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background border border-border rounded-xl z-[61] overflow-hidden"
          >
            {/* 头部 */}
            <header className="flex items-start gap-4 p-6 pb-4">
              {/* 头像 */}
              <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 overflow-hidden">
                {band.avatar ? (
                  <img
                    src={band.avatar}
                    alt={band.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-background text-xl font-semibold">
                    {band.name[0]}
                  </span>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  {band.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {band.genre} · {band.city}
                  {band.foundedYear && ` · ${band.foundedYear}`}
                </p>
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* 内容区 */}
            <div className="px-6 pb-6 space-y-5">
              {/* 代表作品 */}
              {band.albums && band.albums.length > 0 && (
                <section>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
                <section>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
        </>
      )}
    </AnimatePresence>
  );
}
