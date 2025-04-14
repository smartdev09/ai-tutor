interface RegenerateButtonProps {
  onRegenerate: (prompt?: string) => void;
}

export function RegenerateButton({ onRegenerate }: RegenerateButtonProps) {
  return (
    <button
      onClick={() => onRegenerate()}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Regenerate Outline
    </button>
  );
} 