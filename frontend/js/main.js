(async function () {
  const S = window.SITE, D = window.DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => n === 0 ? "Free" : `${S.currency} ${Number(n).toLocaleString()}`;
  const fmtDate = (d, o) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", o || { day: "numeric", month: "long", year: "numeric" });
  const TZ = S.timezone || "+03:00";
  const isUpcoming = e => new Date(`${e.date}T23:59:59${TZ}`) >= new Date();
  const parseTime = t => {   // "9:00 AM" / "6 PM" / "18:30" -> "HH:MM"
    const m = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(t || ""); if (!m) return "00:00";
    let h = +m[1]; const ap = (m[3] || "").toLowerCase();
    if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m[2] || "00"}`;
  };
  const startOf = e => new Date(`${e.date}T${parseTime(e.time)}:00${TZ}`);

  /* ---------- Header / footer ---------- */
  const pages = [["index.html", "Home"], ["about.html", "About"], ["sermons.html", "Sermons"], ["events.html", "Events"],
    ["ministries.html", "Ministries"], ["gallery.html", "Gallery"], ["news.html", "News"], ["contact.html", "Contact"]];
  const here = location.pathname.split("/").pop() || "index.html";

  $("#site-header").innerHTML = `
    <div class="container nav">
      <a class="brand" href="index.html"><span class="mark">✝</span>${esc(S.name)}</a>
      <button class="menu-btn" aria-label="Menu" aria-expanded="false">☰</button>
      <ul id="menu">
        ${pages.map(([h, t]) => `<li><a href="${h}" class="${h === here ? "active" : ""}">${t}</a></li>`).join("")}
        <li><a class="btn btn-outline btn-sm" href="tickets.html">Tickets</a></li>
        <li><a class="btn btn-primary btn-sm" href="give.html">Give</a></li>
      </ul>
    </div>`;
  const mb = $(".menu-btn"), menu = $("#menu");
  mb.onclick = () => { const o = menu.classList.toggle("open"); mb.setAttribute("aria-expanded", o); };

  const soc = Object.entries(S.social).filter(([, v]) => v).map(([k, v]) => `<li><a href="${esc(v)}" target="_blank" rel="noopener">${k[0].toUpperCase() + k.slice(1)}</a></li>`).join("");
  $("#site-footer").innerHTML = `
    <div class="container">
      <div class="grid g3">
        <div><h3>${esc(S.name)}</h3><p>${esc(S.tagline)}</p></div>
        <div><h3>Visit us</h3><ul>
          <li>${esc(S.address)}, ${esc(S.city)}</li>
          <li><a href="tel:${esc(S.phone.replace(/\s/g, ""))}">${esc(S.phone)}</a></li>
          <li><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li></ul></div>
        <div><h3>Follow</h3><ul>${soc}</ul></div>
      </div>
      <div class="copy"><span>© ${new Date().getFullYear()} ${esc(S.name)}. All rights reserved.</span>
      <span><a href="give.html">Give</a> · <a href="tickets.html">Tickets</a> · <a href="contact.html#prayer">Prayer requests</a></span></div>
    </div>`;

  document.title = `${document.body.dataset.title || ""}${document.body.dataset.title ? " | " : ""}${S.name}`;
  document.querySelectorAll("[data-site]").forEach(el => {
    el.textContent = el.dataset.site.split(".").reduce((o, k) => o?.[k], S) ?? "";
  });

  /* ---------- Backend (Django) ---------- */
  const base = S.apiBase || "";
  const PROVIDERS = { mpesa: "M-Pesa", sasapay: "SasaPay" };
  let API = null;
  if (S.useBackend) {
    try {
      const r = await fetch(base + "/api/content/");
      if (!r.ok) throw new Error("no api");
      API = await r.json();
      ["events", "sermons", "news", "ministries", "leaders", "gallery"].forEach(k => { if (Array.isArray(API[k])) D[k] = API[k]; });
    } catch { API = null; }   // opened as plain files, or server down: use js/data.js and manual payments
  }
  const BACKEND = !!API;
  async function api(path, body) {
    try {
      const r = await fetch(base + path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { ok: r.ok, data: await r.json().catch(() => ({})) };
    } catch { return { ok: false, data: { error: "Could not reach the server. Check your internet and try again." } }; }
  }
  const providerBox = (name = "provider") => !BACKEND ? "" : `<fieldset style="border:0;padding:0"><legend style="font-weight:600;font-size:.92rem;margin-bottom:6px">Pay with</legend>
    <div class="row" style="justify-content:flex-start;gap:10px">${API.providers.map((p, i) => `<label class="chip"><input type="radio" name="${name}" value="${esc(p)}" ${i ? "" : "checked"}> ${esc(PROVIDERS[p] || p)}</label>`).join("")}</div></fieldset>
    ${API.simulate ? `<p class="meta">Test mode: no real money is taken.</p>` : ""}`;
  const chosenProvider = root => (root.querySelector("input[name=provider]:checked") || {}).value || "";
  const spinner = `<span class="spin" aria-hidden="true"></span>`;

  /* Poll a booking/donation until it is paid, failed or we give up (~2.5 min). */
  function poll(path, onPaid, onFailed, onTimeout) {
    let n = 0;
    const tick = async () => {
      const { ok, data } = await api(path);
      if (ok && data.status === "paid") return onPaid(data);
      if (ok && data.status === "failed") return onFailed(data);
      if (++n > 50) return onTimeout(data);
      setTimeout(tick, 3000);
    };
    setTimeout(tick, 2500);
  }

  /* ---------- Reusable renderers ---------- */
  const eventCard = e => {
    const d = new Date(e.date + "T00:00:00");
    const book = e.tickets ? `<a class="btn btn-dark btn-sm" href="tickets.html?event=${esc(e.id)}">Book tickets</a>` : "";
    const link = `event.html?e=${encodeURIComponent(e.id)}`;
    return `<article class="card ${isUpcoming(e) ? "" : "past"}">
      ${e.poster ? `<a href="${link}"><img class="ev-poster" src="${esc(e.poster)}" alt="Poster: ${esc(e.title)}" loading="lazy"></a>` : ""}
      <div class="event"><div class="date-badge"><b>${d.getDate()}</b><small>${d.toLocaleString("en-GB", { month: "short" })}</small></div>
      <div class="stack"><div><h3><a href="${link}">${esc(e.title)}</a></h3><div class="meta">${esc([e.time, e.location].filter(Boolean).join(" · "))}</div></div>
      <p>${esc(e.description)}</p><div class="row" style="justify-content:flex-start;gap:8px"><a class="btn btn-outline btn-sm" href="${link}">Details</a>${e.tickets && isUpcoming(e) ? book : ""}</div></div></div></article>`;
  };
  const sermonCard = s => `<article class="card stack">
      ${s.youtube ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(s.youtube)}" title="${esc(s.title)}" loading="lazy" allowfullscreen></iframe></div>`
        : `<div class="video empty">${s.audio ? "Audio message" : "Video coming soon"}</div>`}
      <div><span class="tag">${esc(s.series)}</span><h3 style="margin-top:8px">${esc(s.title)}</h3>
      <div class="meta">${esc(s.speaker)} · ${fmtDate(s.date)}</div></div>
      <p>${esc(s.summary)}</p>${s.audio ? `<audio controls preload="none" src="${esc(s.audio)}"></audio>` : ""}</article>`;
  const newsCard = n => `<article class="card stack">${n.image ? `<img class="news-img" src="${esc(n.image)}" alt="" loading="lazy">` : ""}<div class="meta">${fmtDate(n.date)}</div><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></article>`;
  const servicesList = () => `<ul class="times pad0">${S.services.map(s => `<li><div><strong>${esc(s.name)}</strong></div><span>${esc(s.day)}, ${esc(s.time)}</span></li>`).join("")}</ul>`;
  const fill = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  const upcoming = D.events.filter(isUpcoming).sort((a, b) => a.date.localeCompare(b.date));
  const sermonsSorted = [...D.sermons].sort((a, b) => b.date.localeCompare(a.date));

  /* ---------- Countdown, programme, featured event ---------- */
  function mountCountdown(el, e) {
    if (!el) return;
    const target = startOf(e), pad = n => String(n).padStart(2, "0");
    el.setAttribute("role", "timer");
    el.innerHTML = ["Days", "Hours", "Minutes", "Seconds"].map(l => `<div class="cd-box"><b>00</b><span>${l}</span></div>`).join("");
    const nums = el.querySelectorAll("b");
    const tick = () => {
      const ms = target - new Date();
      if (ms <= 0) { el.innerHTML = `<p class="cd-done">It’s today! We can’t wait to worship with you.</p>`; clearInterval(t); return; }
      const s = Math.floor(ms / 1000);
      [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((v, i) => nums[i].textContent = pad(v));
      el.setAttribute("aria-label", `${Math.floor(s / 86400)} days to go until ${e.title}`);
    };
    const t = setInterval(tick, 1000); tick();
  }
  const programmeHTML = e => (e.programme && e.programme.length) ? `<ol class="prog">${e.programme.map(p => `<li><span><span class="pill">${esc(p.time)}</span></span>
      <div><strong>${esc(p.title)}</strong>${(p.notes || []).map(n => `<em>${esc(n)}</em>`).join("")}</div></li>`).join("")}</ol>` : "";
  const dateLine = e => `${fmtDate(e.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${e.time ? " · " + e.time : ""}`;
  const upcomingSorted = D.events.filter(isUpcoming).sort((a, b) => a.date.localeCompare(b.date));
  const featured = upcomingSorted.find(e => e.featured) || upcomingSorted[0];

  const hero = $("#hero");
  if (hero && featured) {
    const link = `event.html?e=${encodeURIComponent(featured.id)}`;
    hero.innerHTML = `<div class="container hero-grid"><div class="hero-event">
        <p class="eyebrow" style="color:var(--gold-light)">${esc(S.name)} presents</p>
        <h1>${esc(featured.title)}</h1>
        ${featured.tagline ? `<p class="script theme">${esc(featured.tagline)}</p>` : ""}
        <div class="when">${esc(dateLine(featured))}${featured.location ? ` · ${esc(featured.location)}` : ""}</div>
        <div class="countdown" id="hero-countdown"></div>
        <div class="actions"><a class="btn btn-primary" href="${link}">See the programme</a>
          ${featured.tickets ? `<a class="btn btn-ghost" href="tickets.html?event=${encodeURIComponent(featured.id)}">Book tickets</a>` : `<a class="btn btn-ghost" href="about.html">Plan your visit</a>`}</div>
        <p class="verse">${esc(S.tagline)}</p></div>
      ${featured.poster ? `<a href="${link}"><img class="poster" src="${esc(featured.poster)}" alt="Poster: ${esc(featured.title)}"></a>` : ""}</div>`;
    mountCountdown($("#hero-countdown"), featured);
  }

  /* Event detail page: event.html?e=<id> */
  const ed = $("#event-detail");
  if (ed) {
    const id = new URLSearchParams(location.search).get("e");
    const e = D.events.find(x => x.id === id) || featured;
    if (!e) { ed.innerHTML = `<p>Event not found. <a href="events.html">See all events</a>.</p>`; }
    else {
      document.title = `${e.title} | ${S.name}`;
      $("#event-title").textContent = e.title; $("#event-sub").textContent = e.tagline || "";
      const share = `https://wa.me/?text=${encodeURIComponent(`${e.title}: ${dateLine(e)}. ${location.href}`)}`;
      ed.innerHTML = `<div>${e.poster ? `<img class="poster" src="${esc(e.poster)}" alt="Poster: ${esc(e.title)}">` : ""}</div>
        <div class="stack light"><ul class="facts"><li><b>Date</b>${esc(fmtDate(e.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</li>
          ${e.time ? `<li><b>Time</b>${esc(e.time)}</li>` : ""}${e.location ? `<li><b>Venue</b>${esc(e.location)}</li>` : ""}</ul>
          ${isUpcoming(e) ? `<div class="countdown" id="ev-countdown"></div>` : `<p class="tag">This event has taken place</p>`}
          <p>${esc(e.description)}</p>
          <div class="row" style="justify-content:flex-start;gap:10px">${e.tickets && isUpcoming(e) ? `<a class="btn btn-primary" href="tickets.html?event=${encodeURIComponent(e.id)}">Book tickets</a>` : ""}
            <a class="btn btn-outline" href="${share}" target="_blank" rel="noopener">Share on WhatsApp</a></div>
          ${e.programme && e.programme.length ? `<h2 style="margin-top:28px">Programme</h2>${programmeHTML(e)}` : ""}</div>`;
      if (isUpcoming(e)) mountCountdown($("#ev-countdown"), e);
    }
  }

  fill("service-times", servicesList());
  fill("home-events", upcoming.slice(0, 3).map(eventCard).join("") || "<p>No upcoming events. Check back soon.</p>");
  fill("home-sermon", sermonsSorted[0] ? sermonCard(sermonsSorted[0]) : "");
  fill("home-news", [...D.news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(newsCard).join(""));
  fill("news-list", [...D.news].sort((a, b) => b.date.localeCompare(a.date)).map(newsCard).join(""));
  fill("event-list", [...upcoming, ...D.events.filter(e => !isUpcoming(e))].map(eventCard).join(""));
  fill("ministry-list", D.ministries.map(m => `<article class="card"><div class="icon">${m.icon}</div><h3>${esc(m.name)}</h3><div class="meta">${esc(m.when)}</div><p>${esc(m.desc)}</p></article>`).join(""));
  fill("leader-list", D.leaders.map(l => `<article class="card center">
      ${l.photo ? `<img src="${esc(l.photo)}" alt="${esc(l.name)}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;margin:0 auto 12px">`
        : `<div style="width:120px;height:120px;border-radius:50%;background:#e9e2d2;margin:0 auto 12px;display:grid;place-items:center;font-size:2.4rem">🙂</div>`}
      <h3>${esc(l.name)}</h3><div class="meta">${esc(l.role)}</div><p>${esc(l.bio)}</p></article>`).join(""));
  fill("belief-list", D.beliefs.map(b => `<li>${esc(b)}</li>`).join(""));

  /* Sermon search */
  const sl = $("#sermon-list");
  if (sl) {
    const draw = q => { q = q.toLowerCase(); sl.innerHTML = sermonsSorted.filter(s => (s.title + s.speaker + s.series).toLowerCase().includes(q)).map(sermonCard).join("") || "<p>No sermons found.</p>"; };
    draw(""); $("#sermon-search").oninput = e => draw(e.target.value);
  }

  /* Gallery + lightbox */
  const gg = $("#gallery-grid");
  if (gg) {
    const pal = [["#1f3a5f", "#3b6aa0"], ["#c8963e", "#e6c27a"], ["#4b6b57", "#86a98f"], ["#7a3b4a", "#b8707f"], ["#3f4a6b", "#7f8cb8"], ["#6b5a3b", "#b09a6a"]];
    gg.innerHTML = D.gallery.map((g, i) => `<figure class="gal" data-i="${i}" style="--c1:${pal[i % 6][0]};--c2:${pal[i % 6][1]}">
      ${g.src ? `<img src="${esc(g.src)}" alt="${esc(g.caption)}" loading="lazy">` : ""}<span>${esc(g.caption)}</span></figure>`).join("");
    const lb = $("#lightbox");
    gg.onclick = e => { const f = e.target.closest(".gal"); if (!f) return; const g = D.gallery[f.dataset.i];
      lb.innerHTML = g.src ? `<div><img src="${esc(g.src)}" alt=""><p>${esc(g.caption)}</p></div>` : `<p>${esc(g.caption)} (add a photo in data.js)</p>`; lb.classList.add("open"); };
    lb.onclick = () => lb.classList.remove("open");
  }

  /* Map */
  const mp = $("#map"); if (mp) mp.src = S.mapEmbed;

  /* Give page */
  const gv = $("#give-methods");
  if (gv) {
    const g = S.giving, items = [];
    if (g.mpesaPaybill) items.push(`<div class="card pay"><h3>M-Pesa Paybill</h3><dl><dt>Business no.</dt><dd>${esc(g.mpesaPaybill)}</dd><dt>Account</dt><dd>${esc(g.mpesaAccount)}</dd></dl>
      <p class="meta">Go to M-Pesa → Lipa na M-Pesa → Paybill.</p></div>`);
    if (g.mpesaTill) items.push(`<div class="card pay"><h3>M-Pesa Buy Goods</h3><dl><dt>Till no.</dt><dd>${esc(g.mpesaTill)}</dd></dl></div>`);
    if (g.bankAccountNumber) items.push(`<div class="card pay"><h3>Bank transfer</h3><dl><dt>Bank</dt><dd>${esc(g.bankName)}</dd><dt>Account name</dt><dd>${esc(g.bankAccountName)}</dd><dt>Account no.</dt><dd>${esc(g.bankAccountNumber)}</dd><dt>Branch</dt><dd>${esc(g.bankBranch)}</dd></dl></div>`);
    gv.innerHTML = items.join("");
  }

  /* ---------- Forms (contact + prayer) ---------- */
  async function send(subject, fields, kind) {
    if (BACKEND) {
      const r = await api(`/api/forms/${kind}/`, fields);
      if (!r.ok) throw new Error(r.data.error || "send failed");
      return "sent";
    }
    if (S.formEndpoint) {
      const r = await fetch(S.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ subject, ...fields }) });
      if (!r.ok) throw new Error("send failed");
      return "sent";
    }
    const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n");
    location.href = `mailto:${S.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return "mailto";
  }
  document.querySelectorAll("form[data-form]").forEach(f => {
    f.onsubmit = async e => {
      e.preventDefault();
      const note = $(".notice", f), fields = Object.fromEntries(new FormData(f));
      if (fields.website) return; // honeypot
      delete fields.website;
      try {
        const mode = await send(f.dataset.form === "prayer" ? "Prayer request" : "Website message", fields, f.dataset.form);
        note.className = "notice show"; note.textContent = mode === "sent" ? "Thank you! Your message has been received." : "Your email app should now open to send this message.";
        if (mode === "sent") f.reset();
      } catch (err) { note.className = "notice show err"; note.textContent = (err && err.message && err.message !== "send failed") ? err.message : "Sorry, something went wrong. Please try again or call us."; }
    };
  });
  const tabs = document.querySelectorAll("[data-tab]");
  tabs.forEach(b => b.onclick = () => showTab(b.dataset.tab));
  function showTab(t) { tabs.forEach(b => b.classList.toggle("on", b.dataset.tab === t)); document.querySelectorAll("[data-panel]").forEach(p => p.classList.toggle("hidden", p.dataset.panel !== t)); }
  if (tabs.length) showTab(location.hash === "#prayer" ? "prayer" : "contact");

  /* ---------- Ticket booking ---------- */
  const app = $("#ticket-app");
  if (app) {
    const events = upcoming.filter(e => e.tickets);
    if (!events.length) { app.innerHTML = `<div class="card center"><h3>No ticketed events right now</h3><p>Please check our <a href="events.html">events page</a> or contact us.</p></div>`; return; }
    const pre = new URLSearchParams(location.search).get("event");
    $("#event-select").innerHTML = events.map(e => `<option value="${esc(e.id)}" ${e.id === pre ? "selected" : ""}>${esc(e.title)} (${fmtDate(e.date, { day: "numeric", month: "short" })})</option>`).join("");
    let qty = {};
    const cur = () => events.find(e => e.id === $("#event-select").value);
    const total = () => cur().tickets.reduce((s, t, i) => s + t.price * (qty[i] || 0), 0);
    const count = () => Object.values(qty).reduce((a, b) => a + b, 0);

    function drawTickets() {
      const e = cur(); qty = {};
      $("#event-info").innerHTML = `<strong>${fmtDate(e.date)}</strong> · ${esc(e.time)} · ${esc(e.location)}<br><span class="meta">${esc(e.description)}</span>`;
      $("#ticket-types").innerHTML = e.tickets.map((t, i) => `<div class="tt"><div><strong>${esc(t.type)}</strong><div class="meta">${money(t.price)}${t.available === 0 ? " · <b>Sold out</b>" : (t.available != null && t.available <= 20 ? ` · only ${t.available} left` : "")}</div></div>
        <div class="qty"><button type="button" data-i="${i}" data-d="-1" aria-label="Less">−</button><output id="q${i}">0</output><button type="button" data-i="${i}" data-d="1" aria-label="More">+</button></div></div>`).join("");
      $("#pay-box").innerHTML = providerBox();
      update();
    }
    function update() {
      cur().tickets.forEach((_, i) => { const o = $("#q" + i); if (o) o.textContent = qty[i] || 0; });
      $("#total").textContent = money(total()); $("#book-btn").disabled = count() === 0;
      $("#pay-box").classList.toggle("hidden", !(BACKEND && total() > 0));
      $("#book-btn").textContent = BACKEND ? (total() > 0 ? `Pay ${money(total())} and book` : "Reserve free tickets") : "Book tickets";
    }
    $("#ticket-types").onclick = e => { const b = e.target.closest("button"); if (!b) return; const i = +b.dataset.i; const t = cur().tickets[i], lim = Math.min(t.max || 20, t.available ?? 99); qty[i] = Math.max(0, Math.min(lim, (qty[i] || 0) + +b.dataset.d)); update(); };
    $("#event-select").onchange = drawTickets; drawTickets();

    const showError = msg => { const n = $("#book-error"); n.textContent = msg; n.className = "notice show err"; n.scrollIntoView({ block: "center", behavior: "smooth" }); };

    function showTickets(d) {
      app.innerHTML = `<div class="card stack"><div class="eyebrow">Booking confirmed</div><h2>${esc(d.event)}</h2>
        <p>Reference <b>${esc(d.ref)}</b>${d.total ? ` · Paid ${money(d.total)}` : ""}. We have also sent your tickets by email/SMS where provided.</p>
        <div class="grid g3">${d.tickets.map(t => `<div class="ticket center"><div class="eyebrow">${esc(t.type)}</div>
          <img src="${base + esc(t.qr)}" alt="QR code for ticket ${esc(t.code)}" style="width:170px;margin:auto"><div class="ref" style="font-size:1.1rem">${esc(t.code)}</div></div>`).join("")}</div>
        <p class="meta">Show the QR code at the entrance. Keep this page, or open <a href="${base + esc(d.page)}">your ticket page</a> any time.</p>
        <div class="row no-print" style="justify-content:flex-start"><button class="btn btn-primary" onclick="print()">Print tickets</button><a class="btn btn-outline" href="tickets.html">Book more</a></div></div>`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function showWaiting(d, what = "booking") {
      app.innerHTML = `<div class="card center stack" role="status" aria-live="polite">${spinner}<h2>Check your phone</h2>
        <p>${esc(d.message || "Enter your PIN on the payment prompt to finish.")}</p><p class="meta">Reference ${esc(d.ref)}. This page updates automatically.</p></div>`;
      window.scrollTo({ top: 0, behavior: "smooth" });
      poll(`/api/bookings/${d.ref}/`, showTickets, f => showFailed(f, f.message), t => showFailed(t || d,
        "We have not received the payment confirmation yet. If you were charged, your tickets will arrive by SMS/email shortly; otherwise you can try again."));
    }
    function showFailed(d, msg) {
      app.innerHTML = `<div class="card stack"><h2>Payment not completed</h2><p>${esc(msg || "The payment did not go through.")}</p>
        <form id="retry">${providerBox()}<div><label for="rp">Phone number to pay with</label><input id="rp" name="phone" type="tel" required placeholder="07xx xxx xxx"></div>
        <button class="btn btn-primary">Try again</button><div id="retry-err" class="notice"></div></form>
        <p class="meta">Booking <b>${esc(d.ref)}</b> is kept for 15 minutes. Need help? <a href="contact.html">Contact us</a>.</p></div>`;
      $("#retry").onsubmit = async ev => {
        ev.preventDefault(); const btn = ev.target.querySelector("button"); btn.disabled = true;
        const r = await api(`/api/bookings/${d.ref}/retry/`, { provider: chosenProvider(ev.target), phone: new FormData(ev.target).get("phone") });
        if (!r.ok) { btn.disabled = false; const n = $("#retry-err"); n.className = "notice show err"; n.textContent = r.data.error || "Could not retry."; return; }
        r.data.status === "paid" ? showTickets(r.data) : showWaiting(r.data);
      };
    }
    async function backendBook(e, f) {
      const ev = cur(), btn = $("#book-btn"), label = btn.textContent;
      const items = ev.tickets.map((t, i) => ({ ticket_type: t.id, quantity: qty[i] || 0 })).filter(x => x.quantity);
      btn.disabled = true; btn.textContent = "Please wait…"; $("#book-error").className = "notice";
      const r = await api("/api/bookings/", { event: ev.id, items, name: f.name, phone: f.phone, email: f.email, notes: f.notes,
        provider: total() > 0 ? chosenProvider(e.target) : "", website: f.website || "" });
      btn.disabled = false; btn.textContent = label;
      if (!r.ok) return showError(r.data.error || "Something went wrong. Please try again.");
      r.data.status === "paid" ? showTickets(r.data) : showWaiting(r.data);
    }

    $("#ticket-form").onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target)); if (f.website) return;
      if (BACKEND) return backendBook(e, f);
      const ev = cur(), items = ev.tickets.map((t, i) => ({ ...t, n: qty[i] || 0 })).filter(t => t.n), sum = total();
      const ref = "TKT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const booking = { ref, event: ev.title, date: ev.date, name: f.name, phone: f.phone, email: f.email, items, total: sum, created: new Date().toISOString() };
      try { const all = JSON.parse(localStorage.getItem("bookings") || "[]"); all.push(booking); localStorage.setItem("bookings", JSON.stringify(all)); } catch {}
      const lines = items.map(t => `${t.n} x ${t.type}`).join(", ");
      try { if (S.formEndpoint && !BACKEND) await send(`Ticket booking ${ref}`, { ref, event: ev.title, tickets: lines, total: sum, name: f.name, phone: f.phone, email: f.email, notes: f.notes }, "booking"); } catch {}
      const g = S.giving, pay = sum > 0 ? `<div class="card pay no-print" style="margin-top:18px"><h3>Complete your payment</h3>
        ${g.mpesaPaybill ? `<p>M-Pesa Paybill <b>${esc(g.mpesaPaybill)}</b>, account <b>${esc(ref)}</b>, amount <b>${money(sum)}</b>.</p>` : ""}
        ${g.mpesaTill ? `<p>Or Buy Goods Till <b>${esc(g.mpesaTill)}</b>, amount <b>${money(sum)}</b>.</p>` : ""}
        <p class="meta">Then send the M-Pesa confirmation message to us so we can confirm your ticket.</p></div>` : "";
      const wa = `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(`Hello, I have booked tickets. Ref ${ref}: ${lines} for ${ev.title}. Name: ${f.name}. Total ${money(sum)}.`)}`;
      app.innerHTML = `<div class="ticket"><div class="eyebrow">Booking received</div><div class="ref">${ref}</div>
        <dl><dt>Event</dt><dd>${esc(ev.title)}</dd><dt>Date</dt><dd>${fmtDate(ev.date)}, ${esc(ev.time)}</dd><dt>Venue</dt><dd>${esc(ev.location)}</dd>
        <dt>Name</dt><dd>${esc(f.name)}</dd><dt>Phone</dt><dd>${esc(f.phone)}</dd><dt>Tickets</dt><dd>${esc(lines)}</dd><dt>Total</dt><dd><b>${money(sum)}</b></dd></dl>
        <p class="meta">Show this reference at the entrance.</p></div>${pay}
        <div class="row no-print" style="margin-top:18px;justify-content:flex-start"><a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener">Send confirmation on WhatsApp</a>
        <button class="btn btn-outline" onclick="print()">Print / save ticket</button><a class="btn btn-outline" href="tickets.html">Book another</a></div>`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  /* ---------- Online giving ---------- */
  const da = $("#donate-app");
  if (da && BACKEND) {
    da.innerHTML = `<form id="donate-form" class="card stack"><h2>Give online</h2><p class="meta">You will get a payment prompt on your phone.</p>
      <div><label>Amount (${esc(S.currency)})</label><div class="row" style="justify-content:flex-start;gap:8px" id="presets">
        ${[500, 1000, 2000, 5000].map(a => `<button type="button" class="btn btn-outline btn-sm" data-a="${a}">${a.toLocaleString()}</button>`).join("")}</div>
        <input id="d-amount" name="amount" type="number" min="10" max="150000" step="1" inputmode="numeric" required placeholder="Other amount" style="margin-top:10px"></div>
      <div><label for="d-purpose">Giving to</label><select id="d-purpose" name="purpose"><option>Tithe</option><option selected>Offering</option><option>Building fund</option><option>Missions</option><option>Thanksgiving</option><option>Other</option></select></div>
      <div class="two"><div><label for="d-name">Name (optional)</label><input id="d-name" name="name" autocomplete="name"></div>
      <div><label for="d-phone">Phone number to pay with</label><input id="d-phone" name="phone" type="tel" required autocomplete="tel" placeholder="07xx xxx xxx"></div></div>
      <div><label for="d-email">Email for a receipt (optional)</label><input id="d-email" name="email" type="email" autocomplete="email"></div>
      ${providerBox()}
      <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
      <button class="btn btn-primary" id="d-btn">Give</button><div id="d-err" class="notice" role="alert"></div></form>`;
    const amt = $("#d-amount"), btn = $("#d-btn");
    const label = () => btn.textContent = amt.value ? `Give ${money(+amt.value)}` : "Give";
    amt.oninput = label;
    $("#presets").onclick = e => { const b = e.target.closest("button"); if (b) { amt.value = b.dataset.a; label(); } };
    $("#donate-form").onsubmit = async e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); if (f.website) return;
      btn.disabled = true; $("#d-err").className = "notice";
      const r = await api("/api/donations/", { ...f, amount: +f.amount, provider: chosenProvider(e.target) });
      if (!r.ok) { btn.disabled = false; const n = $("#d-err"); n.className = "notice show err"; n.textContent = r.data.error || "Something went wrong."; return; }
      da.innerHTML = `<div class="card center stack" role="status">${spinner}<h2>Check your phone</h2><p>${esc(r.data.message)}</p><p class="meta">Reference ${esc(r.data.ref)}</p></div>`;
      const done = (title, msg) => da.innerHTML = `<div class="card center stack"><h2>${esc(title)}</h2><p>${esc(msg)}</p><a class="btn btn-outline" href="give.html">Back</a></div>`;
      poll(`/api/donations/${r.data.ref}/`, d => done("Thank you!", `We received your gift of ${money(d.amount)}. God bless you. Reference ${d.ref}.`),
        d => done("Payment not completed", d.message || "The payment did not go through."),
        () => done("Still waiting", "We have not received confirmation yet. If you were charged, we will send a receipt shortly."));
    };
  }
})();
