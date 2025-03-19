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
import { FileDown, Brain, Target, List } from "lucide-react";
import { trainModel, getDownloadModelUrl } from "@/services/api";
import { getAvailableModels } from "@/utils/model-utils";
import { motion } from "motion/react";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border border-orange-100 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-white">
          <CardTitle className="text-2xl text-gray-800">Train Models</CardTitle>
          <CardDescription className="text-gray-600">
            Configure and train machine learning models on your data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-5 rounded-lg border border-orange-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Brain className="h-5 w-5 text-[#FF5722]" />
                </div>
                <h3 className="font-medium text-gray-800">ML Task Type</h3>
              </div>

              {suggestedTaskTypes &&
                Object.values(suggestedTaskTypes).length > 0 && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-[#FF5722]">
                      Suggested: {Object.values(suggestedTaskTypes).join(", ")}
                    </span>
                  </div>
                )}

              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full p-3 rounded-md border border-gray-200 bg-white focus:border-[#FF5722] focus:ring focus:ring-[#FF5722]/20 transition-all"
                disabled={isLoading}
              >
                <option value="">Select Task Type</option>
                <option value="classification">Classification</option>
                <option value="regression">Regression</option>
                <option value="clustering">Clustering</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {taskType === "classification" &&
                  "Predict a category or class from input features"}
                {taskType === "regression" &&
                  "Predict a continuous numerical value from input features"}
                {taskType === "clustering" &&
                  "Group similar data points together based on features"}
                {!taskType &&
                  "Choose the type of machine learning task to perform"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-5 rounded-lg border border-orange-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="h-5 w-5 text-[#FF5722]" />
                </div>
                <h3 className="font-medium text-gray-800">Target Column</h3>
              </div>

              {suggestedTargetColumns &&
                Object.values(suggestedTargetColumns).filter((v) => v).length >
                  0 && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-[#FF5722]">
                      Suggested:{" "}
                      {Object.values(suggestedTargetColumns)
                        .filter((v) => v)
                        .join(", ") || "None"}
                    </span>
                  </div>
                )}

              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full p-3 rounded-md border border-gray-200 bg-white focus:border-[#FF5722] focus:ring focus:ring-[#FF5722]/20 transition-all"
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
              <p className="mt-2 text-xs text-gray-500">
                {targetColumn
                  ? "The column your model will learn to predict"
                  : "Select 'None' for unsupervised learning like clustering"}
              </p>
            </motion.div>
          </div>

          {taskType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-5 rounded-lg border border-orange-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <List className="h-5 w-5 text-[#FF5722]" />
                </div>
                <h3 className="font-medium text-gray-800">Model Type</h3>
              </div>

              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full p-3 rounded-md border border-gray-200 bg-white focus:border-[#FF5722] focus:ring focus:ring-[#FF5722]/20 transition-all"
                disabled={isLoading}
              >
                {getAvailableModels(taskType).map((model) => (
                  <option key={model.key} value={model.key}>
                    {model.display}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Different model types have different strengths and weaknesses
              </p>
            </motion.div>
          )}
        </CardContent>
        <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-4">
          <Button
            onClick={handleTrain}
            className="w-full bg-[#FF5722] hover:bg-[#F4511E] text-white h-12 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Training..." : "Start Training"}
          </Button>

          {Object.keys(modelResults).length > 0 &&
            files.map((file) => (
              <Button
                key={file.name}
                variant="outline"
                onClick={() => handleDownloadModel(file.name)}
                className="w-full border-[#FF5722] text-[#FF5722] hover:bg-orange-50"
                disabled={isLoading}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download Model {file.name}
              </Button>
            ))}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
