import { LogOut } from "lucide-react";
import { logout } from "@/app/[locale]/auth/actions";

export function Logout() {
    return (
        <button
            onClick={logout}
            className="z-40 fixed top-4 right-16 inline-flex items-center justify-center px-3 py-3 overflow-hidden font-semibold text-white transition-all duration-300 bg-primary rounded-full shadow-lg hover:bg-purple-700 hover:shadow-xl active:scale-95"
        >
            <span className="z-10">
                <LogOut className="w-5 h-5" />
            </span>
            <div className="absolute inset-0 transition duration-300 rounded-xl" />
        </button>
    );
}