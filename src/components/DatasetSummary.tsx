/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// Update the DatasetSummary component to include a button to view column info
import { useML } from "@/context/MLContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function DatasetSummary() {
  const { summaries, insights, activeStep } = useML();
  const [showColumnInfo, setShowColumnInfo] = useState<Record<string, boolean>>(
    {}
  );

  if (Object.keys(summaries).length === 0 || activeStep === "upload") {
    return null;
  }

  const toggleColumnInfo = (filename: string) => {
    setShowColumnInfo((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Dataset Summary</CardTitle>
        <CardDescription>Overview of your uploaded datasets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(summaries).map(
            ([filename, summary]: [string, any]) => (
              <div
                key={filename}
                className="pb-6 border-b last:border-0 last:pb-0"
              >
                <h4 className="text-lg font-medium flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4" />
                  {filename}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Basic Info</h5>
                    <ul className="text-sm space-y-1">
                      <li>
                        <span className="font-medium">Rows:</span>{" "}
                        {summary.summary.rows}
                      </li>
                      <li>
                        <span className="font-medium">Columns:</span>{" "}
                        {summary.summary.columns.length}
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">
                      Suggested Analysis
                    </h5>
                    <ul className="text-sm space-y-1">
                      <li>
                        <span className="font-medium">Task Type:</span>{" "}
                        {summary.suggested_task_type}
                      </li>
                      <li>
                        <span className="font-medium">Target Column:</span>{" "}
                        {summary.suggested_target_column || "None"}
                      </li>
                      <li>
                        <span className="font-medium">Missing Strategy:</span>{" "}
                        {summary.suggested_missing_strategy}
                      </li>
                    </ul>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mb-3 flex items-center gap-2"
                  onClick={() => toggleColumnInfo(filename)}
                >
                  <Table className="h-4 w-4" />
                  {showColumnInfo[filename]
                    ? "Hide Column Info"
                    : "View Column Info"}
                </Button>

                {showColumnInfo[filename] && (
                  <div className="mb-4 bg-muted/50 p-3 rounded-md">
                    <h5 className="text-sm font-medium mb-2">
                      Column Information
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">
                              Column Name
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              Data Type
                            </th>
                            <th className="text-left py-2 px-3 font-medium">
                              Missing Values
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.summary.columns.map((column: string) => (
                            <tr key={column} className="border-b last:border-0">
                              <td className="py-2 px-3">{column}</td>
                              <td className="py-2 px-3">
                                {summary.summary.data_types[column]}
                              </td>
                              <td className="py-2 px-3">
                                {summary.summary.missing_values[column] || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {insights[filename] && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Insights</h5>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {insights[filename]}
                    </p>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
