export function StreamingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-pulse flex space-x-2">
        <div className="h-2 w-2 bg-gray-900 rounded-full"></div>
        <div className="h-2 w-2 bg-gray-900 rounded-full"></div>
        <div className="h-2 w-2 bg-gray-900 rounded-full"></div>
      </div>
      <span className="ml-2">Generating content...</span>
    </div>
  );
} 