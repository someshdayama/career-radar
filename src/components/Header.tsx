'use client';

import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-bold tracking-tight text-white hover:text-zinc-300 transition-colors">
          Career Radar
        </Link>
      </div>
    </header>
  );
}
