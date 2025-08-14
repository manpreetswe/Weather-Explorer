const apiKey = "f4b3fa00799e4aede4a1cbe08de58cad"; // Your API key

// ===== Dark Mode Initialization =====
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

// Helper: format time in AM/PM (local system time)
function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// Helper: change background while preserving dark mode
function changeBackground(condition) {
  const isDark = document.body.classList.contains("dark");
  document.body.className = isDark ? "dark" : "";
  condition = condition.toLowerCase();
  if (condition.includes("clear")) document.body.classList.add("clear");
  else if (condition.includes("cloud")) document.body.classList.add("clouds");
  else if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunderstorm")) document.body.classList.add("rain");
  else if (condition.includes("snow")) document.body.classList.add("snow");
  else document.body.classList.add("default");
}

// Main weather function
async function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return alert("Please enter a city name.");
  try {
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const weatherData = await weatherRes.json();
    if (weatherData.cod !== 200) throw new Error(weatherData.message);

    // Update current weather UI
    document.getElementById("cityName").textContent = `${weatherData.name}, ${weatherData.sys.country}`;
    document.getElementById("temperature").textContent = `🌡 Temp: ${Math.round(weatherData.main.temp)}°C`;
    document.getElementById("description").textContent = `⛅ Condition: ${weatherData.weather[0]?.description ?? "-"}`;
    document.getElementById("humidity").textContent = `💧 Humidity: ${weatherData.main.humidity ?? "-" }%`;
    document.getElementById("feelslike").textContent = `🤔 Feels Like: ${Math.round(weatherData.main.feels_like)}°C`;
    document.getElementById("windspeed").textContent = `💨 Wind: ${weatherData.wind.speed ?? "-" } m/s`;
    document.getElementById("sunrise").textContent = `🌅 Sunrise: ${formatTime(weatherData.sys.sunrise)}`;
    document.getElementById("sunset").textContent = `🌇 Sunset: ${formatTime(weatherData.sys.sunset)}`;
    document.getElementById("localTime").textContent = `🕒 Local Time: ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;

    // Weather icon
    document.querySelector(".current-weather .icon").innerHTML = `<img src="https://openweathermap.org/img/wn/${weatherData.weather[0]?.icon ?? "01d"}@2x.png" alt="weather icon">`;

    // Change background
    changeBackground(weatherData.weather[0]?.main ?? "default");

    // Forecast
    getForecast(weatherData.coord.lat, weatherData.coord.lon);

  } catch (error) {
    alert(error.message);
  }
}

// Forecast function
async function getForecast(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await res.json();

    // 4-day forecast (existing code)
    const forecastEls = document.querySelectorAll(".forecast-days .day");
    const dailyData = {};
    let dayIndex = 0;
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString("en-US", { weekday: "short" });
      if (!dailyData[day]) dailyData[day] = item;
    });
    Object.keys(dailyData).slice(0, 4).forEach(day => {
      const item = dailyData[day];
      forecastEls[dayIndex].querySelector(".weekday").textContent = day;
      forecastEls[dayIndex].querySelector(".temp").textContent = `${Math.round(item.main.temp)}°C`;
      forecastEls[dayIndex].querySelector(".icon").innerHTML = `<img src="https://openweathermap.org/img/wn/${item.weather[0]?.icon ?? "01d"}@2x.png" alt="">`;
      dayIndex++;
    });

    // Hourly forecast (next 12 hours)
    const hourlyContainer = document.getElementById("hourlyForecast");
    hourlyContainer.innerHTML = "";
    const nowUnix = Math.floor(Date.now() / 1000);
    const upcomingHours = data.list.filter(item => item.dt > nowUnix).slice(0, 12);
    upcomingHours.forEach(item => {
      const hourDiv = document.createElement("div");
      hourDiv.classList.add("hourly-card");
      hourDiv.innerHTML = `
        <div class="hour">${formatTime(item.dt)}</div>
        <div class="icon"><img src="https://openweathermap.org/img/wn/${item.weather[0]?.icon ?? "01d"}@2x.png" alt=""></div>
        <div class="temp">${Math.round(item.main.temp)}°C</div>
      `;
      hourlyContainer.appendChild(hourDiv);
    });

  } catch (error) {
    console.error(error);
  }
}
