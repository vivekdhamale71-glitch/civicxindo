import { forwardRef } from "react";
import { Link, NavLink, type LinkProps, type NavLinkProps } from "react-router-dom";
import { preload } from "@/app/lazy";

const pathOf = (to: LinkProps["to"]) => (typeof to === "string" ? to : to.pathname ?? "/");

/** Link that preloads the next route's code on hover, focus or touchstart. */
export const PLink = forwardRef<HTMLAnchorElement, LinkProps>(({ to, onMouseEnter, onTouchStart, onFocus, ...p }, ref) => (
  <Link
    ref={ref}
    to={to}
    onMouseEnter={(e) => { preload(pathOf(to)); onMouseEnter?.(e); }}
    onTouchStart={(e) => { preload(pathOf(to)); onTouchStart?.(e); }}
    onFocus={(e) => { preload(pathOf(to)); onFocus?.(e); }}
    {...p}
  />
));
PLink.displayName = "PLink";

export const PNavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ to, onMouseEnter, onTouchStart, ...p }, ref) => (
  <NavLink
    ref={ref}
    to={to}
    onMouseEnter={(e) => { preload(pathOf(to)); onMouseEnter?.(e); }}
    onTouchStart={(e) => { preload(pathOf(to)); onTouchStart?.(e); }}
    {...p}
  />
));
PNavLink.displayName = "PNavLink";
