"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { storeFineTuneData } from "@/lib/utils/storage"
import { Sparkles, BookOpen, Brain, ChevronDown, ChevronUp, Rocket } from "lucide-react"

export function AICourse() {
  const router = useRouter()
  const [term, setTerm] = useState("")
  const [difficulty, setDifficulty] = useState("beginner")
  const [about, setAbout] = useState("")
  const [goal, setGoal] = useState("")
  const [customInstructions, setCustomInstructions] = useState("")
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!term) {
      return
    }

    setIsSubmitting(true)

    // Store fine-tuning data if available
    let sessionId = ""
    if (about || goal || customInstructions) {
      sessionId = storeFineTuneData({
        about,
        goal,
        customInstructions,
      })
    }

    // Construct the URL with parameters
    const params = new URLSearchParams()
    params.append("term", term)
    params.append("difficulty", difficulty)
    if (sessionId) {
      params.append("id", sessionId)
    }

    // Navigate to the search page with parameters
    router.push(`/ai/search?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 py-10">
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-purple-600 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-purple-800">AI Course Generator</h1>
          <p className="text-purple-600 text-lg">
            Tell us what you want to learn, and our AI will create a customized course for you.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-purple-600 p-4 flex items-center">
            <BookOpen className="h-6 w-6 text-white mr-2" />
            <h2 className="text-xl font-bold text-white">Create Your Learning Quest</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-purple-100 p-4 rounded-xl">
              <label htmlFor="term" className="block text-sm font-bold text-purple-800 mb-2">
                What would you like to learn today?
              </label>
              <input
                type="text"
                id="term"
                placeholder="e.g., JavaScript, Machine Learning, Photography"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-purple-900"
                required
              />
            </div>

            <div className="bg-purple-100 p-4 rounded-xl">
              <label htmlFor="difficulty" className="block text-sm font-bold text-purple-800 mb-2">
                Choose Your Difficulty Level
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-purple-900"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen)}
                className="flex items-center justify-between w-full px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
              >
                <div className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Advanced Options
                </div>
                {isAdvancedOptionsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {isAdvancedOptionsOpen && (
                <div className="mt-4 space-y-4 p-5 bg-indigo-50 rounded-xl border-2 border-indigo-100">
                  <div>
                    <label htmlFor="about" className="block text-sm font-bold text-indigo-800 mb-2">
                      About Yourself (Optional)
                    </label>
                    <textarea
                      id="about"
                      placeholder="Tell us about your background, experience level, etc."
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label htmlFor="goal" className="block text-sm font-bold text-indigo-800 mb-2">
                      Your Learning Goals (Optional)
                    </label>
                    <textarea
                      id="goal"
                      placeholder="What do you hope to achieve by learning this topic?"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label htmlFor="customInstructions" className="block text-sm font-bold text-indigo-800 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      id="customInstructions"
                      placeholder="Any specific requirements or topics you want covered in the course?"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !term}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white flex items-center justify-center space-x-2 ${isSubmitting || !term
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                  }`}
              >
                <Rocket className="w-5 h-5" />
                <span>{isSubmitting ? "Creating Your Course..." : "Generate Course"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
