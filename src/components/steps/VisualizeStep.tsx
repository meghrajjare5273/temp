/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
import { Database } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getChartData } from "@/utils/model-utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function VisualizeStep() {
  const { modelResults, setActiveStep } = useML();

  if (Object.keys(modelResults).length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualize Results</CardTitle>
        <CardDescription>
          View and analyze your model performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Object.entries(modelResults).map(
          ([filename, result]: [string, any]) => (
            <div key={filename} className="mb-8 last:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">{filename}</h3>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg mb-6">
                <h4 className="text-sm font-medium mb-2">Model Details</h4>
                <div className="text-sm">
                  <p>
                    <span className="font-medium">Task Type:</span>{" "}
                    {result.task_type}
                  </p>
                  <p>
                    <span className="font-medium">Model Type:</span>{" "}
                    {result.model_type}
                  </p>
                  {result.error ? (
                    <p className="text-destructive mt-2">{result.error}</p>
                  ) : (
                    <div className="mt-2">
                      {Object.entries(result.results || {}).map(
                        ([metric, value]: [string, any]) => (
                          <p key={metric}>
                            <span className="font-medium">{metric}:</span>{" "}
                            {value === null || typeof value !== "number"
                              ? "N/A"
                              : value.toFixed(4)}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!result.error && getChartData(result) && (
                <div className="bg-card border rounded-lg p-4 h-64">
                  <Bar
                    data={getChartData(result)}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" },
                        title: {
                          display: true,
                          text: `${result.task_type} Performance Metrics for ${result.model_type}`,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 1.0,
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          )
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          onClick={() => setActiveStep("train")}
          className="w-full"
        >
          Train Another Model
        </Button>
      </CardFooter>
    </Card>
  );
}
