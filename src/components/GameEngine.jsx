import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { playTTS, cancelTTS } from '../services/ttsService';

const GameEngine = ({ tierId, section, onComplete }) => {
  const { setStudentStreak, studentStreak, addStruggleWord, updateSectionScore } = useAppContext();
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [difficulty, setDifficulty] = useState('easy'); // easy, medium, hard
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [showWord, setShowWord] = useState(true);
  const [sessionScore, setSessionScore] = useState(0);
  
  const inputRef = useRef(null);
  
  const [shuffledWords, setShuffledWords] = useState([]);
  
  useEffect(() => {
    if (section?.words) {
      setShuffledWords([...section.words].sort(() => Math.random() - 0.5));
      setCurrentWordIndex(0);
    }
  }, [section]);

  // The word list for the current section
  const words = shuffledWords;
  const currentWordObj = words[currentWordIndex];
  const currentWord = currentWordObj?.word || '';

  // Text-to-Speech
  const speakWord = () => {
    if (!currentWordObj) return;
    const textToSpeak = `${currentWordObj.word}. ${currentWordObj.definition} ${currentWordObj.sentence} The word is: ${currentWordObj.word}.`;
    playTTS(textToSpeak, 'assessment');
  };

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      cancelTTS();
    };
  }, []);

  useEffect(() => {
    if (words.length > 0) {
      startNewWord();
    }
  }, [currentWordIndex, difficulty]);

  const [attemptCount, setAttemptCount] = useState(0);

  const startNewWord = () => {
    setUserInput('');
    setFeedback(null);
    setAttemptCount(0);
    speakWord();
    
    if (difficulty === 'easy') {
      setShowWord(true);
    } else if (difficulty === 'medium') {
      setShowWord(true);
      setTimeout(() => setShowWord(false), 3000); // Hide after 3 seconds
    } else {
      setShowWord(false);
    }
    
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setSessionScore(0);
    setCurrentWordIndex(0);
  };

  const checkSpelling = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    if (userInput.toLowerCase() === currentWord.toLowerCase()) {
      // Success
      const multiplier = Math.min(1 + (studentStreak * 0.1), 2); // Max 2x multiplier
      const basePoints = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 3 : 1;
      const earned = Math.round(basePoints * multiplier);
      const newSessionScore = sessionScore + earned;
      
      setSessionScore(newSessionScore);
      setStudentStreak(prev => prev + 1);
      setFeedback({ type: 'success', message: `Awesome! +${earned} session points` });
      setAttemptCount(0);
      
      setTimeout(() => {
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
        } else {
          const actualPointsAwarded = updateSectionScore(section.id, difficulty, newSessionScore);
          alert(`Section Complete!\n\nSession Score: ${newSessionScore}\nNew Points Awarded: ${actualPointsAwarded}\n\nKeep practicing on Hard to maximize your points!`);
          onComplete(); // Finish section assessment
        }
      }, 1500);
      
    } else {
      // Error
      setStudentStreak(0);
      addStruggleWord(currentWord, tierId, 'spelling_error');
      
      if (attemptCount === 0) {
        // First mistake, try again
        setAttemptCount(1);
        
        // Smart feedback basic logic
        let hint = 'Try again!';
        if (userInput.length < currentWord.length) {
          hint = "Looks like you're missing some letters.";
        } else if (userInput.length > currentWord.length) {
          hint = "Too many letters!";
        } else if (currentWord.endsWith('e') && !userInput.endsWith('e')) {
          hint = "Don't forget the silent 'e' at the end!";
        }

        setFeedback({ type: 'error', message: hint });
        speakWord(); // Re-dictate on error
      } else {
        // Second mistake, mark wrong and move on
        setFeedback({ type: 'error', message: `Incorrect. The correct spelling is: ${currentWord}` });
        speakWord();
        setAttemptCount(0);
        setTimeout(() => {
          if (currentWordIndex < words.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
          } else {
            const actualPointsAwarded = updateSectionScore(section.id, difficulty, sessionScore);
            alert(`Section Complete!\n\nSession Score: ${sessionScore}\nNew Points Awarded: ${actualPointsAwarded}\n\nKeep practicing on Hard to maximize your points!`);
            onComplete();
          }
        }, 2000);
      }
    }
  };

  if (!section || words.length === 0) return <div>No words loaded.</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={() => speakWord()}>
          🔊 Hear Word Again
        </button>
        <select 
          value={difficulty} 
          onChange={handleDifficultyChange}
          style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
        >
          <option value="easy" style={{color: 'black'}}>Easy (Copy-Type)</option>
          <option value="medium" style={{color: 'black'}}>Medium (Recall-Type)</option>
          <option value="hard" style={{color: 'black'}}>Hard (Dictation)</option>
        </select>
      </div>

      {/* Visual Support (The Word) */}
      <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
        {showWord ? (
          <h2 style={{ fontSize: '3rem', letterSpacing: '2px', color: 'var(--text-primary)' }}>
            {currentWord}
          </h2>
        ) : (
          <h2 style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.1)' }}>
            {/* Visual placeholder dots */}
            {currentWord.split('').map(() => '•').join('')}
          </h2>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={checkSpelling}>
        <input 
          ref={inputRef}
          type="text" 
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type the word here..."
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.5rem',
            borderRadius: '12px',
            border: '2px solid var(--surface-border)',
            background: 'rgba(0,0,0,0.2)',
            color: 'white',
            textAlign: 'center',
            marginBottom: '1rem',
            outline: 'none'
          }}
          disabled={feedback?.type === 'success'}
        />
        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Check Spelling
        </button>
      </form>

      {/* Feedback Message */}
      {feedback && (
        <div 
          className="animate-fade-in"
          style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            borderRadius: '8px',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: feedback.type === 'success' ? 'var(--success-color)' : 'var(--error-color)',
            fontWeight: 'bold'
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Progress */}
      <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Word {currentWordIndex + 1} of {words.length}
      </div>
      
    </div>
  );
};

export default GameEngine;
