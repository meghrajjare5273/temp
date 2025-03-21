"use client"

import { motion } from "framer-motion"
import { Brain, Layers, Zap, BarChart, Share2, Shield } from "lucide-react"

const features = [
  {
    icon: <Brain className="h-10 w-10 text-purple-600" />,
    title: "Intuitive Model Builder",
    description: "Drag-and-drop interface to build complex AI models without writing a single line of code.",
  },
  {
    icon: <Layers className="h-10 w-10 text-purple-600" />,
    title: "Pre-trained Components",
    description: "Access a library of pre-trained components to jumpstart your AI model development.",
  },
  {
    icon: <Zap className="h-10 w-10 text-purple-600" />,
    title: "Browser-based Training",
    description: "Train your models directly in the browser using your own data or our curated datasets.",
  },
  {
    icon: <BarChart className="h-10 w-10 text-purple-600" />,
    title: "Real-time Analytics",
    description: "Monitor model performance and get insights to improve accuracy and efficiency.",
  },
  {
    icon: <Share2 className="h-10 w-10 text-purple-600" />,
    title: "One-click Deployment",
    description: "Deploy your models to production with a single click and integrate via API.",
  },
  {
    icon: <Shield className="h-10 w-10 text-purple-600" />,
    title: "Privacy-focused",
    description: "Your data never leaves your browser, ensuring maximum privacy and security.",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features, Simple Interface</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to build, train, and deploy AI models without writing code.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}