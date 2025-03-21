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
import { FileDown, Wand2, SlidersHorizontal, Tag, Info } from "lucide-react";
import { preprocessData, getDownloadPreprocessedUrl } from "@/services/api";
import { motion } from "motion/react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    setPreprocessedFiles
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
      const data = await preprocessData(
        files,
        missingStrategy,
        scaling,
        encoding,
        isTargetEncodingMethod ? targetColumn : "",
        setProgress
      );
      setPreprocessedFiles(
        Object.fromEntries(
          Object.entries(data).map(([k, v]: [string, any]) => [
            k,
            v.preprocessed_file,
          ])
        )
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border border-white/10 bg-secondary-50 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-secondary-100 to-secondary-50 border-b border-white/10">
          <CardTitle className="text-2xl text-white">Preprocess Data</CardTitle>
          <CardDescription className="text-white/70">
            Configure preprocessing options for your datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <Alert className="bg-primary/10 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-white">
              Our AI has analyzed your data and suggested optimal preprocessing
              settings. You can adjust these settings if needed.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-secondary-100 p-5 rounded-lg border border-white/10 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-white">
                  Missing Values Strategy
                </h3>
              </div>

              {suggestedMissingStrategies &&
                Object.values(suggestedMissingStrategies).length > 0 && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      Suggested:{" "}
                      {Object.values(suggestedMissingStrategies).join(", ")}
                    </span>
                  </div>
                )}

              <select
                value={missingStrategy}
                onChange={(e) => setMissingStrategy(e.target.value)}
                className="w-full p-3 rounded-md border border-white/10 bg-secondary-200 text-white focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                disabled={isLoading}
              >
                <option className="bg-primary text-black" value="mean">
                  Mean
                </option>
                <option className="bg-primary text-black" value="median">
                  Median
                </option>
                <option className="bg-primary text-black" value="mode">
                  Mode
                </option>
                <option className="bg-primary text-black" value="drop">
                  Drop
                </option>
              </select>
              <p className="mt-2 text-xs text-white/50">
                {missingStrategy === "mean" &&
                  "Replace missing values with the mean of the column"}
                {missingStrategy === "median" &&
                  "Replace missing values with the median of the column"}
                {missingStrategy === "mode" &&
                  "Replace missing values with the most frequent value"}
                {missingStrategy === "drop" &&
                  "Remove rows with missing values"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-secondary-100 p-5 rounded-lg border border-white/10 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-white">Scaling & Encoding</h3>
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="scaling"
                  checked={scaling}
                  onChange={(e) => setScaling(e.target.checked)}
                  className="w-4 h-4 text-primary border-white/30 rounded focus:ring-primary bg-secondary-200"
                  disabled={isLoading}
                />
                <label
                  htmlFor="scaling"
                  className="ml-2 text-sm font-medium text-white"
                >
                  Enable Scaling
                </label>
              </div>
              <p className="text-xs text-white/50 mb-4">
                Standardize numeric features to have zero mean and unit variance
              </p>

              <div className="mb-2">
                <label className="block text-sm font-medium text-white mb-1">
                  Encoding Method
                </label>
                <select
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value)}
                  className="w-full p-3 rounded-md border border-white/10 bg-secondary-200 text-white focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                  disabled={isLoading}
                >
                  <option className="bg-primary text-black" value="onehot">
                    One-Hot Encoding
                  </option>
                  <option className="bg-primary text-black" value="label">
                    Label Encoding
                  </option>
                  <option className="bg-primary text-black" value="target">
                    Target Encoding
                  </option>
                  <option className="bg-primary text-black" value="kfold">
                    K-Fold Target Encoding
                  </option>
                </select>
              </div>
              <p className="text-xs text-white/50">
                {encoding === "target" &&
                  "Target encoding uses the target variable to encode categorical features"}
                {encoding === "kfold" &&
                  "K-Fold target encoding prevents data leakage by using cross-validation"}
                {encoding === "label" &&
                  "Label encoding converts categories to numeric values"}
                {encoding === "onehot" &&
                  "One-hot encoding creates binary columns for each category"}
              </p>
            </motion.div>
          </div>

          {isTargetEncodingMethod && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-secondary-100 p-5 rounded-lg border border-white/10 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-white">
                  Target Column (Required for{" "}
                  {encoding === "target" ? "Target" : "K-Fold"} Encoding)
                </h3>
              </div>

              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full p-3 rounded-md border border-white/10 bg-secondary-200 text-white focus:border-primary focus:ring focus:ring-primary/20 transition-all"
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
            </motion.div>
          )}
        </CardContent>
        <CardFooter className="px-6 py-4 bg-secondary-200 border-t border-white/10 flex flex-col gap-4">
          <Button
            onClick={handlePreprocess}
            className="w-full bg-primary hover:bg-secondary/90 hover:text-white text-black font-semibold h-12 text-base border-2"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Preprocess Data"}
          </Button>

          {files.map((file: File) => (
            <Button
              key={file.name}
              variant="outline"
              onClick={() => handleDownloadPreprocessed(file.name)}
              className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground font-medium"
              disabled={isLoading}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download Preprocessed {file.name}
            </Button>
          ))}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
