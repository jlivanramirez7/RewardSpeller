import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { warmupAudio } from '../services/ttsService';
import { getWordleDateKey } from '../utils/wordle';
import GameEngine from '../components/GameEngine';
import LessonModal from '../components/LessonModal';
import WordleEngine from '../components/WordleEngine';

/**
 * @component StudentPortal
 * @description Primary gamified student dashboard. Renders adaptive learning map tracks,
 * enforces experience pacing milestones, tracks continuous accuracy streaks, displays point balance ledgers,
 * instantiates Jedi Archive lesson modals, and manages the rewards redemption vault.
 *
 * @returns {React.ReactElement} The student learning workspace UI.
 */
const StudentPortal = () => {
  const { studentPoints, addPoints, studentStreak, tiers, allCurriculumTiers, unlockedTiers, setUnlockedTiers, rewards, isSectionMastered, listenedLessons, getSectionStats, enablePacing, sectionScores, currentGradeLevel, getRecommendedDifficulty, isLoaded, error, studentName, coppaConsented, registerParentCoppa, parentEmail, dailyReviewHistory, addDailyReviewScore } = useAppContext();
  const [activePlayData, setActivePlayData] = useState(null);
  const [activeLessonData, setActiveLessonData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [coppaEmailInput, setCoppaEmailInput] = useState('');
  const [coppaSubmitted, setCoppaSubmitted] = useState(false);
  const [coppaError, setCoppaError] = useState(null);
  const [showWordle, setShowWordle] = useState(false);

  if (error) {
    return <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>Error loading student data: {error}</div>;
  }

  if (!isLoaded) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Student Data...</div>;
  }

  const handleCompleteSection = (options = {}) => {
    if (options?.returnToPortal) {
      setActivePlayData(null);
      return;
    }

    if (options?.isDailyReviewComplete) {
      const dateKey = getWordleDateKey();
      addDailyReviewScore(dateKey, {
        date: dateKey,
        score: options.sessionScore || 0,
        accuracy: Math.round(options.accuracy || 0),
        correctWords: options.correctWords || [],
        wrongWords: options.wrongWords || []
      });
      addPoints(options.sessionScore || 0);
      return;
    }

    const sectionData = activePlayData?.section;
    const currentTierId = activePlayData?.tierId;
    
    setActivePlayData(null);

    if (sectionData && sectionData.id.toString().includes('mastery')) {
      let nextTierId;
      const match = currentTierId && currentTierId.toString().match(/^(.*_t)(\d+)$/);
      
      if (match) {
        nextTierId = `${match[1]}${parseInt(match[2], 10) + 1}`;
      } else {
        nextTierId = parseInt(currentTierId) + 1;
      }

      if (isSectionMastered(sectionData.id)) {
        if (!unlockedTiers.includes(nextTierId)) {
          setUnlockedTiers(prev => [...prev, nextTierId]);
          setNotification({
            type: 'mastery',
            message: `LEGENDARY! You have mastered Tier ${currentTierId}. Tier ${nextTierId} is now officially unlocked!`
          });
          setTimeout(() => setNotification(null), 6000);
        }
      }
    }

    if (options?.nextSection && sectionData) {
      let foundCurrent = false;
      let nextSec = null;
      let nextTierId = null;

      for (const tier of tiers) {
        for (const sec of tier.sections) {
          if (foundCurrent) {
            nextSec = sec;
            nextTierId = tier.id;
            break;
          }
          if (sec.id === sectionData.id) {
            foundCurrent = true;
          }
        }
        if (nextSec) break;
      }

      if (nextSec && nextTierId) {
        warmupAudio();
        setActiveLessonData({ ...nextSec, parentTierId: nextTierId, tierRule: nextSec.rule });
      }
    }
  };

  const handleStartDailyReview = () => {
    warmupAudio();
    const dateKey = getWordleDateKey();

    const pool = [];
    (allCurriculumTiers || tiers).forEach(t => {
      t.sections.forEach(sec => {
        const stats = getSectionStats(sec.id);
        if (stats.is100Percent && sec.words && sec.words.length > 0) {
          sec.words.forEach(w => {
            pool.push({
              ...w,
              sectionId: sec.id
            });
          });
        }
      });
    });

    if (pool.length === 0) {
      alert("You haven't fully completed (100% score on Easy, Medium, and Hard) any sections yet! Master at least one section across all three modes to unlock Daily Review.");
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, 10);

    while (selectedWords.length < 10) {
      selectedWords.push(shuffled[selectedWords.length % shuffled.length]);
    }

    setActivePlayData({
      isDailyReview: true,
      tierId: 'daily_review',
      tierRule: "Listen carefully to the audio dictation and spell each review word correctly on Hard mode!",
      section: {
        id: 'daily_review',
        name: `Daily Review (${dateKey})`,
        theme: "10-Word Hard Dictation Review",
        words: selectedWords
      },
      initialDifficulty: 'hard'
    });
  };

  // Elegant tier visibility rule: show unlocked tiers plus the immediately following locked tier.
  // Pacing gate calculation: Maps unlocked status to tier array indices and filters visible
  // tiers to ensure students can preview upcoming goals without skipping unmastered prerequisites.
  const unlockedIndices = tiers.map((t, idx) => (!enablePacing || unlockedTiers.includes(t.id) || idx === 0) ? idx : -1);
  const highestUnlockedIndex = Math.max(...unlockedIndices, 0);
  const visibleTiers = tiers.filter((t, idx) => idx <= highestUnlockedIndex + 1);

  return (
    <div className="student-portal animate-fade-in" style={{ position: 'relative' }}>
      {/* FLOATING NON-BLOCKING NOTIFICATION TOAST */}
      {notification && (
        <div className="notification-toast" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: notification.type === 'reward' ? 'linear-gradient(135deg, #a855f7, #6b21a8)' : 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ fontSize: '1.5rem' }}>{notification.type === 'reward' ? '🎁' : '🌟'}</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>{notification.type === 'reward' ? 'Reward Claimed!' : 'Achievement Unlocked!'}</h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.25rem', cursor: 'pointer', marginLeft: '0.5rem', opacity: 0.8 }}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <header className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Student Portal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome {studentName && studentName.trim() ? `${studentName.trim()}!` : 'back! Ready to learn?'}</p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              className="btn-primary"
              onClick={() => {
                warmupAudio();
                setShowWordle(true);
              }}
              style={{ 
                background: 'linear-gradient(135deg, #a855f7, #6b21a8)', 
                color: 'white', 
                border: 'none', 
                fontWeight: 'bold', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
              }}
            >
              🎮 Play Daily Spellerle 🎮
            </button>
            <button 
              className="btn-primary"
              onClick={handleStartDailyReview}
              style={{ 
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                color: 'white', 
                border: 'none', 
                fontWeight: 'bold', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              📅 Play Daily Review 📅
            </button>
          </div>
          <div style={{ 
            textAlign: 'center', 
            background: 'rgba(0, 180, 216, 0.15)', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '8px', 
            border: '1px solid rgba(0, 180, 216, 0.3)' 
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grade</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{currentGradeLevel}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Points</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{Math.round(studentPoints)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Streak</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fb923c' }}>{studentStreak} 🔥</div>
          </div>
        </div>
      </header>

      {activePlayData ? (
        <div>
          <button 
            className="btn-secondary" 
            style={{ marginBottom: '1rem' }}
            onClick={() => setActivePlayData(null)}
          >
            ← Back to Map
          </button>
          <GameEngine 
            key={activePlayData.section.id}
            tierId={activePlayData.tierId} 
            section={activePlayData.section} 
            onComplete={handleCompleteSection} 
            tierRule={activePlayData.tierRule} 
            initialDifficulty={activePlayData.initialDifficulty}
            isDailyReview={activePlayData.isDailyReview}
          />
        </div>
      ) : (
        <>
          {!coppaConsented ? (
            <div className="glass-panel animate-fade-in" style={{ padding: '3rem', maxWidth: '600px', margin: '2rem auto', textAlign: 'center', borderLeft: '4px solid #f43f5e' }}>
              <h2 style={{ color: '#f43f5e', marginBottom: '1rem' }}>🛡️ Verifiable Parental Consent Required</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                To comply with the Children's Online Privacy Protection Act (COPPA), we require explicit verifiable parental consent before your child can access our educational assessment modules or the Jedi Archive.
              </p>
              
              {parentEmail ? (
                <p style={{ color: 'white', marginBottom: '2rem', fontSize: '0.95rem' }}>
                  A secure verification link has been sent to your parent at: <strong style={{ color: 'var(--accent-cyan)' }}>{parentEmail}</strong>.
                </p>
              ) : (
                <p style={{ color: 'white', marginBottom: '2rem', fontSize: '0.95rem' }}>
                  Please check your email inbox for the secure verification link we sent you upon registration.
                </p>
              )}
              
              {coppaSubmitted ? (
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '8px', fontWeight: 'bold' }}>
                  ✓ Reminder email sent! Please check your inbox (and spam folder).
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                  {parentEmail ? (
                    <button 
                      className="btn-primary"
                      onClick={async () => {
                        setCoppaError(null);
                        const result = await registerParentCoppa(parentEmail);
                        if (result.success) {
                          setCoppaSubmitted(true);
                        } else {
                          setCoppaError(result.error);
                        }
                      }}
                      style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                    >
                      🔔 Remind Parent
                    </button>
                  ) : (
                    <>
                      <input 
                        type="email" 
                        placeholder="Enter parent email to resend notice"
                        value={coppaEmailInput}
                        onChange={(e) => setCoppaEmailInput(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', textAlign: 'center' }}
                      />
                      <button 
                        className="btn-primary"
                        onClick={async () => {
                          if (coppaEmailInput.trim()) {
                            setCoppaError(null);
                            const result = await registerParentCoppa(coppaEmailInput.trim());
                            if (result.success) {
                              setCoppaSubmitted(true);
                            } else {
                              setCoppaError(result.error);
                            }
                          }
                        }}
                        style={{ width: '100%' }}
                      >
                        Resend Verification Email
                      </button>
                    </>
                  )}
                  {coppaError && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      ❌ {coppaError}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Learning Map</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {visibleTiers.map((tier, index) => {
                    const isUnlocked = !enablePacing || unlockedTiers.includes(tier.id) || index === 0;
                    return (
                      <div 
                        key={tier.id}
                        className={`glass-panel ${isUnlocked ? 'unlocked' : 'locked'}`}
                        style={{ 
                          padding: '1.5rem', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          opacity: isUnlocked ? 1 : 0.5,
                          borderLeft: isUnlocked ? '4px solid var(--success-color)' : '4px solid var(--surface-border)'
                        }}
                      >
                        <div>
                          <h3 style={{ marginBottom: '0.5rem' }}>Tier {index + 1}: {tier.name}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{tier.description}</p>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {(() => {
                            const firstUnmastered = tier.sections.findIndex(sec => !isSectionMastered(sec.id));
                            const unlockLimit = firstUnmastered === -1 ? tier.sections.length : firstUnmastered + 1;

                            return tier.sections.map((section, sIdx) => {
                              const stats = getSectionStats(section.id);
                              const isSectionMasteredStatus = isSectionMastered(section.id);
                              const isSectionListened = listenedLessons.includes(section.id);
                              
                              const isSectionUnlocked = isUnlocked && (!enablePacing || sIdx < unlockLimit);

                              const easyScore = sectionScores[`${section.id}-easy`] || 0;
                              const medScore = sectionScores[`${section.id}-medium`] || 0;
                              const hardScore = sectionScores[`${section.id}-hard`] || 0;
                              const totalSectionScore = easyScore + medScore + hardScore;
                              const maxSectionScore = (section.words?.length || 0) * 68;
                              const pointsPercent = maxSectionScore > 0 ? Math.round((totalSectionScore / maxSectionScore) * 100) : 0;

                              const isEasyPassed = stats.easyAcc >= 90;
                              const isMedPassed = stats.medAcc >= 90;
                              const isHardPassed = stats.hardAcc >= 90;

                              return (
                                <div key={section.id} style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: '0.5rem', 
                                  width: '100%',
                                  padding: '1rem',
                                  background: 'rgba(255,255,255,0.02)',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255,255,255,0.05)',
                                  marginBottom: '0.5rem'
                                }}>
                                  <div style={{ 
                                    fontSize: '0.8rem', 
                                    color: 'rgba(255,255,255,0.85)', 
                                    background: 'rgba(251, 191, 36, 0.08)', 
                                    padding: '0.5rem 0.75rem', 
                                    borderRadius: '4px', 
                                    borderLeft: '3px solid #fbbf24',
                                    lineHeight: '1.4' 
                                  }}>
                                    <strong style={{ color: '#fbbf24', marginRight: '4px' }}>🎯 Strategy:</strong> {section.rule}
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                                  <button 
                                    className="btn-secondary"
                                    onClick={() => {
                                      warmupAudio();
                                      setActiveLessonData({ ...section, parentTierId: tier.id, tierRule: section.rule });
                                    }}
                                    disabled={!isSectionUnlocked}
                                    title="Read Lesson"
                                    style={{ 
                                      padding: '0.5rem', 
                                      fontSize: '1rem',
                                      opacity: isSectionUnlocked ? 1 : 0.5,
                                      background: '#fbbf24',
                                      color: '#1f2937',
                                      border: 'none',
                                      borderRadius: '6px',
                                      minWidth: '40px'
                                    }}
                                  >
                                    📖
                                  </button>
                                  <button 
                                    className={isSectionListened ? "btn-primary" : "btn-secondary"} 
                                    onClick={() => {
                                      warmupAudio();
                                      const recommendedDifficulty = getRecommendedDifficulty(section.id);
                                      setActivePlayData({ tierId: tier.id, section, tierRule: section.rule, initialDifficulty: recommendedDifficulty });
                                    }}
                                    disabled={!isSectionListened || !isSectionUnlocked}
                                    style={{ 
                                      padding: '0.5rem 1rem', 
                                      fontSize: '0.875rem',
                                      opacity: (isSectionListened && isSectionUnlocked) ? 1 : 0.5,
                                      border: stats.is100Percent ? '2px solid #10b981' : (isSectionMasteredStatus ? '2px solid #fbbf24' : 'none'),
                                      flex: 1,
                                      textAlign: 'left'
                                    }}
                                  >
                                    {section.name === section.theme ? section.name : `${section.name}: ${section.theme}`} {isSectionListened ? '▶' : '🔒 (Listen First)'}
                                  </button>
                                  <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    gap: '0.25rem', 
                                    padding: '0.5rem 0.75rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--surface-border)',
                                    width: '130px'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'white', fontWeight: 'bold' }}>
                                      <span>Progress</span>
                                      <span style={{ color: pointsPercent === 100 ? '#10b981' : '#fbbf24' }}>{pointsPercent}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${pointsPercent}%`, background: pointsPercent === 100 ? '#10b981' : 'var(--accent-color)', transition: 'width 0.5s' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                      <span>Points</span>
                                      <span>{totalSectionScore} / {maxSectionScore}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '0.65rem' }}>
                                      <span style={{ opacity: isEasyPassed ? 1 : 0.4, color: isEasyPassed ? '#10b981' : '#9ca3af' }}>E{isEasyPassed ? ' ✓' : ''}</span>
                                      <span style={{ opacity: isMedPassed ? 1 : 0.4, color: isMedPassed ? '#10b981' : '#9ca3af' }}>M{isMedPassed ? ' ✓' : ''}</span>
                                      <span style={{ opacity: isHardPassed ? 1 : 0.4, color: isHardPassed ? '#10b981' : '#9ca3af' }}>H{isHardPassed ? ' ✓' : ''}</span>
                                    </div>
                                  </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                          
                          {(() => {
                            const masteredCount = tier.sections.reduce((count, section) => {
                              return count + (isSectionMastered(section.id) ? 1 : 0);
                            }, 0);
                            const tierMasteryUnlocked = masteredCount >= tier.sections.length;
                            
                            if (!tierMasteryUnlocked) return null;
                            
                            const handleTierMastery = () => {
                              warmupAudio();
                              let allWords = [];
                              tier.sections.forEach(s => allWords.push(...(s.words || [])));
                              const shuffledAll = [...allWords].sort(() => Math.random() - 0.5);
                              const assessmentWords = shuffledAll.slice(0, 15);
                              
                              const recommendedDifficulty = getRecommendedDifficulty(`tier_${tier.id}_mastery`);
                              setActivePlayData({ 
                                tierId: tier.id, 
                                tierRule: tier.rule,
                                section: {
                                  id: `tier_${tier.id}_mastery`,
                                  name: `Tier ${tier.id} Mastery`,
                                  theme: "Final Boss Assessment",
                                  rule: tier.rule,
                                  words: assessmentWords
                                },
                                initialDifficulty: recommendedDifficulty
                              });
                            };
                            
                            const tierMasteryMastered = isSectionMastered(`tier_${tier.id}_mastery`);
                            
                            return (
                              <div style={{ width: '100%', marginTop: '0.5rem' }}>
                                <button 
                                  className="btn-primary"
                                  onClick={handleTierMastery}
                                  style={{ 
                                    width: '100%', 
                                    background: tierMasteryMastered ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                                    color: 'white', 
                                    fontWeight: 'bold',
                                    border: tierMasteryMastered ? '2px solid #10b981' : '2px solid #ef4444',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                  }}
                                >
                                  {tierMasteryMastered ? '🏆 TIER MASTERED 🏆' : '🏆 Summative Tier Assessment Unlocked 🏆'}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎁 Rewards Vault
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {rewards && rewards.map(reward => {
                    const canAfford = studentPoints >= reward.cost;
                    const progress = Math.min((studentPoints / reward.cost) * 100, 100);
                    return (
                      <div key={reward.id} style={{ 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        background: canAfford ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.2)',
                        border: canAfford ? '2px solid #10b981' : '1px solid var(--surface-border)',
                        textAlign: 'center'
                      }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', textDecoration: reward.redeemed ? 'line-through' : 'none', color: reward.redeemed ? 'var(--text-secondary)' : 'white' }}>{reward.name}</h3>
                        
                        {reward.redeemed ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: '100%', background: 'var(--success-color)' }}></div>
                            </div>
                            <div style={{ 
                              padding: '0.5rem', 
                              background: 'rgba(96, 165, 250, 0.15)', 
                              color: '#60a5fa', 
                              borderRadius: '8px', 
                              fontWeight: 'bold', 
                              border: '1px dashed #60a5fa',
                              fontSize: '0.85rem'
                            }}>
                              🎁 REDEEMED & DELIVERED
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{Math.round(Math.min(studentPoints, reward.cost))} / {reward.cost} pts</span>
                              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{Math.round(progress)}%</span>
                            </div>
                            
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 113, 113, 0.1)', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${progress}%`, background: canAfford ? 'var(--success-color)' : 'var(--accent-color)', transition: 'width 0.3s ease' }}></div>
                            </div>

                            {canAfford ? (
                              <button 
                                className="btn-primary" 
                                disabled={true}
                                style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 'bold', border: 'none' }}
                              >
                                🏆 COMPLETE
                              </button>
                            ) : (
                              <button 
                                className="btn-secondary" 
                                disabled={true}
                                style={{ width: '100%' }}
                              >
                                Keep Learning!
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {showWordle && (
        <WordleEngine onClose={() => setShowWordle(false)} />
      )}

      {activeLessonData && (
        <LessonModal 
          lessonData={activeLessonData} 
          onClose={() => setActiveLessonData(null)} 
          onBeginTrials={(secData) => {
            // SYNCHRONOUS HANDOVER: Close lesson and immediately open corresponding game session
            setActiveLessonData(null);
            const recommendedDifficulty = getRecommendedDifficulty(secData.id);
            setActivePlayData({ tierId: secData.parentTierId, section: secData, tierRule: secData.rule, initialDifficulty: recommendedDifficulty });
          }}
        />
      )}
    </div>
  );
};

export default StudentPortal;
