import { useEffect, useRef } from "react";

let globalPlayer = null;
let apiReady = false;

function YouTubePlayer({ videoId, onReady }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    function startPlayer() {
      if (globalPlayer && globalPlayer.loadVideoById) {
        try {
          globalPlayer.loadVideoById(videoId);
          setTimeout(() => {
            try {
              globalPlayer.playVideo();
              if (onReady) onReady(globalPlayer);
            } catch (e) {}
          }, 500);
          return;
        } catch (e) {
          globalPlayer = null;
        }
      }

      if (!divRef.current) return;
      const el = document.createElement("div");
      divRef.current.innerHTML = "";
      divRef.current.appendChild(el);

      globalPlayer = new window.YT.Player(el, {
        height: "1",
        width: "1",
        videoId: videoId,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
        events: {
          onReady: (e) => {
            try {
              e.target.playVideo();
              if (onReady) onReady(e.target);
            } catch (err) {}
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.CUED) {
              try { e.target.playVideo(); } catch (err) {}
            }
          }
        },
      });
    }

    if (apiReady) {
      startPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        apiReady = true;
        if (prev) prev();
        startPlayer();
      };
    }
  }, [videoId]);

  return <div ref={divRef} style={{ position: "fixed", bottom: "-10px", left: "-10px", width: "1px", height: "1px", opacity: 0 }} />;
}

export default YouTubePlayer;