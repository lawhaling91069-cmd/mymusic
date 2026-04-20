import { useEffect, useRef } from "react";

function YouTubePlayer({ videoId, onReady }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    function createPlayer() {
      const player = new window.YT.Player(containerRef.current, {
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
      return player;
    }

    let player;
    if (window.YT && window.YT.Player) {
      player = createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => { player = createPlayer(); };
    }

    return () => { if (player) player.destroy(); };
  }, [videoId]);

  return <div ref={containerRef} />;
}

export default YouTubePlayer;