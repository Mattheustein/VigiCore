import { Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full py-6 px-4 md:px-8 border-t border-[#5B6AC2]/20 relative z-20 bg-[#0A0E1A]/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm text-gray-400 mt-auto">
            <div className="text-center md:text-left max-w-2xl leading-relaxed">
                <p>This website has been created by <strong className="text-gray-200 font-medium">Mahmoud Sultan (Mattheustein)</strong>.</p>
                <p>This website is considered as a graduation project for him which is an Intrusion Detection System.</p>
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
