import React, { useState, useEffect, useRef } from "react";
import { getApiUrl } from "../config";

const ENTRIES_PER_PAGE = 25;

function Leaderboard({ onWalletClick }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchLeaderboard(true); // Initial load
    // Refresh every 5 seconds (only refresh first page to check for new entries)
    refreshIntervalRef.current = setInterval(() => {
      fetchLeaderboard(true, true); // Refresh first page only
    }, 5000);
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchLeaderboard = async (reset = false, silent = false) => {
    try {
      if (!silent) {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
      }

      const offset = reset ? 0 : leaderboard.length;
      const response = await fetch(
        getApiUrl(
          `/game/leaderboard?limit=${ENTRIES_PER_PAGE}&offset=${offset}`
        )
      );
      const data = await response.json();

      if (reset) {
        setLeaderboard(data.leaderboard);
      } else {
        setLeaderboard((prev) => [...prev, ...data.leaderboard]);
      }

      setHasMore(data.hasMore);
      setTotalEntries(data.total || data.leaderboard.length);

      if (!silent) {
        setLoading(false);
        setLoadingMore(false);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchLeaderboard(false);
  };

  const formatWallet = (address) => {
    if (!address) return "";
    // Show more characters for better readability
    if (address.length <= 20) return address;
    // Format Ethereum addresses (0x...)
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  if (loading && leaderboard.length === 0) {
    return (
      <div className="leaderboard">
        <h2>Real Time Results</h2>
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2>Real Time Results</h2>
      {loading && leaderboard.length === 0 ? (
        <div className="loading">Loading results...</div>
      ) : leaderboard.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            color: "#888",
            marginTop: "20px",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          [EMPTY] No verification records found. Initiate first test.
        </p>
      ) : (
        <>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Wallet</th>
                <th className="x-handle-column">X Handle</th>
                <th>Status</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => {
                const statusColor =
                  entry.status === "PERFECT"
                    ? "#00ff41"
                    : entry.status === "PASS"
                      ? "#00ff88"
                      : entry.status === "FAIL"
                        ? "#ff4444"
                        : "#888";

                return (
                  <tr key={`${entry.walletAddress}-${entry.rank}`}>
                    <td>
                      <span className="rank-badge">{entry.rank}</span>
                    </td>
                    <td>
                      <span
                        className="wallet-address"
                        style={{
                          color: "#ccc",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {formatWallet(entry.walletAddress)}
                        {entry.isRoverHolder && (
                          <img
                            src="/rovers-icon.svg"
                            alt="Rovers Holder"
                            style={{
                              width: "14px",
                              height: "14px",
                              filter:
                                "brightness(0) saturate(100%) invert(67%) sepia(96%) saturate(1234%) hue-rotate(88deg) brightness(101%) contrast(101%)",
                              display: "inline-block",
                              verticalAlign: "middle",
                              marginLeft: "4px",
                            }}
                            onError={(e) => {
                              console.error(
                                "Failed to load rovers-icon.svg:",
                                e
                              );
                            }}
                          />
                        )}
                      </span>
                    </td>
                    <td
                      className="x-handle-column"
                      style={{ color: "#888", fontSize: "0.9rem" }}
                    >
                      {entry.xHandle || "-"}
                    </td>
                    <td>
                      <span
                        style={{
                          color: statusColor,
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td>
                      <strong
                        style={{
                          color:
                            entry.correctAnswers === 0 ||
                            entry.correctAnswers === 1
                              ? "#ff4444"
                              : entry.correctAnswers === 2
                                ? "#00ff88"
                                : "#00ff41",
                        }}
                      >
                        {entry.correctAnswers}/{entry.totalRounds}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  background: "transparent",
                  border: "1px solid #00ff88",
                  color: "#00ff88",
                  width: "auto",
                  minWidth: "200px",
                  padding: "12px 24px",
                }}
              >
                {loadingMore
                  ? "Loading..."
                  : `Load More (${totalEntries - leaderboard.length} remaining)`}
              </button>
            </div>
          )}

          {!hasMore && leaderboard.length > 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#888",
                marginTop: "20px",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              [END] All {totalEntries} results displayed
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default Leaderboard;
