'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GENRE_COLORS } from '@/lib/constants';
import type { Band } from '@/types/band';

interface BandAvatarProps {
  band: Band;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12 text-lg',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-20 h-20 text-3xl',
};

export function BandAvatar({ band, size = 'md', className = '' }: BandAvatarProps) {
  const backgroundColor = GENRE_COLORS[band.genre] || '#94a3b8';

  return (
    <Avatar className={`${sizeClasses[size]} ring-2 ring-white ring-offset-2 ${className}`}>
      <AvatarImage src={band.avatar} alt={band.name} />
      <AvatarFallback
        style={{ backgroundColor }}
        className="text-white font-bold"
      >
        {band.name[0]}
      </AvatarFallback>
    </Avatar>
  );
}
