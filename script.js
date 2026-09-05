// js/script.js

/**
 * Configurazione Endpoint per la trasmissione dei dati del form RSVP.
 * Inserire qui l'endpoint di Formspree (es. "https://formspree.io/f/XXXXX")
 * o il Webhook / Google Script deputato alla ricezione.
 */
const ENDPOINT_RSVP = "";

/**
 * 1. Generazione immagini SVG inline per garantire rendering visivo immediato
 * Crea dinamicamente i file SVG eleganti nella cartella virtuale / data-url
 */
function initDynamicImages() {
  const svgPalette = {
    panna: "%23F5EFE7",
    greige: "%23BFB0A0",
    mocha: "%23A3805F",
    cacao: "%237A5B44",
    moro: "%233E2C22"
  };

  const createSvgDataUrl = (w, h, title, subtitle, patternType) => {
    let deco = "";
    if (patternType === "landscape") {
      deco = `
        <circle cx="${w * 0.7}" cy="${h * 0.4}" r="${Math.min(w, h) * 0.2}" fill="${svgPalette.mocha}" opacity="0.15"/>
        <path d="M0,${h * 0.85} Q${w * 0.35},${h * 0.65} ${w * 0.7},${h * 0.8} T${w},${h * 0.75} L${w},${h} L0,${h} Z" fill="${svgPalette.greige}" opacity="0.3"/>
        <path d="M0,${h * 0.9} Q${w * 0.5},${h * 0.75} ${w},${h * 0.85} L${w},${h} L0,${h} Z" fill="${svgPalette.cacao}" opacity="0.25"/>
      `;
    } else if (patternType === "detail") {
      deco = `
        <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.38}" fill="none" stroke="${svgPalette.greige}" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.6"/>
        <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.32}" fill="none" stroke="${svgPalette.mocha}" stroke-width="1" opacity="0.4"/>
      `;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="100%" height="100%" fill="${svgPalette.panna}"/>
      <radialGradient id="g" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="${svgPalette.panna}"/>
        <stop offset="100%" stop-color="${svgPalette.greige}" stop-opacity="0.35"/>
      </radialGradient>
      <rect width="100%" height="100%" fill="url(%23g)"/>
      ${deco}
      <text x="50%" y="47%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.max(22, Math.round(w * 0.038))}px" fill="${svgPalette.moro}" letter-spacing="2">${title}</text>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="'Courier New', monospace" font-size="${Math.max(12, Math.round(w * 0.016))}px" fill="${svgPalette.cacao}" letter-spacing="3">${subtitle}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${svg.replace(/\n/g, "").replace(/\s+/g, " ")}`;
  };

  // Imposta Hero Background
  const heroDataUrl = createSvgDataUrl(2400, 1350, "Mirko &amp; Alessia", "FRANCIACORTA · 26 MAGGIO 2028", "landscape");
  document.documentElement.style.setProperty("--hero-bg", `url("${heroDataUrl}")`);

  // Assegna immagini reali a tag <img>
  const imageMapping = {
    "images/story-1.jpg": createSvgDataUrl(1200, 1500, "16 Aprile 2023", "L'INIZIO DEL NOSTRO AMORE", "detail"),
    "images/story-2.jpg": createSvgDataUrl(1200, 1500, "Casa Insieme", "PROGETTI E QUOTIDIANITÀ", "detail"),
    "images/solive-1.jpg": createSvgDataUrl(1600, 1000, "Agriturismo Solive", "VIGNETI &amp; ULIVI · NIGOLINE DI CORTE FRANCA", "landscape"),
    "images/gallery-1.jpg": createSvgDataUrl(1200, 1200, "Vigneti al Tramonto", "FRANCIACORTA", "landscape"),
    "images/gallery-2.jpg": createSvgDataUrl(1200, 1200, "Riva al Crepuscolo", "LAGO D'ISEO", "landscape"),
    "images/gallery-3.jpg": createSvgDataUrl(1200, 1200, "Brindisi", "CALICI TRA GLI ULIVI", "detail"),
    "images/gallery-4.jpg": createSvgDataUrl(1200, 1200, "Complici", "SORRISI SPONTANEI", "detail"),
    "images/gallery-5.jpg": createSvgDataUrl(1200, 1200, "Colline Bresciane", "NATURA &amp; SILENZIO", "landscape"),
    "images/gallery-6.jpg": createSvgDataUrl(1200, 1200, "Verso il Sì", "26 . 05 . 2028", "detail")
  };

  document.querySelectorAll("img").forEach((img) => {
    const srcAttr = img.getAttribute("src");
    if (imageMapping[srcAttr]) {
      img.src = imageMapping[srcAttr];
    }
  });

  document.querySelectorAll(".gallery-thumb").forEach((thumb) => {
    const dataSrc = thumb.getAttribute("data-img-src");
    if (imageMapping[dataSrc]) {
      thumb.setAttribute("data-img-src", imageMapping[dataSrc]);
    }
  });
}

/**
 * 2. Countdown verso il 26 Maggio 2028 ore 16:00 (Inizio evento)
 */
function initCountdown() {
  const targetDate = new Date("2028-05-26T16:00:00+02:00").getTime();

  const daysElem = document.getElementById("cd-days");
  const hoursElem = document.getElementById("cd-hours");
  const minutesElem = document.getElementById("cd-minutes");
  const secondsElem = document.getElementById("cd-seconds");

  if (!daysElem || !hoursElem || !minutesElem || !secondsElem) return;

  const updateClock = () => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      daysElem.textContent = "00";
      hoursElem.textContent = "00";
      minutesElem.textContent = "00";
      secondsElem.textContent = "00";
      clearInterval(timerInterval);
      return;
    }

    const d = Math.floor(difference / (1000 * 60 * 60 * 24));
    const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const m = Math.floor((difference / 1000 / 60) % 60);
    const s = Math.floor((difference / 1000) % 60);

    daysElem.textContent = String(d).padStart(2, "0");
    hoursElem.textContent = String(h).padStart(2, "0");
    minutesElem.textContent = String(m).padStart(2, "0");
    secondsElem.textContent = String(s).padStart(2, "0");
  };

  updateClock();
  const timerInterval = setInterval(updateClock, 1000);
}

/**
 * 3. Animazioni di scorrimento tramite IntersectionObserver
 */
function initScrollReveal() {
  const reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("active"));
  }
}

/**
 * 4. Galleria fotografica e Lightbox modale
 */
function initGallery() {
  const modalEl = document.getElementById("galleryModal");
  if (!modalEl) return;

  const bsModal = new bootstrap.Modal(modalEl);
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const thumbs = document.querySelectorAll(".gallery-thumb");

  thumbs.forEach((thumb) => {
    const openLightbox = () => {
      const src = thumb.getAttribute("data-img-src");
      const caption = thumb.getAttribute("data-caption");
      if (src && lightboxImg) {
        lightboxImg.src = src;
        lightboxCaption.textContent = caption || "";
        bsModal.show();
      }
    };

    thumb.addEventListener("click", openLightbox);
    thumb.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox();
      }
    });
  });
}

/**
 * 5. Logica RSVP form: logica di conferma, campi dinamici e invio
 */
function initRsvpForm() {
  const form = document.getElementById("rsvpForm");
  const presenceYes = document.getElementById("presenceYes");
  const presenceNo = document.getElementById("presenceNo");
  const detailsYes = document.getElementById("rsvpDetailsYes");
  const detailsNo = document.getElementById("rsvpDetailsNo");
  const childrenSelect = document.getElementById("childrenCount");
  const childrenAgesContainer = document.getElementById("childrenAgesContainer");
  const btnAddGuest = document.getElementById("btnAddGuest");
  const guestsContainer = document.getElementById("guestsContainer");
  const feedbackAlert = document.getElementById("rsvpFeedback");
  const submitBtn = document.getElementById("btnRsvpSubmit");

  if (!form) return;

  let guestCounter = 0;

  const toggleAttendanceView = () => {
    if (presenceYes.checked) {
      detailsYes.classList.remove("d-none");
      detailsNo.classList.add("d-none");
    } else if (presenceNo.checked) {
      detailsNo.classList.remove("d-none");
      detailsYes.classList.add("d-none");
    }
  };

  presenceYes.addEventListener("change", toggleAttendanceView);
  presenceNo.addEventListener("change", toggleAttendanceView);

  // Selezione dinamica età bambini
  childrenSelect.addEventListener("change", (e) => {
    const count = parseInt(e.target.value, 10);
    childrenAgesContainer.innerHTML = "";

    if (count > 0) {
      childrenAgesContainer.classList.remove("d-none");
      for (let i = 1; i <= count; i++) {
        const col = document.createElement("div");
        col.className = "col-6 col-md-3";
        col.innerHTML = `
          <label for="childAge_${i}" class="form-label">Età Bambino ${i}</label>
          <input type="number" min="0" max="17" class="form-control" id="childAge_${i}" name="eta_bambino_${i}" placeholder="Anni" required>
          <div class="invalid-feedback">Indica l'età.</div>
        `;
        childrenAgesContainer.appendChild(col);
      }
    } else {
      childrenAgesContainer.classList.add("d-none");
    }
  });

  // Aggiunta dinamica ospiti con intolleranze
  btnAddGuest.addEventListener("click", () => {
    guestCounter++;
    const card = document.createElement("div");
    card.className = "guest-item-card position-relative";
    card.id = `guestBlock_${guestCounter}`;
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="form-label mb-0">Ospite Aggiuntivo #${guestCounter}</span>
        <button type="button" class="btn-close btn-sm" aria-label="Rimuovi Ospite" data-remove-target="guestBlock_${guestCounter}"></button>
      </div>
      <div class="mb-3">
        <label class="form-label">Nome Completo</label>
        <input type="text" class="form-control" name="ospite_aggiuntivo_nome_${guestCounter}" placeholder="Nome e Cognome">
      </div>
      <div>
        <label class="form-label d-block mb-1">Esigenze Alimentari</label>
        <div class="row g-2">
          <div class="col-6 col-md-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="esigenze_${guestCounter}[]" value="nessuna" id="diet_none_${guestCounter}">
              <label class="form-check-label" for="diet_none_${guestCounter}">Nessuna</label>
            </div>
          </div>
          <div class="col-6 col-md-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="esigenze_${guestCounter}[]" value="vegetariano" id="diet_veg_${guestCounter}">
              <label class="form-check-label" for="diet_veg_${guestCounter}">Vegetariano</label>
            </div>
          </div>
          <div class="col-6 col-md-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="esigenze_${guestCounter}[]" value="vegano" id="diet_vegan_${guestCounter}">
              <label class="form-check-label" for="diet_vegan_${guestCounter}">Vegano</label>
            </div>
          </div>
          <div class="col-6 col-md-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="esigenze_${guestCounter}[]" value="senza_glutine" id="diet_gluten_${guestCounter}">
              <label class="form-check-label" for="diet_gluten_${guestCounter}">Senza glutine</label>
            </div>
          </div>
          <div class="col-6 col-md-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="esigenze_${guestCounter}[]" value="senza_lattosio" id="diet_lactose_${guestCounter}">
              <label class="form-check-label" for="diet_lactose_${guestCounter}">Senza lattosio</label>
            </div>
          </div>
          <div class="col-6 col-md-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="esigenze_${guestCounter}[]" value="senza_frutta_guscio" id="diet_nuts_${guestCounter}">
              <label class="form-check-label" for="diet_nuts_${guestCounter}">No frutta a guscio</label>
            </div>
          </div>
          <div class="col-12">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="esigenze_${guestCounter}[]" value="altro" id="diet_other_${guestCounter}">
              <label class="form-check-label" for="diet_other_${guestCounter}">Altro</label>
            </div>
          </div>
        </div>
      </div>
    `;

    card.querySelector(".btn-close").addEventListener("click", (evt) => {
      const targetId = evt.target.getAttribute("data-remove-target");
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.remove();
    });

    guestsContainer.appendChild(card);
  });

  // Validazione ed invio
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    form.classList.add("was-validated");
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Invio in corso...';

    const formData = new FormData(form);

    if (ENDPOINT_RSVP.trim() !== "") {
      fetch(ENDPOINT_RSVP, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      })
        .then((res) => {
          if (res.ok) {
            mostraConferma();
          } else {
            throw new Error("Errore durante la registrazione");
          }
        })
        .catch(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Invia Conferma";
          alert("Si è verificato un errore durante l'invio. Riprova più tardi.");
        });
    } else {
      setTimeout(() => {
        mostraConferma();
      }, 700);
    }

    function mostraConferma() {
      form.classList.add("d-none");
      feedbackAlert.classList.remove("d-none");
      feedbackAlert.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

/**
 * 6. Copia IBAN negli appunti
 */
function initCopyIban() {
  const btnCopy = document.getElementById("btnCopyIban");
  const ibanElem = document.getElementById("ibanText");
  const copyText = document.getElementById("copyText");
  const copyIcon = document.getElementById("copyIcon");

  if (!btnCopy || !ibanElem) return;

  btnCopy.addEventListener("click", () => {
    const rawIban = ibanElem.textContent.trim();
    navigator.clipboard.writeText(rawIban).then(() => {
      const originalText = copyText.textContent;
      copyText.textContent = "Copiato!";
      copyIcon.className = "bi bi-check-lg me-1";

      setTimeout(() => {
        copyText.textContent = originalText;
        copyIcon.className = "bi bi-clipboard me-1";
      }, 2500);
    }).catch(() => {
      alert("Impossibile copiare automaticamente. Seleziona il testo manualmente.");
    });
  });
}

/**
 * Inizializzazione globale
 */
function init() {
  initDynamicImages();
  initCountdown();
  initScrollReveal();
  initGallery();
  initRsvpForm();
  initCopyIban();
}

document.addEventListener("DOMContentLoaded", init);
