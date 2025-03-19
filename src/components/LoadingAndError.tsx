"use client";

import { useML } from "@/context/MLContext";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { motion } from "motion/react";

export function LoadingAndError() {
  const { isLoading, progress, error, setError } = useML();

  return (
    <>
      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600">Processing...</p>
            <span className="text-sm font-medium text-[#FF5722]">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-100">
            <div className="h-full bg-[#FF5722] transition-all" />
          </Progress>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6"
        >
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-600">Error</AlertTitle>
            <AlertDescription className="text-red-600">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="ml-2 mt-2 border-red-200 hover:bg-red-100 text-red-600"
              >
                Dismiss
                <X className="ml-1 h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </>
  );
}
