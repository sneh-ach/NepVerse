import React from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-card border-t border-gray-800 mt-20">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">NepVerse</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary transition-colors inline-block">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors inline-block">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie" className="hover:text-primary transition-colors inline-block">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Help</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors inline-block">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-primary transition-colors inline-block">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/devices" className="hover:text-primary transition-colors inline-block">
                  Supported Devices
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Connect</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <a
                  href="https://facebook.com/nepverse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center space-x-2"
                >
                  <Facebook size={16} />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/nepverse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center space-x-2"
                >
                  <Instagram size={16} />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/nepverse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center space-x-2"
                >
                  <Twitter size={16} />
                  <span>Twitter</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              &copy; {new Date().getFullYear()} NepVerse. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-gray-400 text-sm">
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/cookie" className="hover:text-primary transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

