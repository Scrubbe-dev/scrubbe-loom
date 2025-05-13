import * as React from "react";
import { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24">
      {/* Your logo SVG path */}
    </svg>
  ),
  dashboard: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24">
      {/* Dashboard icon */}
    </svg>
  ),
  incident: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24">
      {/* Incident icon */}
    </svg>
  ),
  alert: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24">
      {/* Alert icon */}
    </svg>
  ),
  integration: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24">
      {/* Integration icon */}
    </svg>
  ),
  report: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24">
      {/* Report icon */}
    </svg>
  ),
  plus: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  download: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  clock: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};