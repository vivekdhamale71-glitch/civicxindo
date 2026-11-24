import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";

const SheetImpl = lazy(() => import("./sheet").then((m) => ({ default: m.Sheet })));

/** Sheet for always-mounted shell components: the dialog code loads on first open, keeping it out of the first-load bundle. */
export function LazySheet(props: ComponentProps<typeof SheetImpl>) {
  const [armed, setArmed] = useState(props.open);
  useEffect(() => {
    if (props.open) setArmed(true);
  }, [props.open]);
  if (!armed) return null;
  return (
    <Suspense fallback={null}>
      <SheetImpl {...props} />
    </Suspense>
  );
}
