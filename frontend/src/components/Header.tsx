"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VA</span>
            </div>
            <span className="text-xl font-bold text-gray-900">VedaAI</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              Create
            </Link>
            <a
              href="/#features"
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              Features
            </a>
            <a
              href="/#faq"
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              FAQ
            </a>
          </nav>

          {/* CTA Button */}
          <Link
            href="/"
            className="hidden sm:inline-flex px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
