// Internationalization service
// Supports multiple languages and locales

export type Locale = 'en' | 'ne' | 'hi'
export type Currency = 'USD' | 'NPR' | 'INR'

export interface Translation {
  [key: string]: string | Translation
}

class I18nService {
  private currentLocale: Locale = 'en'
  private translations: Map<Locale, Translation> = new Map()
  private currency: Currency = 'NPR'

  constructor() {
    // Load default translations
    this.loadTranslations()
  }

  private loadTranslations() {
    // English (default)
    this.translations.set('en', {
      common: {
        play: 'Play',
        pause: 'Pause',
        watch: 'Watch',
        addToList: 'Add to List',
        share: 'Share',
        like: 'Like',
        rating: 'Rating',
        year: 'Year',
        duration: 'Duration',
        genre: 'Genre',
        cast: 'Cast',
        director: 'Director',
        description: 'Description',
        reviews: 'Reviews',
        similar: 'Similar',
        trending: 'Trending',
        newReleases: 'New Releases',
        continueWatching: 'Continue Watching',
        myList: 'My List',
        search: 'Search',
        browse: 'Browse',
        home: 'Home',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
      },
      auth: {
        login: 'Login',
        signup: 'Sign Up',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot Password',
        resetPassword: 'Reset Password',
        createAccount: 'Create Account',
        alreadyHaveAccount: 'Already have an account?',
        dontHaveAccount: "Don't have an account?",
      },
    })

    // Nepali
    this.translations.set('ne', {
      common: {
        play: 'चलाउनुहोस्',
        pause: 'रोक्नुहोस्',
        watch: 'हेर्नुहोस्',
        addToList: 'सूचीमा थप्नुहोस्',
        share: 'साझेदारी गर्नुहोस्',
        like: 'मन पराउनुहोस्',
        rating: 'रेटिङ',
        year: 'वर्ष',
        duration: 'अवधि',
        genre: 'शैली',
        cast: 'कलाकार',
        director: 'निर्देशक',
        description: 'विवरण',
        reviews: 'समीक्षा',
        similar: 'समान',
        trending: 'ट्रेन्डिङ',
        newReleases: 'नयाँ रिलिज',
        continueWatching: 'हेरिरहनुहोस्',
        myList: 'मेरो सूची',
        search: 'खोज',
        browse: 'ब्राउज',
        home: 'घर',
        profile: 'प्रोफाइल',
        settings: 'सेटिङ',
        logout: 'लगआउट',
      },
      auth: {
        login: 'लगइन',
        signup: 'साइन अप',
        email: 'इमेल',
        password: 'पासवर्ड',
        forgotPassword: 'पासवर्ड बिर्सनुभयो?',
        resetPassword: 'पासवर्ड रिसेट',
        createAccount: 'खाता सिर्जना गर्नुहोस्',
        alreadyHaveAccount: 'पहिले नै खाता छ?',
        dontHaveAccount: 'खाता छैन?',
      },
    })

    // Hindi
    this.translations.set('hi', {
      common: {
        play: 'चलाएं',
        pause: 'रोकें',
        watch: 'देखें',
        addToList: 'सूची में जोड़ें',
        share: 'साझा करें',
        like: 'पसंद करें',
        rating: 'रेटिंग',
        year: 'वर्ष',
        duration: 'अवधि',
        genre: 'शैली',
        cast: 'कलाकार',
        director: 'निर्देशक',
        description: 'विवरण',
        reviews: 'समीक्षा',
        similar: 'समान',
        trending: 'ट्रेंडिंग',
        newReleases: 'नए रिलीज',
        continueWatching: 'देखना जारी रखें',
        myList: 'मेरी सूची',
        search: 'खोजें',
        browse: 'ब्राउज़',
        home: 'होम',
        profile: 'प्रोफ़ाइल',
        settings: 'सेटिंग्स',
        logout: 'लॉगआउट',
      },
      auth: {
        login: 'लॉगिन',
        signup: 'साइन अप',
        email: 'ईमेल',
        password: 'पासवर्ड',
        forgotPassword: 'पासवर्ड भूल गए?',
        resetPassword: 'पासवर्ड रीसेट',
        createAccount: 'खाता बनाएं',
        alreadyHaveAccount: 'पहले से खाता है?',
        dontHaveAccount: 'खाता नहीं है?',
      },
    })
  }

  setLocale(locale: Locale): void {
    this.currentLocale = locale
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
    }
  }

  getLocale(): Locale {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale') as Locale
      if (stored && this.translations.has(stored)) {
        return stored
      }
    }
    return this.currentLocale
  }

  t(key: string, params?: { [key: string]: string }): string {
    const locale = this.getLocale()
    const translation = this.translations.get(locale) || this.translations.get('en')!
    
    const keys = key.split('.')
    let value: any = translation
    
    for (const k of keys) {
      value = value?.[k]
      if (!value) break
    }

    if (typeof value !== 'string') {
      return key // Fallback to key if translation not found
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match
      })
    }

    return value
  }

  formatCurrency(amount: number): string {
    const locale = this.getLocale()
    const currencyMap: Record<Locale, Currency> = {
      en: 'USD',
      ne: 'NPR',
      hi: 'INR',
    }

    const currency = currencyMap[locale] || this.currency
    const localeMap: Record<Currency, string> = {
      USD: 'en-US',
      NPR: 'ne-NP',
      INR: 'hi-IN',
    }

    return new Intl.NumberFormat(localeMap[currency], {
      style: 'currency',
      currency,
    }).format(amount)
  }

  formatDate(date: Date): string {
    const locale = this.getLocale()
    const localeMap: Record<Locale, string> = {
      en: 'en-US',
      ne: 'ne-NP',
      hi: 'hi-IN',
    }

    return new Intl.DateTimeFormat(localeMap[locale]).format(date)
  }

  formatNumber(number: number): string {
    const locale = this.getLocale()
    const localeMap: Record<Locale, string> = {
      en: 'en-US',
      ne: 'ne-NP',
      hi: 'hi-IN',
    }

    return new Intl.NumberFormat(localeMap[locale]).format(number)
  }
}

export const i18n = new I18nService()


