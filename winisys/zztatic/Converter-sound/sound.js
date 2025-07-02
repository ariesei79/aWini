let saveAsMP3 = true

function convertToSpeech() {
  const text = document.getElementById("textArea").value
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "en-US"
  utterance.voice = speechSynthesis.getVoices().find((voice) => voice.name === "Microsoft David - English (United States)")
  utterance.pitch = 0.95
  utterance.volume = 1

  speechSynthesis.speak(utterance)
}

function convertToSpeech2() {
  const text = document.getElementById("textArea").value
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "ms-MY"
  utterance.voice = speechSynthesis.getVoices().find((voice) => voice.name === "Microsoft Osman")
  utterance.pitch = 0.55
  utterance.rate = 0.85
  utterance.volume = 1

  speechSynthesis.speak(utterance)
}

function getAvailableVoices() {
  const voices = speechSynthesis.getVoices()
  console.log(voices)
}

speechSynthesis.addEventListener("voiceschanged", getAvailableVoices)

document.getElementById("convertButton").addEventListener("click", convertToSpeech)

document.getElementById("convertButton2").addEventListener("click", convertToSpeech2)
