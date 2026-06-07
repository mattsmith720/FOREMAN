/** Viewport + state matrix for Visual QA harness (VF2). */

export const VIEWPORTS = {
  androidMid: { width: 360, height: 800 },
  iphoneSe: { width: 375, height: 667 },
  iphone14: { width: 390, height: 844 },
  iphone14ProMax: { width: 430, height: 932 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

export type ViewportKey = keyof typeof VIEWPORTS;

export const IN_JOB_VIEWPORTS: ViewportKey[] = [
  "androidMid",
  "iphoneSe",
  "iphone14",
  "iphone14ProMax",
];

export const OPS_VIEWPORTS: ViewportKey[] = ["tablet", "desktop", "iphone14"];

export const MARKETING_VIEWPORTS: ViewportKey[] = ["iphone14", "desktop"];

export const TEXT_ZOOM_LEVELS = [100, 130, 160] as const;

export interface SurfaceRoute {
  id: string;
  path: string;
  readySelector: string;
  viewports: ViewportKey[];
}

export const SURFACES: SurfaceRoute[] = [
  {
    id: "boot-consent",
    path: "/",
    readySelector: 'button:has-text("start job")',
    viewports: IN_JOB_VIEWPORTS,
  },
  {
    id: "welcome",
    path: "/welcome",
    readySelector: "h1",
    viewports: MARKETING_VIEWPORTS,
  },
  {
    id: "demo",
    path: "/demo",
    readySelector: 'button:has-text("Start demo job")',
    viewports: MARKETING_VIEWPORTS,
  },
  {
    id: "ops-login",
    path: "/ops",
    readySelector: 'input[aria-label="Ops password"]',
    viewports: OPS_VIEWPORTS,
  },
  {
    id: "dashboard-login",
    path: "/dashboard",
    readySelector: 'input[aria-label="Ops password"]',
    viewports: OPS_VIEWPORTS,
  },
];
