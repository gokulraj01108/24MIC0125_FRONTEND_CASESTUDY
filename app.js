/* MediConnect frontend demo — no backend or real medical data. */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const STORAGE_KEY = "mediconnect_demo_appointments";
  const readAppointments = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  };
  const saveAppointments = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const doctors = [
    {name:"Dr. Ananya Rao",initials:"AR",specialty:"Cardiology",experience:"12 years experience",rating:"4.9",reviews:184,fee:"₹800",availability:"today",online:true,variant:"",bio:"Preventive cardiology and heart-health consultations."},
    {name:"Dr. Karthik Menon",initials:"KM",specialty:"Dermatology",experience:"9 years experience",rating:"4.8",reviews:152,fee:"₹650",availability:"today",online:true,variant:"v2",bio:"Evidence-informed care for skin, hair and nail concerns."},
    {name:"Dr. Meera Iyer",initials:"MI",specialty:"Pediatrics",experience:"11 years experience",rating:"5.0",reviews:201,fee:"₹700",availability:"later",online:true,variant:"v3",bio:"Child wellness, preventive care and family guidance."},
    {name:"Dr. Arjun Shah",initials:"AS",specialty:"Neurology",experience:"14 years experience",rating:"4.9",reviews:127,fee:"₹950",availability:"today",online:false,variant:"v4",bio:"Neurological assessments and long-term care planning."},
    {name:"Dr. Priya Nair",initials:"PN",specialty:"General Medicine",experience:"8 years experience",rating:"4.8",reviews:166,fee:"₹500",availability:"today",online:true,variant:"v5",bio:"Primary care, routine check-ups and preventive health."},
    {name:"Dr. Rahul Verma",initials:"RV",specialty:"Orthopedics",experience:"10 years experience",rating:"4.7",reviews:118,fee:"₹750",availability:"later",online:false,variant:"v6",bio:"Joint, bone and mobility assessments for adults."}
  ];

  // Responsive navigation
  const menuButton = $(".menu-toggle");
  const nav = $(".nav");
  if (menuButton && nav) menuButton.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  // Doctors page: live search and filters
  if (document.body.dataset.page === "doctors") {
    const grid = $("#doctor-grid"), search = $("#doctor-search"), specialty = $("#specialty-filter"), availability = $("#availability-filter"), count = $("#results-count"), empty = $("#empty-state");
    const params = new URLSearchParams(location.search);
    if (params.has("specialty") && [...specialty.options].some(o => o.value === params.get("specialty"))) specialty.value = params.get("specialty");
    const render = () => {
      const term = search.value.trim().toLowerCase();
      const filtered = doctors.filter(d => {
        const matchesTerm = `${d.name} ${d.specialty} ${d.bio}`.toLowerCase().includes(term);
        const matchesSpecialty = specialty.value === "all" || d.specialty === specialty.value;
        const matchesAvailability = availability.value === "all" || (availability.value === "today" ? d.availability === "today" : d.online);
        return matchesTerm && matchesSpecialty && matchesAvailability;
      });
      count.textContent = `Showing ${filtered.length} of ${doctors.length} doctors`;
      grid.innerHTML = filtered.map(d => `<article class="doctor-card"><div class="doctor-top"><div class="doctor-avatar ${d.variant}">${d.initials}</div><div><div class="doctor-name">${d.name}</div><div class="doctor-spec">${d.specialty}</div><span class="doctor-badge">✓ Verified demo profile</span></div></div><div class="doctor-rating">★ ${d.rating} <span style="color:#8b9aa7">(${d.reviews} reviews)</span></div><p class="doctor-bio">${d.bio}</p><div class="doctor-bottom"><div><small>${d.experience}</small><strong>${d.fee} <small> / visit</small></strong></div><a class="btn btn-primary" href="appointments.html?doctor=${encodeURIComponent(d.name)}">Book visit →</a></div></article>`).join("");
      empty.classList.toggle("hidden", filtered.length > 0);
      grid.classList.toggle("hidden", filtered.length === 0);
    };
    [search, specialty, availability].forEach(el => el.addEventListener(el === search ? "input" : "change", render));
    $("#reset-filters").addEventListener("click", () => { search.value = ""; specialty.value = "all"; availability.value = "all"; render(); });
    render();
  }

  // Appointment booking demo, stored in this browser only
  if (document.body.dataset.page === "appointments") {
    const form = $("#booking-form"), dateInput = $("#booking-date"), doctorSelect = $("#booking-doctor");
    const today = new Date();
    const localISODate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0,10);
    dateInput.min = localISODate;
    const params = new URLSearchParams(location.search);
    if (params.has("doctor")) {
      const requested = params.get("doctor");
      const option = [...doctorSelect.options].find(o => o.textContent.startsWith(requested));
      if (option) doctorSelect.value = option.value;
    }
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.date < localISODate) { dateInput.setCustomValidity("Choose today or a future date."); dateInput.reportValidity(); dateInput.setCustomValidity(""); return; }
      const booking = {...data, id: Date.now(), createdAt: new Date().toISOString()};
      const appointments = readAppointments();
      appointments.push(booking);
      saveAppointments(appointments);
      $("#success-message").textContent = `${booking.name}, your demo visit with ${booking.doctor.split(" — ")[0]} is listed for ${booking.date} at ${booking.time}. This is not a real booking.`;
      form.classList.add("hidden");
      $(".card-heading").classList.add("hidden");
      $("#booking-success").classList.remove("hidden");
    });
    $("#book-another").addEventListener("click", () => {
      form.reset(); form.classList.remove("hidden"); $(".card-heading").classList.remove("hidden"); $("#booking-success").classList.add("hidden");
    });
  }

  // Dashboard: render local demo appointments, remove appointments, wellness checklist, steps
  if (document.body.dataset.page === "dashboard") {
    const list = $("#dashboard-appointments"), empty = $("#no-appointments");
    const renderAppointments = () => {
      const items = readAppointments().sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));
      list.innerHTML = items.map(a => {
        const date = new Date(`${a.date}T12:00:00`);
        const day = Number.isNaN(date.getTime()) ? "--" : date.getDate();
        const month = Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en", {month:"short"});
        return `<div class="upcoming-item"><div class="date-tile"><strong>${day}</strong><small>${month}</small></div><div class="upcoming-info"><strong>${escapeHTML(a.doctor.split(" — ")[0])}</strong><small>${escapeHTML(a.doctor.split(" — ")[1] || "Consultation")} · ${escapeHTML(a.time)} · ${escapeHTML(a.type)}</small></div><span class="appointment-tag">Demo</span><button class="remove-appointment" data-remove="${a.id}" aria-label="Remove appointment">×</button></div>`;
      }).join("");
      empty.classList.toggle("hidden", items.length > 0);
      list.classList.toggle("hidden", items.length === 0);
      $$("[data-remove]", list).forEach(btn => btn.addEventListener("click", () => {
        saveAppointments(readAppointments().filter(a => String(a.id) !== btn.dataset.remove));
        renderAppointments();
      }));
    };
    renderAppointments();
    const checks = $$(".wellness-check"), count = $("#check-count");
    const updateChecks = () => count.textContent = `${checks.filter(c => c.checked).length} of ${checks.length}`;
    checks.forEach(c => c.addEventListener("change", updateChecks));
    let steps = 6842;
    $("#add-steps").addEventListener("click", () => {
      steps += 500; $("#steps-value").textContent = steps.toLocaleString("en-US");
      $("#steps-progress").style.width = `${Math.min(steps / 10000 * 100, 100)}%`;
    });
  }

  // Help contact demo
  if (document.body.dataset.page === "help") {
    const form = $("#contact-form");
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      $("#contact-success-message").textContent = `Thanks, ${data.contactName}. Your "${data.topic}" message is confirmed in this demo only. No email was sent.`;
      form.classList.add("hidden"); $("#contact-success").classList.remove("hidden");
    });
    $("#send-another").addEventListener("click", () => { form.reset(); form.classList.remove("hidden"); $("#contact-success").classList.add("hidden"); });
    $$(".faq-item").forEach(item => {
      const summary = $("summary", item);
      summary.addEventListener("click", () => {
        // Native details element handles expansion; icon styling follows its open state.
      });
    });
  }
})();