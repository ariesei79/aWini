let countdownInterval

function showModal() {
  document.getElementById("timeModal").style.display = "block"
}

function hideModal() {
  document.getElementById("timeModal").style.display = "none"
}

function setTime() {
  const inputTime = document.getElementById("campaignStartTime").value
  if (!inputTime) {
    alert("Please enter a valid time.")
    return
  }

  const [hours, minutes] = inputTime.split(":").map(Number)
  const campaignStartDate = new Date()
  campaignStartDate.setHours(hours, minutes, 0, 0)

  clearInterval(countdownInterval) // Clear any existing interval

  countdownInterval = setInterval(updateCountdown, 1000)

  function updateCountdown() {
    const now = new Date().getTime()
    const timeLeft = campaignStartDate.getTime() - now

    if (timeLeft <= 0) {
      const startText = "Starting Audit / Meeting, Have a Nice Day"
      document.getElementById("countdown").textContent = startText
      clearInterval(countdownInterval) // Stop countdown when it reaches 0
      return
    }

    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

    document.getElementById("hours").textContent = hours.toString().padStart(2, "0")
    document.getElementById("minutes").textContent = minutes.toString().padStart(2, "0")
    document.getElementById("seconds").textContent = seconds.toString().padStart(2, "0")
  }

  updateCountdown() // Initial call to update the countdown immediately
  hideModal() // Hide modal
}
