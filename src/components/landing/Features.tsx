"use client";

import { motion } from "motion/react";
import { FileText, MessageSquare, BarChart2, PieChart } from "lucide-react";

const features = [
  {
    icon: <FileText className="h-6 w-6 text-white" />,
    title: "Automation Machine Learning",
    description:
      "Automate complex processes with our advanced machine learning solutions.",
    link: "Talk With Us",
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-white" />,
    title: "AI-Powered Chatbots",
    description:
      "Enhance customer engagement with intelligent conversational interfaces.",
    link: "Talk With Us",
  },
  {
    icon: <BarChart2 className="h-6 w-6 text-white" />,
    title: "Data Analytics Deep Insights",
    description:
      "Transform raw data into actionable business intelligence and insights.",
    link: "Talk With Us",
  },
  {
    icon: <PieChart className="h-6 w-6 text-white" />,
    title: "AI Strategy Pro Consulting",
    description:
      "Strategic guidance to implement AI solutions aligned with your business goals.",
    link: "Talk With Us",
  },
];

export function Features() {
  return (
    <section id="services" className="py-20 px-6 md:px-10 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-4xl font-bold mb-6">
            We are pioneers in{" "}
            <span className="text-[#FF5722]">AI consulting</span>,
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl">
            dedicated to helping businesses harness the power of artificial
            intelligence to drive innovation, efficiency, and growth.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="mb-4 w-12 h-12 bg-[#FF5722] rounded-lg flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  {feature.description}
                </p>
                <div className="mt-auto">
                  <button className="text-[#FF5722] bg-orange-50 hover:bg-orange-100 transition-colors py-2 px-4 rounded-md text-sm font-medium w-full">
                    {feature.link}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
