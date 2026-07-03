/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { useZoomStore, zoomActions } from '../state/zoomStore';
import { useCanvasStore, canvasActions } from '../state/canvasStore';
import CanvasViewport from './CanvasViewport';
import BoundingBoxes from './BoundingBoxes';
import IssueMarkers from './IssueMarkers';
import { viewportService } from '../services/viewportService';
import { Grid, HelpCircle } from 'lucide-react';

interface IssueCanvasProps {
  issues: CritiqIssue[];
  imageUrl: string;
  isUnavailable?: boolean;
  onRetryAudit?: () => void;
}

export default function IssueCanvas({
  issues,
  imageUrl,
  isUnavailable = false,
  onRetryAudit,
}: IssueCanvasProps) {
  const { scale } = useZoomStore();
  const { viewportSize, imageSize, isPanning } = useCanvasStore();
  const imgRef = useRef<HTMLImageElement>(null);

  // Auto-fit function
  const handleFitToScreen = () => {
    if (!imgRef.current) return;
    const imgWidth = imgRef.current.naturalWidth || 1200;
    const imgHeight = imgRef.current.naturalHeight || 800;
    
    canvasActions.setImageSize(imgWidth, imgHeight);

    const fitScale = viewportService.calculateFitScale(
      viewportSize.width,
      viewportSize.height,
      imgWidth,
      imgHeight,
      32 // padding
    );

    zoomActions.setScale(fitScale);

    // Calculate centering offset
    const offset = viewportService.calculateCenterOffset(
      viewportSize.width,
      viewportSize.height,
      imgWidth,
      imgHeight,
      fitScale
    );

    canvasActions.setPanOffset(offset);
  };

  // Run fitToScreen once when viewportSize is loaded and image is loaded
  useEffect(() => {
    if (viewportSize.width > 100 && imageSize.width > 100) {
      handleFitToScreen();
    }
  }, [viewportSize.width, viewportSize.height]);

  // Support triggering fit to screen via window events (loose coupling)
  useEffect(() => {
    const handleFitEvent = () => {
      handleFitToScreen();
    };
    window.addEventListener('fit-canvas-to-screen', handleFitEvent);
    return () => {
      window.removeEventListener('fit-canvas-to-screen', handleFitEvent);
    };
  }, [viewportSize, imageSize]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    canvasActions.setImageSize(img.naturalWidth, img.naturalHeight);
    
    // Perform initial centering and scaling fitting
    const fitScale = viewportService.calculateFitScale(
      viewportSize.width,
      viewportSize.height,
      img.naturalWidth,
      img.naturalHeight,
      32
    );

    zoomActions.setScale(fitScale);

    const offset = viewportService.calculateCenterOffset(
      viewportSize.width,
      viewportSize.height,
      img.naturalWidth,
      img.naturalHeight,
      fitScale
    );

    canvasActions.setPanOffset(offset);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#07070a] border border-white/5 overflow-hidden">
      
      {/* Interactive viewport mapping */}
      <div className="flex-1 min-h-0 relative">
        <CanvasViewport>
          {/* Inner Canvas stage with absolute pixel layout */}
          <div
            style={{
              width: `${imageSize.width || 1200}px`,
              height: `${imageSize.height || 800}px`,
            }}
            className="relative bg-black shadow-2xl overflow-hidden rounded-3xl border border-white/10"
          >
            {/* The actual design under review */}
            {imageUrl ? (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Upload Visual Design Mockup"
                onLoad={handleImageLoad}
                className={`w-full h-full object-contain pointer-events-none transition-all ${
                  isUnavailable ? 'blur-md brightness-50' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-500 font-mono">
                <p className="text-xs">No image provided.</p>
              </div>
            )}

            {/* Visual issue highlight contours */}
            {!isUnavailable && <BoundingBoxes issues={issues} />}

            {/* Pulsing selection markers layer */}
            {!isUnavailable && <IssueMarkers issues={issues} />}
          </div>
        </CanvasViewport>

        {/* Retry popup modal overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 bg-[#07070a]/80 backdrop-blur-md flex items-center justify-center p-6 z-40">
            <div className="bg-[#0e0f14] max-w-sm w-full p-6 rounded-3xl border border-amber-500/25 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-400">
                <HelpCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">AI Analysis Blocked</h4>
                <p className="text-[11px] text-slate-400 leading-normal font-normal">
                  Visual analysis failed due to Gemini API temporary limits. Let's retry to run the multi-agent inspector reviews.
                </p>
              </div>
              {onRetryAudit && (
                <button
                  onClick={onRetryAudit}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all font-mono"
                >
                  Retry Analysis
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom info banner overlay */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex flex-col gap-1.5">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-[10px] text-slate-300 font-mono flex items-center gap-2 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Visual Review Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export { useZoomStore };
