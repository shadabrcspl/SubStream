import { SubtitleBlock } from '../types';

export const parseSRT = (data: string): SubtitleBlock[] => {
  const normalizedData = data.replace(/\r\n/g, '\n');
  const blocks: SubtitleBlock[] = [];
  
  // Regex to match SRT blocks: ID, Timestamp, Text
  // Example:
  // 1
  // 00:00:01,000 --> 00:00:04,000
  // Hello world
  const regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]*?)(?=\n\n|$)/g;
  
  let match;
  while ((match = regex.exec(normalizedData)) !== null) {
    blocks.push({
      id: parseInt(match[1], 10),
      startTime: match[2],
      endTime: match[3],
      text: match[4].trim(),
      originalText: match[4].trim()
    });
  }

  return blocks;
};

export const stringifySRT = (blocks: SubtitleBlock[]): string => {
  return blocks.map(block => {
    return `${block.id}\n${block.startTime} --> ${block.endTime}\n${block.text}\n`;
  }).join('\n');
};

export const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};
