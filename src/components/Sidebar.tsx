"use client";

import { useML } from "@/context/MLContext";
import { Upload, Cog, Brain, BarChart3, CheckCircle2 } from "lucide-react";
import type { Step } from "@/types";

export function Sidebar() {
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
    <div className="w-full lg:w-64 bg-card border-r lg:min-h-screen">
      <div className="hidden lg:block p-6">
        <h1 className="text-2xl font-bold mb-6">ML Platform</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {steps.map((step, index) => (
            <li key={step.id}>
              <button
                onClick={() => {
                  if (
                    steps.findIndex((s) => s.id === step.id) <=
                      steps.findIndex((s) => s.id === activeStep) ||
                    Object.keys(summaries).length > 0
                  ) {
                    setActiveStep(step.id);
                  }
                }}
                disabled={
                  steps.findIndex((s) => s.id === step.id) >
                    steps.findIndex((s) => s.id === activeStep) &&
                  !Object.keys(summaries).length
                }
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                  activeStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                } ${
                  steps.findIndex((s) => s.id === step.id) >
                    steps.findIndex((s) => s.id === activeStep) &&
                  !Object.keys(summaries).length
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {step.icon}
                <span>{step.label}</span>
                {index < steps.findIndex((s) => s.id === activeStep) && (
                  <CheckCircle2 className="ml-auto h-4 w-4 text-accent" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
