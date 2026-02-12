import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VOICE_TONES, EMOJI_LEVELS, type PromptFormData } from "./types";

interface PersonalitySectionProps {
  data: PromptFormData;
  onChange: (updates: Partial<PromptFormData>) => void;
}

export function PersonalitySection({ data, onChange }: PersonalitySectionProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Tom de Voz</Label>
          <Select value={data.voiceTone} onValueChange={(v) => onChange({ voiceTone: v })}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_TONES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Nome do Bot (opcional)</Label>
          <Input
            placeholder='Ex: "Bia", "Chef Virtual"'
            value={data.botName}
            onChange={(e) => onChange({ botName: e.target.value })}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Nível de Emojis</Label>
        <RadioGroup
          value={data.emojiLevel}
          onValueChange={(v) => onChange({ emojiLevel: v })}
          className="flex gap-4"
        >
          {EMOJI_LEVELS.map((l) => (
            <label key={l.value} className="flex items-center gap-2 cursor-pointer text-sm">
              <RadioGroupItem value={l.value} />
              {l.label}
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
