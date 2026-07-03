/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { useZoomStore, zoomActions } from '../state/zoomStore';
import { useCanvasStore, canvasActions } from '../state/canvasStore';
import { selectionActions } from '../state/selectionStore';

interface CanvasViewportProps {
  children: React.ReactNode;
}

export default function CanvasViewport({ children }: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scale } = useZoomStore();
  const { panOffset, isPanning } = useCanvasStore();
  
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Monitor Spacebar state for space-to-pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        // Prevent browser scroll
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Monitor viewport container resizing
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      if (entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      canvasActions.setViewportSize(width, height);
    });

    observer.observe(containerRef.current);
    
    // Set initial size
    const rect = containerRef.current.getBoundingClientRect();
    canvasActions.setViewportSize(rect.width, rect.height);

    return () => observer.disconnect();
  }, []);

  // Handle Mouse Wheel Zoom and Pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    
    // If holding Ctrl (or Cmd), or Alt, perform Zoom. Otherwise pan.
    if (e.ctrlKey || e.metaKey || e.altKey) {
      const factor = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
      zoomActions.setScale(scale * factor);
    } else {
      // Regular scroll translates to panning (very standard for designer tooling)
      canvasActions.setPanOffset((prev) => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8,
      }));
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const isMiddleButton = e.button === 1;
    const canDrag = isSpacePressed || isMiddleButton || e.target === containerRef.current;

    if (!canDrag) return;

    e.preventDefault();
    isDragging.current = true;
    canvasActions.setIsPanning(true);
    dragStart.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    canvasActions.setPanOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging.current) {
      isDragging.current = false;
      canvasActions.setIsPanning(false);
    }
  };

  // Touch Support (for panning)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      isDragging.current = true;
      canvasActions.setIsPanning(true);
      dragStart.current = {
        x: touch.clientX - panOffset.x,
        y: touch.clientY - panOffset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    canvasActions.setPanOffset({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y,
    });
  };

  const handleViewportClick = (e: React.MouseEvent) => {
    // If clicking the empty background, clear selections
    if (e.target === containerRef.current) {
      selectionActions.clearSelection();
    }
  };

  // Double click to zoom into 100% or back
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      zoomActions.setScale(scale === 1.0 ? 1.5 : 1.0);
    }
  };

  const cursorClass = isPanning 
    ? 'cursor-grabbing' 
    : isSpacePressed 
      ? 'cursor-grab' 
      : 'cursor-default';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
      onClick={handleViewportClick}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-full overflow-hidden select-none outline-none ${cursorClass} flex items-center justify-center bg-[#07070a]/95`}
      style={{ touchAction: 'none' }}
      aria-label="Design Canvas Board. Hold SPACE and drag to pan, scroll wheel or Ctrl+scroll to zoom."
      tabIndex={0}
    >
      {/* Background alignment patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Render relative coordinate zoom space */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isDragging.current ? 'none' : 'transform 100ms cubic-bezier(0.1, 0.9, 0.2, 1)',
        }}
        className="absolute top-0 left-0 pointer-events-auto"
      >
        {children}
      </div>
    </div>
  );
}
