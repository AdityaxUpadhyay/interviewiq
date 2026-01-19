"use client"

import { useState } from 'react';
import { Sparkles, Briefcase, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';

export default function InterviewIQ() {
  const [step, setStep] = useState('input'); // input, questions, practice, feedback
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    experience_level: 'entry'
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const handleGenerateQuestions = async () => {
    if (!jobData.title || !jobData.description) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) throw new Error('Failed to generate questions');

      const data = await response.json();
      setQuestions(data.questions);
      setStep('questions');
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please provide an answer');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/evaluate-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQuestion].question,
          answer: answer,
          job_context: `${jobData.title} - ${jobData.experience_level} level`
        })
      });

      if (!response.ok) throw new Error('Failed to evaluate answer');

      const data = await response.json();
      setFeedback(data);
      setStep('feedback');
    } catch (err) {
      setError('Failed to evaluate answer. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswer('');
      setFeedback(null);
      setStep('practice');
    } else {
      // All questions done
      setStep('complete');
    }
  };

  const resetApp = () => {
    setStep('input');
    setJobData({ title: '', description: '', experience_level: 'entry' });
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswer('');
    setFeedback(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">InterviewIQ</h1>
          </div>
          <div className="text-sm text-gray-500">AI Interview Coach</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Job Input */}
        {step === 'input' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="w-8 h-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900">Get Started</h2>
            </div>
            <p className="text-gray-600 mb-8">Enter the job details to generate tailored interview questions</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobData.title}
                  onChange={(e) => setJobData({...jobData, title: e.target.value})}
                  placeholder="e.g., Frontend Developer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={jobData.experience_level}
                  onChange={(e) => setJobData({...jobData, experience_level: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobData.description}
                  onChange={(e) => setJobData({...jobData, description: e.target.value})}
                  placeholder="Paste the job description here..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleGenerateQuestions}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Interview Questions
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Questions List */}
        {step === 'questions' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Interview Questions</h2>
            <p className="text-gray-600 mb-8">Ready to practice? Let's start with question 1</p>

            <div className="space-y-4 mb-8">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold text-indigo-600">Question {idx + 1}</span>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {q.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-800">{q.question}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('practice')}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Practice Session
            </button>
          </div>
        )}

        {/* Step 3: Practice */}
        {step === 'practice' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Question {currentQuestion + 1} of {questions.length}</h2>
              <div className="text-sm text-gray-500">
                {Math.round(((currentQuestion) / questions.length) * 100)}% Complete
              </div>
            </div>

            <div className="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex gap-2 mb-3">
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  {questions[currentQuestion].category}
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {questions[currentQuestion].difficulty}
                </span>
              </div>
              <p className="text-lg text-gray-900 font-medium">{questions[currentQuestion].question}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  Get Feedback
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 4: Feedback */}
        {step === 'feedback' && feedback && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-900">Your Feedback</h2>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl font-bold text-indigo-600">{feedback.score}/10</div>
                <div className="text-gray-600">Overall Score</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3">✓ Strengths</h3>
                  <ul className="space-y-2">
                    {feedback.strengths.map((s, idx) => (
                      <li key={idx} className="text-sm text-green-800">{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-900 mb-3">→ Areas to Improve</h3>
                  <ul className="space-y-2">
                    {feedback.improvements.map((i, idx) => (
                      <li key={idx} className="text-sm text-amber-800">{i}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Sample Strong Answer</h3>
                <p className="text-sm text-blue-800 leading-relaxed">{feedback.sample_answer}</p>
              </div>
            </div>

            <div className="flex gap-4">
              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Next Question →
                </button>
              ) : (
                <button
                  onClick={() => setStep('complete')}
                  className="flex-1 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Complete Session
                </button>
              )}
              <button
                onClick={resetApp}
                className="px-6 py-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Great Job!</h2>
            <p className="text-gray-600 mb-8">
              You've completed all {questions.length} interview questions. Keep practicing to improve your skills!
            </p>
            <button
              onClick={resetApp}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Practice Another Job
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-500">
        Built with Pydantic AI • Made by Aditya Upadhyay
      </footer>
    </div>
  );
}
