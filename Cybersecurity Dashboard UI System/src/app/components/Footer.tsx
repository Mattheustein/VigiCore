import { useState } from 'react';
import { Linkedin, X } from 'lucide-react';

export function Footer() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 w-[350px] p-5 rounded-2xl border border-[#5B6AC2]/30 bg-[#0A0E1A]/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[1000] flex flex-col gap-4 transition-all duration-500 transform translate-y-0 opacity-100">
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white bg-[#5B6AC2]/10 hover:bg-[#5B6AC2]/30 rounded-full transition-all"
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="text-sm leading-relaxed text-gray-400 pr-6">
                <p>
                    Developed by <strong className="text-gray-200 font-medium tracking-wide">Mahmoud Sultan (Mattheustein)</strong>. This platform showcases the design of an Intrusion Detection System (IDS).
                </p>
            </div>

            <a
                href="https://www.linkedin.com/in/mattheustein"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#5B6AC2]/20 to-[#E91E63]/20 hover:from-[#5B6AC2]/40 hover:to-[#E91E63]/30 border border-[#5B6AC2]/40 hover:border-[#E91E63]/50 text-white rounded-xl transition-all shadow-lg w-full"
            >
                <Linkedin className="w-4 h-4 text-[#60A5FA] group-hover:text-white transition-colors" />
                <span className="font-semibold tracking-wide">Connect with Developer</span>
            </a>
        </div>
    );
}
