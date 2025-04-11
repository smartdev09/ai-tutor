// app/(dashboard)/courses/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// Define course form type
type CourseFormValues = {
  title: string;
  description: string;
  subject: 'math' | 'science';
  subCategory: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
};

// Topic type
type Topic = {
  title: string;
  description: string;
  sequenceNumber: number;
};

export default function CreateCoursePage() {
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<Topic[]>([]);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const router = useRouter();

  // Initialize form
  const form = useForm<CourseFormValues>({
    defaultValues: {
      title: '',
      description: '',
      subject: 'math',
      subCategory: '',
      difficultyLevel: 'beginner',
    },
  });

  // Define subcategories based on subject
  const subCategories = {
    math: ['Algebra', 'Calculus', 'Geometry', 'Statistics', 'Trigonometry', 'Number Theory', 'Discrete Math'],
    science: ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth Science', 'Computer Science'],
  };

  // Generate topics with AI
  const generateTopics = async () => {
    const values = form.getValues();
    
    if (!values.title || !values.subject || !values.subCategory || !values.difficultyLevel) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields to generate topics",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingTopics(true);
    setGeneratedTopics([]);
    
    try {
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          subject: values.subject,
          subCategory: values.subCategory,
          difficultyLevel: values.difficultyLevel,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate topics');
      }
      
      const data = await response.json();
      setGeneratedTopics(data.topics);
      
      toast({
        title: "Topics Generated!",
        description: `${data.topics.length} topics have been created for your course.`,
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  // Save course and topics to database
  const saveCourse = async () => {
    if (generatedTopics.length === 0) {
      toast({
        title: "No topics generated",
        description: "Please generate topics before saving the course",
        variant: "destructive",
      });
      return;
    }
    
    const values = form.getValues();
    setIsCreatingCourse(true);
    
    try {
      // First, create the course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: values.title,
          description: values.description,
          subject: values.subject,
          sub_category: values.subCategory,
          difficulty_level: values.difficultyLevel,
          published: false,
        })
        .select()
        .single();
      
      if (courseError) throw courseError;
      
      // Then add all topics
      const topicsToInsert = generatedTopics.map(topic => ({
        course_id: courseData.id,
        title: topic.title,
        description: topic.description,
        sequence_number: topic.sequenceNumber,
      }));
      
      const { error: topicsError } = await supabase
        .from('course_topics')
        .insert(topicsToInsert);
      
      if (topicsError) throw topicsError;
      
      toast({
        title: "Course created successfully!",
        description: "Your course and topics have been saved.",
      });
      
      // Give user XP for creating a course
      await supabase.rpc('increment_user_xp', { xp_amount: 100 });
      
      // Redirect to course view
      router.push(`/courses/${courseData.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to save course",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingCourse(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create a New Course</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Course Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>
              Enter the basic information for your new course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduction to Linear Algebra" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear and specific title for your course
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="This course covers the fundamentals of linear algebra including vectors, matrices, and linear transformations." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Briefly describe what students will learn
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('subCategory', '');
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="math">Mathematics</SelectItem>
                            <SelectItem value="science">Science</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!form.watch('subject')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch('subject') && 
                              subCategories[form.watch('subject')].map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="difficultyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={generateTopics}
              disabled={isGeneratingTopics}
              className="w-full"
            >
              {isGeneratingTopics ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Topics...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Course Topics with AI
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* AI Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle>AI Tutor Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium mb-1">Be Specific</p>
                <p>The more detailed your course description, the better the AI can generate relevant topics.</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium mb-1">Consider Progression</p>
                <p>Topics will be arranged in a logical learning sequence from foundational to advanced concepts.</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium mb-1">Review & Customize</p>
                <p>After generation, you can edit, reorder, or remove topics to suit your teaching style.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Generated Topics Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Course Topics</h2>
        
        <AnimatePresence>
          {isGeneratingTopics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 border rounded-lg mb-6"
            >
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 mb-4">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-200"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-medium mb-2">Generating Course Topics</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Our AI is crafting the perfect topics for your course. This usually takes about 15-30 seconds.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {generatedTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Generated Topics</h3>
                  <Button onClick={saveCourse} disabled={isCreatingCourse}>
                    {isCreatingCourse ? 'Saving...' : 'Save Course'}
                  </Button>
                </div>
              </div>
              
              <div className="divide-y">
                {generatedTopics.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{topic.title}</h4>
                        <p className="text-gray-500 text-sm mt-1">{topic.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={saveCourse} disabled={isCreatingCourse}>
                {isCreatingCourse ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Course...
                  </>
                ) : (
                  'Save and Create Course'
                )}
              </Button>
            </div>
          </motion.div>
        )}
        
        {!isGeneratingTopics && generatedTopics.length === 0 && (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-xl font-medium mb-2">No Topics Generated Yet</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                Fill out the course details and click "Generate Course Topics with AI" to create a structured curriculum
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}