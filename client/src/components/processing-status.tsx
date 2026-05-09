import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessingStep } from "@shared/schema";
import { Card } from "@/components/ui/card";

interface ProcessingStatusProps {
  step: ProcessingStep;
  fileName?: string;
}

const steps = [
  { id: "uploading", label: "Uploading", description: "Transferring your CV" },
  { id: "extracting", label: "Extracting", description: "Reading document content" },
  { id: "fetching", label: "Fetching Jobs", description: "Loading live positions" },
  { id: "analyzing", label: "AI Analysis", description: "Matching skills with opportunities" },
];

export function ProcessingStatus({ step, fileName }: ProcessingStatusProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Analyzing Your Resume</h2>
        {fileName && (
          <p className="text-sm text-muted-foreground">{fileName}</p>
        )}
      </div>

      {/* Step Indicators */}
      <div className="relative">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full z-0" style={{ left: '2rem', right: '2rem' }} />
        
        {/* Animated Progress Line */}
        <div 
          className="absolute top-6 left-0 h-1 rounded-full transition-all duration-1000 ease-in-out z-0"
          style={{ 
            left: '2rem',
            width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}%)`,
            background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.6) 100%)',
            boxShadow: '0 0 10px hsl(var(--primary)/0.4)',
          }}
        >
          <div className="absolute right-0 top-0 h-full w-4 bg-white/30 blur-sm animate-pulse rounded-full" />
        </div>

        {/* Steps */}
        <div className="relative z-10 grid grid-cols-4 gap-4">
          {steps.map((s, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center mb-3 transition-all duration-300 shadow-sm",
                    isCompleted && "bg-primary border-primary",
                    isCurrent && "border-primary bg-background shadow-[0_0_15px_rgba(var(--primary),0.2)] scale-110",
                    !isCompleted && !isCurrent && "border-muted bg-background"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-primary-foreground" />
                  ) : isCurrent ? (
                    <div className="relative flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping" />
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <p className={cn(
                  "text-sm font-semibold text-center transition-colors duration-300",
                  isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 text-center mt-1 font-medium">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Message */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>
            {step === "uploading" && "Uploading your resume..."}
            {step === "extracting" && "Extracting text from PDF..."}
            {step === "fetching" && "Fetching live job listings..."}
            {step === "analyzing" && "Running AI analysis to find your best matches..."}
          </span>
        </div>
      </div>
    </Card>
  );
}
