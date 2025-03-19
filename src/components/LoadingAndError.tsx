"use client";

import { useML } from "@/context/MLContext";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function LoadingAndError() {
  const { isLoading, progress, error, setError } = useML();

  return (
    <>
      {/* Loading indicator */}
      {isLoading && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Processing...</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          {/* <AlertCircle className="h-4 w-4" /> */}
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="ml-2 mt-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
