"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-24 px-6 md:px-10 lg:px-20 bg-[#FF5722] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FF3D00]/30"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Let&apos;s Build The
          </h2>
          <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-white italic mb-10">
            Future Together!
          </p>

          <Link href="/contact">
            <Button
              size="lg"
              className="bg-black hover:bg-gray-900 text-white px-8 py-6 rounded-md shadow-xl"
            >
              Contact Us
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
