"use client"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const AnimatedGradient = ({ className }: { className?: string }) => {
  return (
    <div className={`rounded-full blur-[120px] opacity-20 ${className}`}>
      <div className="w-full h-full bg-gradient-to-r from-purple-400 to-purple-600 animate-pulse"></div>
    </div>
  )
}

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-20 overflow-hidden text-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block bg-purple-100 text-purple-600 text-sm font-medium py-1 px-3 rounded-full mb-6">
              Introducing NoCode AI
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
          >
            Build powerful AI models
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
              without writing code
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Create, train, and deploy custom AI models directly in your browser with just a few clicks. No programming
            experience required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
             onClick={() => window.location.href = '/playground'}
            className="h-12 px-8 bg-gradient-to-r from-purple-600 to-purple-500 hover:shadow-lg text-white transition-all duration-300">
              Try Playground
            </Button>
            <Button
              variant="outline"
              className="h-12 px-8 border-gray-200"
              onClick={() => window.open("https://www.youtube.com/watch?v=JjMiH3y49bM", "_blank")}
            >
              Watch Demo
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 relative mx-auto max-w-5xl"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none opacity-0 hover:opacity-0 transition-opacity duration-300"></div>
            <iframe
              className="w-full h-full absolute inset-0 z-0"
              src="https://www.youtube.com/embed/JjMiH3y49bM?si=gV_jig97Atd6xYv1"
              title="ModelCraft AI Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
          <div className="absolute -bottom-6 -right-6 -left-6 h-12 bg-gradient-to-t from-white to-transparent z-10"></div>
        </motion.div>
      </div>

      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10">
        <AnimatedGradient className="w-[800px] h-[800px]" />
      </div>
    </section>
  )
}

export default HeroSection

