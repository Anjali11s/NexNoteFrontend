// src/components/PWAPrompt.jsx
import { useEffect, useState } from 'react'
import { DownloadIcon, XIcon } from 'lucide-react'

const PWAPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-amber-200 dark:border-stone-700 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
            <DownloadIcon className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-stone-800 dark:text-white">Install NexNote</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              Install our app for a better experience with offline access
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="px-3 py-1.5 border border-stone-300 dark:border-stone-600 rounded-lg text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
          >
            <XIcon className="size-4 text-stone-500" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAPrompt