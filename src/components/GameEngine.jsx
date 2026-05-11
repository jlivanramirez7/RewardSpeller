import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { playStaticAudio, playTTS, cancelTTS } from '../services/ttsService';

const GameEngine = ({ tierId, section, onComplete }) => {
  const { setStudentStreak, studentStreak, addStruggleWord, updateSectionScore, isDifficultyUnlocked } = useAppContext();
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [difficulty, setDifficulty] = useState('easy'); // easy, medium, hard
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [showWord, setShowWord] = useState(true);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  
  const inputRef = useRef(null);
  const isMountedRef = useRef(true); // Lifecycle guard
  
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
    // Pattern matched filename: word_apple.mp3
    const safeWord = currentWordObj.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filename = `word_${safeWord}.mp3`;

    // Dual-path dispatch: attempts local static playback, failovers automatically if absent.
    playStaticAudio(filename, null, null, textToSpeak, 'assessment');
  };

  // Cleanup TTS on unmount and mark unmounted
  useEffect(() => {
    return () => {
      isMountedRef.current = false; // Block trailing timeouts
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
      if (isMountedRef.current && inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setSessionScore(0);
    setSessionCorrectCount(0);
    setCurrentWordIndex(0);
  };

  const checkSpelling = (e) => {
    e.preventDefault();
    if (!userInput.trim() || feedback) return; // BLOCK if processing

    if (userInput.toLowerCase() === currentWord.toLowerCase()) {
      // Success
      const multiplier = Math.min(1 + (studentStreak * 0.1), 2); // Max 2x multiplier
      const basePoints = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 3 : 1;
      const earned = Math.round(basePoints * multiplier);
      const newSessionScore = sessionScore + earned;
      
      setSessionScore(newSessionScore);
      const newCorrectCount = sessionCorrectCount + 1;
      setSessionCorrectCount(newCorrectCount);
      setStudentStreak(prev => prev + 1);
      setFeedback({ type: 'success', message: `Awesome! +${earned} session points` });
      setAttemptCount(0);
      
      setTimeout(() => {
        if (!isMountedRef.current) return;
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
        } else {
          const accuracy = Math.round((newCorrectCount / words.length) * 100);
          const actualPointsAwarded = updateSectionScore(section.id, difficulty, newSessionScore, accuracy);
          alert(`Section Complete!\n\nAccuracy: ${accuracy}%\nSession Score: ${newSessionScore}\nNew Points Awarded: ${actualPointsAwarded}\n\nKeep practicing on Hard to maximize your points!`);
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
          if (!isMountedRef.current) return;
          if (currentWordIndex < words.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
          } else {
            const accuracy = Math.round((sessionCorrectCount / words.length) * 100);
            const actualPointsAwarded = updateSectionScore(section.id, difficulty, sessionScore, accuracy);
            alert(`Section Complete!\n\nAccuracy: ${accuracy}%\nSession Score: ${sessionScore}\nNew Points Awarded: ${actualPointsAwarded}\n\nKeep practicing on Hard to maximize your points!`);
            onComplete();
          }
        }, 2000);
      }
    }
  };

  if (!section || words.length === 0) return <div>No words loaded.</div>;

  // Sequential progression checks
  const isMediumUnlocked = isDifficultyUnlocked(section.id, 'medium');
  const isHardUnlocked = isDifficultyUnlocked(section.id, 'hard');

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* POINTS REFERENCE SIDEBAR */}
      <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', width: '280px', borderLeft: '4px solid #fbbf24', background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#fbbf24' }}>
            <span style={{ fontSize: '1.5rem' }}>💎</span>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem' }}>Point Values</h3>
         </div>
         <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               <span style={{ color: 'var(--text-secondary)' }}>🟩 Easy</span>
               <strong style={{ color: 'white' }}>1 pt / word</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               <span style={{ color: 'var(--text-secondary)' }}>🟨 Medium</span>
               <strong style={{ color: 'white' }}>3 pts / word</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
               <span style={{ color: 'var(--text-secondary)' }}>🟥 Hard</span>
               <strong style={{ color: 'white' }}>30 pts / word</strong>
            </li>
         </ul>
         
         <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)', fontSize: '0.8rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
            🔥 <strong>Bonus Multiply:</strong> Perfect streaks stack a bonus boost up to <strong>2.0x</strong> max per correct answer!
         </div>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', minWidth: '320px', maxWidth: '600px', flex: '1 1 350px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.6)' }}>
      
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={() => speakWord()}>
          🔊 Hear Word Again
        </button>
        <select 
          value={difficulty} 
          onChange={handleDifficultyChange}
          style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          <option value="easy" style={{color: 'black'}}>Easy (Copy)</option>
          <option value="medium" disabled={!isMediumUnlocked} style={{color: isMediumUnlocked ? 'black' : '#94a3b8'}}>{isMediumUnlocked ? 'Medium (Recall)' : '🔒 Medium (Finish Easy First)'}</option>
          <option value="hard" disabled={!isHardUnlocked} style={{color: isHardUnlocked ? 'black' : '#94a3b8'}}>{isHardUnlocked ? 'Hard (Dictate)' : '🔒 Hard (Finish Medium First)'}</option>
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
        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={feedback !== null}>
          {feedback ? 'Checking...' : 'Check Spelling'}
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
      
    </div>
  );
};

export default GameEngine;
