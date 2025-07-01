import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, User, MapPin, Fish, Shell, Brain, Lightbulb } from 'lucide-react';

const WisdomGenerator = () => {
  const [step, setStep] = useState('welcome');
  const [responses, setResponses] = useState({
    age: '',
    name: '',
    location: '',
    wisdom: {}
  });
  const [currentDecade, setCurrentDecade] = useState(null);
  const [decades, setDecades] = useState([]);
  const [currentDecadeIndex, setCurrentDecadeIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  const [allSessions, setAllSessions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // EmailJS Configuration
  const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_t96az0z',
    TEMPLATE_ID: 'template_bvkjdlq', 
    PUBLIC_KEY: 'TBmm5WjlwKjlTuPRf',
    TO_EMAIL: 'wisdomshare.co@gmail.com'
  };

  // Floating Icons Component
  const FloatingIcons = () => {
    const icons = [
      { Icon: Fish, delay: 0, duration: 8 },
      { Icon: Shell, delay: 2, duration: 10 },
      { Icon: Brain, delay: 4, duration: 12 },
      { Icon: Lightbulb, delay: 6, duration: 9 },
      { Icon: Fish, delay: 8, duration: 11 },
      { Icon: Shell, delay: 10, duration: 7 }
    ];

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {icons.map((item, index) => (
          <div
            key={index}
            className="absolute animate-float opacity-20"
            style={{
              left: `${10 + (index * 15)}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`
            }}
          >
            <item.Icon className="w-8 h-8 text-teal-400" />
          </div>
        ))}
      </div>
    );
  };

  // Confetti Component
  const Confetti = () => {
    if (!showConfetti) return null;

    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-teal-400 rounded animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    );
  };

  const encouragingMessages = [
    "Thank you for sharing that wisdom",
    "That's really powerful insight",
    "Wow, great perspective", 
    "What valuable experience to share",
    "That's wisdom worth passing on",
    "Beautiful reflection",
    "So much wisdom in those words",
    "Thank you for that thoughtful response"
  ];

  const getRandomEncouragement = () => {
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  };

  const calculateDecades = (age) => {
    const ageNum = parseInt(age);
    const decades = [];
    
    let currentDecadeStart = Math.floor((ageNum - 1) / 10) * 10;
    
    while (currentDecadeStart >= 20) {
      decades.push(currentDecadeStart);
      currentDecadeStart -= 10;
    }
    
    if (ageNum >= 20) {
      decades.push('teens');
    }
    
    return decades;
  };

  const getDecadeLabel = (decade) => {
    if (decade === 'teens') return 'as a teenager';
    return `in your ${decade}s`;
  };

  const handleAgeSubmit = async () => {
    const calculatedDecades = calculateDecades(responses.age);
    setDecades(calculatedDecades);
    if (calculatedDecades.length > 0) {
      setCurrentDecade(calculatedDecades[0]);
      setStep('wisdom');
    } else {
      setStep('complete');
    }
  };

  const handleWisdomSubmit = async () => {
    if (!currentResponse.trim()) return;

    const encouragement = await getAIEncouragement(currentResponse);
    
    const newWisdom = {
      ...responses.wisdom,
      [currentDecade]: {
        response: currentResponse,
        encouragement: encouragement
      }
    };
    
    setResponses(prev => ({
      ...prev,
      wisdom: newWisdom
    }));

    setStep('encouragement');
    
    setTimeout(() => {
      moveToNextQuestion(newWisdom);
    }, 2500);
  };

  const handleSkip = () => {
    moveToNextQuestion(responses.wisdom);
  };

  const moveToNextQuestion = (currentWisdom) => {
    const nextIndex = currentDecadeIndex + 1;
    if (nextIndex < decades.length) {
      setCurrentDecadeIndex(nextIndex);
      setCurrentDecade(decades[nextIndex]);
      setCurrentResponse('');
      setStep('wisdom');
    } else {
      setStep('final-wisdom');
    }
  };

  const handleFinalWisdomSubmit = async () => {
    let finalWisdom = responses.wisdom;
    
    if (currentResponse.trim()) {
      const encouragement = await getAIEncouragement(currentResponse);
      
      finalWisdom = {
        ...responses.wisdom,
        'additional': {
          response: currentResponse,
          encouragement: encouragement
        }
      };
      
      setResponses(prev => ({
        ...prev,
        wisdom: finalWisdom
      }));

      setStep('encouragement');
      
      setTimeout(() => {
        completeSurvey(finalWisdom);
      }, 2500);
    } else {
      completeSurvey(finalWisdom);
    }
  };

  const sendEmailNotification = async (sessionData) => {
    try {
      const emailjs = (await import('@emailjs/browser')).default;

      const wisdomEntries = Object.entries(sessionData.wisdom).map(([decade, data]) => {
        const label = decade === 'additional' ? 'Additional wisdom' : 
                      decade === 'teens' ? 'Wisdom from teenage years' : 
                      `Wisdom from ${decade}s`;
        return `${label}:\n"${data.response}"`;
      }).join('\n\n');

      const emailParams = {
        to_email: EMAILJS_CONFIG.TO_EMAIL,
        participant_age: sessionData.age,
        participant_name: sessionData.name || 'Not specified',
        participant_location: sessionData.location || 'Not specified',
        submission_time: new Date(sessionData.timestamp).toLocaleString(),
        wisdom_content: wisdomEntries,
        total_responses: Object.keys(sessionData.wisdom).length
      };

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        emailParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('✅ Email notification sent successfully!');
      return true;
    } catch (error) {
      console.error('❌ Email notification failed:', error);
      return false;
    }
  };

  const completeSurvey = async (finalWisdom) => {
    setIsSubmitting(true);

    const completedSession = {
      ...responses,
      wisdom: finalWisdom,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    await sendEmailNotification(completedSession);

    setAllSessions(prev => [...prev, completedSession]);
    setIsSubmitting(false);
    
    // Trigger confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
    
    setStep('complete');
  };

  const getAIEncouragement = async (userResponse) => {
    try {
      const prompt = `The user just shared this wisdom: "${userResponse}"

Respond with a brief, warm, encouraging message (1-2 sentences max) that acknowledges their insight. Be genuine and specific to what they shared. Examples of good responses:
- "That's such valuable wisdom about relationships"
- "What a powerful lesson about resilience" 
- "Thank you for sharing that insight about growth"

Your response:`;

      const aiResponse = await window.claude.complete(prompt);
      return aiResponse.trim();
    } catch (error) {
      console.error('Error getting AI encouragement:', error);
      return getRandomEncouragement();
    }
  };

  const resetSurvey = () => {
    setStep('welcome');
    setResponses({ age: '', name: '', location: '', wisdom: {} });
    setCurrentDecade(null);
    setDecades([]);
    setCurrentDecadeIndex(0);
    setCurrentResponse('');
    setIsSubmitting(false);
    setShowConfetti(false);
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-50 to-cyan-100 relative overflow-hidden">
        <FloatingIcons />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 max-w-4xl w-full border border-teal-200">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Brain className="w-20 h-20 text-teal-600 animate-pulse" />
                  <Sparkles className="w-8 h-8 text-blue-500 absolute -top-2 -right-2 animate-bounce" />
                </div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4">
                The Wisdom Generator
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
                Share the wisdom you've gained through life's journey. We'll ask about different decades 
                of your life to capture the lessons you wish you could have told your younger self.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2 text-teal-600" />
                  Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="What should we call you?"
                  className="w-full p-4 border-2 border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:border-teal-300"
                  value={responses.name}
                  onChange={(e) => setResponses(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2 text-blue-600" />
                  Location (optional)
                </label>
                <input
                  type="text"
                  placeholder="Where are you from?"
                  className="w-full p-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                  value={responses.location}
                  onChange={(e) => setResponses(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Brain className="w-4 h-4 inline mr-2 text-cyan-600" />
                  How old are you? *
                </label>
                <input
                  type="number"
                  placeholder="Your age"
                  className="w-full p-4 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 hover:border-cyan-300"
                  value={responses.age}
                  onChange={(e) => setResponses(prev => ({ ...prev, age: e.target.value }))}
                  min="15"
                  max="120"
                />
              </div>
            </div>

            <button
              onClick={() => setStep('age-confirm')}
              disabled={!responses.age || parseInt(responses.age) < 18}
              className="w-full mt-6 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-teal-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🌊 Begin My Wisdom Journey 🌊
            </button>
            
            {responses.age && parseInt(responses.age) < 18 && (
              <p className="text-red-500 text-sm mt-3 text-center bg-red-50 p-3 rounded-lg">
                This experience is designed for adults 18+
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'age-confirm') {
    const calculatedDecades = calculateDecades(responses.age);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-50 to-cyan-100 relative overflow-hidden">
        <FloatingIcons />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-3xl w-full border border-teal-200">
            <div className="text-center mb-8">
              <Brain className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-pulse" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Perfect!
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                I'll ask you about the wisdom you've gained from different periods of your life.
              </p>
              
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-2xl border border-teal-200">
                <h3 className="font-bold text-gray-700 mb-4 text-lg">🐠 We'll explore these decades:</h3>
                <div className="space-y-3">
                  {calculatedDecades.map((decade, index) => (
                    <div key={decade} className="bg-white/60 p-3 rounded-xl text-teal-700 font-medium border border-teal-100">
                      {index + 1}. What you wish you knew {getDecadeLabel(decade)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleAgeSubmit}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-teal-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🌊 Let's Start Sharing Wisdom 🌊
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'wisdom') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-50 to-cyan-100 relative overflow-hidden">
        <FloatingIcons />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-4xl w-full border border-teal-200">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-gray-600 bg-teal-50 px-4 py-2 rounded-full border border-teal-200">
                  🐚 Question {currentDecadeIndex + 1} of {decades.length}
                </span>
                <div className="w-48 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${((currentDecadeIndex + 1) / decades.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-3">
                What do you know now that you wish you knew {getDecadeLabel(currentDecade)}?
              </h2>
              <p className="text-lg text-gray-700">
                Think about the lessons, insights, or wisdom you've gained since then. 🌊
              </p>
            </div>

            <textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder="Share your wisdom here... What would you tell your younger self? 💫"
              className="w-full p-6 border-2 border-teal-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-40 resize-y text-lg transition-all duration-200 hover:border-teal-300"
              rows={8}
            />

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleWisdomSubmit}
                disabled={!currentResponse.trim()}
                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-teal-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🌊 Share This Wisdom
              </button>
              <button
                onClick={handleSkip}
                className="px-6 py-4 text-teal-600 hover:text-teal-800 text-lg underline decoration-wavy transition-colors"
              >
                Skip 🐠
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'encouragement') {
    const currentWisdomData = responses.wisdom[currentDecade] || responses.wisdom['additional'];
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-blue-100 relative overflow-hidden">
        <FloatingIcons />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-2xl w-full text-center border border-emerald-200">
            <Heart className="w-20 h-20 text-emerald-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
              {currentWisdomData?.encouragement || getRandomEncouragement()}
            </h2>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'final-wisdom') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-50 to-cyan-100 relative overflow-hidden">
        <FloatingIcons />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-4xl w-full border border-teal-200">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                  🌊 Final Question
                </span>
                <div className="w-48 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-3 rounded-full w-full"></div>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-3">
                Is there any additional wisdom you'd like to share?
              </h2>
              <p className="text-lg text-gray-700">
                Any other life lessons, insights, or advice that comes to mind? This is completely optional. ✨
              </p>
            </div>

            <textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder="Share any additional wisdom, life lessons, or insights... (optional) 🌟"
              className="w-full p-6 border-2 border-teal-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-40 resize-y text-lg transition-all duration-200 hover:border-teal-300"
              rows={8}
            />

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleFinalWisdomSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-teal-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {isSubmitting ? '🌊 Submitting...' : currentResponse.trim() ? '🌊 Share Final Wisdom' : '🌊 Complete Journey'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-50 to-cyan-100 relative overflow-hidden">
        <FloatingIcons />
        <Confetti />
        <div className="relative z-10 min-h-screen p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-teal-200">
              <div className="text-center mb-8">
                <div className="relative mb-6">
                  <Brain className="w-24 h-24 text-teal-600 mx-auto animate-pulse" />
                  <Sparkles className="w-12 h-12 text-blue-500 absolute -top-2 -right-2 animate-bounce" />
                </div>
                <h2 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  Your Wisdom Journey
                </h2>
                <p className="text-xl text-gray-700">
                  Thank you for sharing your life's wisdom. Here's your complete reflection: 🌊
                </p>
              </div>

              <div className="grid gap-6">
                {Object.entries(responses.wisdom).map(([decade, data]) => (
                  <div key={decade} className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-2xl border-l-4 border-teal-400 shadow-md">
                    <h3 className="font-bold text-teal-700 text-xl mb-3">
                      🐚 {decade === 'additional' ? 'Additional wisdom:' : `Wisdom from ${getDecadeLabel(decade)}:`}
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg italic">
                      "{data.response}"
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-100 to-teal-100 rounded-2xl border border-blue-200">
                <h3 className="font-bold text-gray-700 mb-3 text-xl">🌊 Session Summary</h3>
                <div className="grid md:grid-cols-2 gap-4 text-gray-600">
                  <p><strong>Age:</strong> {responses.age}</p>
                  {responses.name && <p><strong>Name:</strong> {responses.name}</p>}
                  {responses.location && <p><strong>Location:</strong> {responses.location}</p>}
                  <p><strong>Wisdom shared across:</strong> {Object.keys(responses.wisdom).length} life periods</p>
                  <p><strong>Total participants:</strong> {allSessions.length + 1}</p>
                  <p><strong>Completed:</strong> {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={resetSurvey}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-teal-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🌊 Share Another Person's Wisdom 🌊
                </button>
              </div>
            </div>

            {allSessions.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-teal-200">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-6">
                  🐠 Previous Wisdom Shared
                </h3>
                <div className="grid gap-4">
                  {allSessions.slice(-3).map((session) => (
                    <div key={session.id} className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-xl border-l-4 border-teal-300">
                      <p className="text-sm text-gray-600 mb-2">
                        {session.name ? `🌊 ${session.name} • ` : ''}Age {session.age} • {new Date(session.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 italic">
                        "{Object.values(session.wisdom)[0]?.response.substring(0, 100)}..."
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Add custom CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(5deg); }
    66% { transform: translateY(-10px) rotate(-5deg); }
  }
  
  @keyframes confetti {
    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  
  .animate-float {
    animation: float 8s ease-in-out infinite;
  }
  
  .animate-confetti {
    animation: confetti 3s linear forwards;
  }
`;
document.head.appendChild(style);

export default WisdomGenerator;
