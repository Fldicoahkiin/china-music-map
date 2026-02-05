'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BandCard } from '@/components/band/band-card';
import { BandDetailDialog } from '@/components/band/band-detail-dialog';
import { useMapStore } from '@/lib/store';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export function Sidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    selectedProvince,
    provinceBands,
    searchQuery,
    setSearchQuery,
    selectedBand,
    setSelectedBand,
  } = useMapStore();

  return (
    <>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-full sm:w-[400px] md:w-[480px]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SheetHeader>
              <SheetTitle className="text-2xl">
                {selectedProvince || '所有地区'}的乐队
              </SheetTitle>
              <SheetDescription>
                共 {provinceBands.length} 支乐队
              </SheetDescription>
            </SheetHeader>

            {/* 搜索框 */}
            <div className="mt-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索乐队名称、城市..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 乐队列表 */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                乐队列表
              </h3>
              <ScrollArea className="h-[calc(100vh-280px)]">
                {provinceBands.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    暂无乐队数据
                  </p>
                ) : (
                  provinceBands.map((band, index) => (
                    <BandCard
                      key={band.id}
                      band={band}
                      index={index}
                      onClick={() => setSelectedBand(band)}
                    />
                  ))
                )}
              </ScrollArea>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>

      {/* 乐队详情弹窗 */}
      <BandDetailDialog
        band={selectedBand}
        open={selectedBand !== null}
        onClose={() => setSelectedBand(null)}
      />
    </>
  );
}
