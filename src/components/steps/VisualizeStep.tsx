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
import { BarChart2, PieChart, TrendingUp } from "lucide-react";
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
import { motion } from "motion/react";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border border-orange-100 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-white">
          <CardTitle className="text-2xl text-gray-800">
            Visualize Results
          </CardTitle>
          <CardDescription className="text-gray-600">
            View and analyze your model performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {Object.entries(modelResults).map(
            ([filename, result]: [string, any], index) => (
              <motion.div
                key={filename}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="mb-8 last:mb-0 bg-white rounded-lg border border-orange-100 shadow-sm overflow-hidden"
              >
                <div className="bg-gradient-to-r from-orange-50 to-white p-4 border-b border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      {result.task_type === "classification" ? (
                        <PieChart className="h-5 w-5 text-[#FF5722]" />
                      ) : result.task_type === "regression" ? (
                        <TrendingUp className="h-5 w-5 text-[#FF5722]" />
                      ) : (
                        <BarChart2 className="h-5 w-5 text-[#FF5722]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">
                        {filename}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {result.task_type} model using {result.model_type}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {result.error ? (
                    <div className="bg-red-50 text-red-500 p-4 rounded-md">
                      {result.error}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Model Performance Metrics
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(result.results || {}).map(
                            ([metric, value]: [string, any]) => (
                              <div
                                key={metric}
                                className="flex justify-between items-center"
                              >
                                <span className="text-sm font-medium text-gray-600">
                                  {metric
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  :
                                </span>
                                <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                  {value === null || typeof value !== "number"
                                    ? "N/A"
                                    : value.toFixed(4)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {result.feature_importance &&
                        result.feature_importance.length > 0 && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Feature Importance
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                              {result.feature_importance.map(
                                (
                                  [feature, importance]: [string, number],
                                  i: number
                                ) => (
                                  <div key={i} className="flex flex-col">
                                    <div className="flex justify-between items-center mb-1">
                                      <span
                                        className="text-xs text-gray-600 truncate max-w-[70%]"
                                        title={feature}
                                      >
                                        {feature}
                                      </span>
                                      <span className="text-xs font-mono">
                                        {importance.toFixed(4)}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className="bg-[#FF5722] h-1.5 rounded-full"
                                        style={{
                                          width: `${importance * 100}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {!result.error && getChartData(result) && (
                    <div className="mt-6 bg-white border rounded-lg p-4 h-64">
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
                              color: "#1f2937",
                              font: {
                                size: 14,
                                weight: "bold",
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 1.0,
                              ticks: {
                                color: "#6b7280",
                              },
                              grid: {
                                color: "#f3f4f6",
                              },
                            },
                            x: {
                              ticks: {
                                color: "#6b7280",
                              },
                              grid: {
                                display: false,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          )}
        </CardContent>
        <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => setActiveStep("train")}
            className="w-full border-[#FF5722] text-[#FF5722] hover:bg-orange-50"
          >
            Train Another Model
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
