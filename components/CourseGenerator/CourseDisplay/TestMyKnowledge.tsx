"use client"

import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import React, { useEffect, useState } from 'react';
import { useCompletion } from "@ai-sdk/react";
import { parseContentFromMarkdown } from '@/lib/utils';

const TestMyKnowledge = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentLessonContent = useAppSelector((state) => state.course.currentLessonContent);
  const [questions, setQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [stableQuestionCount, setStableQuestionCount] = useState(0);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  // Process the streaming response with stability improvements
  const processCompletionText = (text: string) => {
    // First, clean up the text to remove the token indices
    const cleanText = text.replace(/\d+:"([^"]*)"/g, '$1')
                          .replace(/\d+:([^ ]+)/g, '$1');
    
    return parseMCQQuestions(cleanText);
  };

  // Parse Multiple Choice Questions from streaming completion
  const parseMCQQuestions = (completionText: string) => {
    parseContentFromMarkdown(completionText);
    try {
      const parsedQuestions = [];
      
      // Extract question blocks using regex
      const questionPattern = /\*\*([\d.]+)\.\s+([^*]+)\*\*\s+((?:[a-d]\)[^\n]*\n)+)\s*\*\*Correct answer:\*\*\s*([a-d])\)/g;
      let match;
      
      while ((match = questionPattern.exec(completionText)) !== null) {
        const questionText = match[2].trim();
        const optionsText = match[3];
        const correctAnswerLetter = match[4].trim();
        
        // Parse options
        const options: string[] = [];
        const optionPattern = /([a-d])\)\s*([^\n]+)/g;
        let optionMatch;
        while ((optionMatch = optionPattern.exec(optionsText)) !== null) {
          options.push(optionMatch[2].trim());
        }
        
        // Convert correct answer letter to index
        let correctAnswerIndex = -1;
        if (correctAnswerLetter === 'a') correctAnswerIndex = 0;
        else if (correctAnswerLetter === 'b') correctAnswerIndex = 1;
        else if (correctAnswerLetter === 'c') correctAnswerIndex = 2;
        else if (correctAnswerLetter === 'd') correctAnswerIndex = 3;
        
        if (questionText && options.length > 0) {
          parsedQuestions.push({
            question: questionText,
            options,
            correctAnswer: correctAnswerIndex
          });
        }
      }
      
      return parsedQuestions;
    } catch (err) {
      console.error('Error parsing MCQ questions:', err);
      return [];
    }
  };

  // Handle AI completion for quiz generation
  const {
    completion,
    complete,
  } = useCompletion({
    api: '/api/generate-quiz',
    body: {
      content: currentLessonContent,
      type: 'mcq'
    },
    onFinish: (prompt, completion) => {
      try {
        const parsedQuestions = processCompletionText(completion);
        if (parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
          setAnswers(Array(parsedQuestions.length).fill(null));
          setIsLoading(false);
        } else {
          setError('Failed to parse quiz questions');
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError('Failed to generate quiz');
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    }
  });

  // Process streaming completion as it arrives with stability improvements
  useEffect(() => {
    if (completion) {
      try {
        const newParsedQuestions = processCompletionText(completion);
        setParsedQuestions(newParsedQuestions);
        
        // Only update the stableQuestionCount if the new count is higher
        if (newParsedQuestions.length > stableQuestionCount) {
          setStableQuestionCount(newParsedQuestions.length);
          // Only grow the answers array, never shrink it
          if (answers.length < newParsedQuestions.length) {
            setAnswers(prev => [
              ...prev, 
              ...Array(newParsedQuestions.length - prev.length).fill(null)
            ]);
          }
        }
        
        // Only update questions when parsing is complete or has stabilized
        if (newParsedQuestions.length > 0) {
          // Create a stable array with the current parsed questions
          const stableQuestions = [...newParsedQuestions];
          
          // Fill any missing slots with placeholder questions to prevent UI jumps
          // This ensures we never reduce the question count during streaming
          while (stableQuestions.length < stableQuestionCount) {
            const lastQuestion = stableQuestions[stableQuestions.length - 1] || {
              question: "Loading question...",
              options: ["Loading...", "Loading...", "Loading...", "Loading..."],
              correctAnswer: 0
            };
            stableQuestions.push({ ...lastQuestion });
          }
          
          setQuestions(stableQuestions);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error parsing streaming quiz content:', err);
      }
    }
  }, [completion, stableQuestionCount, answers.length]);

  // Generate questions on component mount
  useEffect(() => {
    if (!hasGenerated) {
      setHasGenerated(true);
      setIsLoading(true);
      complete('');
    }
  }, [hasGenerated, complete]);

  // Check if all questions are answered
  useEffect(() => {
    if (answers.length > 0 && questions.length > 0) {
      // Only check answers for the actual parsed questions, not placeholders
      const actualQuestionCount = parsedQuestions.length;
      const allAnswered = answers.slice(0, actualQuestionCount).every(answer => answer !== null);
      setAllQuestionsAnswered(allAnswered);
    }
  }, [answers, questions.length, parsedQuestions.length]);

  // Handle option selection for MCQ questions with immediate feedback
  const handleOptionSelect = (optionIndex: number) => {
    if (quizComplete) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  // Navigation
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentQuestionIndex === questions.length - 1 && allQuestionsAnswered) {
      // Submit quiz
      calculateScore();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Calculate score for MCQ quiz
  const calculateScore = () => {
    if (questions.length === 0) return;
    
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (typeof answer === 'number' && index < questions.length && answer === questions[index].correctAnswer) {
        correctCount++;
      }
    });
    
    const percentageScore = (correctCount / parsedQuestions.length) * 100;
    setScore(percentageScore);
    setQuizComplete(true);
    setReviewMode(true);
    setCurrentQuestionIndex(0);
  };

  // Restart quiz
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setQuizComplete(false);
    setScore(null);
    setReviewMode(false);
  };

  // Show loading state with a stable message
  if (isLoading || questions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow flex flex-col items-center justify-center min-h-60">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
        <p className="text-gray-700 font-medium">Generating your multiple choice quiz questions...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-red-500 text-center">
          <p className="font-medium">Failed to generate quiz</p>
          <p className="mt-2">{error}</p>
          <Button 
            className="mt-4 bg-purple-500 text-white px-4 py-2 rounded-lg"
            onClick={() => {
              setError(null);
              setHasGenerated(false);
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show quiz summary after completion
  if (quizComplete && score !== null && !reviewMode) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-6">Quiz Results</h2>
        
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-purple-600 mb-2">{Math.round(score)}%</div>
          <p className="text-gray-700">
            You got {answers.filter((answer, index) => 
              typeof answer === 'number' && index < parsedQuestions.length && answer === parsedQuestions[index].correctAnswer
            ).length} out of {parsedQuestions.length} questions correct
          </p>
        </div>
        
        <div className="flex justify-center">
          <Button 
            className="px-6 py-2 bg-purple-500 text-white rounded-lg mr-4"
            onClick={() => {
              setReviewMode(true);
              setCurrentQuestionIndex(0);
            }}
          >
            Review Questions
          </Button>
          <Button 
            onClick={restartQuiz}
          >
            Retake Quiz
          </Button>
        </div>
      </div>
    );
  }

  // Show current question (either in quiz mode or review mode)
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // Check if this question is fully loaded (not a placeholder)
  const isPlaceholder = currentQuestionIndex >= parsedQuestions.length;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {quizComplete ? "Quiz Results" : "Multiple Choice Quiz"}
        </h2>
        {quizComplete && (
          <div className="text-purple-600 font-medium">
            Score: {Math.round(score || 0)}%
          </div>
        )}
      </div>
      
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center mb-2">
          <span className="text-gray-700 font-medium">Question {currentQuestionIndex + 1} of {parsedQuestions.length}</span>
          <div className="ml-2 flex-grow h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-purple-500 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="py-6">
        <h2 className="text-xl font-bold text-gray-800 mb-8">{currentQuestion?.question}</h2>

        <div className="space-y-4">
          {currentQuestion?.options.map((option, index) => {
            // Determine if this answer is correct or incorrect
            const isCorrect = currentQuestion?.correctAnswer === index;
            const isSelected = answers[currentQuestionIndex] === index;
            const showResultInline = quizComplete || isSelected;
            
            return (
              <div 
                key={index}
                className={`flex items-center p-2 rounded transition-all duration-200 ${
                  showResultInline ? (
                    isCorrect ? 'bg-green-50' : 
                    isSelected ? 'bg-red-50' : ''
                  ) : (isSelected ? 'bg-purple-50' : '')
                } ${isPlaceholder ? 'opacity-50' : ''}`}
                role="button"
                onClick={() => !isPlaceholder && !quizComplete && handleOptionSelect(index)}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                  isSelected 
                    ? (showResultInline && !isCorrect ? 'border-red-500' : 'border-purple-500')
                    : 'border-gray-400'
                }`}>
                  {showResultInline ? (
                    isCorrect ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : isSelected ? (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    ) : null
                  ) : (
                    isSelected && <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  )}
                </div>
                <span className={`text-gray-800 ${
                  (showResultInline && isCorrect) ? 'font-medium' : ''
                }`}>{option}</span>
                
                {/* Immediate feedback message */}
                {isSelected && showResultInline && !quizComplete && (
                  <span className={`ml-auto text-sm font-medium ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 flex justify-between">
        <div className="text-purple-600 font-medium">
          {!quizComplete && !allQuestionsAnswered && currentQuestionIndex === parsedQuestions.length - 1 && 
            'Please answer all questions to submit'
          }
          {quizComplete && (
            answers[currentQuestionIndex] === currentQuestion?.correctAnswer ? 
            'Correct answer!' : 'Incorrect answer'
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            className={`px-4 py-2 flex items-center border border-gray-300 rounded-lg ${currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>
          
          {quizComplete ? (
            currentQuestionIndex === parsedQuestions.length - 1 ? (
              <Button 
                className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                onClick={() => {
                  setReviewMode(false);
                }}
              >
                Show Summary
              </Button>
            ) : (
              <Button 
                className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center"
                onClick={goToNextQuestion}
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            )
          ) : (
            <Button 
              className={`px-4 py-2 flex items-center ${
                currentQuestionIndex === parsedQuestions.length - 1 
                  ? (allQuestionsAnswered ? 'bg-green-500' : 'bg-gray-400') 
                  : 'bg-purple-500'
              } text-white rounded-lg`}
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === parsedQuestions.length - 1 && !allQuestionsAnswered}
            >
              {currentQuestionIndex === parsedQuestions.length - 1 ? 'Submit' : 'Next'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {answers.slice(0, parsedQuestions.length).map((answer, index) => (
          <div 
            key={index} 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${answer !== null 
                ? (quizComplete && parsedQuestions[index] && answer === parsedQuestions[index].correctAnswer 
                  ? 'bg-green-500 text-white' 
                  : quizComplete 
                    ? 'bg-red-500 text-white' 
                    : 'bg-purple-500 text-white')
                : 'bg-gray-200 text-gray-600'}
              ${currentQuestionIndex === index ? 'ring-2 ring-purple-300' : ''}
            `}
            onClick={() => setCurrentQuestionIndex(index)}
            role="button"
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestMyKnowledge;