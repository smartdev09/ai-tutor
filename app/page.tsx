'use client'

import { useChat } from '@ai-sdk/react';

export default function Home() {
  const { messages} = useChat({
    api: '',
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
          </div>
        ))}
      </div> 
    </div>
  );
}
