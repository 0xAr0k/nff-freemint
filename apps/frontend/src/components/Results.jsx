import react from "react";

function results({ walletaddress, results, onbacktostart, onretaketest }) {
  if (!results) {
    return (
      <div>
        <div classname="loading">loading results...</div>
        <button onclick={onbacktostart} style={{ margintop: "20px" }}>
          back to start
        </button>
      </div>
    );
  }

  const {
    status,
    correctanswers = 0,
    totalrounds = 0,
    teststatus,
    roundresults = [],
    isroverholder = false,
  } = results;

  // determine status display
  let statusdisplay = "";
  let statuscolor = "#888";
  let statusmessage = "";

  if (status === "perfect") {
    statusdisplay = "perfect";
    statuscolor = "#00ff41";
    statusmessage =
      "perfect score! humanity confirmed. your authenticity and understanding of human nature has been recorded.";
  } else if (status === "pass") {
    statusdisplay = "pass";
    statuscolor = "#00ff88";
    statusmessage =
      "humanity confirmed. your authenticity and understanding of human nature has been recorded.";
  } else if (status === "fail") {
    statusdisplay = "fail";
    statuscolor = "#ff4444";
    statusmessage =
      "humanity in question. you did not pass the test, but you still have a chance.";
  }

  // calculate correct/incorrect from roundresults if available, otherwise use correctanswers/totalrounds
  const actualcorrect =
    roundresults.length > 0
      ? roundresults.filter((r) => r.iscorrect).length
      : correctanswers;
  const actualtotal =
    roundresults.length > 0 ? roundresults.length : totalrounds;
  const actualincorrect = actualtotal - actualcorrect;

  // twitter share url - NOW INCLUDES @roversxyz
  const tweettext = encodeuricomponent(
    status === "perfect"
      ? `i scored perfect (${actualcorrect}/${actualtotal}) on the rovers reverse turing test via @roversxyz! 🎯`
      : status === "pass"
        ? `i just passed (${actualcorrect}/${actualtotal}) the rovers reverse turing test via @roversxyz! ✅`
        : status === "fail"
          ? `i just failed (${actualcorrect}/${actualtotal}) the rovers reverse turing test via @roversxyz. 🚫`
          : "i took the rovers reverse turing test via @roversxyz."
  );
  const twittershareurl = `https://twitter.com/intent/tweet?text=${tweettext}&url=${encodeuricomponent("https://therovers.xyz")}`;

  const handleshareresults = () => {
    window.open(twittershareurl, "_blank", "width=550,height=420");
  };

  // determine which image to use based on status (all users use same pass image)
  const getshareimage = () => {
    if (status === "fail") {
      return "/turing-fail.png";
    } else if (status === "pass" || status === "perfect") {
      return "/turing-pass.png";
    }
    return "/turing-pass.png"; // fallback
  };

  const getdownloadfilename = () => {
    if (status === "fail") {
      return "turing-test-fail.png";
    } else if (status === "pass" || status === "perfect") {
      return "turing-test-pass.png";
    }
    return "turing-test-pass.png"; // fallback
  };

  const handledownloadimage = () => {
    // create a link element to download the image
    const link = document.createelement("a");
    link.href = getshareimage();
    link.download = getdownloadfilename();
    document.body.appendchild(link);
    link.click();
    document.body.removechild(link);
  };

  return (
    <div classname="results-container section">
      <h2>
        <span style={{ color: "#00ff88", marginright: "8px" }}>4.</span>
        [results] test complete
      </h2>

      <div
        style={{
          background: `rgba(${status === "perfect" ? "0, 255, 65" : status === "pass" ? "0, 255, 136" : status === "fail" ? "255, 68, 68" : "136, 136, 136"}, 0.1)`,
          border: `2px solid ${statuscolor}`,
          padding: "24px",
          marginbottom: "24px",
          borderradius: "4px",
          textalign: "center",
        }}
      >
        <div
          style={{
            color: statuscolor,
            fontsize: "2rem",
            fontweight: "bold",
            marginbottom: "12px",
            texttransform: "uppercase",
            letterspacing: "2px",
          }}
        >
          [{statusdisplay}]
        </div>
        <p
          style={{
            margin: 0,
            color: "#ccc",
            fontsize: "0.95rem",
            lineheight: "1.6",
          }}
        >
          {statusmessage}
        </p>
      </div>

      {roundresults && roundresults.length > 0 && (
        <div style={{ marginbottom: "24px" }}>
          {roundresults.map((round, index) => (
            <div
              key={index}
              style={{
                background: round.iscorrect
                  ? "rgba(0, 255, 65, 0.1)"
                  : "rgba(255, 68, 68, 0.1)",
                border: `1px solid ${round.iscorrect ? "#00ff41" : "#ff4444"}`,
                padding: "12px",
                marginbottom: "12px",
                borderradius: "4px",
              }}
            >
              <div
                style={{
                  color: round.iscorrect ? "#00ff41" : "#ff4444",
                  fontsize: "0.9rem",
                  fontweight: "bold",
                  marginbottom: "8px",
                }}
              >
                round {round.roundnumber}:{" "}
                {round.iscorrect ? "correct" : "incorrect"}
              </div>
              <div
                style={{
                  color: "#ccc",
                  fontsize: "0.85rem",
                  lineheight: "1.5",
                  fontstyle: "italic",
                  margintop: "4px",
                }}
              >
                "{round.selectedanswer || "answer not available"}"
              </div>
            </div>
          ))}
        </div>
      )}

      {actualtotal > 0 && (
        <div
          style={{
            background: "transparent",
            padding: "20px 0",
            marginbottom: "24px",
            bordertop: "1px solid #333",
            borderbottom: "1px solid #333",
          }}
        >
          <div
            style={{
              display: "flex",
              justifycontent: "space-around",
              alignitems: "center",
              flexwrap: "wrap",
              gap: "20px",
            }}
          >
            <div style={{ textalign: "center" }}>
              <div
                style={{
                  color: "#00ff88",
                  fontsize: "2rem",
                  fontweight: "bold",
                  marginbottom: "8px",
                }}
              >
                {actualcorrect}
              </div>
              <div
                style={{
                  color: "#888",
                  fontsize: "0.85rem",
                  texttransform: "uppercase",
                  letterspacing: "1px",
                }}
              >
                correct
              </div>
            </div>
            <div style={{ textalign: "center" }}>
              <div
                style={{
                  color: "#ff4444",
                  fontsize: "2rem",
                  fontweight: "bold",
                  marginbottom: "8px",
                }}
              >
                {actualincorrect}
              </div>
              <div
                style={{
                  color: "#888",
                  fontsize: "0.85rem",
                  texttransform: "uppercase",
                  letterspacing: "1px",
                }}
              >
                incorrect
              </div>
            </div>
          </div>
        </div>
      )}

      {(status === "pass" || status === "perfect") && (
        <div
          style={{
            marginbottom: "24px",
            textalign: "center",
            padding: "20px",
            background: "rgba(0, 255, 136, 0.05)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            borderradius: "4px",
          }}
        >
          <h3
            style={{ color: "#00ff88", marginbottom: "16px", fontsize: "1rem" }}
          >
            [share your success]
          </h3>
          <div style={{ marginbottom: "16px" }}>
            <img
              src={getshareimage()}
              alt="i passed the rovers turing test!"
              style={{
                maxwidth: "100%",
                height: "auto",
                borderradius: "4px",
                border: "1px solid rgba(0, 255, 136, 0.3)",
                boxshadow: "0 0 20px rgba(0, 255, 136, 0.2)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifycontent: "center",
              flexwrap: "wrap",
              flexdirection: "column",
            }}
            classname="share-buttons-container"
          >
            <button
              onclick={handledownloadimage}
              style={{
                margintop: "0",
                background: "transparent",
                border: "1px solid #00ff88",
                color: "#00ff88",
                width: "100%",
              }}
            >
              download image
            </button>
            <button
              onclick={handleshareresults}
              style={{
                margintop: "0",
                background: "transparent",
                border: "1px solid #00ff88",
                color: "#00ff88",
                width: "100%",
              }}
            >
              share on x
            </button>
          </div>
          <p
            style={{
              margintop: "24px",
              marginbottom: "0",
              color: "#888",
              fontsize: "0.85rem",
              lineheight: "1.6",
              textalign: "center",
            }}
          >
            thank you for taking the rovers reverse turing test. your wallet has
            been submitted for allowlist approval. please keep an eye on{" "}
            <a
              href="https://x.com/roversxyz"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#00ff88" }}
            >
              x
            </a>{" "}
            or{" "}
            <a
              href="http://discord.gg/the-rovers"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#00ff88" }}
            >
              discord
            </a>{" "}
            for announcements.
          </p>
        </div>
      )}

      {status === "fail" && (
        <div
          style={{
            marginbottom: "24px",
            textalign: "center",
            padding: "20px",
            background: "rgba(255, 68, 68, 0.05)",
            border: "1px solid rgba(255, 68, 68, 0.3)",
            borderradius: "4px",
          }}
        >
          <h3
            style={{ color: "#ff4444", marginbottom: "16px", fontsize: "1rem" }}
          >
            [share your results]
          </h3>
          <div style={{ marginbottom: "16px" }}>
            <img
              src="/turing-fail.png"
              alt="rovers reverse turing test results"
              style={{
                maxwidth: "100%",
                height: "auto",
                borderradius: "4px",
                border: "1px solid rgba(255, 68, 68, 0.3)",
                boxshadow: "0 0 20px rgba(255, 68, 68, 0.2)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifycontent: "center",
              flexwrap: "wrap",
              flexdirection: "column",
            }}
            classname="share-buttons-container"
          >
            <button
              onclick={() => {
                const link = document.createelement("a");
                link.href = "/turing-fail.png";
                link.download = "turing-test-fail.png";
                document.body.appendchild(link);
                link.click();
                document.body.removechild(link);
              }}
              classname="fail-button"
              style={{
                margintop: "0",
                background: "transparent",
                border: "1px solid #ff4444",
                color: "#ff4444",
                width: "100%",
              }}
            >
              download image
            </button>
            <button
              onclick={handleshareresults}
              classname="fail-button"
              style={{
                margintop: "0",
                background: "transparent",
                border: "1px solid #ff4444",
                color: "#ff4444",
                width: "100%",
              }}
            >
              share on x
            </button>
          </div>
          <p
            style={{
              margintop: "24px",
              marginbottom: "0",
              color: "#888",
              fontsize: "0.85rem",
              lineheight: "1.6",
              textalign: "center",
            }}
          >
            thank you for taking the rovers reverse turing test. your wallet has
            been submitted for allowlist approval. please keep an eye on{" "}
            <a
              href="https://x.com/roversxyz"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ff4444" }}
            >
              x
            </a>{" "}
            or{" "}
            <a
              href="http://discord.gg/the-rovers"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ff4444" }}
            >
              discord
            </a>{" "}
            for announcements.
          </p>
        </div>
      )}
    </div>
  );
}

export default results;
