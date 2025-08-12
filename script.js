const apiKey = "f4b3fa00799e4aede4a1cbe08de58cad"; // Replace with your OpenWeatherMap API key

// Initialize theme from localStorage or default to dark
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark" || savedTheme === null) {
  document.body.classList.add("dark");
  if (savedTheme === null) localStorage.setItem("theme", "dark");
} else {
  document.body.classList.remove("dark");
}

// Theme toggle button
document.getElementById("theme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Helper to update background based on weather condition, preserving dark mode
function changeBackground(condition) {
  // Preserve dark class if present
  const isDark = document.body.classList.contains("dark");

  // Reset classes but keep dark if present
  document.body.className = isDark ? "dark" : "";

  // Add weather condition class
  switch (condition) {
    case "clear":
      document.body.classList.add("clear");
      break;
    case "clouds":
      document.body.classList.add("clouds");
      break;
    case "rain":
    case "drizzle":
    case "thunderstorm":
      document.body.classList.add("rain");
      break;
    case "snow":
      document.body.classList.add("snow");
      break;
    default:
      document.body.classList.add("default");
  }
}

// Format time like "6:30 AM"
function formatTime(timestamp, timezoneOffset) {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Format hour for hourly forecast like "3 PM"
function formatHour(timestamp, timezoneOffset) {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  return date.toLocaleTimeString([], { hour: "numeric", hour12: true });
}

// Main function to fetch and display weather
async function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return alert("Please enter a city name.");

  try {
    // Fetch current weather data
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    const currentData = await currentRes.json();

    if (currentData.cod !== 200) {
      alert(currentData.message);
      return;
    }

    // Update current weather UI
    document.getElementById("cityName").textContent = currentData.name + ", " + currentData.sys.country;
    document.getElementById("temperature").textContent = `Temperature:  ${Math.round(currentData.main.temp)}°C`;
    document.getElementById("description").textContent = `Description: ${currentData.weather[0].description}`;
    document.getElementById("humidity").textContent = `Humidity: ${currentData.main.humidity}%`;
    document.getElementById("feelslike").textContent = `Feels like: ${Math.round(currentData.main.feels_like)}°C`;
    document.getElementById("windspeed").textContent = `Wind Speed: ${currentData.wind.speed} m/s`;

    const timezoneOffset = currentData.timezone; // in seconds

    document.getElementById("sunrise").textContent = `Sunrise: ${formatTime(currentData.sys.sunrise, timezoneOffset)}`;
    document.getElementById("sunset").textContent = `Sunset: ${formatTime(currentData.sys.sunset, timezoneOffset)}`;

    // Set weather icon
    const iconContainer = document.querySelector(".current-weather .icon");
    iconContainer.innerHTML = `<img src="https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png" alt="weather icon">`;

    // Change background, preserving dark mode
    changeBackground(currentData.weather[0].main.toLowerCase());

    // Fetch forecast data (5 day, 3 hour intervals)
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    );
    const forecastData = await forecastRes.json();

    if (forecastData.cod !== "200") {
      alert(forecastData.message);
      return;
    }

    // Update 4-day forecast
    const days = document.querySelectorAll(".forecast-days .day");
    const usedDates = new Set();
    let dayIndex = 0;

    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      // Use only one forecast per day (take first found)
      if (!usedDates.has(dayName) && dayIndex < 4) {
        usedDates.add(dayName);
        days[dayIndex].querySelector(".weekday").textContent = dayName;
        days[dayIndex].querySelector(".temp").textContent = `${Math.round(item.main.temp)}°C`;
        days[dayIndex].querySelector(".icon").innerHTML = `<img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="icon">`;
        dayIndex++;
      }
    }

    // Update hourly forecast for next 12 hours
    const hourlyContainer = document.getElementById("hourlyForecast");
    hourlyContainer.innerHTML = ""; // clear previous

    // Show 12 items max, starting from nearest future forecast
    const nowUnix = Math.floor(Date.now() / 1000);

    // Filter hourly forecasts after current time
    const upcomingHours = forecastData.list.filter(item => item.dt > nowUnix).slice(0, 12);

    for (const hourData of upcomingHours) {
      const hourDiv = document.createElement("div");
      hourDiv.classList.add("hourly-card");

      hourDiv.innerHTML = `
        <div class="hour">${formatHour(hourData.dt, timezoneOffset)}</div>
        <div class="icon"><img src="https://openweathermap.org/img/wn/${hourData.weather[0].icon}@2x.png" alt="icon"></div>
        <div class="temp">${Math.round(hourData.main.temp)}°C</div>
      `;

      hourlyContainer.appendChild(hourDiv);
    }
  } catch (error) {
    console.error(error);
    alert("Failed to fetch weather data. Please try again.");
  }
}
