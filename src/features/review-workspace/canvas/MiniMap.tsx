/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { useZoomStore } from '../state/zoomStore';
import { useCanvasStore, canvasActions } from '../state/canvasStore';

interface MiniMapProps {
  issues: CritiqIssue[];
  imageUrl: string;
}

export default function MiniMap({ issues, imageUrl }: MiniMapProps) {
  const { scale } = useZoomStore();
  const { panOffset, viewportSize, imageSize } = useCanvasStore();
  const mapRef = useRef<HTMLDivElement>(null);

  const miniWidth = 120; // Fixed width for minimap container
  const miniScale = miniWidth / (imageSize.width || 1200);
  const miniHeight = (imageSize.height || 800) * miniScale;

  // Compute current visible viewport box relative to the image
  // Width of image in pixels is imageSize.width, etc.
  const visibleLeft = Math.max(0, -panOffset.x / scale);
  const visibleTop = Math.max(0, -panOffset.y / scale);
  const visibleWidth = Math.min(imageSize.width, viewportSize.width / scale);
  const visibleHeight = Math.min(imageSize.height, viewportSize.height / scale);

  // Translate to minimap pixel space
  const viewRect = {
    left: visibleLeft * miniScale,
    top: visibleTop * miniScale,
    width: visibleWidth * miniScale,
    height: visibleHeight * miniScale,
  };

  const getMarkerColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'bg-rose-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-sky-500';
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click in minimap back to image pixel coordinate
    const imageX = clickX / miniScale;
    const imageY = clickY / miniScale;

    // Centered pan offset is: viewport center - (image coordinate * scale)
    const newPanX = viewportSize.width / 2 - imageX * scale;
    const newPanY = viewportSize.height / 2 - imageY * scale;

    canvasActions.setPanOffset({ x: newPanX, y: newPanY });
  };

  return (
    <div className="bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-2xl flex flex-col gap-1.5 select-none pointer-events-auto">
      <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase tracking-wider px-1">
        <span>Minimap Navigation</span>
        <span className="text-indigo-400">interactive</span>
      </div>

      <div
        ref={mapRef}
        onClick={handleMapClick}
        style={{ width: `${miniWidth}px`, height: `${miniHeight}px` }}
        className="bg-[#0c0d12] border border-white/5 rounded-xl relative overflow-hidden cursor-crosshair shadow-inner flex shrink-0 items-center justify-center"
      >
        {/* Mockup visual reference */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="minimap reference"
            className="w-full h-full object-cover pointer-events-none opacity-40 filter grayscale brightness-50"
          />
        )}

        {/* Viewport Boundary Window Indicator Box */}
        <div
          style={{
            left: `${viewRect.left}px`,
            top: `${viewRect.top}px`,
            width: `${viewRect.width}px`,
            height: `${viewRect.height}px`,
          }}
          className="absolute border-2 border-indigo-500 bg-indigo-500/10 rounded pointer-events-none transition-all duration-75"
        />

        {/* Issue mini-markers */}
        {issues.map((issue) => (
          <div
            key={issue.id}
            style={{
              left: `${(issue.boundingBox.x / 100) * miniWidth}px`,
              top: `${(issue.boundingBox.y / 100) * miniHeight}px`,
            }}
            className={`absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/40 shadow-sm ${getMarkerColor(
              issue.severity
            )}`}
          />
        ))}
      </div>
    </div>
  );
}
