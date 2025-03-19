/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useML } from "@/context/MLContext";
import { Upload, Cog, Brain, BarChart3 } from "lucide-react";
import type { Step } from "@/types";

export function ProgressSteps() {
  const { activeStep, setActiveStep, summaries } = useML();

  const steps: Step[] = [
    {
      id: "upload",
      label: "Upload Datasets",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      id: "preprocess",
      label: "Preprocess Data",
      icon: <Cog className="h-5 w-5" />,
    },
    { id: "train", label: "Train Models", icon: <Brain className="h-5 w-5" /> },
    {
      id: "visualize",
      label: "Visualize Results",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                steps.findIndex((s) => s.id === activeStep) >= index
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.icon}
            </div>
            <span className="text-xs mt-1 hidden sm:block">{step.label}</span>
          </div>
        ))}
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary transition-all duration-300"
          style={{
            width: `${
              (steps.findIndex((s) => s.id === activeStep) /
                (steps.length - 1)) *
              100
            }%`,
          }}
        />
      </div>
    </div>
  );
}
