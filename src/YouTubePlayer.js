import { useEffect, useRef } from "react";

function YouTubePlayer({ videoId, onReady }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    let isMounted = true;

    function createPlayer() {
      if (!containerRef.current) return;

      const div = document.createElement("div");
      containerRef.current.appendChild(div);

      const player = new window.YT.Player(div, {
        height: "0",
        width: "0",
        videoId: videoId,
        playerVars: { autoplay: 1, controls: 0 },
        events: {
          onReady: (e) => {
            if (!isMounted) return;
            e.target.playVideo();
            playerRef.current = e.target;
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
      isMounted = false;
      try {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      } catch (e) {
        console.log("Player cleanup:", e);
      }
    };
  }, [videoId]);

  return <div ref={containerRef} style={{ display: "none" }} />;
}

export default YouTubePlayer;