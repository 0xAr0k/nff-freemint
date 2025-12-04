import React from 'react';

function RoverExplainer({ onContinue }) {
  return (
    <div className="section">
      <h2><span style={{ color: '#00ff88', marginRight: '8px' }}>1.</span>[PROTOCOL] Rover Holder Detected</h2>
      
      <div style={{
        background: 'rgba(0, 255, 136, 0.1)', 
        border: '1px solid #00ff88', 
        padding: '20px', 
        marginBottom: '24px',
        borderRadius: '4px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, color: '#00ff88', fontSize: '1rem', fontWeight: 'bold', lineHeight: '1.6' }}>
          [STATUS] You are already one with the Rovers. Your journey continues here.
        </p>
      </div>
      
      <div style={{
        background: 'transparent',
        padding: '0',
        marginBottom: '32px',
        lineHeight: '1.9',
        fontSize: '0.95rem',
        color: '#ccc'
      }}>
        <p style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: '1.8' }}>
          As a Rover holder, you can participate in the Reverse Turing Test to demonstrate your understanding of human authenticity.
        </p>

        <h3 style={{ color: '#00ff88', marginBottom: '16px', fontSize: '1rem', marginTop: '24px' }}>
          [CONCEPT] The Reverse Turing Test
        </h3>
        <p style={{ marginBottom: '16px' }}>
          In a traditional Turing test, machines try to convince humans they are human. Here, the roles are reversed. Synthetic AI will attempt to mimic human responses, while you must prove you understand both perspectives: what makes something authentically human, and what synthetic intelligence believes humans sound like.
        </p>

        <h3 style={{ color: '#00ff88', marginBottom: '16px', fontSize: '1rem', marginTop: '24px' }}>
          [YOUR TASK] Identify The Human
        </h3>
        <p style={{ marginBottom: '16px' }}>
          You will play 3 rounds. In each round, you'll see two responses to the same prompt: one written by a human player competing for allowlist access, and one generated synthetically by AI attempting to mimic human responses. Your task is to correctly identify which response is authentically human.
        </p>
      </div>

      <button onClick={onContinue} style={{ width: '100%' }}>
        Take The Test
      </button>
    </div>
  );
}

export default RoverExplainer;

