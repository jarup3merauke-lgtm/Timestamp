(() => {
  const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  const el = {
    photoInput: document.getElementById("photoInput"),
    dropzone: document.getElementById("dropzone"),
    dropzoneText: document.getElementById("dropzoneText"),
    dd: document.getElementById("dd"),
    mm: document.getElementById("mm"),
    yyyy: document.getElementById("yyyy"),
    hh: document.getElementById("hh"),
    mi: document.getElementById("mi"),
    ss: document.getElementById("ss"),
    btnNow: document.getElementById("btnNow"),
    lat: document.getElementById("lat"),
    lon: document.getElementById("lon"),
    btnGeoloc: document.getElementById("btnGeoloc"),
    mapSearch: document.getElementById("mapSearch"),
    btnSearch: document.getElementById("btnSearch"),
    address: document.getElementById("address"),
    scaleSlider: document.getElementById("scaleSlider"),
    scaleValue: document.getElementById("scaleValue"),
    btnDownload: document.getElementById("btnDownload"),
    canvas: document.getElementById("canvas"),
    canvasPlaceholder: document.getElementById("canvasPlaceholder"),
  };

  const ctx = el.canvas.getContext("2d");
  const img = new Image();
  let hasImage = false;
  let sourceFileName = "foto";

  // ---------- date/time defaults ----------
  function setNow() {
    const now = new Date();
    el.dd.value = now.getDate();
    el.mm.value = now.getMonth() + 1;
    el.yyyy.value = now.getFullYear();
    el.hh.value = now.getHours();
    el.mi.value = now.getMinutes();
    el.ss.value = now.getSeconds();
  }
  setNow();
  el.btnNow.addEventListener("click", () => { setNow(); redraw(); });

  // ---------- image loading ----------
  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    sourceFileName = file.name.replace(/\.[^.]+$/, "");
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        hasImage = true;
        el.canvas.width = img.naturalWidth;
        el.canvas.height = img.naturalHeight;
        el.canvas.style.display = "block";
        el.canvasPlaceholder.style.display = "none";
        el.btnDownload.disabled = false;
        el.dropzoneText.textContent = file.name;
        redraw();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  el.photoInput.addEventListener("change", (e) => loadFile(e.target.files[0]));
  el.dropzone.addEventListener("dragover", (e) => { e.preventDefault(); el.dropzone.classList.add("dragover"); });
  el.dropzone.addEventListener("dragleave", () => el.dropzone.classList.remove("dragover"));
  el.dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    el.dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });

  // ---------- formatting ----------
  function pad2(n) { return String(n).padStart(2, "0"); }

  function formatDateTimeLine() {
    const d = parseInt(el.dd.value, 10);
    const m = parseInt(el.mm.value, 10);
    const y = parseInt(el.yyyy.value, 10);
    const h = el.hh.value === "" ? null : parseInt(el.hh.value, 10);
    const mi = el.mi.value === "" ? null : parseInt(el.mi.value, 10);
    const s = el.ss.value === "" ? null : parseInt(el.ss.value, 10);
    if (!d || !m || !y) return "";
    const monthName = MONTHS_ID[Math.min(Math.max(m - 1, 0), 11)];
    let line = `${d} ${monthName} ${y}`;
    if (h !== null && mi !== null && s !== null && !Number.isNaN(h) && !Number.isNaN(mi) && !Number.isNaN(s)) {
      line += ` ${pad2(h)}.${pad2(mi)}.${pad2(s)}`;
    }
    return line;
  }

  function formatCoordLine() {
    if (el.lat.value === "" || el.lon.value === "") return "";
    const lat = parseFloat(el.lat.value);
    const lon = parseFloat(el.lon.value);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return "";
    const latHem = lat < 0 ? "S" : "N";
    const lonHem = lon < 0 ? "W" : "E";
    return `${Math.abs(lat).toFixed(6)}${latHem} ${Math.abs(lon).toFixed(6)}${lonHem}`;
  }

  function addressLines() {
    return el.address.value
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  // ---------- drawing ----------
  function redraw() {
    if (!hasImage) return;
    const w = el.canvas.width;
    const h = el.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const lines = [];
    const dt = formatDateTimeLine();
    const coord = formatCoordLine();
    if (dt) lines.push(dt);
    if (coord) lines.push(coord);
    lines.push(...addressLines());
    if (lines.length === 0) return;

    const scale = (parseInt(el.scaleSlider.value, 10) || 100) / 100;
    const padding = w * 0.03 * scale;
    const fontSize = Math.max(10, w * 0.022 * scale);
    const lineHeight = fontSize * 1.3;

    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = fontSize * 0.25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const x = w - padding;
    let y = h - padding - (lines.length - 1) * lineHeight;
    for (const line of lines) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  [el.dd, el.mm, el.yyyy, el.hh, el.mi, el.ss, el.lat, el.lon, el.address].forEach((input) => {
    input.addEventListener("input", redraw);
  });
  el.scaleSlider.addEventListener("input", () => {
    el.scaleValue.textContent = `${el.scaleSlider.value}%`;
    redraw();
  });

  // ---------- download ----------
  el.btnDownload.addEventListener("click", () => {
    if (!hasImage) return;
    el.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sourceFileName}_timestamp.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/jpeg", 0.95);
  });

  // ---------- map ----------
  const mapContainer = document.getElementById("map");

  function showMapError(message) {
    mapContainer.innerHTML = `<div class="map-error">${message}<br>Kamu tetap bisa isi Lintang/Bujur secara manual di atas.</div>`;
  }

  if (typeof L === "undefined") {
    // Leaflet library itself failed to load (e.g. file missing, blocked by browser extension).
    showMapError("Peta tidak dapat dimuat (library Leaflet gagal dimuat).");
    return;
  }

  let map;
  try {
    map = L.map("map", { zoomControl: true }).setView([-8.4969, 140.3981], 13);
    const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    let tileErrorCount = 0;
    let tileLoadedOnce = false;
    tileLayer.on("load", () => { tileLoadedOnce = true; });
    tileLayer.on("tileerror", () => {
      tileErrorCount++;
      if (tileErrorCount > 6 && !tileLoadedOnce) {
        const banner = document.createElement("div");
        banner.className = "map-warning";
        banner.textContent = "Gambar peta gagal dimuat. Periksa koneksi internet kamu — kamu tetap bisa isi koordinat manual.";
        mapContainer.parentElement.insertBefore(banner, mapContainer.nextSibling);
        tileLayer.off("tileerror");
      }
    });
  } catch (err) {
    showMapError("Peta gagal dimuat: " + err.message);
    return;
  }

  let marker = null;

  function setMarker(lat, lon, doReverseGeocode) {
    if (marker) {
      marker.setLatLng([lat, lon]);
    } else {
      marker = L.marker([lat, lon], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        applyLatLon(p.lat, p.lng, true);
      });
    }
    map.panTo([lat, lon]);
    if (doReverseGeocode) reverseGeocode(lat, lon);
  }

  function applyLatLon(lat, lon, doReverseGeocode) {
    el.lat.value = lat.toFixed(6);
    el.lon.value = lon.toFixed(6);
    setMarker(lat, lon, doReverseGeocode);
    redraw();
  }

  map.on("click", (e) => applyLatLon(e.latlng.lat, e.latlng.lng, true));

  el.lat.addEventListener("change", syncMapFromFields);
  el.lon.addEventListener("change", syncMapFromFields);
  function syncMapFromFields() {
    const lat = parseFloat(el.lat.value);
    const lon = parseFloat(el.lon.value);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) setMarker(lat, lon, false);
  }

  let geocodeDebounceTimer = null;
  let geocodeRequestId = 0;
  const geocodeStatusEl = document.getElementById("geocodeStatus");

  function setGeocodeStatus(text, cls) {
    geocodeStatusEl.textContent = text;
    geocodeStatusEl.className = `geocode-status${cls ? " " + cls : ""}`;
  }

  function reverseGeocode(lat, lon) {
    // Debounce: klik/drag beruntun tidak boleh membombardir Nominatim
    // (kebijakan mereka membatasi ke ~1 request/detik per IP; melebihi itu
    // membuat request berikutnya gagal tanpa pesan, dan alamat lama "macet").
    clearTimeout(geocodeDebounceTimer);
    const myRequestId = ++geocodeRequestId;
    setGeocodeStatus("Mencari alamat...", "loading");
    geocodeDebounceTimer = setTimeout(() => {
      fetchReverseGeocode(lat, lon, myRequestId, 0);
    }, 500);
  }

  async function fetchReverseGeocode(lat, lon, myRequestId, attempt) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "id" } }
      );
      if (myRequestId !== geocodeRequestId) return; // ada request lebih baru, buang hasil ini
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const a = data.address || {};
      const line1 = [a.road, a.village || a.suburb || a.neighbourhood].filter(Boolean).join(", ");
      const kec = a.suburb || a.city_district || a.district;
      const kab = a.county || a.city || a.regency;
      const prov = a.state;
      const postcode = a.postcode;
      const lines = [];
      if (line1) lines.push(line1);
      if (kec) lines.push(`Kecamatan ${kec.replace(/^Kecamatan\s+/i, "")}`);
      if (kab) lines.push(`Kabupaten ${kab.replace(/^Kabupaten\s+/i, "")}`);
      if (prov || postcode) lines.push([prov, postcode].filter(Boolean).join(" "));
      if (lines.length) {
        el.address.value = lines.join("\n");
        redraw();
        setGeocodeStatus("", "");
      } else {
        setGeocodeStatus("Alamat tidak ditemukan untuk titik ini. Isi manual ya.", "error");
      }
    } catch (err) {
      if (myRequestId !== geocodeRequestId) return;
      if (attempt < 1) {
        setTimeout(() => fetchReverseGeocode(lat, lon, myRequestId, attempt + 1), 800);
        return;
      }
      setGeocodeStatus("Gagal memuat alamat otomatis (koneksi/limit Nominatim). Alamat di bawah belum sesuai titik ini — isi manual atau klik ulang.", "error");
    }
  }

  el.btnGeoloc.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => applyLatLon(pos.coords.latitude, pos.coords.longitude, true),
      () => alert("Tidak dapat mengambil lokasi. Pastikan izin lokasi diaktifkan.")
    );
  });

  async function searchLocation() {
    const q = el.mapSearch.value.trim();
    if (!q) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { "Accept-Language": "id" } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        map.setView([lat, lon], 15);
        applyLatLon(lat, lon, true);
      } else {
        alert("Lokasi tidak ditemukan.");
      }
    } catch (err) {
      alert("Gagal mencari lokasi. Periksa koneksi internet.");
    }
  }
  el.btnSearch.addEventListener("click", searchLocation);
  el.mapSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); searchLocation(); }
  });

  setTimeout(() => map.invalidateSize(), 200);
})();
