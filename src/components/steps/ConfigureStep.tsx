"use client";

import { useEffect } from "react";
import { useML } from "@/context/MLContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Target, List } from "lucide-react";
import { motion } from "motion/react";

export function ConfigureStep() {
  const {
    summaries,
    taskType,
    setTaskType,
    targetColumn,
    setTargetColumn,
    suggestedTaskTypes,
    suggestedTargetColumns,
    setActiveStep,
    setError,
    selectedFeatures,
    setSelectedFeatures,
  } = useML();

  useEffect(() => {
    if (Object.keys(suggestedTaskTypes).length)
      setTaskType(Object.values(suggestedTaskTypes)[0]);

    // Check if suggestedTargetColumns exists and has keys
    if (Object.keys(suggestedTargetColumns).length) {
      const firstFileName = Object.keys(suggestedTargetColumns)[0];
      const suggestedTarget = suggestedTargetColumns[firstFileName];

      // Update targetColumn for the first file with the suggested target
      if (suggestedTarget) {
        setTargetColumn((prev) => ({
          ...prev,
          [firstFileName]: suggestedTarget,
        }));
      }
    }
  }, [
    suggestedTaskTypes,
    suggestedTargetColumns,
    setTaskType,
    setTargetColumn,
  ]);

  const handleFeatureToggle = (filename: string, column: string) => {
    setSelectedFeatures((prev) => {
      const current = prev[filename] || [];
      if (current.includes(column)) {
        return { ...prev, [filename]: current.filter((col) => col !== column) };
      } else {
        return { ...prev, [filename]: [...current, column] };
      }
    });
  };

  const handleNext = () => {
    if (!taskType) {
      setError("Please select a task type.");
      return;
    }
    setActiveStep("preprocess");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Configure Datasets</CardTitle>
          <CardDescription>
            Select task type, target column, and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(summaries).map(([filename, summary]) => (
            <div key={filename} className="mb-6">
              <h3 className="text-lg font-medium text-white">{filename}</h3>
              <div className="grid md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="flex items-center gap-2 text-white">
                    <Target className="h-4 w-4" /> Task Type
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full p-2 mt-1 rounded-md border border-white/10 bg-secondary-200 text-white"
                  >
                    <option value="">Select Task Type</option>
                    <option value="classification">Classification</option>
                    <option value="regression">Regression</option>
                    <option value="clustering">Clustering</option>
                  </select>
                </div>
                {taskType !== "clustering" && (
                  <div>
                    <label className="flex items-center gap-2 text-white">
                      <Target className="h-4 w-4" /> Target Column
                    </label>
                    <select
                      value={targetColumn[filename] || ""}
                      onChange={(e) =>
                        setTargetColumn((prev) => ({
                          ...prev,
                          [filename]: e.target.value,
                        }))
                      }
                      className="w-full p-2 mt-1 rounded-md border border-white/10 bg-secondary-200 text-white"
                    >
                      <option value="">Select Target</option>
                      {summary.summary.columns.map((col: string) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-white">
                  <List className="h-4 w-4" /> Features
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {summary.summary.columns
                    .filter(
                      (col: string) =>
                        col !== targetColumn[filename] ||
                        taskType === "clustering"
                    )
                    .map((feature: string) => (
                      <label
                        key={feature}
                        className="flex items-center gap-2 text-white"
                      >
                        <input
                          type="checkbox"
                          checked={
                            selectedFeatures[filename]?.includes(feature) ??
                            true
                          }
                          onChange={() =>
                            handleFeatureToggle(filename, feature)
                          }
                        />
                        {feature}
                      </label>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <div className="px-6 py-4 flex justify-end">
          <Button onClick={handleNext}>Next</Button>
        </div>
      </Card>
    </motion.div>
  );
}
