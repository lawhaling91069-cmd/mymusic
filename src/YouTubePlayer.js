import { useEffect, useRef } from "react";

let globalPlayer = null;

function YouTubePlayer({ videoId, onReady }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    // Destroy any existing player first
    if (globalPlayer) {
      try {
        globalPlayer.destroy();
        globalPlayer = null;
      } catch (e) {}
    }

    function createPlayer() {
      if (!containerRef.current) return;

      const div = document.createElement("div");
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(div);

      globalPlayer = new window.YT.Player(div, {
        height: "0",
        width: "0",
        videoId: videoId,
        playerVars: { autoplay: 1, controls: 0 },
        events: {
          onReady: (e) => {
            e.target.playVideo();
            if (onReady) onReady(e.target);
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      // Don't destroy on cleanup — let next song handle it
    };
  }, [videoId]);

  return <div ref={containerRef} style={{ display: "none" }} />;
}

export default YouTubePlayer;