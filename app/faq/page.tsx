'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'What is NepVerse?',
      answer: 'NepVerse is Nepal\'s premier streaming platform dedicated to Nepali movies, series, and original content. We bring the best of Nepali entertainment to audiences worldwide.',
    },
    {
      question: 'How much does NepVerse cost?',
      answer: 'NepVerse offers flexible subscription plans starting from NPR 299/month. We also offer annual plans with significant savings. Check our pricing page for detailed information.',
    },
    {
      question: 'Can I watch NepVerse on multiple devices?',
      answer: 'Yes! You can stream NepVerse on multiple devices including smartphones, tablets, smart TVs, and computers. Your subscription allows you to watch on up to 4 devices simultaneously.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, we offer a 7-day free trial for new users. No credit card required to start your trial. You can cancel anytime during the trial period.',
    },
    {
      question: 'What content is available on NepVerse?',
      answer: 'NepVerse features a vast library of Nepali movies, original series, documentaries, and exclusive content. We regularly add new titles to keep our library fresh and exciting.',
    },
    {
      question: 'Can I download content to watch offline?',
      answer: 'Currently, offline downloads are not available. However, you can stream all content online with a stable internet connection. We\'re working on adding offline viewing in the future.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period, and you\'ll continue to have access until then.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards, debit cards, and local payment methods including eSewa and Khalti. All payments are processed securely.',
    },
    {
      question: 'Is NepVerse available outside Nepal?',
      answer: 'Yes! NepVerse is available worldwide. Wherever you are, you can access our complete library of Nepali content.',
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach our support team through the contact page, email at support@nepverse.com, or through the support section in your account dashboard. We typically respond within 24 hours.',
    },
    {
      question: 'Can I share my account with family?',
      answer: 'Your subscription includes multiple profiles, so family members can have their own personalized experience. However, sharing account credentials with people outside your household violates our terms of service.',
    },
    {
      question: 'What video quality is available?',
      answer: 'NepVerse streams in multiple quality options including 360p, 720p, and 1080p. Quality automatically adjusts based on your internet connection, or you can manually select your preferred quality in settings.',
    },
  ]

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
          <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">Frequently Asked Questions</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-400 mb-8 sm:mb-12">
          Find answers to common questions about NepVerse
        </p>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-card-hover transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-sm sm:text-base text-white font-semibold pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div id={`faq-answer-${index}`} className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-800">
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 bg-card p-6 sm:p-8 rounded-lg text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Still have questions?</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a href="/contact">
            <button className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-primary text-white rounded-md hover:bg-primary-light transition-colors">
              Contact Support
            </button>
          </a>
        </div>
      </div>
    </div>
  )
}



