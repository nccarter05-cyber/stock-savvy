import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SpeechRecognitionCtor = new () => any;

const getRecognition = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
};

export interface VoiceInputProps extends React.ComponentProps<"input"> {}

export const VoiceInput = React.forwardRef<HTMLInputElement, VoiceInputProps>(
  ({ className, onChange, ...props }, ref) => {
    const [listening, setListening] = React.useState(false);
    const recognitionRef = React.useRef<any>(null);
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    const Supported = React.useMemo(() => getRecognition(), []);

    const writeValue = (text: string) => {
      const el = innerRef.current;
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };

    const start = () => {
      if (!Supported) {
        toast.error("Voice input is not supported in this browser");
        return;
      }
      try {
        const rec = new Supported();
        rec.lang = navigator.language || "en-US";
        rec.interimResults = false;
        rec.continuous = false;
        rec.maxAlternatives = 1;
        rec.onresult = (e: any) => {
          const transcript = Array.from(e.results)
            .map((r: any) => r[0]?.transcript ?? "")
            .join(" ")
            .trim();
          if (transcript) {
            const current = innerRef.current?.value?.trim() ?? "";
            writeValue(current ? `${current} ${transcript}` : transcript);
          }
        };
        rec.onerror = (e: any) => {
          setListening(false);
          if (e?.error && e.error !== "aborted" && e.error !== "no-speech") {
            toast.error(`Voice input error: ${e.error}`);
          }
        };
        rec.onend = () => setListening(false);
        recognitionRef.current = rec;
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
        toast.error("Could not start voice input");
      }
    };

    const stop = () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setListening(false);
    };

    React.useEffect(() => {
      return () => {
        try {
          recognitionRef.current?.abort();
        } catch {
          // ignore
        }
      };
    }, []);

    return (
      <div className="relative">
        <Input
          ref={setRefs}
          onChange={onChange}
          className={cn(Supported && "pr-10", className)}
          {...props}
        />
        {Supported && (
          <button
            type="button"
            onClick={listening ? stop : start}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors",
              listening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
      </div>
    );
  },
);
VoiceInput.displayName = "VoiceInput";
