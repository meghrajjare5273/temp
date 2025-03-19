/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { useML } from "@/context/MLContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileDown } from "lucide-react";
import { trainModel, getDownloadModelUrl } from "@/services/api";
import { getAvailableModels } from "@/utils/model-utils";

export function TrainStep() {
  const {
    files,
    summaries,
    targetColumn,
    setTargetColumn,
    taskType,
    setTaskType,
    modelType,
    setModelType,
    modelResults,
    setModelResults,
    suggestedTaskTypes,
    suggestedTargetColumns,
    setActiveStep,
    setError,
    isLoading,
    setIsLoading,
    setProgress,
  } = useML();

  // Set default model type when task type changes
  useEffect(() => {
    if (taskType) {
      const availableModels = getAvailableModels(taskType);
      if (availableModels.length > 0) {
        setModelType(availableModels[0].key);
      } else {
        setModelType("");
      }
    }
  }, [taskType, setModelType]);

  useEffect(() => {
    if (Object.keys(suggestedTaskTypes).length)
      setTaskType(Object.values(suggestedTaskTypes)[0] as string);
    if (Object.keys(suggestedTargetColumns).length)
      setTargetColumn(
        (Object.values(suggestedTargetColumns)[0] as string) || ""
      );
  }, [
    suggestedTaskTypes,
    suggestedTargetColumns,
    setTaskType,
    setTargetColumn,
  ]);

  const handleTrain = async () => {
    if (!files.length) return setError("Please upload files first.");
    setIsLoading(true);
    setProgress(10);

    try {
      const data = await trainModel(
        files,
        targetColumn,
        taskType,
        modelType,
        setProgress
      );
      setModelResults(data);
      setActiveStep("visualize");
    } catch (error: any) {
      console.error("Error training models:", error.message);
      setError(
        `Training failed: ${
          error.response?.data?.error || error.message
        }. Ensure backend is running.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadModel = (filename: string) => {
    window.location.href = getDownloadModelUrl(filename);
  };

  if (Object.keys(summaries).length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Train Models</CardTitle>
        <CardDescription>
          Configure and train machine learning models on your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Task Type</label>
          <p className="text-xs text-muted-foreground mb-2">
            Suggested: {Object.values(suggestedTaskTypes).join(", ")}
          </p>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background"
            disabled={isLoading}
          >
            <option value="">Select Task Type</option>
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
            <option value="clustering">Clustering</option>
          </select>
        </div>

        {taskType && (
          <div>
            <label className="block text-sm font-medium mb-1">Model Type</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background"
              disabled={isLoading}
            >
              {getAvailableModels(taskType).map((model) => (
                <option key={model.key} value={model.key}>
                  {model.display}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Target Column
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Suggested:{" "}
            {Object.values(suggestedTargetColumns)
              .filter((v) => v)
              .join(", ") || "None"}
          </p>
          <select
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background"
            disabled={isLoading}
          >
            <option value="">None (Unsupervised)</option>
            {Object.values(summaries)
              .flatMap((s: any) => s.summary.columns)
              .filter((v: any, i: any, a: any) => a.indexOf(v) === i)
              .map((col: string) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
          </select>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button onClick={handleTrain} className="w-full" disabled={isLoading}>
          {isLoading ? "Training..." : "Start Training"}
        </Button>

        {Object.keys(modelResults).length > 0 &&
          files.map((file) => (
            <Button
              key={file.name}
              variant="default"
              onClick={() => handleDownloadModel(file.name)}
              className="w-full"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download Model {file.name}
            </Button>
          ))}
      </CardFooter>
    </Card>
  );
}
