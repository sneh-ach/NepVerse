import { Smartphone, Tablet, Monitor, Tv, Gamepad2, Laptop } from 'lucide-react'

export default function DevicesPage() {
  const deviceCategories = [
    {
      icon: Smartphone,
      title: 'Mobile Devices',
      devices: [
        { name: 'iOS', versions: 'iOS 12.0 or later', description: 'iPhone and iPad' },
        { name: 'Android', versions: 'Android 7.0 or later', description: 'Android phones and tablets' },
      ],
    },
    {
      icon: Monitor,
      title: 'Computers',
      devices: [
        { name: 'Windows', versions: 'Windows 10 or later', description: 'PC and laptops' },
        { name: 'macOS', versions: 'macOS 10.13 or later', description: 'Mac computers' },
        { name: 'Linux', versions: 'Most modern distributions', description: 'Linux systems' },
      ],
    },
    {
      icon: Tv,
      title: 'Smart TVs & Streaming Devices',
      devices: [
        { name: 'Smart TVs', versions: 'Most modern Smart TVs', description: 'Samsung, LG, Sony, etc.' },
        { name: 'Apple TV', versions: 'tvOS 12.0 or later', description: 'Apple TV 4K and HD' },
        { name: 'Android TV', versions: 'Android TV 7.0+', description: 'Android TV devices' },
        { name: 'Roku', versions: 'Roku OS 9.0+', description: 'All Roku devices' },
        { name: 'Fire TV', versions: 'Fire OS 5.0+', description: 'Amazon Fire TV devices' },
        { name: 'Chromecast', versions: 'All models', description: 'Google Chromecast' },
      ],
    },
    {
      icon: Gamepad2,
      title: 'Gaming Consoles',
      devices: [
        { name: 'PlayStation', versions: 'PS4, PS5', description: 'PlayStation 4 and 5' },
        { name: 'Xbox', versions: 'Xbox One, Series X/S', description: 'Xbox consoles' },
      ],
    },
    {
      icon: Laptop,
      title: 'Web Browsers',
      devices: [
        { name: 'Chrome', versions: 'Latest version', description: 'Google Chrome' },
        { name: 'Safari', versions: 'Latest version', description: 'Apple Safari' },
        { name: 'Firefox', versions: 'Latest version', description: 'Mozilla Firefox' },
        { name: 'Edge', versions: 'Latest version', description: 'Microsoft Edge' },
      ],
    },
  ]

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Supported Devices</h1>
        <p className="text-xl text-gray-400 mb-12">
          Watch NepVerse on your favorite devices. We support a wide range of platforms and devices.
        </p>

        <div className="space-y-8">
          {deviceCategories.map((category, index) => {
            const Icon = category.icon
            return (
              <div key={index} className="bg-card p-6 rounded-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <Icon className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl font-bold text-white">{category.title}</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.devices.map((device, i) => (
                    <div key={i} className="bg-background p-4 rounded-lg">
                      <h3 className="text-white font-semibold mb-2">{device.name}</h3>
                      <p className="text-primary text-sm mb-1">{device.versions}</p>
                      <p className="text-gray-400 text-sm">{device.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 bg-card p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">System Requirements</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-white font-semibold mb-3">Minimum Requirements</h3>
              <ul className="space-y-2 text-sm">
                <li>• Internet connection: 1.5 Mbps for SD quality</li>
                <li>• Internet connection: 3.0 Mbps for HD quality</li>
                <li>• Internet connection: 5.0 Mbps for Full HD quality</li>
                <li>• Latest version of supported browser or app</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Recommended</h3>
              <ul className="space-y-2 text-sm">
                <li>• Internet connection: 5.0 Mbps or higher</li>
                <li>• Latest operating system updates</li>
                <li>• Hardware acceleration enabled</li>
                <li>• Updated graphics drivers</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-card p-6 rounded-lg text-center">
          <h3 className="text-xl font-bold text-white mb-2">Device Not Listed?</h3>
          <p className="text-gray-400 mb-4">
            If your device isn't listed, it may still work. Try downloading our app or accessing through a web browser.
          </p>
          <a href="/contact" className="text-primary hover:underline">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}




