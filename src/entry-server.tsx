import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppCore } from "./app/App";

/** Build-time prerender of the landing page so the hero paints straight from HTML. */
export function render(url: string) {
  return renderToString(
    <StaticRouter location={url} basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <AppCore />
    </StaticRouter>,
  );
}
