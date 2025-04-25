import { RefreshCcw } from "lucide-react";

interface RegenerateButtonProps {
  onRegenerate: (prompt?: string) => void;
}

export function RegenerateButton({ onRegenerate }: RegenerateButtonProps) {
  return (
    <button
      onClick={() => onRegenerate()}
      className="z-40 top-4 right-4 fixed inline-flex items-center justify-center px-2.5 py-2.5 overflow-hidden font-semibold text-white transition-all duration-300 bg-primary rounded-full shadow-lg hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 hover:shadow-xl active:scale-95"
    >
      <span title="Regenerate Course" className="z-10"><RefreshCcw/></span>
      <div className="absolute inset-0 transition duration-300 rounded-xl" />
    </button>
  );
}
