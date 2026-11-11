
/* BUSROUTE — phiên bản tĩnh dành cho GitHub Pages.
   BFS, Dijkstra và lịch trình được chuyển sang JavaScript.
   Dữ liệu dựa trên dự án BUSROUTE Python. */

const STATIONS = [
  ["S01","Ben xe Trung tam"],["S02","Cho Ben Cat"],["S03","Nga tu My Phuoc"],
  ["S04","Khu cong nghiep My Phuoc 1"],["S05","Truong hoc Trung tam"],
  ["S06","Ben xe My Phuoc"],["S07","Khu dan cu Hoa Loi"],["S08","Nga tu Bau Bang"],
  ["S09","Cho My Phuoc"],["S10","Khu cong nghiep My Phuoc 2"],
  ["S11","Truong THPT Ben Cat"],["S12","Nga tu An Dien"],["S13","Khu dan cu An Tay"],
  ["S14","Ben xe Lai Uyen"],["S15","Cho Lai Uyen"],["S16","Nga tu Tan Dinh"],
  ["S17","Khu cong nghiep Bau Bang"],["S18","Ben xe Bau Bang"],
  ["S19","Khu dan cu Thoi Hoa"],["S20","Trung tam hanh chinh"],
  ["S21","Cho Thoi Hoa"],["S22","Ben xe Tan Uyen"],["S23","Nga tu Hoi Nghia"],
  ["S24","Khu dan cu Tan Binh"],["S25","Trung tam thuong mai"]
].map(([id,name]) => ({id,name}));

const ROUTES = [
  {id:"BUS01",name:"Tuyen Ben Cat - My Phuoc",stations:["S01","S02","S03","S04","S05"],travel_times:[6,8,7,5]},
  {id:"BUS02",name:"Tuyen My Phuoc - Bau Bang",stations:["S06","S07","S03","S08","S09"],travel_times:[5,7,6,8]},
  {id:"BUS03",name:"Tuyen An Dien",stations:["S10","S11","S08","S12","S13"],travel_times:[6,5,9,7]},
  {id:"BUS04",name:"Tuyen Lai Uyen",stations:["S14","S15","S12","S16","S17"],travel_times:[7,6,8,5]},
  {id:"BUS05",name:"Tuyen Thoi Hoa",stations:["S18","S19","S04","S20","S21"],travel_times:[8,6,7,5]},
  {id:"BUS06",name:"Tuyen Tan Binh",stations:["S22","S23","S16","S24","S25"],travel_times:[6,8,5,7]},
  {id:"BUS07",name:"Tuyen Ket Noi Trung Tam",stations:["S01","S07","S11","S15","S19"],travel_times:[9,7,8,6]},
  {id:"BUS08",name:"Tuyen Ket Noi Bau Bang",stations:["S05","S09","S13","S17","S25"],travel_times:[6,7,9,8]}
];

const STATION_COORDS = {
  S01:[11.1510,106.5940],S02:[11.1540,106.6020],S03:[11.1050,106.6080],
  S04:[11.0920,106.6150],S05:[11.1450,106.6000],S06:[11.0800,106.6210],
  S07:[11.0900,106.5900],S08:[11.2200,106.6900],S09:[11.0830,106.6280],
  S10:[11.0720,106.6420],S11:[11.1600,106.6000],S12:[11.1800,106.5800],
  S13:[11.1200,106.5500],S14:[11.2500,106.6800],S15:[11.2450,106.6740],
  S16:[11.2000,106.6500],S17:[11.2650,106.7050],S18:[11.2600,106.6900],
  S19:[11.0800,106.6500],S20:[11.1500,106.5900],S21:[11.0750,106.6580],
  S22:[11.0500,106.7500],S23:[11.0250,106.7700],S24:[11.0400,106.7300],
  S25:[11.1350,106.6150]
};

const DEPARTURE_HOURS = [
  "05:00","05:30","06:00","06:30",
  "07:00","07:30","08:00","08:30",
  "09:00","09:30","10:00","10:30"
];

const palette = [
  "#11a995","#4778d0","#e59a42","#8b6bd6",
  "#e36f86","#3b9bca","#7eaa45","#d17a36"
];

const $ = id => document.getElementById(id);
const stationById = Object.fromEntries(STATIONS.map(s => [s.id,s]));

let graph = {};
let map;
let stationMarkers = {};
let baseLines = [];
let activeLine = null;


// ========================================
// XÂY DỰNG GRAPH
// ========================================

function buildGraph() {
  graph = Object.fromEntries(STATIONS.map(s => [s.id, []]));

  ROUTES.forEach(route => {
    for (let i = 0; i < route.stations.length - 1; i++) {
      const a = route.stations[i];
      const b = route.stations[i + 1];
      const time = route.travel_times[i];

      graph[a].push({
        station: b,
        route: route.id,
        time
      });

      graph[b].push({
        station: a,
        route: route.id,
        time
      });
    }
  });
}


// ========================================
// THUẬT TOÁN BFS
// Tìm đường có ít chặng nhất
// ========================================

function bfs(start, end) {
  if (!graph[start] || !graph[end]) return null;

  const queue = [start];
  const visited = new Set([start]);
  const previous = {};

  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];

    if (current === end) break;

    for (const edge of graph[current]) {
      if (!visited.has(edge.station)) {
        visited.add(edge.station);

        previous[edge.station] = {
          station: current,
          route: edge.route,
          time: edge.time
        };

        queue.push(edge.station);
      }
    }
  }

  if (!visited.has(end)) return null;

  const stations = [];
  const routes = [];

  let total_time = 0;
  let current = end;

  while (current !== start) {
    stations.push(current);

    const p = previous[current];

    if (!p) return null;

    routes.push(p.route);
    total_time += p.time;

    current = p.station;
  }

  stations.push(start);

  stations.reverse();
  routes.reverse();

  return {
    stations,
    routes,
    total_time
  };
}


// ========================================
// THUẬT TOÁN DIJKSTRA
// Tìm đường có tổng thời gian thấp nhất
// ========================================

function dijkstra(start, end) {
  if (!graph[start] || !graph[end]) return null;

  const distances = Object.fromEntries(
    Object.keys(graph).map(id => [id, Infinity])
  );

  distances[start] = 0;

  const queue = [
    {station: start, time: 0}
  ];

  const previous = {};
  const visited = new Set();

  while (queue.length) {
    queue.sort((a, b) => a.time - b.time);

    const {
      station: current,
      time: currentTime
    } = queue.shift();

    if (visited.has(current)) continue;

    visited.add(current);

    if (current === end) break;

    for (const edge of graph[current]) {
      const nextTime = currentTime + edge.time;

      if (nextTime < distances[edge.station]) {
        distances[edge.station] = nextTime;

        previous[edge.station] = {
          station: current,
          route: edge.route
        };

        queue.push({
          station: edge.station,
          time: nextTime
        });
      }
    }
  }

  if (!Number.isFinite(distances[end])) return null;

  const stations = [];
  const routes = [];

  let current = end;

  while (current !== start) {
    stations.push(current);

    const p = previous[current];

    if (!p) return null;

    routes.push(p.route);
    current = p.station;
  }

  stations.push(start);

  stations.reverse();
  routes.reverse();

  return {
    stations,
    routes,
    total_time: distances[end]
  };
}


// ========================================
// XỬ LÝ LỊCH TRÌNH
// ========================================

function minutesToTime(value) {
  const h = Math.floor(value / 60) % 24;
  const m = value % 60;

  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function timeToMinutes(value) {
  const [h,m] = value.split(":").map(Number);
  return h * 60 + m;
}

function generateSchedules() {
  const result = {};

  ROUTES.forEach(route => {
    result[route.id] = [];

    DEPARTURE_HOURS.forEach((departure,index) => {
      ["Di","Ve"].forEach(direction => {
        const stations = direction === "Di"
          ? route.stations
          : [...route.stations].reverse();

        const travelTimes = direction === "Di"
          ? route.travel_times
          : [...route.travel_times].reverse();

        let current = timeToMinutes(departure);

        const stop_times = {};

        stations.forEach((sid,i) => {
          stop_times[sid] = minutesToTime(current);

          if (i < travelTimes.length) {
            current += travelTimes[i];
          }
        });

        result[route.id].push({
          trip_id: `${route.id}-T${String(index + 1).padStart(2,"0")}-${direction}`,
          direction,
          departure_time: departure,
          stations: [...stations],
          stop_times
        });
      });
    });
  });

  return result;
}

const schedules = generateSchedules();

function findArrivalTimes(stationId) {
  const results = [];

  Object.entries(schedules).forEach(([route,trips]) => {
    trips.forEach(trip => {
      if (Object.prototype.hasOwnProperty.call(
        trip.stop_times,
        stationId
      )) {
        results.push({
          route,
          trip: trip.trip_id,
          direction: trip.direction,
          arrival: trip.stop_times[stationId]
        });
      }
    });
  });

  return results.sort((a,b) =>
    a.arrival.localeCompare(b.arrival)
  );
}

function findTripsByTime(start,end,requestedTime) {
  if (!/^\d{2}:\d{2}$/.test(requestedTime)) return [];

  const requested = timeToMinutes(requestedTime);
  const results = [];

  Object.entries(schedules).forEach(([route,trips]) => {
    trips.forEach(trip => {
      const ids = trip.stations;

      if (!ids.includes(start) || !ids.includes(end)) return;

      const startIndex = ids.indexOf(start);
      const endIndex = ids.indexOf(end);

      if (startIndex >= endIndex) return;

      const departure = trip.stop_times[start];
      const arrival = trip.stop_times[end];

      if (timeToMinutes(departure) >= requested) {
        results.push({
          route,
          trip: trip.trip_id,
          direction: trip.direction,
          departure,
          arrival
        });
      }
    });
  });

  return results.sort((a,b) =>
    a.departure.localeCompare(b.departure)
  );
}


// ========================================
// BẢN ĐỒ LEAFLET
// ========================================

function initMap() {
  map = L.map("map", {
    zoomControl: true
  }).setView([11.155,106.635],11);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  ).addTo(map);
}

function markerIcon(active = false) {
  return L.divIcon({
    className: "",
    html: `<div class="station-marker ${active ? "active" : ""}"></div>`,
    iconSize: [13,13],
    iconAnchor: [6,6]
  });
}

function drawStations() {
  STATIONS.forEach(s => {
    const [lat,lon] = STATION_COORDS[s.id];

    stationMarkers[s.id] = L.marker(
      [lat,lon],
      {icon: markerIcon()}
    ).addTo(map).bindPopup(
      `<b>${s.id} · ${s.name}</b><br>Điểm dừng trong dữ liệu BUSROUTE`
    );
  });
}

function stationLatLngs(ids) {
  return ids
    .map(id => STATION_COORDS[id])
    .filter(Boolean);
}


// ========================================
// LẤY HÌNH DẠNG ĐƯỜNG TỪ OSRM
// ========================================

async function roadGeometry(ids) {
  const coords = ids
    .map(id => STATION_COORDS[id])
    .filter(Boolean)
    .map(([lat,lon]) => `${lon},${lat}`);

  if (coords.length < 2) return [];

  try {
    const url =
      "https://router.project-osrm.org/route/v1/driving/" +
      coords.join(";") +
      "?overview=full&geometries=geojson&steps=false";

    const response = await fetch(url);
    const data = await response.json();

    if (
      data.code === "Ok" &&
      data.routes &&
      data.routes.length
    ) {
      return data.routes[0].geometry.coordinates.map(
        c => [c[1],c[0]]
      );
    }

  } catch (error) {
    console.warn(
      "OSRM không phản hồi; dùng đường nối trạm minh họa.",
      error
    );
  }

  // Dự phòng nếu OSRM không hoạt động
  return stationLatLngs(ids);
}


// ========================================
// VẼ TOÀN BỘ MẠNG LƯỚI TUYẾN
// ĐÂY LÀ PHẦN ĐÃ SỬA
// ========================================

async function drawNetwork() {

  for (let i = 0; i < ROUTES.length; i++) {
    const route = ROUTES[i];

    // Lấy hình dạng đường thực tế theo từng tuyến
    const path = await roadGeometry(route.stations);

    const line = L.polyline(path, {
      color: palette[i % palette.length],
      weight: 3,
      opacity: 0.58
    }).addTo(map);

    line.bindTooltip(
      `${route.id} · ${route.name}`
    );

    baseLines.push(line);
  }
}


// ========================================
// ĐIỀN DỮ LIỆU VÀO CÁC SELECT
// ========================================

function fillSelects() {
  const opts = STATIONS.map(s =>
    `<option value="${s.id}">${s.id} — ${s.name}</option>`
  ).join("");

  $("start").innerHTML =
    '<option value="">Chọn trạm bắt đầu</option>' + opts;

  $("end").innerHTML =
    '<option value="">Chọn trạm kết thúc</option>' + opts;

  $("arrivalStation").innerHTML =
    '<option value="">Chọn trạm cần tra cứu</option>' + opts;

  $("tripStart").innerHTML =
    '<option value="">Chọn trạm đi</option>' + opts;

  $("tripEnd").innerHTML =
    '<option value="">Chọn trạm đến</option>' + opts;

  $("scheduleRoute").innerHTML =
    '<option value="">Chọn tuyến xe</option>' +
    ROUTES.map(r =>
      `<option value="${r.id}">${r.id} — ${r.name}</option>`
    ).join("");
}


// ========================================
// HIỂN THỊ DANH SÁCH TUYẾN
// ========================================

function renderRoutes() {
  $("routeCount").textContent = ROUTES.length;
  $("stationCount").textContent = STATIONS.length;
  $("routeCaption").textContent = ROUTES.length + " tuyến";

  $("routeList").innerHTML = ROUTES.map(r => `
    <article class="route-card">
      <b>${r.id}</b>
      <strong>${r.name}</strong>
      <small>
        ${r.stations.length} trạm ·
        ${r.travel_times.reduce((a,b) => a+b,0)} phút
        (tổng thời gian mô phỏng)
      </small>
    </article>
  `).join("");
}


// ========================================
// TÌM ĐƯỜNG VÀ HIỂN THỊ KẾT QUẢ
// ========================================

function clearActive() {
  if (activeLine) {
    map.removeLayer(activeLine);
    activeLine = null;
  }

  Object.values(stationMarkers).forEach(marker => {
    marker.setIcon(markerIcon(false));
  });
}

function emptyState(icon,title,description) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <b>${title}</b>
      <p>${description}</p>
    </div>
  `;
}

async function searchRoute() {
  $("searchError").textContent = "";

  const start = $("start").value;
  const end = $("end").value;

  const method = document.querySelector(
    'input[name="method"]:checked'
  ).value;

  if (!start || !end) {
    $("searchError").textContent =
      "Vui lòng chọn cả trạm đi và trạm đến.";
    return;
  }

  if (start === end) {
    $("searchError").textContent =
      "Trạm đi và trạm đến không được trùng nhau.";
    return;
  }

  const button = $("searchBtn");

  button.disabled = true;
  button.textContent = "Đang tìm đường...";

  try {
    const result = method === "bfs"
      ? bfs(start,end)
      : dijkstra(start,end);

    if (!result) {
      throw new Error("Không tìm thấy đường đi phù hợp.");
    }

    clearActive();

    result.stations.forEach(id => {
      stationMarkers[id]?.setIcon(markerIcon(true));
    });

    // Lấy đường thực tế cho hành trình tìm được
    const path = await roadGeometry(result.stations);

    activeLine = L.polyline(path, {
      color: "#ff8b35",
      weight: 7,
      opacity: 0.98
    }).addTo(map);

    activeLine.bringToFront();

    result.stations.forEach(id => {
      stationMarkers[id]?.bringToFront();
    });

    map.fitBounds(activeLine.getBounds().pad(0.22));

    const points = result.stations.map(
      id => stationById[id]
    );

    $("resultPanel").innerHTML = `
      <div class="result-head">
        <b>✓ Đã tìm thấy hành trình</b>
        <small>
          ${method === "bfs"
            ? "BFS · Ít chặng nhất"
            : "Dijkstra · Ít thời gian nhất"}
          · ${result.routes.join(" → ")}
        </small>
      </div>

      <div class="result-metrics">
        <div>
          <strong>${result.stations.length - 1}</strong>
          <small>Chặng di chuyển</small>
        </div>
        <div>
          <strong>${result.total_time} phút</strong>
          <small>Thời gian mô phỏng</small>
        </div>
        <div>
          <strong>${new Set(result.routes).size}</strong>
          <small>Tuyến sử dụng</small>
        </div>
      </div>

      <div class="path-list">
        ${points.map((s,i) => `
          <div class="path-stop">
            <i></i>
            <span>${s.id} — ${s.name}</span>
            <small>
              ${i === 0
                ? "Điểm đi"
                : i === points.length - 1
                  ? "Điểm đến"
                  : "Trạm trung chuyển"}
            </small>
          </div>
        `).join("")}
      </div>
    `;

  } catch (error) {
    $("searchError").textContent = error.message;

  } finally {
    button.disabled = false;
    button.innerHTML = 'Tìm đường đi <span>→</span>';
  }
}


// ========================================
// ĐIỀU HƯỚNG CÁC MỤC
// ========================================

function setTab(tab) {
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.tab === tab
    );
  });

  const schedule = tab === "schedule";

  $("mapView").hidden = schedule;
  $("scheduleView").hidden = !schedule;

  $("pageTitle").textContent =
    tab === "schedule"
      ? "Lịch trình xe buýt"
      : tab === "routes"
        ? "Danh sách tuyến xe"
        : "Tra cứu hành trình";

  if (tab !== "schedule") {
    setTimeout(() => map.invalidateSize(),100);
  }

  (
    tab === "schedule"
      ? $("scheduleView")
      : tab === "routes"
        ? $("routesView")
        : $("map")
  ).scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


// ========================================
// HIỂN THỊ BẢNG
// ========================================

function renderTable(headers,rows) {
  return `
    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}


// ========================================
// CHỨC NĂNG 1: GIỜ XE TẠI TRẠM
// ========================================

function showArrivals() {
  const id = $("arrivalStation").value;
  const output = $("arrivalResults");

  if (!id) {
    output.innerHTML =
      '<p class="schedule-error">Vui lòng chọn trạm cần tra cứu.</p>';
    return;
  }

  const results = findArrivalTimes(id);
  const station = stationById[id];

  if (!results.length) {
    output.innerHTML = emptyState(
      "◷",
      "Không tìm thấy chuyến xe",
      `Không có chuyến nào đi qua trạm ${id} trong dữ liệu hiện tại.`
    );
    return;
  }

  output.innerHTML = `
    <div class="schedule-result-heading">
      <b>${id} — ${station.name}</b>
      <small>${results.length} lượt xe trong dữ liệu mô phỏng</small>
    </div>
  ` + renderTable(
    ["Tuyến","Chuyến","Chiều","Giờ tại trạm"],
    results.map(a => `
      <tr>
        <td><b>${a.route}</b></td>
        <td>${a.trip}</td>
        <td>${a.direction}</td>
        <td><strong class="time-value">${a.arrival}</strong></td>
      </tr>
    `).join("")
  );
}


// ========================================
// CHỨC NĂNG 2: LỊCH TRÌNH TUYẾN XE
// ========================================

function showRouteSchedule() {
  const id = $("scheduleRoute").value;
  const direction = $("scheduleDirection").value;
  const output = $("scheduleResults");

  if (!id) {
    output.innerHTML =
      '<p class="schedule-error">Vui lòng chọn tuyến xe.</p>';
    return;
  }

  const trips = schedules[id].filter(
    t => t.direction === direction
  );

  if (!trips.length) {
    output.innerHTML = emptyState(
      "▤",
      "Không có lịch trình",
      "Không tìm thấy chuyến xe theo hướng đã chọn."
    );
    return;
  }

  output.innerHTML = `
    <div class="schedule-result-heading">
      <b>${id} · ${direction === "Di" ? "Chiều đi" : "Chiều về"}</b>
      <small>${trips.length} chuyến xe</small>
    </div>

    <div class="trip-list">
      ${trips.map(t => `
        <details class="trip-item">
          <summary>
            <span>
              <b>${t.trip_id}</b>
              <small>
                ${direction === "Di" ? "Chiều đi" : "Chiều về"}
              </small>
            </span>
            <strong class="time-value">${t.departure_time}</strong>
          </summary>

          <div class="trip-stops">
            ${t.stations.map(sid => `
              <div class="trip-stop">
                <i></i>
                <span>${sid} — ${stationById[sid].name}</span>
                <strong>${t.stop_times[sid]}</strong>
              </div>
            `).join("")}
          </div>
        </details>
      `).join("")}
    </div>
  `;
}


// ========================================
// CHỨC NĂNG 3: TÌM CHUYẾN THEO GIỜ
// ========================================

function findTrips() {
  const start = $("tripStart").value;
  const end = $("tripEnd").value;
  const time = $("tripTime").value;
  const output = $("tripResults");

  if (!start || !end || !time) {
    output.innerHTML =
      '<p class="schedule-error">Vui lòng chọn đầy đủ trạm đi, trạm đến và giờ khởi hành.</p>';
    return;
  }

  if (start === end) {
    output.innerHTML =
      '<p class="schedule-error">Trạm đi và trạm đến không được trùng nhau.</p>';
    return;
  }

  const results = findTripsByTime(start,end,time);

  if (!results.length) {
    output.innerHTML = emptyState(
      "◷",
      "Không tìm thấy chuyến phù hợp",
      "Thử chọn giờ sớm hơn hoặc kiểm tra lại hai trạm. Chức năng này chỉ tìm chuyến trực tiếp trên cùng một tuyến."
    );
    return;
  }

  output.innerHTML = `
    <div class="schedule-result-heading">
      <b>Kết quả tìm chuyến</b>
      <small>${results.length} chuyến phù hợp từ ${start} đến ${end}</small>
    </div>
  ` + renderTable(
    ["Tuyến","Chuyến","Chiều","Giờ đi","Giờ đến"],
    results.map(t => `
      <tr>
        <td><b>${t.route}</b></td>
        <td>${t.trip}</td>
        <td>${t.direction}</td>
        <td><strong class="time-value">${t.departure}</strong></td>
        <td><strong class="time-value">${t.arrival}</strong></td>
      </tr>
    `).join("")
  );
}


// ========================================
// GẮN SỰ KIỆN
// ========================================

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click",() => {
    setTab(button.dataset.tab);
  });
});

$("searchBtn").addEventListener("click",searchRoute);

$("swap").addEventListener("click",() => {
  const a = $("start").value;
  $("start").value = $("end").value;
  $("end").value = a;
});

$("resetMap").addEventListener("click",() => {
  map.fitBounds(
    L.latLngBounds(
      STATIONS.map(s => STATION_COORDS[s.id])
    ).pad(0.12)
  );
});

$("arrivalBtn").addEventListener("click",showArrivals);
$("scheduleBtn").addEventListener("click",showRouteSchedule);
$("tripBtn").addEventListener("click",findTrips);


// ========================================
// KHỞI ĐỘNG WEBSITE
// ========================================

async function boot() {
  buildGraph();

  initMap();

  fillSelects();

  renderRoutes();

  drawStations();

  // Vẽ từng tuyến theo mạng lưới đường OSRM
  await drawNetwork();

  $("resetMap").click();
}

boot();
