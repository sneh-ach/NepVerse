import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="flex items-center space-x-4 mb-8">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">Terms of Use</h1>
        </div>
        <p className="text-gray-400 mb-12">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using NepVerse, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials on NepVerse&apos;s website for personal, non-commercial 
              transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on NepVerse&apos;s website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Subscription and Payment</h2>
            <p>
              By subscribing to NepVerse, you agree to pay the subscription fees as specified. Subscriptions are billed in advance 
              on a monthly or annual basis. You may cancel your subscription at any time, and cancellation will take effect at the 
              end of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility 
              for all activities that occur under your account or password.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Content Usage</h2>
            <p>
              All content on NepVerse is protected by copyright and other intellectual property laws. You may not download, copy, 
              distribute, or share any content without explicit permission. Content is for personal, non-commercial use only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Share your account credentials with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
            <p>
              In no event shall NepVerse or its suppliers be liable for any damages arising out of the use or inability to use 
              the materials on NepVerse&apos;s website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Changes to Terms</h2>
            <p>
              NepVerse reserves the right to revise these terms at any time without notice. By using this website you are agreeing 
              to be bound by the then current version of these Terms of Use.
            </p>
          </section>

          <section className="bg-card p-6 rounded-lg mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about these Terms of Use, please contact us at:
            </p>
            <p className="text-primary">
              <Link href="/contact" className="hover:underline">support@nepverse.com</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}



