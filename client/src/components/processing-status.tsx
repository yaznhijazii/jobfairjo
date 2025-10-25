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
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-border" style={{ left: '2rem', right: '2rem' }} />
        <div 
          className="absolute top-6 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ 
            left: '2rem',
            width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 4rem)`
          }}
        />

        {/* Steps */}
        <div className="relative grid grid-cols-4 gap-4">
          {steps.map((s, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center mb-3 transition-all duration-300",
                    isCompleted && "bg-primary border-primary",
                    isCurrent && "border-primary bg-primary/10 scale-110",
                    !isCompleted && !isCurrent && "border-border bg-background"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-primary-foreground" />
                  ) : isCurrent ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <p className={cn(
                  "text-sm font-medium text-center",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
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
