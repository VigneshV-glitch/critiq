/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, X } from 'lucide-react';
import { useFilterStore, filterActions } from '../state/filterStore';

export default function IssueSearch() {
  const { searchQuery } = useFilterStore();

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => filterActions.setSearchQuery(e.target.value)}
        placeholder="Search title, description, category..."
        className="w-full pl-9 pr-8 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all font-normal"
        aria-label="Search review findings"
      />
      {searchQuery && (
        <button
          onClick={() => filterActions.setSearchQuery('')}
          className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
          title="Clear search"
          aria-label="Clear Search Query"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
