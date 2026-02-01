import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  duration?: number;
  transcription?: string;
  className?: string;
}

export function AudioPlayer({ src, duration, transcription, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [showTranscription, setShowTranscription] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate stable waveform bars (memoized to prevent re-renders)
  const bars = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      // Create a pseudo-random but deterministic pattern based on index
      const seed = i * 7 + 13;
      const height = 20 + ((seed * 37) % 60);
      return height;
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setAudioDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="flex items-center gap-3 min-w-[220px]">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex-shrink-0"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-primary" />
          ) : (
            <Play className="h-5 w-5 text-primary ml-0.5" />
          )}
        </Button>

        {/* Waveform Visualization */}
        <div className="flex-1 flex items-center gap-[2px] h-8">
          {bars.map((height, i) => {
            const barProgress = (i / bars.length) * 100;
            const isActive = barProgress <= progress;
            return (
              <div
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-all duration-150",
                  isActive ? "bg-primary" : "bg-muted-foreground/30",
                  isPlaying && isActive && "animate-pulse"
                )}
                style={{ 
                  height: `${height}%`,
                  minHeight: "4px"
                }}
              />
            );
          })}
        </div>

        {/* Duration Display */}
        <span className="text-xs text-muted-foreground font-mono min-w-[40px] text-right flex-shrink-0">
          {formatTime(isPlaying ? currentTime : audioDuration)}
        </span>

        {/* Mic icon indicator */}
        <Mic className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
      </div>

      {/* Transcription Toggle */}
      {transcription && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowTranscription(!showTranscription)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {showTranscription ? "▼ Ocultar transcrição" : "▶ Ver transcrição"}
          </button>
          {showTranscription && (
            <p className="text-sm text-muted-foreground italic bg-muted/50 rounded-lg px-3 py-2 border-l-2 border-primary/30">
              "{transcription}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
