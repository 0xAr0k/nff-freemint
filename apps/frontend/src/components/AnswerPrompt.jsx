import React, { useState, useEffect } from "react";
import { getApiUrl } from "../config";

function AnswerPrompt({ walletAddress, onSubmit }) {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const MAX_LENGTH = 140;

  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = async () => {
    try {
      const response = await fetch(getApiUrl("/game/prompt"));
      const data = await response.json();
      setPrompt(data.question);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching prompt:", error);
      setError("Failed to load prompt. Please refresh the page.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!answer.trim()) {
      setError("Please write an answer");
      return;
    }

    const trimmedAnswer = answer.trim();
    if (trimmedAnswer.length < 10) {
      setError("Please write a longer answer (at least 10 characters)");
      return;
    }

    if (trimmedAnswer.length > MAX_LENGTH) {
      setError(`Answer must be ${MAX_LENGTH} characters or less`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(getApiUrl("/game/answer"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          answer: answer.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSubmit();
      } else {
        setError(data.error || "Failed to submit answer");
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setError("Failed to submit answer. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading prompt...</div>;
  }

  return (
    <div className="section">
      <h2>[PROMPT] Human Verification</h2>

      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#ffffff",
          fontFamily: "JetBrains Mono, monospace",
          lineHeight: "1.5",
          marginBottom: "32px",
          marginTop: "16px",
        }}
      >
        {prompt}
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="answer">
            Your Answer
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: "normal",
                color: "#666",
                marginLeft: "8px",
              }}
            >
              ({answer.trim().length}/{MAX_LENGTH} characters)
            </span>
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => {
              if (e.target.value.length <= MAX_LENGTH) {
                setAnswer(e.target.value);
              }
            }}
            placeholder="Write your answer here..."
            maxLength={MAX_LENGTH}
            autoFocus
          />
        </div>

        <p
          style={{
            marginTop: "16px",
            marginBottom: "24px",
            color: "#888",
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
            lineHeight: "1.6",
          }}
        >
          [INSTRUCTIONS] Write something authentically human (max {MAX_LENGTH}{" "}
          characters). Your answer will be added to the pool for other players
          and analyzed as a part of your wallet submission.
        </p>

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Answer & Begin The Test"}
        </button>
      </form>
    </div>
  );
}

export default AnswerPrompt;
