"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
                NoCode AI
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* <Link href="#features" className="text-gray-700 hover:text-purple-600 transition-colors">
              Features
            </Link> */}
            <Link href="/playground" className="text-gray-700 hover:text-purple-600 transition-colors">
              Playground
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-purple-600 transition-colors">
              Pricing
            </Link>
         
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="outline"
              className="border-gray-200 text-gray-700 hover:text-purple-600 hover:border-purple-200"
            >
              Sign In
            </Button>
           
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-purple-600 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/playground" className="text-gray-700 hover:text-purple-600 transition-colors">
              Playground
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-purple-600 transition-colors">
              Pricing
            </Link>
             
            
          </div>
        </div>
      )}
    </header>
  )
}

