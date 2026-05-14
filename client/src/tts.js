const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text) {
  if (!supported) return

  // cancel anything currently playing
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate   = 0.95
  utterance.pitch  = 1
  utterance.volume = 1
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (supported) window.speechSynthesis.cancel()
}

export const ttsSupported = supported
