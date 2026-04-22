'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // 🚀 IMPORT PATHNAME
import { useAuth, UserButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname(); // 🚀 GET CURRENT ROUTE

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-16 backdrop-blur-2xl bg-white/40 border-b border-white/60 flex items-center px-6 fixed top-0 z-[100] shadow-[0_4px_30px_rgba(0,0,0,0.02)]"
    >
      <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/60 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <Image 
              src="/mivai.svg" 
              alt="MIVAI Logo" 
              fill 
              className="object-cover"
            />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#1d1d1f]">MIVAI.</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#1d1d1f]/60">
          <Link href="/#features" className="hover:text-blue-600 transition-colors">Features</Link>
          <Link href="/#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</Link>
          <Link href="/#testimonials" className="hover:text-blue-600 transition-colors">Success Stories</Link>
        </div>

        {/* Auth / CTA */}
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="w-20 h-8 bg-[#1d1d1f]/5 animate-pulse rounded-full" />
          ) : isSignedIn ? (
            <>
              {/* 🚀 CONDITIONAL RENDER: Only show if NOT on the dashboard */}
              {pathname !== '/dashboard' && (
                <Link href="/dashboard" className="hidden md:block text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Go to Dashboard
                </Link>
              )}
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-bold text-[#1d1d1f]/70 hover:text-blue-600 transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="text-sm font-bold bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 hover:scale-105 transition-all shadow-[0_4px_15px_rgba(37,99,235,0.3)]">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}