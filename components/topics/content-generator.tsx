'use client';

import { useChat } from '@ai-sdk/react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface ContentGeneratorProps {
  topicId: string;
  onContentGenerated?: (content: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{
    type: 'text';
    text: string;
  }>;
}

export default function ContentGenerator({ topicId, onContentGenerated }: ContentGeneratorProps) {
  const { messages, isLoading } = useChat<ChatMessage>({
    api: `/api/topics/content/${topicId}`,
    id: topicId,
  });

  // Get the latest AI message
  const latestMessage = messages.filter(m => m.role === 'assistant').pop();

  // When we have a complete message, call the callback
  useEffect(() => {
    if (latestMessage && onContentGenerated) {
      const content = latestMessage.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('');
      onContentGenerated(content);
    }
  }, [latestMessage, onContentGenerated]);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-lg text-gray-600">Generating content...</span>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            {messages.map(message => (
              <div key={message.id} className="mb-4">
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <div key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                          {part.text}
                        </div>
                      );
                  }
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
} 