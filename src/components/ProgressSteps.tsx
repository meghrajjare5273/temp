"use client";

import { useML } from "@/context/MLContext";
import { Upload, Cog, Brain, BarChart3 } from "lucide-react";
import type { Step } from "@/types";
import { motion } from "motion/react";

export function ProgressSteps() {
  const { activeStep } = useML();

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
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isActive = steps.findIndex((s) => s.id === activeStep) >= index;
          return (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: isActive ? 1.05 : 1 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[#FF5722] text-white shadow-md"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step.icon}
              </motion.div>
              <span
                className={`text-xs mt-2 hidden sm:block font-medium ${
                  isActive ? "text-[#FF5722]" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{
            width: `${
              (steps.findIndex((s) => s.id === activeStep) /
                (steps.length - 1)) *
              100
            }%`,
          }}
          transition={{ duration: 0.5 }}
          className="absolute h-full bg-[#FF5722]"
        />
      </div>
    </div>
  );
}
