'use client';

import { Menu, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useState } from 'react';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { AppNavLinks } from './app-nav-links';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menüyü aç">
          <Menu aria-hidden="true" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-surface p-4 lg:hidden">
          <DialogPrimitive.Title className="sr-only">Menü</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Çalışma alanının ana bölümleri
          </DialogPrimitive.Description>
          <div className="mb-6 flex items-center justify-between">
            <Logo href="/panel" />
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Menüyü kapat">
                <X aria-hidden="true" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <nav aria-label="Çalışma alanı">
            <AppNavLinks onNavigate={() => setOpen(false)} />
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
