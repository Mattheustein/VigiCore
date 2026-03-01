import { Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full py-6 px-4 md:px-8 border-t border-[#5B6AC2]/20 relative z-20 bg-[#0A0E1A]/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm text-gray-400 mt-auto">
            <div className="text-center md:text-left max-w-3xl leading-relaxed">
                <p>
                    Developed by <strong className="text-gray-200 font-medium tracking-wide">Mahmoud Sultan (Mattheustein)</strong>, this platform serves as his graduation project and demonstrates the design and implementation of an Intrusion Detection System (IDS).
                </p>
            </div>

            <div className="flex items-center gap-2">
                <a
                    href="https://www.linkedin.com/in/mattheustein"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5B6AC2]/10 to-[#E91E63]/10 hover:from-[#5B6AC2]/30 hover:to-[#E91E63]/20 border border-[#5B6AC2]/30 text-white rounded-lg transition-all shadow-lg shadow-[#5B6AC2]/5"
                >
                    <Linkedin className="w-4 h-4 text-[#5B6AC2] group-hover:text-white transition-colors" />
                    <span className="font-medium tracking-wide">Connect with Developer</span>
                </a>
            </div>
        </footer>
    );
}
