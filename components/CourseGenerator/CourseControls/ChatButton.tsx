import { BotIcon, X } from "lucide-react";

interface ChatButtonProps {
    toggleBot: boolean;
    setToggleBot: (toggle: boolean) => void;
}

export function ChatButton({ toggleBot, setToggleBot }: ChatButtonProps) {
    return (
        <button
            onClick={() => setToggleBot(!toggleBot)}
            className="z-50 fixed top-4 right-16 inline-flex items-center justify-center px-3 py-3 overflow-hidden font-semibold text-white transition-all duration-300 bg-primary rounded-full shadow-lg hover:bg-purple-700 hover:shadow-xl active:scale-95"
        >
            <span title={toggleBot ? "Close Assistant" : "Open Assistant"} className="z-10">
                {toggleBot ? <X className="w-5 h-5" /> : <BotIcon className="w-5 h-5" />}
            </span>
            <div className="absolute inset-0 transition duration-300 rounded-xl" />
        </button>
    );
}