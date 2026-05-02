import { useEffect } from "react";

function YouTubePlayer({ videoId, onReady }) {

  useEffect(() => {
    if (!videoId) return;

    const iframeId = "yt-iframe-player";
    let existing = document.getElementById(iframeId);
    if (existing) existing.remove();

    const iframe = document.createElement("iframe");
    iframe.id = iframeId;
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&enablejsapi=1&origin=${window.location.origin}`;
    iframe.allow = "autoplay";
    iframe.style.position = "fixed";
    iframe.style.bottom = "-100px";
    iframe.style.left = "-100px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0";
    document.body.appendChild(iframe);

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScript = document.getElementsByTagName("script")[0];
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      firstScript.parentNode.insertBefore(tag, firstScript);
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        const player = new window.YT.Player(iframeId, {
          events: {
            onReady: (e) => {
              e.target.setVolume(80);
              e.target.playVideo();
              if (onReady) onReady(e.target);
            },
          },
        });
      }
      if (attempts > 20) clearInterval(interval);
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, [videoId]);

  return null;
}

export default YouTubePlayer;