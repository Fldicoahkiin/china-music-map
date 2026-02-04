'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BandAvatar } from './band-avatar';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import type { Band } from '@/types/band';

interface BandDetailDialogProps {
  band: Band | null;
  open: boolean;
  onClose: () => void;
}

export function BandDetailDialog({ band, open, onClose }: BandDetailDialogProps) {
  if (!band) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <BandAvatar band={band} size="lg" />
              <div>
                <DialogTitle className="text-3xl">{band.name}</DialogTitle>
                <p className="text-muted-foreground mt-1">
                  {band.genre} · {band.city}
                  {band.foundedYear && ` · ${band.foundedYear}`}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* 代表作品 */}
          {band.albums && band.albums.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">代表作品</h3>
              <div className="flex flex-wrap gap-2">
                {band.albums.map((album) => (
                  <span
                    key={album}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {album}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 简介 */}
          {band.description && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">简介</h3>
              <p className="text-muted-foreground leading-relaxed">
                {band.description}
              </p>
            </div>
          )}

          {/* 外链 */}
          {band.links && Object.keys(band.links).length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">相关链接</h3>
              <div className="flex flex-wrap gap-3">
                {band.links.netease && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={band.links.netease} target="_blank" rel="noopener noreferrer">
                      网易云音乐 <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {band.links.douban && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={band.links.douban} target="_blank" rel="noopener noreferrer">
                      豆瓣 <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {band.links.spotify && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={band.links.spotify} target="_blank" rel="noopener noreferrer">
                      Spotify <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {band.links.bandcamp && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={band.links.bandcamp} target="_blank" rel="noopener noreferrer">
                      Bandcamp <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {band.links.bilibili && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={band.links.bilibili} target="_blank" rel="noopener noreferrer">
                      B站 <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
