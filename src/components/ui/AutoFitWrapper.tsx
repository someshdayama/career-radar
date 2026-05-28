"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./AutoFitWrapper.module.css";

interface AutoFitWrapperProps {
  children: React.ReactNode;
  contentDependencies: unknown[];
  fitToSinglePage?: boolean;
  onZoomChange?: (zoom: number) => void;
}

/**
 * AutoFitWrapper scales the resume preview using CSS `zoom`.
 * 
 * Key design decisions:
 * - Uses CSS `zoom` (not transform: scale) because zoom shrinks LAYOUT dimensions,
 *   not just the visual output. This means both screen and print contexts see the
 *   same scaled dimensions.
 * - Exposes `onZoomChange` so the parent (page.tsx) can inject the exact same zoom
 *   value into react-to-print's pageStyle for pixel-perfect PDF output.
 * - The canvas uses overflow:hidden on screen (clips excess), but the print target
 *   is a SEPARATE hidden div that renders the template at natural size — no clipping.
 */
export default function AutoFitWrapper({
  children,
  contentDependencies,
  fitToSinglePage = true,
  onZoomChange,
}: AutoFitWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasHeight, setCanvasHeight] = useState("297mm");

  const calculateZoom = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;

    // Reset zoom so we measure the natural un-zoomed dimensions
    contentRef.current.style.zoom = "1";

    const canvasWidth = containerRef.current.clientWidth;
    if (!canvasWidth) return;

    // A4 proportion: height = width × (297 / 210)
    const targetHeight = (canvasWidth / 210) * 297;

    // Measure natural content height at zoom=1
    const contentHeight = contentRef.current.scrollHeight;
    if (!contentHeight) return;

    let finalZoom = 1;
    let finalCanvasHeight: string;

    if (fitToSinglePage) {
      if (contentHeight > targetHeight * 1.01) {
        // Too tall — zoom down to fit exactly in A4 height
        finalZoom = targetHeight / contentHeight;
        finalZoom = Math.max(finalZoom, 0.3);
        finalCanvasHeight = `${targetHeight}px`;
      } else if (contentHeight >= targetHeight * 0.8) {
        // Near A4 height — zoom to fill exactly
        finalZoom = targetHeight / contentHeight;
        finalZoom = Math.max(finalZoom, 0.4);
        finalCanvasHeight = `${targetHeight}px`;
      } else {
        // Short content — no zoom, shrink canvas to content
        finalZoom = 1;
        finalCanvasHeight = `${contentHeight + 8}px`;
      }
    } else {
      // Multi-page mode — no zoom, natural height
      finalZoom = 1;
      finalCanvasHeight = `${contentHeight + 8}px`;
    }

    // Apply zoom inline immediately (before React re-render to avoid flash)
    contentRef.current.style.zoom = String(finalZoom);

    setZoom(finalZoom);
    setCanvasHeight(finalCanvasHeight);
    onZoomChange?.(finalZoom);
  }, [fitToSinglePage, onZoomChange]);

  useEffect(() => {
    // Small delay allows DOM to fully render fonts/images before measuring
    const timeoutId = setTimeout(calculateZoom, 120);
    window.addEventListener("resize", calculateZoom);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateZoom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...contentDependencies, fitToSinglePage, calculateZoom]);

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.canvas}
        ref={containerRef}
        style={{ "--canvas-height": canvasHeight } as React.CSSProperties}
      >
        <div
          className={styles.scaler}
          ref={contentRef}
          style={{ zoom } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
