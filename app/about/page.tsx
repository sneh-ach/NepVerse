import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Film, Users, Globe, Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us - NepVerse',
  description: 'Learn about NepVerse, Nepal\'s premier streaming platform for Nepali movies, series, and original content.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About NepVerse</h1>
        <p className="text-xl text-gray-400 mb-12">
          The Home of Nepali Stories
        </p>

        <div className="space-y-12">
          {/* Mission */}
          <section>
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Film className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">Our Mission</h2>
                <p className="text-gray-300 leading-relaxed">
                  NepVerse is dedicated to bringing the best of Nepali cinema and storytelling to audiences worldwide. 
                  We believe in preserving and promoting Nepali culture through entertainment, making quality content 
                  accessible to Nepali communities everywhere.
                </p>
              </div>
            </div>
          </section>

          {/* Story */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Founded in 2023, NepVerse was born from a simple yet powerful vision: to create a platform where 
                Nepali stories can thrive and reach global audiences. We recognized the need for a dedicated streaming 
                service that celebrates Nepali culture, language, and creativity.
              </p>
              <p>
                Today, NepVerse is home to hundreds of Nepali movies, original series, and exclusive content. 
                We work closely with filmmakers, actors, and content creators to bring you the finest Nepali 
                entertainment, from classic films to cutting-edge originals.
              </p>
            </div>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card p-6 rounded-lg">
                <Users className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Community First</h3>
                <p className="text-gray-400">
                  We prioritize our community of viewers and creators, building a platform that serves their needs.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg">
                <Award className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Quality Content</h3>
                <p className="text-gray-400">
                  We curate and produce only the highest quality Nepali content for our audience.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg">
                <Globe className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Global Reach</h3>
                <p className="text-gray-400">
                  We make Nepali content accessible to audiences worldwide, connecting the diaspora.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-card p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Join the NepVerse Community</h2>
            <p className="text-gray-400 mb-6">
              Start your free trial today and discover unlimited Nepali entertainment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button variant="primary" size="lg">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  Contact Us
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}




