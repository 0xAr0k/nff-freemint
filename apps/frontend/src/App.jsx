import React, { useState, useEffect } from "react";
import WalletEntry from "./components/WalletEntry";
import Explainer from "./components/Explainer";
import RoverExplainer from "./components/RoverExplainer";
import AnswerPrompt from "./components/AnswerPrompt";
import TuringGame from "./components/TuringGame";
import Results from "./components/Results";
import RoverResults from "./components/RoverResults";
import Leaderboard from "./components/Leaderboard";
import { getApiUrl } from "./config";

function App() {
  const [currentWallet, setCurrentWallet] = useState(null);
  const [walletStatus, setWalletStatus] = useState(null);
  const [step, setStep] = useState("wallet"); // wallet, explainer, answer, game, results
  const [rounds, setRounds] = useState(null);
  const [gameResults, setGameResults] = useState(null);

  const handleWalletSubmit = async (walletData) => {
    try {
      // Register wallet with X handle and checkboxes
      const response = await fetch(getApiUrl("/form/submit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(walletData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Error registering wallet. Please try again.");
        return;
      }

      const data = await response.json();
      setCurrentWallet(walletData.walletAddress);

      // Check wallet status (this will also confirm Rover holder status)
      const encodedAddress = encodeURIComponent(walletData.walletAddress);
      const statusResponse = await fetch(getApiUrl(`wallet/${encodedAddress}`));
      const statusData = await statusResponse.json();
      setWalletStatus(statusData);

      // Use Rover holder status from wallet check (more reliable)
      const isRoverHolder =
        statusData.isRoverHolder || data.isRoverHolder || false;

      if (statusData.hasPlayed) {
        // Route to appropriate results page
        if (isRoverHolder) {
          setStep("rover-results");
        } else {
          setStep("results");
        }
        setGameResults({
          correctAnswers: statusData.correctAnswers || 0,
          totalRounds: statusData.totalRounds || 0,
          status: statusData.status,
          testStatus: statusData.testStatus,
          roundResults: statusData.roundResults || [], // Include round results
          isRoverHolder: isRoverHolder, // Include Rover holder status for image selection
        });
      } else {
        // Route to appropriate explainer
        if (isRoverHolder) {
          setStep("rover-explainer");
        } else {
          setStep("explainer");
        }
      }
    } catch (error) {
      console.error("Error registering wallet:", error);
      alert("Error registering wallet. Please try again.");
    }
  };

  const handleLeaderboardClick = (walletAddress) => {
    // When clicking on a leaderboard entry, check that wallet
    handleWalletCheck(walletAddress);
  };

  const handleExplainerContinue = () => {
    setStep("answer");
  };

  const handleRoverExplainerContinue = () => {
    // Rover holders go through answer submission like everyone else
    setStep("answer");
  };

  const handleAnswerSubmit = () => {
    setStep("game");
  };

  const handleWalletCheck = async (walletAddress) => {
    try {
      const encodedAddress = encodeURIComponent(walletAddress);
      const response = await fetch(getApiUrl(`wallet/${encodedAddress}`));

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Error checking wallet. Please try again.");
        return;
      }

      const data = await response.json();
      setCurrentWallet(walletAddress);
      setWalletStatus(data);

      const isRoverHolder = data.isRoverHolder || false;

      if (data.hasPlayed) {
        // Route to appropriate results page
        if (isRoverHolder) {
          setStep("rover-results");
        } else {
          setStep("results");
        }
        setGameResults({
          correctAnswers: data.correctAnswers || 0,
          totalRounds: data.totalRounds || 0,
          status: data.status,
          testStatus: data.testStatus,
          roundResults: data.roundResults || [], // Include round results
          isRoverHolder: isRoverHolder, // Include Rover holder status for image selection
        });
      } else {
        // Route to appropriate explainer
        if (isRoverHolder) {
          setStep("rover-explainer");
        } else {
          setStep("explainer");
        }
      }
    } catch (error) {
      console.error("Error checking wallet:", error);
      alert("Error checking wallet. Please try again.");
    }
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
    // Route to appropriate results page based on Rover holder status
    if (results.isRoverHolder) {
      setStep("rover-results");
    } else {
      setStep("results");
    }
  };

  const handleBackToStart = () => {
    setCurrentWallet(null);
    setWalletStatus(null);
    setStep("wallet");
    setRounds(null);
    setGameResults(null);
  };

  const handleRetakeTest = () => {
    // Reset game state but keep wallet
    setRounds(null);
    setGameResults(null);
    setStep("game"); // Go directly to game, skipping answer submission
  };

  return (
    <div className="container">
      <h1>ROVERS REVERSE TURING TEST</h1>
      <p className="subtitle">
        [SYSTEM] Reverse Turing protocol active. Prove you are human.
      </p>

      {step === "wallet" && <WalletEntry onSubmit={handleWalletSubmit} />}

      {step === "explainer" && (
        <Explainer onContinue={handleExplainerContinue} isRoverHolder={false} />
      )}

      {step === "rover-explainer" && (
        <RoverExplainer onContinue={handleRoverExplainerContinue} />
      )}

      {step === "answer" && (
        <AnswerPrompt
          walletAddress={currentWallet}
          onSubmit={handleAnswerSubmit}
        />
      )}

      {step === "game" && (
        <TuringGame
          walletAddress={currentWallet}
          onComplete={handleGameComplete}
        />
      )}

      {step === "results" && (
        <Results
          walletAddress={currentWallet}
          results={gameResults}
          onBackToStart={handleBackToStart}
          onRetakeTest={handleRetakeTest}
        />
      )}

      {step === "rover-results" && (
        <RoverResults
          walletAddress={currentWallet}
          results={gameResults}
          onBackToStart={handleBackToStart}
          onRetakeTest={handleRetakeTest}
        />
      )}

      {(step === "results" ||
        step === "rover-results" ||
        step === "wallet" ||
        step === "explainer") && (
        <div className="section">
          <Leaderboard onWalletClick={handleLeaderboardClick} />
        </div>
      )}
    </div>
  );
}

export default App;
