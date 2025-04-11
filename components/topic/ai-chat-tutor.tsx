// components/topics/ai-chat-tutor.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, User, ArrowLeft, Bot } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

interface AIChatTutorProps {
  topicId: string;
  courseId: string;
  topicTitle: string;
}

export default function AIChatTutor({ topicId, courseId, topicTitle }: AIChatTutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    // Initial welcome message
    {
      id: 'welcome',
      content: `Hi there! I'm your AI tutor for "${topicTitle}". How can I help you with this topic today?`,
      role: 'assistant',
      createdAt: new Date(),
    },
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user' as const,
      createdAt: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Add placeholder for AI response
      const placeholderId = 'placeholder-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: placeholderId,
          content: '',
          role: 'assistant',
          createdAt: new Date(),
        }
      ]);
      
      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          topicId,
          sessionId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Extract session ID from headers if available
      const responseSessionId = response.headers.get('X-Session-Id');
      if (responseSessionId && !sessionId) {
        setSessionId(responseSessionId);
      }
      
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantResponse = '';
        
        // Process the streaming response
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          // Append to the assistant's message
          assistantResponse += decoder.decode(value, { stream: true });
          
          // Update the placeholder message
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === placeholderId 
                ? { ...msg, content: assistantResponse }
                : msg
            )
          );
        }
        
        // Replace placeholder ID with permanent one
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === placeholderId 
              ? { ...msg, id: 'ai-' + Date.now().toString() }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive',
      });
      
      // Remove the placeholder message
      setMessages((prev) => prev.filter((msg) => msg.id !== 'placeholder-' + Date.now()));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b bg-gray-50/80 px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/courses/${courseId}/topics/${topicId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-lg flex items-center">
                <Bot className="h-5 w-5 mr-2 text-blue-600" />
                AI Tutor - {topicTitle}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`h-8 w-8 ${message.role === 'assistant' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <AvatarFallback>
                    {message.role === 'assistant' ? <Robot className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                
                <div 
                  className={`py-2 px-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="h-8 w-8 bg-blue-100">
                  <AvatarFallback>
                    <Robot className="h-5 w-5 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="py-2 px-3 rounded-lg bg-gray-100 text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t p-3">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Textarea
              placeholder="Ask your AI tutor a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[60px] flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}