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
import { preprocessData, getDownloadPreprocessedUrl } from "@/services/api";

export function PreprocessStep() {
  const {
    files,
    summaries,
    missingStrategy,
    setMissingStrategy,
    scaling,
    setScaling,
    encoding,
    setEncoding,
    targetColumn,
    setTargetColumn,
    suggestedMissingStrategies,
    suggestedTargetColumns,
    setActiveStep,
    setError,
    isLoading,
    setIsLoading,
    setProgress,
  } = useML();

  useEffect(() => {
    if (Object.keys(suggestedMissingStrategies).length) {
      setMissingStrategy(
        Object.values(suggestedMissingStrategies)[0] as string
      );
    }

    // Set default target column for target encoding
    if (Object.keys(suggestedTargetColumns).length) {
      const target = Object.values(suggestedTargetColumns)[0];
      if (target) {
        setTargetColumn(target);
      }
    }
  }, [
    suggestedMissingStrategies,
    suggestedTargetColumns,
    setMissingStrategy,
    setTargetColumn,
  ]);

  const handlePreprocess = async () => {
    if (!files.length) return setError("Please upload files first.");

    // Validate target column is selected for target-based encoding methods
    if ((encoding === "target" || encoding === "kfold") && !targetColumn) {
      return setError("Please select a target column for target encoding.");
    }

    setIsLoading(true);
    setProgress(10);

    try {
      await preprocessData(
        files,
        missingStrategy,
        scaling,
        encoding,
        targetColumn,
        setProgress
      );
      setActiveStep("train");
    } catch (error: any) {
      console.error("Error preprocessing files:", error.message);
      setError(
        `Preprocessing failed: ${
          error.response?.data?.error || error.message
        }. Ensure backend is running.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPreprocessed = (filename: string) => {
    window.location.href = getDownloadPreprocessedUrl(filename);
  };

  // Check if encoding requires a target column
  const isTargetEncodingMethod = encoding === "target" || encoding === "kfold";

  if (Object.keys(summaries).length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preprocess Data</CardTitle>
        <CardDescription>
          Configure preprocessing options for your datasets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Missing Values Strategy
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Suggested: {Object.values(suggestedMissingStrategies).join(", ")}
            </p>
            <select
              value={missingStrategy}
              onChange={(e) => setMissingStrategy(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background"
              disabled={isLoading}
            >
              <option value="mean">Mean</option>
              <option value="median">Median</option>
              <option value="mode">Mode</option>
              <option value="drop">Drop</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scaling}
                onChange={(e) => setScaling(e.target.checked)}
                className="rounded border-input"
                disabled={isLoading}
              />
              <span className="text-sm font-medium">Enable Scaling</span>
            </label>
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              Standardize numeric features to have zero mean and unit variance
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Encoding Method
            </label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background"
              disabled={isLoading}
            >
              <option value="onehot">One-Hot Encoding</option>
              <option value="label">Label Encoding</option>
              <option value="target">Target Encoding</option>
              <option value="kfold">K-Fold Target Encoding</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {encoding === "target" &&
                "Target encoding uses the target variable to encode categorical features"}
              {encoding === "kfold" &&
                "K-Fold target encoding prevents data leakage by using cross-validation"}
              {encoding === "label" &&
                "Label encoding converts categories to numeric values"}
              {encoding === "onehot" &&
                "One-hot encoding creates binary columns for each category"}
            </p>
          </div>

          {isTargetEncodingMethod && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Target Column (Required for{" "}
                {encoding === "target" ? "Target" : "K-Fold"} Encoding)
              </label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full p-2 rounded-md border border-input bg-background"
                disabled={isLoading}
              >
                <option value="">Select Target Column</option>
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
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          onClick={handlePreprocess}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Preprocess Data"}
        </Button>

        {files.map((file: File) => (
          <Button
            key={file.name}
            variant="outline"
            onClick={() => handleDownloadPreprocessed(file.name)}
            className="w-full"
            disabled={isLoading}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download Preprocessed {file.name}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}
