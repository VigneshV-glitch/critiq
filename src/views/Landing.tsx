/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, LogOut, HelpCircle, Laptop } from 'lucide-react';
import { motion } from 'motion/react';
import { AuditReport } from '../types';

interface LandingProps {
  onUploadImage: (fileDataUrl: string, fileName: string) => void;
  onSelectDemo: (reviewId: string) => void;
  userEmail?: string;
  onResetData: () => void;
}

export default function Landing({
  onUploadImage,
  onSelectDemo,
  userEmail = 'vigneshv7678@gmail.com',
  onResetData
}: LandingProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Critiq supports visual wireframes & images only. Please upload a PNG, JPG, or WebP screenshot.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadImage(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Prebaked demo files
  const demoScreens = [
    {
      id: 'rev_fintech_main',
      name: 'Fintech Mobile App v2',
      badge: 'FINTECH',
      desc: 'Mobile wallet rows with transaction logs & balance cards.',
      color: 'from-indigo-500/20 to-indigo-600/5'
    },
    {
      id: 'rev_ecommerce_checkout',
      name: 'E-Commerce Checkout Screen',
      badge: 'SAAS FORM',
      desc: 'Checkout checkout flow with integrated payment forms.',
      color: 'from-violet-500/20 to-violet-600/5'
    }
  ];

  // Custom premium easing curve for silky smooth, fluid deceleration (easeOutExpo)
  const EASE_CUSTOM = [0.16, 1, 0.3, 1];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 relative select-none">
      {/* Premium Minimal Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/35">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-display font-semibold text-white tracking-tight leading-none">CritiQ</h1>
            <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase mt-1 block">AI-Powered Inspection Node</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/2 border border-white/5 rounded-xl px-3.5 py-1.5 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="font-mono">{userEmail}</span>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to restore default factory settings? This resets all demo files.')) {
                onResetData();
              }
            }}
            className="text-[11px] font-mono text-slate-500 hover:text-rose-400 transition-colors"
          >
            Reset Environment
          </button>
        </div>
      </header>

      {/* Centered Primary Landing Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative max-w-4xl mx-auto w-full min-h-0">
        
        {/* Decorative Grid Mesh overlay behind the center block */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        ></div>

        <div className="w-full text-center space-y-8 z-10">
          
          {/* Main Typography Header block */}
          <div className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_CUSTOM }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-mono font-bold text-indigo-300 tracking-wider uppercase"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Next-Gen Cognitive UX Diagnostic Engine
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_CUSTOM, delay: 0.08 }}
              className="text-4xl md:text-5xl font-display font-semibold text-white tracking-tight"
            >
              CritiQ layouts in seconds
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_CUSTOM, delay: 0.16 }}
              className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed"
            >
              Upload a wireframe screenshot, dashboard visual, or mockup. Critiq builds a high-fidelity diagnostic scorecard using strict heuristic design rules.
            </motion.p>
          </div>

          {/* Premium Centered Upload Zone (High-fidelity Glassmorphic Container) */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: isDragging ? 0.99 : 1 }}
            whileHover={{ scale: isDragging ? 0.99 : 1.005 }}
            whileTap={{ scale: 0.985 }}
            transition={{ 
              scale: { duration: 0.2, ease: "easeOut" },
              default: { duration: 0.9, ease: EASE_CUSTOM, delay: 0.24 }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`w-full max-w-xl mx-auto h-64 rounded-3xl flex flex-col items-center justify-center p-8 text-center transition-colors duration-300 cursor-pointer relative overflow-hidden backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65),inset_0_1px_1.5px_rgba(255,255,255,0.15)] border ${
              isDragging
                ? 'border-indigo-400/50 bg-indigo-500/10 scale-[0.99] shadow-indigo-500/5'
                : 'border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] hover:border-white/20 hover:bg-white/[0.03] shadow-black/40'
            }`}
          >
            {/* Elegant inner dashed outline to signal drop zone */}
            <div className={`absolute inset-3 border border-dashed rounded-2xl pointer-events-none transition-colors duration-300 ${
              isDragging ? 'border-indigo-400/40' : 'border-white/5'
            }`} />

            {/* Soft background glowing radial orb inside the drop area */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none"></div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            
            <div className="w-14 h-14 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center mb-4 text-slate-300 shadow-xl z-10">
              <UploadCloud className="w-6 h-6 text-indigo-400" />
            </div>

            <h3 className="text-base font-semibold text-white tracking-wide z-10">Drop design layout or screenshot here</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5 leading-relaxed z-10">
              Supports PNG, JPG, and WebP mockup files
            </p>
            
            <span className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all border border-indigo-400/20 shadow-lg shadow-indigo-600/15 z-10">
              Browse Layout File
            </span>
          </motion.div>

          {/* Elegant Sandbox Try Demos list */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_CUSTOM, delay: 0.32 }}
            className="w-full max-w-xl mx-auto space-y-3"
          >
            <div className="flex items-center gap-2 justify-center">
              <span className="h-px w-8 bg-white/10"></span>
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                Or examine a sandbox demo design
              </span>
              <span className="h-px w-8 bg-white/10"></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {demoScreens.map((demo) => (
                <div
                  key={demo.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDemo(demo.id);
                  }}
                  className={`p-4 bg-gradient-to-br ${demo.color} bg-black/45 hover:bg-black/75 border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-colors duration-200 cursor-pointer flex items-start gap-3.5 text-left group`}
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200 shadow-md">
                    <ImageIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">{demo.name}</span>
                      <span className="text-[8px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-400 shrink-0">{demo.badge}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed truncate">{demo.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
