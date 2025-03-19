import type React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PlaygroundLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div className="bg-white p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-xl font-bold text-center flex-1">
            ML Platform Playground
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>
      {children}
    </div>
  );
}
