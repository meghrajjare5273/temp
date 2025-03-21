"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    quote:
      "ModelCraft AI has completely transformed how our team builds and deploys AI models. What used to take weeks now takes hours.",
    author: "Sarah Johnson",
    role: "CTO, TechVision Inc.",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote:
      "As someone with no coding experience, I never thought I could build AI models. ModelCraft AI made it possible and now I'm using AI to grow my business.",
    author: "Michael Chen",
    role: "Founder, GrowthMetrics",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    quote:
      "The intuitive interface and powerful features make ModelCraft AI stand out from other no-code AI platforms. It's a game-changer for our research team.",
    author: "Dr. Emily Rodriguez",
    role: "Research Director, DataScience Labs",
    avatar: "/placeholder.svg?height=100&width=100",
  },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-white text-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of professionals who are building AI models without code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-6 flex-grow">
                    <p className="text-white italic">"{testimonial.quote}"</p>
                  </div>
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                      <AvatarFallback>
                        {testimonial.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

