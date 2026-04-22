import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full bg-white/40 backdrop-blur-3xl border-t border-white/60 pt-16 pb-8 px-6 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-10 md:gap-0">
        
        {/* Brand */}
        <div className="space-y-4 max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/60 shadow-sm">
              <Image 
                src="/mivai.svg" 
                alt="MIVAI Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#1d1d1f]">MIVAI.</span>
          </Link>
          <p className="text-sm text-[#1d1d1f]/60 leading-relaxed font-medium">
            The ultimate technical interview prep platform. Master algorithms, conquer system design, and land your dream offer with AI and Peer collaboration.
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-16">
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-[#1d1d1f] text-sm tracking-tight mb-2">Platform</h4>
            {/* 🚀 Routed directly to the Dashboard */}
            <Link href="/dashboard" className="text-sm font-semibold text-[#1d1d1f]/50 hover:text-blue-600 transition-colors">AI Mock Interviews</Link>
            <Link href="/dashboard" className="text-sm font-semibold text-[#1d1d1f]/50 hover:text-blue-600 transition-colors">P2P WebRTC Sessions</Link>
            <Link href="/dashboard" className="text-sm font-semibold text-[#1d1d1f]/50 hover:text-blue-600 transition-colors">Performance Analytics</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-[#1d1d1f] text-sm tracking-tight mb-2">Legal</h4>
            {/* Dummy anchor links for legal pages (standard for portfolios) */}
            <Link href="#legal" className="text-sm font-semibold text-[#1d1d1f]/50 hover:text-[#1d1d1f] transition-colors">Privacy Policy</Link>
            <Link href="#legal" className="text-sm font-semibold text-[#1d1d1f]/50 hover:text-[#1d1d1f] transition-colors">Terms of Service</Link>
            <Link href="#legal" className="text-sm font-semibold text-[#1d1d1f]/50 hover:text-[#1d1d1f] transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-white/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs font-bold text-[#1d1d1f]/40">
          © {new Date().getFullYear()} MIVAI. All rights reserved.
        </p>
        <p className="text-xs font-bold text-[#1d1d1f]/40">
          Built for the next generation of engineers.
        </p>
      </div>
    </footer>
  );
}