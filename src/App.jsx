import { useState, useEffect, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const HOSTEL_NAME = "Хостел 124";

const ROOMS = [
  { id: "101", type: "Общий", beds: 6 }, { id: "102", type: "Общий", beds: 4 },
  { id: "103", type: "Двухместный", beds: 2 }, { id: "104", type: "Одноместный", beds: 1 },
  { id: "201", type: "Общий", beds: 8 }, { id: "202", type: "Двухместный", beds: 2 },
  { id: "203", type: "Общий", beds: 6 }, { id: "204", type: "Одноместный", beds: 1 },
  { id: "301", type: "Двухместный", beds: 2 }, { id: "302", type: "Общий", beds: 4 },
];

const SOURCES = ["Booking.com", "Airbnb", "Hostelworld", "Звонок", "Walk-in", "Другое"];

const PAYMENT_METHODS = ["Наличные", "Каспи", "Перевод", "Booking (предоплата)"];

const INITIAL_GUESTS = [
  { id: 1, name: "Алматов Данияр", phone: "+7 777 123 45 67", iin: "", nationality: "KZ", room: "101", bed: 2, checkIn: "2026-06-28", checkOut: "2026-07-05", status: "active", pricePerNight: 3500, paid: true, paymentMethod: "Каспи", source: "Booking.com", notes: "", luggage: false },
  { id: 2, name: "Иванова Мария", phone: "+7 701 987 65 43", iin: "", nationality: "RU", room: "103", bed: 1, checkIn: "2026-06-29", checkOut: "2026-07-03", status: "active", pricePerNight: 8000, paid: false, paymentMethod: "Наличные", source: "Airbnb", notes: "Аллергия на пыль", luggage: true },
  { id: 3, name: "Bekzod Toshmatov", phone: "+998 90 111 22 33", iin: "", nationality: "UZ", room: "102", bed: 3, checkIn: "2026-07-05", checkOut: "2026-07-10", status: "reserved", pricePerNight: 4000, paid: false, paymentMethod: "Наличные", source: "Hostelworld", notes: "", luggage: false },
  { id: 4, name: "Сейткалиев Арман", phone: "+7 747 555 11 22", iin: "", nationality: "KZ", room: "201", bed: 1, checkIn: "2026-06-30", checkOut: "2026-07-08", status: "active", pricePerNight: 3500, paid: true, paymentMethod: "Перевод", source: "Walk-in", notes: "", luggage: false },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];

const fmt = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

const nights = (a, b) => {
  if (!a || !b) return 0;
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
};

const totalAmt = (g) => g.pricePerNight * nights(g.checkIn, g.checkOut);

const initials = (name) =>
  name.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase();

const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444","#06b6d4","#f97316"];
const avatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const STATUS_CFG = {
  active:      { label: "Проживает", color: "#22c55e", bg: "rgba(34,197,94,0.12)",  dot: "#22c55e" },
  reserved:    { label: "Бронь",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)", dot: "#f59e0b" },
  checked_out: { label: "Выехал",    color: "#64748b", bg: "rgba(100,116,139,0.12)",dot: "#64748b" },
};

const EMPTY_FORM = () => ({
  name: "", phone: "", iin: "", nationality: "KZ",
  room: ROOMS[0].id, bed: 1,
  checkIn: today(), checkOut: "",
  status: "reserved", pricePerNight: "",
  paid: false, paymentMethod: "Наличные",
  source: "Walk-in", notes: "", luggage: false,
});

// ─── STORAGE ───────────────────────────────────────────────────────────────
const STORE_KEY = "hostel124_guests_v1";
const load = () => {
  try {
    const s = localStorage.getItem(STORE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};
const save = (data) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch {}
};

// ─── COMPONENTS ────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.checked_out;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const Avatar = ({ name, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: avatarColor(name || "?"),
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0,
    letterSpacing: "-0.5px",
  }}>
    {initials(name || "?")}
  </div>
);

const Stat = ({ icon, value, label, accent }) => (
  <div style={{
    background: "#141b2d", border: "1px solid #1e2d45", borderRadius: 14,
    padding: "18px 20px", display: "flex", alignItems: "center", gap: 14,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: accent + "22", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 22, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#4a6080", marginTop: 4 }}>{label}</div>
    </div>
  </div>
);

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function HostelManager() {
  const [guests, setGuests] = useState(() => load() || INITIAL_GUESTS);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [confirmCheckout, setConfirmCheckout] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM());
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => { save(guests); }, [guests]);

  const showToast = (msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const nextId = guests.length ? Math.max(...guests.map(g => g.id)) + 1 : 1;

  const filtered = guests.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q) || g.phone.includes(q) || g.room.includes(q) || (g.iin || "").includes(q);
    const matchStatus = filterStatus === "all" || g.status === filterStatus;
    const matchRoom = filterRoom === "all" || g.room === filterRoom;
    return matchSearch && matchStatus && matchRoom;
  });

  const activeGuests   = guests.filter(g => g.status === "active");
  const reservedGuests = guests.filter(g => g.status === "reserved");
  const todayOut       = guests.filter(g => g.checkOut === today() && g.status === "active");
  const todayIn        = guests.filter(g => g.checkIn === today() && g.status === "reserved");
  const unpaid         = guests.filter(g => !g.paid && g.status !== "checked_out");
  const totalBeds      = ROOMS.reduce((s, r) => s + r.beds, 0);
  const occupiedBeds   = activeGuests.length;
  const occupancy      = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const revenue        = guests.filter(g => g.paid).reduce((s, g) => s + totalAmt(g), 0);

  const roomOcc = ROOMS.map(r => ({
    ...r,
    guests: activeGuests.filter(g => g.room === r.id),
    reserved: reservedGuests.filter(g => g.room === r.id),
  }));

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  function openAdd() {
    setEditGuest(null);
    setForm(EMPTY_FORM());
    setShowModal(true);
  }

  function openEdit(g) {
    setEditGuest(g);
    setForm({ ...g });
    setShowModal(true);
  }

  function saveGuest() {
    if (!form.name.trim() || !form.checkIn || !form.checkOut || !form.pricePerNight) {
      showToast("Заполните обязательные поля", "error");
      return;
    }
    if (editGuest) {
      setGuests(gs => gs.map(g => g.id === editGuest.id
        ? { ...form, id: editGuest.id, pricePerNight: Number(form.pricePerNight) }
        : g));
      showToast("Данные гостя обновлены");
    } else {
      setGuests(gs => [...gs, { ...form, id: nextId, pricePerNight: Number(form.pricePerNight) }]);
      showToast("Гость добавлен");
    }
    setShowModal(false);
  }

  function checkoutGuest(id) {
    setGuests(gs => gs.map(g => g.id === id ? { ...g, status: "checked_out", checkOut: today() } : g));
    setConfirmCheckout(null);
    showToast("Гость выселен");
  }

  function checkinGuest(id) {
    setGuests(gs => gs.map(g => g.id === id ? { ...g, status: "active" } : g));
    showToast("Гость заселён ✓");
  }

  function deleteGuest(id) {
    setGuests(gs => gs.filter(g => g.id !== id));
    showToast("Запись удалена", "error");
  }

  function togglePaid(id) {
    const g = guests.find(x => x.id === id);
    setGuests(gs => gs.map(x => x.id === id ? { ...x, paid: !x.paid } : x));
    showToast(g?.paid ? "Отмечено как неоплачено" : "Отмечено как оплачено");
  }

  const NAV = [
    { id: "dashboard", icon: "⊞", label: "Дашборд" },
    { id: "guests",    icon: "👤", label: "Гости" },
    { id: "rooms",     icon: "🚪", label: "Номера" },
    { id: "finance",   icon: "₸",  label: "Финансы" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a1628", color: "#e2eaf5", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 220, background: "#081020", borderRight: "1px solid #1a2840", display: "flex", flexDirection: "column", padding: "24px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, paddingLeft: 6 }}>
          <span style={{ fontSize: 26 }}>🏨</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#e2eaf5", letterSpacing: "-0.3px" }}>{HOSTEL_NAME}</div>
            <div style={{ fontSize: 10, color: "#3a5878", marginTop: 1 }}>Управление</div>
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 500, textAlign: "left",
              background: tab === n.id ? "#152035" : "transparent",
              color: tab === n.id ? "#60a5fa" : "#4a6080",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        {/* Occupancy */}
        <div style={{ marginTop: "auto", background: "#0e1e32", borderRadius: 10, padding: 14, border: "1px solid #1a2840" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#4a6080", marginBottom: 8 }}>
            <span>Загрузка</span>
            <span style={{ color: occupancy > 80 ? "#ef4444" : occupancy > 50 ? "#f59e0b" : "#22c55e", fontWeight: 700 }}>{occupancy}%</span>
          </div>
          <div style={{ height: 5, background: "#1a2840", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${occupancy}%`, background: occupancy > 80 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : "linear-gradient(90deg,#3b82f6,#22c55e)", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 10, color: "#3a5878", marginTop: 6 }}>{occupiedBeds} из {totalBeds} мест</div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <header style={{ padding: "20px 28px", borderBottom: "1px solid #1a2840", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#081020" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>
              {{ dashboard: "Дашборд", guests: "Журнал гостей", rooms: "Номера", finance: "Финансы" }[tab]}
            </div>
            <div style={{ fontSize: 12, color: "#3a5878", marginTop: 2 }}>{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</div>
          </div>
          <button onClick={openAdd} style={{
            background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff",
            border: "none", padding: "9px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>+</span> Новый гость
          </button>
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>

          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                <Stat icon="🛏️" value={occupiedBeds} label="Гостей сейчас" accent="#3b82f6" />
                <Stat icon="📋" value={reservedGuests.length} label="Броней" accent="#f59e0b" />
                <Stat icon="📤" value={todayOut.length} label="Выезжают сегодня" accent="#ef4444" />
                <Stat icon="💰" value={revenue.toLocaleString() + " ₸"} label="Оплачено всего" accent="#22c55e" />
              </div>

              {/* Today's actions */}
              {(todayOut.length > 0 || todayIn.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: todayOut.length && todayIn.length ? "1fr 1fr" : "1fr", gap: 14, marginBottom: 20 }}>
                  {todayOut.length > 0 && (
                    <div style={{ background: "#141b2d", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: 18 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#ef4444", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>📤</span> Выезжают сегодня
                      </div>
                      {todayOut.map(g => (
                        <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a2840" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={g.name} size={30} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
                              <div style={{ fontSize: 11, color: "#4a6080" }}>Ном. {g.room} · Место {g.bed}</div>
                            </div>
                          </div>
                          <button onClick={() => setConfirmCheckout(g)} style={S.btnRed}>Выселить</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {todayIn.length > 0 && (
                    <div style={{ background: "#141b2d", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: 18 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#22c55e", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>📥</span> Заезжают сегодня
                      </div>
                      {todayIn.map(g => (
                        <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a2840" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={g.name} size={30} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
                              <div style={{ fontSize: 11, color: "#4a6080" }}>Ном. {g.room} · {g.source}</div>
                            </div>
                          </div>
                          <button onClick={() => checkinGuest(g.id)} style={S.btnGreen}>Заселить</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Unpaid */}
              {unpaid.length > 0 && (
                <div style={{ background: "#141b2d", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: 18, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#f59e0b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>⚠️</span> Не оплатили ({unpaid.length})
                  </div>
                  {unpaid.map(g => (
                    <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a2840", fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{g.name}</span>
                        <span style={{ color: "#4a6080", marginLeft: 8 }}>Ном. {g.room}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>{totalAmt(g).toLocaleString()} ₸</span>
                        <button onClick={() => togglePaid(g.id)} style={S.btnAmber}>Оплачено</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Active guests */}
              <div style={{ background: "#141b2d", border: "1px solid #1a2840", borderRadius: 12, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
                  <span>Текущие гости</span>
                  <span style={{ color: "#4a6080", fontSize: 12 }}>{activeGuests.length} чел.</span>
                </div>
                {activeGuests.length === 0 && <div style={{ color: "#4a6080", fontSize: 13, textAlign: "center", padding: 20 }}>Нет активных гостей</div>}
                {activeGuests.slice(0, 6).map(g => (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #0e1e32" }}>
                    <Avatar name={g.name} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: "#4a6080", marginTop: 1 }}>Ном. {g.room} · Место {g.bed} · до {fmt(g.checkOut)}</div>
                    </div>
                    <Badge status={g.status} />
                    <div style={{ fontSize: 12, color: g.paid ? "#22c55e" : "#ef4444", fontWeight: 600, minWidth: 60, textAlign: "right" }}>
                      {g.paid ? "✓ Оплачено" : `${totalAmt(g).toLocaleString()} ₸`}
                    </div>
                  </div>
                ))}
                {activeGuests.length > 6 && (
                  <button onClick={() => setTab("guests")} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, cursor: "pointer", marginTop: 8 }}>
                    Показать всех ({activeGuests.length}) →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── GUESTS ── */}
          {tab === "guests" && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск: имя, телефон, номер..."
                  style={{ flex: 1, ...S.input }}
                />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={S.select}>
                  <option value="all">Все статусы</option>
                  <option value="active">Проживает</option>
                  <option value="reserved">Бронь</option>
                  <option value="checked_out">Выехал</option>
                </select>
                <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} style={S.select}>
                  <option value="all">Все номера</option>
                  {ROOMS.map(r => <option key={r.id} value={r.id}>Ном. {r.id}</option>)}
                </select>
              </div>
              <div style={{ background: "#141b2d", border: "1px solid #1a2840", borderRadius: 12, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0a1628" }}>
                      {["Гость", "Номер", "Заезд", "Выезд", "Ночей", "Сумма", "Источник", "Статус", "Оплата", ""].map(h => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, color: "#3a5878", fontWeight: 700, borderBottom: "1px solid #1a2840", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#3a5878", fontSize: 13 }}>Ничего не найдено</td></tr>
                    )}
                    {filtered.map(g => (
                      <tr key={g.id} style={{ borderBottom: "1px solid #0e1e32" }}>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={g.name} size={32} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{g.name}</div>
                              <div style={{ fontSize: 11, color: "#4a6080" }}>{g.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13 }}>
                          <span style={{ fontWeight: 700 }}>{g.room}</span>
                          <span style={{ color: "#4a6080", marginLeft: 4 }}>м.{g.bed}</span>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "#8aa8c8" }}>{fmt(g.checkIn)}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "#8aa8c8" }}>{fmt(g.checkOut)}</td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "#4a6080" }}>{nights(g.checkIn, g.checkOut)}</td>
                        <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600 }}>{totalAmt(g).toLocaleString()} ₸</td>
                        <td style={{ padding: "11px 14px", fontSize: 11, color: "#4a6080" }}>{g.source}</td>
                        <td style={{ padding: "11px 14px" }}><Badge status={g.status} /></td>
                        <td style={{ padding: "11px 14px" }}>
                          <button onClick={() => togglePaid(g.id)} style={{
                            border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                            background: g.paid ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                            color: g.paid ? "#22c55e" : "#ef4444",
                          }}>
                            {g.paid ? "✓ Оплачено" : "Не оплачено"}
                          </button>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => openEdit(g)} title="Редактировать" style={S.iconBtn}>✏️</button>
                            {g.status === "reserved" && (
                              <button onClick={() => checkinGuest(g.id)} title="Заселить" style={{ ...S.iconBtn, background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>📥</button>
                            )}
                            {g.status === "active" && (
                              <button onClick={() => setConfirmCheckout(g)} title="Выселить" style={{ ...S.iconBtn, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>📤</button>
                            )}
                            <button onClick={() => deleteGuest(g.id)} title="Удалить" style={S.iconBtn}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ROOMS ── */}
          {tab === "rooms" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
              {roomOcc.map(r => {
                const free = r.beds - r.guests.length - r.reserved.length;
                const pct = Math.round(((r.guests.length + r.reserved.length) / r.beds) * 100);
                return (
                  <div key={r.id} style={{ background: "#141b2d", border: "1px solid #1a2840", borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>№ {r.id}</div>
                        <div style={{ fontSize: 11, color: "#4a6080", marginTop: 2 }}>{r.type} · {r.beds} мест</div>
                      </div>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: free === 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                        color: free === 0 ? "#ef4444" : "#22c55e",
                      }}>
                        {free === 0 ? "Занято" : `${free} св.`}
                      </span>
                    </div>
                    {/* Beds visual */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {Array.from({ length: r.beds }, (_, i) => {
                        const bed = i + 1;
                        const active = r.guests.find(g => g.bed === bed);
                        const reserved = r.reserved.find(g => g.bed === bed);
                        return (
                          <div key={bed} title={active?.name || reserved?.name || `Место ${bed}`} style={{
                            width: 38, height: 38, borderRadius: 8, border: "1px solid",
                            borderColor: active ? "#3b82f6" : reserved ? "#f59e0b" : "#1a2840",
                            background: active ? "rgba(59,130,246,0.12)" : reserved ? "rgba(245,158,11,0.1)" : "#0a1628",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, cursor: active || reserved ? "help" : "default",
                          }}>
                            {active ? "🧍" : reserved ? "📋" : "🛏️"}
                          </div>
                        );
                      })}
                    </div>
                    {/* Occupancy bar */}
                    <div style={{ height: 4, background: "#1a2840", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#3b82f6,#8b5cf6)", borderRadius: 2, transition: "width 0.4s" }} />
                    </div>
                    {/* Guest list */}
                    {(r.guests.length > 0 || r.reserved.length > 0) && (
                      <div style={{ borderTop: "1px solid #1a2840", paddingTop: 10 }}>
                        {[...r.guests.map(g => ({ ...g, _st: "active" })), ...r.reserved.map(g => ({ ...g, _st: "reserved" }))].map(g => (
                          <div key={g.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#8aa8c8" }}>
                            <span>М.{g.bed} {g.name.split(" ")[0]}</span>
                            <span style={{ color: g._st === "active" ? "#3b82f6" : "#f59e0b" }}>до {fmt(g.checkOut)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FINANCE ── */}
          {tab === "finance" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                <Stat icon="✅" value={guests.filter(g => g.paid).reduce((s, g) => s + totalAmt(g), 0).toLocaleString() + " ₸"} label="Поступило" accent="#22c55e" />
                <Stat icon="⏳" value={unpaid.reduce((s, g) => s + totalAmt(g), 0).toLocaleString() + " ₸"} label="Ожидается" accent="#f59e0b" />
                <Stat icon="👥" value={guests.filter(g => g.status !== "reserved").length} label="Всего гостей" accent="#3b82f6" />
              </div>
              <div style={{ background: "#141b2d", border: "1px solid #1a2840", borderRadius: 12, overflow: "auto" }}>
                <div style={{ padding: "16px 18px", borderBottom: "1px solid #1a2840", fontWeight: 700, fontSize: 14 }}>Все транзакции</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0a1628" }}>
                      {["Гость", "Номер", "Заезд → Выезд", "Ночей", "Ставка", "Сумма", "Способ оплаты", "Статус"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#3a5878", fontWeight: 700, borderBottom: "1px solid #1a2840" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guests.filter(g => g.status !== "reserved").sort((a, b) => b.checkIn.localeCompare(a.checkIn)).map(g => (
                      <tr key={g.id} style={{ borderBottom: "1px solid #0e1e32" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={g.name} size={28} />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>{g.room}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#8aa8c8" }}>{fmt(g.checkIn)} → {fmt(g.checkOut)}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#4a6080" }}>{nights(g.checkIn, g.checkOut)}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>{g.pricePerNight.toLocaleString()} ₸</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>{totalAmt(g).toLocaleString()} ₸</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#4a6080" }}>{g.paymentMethod}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={() => togglePaid(g.id)} style={{
                            border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                            background: g.paid ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                            color: g.paid ? "#22c55e" : "#ef4444",
                          }}>
                            {g.paid ? "✓ Оплачено" : "Не оплачено"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: ADD / EDIT ── */}
      {showModal && (
        <div style={S.overlay} onClick={() => setShowModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
              {editGuest ? "Редактировать гостя" : "Новый гость"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.label}>ФИО *</label>
                <input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Фамилия Имя Отчество" />
              </div>
              <div>
                <label style={S.label}>Телефон</label>
                <input style={S.input} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="+7 777 ..." />
              </div>
              <div>
                <label style={S.label}>ИИН / Паспорт</label>
                <input style={S.input} value={form.iin} onChange={e => setF("iin", e.target.value)} placeholder="ИИН или № документа" />
              </div>
              <div>
                <label style={S.label}>Гражданство</label>
                <input style={S.input} value={form.nationality} onChange={e => setF("nationality", e.target.value)} placeholder="KZ, RU, UZ..." />
              </div>
              <div>
                <label style={S.label}>Источник</label>
                <select style={S.input} value={form.source} onChange={e => setF("source", e.target.value)}>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Номер</label>
                <select style={S.input} value={form.room} onChange={e => setF("room", e.target.value)}>
                  {ROOMS.map(r => <option key={r.id} value={r.id}>№{r.id} — {r.type} ({r.beds} мест)</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Место</label>
                <input style={S.input} type="number" min={1} max={20} value={form.bed} onChange={e => setF("bed", Number(e.target.value))} />
              </div>
              <div>
                <label style={S.label}>Заезд *</label>
                <input style={S.input} type="date" value={form.checkIn} onChange={e => setF("checkIn", e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Выезд *</label>
                <input style={S.input} type="date" value={form.checkOut} onChange={e => setF("checkOut", e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Цена за ночь (₸) *</label>
                <input style={S.input} type="number" value={form.pricePerNight} onChange={e => setF("pricePerNight", e.target.value)} placeholder="3500" />
              </div>
              <div>
                <label style={S.label}>Способ оплаты</label>
                <select style={S.input} value={form.paymentMethod} onChange={e => setF("paymentMethod", e.target.value)}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Статус</label>
                <select style={S.input} value={form.status} onChange={e => setF("status", e.target.value)}>
                  <option value="reserved">Бронь</option>
                  <option value="active">Проживает</option>
                  <option value="checked_out">Выехал</option>
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.label}>Заметки</label>
                <textarea style={{ ...S.input, height: 60, resize: "vertical" }} value={form.notes} onChange={e => setF("notes", e.target.value)} placeholder="Особые пожелания, аллергии..." />
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, color: "#8aa8c8" }}>
                <input type="checkbox" checked={form.paid} onChange={e => setF("paid", e.target.checked)} />
                Оплачено
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, color: "#8aa8c8" }}>
                <input type="checkbox" checked={form.luggage} onChange={e => setF("luggage", e.target.checked)} />
                Багаж оставлен
              </label>
            </div>
            {form.checkIn && form.checkOut && form.pricePerNight && (
              <div style={{ background: "#0a1628", border: "1px solid #2563eb", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#3b82f6", fontWeight: 600, marginBottom: 16 }}>
                Итого: {(Number(form.pricePerNight) * nights(form.checkIn, form.checkOut)).toLocaleString()} ₸
                &nbsp;({nights(form.checkIn, form.checkOut)} ноч. × {Number(form.pricePerNight).toLocaleString()} ₸)
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={S.btnCancel}>Отмена</button>
              <button onClick={saveGuest} style={S.btnPrimary}>{editGuest ? "Сохранить" : "Добавить"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM CHECKOUT ── */}
      {confirmCheckout && (
        <div style={S.overlay} onClick={() => setConfirmCheckout(null)}>
          <div style={{ ...S.modal, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Выселить гостя?</div>
            <p style={{ color: "#8aa8c8", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              <strong style={{ color: "#e2eaf5" }}>{confirmCheckout.name}</strong><br />
              Номер {confirmCheckout.room}, место {confirmCheckout.bed}<br />
              Дата выезда: <strong>{fmt(today())}</strong>
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmCheckout(null)} style={S.btnCancel}>Отмена</button>
              <button onClick={() => checkoutGuest(confirmCheckout.id)} style={{ ...S.btnPrimary, background: "#ef4444" }}>Выселить</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 2000,
          background: toast.type === "error" ? "#ef4444" : "#22c55e",
          color: "#fff", padding: "11px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)", animation: "fadeIn 0.2s",
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ─── SHARED STYLES ─────────────────────────────────────────────────────────
const S = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 },
  modal: { background: "#141b2d", border: "1px solid #1a2840", borderRadius: 16, padding: 26, width: "100%", maxWidth: 580, maxHeight: "92vh", overflowY: "auto" },
  label: { display: "block", fontSize: 11, color: "#4a6080", fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", background: "#0a1628", border: "1px solid #1a2840", color: "#e2eaf5", padding: "9px 12px", borderRadius: 8, fontSize: 13.5, outline: "none" },
  select: { background: "#141b2d", border: "1px solid #1a2840", color: "#e2eaf5", padding: "9px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" },
  btnPrimary: { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  btnCancel: { background: "transparent", border: "1px solid #1a2840", color: "#4a6080", padding: "10px 18px", borderRadius: 8, fontSize: 13.5, cursor: "pointer" },
  btnRed: { background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnGreen: { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnAmber: { background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  iconBtn: { background: "transparent", border: "1px solid #1a2840", color: "#4a6080", padding: "5px 7px", borderRadius: 6, cursor: "pointer", fontSize: 13 },
};
