"use client";

import { Search } from "lucide-react";
import React from "react";

export function SearchInput() {
  return (
    <div className="relative max-w-md w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-zinc-400" />
      </div>
      <input
        type="text"
        placeholder="Search..."
        className="block w-full pl-10 pr-4 py-2 rounded-full border border-zinc-700 bg-black text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600"
      />
    </div>
  );
} 