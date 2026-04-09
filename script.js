<script>
// ── Chart data ──
const hours12 = ['12am','1','2','3','4','5','6','7','8','9','10','11am'];
const tempData = [24,24,23,25,26,27,29,30,31,30,28,28];
const soilData = [70,69,68,67,65,63,61,60,59,61,62,62];
const rainData = [0,0,0,2,5,8,3,1,0,0,0,1];
const days7 = ['Apr 3','Apr 4','Apr 5','Apr 6','Apr 7','Apr 8','Apr 9'];
const histTemp = [26,27,29,36,30,28,28];
const histSoil = [65,66,64,52,55,60,62];
const histRain = [0,5,0,2,32,8,14];

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { font: { size: 10, family: 'DM Mono' }, color: '#9aad93' }, grid: { display: false }, border: { display: false } },
    y: { ticks: { font: { size: 10, family: 'DM Mono' }, color: '#9aad93' }, grid: { color: '#eef2eb' }, border: { display: false } }
  }
};

function makeLineChart(id, labels, data, color) {
  const el = document.getElementById(id);
  if (!el) return;
  new Chart(el, {
    type: 'line',
    data: { labels, datasets: [{ data, borderColor: color, backgroundColor: color + '18', fill: true, borderWidth: 2, tension: 0.4, pointRadius: 3, pointBackgroundColor: color }] },
    options: { ...chartDefaults }
  });
}

function makeBarChart(id, labels, data, color) {
  const el = document.getElementById(id);
  if (!el) return;
  new Chart(el, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: color + 'cc', borderRadius: 4, borderSkipped: false }] },
    options: { ...chartDefaults }
  });
}

makeLineChart('tempChart', hours12, tempData, '#e67e22');
makeLineChart('soilChart', hours12, soilData, '#3b82f6');
makeBarChart('rainChart', hours12, rainData, '#2563eb');
makeLineChart('histTempChart', days7, histTemp, '#e67e22');
makeLineChart('histSoilChart', days7, histSoil, '#3b82f6');
makeBarChart('histRainChart', days7, histRain, '#2563eb');

// ── Navigation ──
function showSection(name, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  el.classList.add('active');
  const titles = { dashboard: 'Dashboard Overview', history: 'Sensor History', crops: 'Crop Activity', irrigation: 'Irrigation Control', alerts: 'Alerts & Notifications', settings: 'Settings' };
  document.getElementById('topbar-title').textContent = titles[name] || name;
}

// ── Sensor refresh ──
function refreshData() {
  const t = 24 + Math.round(Math.random() * 12);
  const s = 45 + Math.round(Math.random() * 35);
  const r = Math.round(Math.random() * 30);
  document.getElementById('temp-val').innerHTML = t + '<span class="metric-unit">°C</span>';
  document.getElementById('soil-val').innerHTML = s + '<span class="metric-unit">%</span>';
  document.getElementById('rain-val').innerHTML = r + '<span class="metric-unit">mm</span>';
  const ts = document.getElementById('temp-status');
  ts.textContent = t > 33 ? 'High — check crops' : 'Normal range';
  ts.className = 'status-badge ' + (t > 33 ? 'status-alert' : 'status-ok');
  const ss = document.getElementById('soil-status');
  ss.textContent = s < 50 ? 'Low — irrigate soon' : 'Adequate';
  ss.className = 'status-badge ' + (s < 50 ? 'status-warn' : 'status-ok');
  const rs = document.getElementById('rain-status');
  rs.textContent = r > 20 ? 'Heavy rain' : r > 10 ? 'Above avg' : 'Normal';
  rs.className = 'status-badge ' + (r > 20 ? 'status-alert' : r > 10 ? 'status-warn' : 'status-ok');
}

// ── Cloudflare Mistral API ──
function getCFKey() { return document.getElementById('cf-key') ? document.getElementById('cf-key').value.trim() : ''; }
function getAPIKey() {
  return document.getElementById('cf-key')?.value.trim();
}
function saveKey() {
  const key = getAPIKey();
  if (key) {
    document.getElementById('conn-indicator').textContent = 'Connected';
    document.getElementById('conn-indicator').className = 'conn-status conn-ok';
    alert('API key saved! Click any "AI Insight" button to load insights.');
  } else {
    alert('Please enter a valid API key.');
  }
}
async function callMistral(prompt, targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;

  el.innerHTML = '<span class="ai-loading">Asking Mistral AI...</span>';

  const key = getAPIKey(); // reuse same input field

  if (!key) {
    el.textContent = 'Please add your Mistral API key in Settings.';
    return;
  }

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small", // or mistral-medium / mistral-large
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await res.json();

    const text =
      data.choices?.[0]?.message?.content ||
      "No response from Mistral.";

    el.textContent = text;

  } catch (err) {
    console.error(err);
    el.textContent = "Error calling Mistral API.";
  }
}

function getReadings() {
  const t = document.getElementById('temp-val').textContent.replace(/[^\d.]/g,'');
  const s = document.getElementById('soil-val').textContent.replace(/[^\d.]/g,'');
  const r = document.getElementById('rain-val').textContent.replace(/[^\d.]/g,'');
  return { temp: t, soil: s, rain: r };
}

function askMistral() {
  const rd = getReadings();
  callMistral(`You are an expert agricultural AI assistant. Current farm sensor readings: Temperature ${rd.temp}°C, Soil moisture ${rd.soil}%, Rainfall last 24h ${rd.rain}mm. Give a concise 2-3 sentence insight about current farm conditions and any immediate action recommendations for a mixed farm in India.`, 'ai-insight');
}

function askIrrigation() {
  const rd = getReadings();
  callMistral(`You are an agricultural AI. Current sensor data: Temp ${rd.temp}°C, Soil moisture ${rd.soil}%, Rainfall ${rd.rain}mm/24h. Four irrigation zones: Zone 1 (tomatoes, 62% moisture), Zone 2 (wheat, 38% moisture - running), Zone 3 (maize, 71% moisture), Zone 4 (soybeans, 55% moisture). Give brief, actionable irrigation recommendations for each zone.`, 'irr-insight');
  showSection('irrigation', document.querySelector('.nav-item:nth-child(5)') || document.querySelectorAll('.nav-item')[3]);
}

function askCropAdvice() {
  const rd = getReadings();
  callMistral(`You are an agricultural expert. Current conditions: Temp ${rd.temp}°C, Soil moisture ${rd.soil}%, Rainfall ${rd.rain}mm/24h. Crops on farm: Tomatoes (growing, day 34/75), Wheat (sowing, day 5/120), Maize (harvesting, day 80/85), Soybeans (growing, day 21/95), Sunflower (growing, day 15/100). Give 3-4 brief crop management tips relevant to current weather conditions and crop stages, for a farm in India.`, 'crop-insight');
}

function autoIrrigate() {
  document.querySelectorAll('.irrigate-btn').forEach(b => { b.classList.add('active'); b.textContent = 'Running ●'; });
  setTimeout(() => {
    document.querySelectorAll('.irrigate-btn').forEach(b => { b.classList.remove('active'); b.textContent = 'Irrigate now'; });
  }, 4000);
}

function toggleIrr(btn) {
  btn.classList.toggle('active');
  btn.textContent = btn.classList.contains('active') ? 'Running ●' : 'Irrigate now';
}

function selectCrop(card) {
  document.querySelectorAll('.crop-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
}

function addCrop() {
  const name = prompt('Enter crop name:');
  if (name) alert('Crop "' + name + '" added! (Connect your backend to persist this.)');
}
function askCustom() {
  const input = document.getElementById("ai-question");
  const question = input.value.trim();

  if (!question) return;

  const rd = getReadings();
  const responseBox = document.getElementById("ai-response");

  responseBox.innerHTML = "<span class='ai-loading'>Thinking...</span>";

  const prompt = `
You are a smart farm assistant.
Current data:
- Temperature: ${rd.temp}°C
- Soil moisture: ${rd.soil}%
- Rainfall: ${rd.rain}mm

User question: ${question}

Give a short, practical farming answer.
`;

  callMistral(prompt, "ai-response");

  input.value = "";
}
</script>
