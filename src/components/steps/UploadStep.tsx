/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useRef } from "react";
import { useML } from "@/context/MLContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database, UploadIcon } from "lucide-react";
import { uploadFiles } from "@/services/api";
import { ViewDatasetInfo } from "@/components/ViewDatasetInfo";

export function UploadStep() {
  const {
    files,
    setFiles,
    setSummaries,
    setInsights,
    setSuggestedMissingStrategies,
    setSuggestedTaskTypes,
    setSuggestedTargetColumns,
    setActiveStep,
    setError,
    isLoading,
    setIsLoading,
    setProgress,
  } = useML();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length) {
      setFiles(selectedFiles);
      await handleUploadFiles(selectedFiles);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length) {
      setFiles(droppedFiles);
      await handleUploadFiles(droppedFiles);
    }
  };

  const handleUploadFiles = async (filesToUpload: File[]) => {
    setIsLoading(true);
    setProgress(10);
    try {
      const data = await uploadFiles(filesToUpload, setProgress);
      setSummaries(data);
      setInsights(
        Object.fromEntries(
          Object.entries(data).map(([k, v]: [string, any]) => [k, v.insights])
        )
      );
      setSuggestedMissingStrategies(
        Object.fromEntries(
          Object.entries(data).map(([k, v]: [string, any]) => [
            k,
            v.suggested_missing_strategy,
          ])
        )
      );
      setSuggestedTaskTypes(
        Object.fromEntries(
          Object.entries(data).map(([k, v]: [string, any]) => [
            k,
            v.suggested_task_type,
          ])
        )
      );
      setSuggestedTargetColumns(
        Object.fromEntries(
          Object.entries(data).map(([k, v]: [string, any]) => [
            k,
            v.suggested_target_column,
          ])
        )
      );
      setActiveStep("preprocess");
    } catch (error: any) {
      console.error("Error uploading files:", error.message);
      setError(
        "Failed to upload files. Ensure the backend is running on http://127.0.0.1:8000."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <>
      <ViewDatasetInfo />

      <Card>
        <CardHeader>
          <CardTitle>Upload Datasets</CardTitle>
          <CardDescription>
            Upload your CSV files to begin the ML training process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              isLoading
                ? "opacity-50 pointer-events-none"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <UploadIcon className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Drag & Drop Files</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Drag and drop your CSV files here, or click to browse your files
              </p>
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Select Files
              </Button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Selected Files:</h4>
              <ul className="space-y-2">
                {files.map(
                  (
                    file: {
                      name:
                        | string
                        | number
                        | bigint
                        | boolean
                        | React.ReactElement<
                            unknown,
                            string | React.JSXElementConstructor<any>
                          >
                        | Iterable<React.ReactNode>
                        | React.ReactPortal
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactPortal
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                      size: number;
                    },
                    index: React.Key | null | undefined
                  ) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 p-2 bg-muted rounded-md"
                    >
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
