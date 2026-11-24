import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, m, useDragControls, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { spring, ease } from "@/lib/motion";
import { useIsDesktop } from "@/lib/hooks";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

interface SheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

/** Bottom sheet on mobile (drag to dismiss, velocity-aware), centred dialog on desktop. */
export function Sheet({ open, onOpenChange, title, description, children, footer, wide }: SheetProps) {
  const desktop = useIsDesktop();
  const controls = useDragControls();
  const { openSheet, closeSheet } = useUI();
  const { t } = useT();

  React.useEffect(() => {
    if (!open) return;
    openSheet();
    return () => closeSheet();
  }, [open, openSheet, closeSheet]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-[60] bg-[#0B1222]/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: ease.out }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              onOpenAutoFocus={(e) => {
                // Focus the sheet itself (announced by screen readers) instead of ringing the close button.
                const first = (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('[autofocus], input:not([type="file"]):not([tabindex="-1"]), textarea, select');
                if (first) return;
                e.preventDefault();
                (e.currentTarget as HTMLElement | null)?.focus();
              }}
            >
              {desktop ? (
                <m.div
                  className={cn("fixed left-1/2 top-1/2 z-[61] flex max-h-[85vh] w-[calc(100vw-48px)] flex-col overflow-hidden rounded-sheet bg-card shadow-lift focus:outline-none", wide ? "max-w-[720px]" : "max-w-[520px]")}
                  style={{ x: "-50%", y: "-50%" }}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={spring.smooth}
                >
                  <Header title={title} description={description} closeLabel={t("common.close")} />
                  <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
                  {footer && <div className="border-t border-line/[0.08] px-6 py-4">{footer}</div>}
                </m.div>
              ) : (
                <m.div
                  className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[92vh] flex-col rounded-t-sheet bg-card pb-safe shadow-sheet focus:outline-none"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={spring.smooth}
                  drag="y"
                  dragControls={controls}
                  dragListener={false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0.05, bottom: 0.7 }}
                  onDragEnd={onDragEnd}
                >
                  <div className="flex cursor-grab touch-none justify-center pb-1 pt-3" onPointerDown={(e) => controls.start(e)}>
                    <span className="h-1.5 w-10 rounded-full bg-ink/20" aria-hidden />
                  </div>
                  <div onPointerDown={(e) => controls.start(e)} className="touch-none">
                    <Header title={title} description={description} closeLabel={t("common.close")} />
                  </div>
                  <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
                  {footer && <div className="border-t border-line/[0.08] px-4 py-3">{footer}</div>}
                </m.div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Header({ title, description, closeLabel }: { title: React.ReactNode; description?: React.ReactNode; closeLabel: string }) {
  return (
    <div className="flex items-start gap-4 px-4 pb-3 pt-2 md:px-6 md:pt-6">
      <div className="min-w-0 flex-1">
        <Dialog.Title className="text-lg font-semibold text-ink">{title}</Dialog.Title>
        {description ? <Dialog.Description className="mt-1 text-sm text-body">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
      </div>
      <Dialog.Close className="-mr-2 -mt-1 flex size-11 items-center justify-center rounded-full text-muted hover:bg-ink/[0.06] hover:text-ink" aria-label={closeLabel}>
        <X className="size-5" />
      </Dialog.Close>
    </div>
  );
}
