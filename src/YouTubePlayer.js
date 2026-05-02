import { useEffect, useRef } from "react";

let globalPlayer = null;
let isAPIReady = false;
const pendingCallbacks = [];

function YouTubePlayer({ videoId, onReady }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    function createPlayer() {
      if (!containerRef.current) return;

      if (globalPlayer) {
        try {
          globalPlayer.loadVideoById(videoId);
          globalPlayer.playVideo();
          if (onReady) onReady(globalPlayer);
          return;
        } catch (e) {
          globalPlayer = null;
        }
      }

      const div = document.createElement("div");
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(div);

      globalPlayer = new window.YT.Player(div, {
        height: "0",
        width: "0",
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            e.target.playVideo();
            if (onReady) onReady(e.target);
          },
        },
      });
    }

    if (isAPIReady) {
      createPlayer();
    } else {
      pendingCallbacks.push(createPlayer);
      if (!window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = () => {
          isAPIReady = true;
          pendingCallbacks.forEach((cb) => cb());
          pendingCallbacks.length = 0;
        };
      }
    }

    return () => {};
  }, [videoId]);

  return <div ref={containerRef} style={{ display: "none" }} />;
}

export default YouTubePlayer;