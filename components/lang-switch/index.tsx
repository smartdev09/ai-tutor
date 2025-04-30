"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, hover } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import { FaLanguage } from "react-icons/fa"

const useClickOutside = (handler: () => void) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [handler])

  return ref
}

interface Language {
  code: string
  name: string
}

const LanguageSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const ref = useClickOutside(() => setIsOpen(false))
  const searchParams = useSearchParams();

  const languages: Language[] = [
    { code: "en", name: "English" },
    { code: "de", name: "Deutsch" },
    { code: "ar", name: "العربية" },
  ]

  const changeLanguage = (locale: string) => {
    const localePattern = new RegExp(`^/(${languages.map(l => l.code).join("|")})(/|$)`);
    let pathWithoutLocale = pathname.replace(localePattern, "/");
    pathWithoutLocale = pathWithoutLocale.replace(/\/+/g, "/");
    
    const isAISearch = pathWithoutLocale.startsWith('/ai/search');
    const queryString = isAISearch ? `?${searchParams.toString()}` : '';

    const newPath = `${locale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}${queryString}`;
    
    setIsOpen(false);
    router.push(`/${newPath}`);
  };

  return (
    <div ref={ref} className="fixed top-4 right-40 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Language switcher"
        className="z-40 inline-flex items-center justify-center px-3 py-3 overflow-hidden font-semibold text-white transition-all duration-300 bg-primary rounded-full shadow-lg hover:bg-purple-700 hover:shadow-xl active:scale-95"
      >
        <span title="Change language" className="z-10">
          <FaLanguage className="w-5 h-5" />
        </span>
        <div className="absolute inset-0 transition duration-300 rounded-full" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-16 right-0 p-2 rounded-full shadow-lg backdrop-blur-sm bg-primary`}
          >
            <ul className="space-y-2">
              {languages.map((language, index) => (
                <motion.li
                  key={language.code}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.05 * (index + 1) }}
                >
                  <button
                    onClick={() => changeLanguage(language.code)}
                    className={`px-1 py-2 flex items-center rounded-xl cursor-pointer w-full ${
                      currentLocale === language.code
                        ? "bg-white text-primary"
                        : `${hover} text-primary-foreground`
                    }`}
                  >
                    <span className="text-xs uppercase">{language.code}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSwitcher