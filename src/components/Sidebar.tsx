/* eslint-disable @typescript-eslint/no-unused-vars */
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
    <div className="w-full lg:w-64 bg-white border-r shadow-sm lg:min-h-screen">
      <div className="hidden lg:block p-6 border-b">
        <div className="flex items-center mb-6">
          <svg
            width="32"
            height="32"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path d="M10 30L20 10L30 30H10Z" fill="#FF5722" />
            <path d="M15 25L20 15L25 25H15Z" fill="#FF7043" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800">ML Platform</h1>
        </div>
      </div>
      <nav className="p-4">
        <ul className="space-y-3">
          {steps.map((step, index) => {
            const isActive = activeStep === step.id;
            const isCompleted =
              steps.findIndex((s) => s.id === activeStep) >
              steps.findIndex((s) => s.id === step.id);
            const isDisabled =
              steps.findIndex((s) => s.id === step.id) >
                steps.findIndex((s) => s.id === activeStep) &&
              !Object.keys(summaries).length;

            return (
              <li key={step.id}>
                <button
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveStep(step.id);
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                    isActive
                      ? "bg-[#FF5722] text-white shadow-md"
                      : isCompleted
                      ? "bg-orange-50 text-gray-800 hover:bg-orange-100"
                      : "hover:bg-gray-100"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`rounded-full flex items-center justify-center ${
                      isActive
                        ? "text-white"
                        : isCompleted
                        ? "text-[#FF5722]"
                        : "text-gray-500"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className="font-medium">{step.label}</span>
                  {isCompleted && !isActive && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-[#FF5722]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
