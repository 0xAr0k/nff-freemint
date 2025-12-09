import React from "react";

function Explainer({ onContinue, isRoverHolder = false }) {
  const rounds = isRoverHolder ? 5 : 3;
  const minToPass = isRoverHolder ? 3 : 2;

  if (isRoverHolder) {
    return (
      <div className="section">
        <h2>
          <span style={{ color: "#00ff88", marginRight: "8px" }}>1.</span>
          [PROTOCOL] Rover Holder Detected
        </h2>

        <div
          style={{
            background: "rgba(0, 255, 136, 0.1)",
            border: "1px solid #00ff88",
            padding: "20px",
            marginBottom: "24px",
            borderRadius: "4px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#00ff88",
              fontSize: "1rem",
              fontWeight: "bold",
              lineHeight: "1.6",
            }}
          >
            [STATUS] You are already one with the Rovers. Your journey continues
            here.
          </p>
        </div>

        <div
          style={{
            background: "transparent",
            padding: "0",
            marginBottom: "32px",
            lineHeight: "1.9",
            fontSize: "0.95rem",
            color: "#ccc",
          }}
        >
          <p
            style={{
              marginBottom: "24px",
              fontSize: "1rem",
              lineHeight: "1.8",
            }}
          >
            As a Rover holder, you can participate in the Reverse Turing Test to
            demonstrate your understanding of human authenticity.
          </p>

          <h3
            style={{
              color: "#00ff88",
              marginBottom: "16px",
              fontSize: "1rem",
              marginTop: "24px",
            }}
          >
            [CONCEPT] The Reverse Turing Test
          </h3>
          <p style={{ marginBottom: "16px" }}>
            In a traditional Turing test, machines try to convince humans they
            are human. Here, the roles are reversed. Synthetic AI will attempt
            to mimic human responses, while you must prove you understand both
            perspectives: what makes something authentically human, and what
            synthetic intelligence believes humans sound like.
          </p>

          <h3
            style={{
              color: "#00ff88",
              marginBottom: "16px",
              fontSize: "1rem",
              marginTop: "24px",
            }}
          >
            [YOUR TASK] Identify The Human
          </h3>
          <p style={{ marginBottom: "16px" }}>
            You will play {rounds} rounds. In each round, you'll see two
            responses to the same prompt: one written by a human player
            competing for allowlist access, and one generated synthetically by
            AI attempting to mimic human responses. Your task is to correctly
            identify which response is authentically human.
          </p>
        </div>

        <button onClick={onContinue} style={{ width: "100%" }}>
          Take The Test
        </button>
      </div>
    );
  }

  // Non-Rover holder view
  return (
    <div className="section">
      <h2>[INSTRUCTIONS] How The Test Works</h2>

      <div
        style={{
          background: "transparent",
          padding: "0",
          marginBottom: "32px",
          lineHeight: "1.9",
          fontSize: "0.95rem",
          color: "#ccc",
        }}
      >
        <h3
          style={{
            color: "#00ff88",
            marginBottom: "16px",
            fontSize: "1rem",
          }}
        >
          [STEP 1] Prove You Are Human
        </h3>
        <p style={{ marginBottom: "24px" }}>
          Answer a prompt question with an authentic response that demonstrates
          your humanity.
        </p>

        <h3
          style={{
            color: "#00ff88",
            marginBottom: "16px",
            fontSize: "1rem",
            marginTop: "24px",
          }}
        >
          [STEP 2] Identify The Humans
        </h3>
        <p style={{ marginBottom: "24px" }}>
          You will play {rounds} rounds. In each round, you'll see two responses
          to the same prompt: one written by a previous human, and one generated
          by AI in the moment.{" "}
          <strong style={{ color: "#00ff88" }}>
            Your task is to correctly identify which response is human.
          </strong>
        </p>

        <h3
          style={{
            color: "#00ff88",
            marginBottom: "16px",
            fontSize: "1rem",
            marginTop: "24px",
          }}
        >
          [STEP 3] Final Judgement
        </h3>
        <p style={{ marginBottom: "24px" }}>
          Correctly identify the human response in at least {minToPass} out of{" "}
          {rounds} rounds to pass the Rovers Reverse Turing Test.{" "}
          <strong style={{ color: "#00ff88" }}>
            Pass or fail, your wallet and credentials will be judged by The
            Rovers for allowlist approval.
          </strong>{" "}
          A higher score demonstrates your human authenticity and may improve
          your chances.
        </p>
      </div>

      <button onClick={onContinue}>Begin Test</button>
    </div>
  );
}

export default Explainer;
