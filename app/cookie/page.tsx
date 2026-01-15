import Link from 'next/link'
import { Cookie } from 'lucide-react'

export default function CookiePage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="flex items-center space-x-4 mb-8">
          <Cookie className="w-8 h-8 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">Cookie Policy</h1>
        </div>
        <p className="text-gray-400 mb-12">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit a website. They are widely used 
              to make websites work more efficiently and provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Cookies</h2>
            <p>NepVerse uses cookies for the following purposes:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
              <li><strong>Authentication:</strong> To keep you logged in and maintain your session</li>
              <li><strong>Preferences:</strong> To remember your settings and preferences</li>
              <li><strong>Analytics:</strong> To understand how visitors use our website</li>
              <li><strong>Performance:</strong> To improve website performance and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div className="bg-card p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Strictly Necessary Cookies</h3>
                <p className="text-gray-400">
                  These cookies are essential for the website to function and cannot be switched off. They are usually 
                  set in response to actions made by you.
                </p>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Functionality Cookies</h3>
                <p className="text-gray-400">
                  These cookies allow the website to remember choices you make and provide enhanced features.
                </p>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Analytics Cookies</h3>
                <p className="text-gray-400">
                  These cookies help us understand how visitors interact with our website by collecting and reporting 
                  information anonymously.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Managing Cookies</h2>
            <p>
              You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies 
              can impact your user experience and parts of our website may no longer be fully accessible.
            </p>
            <p className="mt-4">
              Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>See what cookies you have and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from particular sites</li>
              <li>Block all cookies from being set</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics 
              and deliver advertisements. These cookies are set by domains other than NepVerse.
            </p>
          </section>

          <section className="bg-card p-6 rounded-lg mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about our use of cookies, please contact us:
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




