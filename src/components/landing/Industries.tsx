/* eslint-disable @next/next/no-img-element */
 
"use client";

import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const industries = [
  {
    title: "Real State & Prop Tech",
    image: "/placeholder.svg?height=300&width=400",
    description:
      "AI solutions for property management, valuation, and customer experience.",
  },
  {
    title: "Gaming & Entertainment",
    image: "/placeholder.svg?height=300&width=400",
    description:
      "Enhance player experiences and optimize game development with AI.",
  },
  {
    title: "Healthcare & Biotech",
    image: "/placeholder.svg?height=300&width=400",
    description:
      "Revolutionize patient care and accelerate medical research with AI.",
  },
  {
    title: "Finance & Banking",
    image: "/placeholder.svg?height=300&width=400",
    description:
      "Streamline operations and enhance security with intelligent solutions.",
  },
];

export function Industries() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === industries.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? industries.length - 1 : prev - 1));
  };

  return (
    <section
      id="industries"
      className="py-20 px-6 md:px-10 lg:px-20 bg-[#FF5722]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-5xl font-bold text-white leading-tight">
              Industries
              <br />
              We Serve
            </h2>
            <p className="mt-6 text-lg text-white/90 max-w-lg">
              AI is reshaping industries worldwide, enabling businesses to
              optimize operations, enhance decision-making, and unlock new
              revenue streams.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex gap-1">
                {industries.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentSlide ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>

          <div className="space-y-6">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-white rounded-lg overflow-hidden shadow-lg ${
                  index === currentSlide ? "block" : "hidden"
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-900/20 to-gray-900/0"></div>
                  <img
                    src={industry.image || "/placeholder.svg"}
                    alt={industry.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {industry.title}
                  </h3>
                  <p className="text-gray-600">{industry.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
