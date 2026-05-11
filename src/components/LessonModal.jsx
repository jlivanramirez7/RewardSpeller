import React, { useEffect, useState } from 'react';
import { playTTS, cancelTTS } from '../services/ttsService';
import { useAppContext } from '../context/AppContext';

const LessonModal = ({ lessonData, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { markLessonListened } = useAppContext();

  const handleClose = () => {
    if (lessonData && lessonData.id) {
      markLessonListened(lessonData.id);
    }
    onClose();
  };

  useEffect(() => {
    playAudio();

    return () => {
      cancelTTS();
    };
  }, [lessonData]);

  const playAudio = () => {
    cancelTTS();
    if (!lessonData.lessonScript) return;

    playTTS(
      lessonData.lessonScript, 
      'jedi', 
      () => setIsPlaying(true), 
      () => setIsPlaying(false)
    );
  };

  const stopAudio = () => {
    cancelTTS();
    setIsPlaying(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        background: 'var(--surface-color)',
        maxWidth: '900px',
        width: '90%',
        maxHeight: '90vh',
        height: '90vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            width: '32px', height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--surface-border)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', marginBottom: '0.5rem' }}>Jedi Master Lesson</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Focus: {lessonData.theme || lessonData.name}</p>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
          {lessonData.imagePath && (
            <img 
              src={lessonData.imagePath} 
              alt="Jedi Master Lesson Infographic" 
              style={{
                width: '100%',
                maxWidth: '500px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '4px solid #fbbf24'
              }}
            />
          )}

          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            padding: '2rem',
            borderRadius: '12px',
            borderLeft: '4px solid #fbbf24',
            fontSize: '1.3rem',
            lineHeight: '1.6',
            maxWidth: '700px'
          }}>
            <p>"{lessonData.lessonScript}"</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1rem' }}>
            {isPlaying ? (
              <button className="btn-secondary" onClick={stopAudio}>⏸ Stop Audio</button>
            ) : (
              <button className="btn-secondary" onClick={playAudio}>▶️ Replay Audio</button>
            )}
            <button className="btn-primary" onClick={handleClose}>Ready to Play!</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonModal;
