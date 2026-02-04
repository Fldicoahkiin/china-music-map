'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BandAvatar } from './band-avatar';
import { motion } from 'framer-motion';
import type { Band } from '@/types/band';

interface BandCardProps {
  band: Band;
  index?: number;
  onClick?: () => void;
}

export function BandCard({ band, index = 0, onClick }: BandCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className="mb-3 hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
        onClick={onClick}
      >
        <CardContent className="flex items-center p-4">
          <BandAvatar band={band} size="md" />

          <div className="ml-4 flex-1">
            <h4 className="font-semibold text-lg">{band.name}</h4>
            <p className="text-sm text-muted-foreground">
              {band.genre} · {band.city}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
