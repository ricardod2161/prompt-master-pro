import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
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

  // Generate waveform bars
  const bars = Array.from({ length: 20 }, (_, i) => {
    const height = Math.random() * 100;
    return height;
  });

  return (
    <div className={cn("space-y-2", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-primary" />
          ) : (
            <Play className="h-5 w-5 text-primary ml-0.5" />
          )}
        </Button>

        {/* Waveform */}
        <div className="flex-1 flex items-center gap-0.5 h-8">
          {bars.map((height, i) => {
            const barProgress = (i / bars.length) * 100;
            const isActive = barProgress <= progress;
            return (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-colors",
                  isActive ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{ 
                  height: `${Math.max(15, height)}%`,
                }}
              />
            );
          })}
        </div>

        <span className="text-xs text-muted-foreground font-mono min-w-[40px] text-right">
          {formatTime(isPlaying ? currentTime : audioDuration)}
        </span>
      </div>

      {transcription && (
        <div className="space-y-1">
          <button
            onClick={() => setShowTranscription(!showTranscription)}
            className="text-xs text-primary hover:underline"
          >
            {showTranscription ? "Ocultar transcrição" : "Ver transcrição"}
          </button>
          {showTranscription && (
            <p className="text-sm text-muted-foreground italic bg-muted/50 rounded-lg px-3 py-2">
              "{transcription}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
