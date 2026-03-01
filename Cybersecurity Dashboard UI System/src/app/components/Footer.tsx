import { useState } from 'react';
import { Linkedin, X } from 'lucide-react';

export function Footer() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <footer className="fixed bottom-0 left-0 right-0 w-full py-4 pr-10 pl-4 md:px-8 border-t border-[#5B6AC2]/20 z-50 bg-[#0A0E1A]/95 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm text-gray-400 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] transition-all duration-500">
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 md:top-4 md:right-4 p-1.5 text-gray-400 hover:text-white bg-[#5B6AC2]/10 hover:bg-[#5B6AC2]/30 rounded-full transition-all"
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>

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
