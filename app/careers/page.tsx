import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Briefcase, Users, TrendingUp, Heart } from 'lucide-react'

export default function CareersPage() {
  const openPositions = [
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Kathmandu / Remote',
      type: 'Full-time',
    },
    {
      title: 'Content Curator',
      department: 'Content',
      location: 'Kathmandu',
      type: 'Full-time',
    },
    {
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Kathmandu / Remote',
      type: 'Full-time',
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Kathmandu',
      type: 'Full-time',
    },
  ]

  const benefits = [
    { icon: Heart, title: 'Health Insurance', description: 'Comprehensive health coverage for you and your family' },
    { icon: TrendingUp, title: 'Career Growth', description: 'Opportunities for professional development and advancement' },
    { icon: Users, title: 'Great Team', description: 'Work with passionate and talented individuals' },
    { icon: Briefcase, title: 'Flexible Work', description: 'Remote work options and flexible hours' },
  ]

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Join Our Team</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Help us build the future of Nepali entertainment. We're looking for passionate individuals 
            who share our vision.
          </p>
        </div>

        {/* Why Work With Us */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Why Work at NepVerse?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="bg-card p-6 rounded-lg">
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Open Positions */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8">Open Positions</h2>
          <div className="space-y-4">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-card p-6 rounded-lg hover:bg-card-hover transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{position.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span>{position.department}</span>
                      <span>•</span>
                      <span>{position.location}</span>
                      <span>•</span>
                      <span>{position.type}</span>
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button variant="outline">Apply Now</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 bg-card p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Don't See a Role That Fits?</h2>
          <p className="text-gray-400 mb-6">
            We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <Link href="/contact">
            <Button variant="primary" size="lg">
              Send Your Resume
            </Button>
          </Link>
        </section>
      </div>
    </div>
  )
}




