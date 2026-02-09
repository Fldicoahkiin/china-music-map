'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export function ZoomControl() {
  const [zoom, setZoom] = useState(1.2);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  const updateZoom = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).__mapGetZoom) {
      const currentZoom = (window as any).__mapGetZoom();
      if (typeof currentZoom === 'number' && !isNaN(currentZoom)) {
        setZoom(currentZoom);
      }
    }
  }, []);

  // 监听地图缩放变化事件
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleZoomChange = () => {
      updateZoom();
      setVisible(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (!hovered) setVisible(false);
      }, 2500);
    };

    window.addEventListener('mapZoomChanged', handleZoomChange);
    updateZoom();

    return () => {
      window.removeEventListener('mapZoomChanged', handleZoomChange);
      clearTimeout(hideTimeout);
    };
  }, [updateZoom, hovered]);

  // 监听鼠标位置显示控件
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth - e.clientX < 80) {
        setVisible(true);
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          if (!hovered) setVisible(false);
        }, 2500);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimeout);
    };
  }, [hovered]);

  const handleZoom = (delta: number) => {
    if (typeof window !== 'undefined' && (window as any).__mapZoom) {
      (window as any).__mapZoom(delta);
    }
  };

  const handleReset = () => {
    if (typeof window !== 'undefined' && (window as any).__mapReset) {
      (window as any).__mapReset();
    }
  };

  // 计算缩放百分比 (0.8 - 12 -> 0% - 100%)
  const percentage = Math.round(((zoom - 0.8) / (12 - 0.8)) * 100);
  const displayZoom = zoom.toFixed(1);

  return (
    <div
      className={cn(
        "absolute right-4 top-1/2 -translate-y-1/2 z-20",
        "transition-all duration-200 ease-out",
        visible || hovered
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-2 pointer-events-none"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 极简垂直控件 */}
      <div className="flex flex-col items-center gap-0">
        {/* 放大 */}
        <button
          onClick={() => handleZoom(0.8)}
          disabled={zoom >= 12}
          className={cn(
            "w-9 h-9 flex items-center justify-center",
            "text-foreground/50 hover:text-foreground",
            "hover:bg-foreground/5 active:bg-foreground/10",
            "rounded-t-lg transition-colors",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
          aria-label="放大"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="7" y1="2" x2="7" y2="12" />
            <line x1="2" y1="7" x2="12" y2="7" />
          </svg>
        </button>

        {/* 缩放指示器 */}
        <div className="relative w-9 h-20 flex items-center justify-center">
          {/* 背景轨道 */}
          <div className="absolute w-[2px] h-14 bg-foreground/10 rounded-full" />

          {/* 填充进度 */}
          <div
            className="absolute w-[2px] bg-foreground/30 rounded-full transition-all duration-150"
            style={{
              height: `${percentage * 0.56}px`,
              bottom: '12px'
            }}
          />

          {/* 当前位置指示点 */}
          <div
            className={cn(
              "absolute w-2 h-2 rounded-full",
              "bg-foreground/60 shadow-sm",
              "transition-all duration-150"
            )}
            style={{
              bottom: `calc(12px + ${percentage * 0.56}px - 4px)`
            }}
          />

          {/* 缩放数值 - 悬停时显示 */}
          <div className={cn(
            "absolute -left-10 text-[10px] font-medium text-foreground/40",
            "transition-opacity duration-150",
            hovered ? "opacity-100" : "opacity-0"
          )}>
            {displayZoom}×
          </div>
        </div>

        {/* 缩小 */}
        <button
          onClick={() => handleZoom(-0.8)}
          disabled={zoom <= 0.8}
          className={cn(
            "w-9 h-9 flex items-center justify-center",
            "text-foreground/50 hover:text-foreground",
            "hover:bg-foreground/5 active:bg-foreground/10",
            "transition-colors",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
          aria-label="缩小"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="7" x2="12" y2="7" />
          </svg>
        </button>

        {/* 分隔线 */}
        <div className="w-5 h-[1px] bg-foreground/10 my-0.5" />

        {/* 归位 */}
        <button
          onClick={handleReset}
          className={cn(
            "w-9 h-9 flex items-center justify-center",
            "text-foreground/50 hover:text-foreground",
            "hover:bg-foreground/5 active:bg-foreground/10",
            "rounded-b-lg transition-colors"
          )}
          aria-label="归位"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="4" />
            <circle cx="7" cy="7" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
