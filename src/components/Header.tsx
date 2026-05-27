'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, FileText, Users } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Job Board', href: '/', icon: Briefcase },
    { name: 'Resume Builder', href: '/resume', icon: FileText },
    { name: 'Networking CRM', href: '/crm', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Title */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 shadow-md">
            <span className="text-sm font-extrabold text-white">CR</span>
            <div className="absolute inset-0 rounded-lg bg-white/20 animate-pulse" />
          </div>
          <Link href="/" className="text-lg font-bold tracking-tight text-white hover:text-zinc-200 transition-colors">
            Career Radar <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ml-1">Copilot</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span className="hidden xs:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
