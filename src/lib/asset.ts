/**
 * Changes on every deploy (git commit on Vercel, build time locally). Set in next.config.ts.
 * Used to bust caches for files in /public and to tell open tabs a new version is live.
 */
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

/**
 * Versioned URL for a file in /public, e.g. asset("/images/x.png") → "/images/x.png?v=ab12cd34".
 * Replacing an image under the same filename then shows up after the next deploy, instead of
 * Vercel and browsers serving the old copy for hours.
 */
export const asset = (path: string) => `${path}${path.includes("?") ? "&" : "?"}v=${BUILD_ID}`;
