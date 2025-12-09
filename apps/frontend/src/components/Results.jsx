import React from "react";

function Results({ walletAddress, results, onBackToStart, onRetakeTest }) {
  if (!results) {
    return (
      <div>
        <div className="loading">Loading results...</div>
        <button onClick={onBackToStart} style={{ marginTop: "20px" }}>
          Back to Start
        </button>
      </div>
    );
  }

  const {
    status,
    correctAnswers = 0,
    totalRounds = 0,
    testStatus,
    roundResults = [],
    isRoverHolder = false,
  } = results;

  // Determine status display
  let statusDisplay = "";
  let statusColor = "#888";
  let statusMessage = "";

  if (status === "PERFECT") {
    statusDisplay = "PERFECT";
    statusColor = "#00ff41";
    statusMessage =
      "Perfect score! Humanity Confirmed. Your authenticity and understanding of human nature has been recorded.";
  } else if (status === "PASS") {
    statusDisplay = "PASS";
    statusColor = "#00ff88";
    statusMessage =
      "Humanity Confirmed. Your authenticity and understanding of human nature has been recorded.";
  } else if (status === "FAIL") {
    statusDisplay = "FAIL";
    statusColor = "#ff4444";
    statusMessage = isRoverHolder
      ? "Humanity in question. You did not pass the test, but you hold a Rover so there is still hope for you."
      : "Humanity in question. You did not pass the test, but you still have a chance.";
  }

  // Calculate correct/incorrect from roundResults if available
  const actualCorrect =
    roundResults.length > 0
      ? roundResults.filter((r) => r.isCorrect).length
      : correctAnswers;
  const actualTotal =
    roundResults.length > 0 ? roundResults.length : totalRounds;
  const actualIncorrect = actualTotal - actualCorrect;

  // Twitter share URL - includes @roversxyz
  const tweetText = encodeURIComponent(
    status === "PERFECT"
      ? `I scored PERFECT (${actualCorrect}/${actualTotal}) on the Rovers Reverse Turing Test via @roversxyz! 🎯`
      : status === "PASS"
        ? `I just PASSED (${actualCorrect}/${actualTotal}) the Rovers Reverse Turing Test via @roversxyz! ✅`
        : status === "FAIL"
          ? `I just FAILED (${actualCorrect}/${actualTotal}) the Rovers Reverse Turing Test via @roversxyz. 🚫`
          : "I took the Rovers Reverse Turing Test via @roversxyz."
  );
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent("https://therovers.xyz/")}`;

  const handleShareResults = () => {
    window.open(twitterShareUrl, "_blank", "width=550,height=420");
  };

  // Determine which image to use based on status
  const getShareImage = () => {
    if (status === "FAIL") {
      return "/turing-fail.png";
    } else if (status === "PASS" || status === "PERFECT") {
      return "/turing-pass.png";
    }
    return "/turing-pass.png";
  };

  const getDownloadFilename = () => {
    if (status === "FAIL") {
      return "turing-test-fail.png";
    } else if (status === "PASS" || status === "PERFECT") {
      return "turing-test-pass.png";
    }
    return "turing-test-pass.png";
  };

  const handleDownloadImage = () => {
    const link = document.createElement("a");
    link.href = getShareImage();
    link.download = getDownloadFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="results-container section">
      <h2>
        <span style={{ color: "#00ff88", marginRight: "8px" }}>4.</span>
        [RESULTS] Test Complete
      </h2>

      <div
        style={{
          background: `rgba(${status === "PERFECT" ? "0, 255, 65" : status === "PASS" ? "0, 255, 136" : status === "FAIL" ? "255, 68, 68" : "136, 136, 136"}, 0.1)`,
          border: `2px solid ${statusColor}`,
          padding: "24px",
          marginBottom: "24px",
          borderRadius: "4px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: statusColor,
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "12px",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          [{statusDisplay}]
        </div>
        <p
          style={{
            margin: 0,
            color: "#ccc",
            fontSize: "0.95rem",
            lineHeight: "1.6",
          }}
        >
          {statusMessage}
        </p>
      </div>

      {roundResults && roundResults.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          {roundResults.map((round, index) => (
            <div
              key={index}
              style={{
                background: round.isCorrect
                  ? "rgba(0, 255, 65, 0.1)"
                  : "rgba(255, 68, 68, 0.1)",
                border: `1px solid ${round.isCorrect ? "#00ff41" : "#ff4444"}`,
                padding: "12px",
                marginBottom: "12px",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  color: round.isCorrect ? "#00ff41" : "#ff4444",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                Round {round.roundNumber}:{" "}
                {round.isCorrect ? "CORRECT" : "INCORRECT"}
              </div>
              <div
                style={{
                  color: "#ccc",
                  fontSize: "0.85rem",
                  lineHeight: "1.5",
                  fontStyle: "italic",
                  marginTop: "4px",
                }}
              >
                "{round.selectedAnswer || "Answer not available"}"
              </div>
            </div>
          ))}
        </div>
      )}

      {actualTotal > 0 && (
        <div
          style={{
            background: "transparent",
            padding: "20px 0",
            marginBottom: "24px",
            borderTop: "1px solid #333",
            borderBottom: "1px solid #333",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "#00ff88",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                {actualCorrect}
              </div>
              <div
                style={{
                  color: "#888",
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Correct
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "#ff4444",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                {actualIncorrect}
              </div>
              <div
                style={{
                  color: "#888",
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Incorrect
              </div>
            </div>
          </div>
        </div>
      )}

      {(status === "PASS" || status === "PERFECT") && (
        <div
          style={{
            marginBottom: "24px",
            textAlign: "center",
            padding: "20px",
            background: "rgba(0, 255, 136, 0.05)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{ color: "#00ff88", marginBottom: "16px", fontSize: "1rem" }}
          >
            [SHARE YOUR SUCCESS]
          </h3>
          <div style={{ marginBottom: "16px" }}>
            <img
              src={getShareImage()}
              alt="I PASSED THE ROVERS TURING TEST!"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "4px",
                border: "1px solid rgba(0, 255, 136, 0.3)",
                boxShadow: "0 0 20px rgba(0, 255, 136, 0.2)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
              flexDirection: "column",
            }}
            className="share-buttons-container"
          >
            <button
              onClick={handleDownloadImage}
              style={{
                marginTop: "0",
                background: "transparent",
                border: "1px solid #00ff88",
                color: "#00ff88",
                width: "100%",
              }}
            >
              Download Image
            </button>
            <button
              onClick={handleShareResults}
              style={{
                marginTop: "0",
                background: "transparent",
                border: "1px solid #00ff88",
                color: "#00ff88",
                width: "100%",
              }}
            >
              Share on X
            </button>
          </div>
          <p
            style={{
              marginTop: "24px",
              marginBottom: "0",
              color: "#888",
              fontSize: "0.85rem",
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            Thank you for taking the Rovers Reverse Turing Test. Your wallet has
            been submitted for Allowlist approval. Please keep an eye on{" "}
            <a
              href="https://x.com/roversxyz"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#00ff88" }}
            >
              X
            </a>{" "}
            or{" "}
            <a
              href="http://discord.gg/the-rovers"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#00ff88" }}
            >
              Discord
            </a>{" "}
            for announcements.
          </p>
        </div>
      )}

      {status === "FAIL" && (
        <div
          style={{
            marginBottom: "24px",
            textAlign: "center",
            padding: "20px",
            background: "rgba(255, 68, 68, 0.05)",
            border: "1px solid rgba(255, 68, 68, 0.3)",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{ color: "#ff4444", marginBottom: "16px", fontSize: "1rem" }}
          >
            [SHARE YOUR RESULTS]
          </h3>
          <div style={{ marginBottom: "16px" }}>
            <img
              src="/turing-fail.png"
              alt="ROVERS REVERSE TURING TEST RESULTS"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "4px",
                border: "1px solid rgba(255, 68, 68, 0.3)",
                boxShadow: "0 0 20px rgba(255, 68, 68, 0.2)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
              flexDirection: "column",
            }}
            className="share-buttons-container"
          >
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = "/turing-fail.png";
                link.download = "turing-test-fail.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="fail-button"
              style={{
                marginTop: "0",
                background: "transparent",
                border: "1px solid #ff4444",
                color: "#ff4444",
                width: "100%",
              }}
            >
              Download Image
            </button>
            <button
              onClick={handleShareResults}
              className="fail-button"
              style={{
                marginTop: "0",
                background: "transparent",
                border: "1px solid #ff4444",
                color: "#ff4444",
                width: "100%",
              }}
            >
              Share on X
            </button>
          </div>
          <p
            style={{
              marginTop: "24px",
              marginBottom: "0",
              color: "#888",
              fontSize: "0.85rem",
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            Thank you for taking the Rovers Reverse Turing Test. Your wallet has
            been submitted for Allowlist approval. Please keep an eye on{" "}
            <a
              href="https://x.com/roversxyz"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ff4444" }}
            >
              X
            </a>{" "}
            or{" "}
            <a
              href="http://discord.gg/the-rovers"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ff4444" }}
            >
              Discord
            </a>{" "}
            for announcements.
          </p>
        </div>
      )}
    </div>
  );
}

export default Results;
