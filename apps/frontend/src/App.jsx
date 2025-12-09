import React, { useState } from "react";
import WalletEntry from "./components/WalletEntry";
import Explainer from "./components/Explainer";
import AnswerPrompt from "./components/AnswerPrompt";
import TuringGame from "./components/TuringGame";
import Results from "./components/Results";
import Leaderboard from "./components/Leaderboard";
import { getApiUrl } from "./config";

// Define step constants
const STEPS = {
  WALLET: "wallet",
  EXPLAINER: "explainer",
  ANSWER: "answer",
  GAME: "game",
  RESULTS: "results",
};

function App() {
  const [currentWallet, setCurrentWallet] = useState(null);
  const [walletStatus, setWalletStatus] = useState(null);
  const [step, setStep] = useState(STEPS.WALLET);
  const [gameResults, setGameResults] = useState(null);

  const handleWalletSubmit = async (walletData) => {
    try {
      // Register wallet with X handle and checkboxes
      const response = await fetch(getApiUrl("/form/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(walletData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Error registering wallet. Please try again.");
        return;
      }

      const data = await response.json();
      setCurrentWallet(walletData.walletAddress);

      // Check wallet status
      await checkWalletStatus(walletData.walletAddress);
    } catch (error) {
      console.error("Error registering wallet:", error);
      alert("Error registering wallet. Please try again.");
    }
  };

  const checkWalletStatus = async (walletAddress) => {
    try {
      const encodedAddress = encodeURIComponent(walletAddress);
      const response = await fetch(getApiUrl(`game/${encodedAddress}`));

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Error checking wallet. Please try again.");
        return;
      }

      const data = await response.json();
      setCurrentWallet(walletAddress);
      setWalletStatus(data);

      if (data.hasPlayed) {
        // User has already played - show results
        setGameResults({
          correctAnswers: data.correctAnswers || 0,
          totalRounds: data.totalRounds || 0,
          status: data.status,
          testStatus: data.testStatus,
          roundResults: data.roundResults || [],
          isRoverHolder: data.isRoverHolder || false,
        });
        setStep(STEPS.RESULTS);
      } else {
        // New user - show explainer
        setStep(STEPS.EXPLAINER);
      }
    } catch (error) {
      console.error("Error checking wallet:", error);
      alert("Error checking wallet. Please try again.");
    }
  };

  const handleLeaderboardClick = (walletAddress) => {
    checkWalletStatus(walletAddress);
  };

  const handleExplainerContinue = () => {
    setStep(STEPS.ANSWER);
  };

  const handleAnswerSubmit = () => {
    setStep(STEPS.GAME);
  };

  const handleGameComplete = (results) => {
    setGameResults({
      correctAnswers: results.correctAnswers || 0,
      totalRounds: results.totalRounds || 0,
      status: results.status,
      testStatus: results.testStatus,
      roundResults: results.roundResults,
      isRoverHolder: results.isRoverHolder || false,
    });
    setStep(STEPS.RESULTS);
  };

  const handleBackToStart = () => {
    setCurrentWallet(null);
    setWalletStatus(null);
    setStep(STEPS.WALLET);
    setGameResults(null);
  };

  const handleRetakeTest = () => {
    setGameResults(null);
    setStep(STEPS.GAME);
  };

  const isRoverHolder =
    walletStatus?.isRoverHolder || gameResults?.isRoverHolder || false;
  const showLeaderboard = [
    STEPS.WALLET,
    STEPS.EXPLAINER,
    STEPS.RESULTS,
  ].includes(step);

  return (
    <div className="container">
      <h1>ROVERS REVERSE TURING TEST</h1>
      <p className="subtitle">
        [SYSTEM] Reverse Turing protocol active. Prove you are human.
      </p>

      {step === STEPS.WALLET && <WalletEntry onSubmit={handleWalletSubmit} />}

      {step === STEPS.EXPLAINER && (
        <Explainer
          onContinue={handleExplainerContinue}
          isRoverHolder={isRoverHolder}
        />
      )}

      {step === STEPS.ANSWER && (
        <AnswerPrompt
          walletAddress={currentWallet}
          onSubmit={handleAnswerSubmit}
        />
      )}

      {step === STEPS.GAME && (
        <TuringGame
          walletAddress={currentWallet}
          onComplete={handleGameComplete}
        />
      )}

      {step === STEPS.RESULTS && (
        <Results
          walletAddress={currentWallet}
          results={gameResults}
          onBackToStart={handleBackToStart}
          onRetakeTest={handleRetakeTest}
        />
      )}

      {showLeaderboard && (
        <div className="section">
          <Leaderboard onWalletClick={handleLeaderboardClick} />
        </div>
      )}
    </div>
  );
}

export default App;
