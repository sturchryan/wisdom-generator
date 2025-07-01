import React, { useState } from 'react';
import { Heart, Sparkles, User, MapPin } from 'lucide-react';

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

  // EmailJS Configuration
  const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_t96az0z',
    TEMPLATE_ID: 'template_bvkjdlq', 
    PUBLIC_KEY: 'TBmm5WjlwKjlTuPRf',
    TO_EMAIL: 'wisdomshare.co@gmail.com'
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
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-16 h-16 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">The Wisdom Generator</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Share the wisdom you've gained through life's journey. We'll ask about different decades 
              of your life to capture the lessons you wish you could have told your younger self.
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Name (optional)
              </label>
              <input
                type="text"
                placeholder="What should we call you? (optional)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={responses.name}
                onChange={(e) => setResponses(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location (optional)
              </label>
              <input
                type="text"
                placeholder="City, state, country - whatever you're comfortable sharing"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={responses.location}
                onChange={(e) => setResponses(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How old are you? *
              </label>
              <input
                type="number"
                placeholder="Your age"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            className="w-full mt-8 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Begin My Wisdom Journey
          </button>
          
          {responses.age && parseInt(responses.age) < 18 && (
            <p className="text-red-500 text-sm mt-2 text-center">
              This experience is designed for adults 18+
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === 'age-confirm') {
    const calculatedDecades = calculateDecades(responses.age);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Perfect!</h2>
            <p className="text-lg text-gray-600 mb-6">
              I'll ask you about the wisdom you've gained from different periods of your life.
            </p>
            
            <div className="bg-purple-50 p-6 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-3">We'll explore these decades:</h3>
              <div className="space-y-2">
                {calculatedDecades.map((decade, index) => (
                  <div key={decade} className="text-purple-700 font-medium">
                    {index + 1}. What you wish you knew {getDecadeLabel(decade)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleAgeSubmit}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Let's Start Sharing Wisdom
          </button>
        </div>
      </div>
    );
  }

  if (step === 'wisdom') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">
                Question {currentDecadeIndex + 1} of {decades.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentDecadeIndex + 1) / decades.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              What do you know now that you wish you knew {getDecadeLabel(currentDecade)}?
            </h2>
            <p className="text-gray-600">
              Think about the lessons, insights, or wisdom you've gained since then.
            </p>
          </div>

          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder="Share your wisdom here... What would you tell your younger self?"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-32 resize-y"
            rows={6}
          />

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleWisdomSubmit}
              disabled={!currentResponse.trim()}
              className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Share This Wisdom
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-3 text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'encouragement') {
    const currentWisdomData = responses.wisdom[currentDecade] || responses.wisdom['additional'];
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
          <Heart className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {currentWisdomData?.encouragement || getRandomEncouragement()}
          </h2>
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-purple-200 rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'final-wisdom') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">
                Final Question
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full w-full"></div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Is there any additional wisdom you'd like to share?
            </h2>
            <p className="text-gray-600">
              Any other life lessons, insights, or advice that comes to mind? This is completely optional.
            </p>
          </div>

          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder="Share any additional wisdom, life lessons, or insights... (optional)"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-32 resize-y"
            rows={6}
          />

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleFinalWisdomSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : currentResponse.trim() ? 'Share Final Wisdom' : 'Complete Journey'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Your Wisdom Journey</h2>
              <p className="text-lg text-gray-600">
                Thank you for sharing your life's wisdom. Here's your complete reflection:
              </p>
            </div>

            <div className="space-y-6">
              {Object.entries(responses.wisdom).map(([decade, data]) => (
                <div key={decade} className="bg-purple-50 p-6 rounded-xl">
                  <h3 className="font-bold text-purple-700 text-lg mb-3">
                    {decade === 'additional' ? 'Additional wisdom:' : `Wisdom from ${getDecadeLabel(decade)}:`}
                  </h3>
                  <p className="text-gray-700 leading-relaxed italic">
                    "{data.response}"
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl">
              <h3 className="font-bold text-gray-700 mb-2">Session Summary</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Age:</strong> {responses.age}</p>
                {responses.name && <p><strong>Name:</strong> {responses.name}</p>}
                {responses.location && <p><strong>Location:</strong> {responses.location}</p>}
                <p><strong>Wisdom shared across:</strong> {Object.keys(responses.wisdom).length} life periods</p>
                <p><strong>Total participants:</strong> {allSessions.length + 1}</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={resetSurvey}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Share Another Person's Wisdom
              </button>
            </div>
          </div>

          {allSessions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Previous Wisdom Shared</h3>
              <div className="space-y-4">
                {allSessions.slice(-3).map((session) => (
                  <div key={session.id} className="border-l-4 border-purple-300 pl-4 py-2">
                    <p className="text-sm text-gray-500">
                      {session.name ? `${session.name} • ` : ''}Age {session.age} • {new Date(session.timestamp).toLocaleDateString()}
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
    );
  }

  return null;
};

export default WisdomGenerator;
