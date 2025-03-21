"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function CtaSection() {
  return (
    <section className="relative py-20 overflow-hidden">
    <div className="section-container relative z-10">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-3xl font-display font-semibold mb-4 text-black">
                Start building AI{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                  without code
                </span>
              </h2>
              <p className="text-gray-600 mb-8">
                Join thousands of users who are already creating and deploying custom AI models with ease.
              </p>
              <Button className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg text-white transition-all duration-300">
                Get Started Free
              </Button>
              <p className="mt-4 text-sm text-gray-500">
                No credit card required. Free plan includes 5 models.
              </p>
            </motion.div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 to-purple-600/90"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1673002940674-3914282cf645?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-12 text-white text-center">
                <div className="mb-4 inline-block">
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8.00002C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27002L13 2.27002C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27002L4 6.27002C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00002V16C3.00036 16.3508 3.09294 16.6952 3.26846 16.9989C3.44398 17.3025 3.69626 17.5547 4 17.73L11 21.73C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.73L20 17.73C20.3037 17.5547 20.556 17.3025 20.7315 16.9989C20.9071 16.6952 20.9996 16.3508 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.5 4.21002L12 6.81002L16.5 4.21002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.5 19.79V14.6L3 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12L16.5 14.6V19.79" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.27002 6.96002L12 12.01L20.73 6.96002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-lg font-medium">
                  "The easiest way to incorporate AI into your business workflows without a data science team."
                </p>
                <div className="mt-6">
                  <p className="font-medium">Sarah Chen</p>
                  <p className="text-sm text-white/70">Product Lead, Acme Inc</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Background elements */}
    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] -z-10">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-pink-500/20 rounded-full blur-3xl opacity-30 animate-gradient-shift bg-[length:300%_300%]"></div>
    </div>
  </section>
  )
}

