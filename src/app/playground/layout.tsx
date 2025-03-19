import type React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PlaygroundLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#FFF8F5]">
      <div className="bg-white p-4 shadow-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#FF5722] hover:text-[#F4511E] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center justify-center flex-1">
            <svg
              width="32"
              height="32"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path d="M10 30L20 10L30 30H10Z" fill="#FF5722" />
              <path d="M15 25L20 15L25 25H15Z" fill="#FF7043" />
            </svg>
            <h1 className="text-xl font-bold text-gray-800">ML Platform</h1>
          </div>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>
      {children}
    </div>
  );
}
