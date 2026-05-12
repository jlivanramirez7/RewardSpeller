import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { warmupAudio } from '../services/ttsService';
import GameEngine from '../components/GameEngine';
import LessonModal from '../components/LessonModal';

const StudentPortal = () => {
  const { studentPoints, studentStreak, tiers, unlockedTiers, setUnlockedTiers, rewards, purchaseReward, isSectionMastered, listenedLessons, getSectionStats, enablePacing, sectionScores } = useAppContext();
  const [activePlayData, setActivePlayData] = useState(null);
  const [activeLessonData, setActiveLessonData] = useState(null);

  const handleCompleteSection = () => {
    const sectionData = activePlayData?.section;
    
    setActivePlayData(null);

    // Auto-unlock next tier if mastery assessment is complete and passed
    if (sectionData && sectionData.id.toString().includes('mastery')) {
      const currentTierId = activePlayData.tierId;
      if (isSectionMastered(sectionData.id)) {
        if (!unlockedTiers.includes(currentTierId + 1)) {
          // Safely push next tier ID
          setUnlockedTiers(prev => [...prev, currentTierId + 1]);
          alert(`🌟 LEGENDARY! You have mastered Tier ${currentTierId}. Tier ${currentTierId + 1} is now officially unlocked!`);
        }
      }
    }
  };

  return (
    <div className="student-portal animate-fade-in">
      <header className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Student Portal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back! Ready to learn?</p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Points</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{studentPoints}</div>
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
            tierId={activePlayData.tierId} 
            section={activePlayData.section} 
            onComplete={handleCompleteSection} 
            tierRule={activePlayData.tierRule} 
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Learning Map</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tiers.map((tier, index) => {
                const isUnlocked = !enablePacing || unlockedTiers.includes(tier.id);
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
                          
                          // Only the immediately following unmastered section is playable (unless user pacing disabled)
                          const isSectionUnlocked = isUnlocked && (!enablePacing || sIdx < unlockLimit);

                          const easyScore = sectionScores[`${section.id}-easy`] || 0;
                          const medScore = sectionScores[`${section.id}-medium`] || 0;
                          const hardScore = sectionScores[`${section.id}-hard`] || 0;
                          const totalSectionScore = easyScore + medScore + hardScore;
                          // Max score assumes base points: Easy(1) + Med(3) + Hard(30) = 34 per word.
                          // Multiplier of 68 accounts for maximum possible points with streak bonuses (2x).
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
                              {/* LOCALIZED SECTION RULE BANNER */}
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
                                  warmupAudio(); // Claim interaction focus for audio!
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
                                  warmupAudio(); // Trigger audio channel open
                                  setActivePlayData({ tierId: tier.id, section, tierRule: section.rule });
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
                                {section.name}: {section.theme} {isSectionListened ? '▶' : '🔒 (Listen First)'}
                              </button>
                              {/* Progress Display Badge */}
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
                          warmupAudio(); // Prepare audio for end-tier speech
                          let allWords = [];
                          tier.sections.forEach(s => allWords.push(...s.words));
                          const shuffledAll = [...allWords].sort(() => Math.random() - 0.5);
                          const assessmentWords = shuffledAll.slice(0, 10);
                          
                          setActivePlayData({ 
                            tierId: tier.id, 
                            tierRule: tier.rule,
                            section: {
                              id: `tier_${tier.id}_mastery`,
                              name: `Tier ${tier.id} Mastery`,
                              theme: "Final Boss Assessment",
                              rule: tier.rule, // Use overarching tier rule for the final boss
                              words: assessmentWords
                            }
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
                                background: tierMasteryMastered ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ec4899, #8b5cf6)', 
                                color: 'white', 
                                fontWeight: 'bold',
                                border: tierMasteryMastered ? '2px solid #10b981' : '2px solid #fbbf24',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}
                            >
                              {tierMasteryMastered ? '🏆 TIER MASTERED 🏆' : '🏆 Tier Mastery Assessment 🏆'}
                            </button>
                            {tierMasteryMastered && (
                              <div style={{ 
                                marginTop: '0.5rem', 
                                textAlign: 'center', 
                                color: '#fbbf24', 
                                fontWeight: 'bold',
                                padding: '0.5rem',
                                background: 'rgba(251, 191, 36, 0.1)',
                                borderRadius: '4px',
                                border: '1px dashed #fbbf24'
                              }}>
                                ⚔️ OFFICIAL JEDI MASTER OF TIER {tier.id} ⚔️
                              </div>
                            )}
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
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--surface-border)',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{reward.name}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{Math.min(studentPoints, reward.cost)} / {reward.cost} pts</span>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{Math.round(progress)}%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: canAfford ? 'var(--success-color)' : 'var(--accent-color)', transition: 'width 0.3s ease' }}></div>
                    </div>

                    <button 
                      className={canAfford ? "btn-primary" : "btn-secondary"} 
                      disabled={!canAfford}
                      onClick={() => {
                        if (canAfford) {
                          purchaseReward(reward.id);
                          alert(`You claimed: ${reward.name}!`);
                        }
                      }}
                      style={{ width: '100%' }}
                    >
                      {canAfford ? 'Claim Reward' : 'Keep Learning!'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {activeLessonData && (
        <LessonModal 
          lessonData={activeLessonData} 
          onClose={() => setActiveLessonData(null)} 
          onBeginTrials={(secData) => {
            // SYNCHRONOUS HANDOVER: Close lesson and immediately open corresponding game session
            setActiveLessonData(null);
            setActivePlayData({ tierId: secData.parentTierId, section: secData, tierRule: secData.rule });
          }}
        />
      )}
    </div>
  );
};

export default StudentPortal;
