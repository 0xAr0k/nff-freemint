import React, { useState } from 'react';

function WalletEntry({ onSubmit }) {
  const [walletAddress, setWalletAddress] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [followingX, setFollowingX] = useState(false);
  const [joinedDiscord, setJoinedDiscord] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmed = walletAddress.trim();
    const trimmedXHandle = xHandle.trim();
    const trimmedDiscordUsername = discordUsername.trim();
    
    if (!trimmed) {
      setError('Please enter a wallet address');
      return;
    }

    // Validate: must be exactly 42 characters, start with 0x, and contain only valid hex characters
    const isEthAddress = trimmed.startsWith('0x') && trimmed.length === 42 && /^0x[0-9a-fA-F]{40}$/.test(trimmed);
    
    if (!isEthAddress) {
      setError('Invalid wallet address. Please enter a valid Ethereum address.');
      return;
    }

    if (!trimmedXHandle) {
      setError('Please enter your X handle');
      return;
    }

    if (!trimmedDiscordUsername) {
      setError('Please enter your Discord Username/ID');
      return;
    }

    if (!followingX) {
      setError('Please confirm you are following us on X');
      return;
    }

    if (!joinedDiscord) {
      setError('Please confirm you have joined our Discord');
      return;
    }

    onSubmit({
      walletAddress: trimmed,
      xHandle: trimmedXHandle,
      discordUsername: trimmedDiscordUsername,
      followingX,
      joinedDiscord
    });
  };

  return (
    <div className="section">
      <h2><span style={{ color: '#00ff88', marginRight: '8px' }}>0.</span>[INPUT] Verify Information</h2>
      <div style={{
        background: 'rgba(255, 68, 68, 0.1)',
        border: '2px solid #ff4444',
        padding: '16px',
        marginBottom: '24px',
        borderRadius: '4px'
      }}>
        <p style={{ 
          margin: 0, 
          color: '#ff4444', 
          fontSize: '0.95rem', 
          textTransform: 'uppercase', 
          letterSpacing: '1.5px', 
          lineHeight: '1.6',
          fontWeight: '600'
        }}>
          [WARNING] ONE ATTEMPT PER WALLET ADDRESS
        </p>
        <p style={{ 
          margin: '8px 0 0 0', 
          color: '#ccc', 
          fontSize: '0.85rem', 
          textTransform: 'none', 
          letterSpacing: '0.5px', 
          lineHeight: '1.6',
          fontWeight: 'normal'
        }}>
          You will only have one chance to complete the test. Make sure you're ready before proceeding.
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label htmlFor="wallet">Wallet Address</label>
          <input
            type="text"
            id="wallet"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            autoFocus
          />
        </div>

        <div className="social-handles-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
            <label htmlFor="xHandle">X Handle</label>
            <input
              type="text"
              id="xHandle"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="@yourhandle"
            />
          </div>

          <div className="form-group" style={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
            <label htmlFor="discordUsername">Discord Username/ID</label>
            <input
              type="text"
              id="discordUsername"
              value={discordUsername}
              onChange={(e) => setDiscordUsername(e.target.value)}
              placeholder="username#1234 or user_id"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '12px' }}>
            <input
              type="checkbox"
              checked={followingX}
              onChange={(e) => setFollowingX(e.target.checked)}
              style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>I am following <a href="https://x.com/roversxyz" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff88' }}>@ROVERSXYZ</a> on X</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={joinedDiscord}
              onChange={(e) => setJoinedDiscord(e.target.checked)}
              style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>I have joined the <a href="http://discord.gg/the-rovers" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff88' }}>Rovers Discord</a></span>
          </label>
        </div>

        <button type="submit">Continue</button>
      </form>
    </div>
  );
}

export default WalletEntry;

