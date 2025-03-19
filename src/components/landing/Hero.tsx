"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 bg-gradient-to-r from-[#FFF8F5] to-[#FFF0EB]">
      <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-bl from-[#FF5722] to-[#FF8A65] opacity-30"></div>
        <div className="absolute right-0 top-1/4 w-3/4 h-3/4 rounded-full bg-[#FF5722] blur-3xl opacity-30"></div>
      </div>

      <div className="container mx-auto px-6 md:px-10 lg:px-20 z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Visionary
                <br />
                <span className="italic">Intelligence</span>
              </h1>
              <p className="mt-6 text-lg text-gray-700 max-w-lg">
                AI consulting redefined with best visionary intelligence. We
                craft tailored solutions to supercharge your digital
                transformation.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Button
                  size="lg"
                  className="bg-[#FF5722] hover:bg-[#F4511E] text-white border-none shadow-lg px-8 py-6 rounded-md"
                >
                  Free Consultation
                </Button>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center overflow-hidden"
                      >
                        <span className="text-xs font-medium text-orange-500">
                          {i}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">4.5 Trustscore</span>
                    <svg
                      className="w-4 h-4 text-yellow-400 ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="hidden md:block relative">
            {/* This space is intentionally left empty to match the layout in the image */}
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-8 items-center opacity-70">
            <div className="text-gray-500 font-medium">Google</div>
            <div className="text-gray-500 font-medium">Adobe</div>
            <div className="text-gray-500 font-medium">Vidio</div>
            <div className="text-gray-500 font-medium">Avast</div>
          </div>
        </div>
      </div>
    </section>
  );
}
