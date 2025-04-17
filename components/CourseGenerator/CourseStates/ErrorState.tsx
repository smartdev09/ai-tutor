import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="max-w-md w-full p-6 bg-red-50 border border-red-200 rounded-2xl shadow-md flex flex-col items-center text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
        <p className="text-sm text-red-600 mt-2">{error}</p>
        <button
          onClick={onRetry}
          className="mt-6 px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition duration-200 shadow-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
