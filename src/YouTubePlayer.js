import { useEffect, useRef } from "react";

function YouTubePlayer({ videoId }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    function createPlayer() {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "0",
        width: "0",
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: (e) => e.target.playVideo(),
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  return <div ref={containerRef} />;
}

export default YouTubePlayer;