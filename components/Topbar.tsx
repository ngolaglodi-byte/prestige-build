"use client";

import { BellIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function Topbar() {
  return (
    <div className="h-16 w-full border-b border-border bg-[#111]/80 backdrop-blur-md flex items-center justify-between px-6">

      {/* Search */}
      <div className="flex items-center gap-2 bg-surfaceLight border border-border rounded-smooth px-3 py-2 w-80">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-sm w-full"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">

        {/* Notifications */}
        <button className="relative premium-hover">
          <BellIcon className="w-6 h-6 text-gray-300" />
          <span className="absolute -top-1 -right-1 bg-accent text-xs px-1.5 py-0.5 rounded-full">
            3
          </span>
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
          <Image
            src="/avatar.png"
            alt="Avatar"
            width={40}
            height={40}
          />
        </div>
      </div>
    </div>
  );
}
