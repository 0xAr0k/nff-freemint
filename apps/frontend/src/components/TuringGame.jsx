import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

function TuringGame({ walletAddress, onComplete }) {
  const [rounds, setRounds] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isRoverHolder, setIsRoverHolder] = useState(false);
  const [totalRounds, setTotalRounds] = useState(3);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [roundFeedback, setRoundFeedback] = useState({}); // Store feedback for each round
  const [showingFeedback, setShowingFeedback] = useState(false); // Track if showing feedback for current round
  const [submittedRound, setSubmittedRound] = useState(null); // Track which round has been submitted
  const [hasFetched, setHasFetched] = useState(false); // Prevent duplicate fetches in StrictMode

  useEffect(() => {
    if (!hasFetched) {
      setHasFetched(true);
      fetchRounds();
    }
  }, [hasFetched]);

  const fetchRounds = async () => {
    try {
      const response = await fetch(getApiUrl('game/rounds'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddress })
      });

      const data = await response.json();

      if (response.ok) {
        setRounds(data.rounds);
        setIsRoverHolder(data.isRoverHolder || false);
        setTotalRounds(data.totalRounds || 3);
        setRoundsPlayed(data.roundsPlayed || 0);
        // Initialize guesses array with correct size
        setGuesses(new Array(data.totalRounds || 3).fill(null));
        setLoading(false);
      } else {
        setError(data.error || 'Failed to load game rounds');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
      setError('Failed to load game. Please try again.');
      setLoading(false);
    }
  };

  const handleGuess = (answerNumber) => {
    if (showingFeedback || submittedRound === currentRound) return; // Don't allow changing guess after submission
    
    const newGuesses = [...guesses];
    newGuesses[currentRound] = answerNumber;
    setGuesses(newGuesses);
  };

  const handleSubmitRound = () => {
    if (guesses[currentRound] === null) {
      alert('Please select an answer before submitting');
      return;
    }

    const round = rounds[currentRound];
    const userGuess = guesses[currentRound];
    const isCorrect = (userGuess === 1 && round.hOne) || 
                      (userGuess === 2 && !round.hOne);
    
    const humanAnswer = round.hOne ? round.answer1 : round.answer2;
    const aiAnswer = round.hOne ? round.answer2 : round.answer1;
    
    setRoundFeedback({
      ...roundFeedback,
      [currentRound]: {
        isCorrect,
        humanAnswer,
        aiAnswer,
        userGuess: userGuess
      }
    });
    
    setSubmittedRound(currentRound);
    setShowingFeedback(true);
  };

  const handleContinueAfterFeedback = () => {
    if (currentRound < totalRounds - 1) {
      setShowingFeedback(false);
      setCurrentRound(currentRound + 1);
    } else {
      // Last round - submit all guesses
      handleSubmit();
    }
  };

  // Reset feedback state when round changes
  useEffect(() => {
    setShowingFeedback(false);
    // Don't reset submittedRound - we want to keep track of which rounds have been submitted
  }, [currentRound]);

  const handleSubmit = async () => {
    
    // Check that all rounds have guesses
    const allRoundsHaveGuesses = guesses.every((guess) => guess !== null);
    
    if (!allRoundsHaveGuesses) {
      const missingRounds = guesses.map((g, i) => g === null ? i + 1 : null).filter(r => r !== null);
      const errorMsg = `Please complete all rounds before viewing final results. Missing rounds: ${missingRounds.join(', ')}`;
      console.error('[GAME] Validation failed:', errorMsg);
      setError(errorMsg);
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    setError('');
    

    try {
      const response = await fetch(getApiUrl('game/guess'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          guesses
        })
      });

      const data = await response.json();
      console.log('[GAME] API response data:', data);

      if (response.ok) {
        onComplete({
          correctAnswers: data.correctAnswers,
          totalRounds: data.totalRounds,
          status: data.status,
          testStatus: data.testStatus,
          roundResults: data.roundResults,
          isRoverHolder: data.isRoverHolder
        });
      } else {
        const errorMsg = data.error || 'Failed to submit guesses';
        console.error('[GAME] API error:', errorMsg);
        setError(errorMsg);
        setSubmitting(false);
      }
    } catch (error) {
      console.error('[GAME] Exception submitting guesses:', error);
      setError(`Failed to submit guesses: ${error.message}. Please try again.`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading game rounds...</div>;
  }

  if (!rounds || rounds.length === 0) {
    return (
      <div>
        <div className="error">
          Not enough answers in the pool yet. Please wait for more players to join.
        </div>
      </div>
    );
  }

  const round = rounds[currentRound];
  const feedback = roundFeedback[currentRound];

  return (
    <div className="section">
      <h2>[ROUND {currentRound + 1}/{totalRounds}] Analysis</h2>
      {isRoverHolder && (
        <p style={{ marginBottom: '12px', color: '#00ff88', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          [ROVER HOLDER] Extended analysis protocol active. {roundsPlayed > 0 && `Rounds completed: ${roundsPlayed}/${totalRounds}`}
        </p>
      )}
      
      {!showingFeedback ? (
        <>
          <p style={{ marginBottom: '20px', color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            [TASK] Two responses detected. One is authentically human, one is synthetic AI attempting to mimic human responses. <strong style={{ color: '#00ff88' }}>Identify the human response.</strong>
          </p>

          {error && (
            <div className="error" style={{ 
              background: 'rgba(255, 68, 68, 0.2)', 
              border: '1px solid #ff4444', 
              padding: '12px', 
              marginBottom: '20px',
              borderRadius: '4px',
              color: '#ff8888'
            }}>
              <strong>[ERROR]</strong> {error}
            </div>
          )}

          <div className="round-container">
            <div className="round-header">[RESPONSE 1]</div>
            <div
              className={`answer-option ${guesses[currentRound] === 1 ? 'selected' : ''}`}
              onClick={() => handleGuess(1)}
            >
              <div className="answer-text">{round.answer1}</div>
            </div>

            <div className="round-header" style={{ marginTop: '20px' }}>[RESPONSE 2]</div>
            <div
              className={`answer-option ${guesses[currentRound] === 2 ? 'selected' : ''}`}
              onClick={() => handleGuess(2)}
            >
              <div className="answer-text">{round.answer2}</div>
            </div>
          </div>

          <button 
            onClick={handleSubmitRound} 
            disabled={guesses[currentRound] === null || submitting}
            style={{ marginTop: '20px' }}
          >
            Submit Answer
          </button>
        </>
      ) : (
        <>
          {error && (
            <div className="error" style={{ 
              background: 'rgba(255, 68, 68, 0.2)', 
              border: '1px solid #ff4444', 
              padding: '12px', 
              marginBottom: '20px',
              borderRadius: '4px',
              color: '#ff8888'
            }}>
              <strong>[ERROR]</strong> {error}
            </div>
          )}
          <div style={{
            background: feedback.isCorrect ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 68, 68, 0.1)',
            border: `2px solid ${feedback.isCorrect ? '#00ff41' : '#ff4444'}`,
            padding: '24px',
            marginBottom: '24px',
            borderRadius: '4px'
          }}>
            <h3 style={{ 
              color: feedback.isCorrect ? '#00ff41' : '#ff4444', 
              fontSize: '1.2rem', 
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {feedback.isCorrect ? '[CORRECT]' : '[INCORRECT]'}
            </h3>
            
            <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {feedback.isCorrect 
                ? 'You correctly identified the human response.' 
                : 'You incorrectly identified the synthetic response as human.'}
            </p>

            <div style={{ marginTop: '20px' }}>
              <div style={{ 
                color: '#00ff88', 
                fontSize: '0.85rem', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                marginBottom: '12px'
              }}>
                [HUMAN RESPONSE]
              </div>
              <div style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid #00ff88',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                <div className="answer-text" style={{ color: '#00ff41' }}>
                  {feedback.humanAnswer}
                </div>
              </div>

              <div style={{ 
                color: '#ff4444', 
                fontSize: '0.85rem', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                marginBottom: '12px'
              }}>
                [SYNTHETIC AI RESPONSE]
              </div>
              <div style={{
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid #ff4444',
                padding: '16px',
                borderRadius: '4px'
              }}>
                <div className="answer-text" style={{ color: '#ff8888' }}>
                  {feedback.aiAnswer}
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleContinueAfterFeedback} disabled={submitting}>
            {submitting 
              ? 'Submitting...' 
              : currentRound < totalRounds - 1 
                ? 'Continue to Next Round' 
                : 'View Final Results'}
          </button>
        </>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
        [PROGRESS] {currentRound + 1}/{totalRounds} rounds analyzed
      </div>
    </div>
  );
}

export default TuringGame;

