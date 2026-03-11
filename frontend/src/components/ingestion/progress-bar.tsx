"use client";

import { FileText, Scissors, Cpu, Database, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number; // 0=idle, 1=parsing, 2=chunking, 3=embedding, 4=storing, 5=complete
  isActive: boolean;
}

const steps = [
  { label: "Parsing", icon: FileText, step: 1 },
  { label: "Chunking", icon: Scissors, step: 2 },
  { label: "Embedding", icon: Cpu, step: 3 },
  { label: "Storing", icon: Database, step: 4 },
];

export function ProgressBar({ currentStep, isActive }: ProgressBarProps) {
  const isComplete = currentStep >= 5;

  return (
    <div className="glass-card rounded-xl px-6 py-5">
      {/* Progress bar track */}
      <div className="relative flex items-center">
        {steps.map((step, i) => {
          const isStepComplete = currentStep > step.step || isComplete;
          const isStepActive = currentStep === step.step && isActive;
          const isStepFuture = currentStep < step.step;

          return (
            <div key={step.label} className="flex flex-1 items-center">
              {/* Segment bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full">
                {/* Background track */}
                <div className="absolute inset-0 bg-inset" />

                {/* Filled portion */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                    isComplete
                      ? "w-full bg-status-green"
                      : isStepComplete
                        ? "w-full bg-accent"
                        : isStepActive
                          ? "w-1/2 bg-accent"
                          : "w-0"
                  )}
                />

                {/* Shimmer effect on active step */}
                {isStepActive && !isComplete && (
                  <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-full">
                    <div className="h-full w-full animate-pulse-glow rounded-full bg-accent" />
                  </div>
                )}
              </div>

              {/* Separator dot between segments */}
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-3 w-3 shrink-0 rounded-full border-2 transition-colors duration-300",
                    isComplete
                      ? "border-status-green bg-status-green"
                      : isStepComplete
                        ? "border-accent bg-accent"
                        : isStepActive
                          ? "border-accent bg-background"
                          : "border-border bg-background"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels */}
      <div className="mt-4 flex">
        {steps.map((step) => {
          const isStepComplete = currentStep > step.step || isComplete;
          const isStepActive = currentStep === step.step && isActive;
          const StepIcon = isComplete ? CheckCircle2 : step.icon;

          return (
            <div
              key={step.label}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <StepIcon
                className={cn(
                  "h-4 w-4 transition-colors duration-300",
                  isComplete
                    ? "text-status-green"
                    : isStepComplete
                      ? "text-accent"
                      : isStepActive
                        ? "text-accent"
                        : "text-text-muted"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-colors duration-300",
                  isComplete
                    ? "text-status-green"
                    : isStepComplete
                      ? "text-text-primary"
                      : isStepActive
                        ? "text-accent"
                        : "text-text-muted"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
