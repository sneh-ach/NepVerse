'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageSquare, Book, Video, Settings, CreditCard, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const supportCategories = [
    {
      icon: Video,
      title: 'Watching Content',
      description: 'Troubleshoot playback issues, quality settings, and streaming problems',
      articles: [
        'How to change video quality',
        'Troubleshooting playback issues',
        'Supported video formats',
        'Subtitle and audio options',
      ],
    },
    {
      icon: CreditCard,
      title: 'Billing & Subscription',
      description: 'Manage your subscription, payment methods, and billing questions',
      articles: [
        'How to update payment method',
        'Understanding subscription plans',
        'Cancel or change subscription',
        'Billing and refunds',
      ],
    },
    {
      icon: User,
      title: 'Account Management',
      description: 'Account settings, profiles, and security',
      articles: [
        'Create and manage profiles',
        'Change password',
        'Update account information',
        'Account security tips',
      ],
    },
    {
      icon: Settings,
      title: 'Technical Support',
      description: 'Device compatibility, app issues, and technical problems',
      articles: [
        'Supported devices',
        'App troubleshooting',
        'System requirements',
        'Network and connectivity',
      ],
    },
  ]

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Support ticket submitted! We\'ll get back to you soon.', {
      duration: 4000,
    })
  }

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">Support Center</h1>
        <p className="text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12">
          Get help with your NepVerse account and streaming experience
        </p>

        {/* Search */}
        <div className="mb-8 sm:mb-12">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search for help articles..."
              className="text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12"
            />
            <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Support Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {supportCategories.map((category, index) => {
            const Icon = category.icon
            return (
              <div key={index} className="bg-card p-4 sm:p-6 rounded-lg">
                <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{category.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">{category.description}</p>
                <ul className="space-y-1.5 sm:space-y-2">
                  {category.articles.map((article, i) => (
                    <li key={i}>
                      <a href="#" className="text-xs sm:text-sm text-primary hover:underline">
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 sm:mb-12">
          <Link href="/faq" className="bg-card p-4 sm:p-6 rounded-lg hover:bg-card-hover transition-colors">
            <Book className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-2 sm:mb-3" />
            <h3 className="text-base sm:text-lg text-white font-semibold mb-1 sm:mb-2">FAQ</h3>
            <p className="text-xs sm:text-sm text-gray-400">Common questions and answers</p>
          </Link>
          <Link href="/devices" className="bg-card p-4 sm:p-6 rounded-lg hover:bg-card-hover transition-colors">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-2 sm:mb-3" />
            <h3 className="text-base sm:text-lg text-white font-semibold mb-1 sm:mb-2">Supported Devices</h3>
            <p className="text-xs sm:text-sm text-gray-400">Check device compatibility</p>
          </Link>
          <Link href="/contact" className="bg-card p-4 sm:p-6 rounded-lg hover:bg-card-hover transition-colors sm:col-span-2 md:col-span-1">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-2 sm:mb-3" />
            <h3 className="text-base sm:text-lg text-white font-semibold mb-1 sm:mb-2">Contact Us</h3>
            <p className="text-xs sm:text-sm text-gray-400">Get in touch with our team</p>
          </Link>
        </div>

        {/* Submit Ticket */}
        <div className="bg-card p-6 sm:p-8 rounded-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Submit a Support Ticket</h2>
          <form onSubmit={handleSubmitTicket} className="space-y-3 sm:space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Your Name" required />
              <Input label="Email" type="email" required />
            </div>
            <Input label="Subject" required />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Describe your issue
              </label>
              <textarea
                required
                rows={6}
                className="w-full px-4 py-3 bg-background border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <Button type="submit" variant="primary">
              Submit Ticket
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}



