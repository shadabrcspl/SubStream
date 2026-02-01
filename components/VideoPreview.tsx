import React from 'react';
import { getYouTubeVideoId } from '../utils/srtUtils';

interface VideoPreviewProps {
  url: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ url }) => {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) return null;

  return (
    <div className="relative w-full pt-[56.25%] bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-lg">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VideoPreview;