// src/App.js
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Zap, User, LogIn, UserPlus, Menu, X, Target } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { resumeOptimizationService, analyticsService } from './services/firestoreService';
import PDFUpload from './components/PDFUpload';
import JobTracker from './components/JobTracker';

// Main App Component wrapped with AuthProvider
function App() {
  return (
    <AuthProvider>
      <ChantelleAI />
    </AuthProvider>
  );
}

const ChantelleAI = () => {
  const { currentUser, login, signup, logout, signInWithGoogle } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [authLoading, setAuthLoading] = useState(false);
  const [userOptimizations, setUserOptimizations] = useState([]);

  // Load user data when authenticated
  useEffect(() => {
    if (currentUser) {
      loadUserOptimizations();
      setCurrentView('optimizer');
    } else {
      setCurrentView('home');
    }
  }, [currentUser]);

  // Load user's optimization history
  const loadUserOptimizations = async () => {
    try {
      const optimizations = await resumeOptimizationService.getUserOptimizations(currentUser.uid);
      setUserOptimizations(optimizations);
    } catch (error) {
      console.error('Error loading optimizations:', error);
    }
  };

  // Handle authentication
  const handleAuth = async (e, email, password) => {
    e.preventDefault();
    setAuthLoading(true);
    
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      setShowAuthModal(false);
      
      // Track user activity
      if (currentUser) {
        await analyticsService.trackActivity(currentUser.uid, 'user_login');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
    } catch (error) {
      console.error('Google sign in error:', error);
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setCurrentView('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation Component
  const Navigation = () => (
    <nav className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Chantelle AI
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {currentUser ? (
              <>
                <button 
                  onClick={() => setCurrentView('optimizer')}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'optimizer' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-purple-600'}`}
                >
                  Optimizer
                </button>
                <button 
                  onClick={() => setCurrentView('tracker')}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'tracker' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-purple-600'}`}
                >
                  Tracker
                </button>
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-purple-600'}`}
                >
                  Dashboard
                </button>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-purple-600 transition-colors"
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </button>
                <button 
                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <UserPlus size={18} />
                  <span>Sign Up</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {currentUser ? (
              <div className="space-y-2">
                <button 
                  onClick={() => { setCurrentView('optimizer'); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-purple-50 rounded-lg"
                >
                  Optimizer
                </button>
                <button 
                  onClick={() => { setCurrentView('tracker'); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-purple-50 rounded-lg"
                >
                  Tracker
                </button>
                <button 
                  onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-purple-50 rounded-lg"
                >
                  Dashboard
                </button>
                <button 
                  onClick={handleLogout} 
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button 
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-purple-50 rounded-lg"
                >
                  Login
                </button>
                <button 
                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );

  // Auth Modal Component
  const AuthModal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <button onClick={() => setShowAuthModal(false)}>
              <X size={24} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              onClick={(e) => handleAuth(e, email, password)}
              disabled={authLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
            >
              {authLoading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
            </button>

            <div className="text-center text-gray-500">or</div>

            <button 
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Continue with Google
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-purple-600 hover:text-purple-700"
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Land Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Dream Job</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Our AI analyzes your resume against job descriptions and optimizes it with the right keywords to beat ATS systems and land more interviews.
          </p>
          <button 
            onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            className="bg-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="text-purple-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Upload Resume</h3>
            <p className="text-gray-600">Upload your current resume or paste the content directly into our platform.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-blue-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Add Job Description</h3>
            <p className="text-gray-600">Paste the job description you're applying for to get targeted optimizations.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Get Optimized Resume</h3>
            <p className="text-gray-600">Receive an AI-optimized resume with relevant keywords and improvements.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Resume Optimizer Component with PDF upload integration
  const ResumeOptimizer = () => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizedResume, setOptimizedResume] = useState('');

    // Handle text extraction from PDF
    const handleTextExtracted = (extractedText) => {
      setResumeText(extractedText);
    };

    // Handle manual text changes
    const handleTextChange = (text) => {
      setResumeText(text);
    };

    const handleOptimize = async () => {
      if (!resumeText.trim() || !jobDescription.trim()) {
        alert('Please provide both resume content and job description');
        return;
      }

      setIsOptimizing(true);
      
      try {
        // Track optimization activity
        await analyticsService.trackActivity(currentUser.uid, 'optimization_started', {
          jobTitle: jobTitle || 'Untitled Position',
          resumeLength: resumeText.length,
          jobDescriptionLength: jobDescription.length
        });

        // TODO: Replace this with actual AI API call
        // For now, we'll simulate AI processing
        setTimeout(async () => {
          const optimizedContent = generateOptimizedResume(resumeText, jobDescription);
          setOptimizedResume(optimizedContent);

          // Save optimization to Firebase
          try {
            await resumeOptimizationService.saveOptimization(currentUser.uid, {
              originalResume: resumeText,
              jobDescription,
              optimizedResume: optimizedContent,
              jobTitle: jobTitle || 'Untitled Position',
              keywords: extractKeywords(jobDescription),
              improvements: [
                'Added relevant keywords from job description',
                'Improved action verbs and quantified achievements',
                'Enhanced technical skills alignment',
                'Optimized for ATS compatibility'
              ]
            });

            // Reload user optimizations
            await loadUserOptimizations();

            // Track completion
            await analyticsService.trackActivity(currentUser.uid, 'optimization_completed', {
              jobTitle: jobTitle || 'Untitled Position'
            });

          } catch (error) {
            console.error('Error saving optimization:', error);
            alert('Optimization completed but failed to save. Please try again.');
          }

          setIsOptimizing(false);
        }, 3000);

      } catch (error) {
        console.error('Error during optimization:', error);
        alert('Optimization failed. Please try again.');
        setIsOptimizing(false);
      }
    };

    // Helper function to extract keywords from job description
    const extractKeywords = (jobDesc) => {
      const commonSkills = [
        'React', 'JavaScript', 'Python', 'Java', 'Node.js', 'SQL', 'AWS', 'Docker',
        'Git', 'Agile', 'Scrum', 'Machine Learning', 'Data Analysis', 'Leadership',
        'Communication', 'Problem-solving', 'Team collaboration', 'Project management'
      ];
      
      return commonSkills.filter(skill => 
        jobDesc.toLowerCase().includes(skill.toLowerCase())
      );
    };

    // Helper function to generate optimized resume (placeholder for AI)
    const generateOptimizedResume = (originalResume, jobDesc) => {
      const keywords = extractKeywords(jobDesc);
      
      return `OPTIMIZED RESUME:

${originalResume}

[AI IMPROVEMENTS ADDED]
• Added relevant keywords: ${keywords.join(', ')}
• Improved action verbs and quantified achievements
• Enhanced technical skills alignment
• Optimized for ATS compatibility
• Tailored content to match job requirements

Keywords matched: ${keywords.length}
Optimization score: ${Math.floor(Math.random() * 20) + 80}%`;
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Resume Optimizer</h1>
            <p className="text-gray-600">Upload your resume and job description to get AI-powered optimizations</p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Job Title (e.g., Frontend Developer at Google)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Resume Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="mr-2" size={20} />
                Upload Resume
              </h2>
              
              <PDFUpload
                onTextExtracted={handleTextExtracted}
                currentText={resumeText}
                onTextChange={handleTextChange}
              />
            </div>

            {/* Job Description Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="mr-2" size={20} />
                Job Description
              </h2>
              
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              
              {jobDescription && (
                <div className="mt-3 text-sm text-gray-600">
                  {jobDescription.length} characters • {jobDescription.split(' ').length} words
                </div>
              )}
            </div>
          </div>

          {/* Optimize Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !resumeText.trim() || !jobDescription.trim()}
              className="bg-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="mr-2" size={20} />
                  Optimize Resume
                </>
              )}
            </button>
            
            {(!resumeText.trim() || !jobDescription.trim()) && (
              <p className="text-sm text-gray-500 mt-2">
                Please upload a resume and add a job description to continue
              </p>
            )}
          </div>

          {/* Results Section */}
          {optimizedResume && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Your Original Resume</h3>
                <div className="bg-gray-50 p-4 rounded-lg h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">{resumeText}</pre>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-700">AI-Optimized Resume</h3>
                <div className="bg-green-50 p-4 rounded-lg h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">{optimizedResume}</pre>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(optimizedResume);
                      analyticsService.trackActivity(currentUser.uid, 'resume_copied');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy Text
                  </button>
                  <button 
                    onClick={() => analyticsService.trackActivity(currentUser.uid, 'resume_downloaded')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Dashboard Component with real Firebase data
  const Dashboard = () => {
    const [userStats, setUserStats] = useState({
      totalOptimizations: 0,
      successRate: 0,
      savedResumes: 0
    });

    useEffect(() => {
      // Calculate user stats from optimizations
      if (userOptimizations.length > 0) {
        setUserStats({
          totalOptimizations: userOptimizations.length,
          successRate: Math.floor(Math.random() * 30) + 70, // Mock success rate
          savedResumes: userOptimizations.length
        });
      }
    }, [userOptimizations]);

    const deleteOptimization = async (optimizationId) => {
      try {
        await resumeOptimizationService.deleteOptimization(optimizationId, currentUser.uid);
        await loadUserOptimizations();
      } catch (error) {
        console.error('Error deleting optimization:', error);
        alert('Failed to delete optimization');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button 
              onClick={() => setCurrentView('optimizer')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              New Optimization
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Optimizations</h3>
              <p className="text-3xl font-bold text-purple-600">{userStats.totalOptimizations}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Success Rate</h3>
              <p className="text-3xl font-bold text-green-600">{userStats.successRate}%</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Saved Resumes</h3>
              <p className="text-3xl font-bold text-blue-600">{userStats.savedResumes}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Optimizations</h2>
            {userOptimizations.length > 0 ? (
              <div className="space-y-4">
                {userOptimizations.map((optimization) => (
                  <div key={optimization.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{optimization.jobTitle}</h3>
                      <p className="text-sm text-gray-500">
                        Optimized {new Date(optimization.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-2">
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          {optimization.keywords?.length || 0} keywords matched
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                        View
                      </button>
                      <button 
                        onClick={() => analyticsService.trackActivity(currentUser.uid, 'resume_downloaded')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Download
                      </button>
                      <button 
                        onClick={() => deleteOptimization(optimization.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No optimizations yet</p>
                <button 
                  onClick={() => setCurrentView('optimizer')}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Your First Optimization
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main App Render
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {currentView === 'home' && <LandingPage />}
      {currentView === 'optimizer' && <ResumeOptimizer />}
      {currentView === 'tracker' && <JobTracker currentUser={currentUser} />}
      {currentView === 'dashboard' && <Dashboard />}
      
      {showAuthModal && <AuthModal />}
    </div>
  );
};

export default App;