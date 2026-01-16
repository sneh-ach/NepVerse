'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      toast.success('Thank you! We\'ll get back to you soon.', {
        duration: 4000,
      })
      setFormData({ name: '', email: '', subject: '', message: '' })
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">Contact Us</h1>
        <p className="text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12">
          We'd love to hear from you. Get in touch with our team.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Contact Info */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-card p-4 sm:p-6 rounded-lg">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-2 sm:mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2">Email</h3>
              <a href="mailto:support@nepverse.com" className="text-sm sm:text-base text-gray-400 hover:text-primary transition-colors">
                support@nepverse.com
              </a>
            </div>

            <div className="bg-card p-4 sm:p-6 rounded-lg">
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-2 sm:mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2">Phone</h3>
              <a href="tel:+977-1-XXXXXXX" className="text-sm sm:text-base text-gray-400 hover:text-primary transition-colors">
                +977-1-XXXXXXX
              </a>
            </div>

            <div className="bg-card p-4 sm:p-6 rounded-lg">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-2 sm:mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2">Address</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Kathmandu, Nepal
              </p>
            </div>

            <div className="bg-card p-4 sm:p-6 rounded-lg">
              <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Business Hours</h3>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                <p>Monday - Friday: 9:00 AM - 6:00 PM NPT</p>
                <p>Saturday: 10:00 AM - 4:00 PM NPT</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <Input
                label="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  placeholder="Tell us how we can help..."
                  className="w-full px-4 py-3 bg-background border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all duration-200 hover:border-gray-600 resize-none"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full flex items-center justify-center space-x-2"
                isLoading={isSubmitting}
              >
                <Send size={18} />
                <span>Send Message</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

