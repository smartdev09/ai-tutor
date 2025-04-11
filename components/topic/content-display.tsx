// components/topics/content-display.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Loader2, BookOpen, Save, MessageSquare, BookCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

interface TopicContentDisplayProps {
  topicId: string;
  initialContent?: string;
  courseId: string;
}

export default function TopicContentDisplay({ 
  topicId, 
  initialContent,
  courseId
}: TopicContentDisplayProps) {
  const [content, setContent] = useState(initialContent || '');
  const [loading, setLoading] = useState(!initialContent);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const streamContent = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/topics/content/${topicId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load content');
      }
      
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          result += decoder.decode(value, { stream: true });
          setContent(result);
          
          // components/topics/content-display.tsx (continued)
          // Scroll to bottom as content comes in
          if (contentRef.current) {
            const { scrollHeight, clientHeight } = contentRef.current;
            if (scrollHeight > clientHeight) {
              contentRef.current.scrollTop = scrollHeight - clientHeight;
            }
          }
          
          // Simulate reading progress
          setProgress((prev) => Math.min(prev + 0.5, 95));
        }
        
        // Save the final content
        await saveContent(content);
        setProgress(100);
      }
    } catch (error: any) {
      console.error('Error loading topic content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load topic content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (contentToSave: string) => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/topics/content/${topicId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: contentToSave }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save content');
      }
      
      // Mark as saved
      toast({
        title: 'Content saved',
        description: 'Your progress has been recorded.',
      });
      
      // Refresh the page to update any UI components that rely on the saved state
      router.refresh();
    } catch (error: any) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const markAsCompleted = async () => {
    try {
      // Update user progress in the database
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          topic_id: topicId,
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,topic_id',
        });
        
      if (error) throw error;
      
      // Add XP for completing a topic
      await supabase.rpc('increment_user_xp', { xp_amount: 50 });
      
      toast({
        title: 'Topic completed!',
        description: 'You earned 50 XP for completing this topic.',
      });
      
      router.refresh();
    } catch (error) {
      console.error('Error marking topic as completed:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark topic as completed.',
        variant: 'destructive',
      });
    }
  };
  
  // Start streaming content if not provided initially
  useEffect(() => {
    if (!initialContent) {
      streamContent();
    } else {
      setProgress(100);
    }
  }, [initialContent, topicId]);

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
          <span className="text-sm font-medium">
            {progress < 100 ? 'Reading in progress' : 'Topic content'}
          </span>
        </div>
        <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {/* Content card */}
      <Card className="p-4 md:p-6 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm font-medium">Generating content...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={contentRef}
          className="prose prose-blue max-w-none overflow-y-auto max-h-[70vh]"
        >
          <ReactMarkdown
            rehypePlugins={[rehypeRaw as any]}
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/courses/${courseId}/chat?topicId=${topicId}`)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Ask AI Tutor
        </Button>
        
        <div className="space-x-2">
          {progress === 100 && (
            <Button 
              variant="default" 
              onClick={markAsCompleted}
              className="bg-green-600 hover:bg-green-700"
            >
              <BookCheck className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}