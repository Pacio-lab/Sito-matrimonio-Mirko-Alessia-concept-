// js/script.js

/**
 * Configurazione Endpoint per la trasmissione dei dati del form RSVP.
 * Inserire qui l'endpoint di Formspree (es. "https://formspree.io/f/XXXXX")
 * o il Webhook / Google Script deputato alla ricezione.
 */
const ENDPOINT_RSVP = "";

/**
 * 1. Countdown verso il 26 Maggio 2028 ore 16:00 (Inizio evento)
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
 * 2. Animazioni di comparsa allo scorrimento (IntersectionObserver)
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
 * 3. Galleria fotografica e Lightbox modale
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
 * 4. Logica RSVP form: toggle sezioni, campi ripetibili e validazione
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
            throw new Error("Errore invio");
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
 * 5. Copia IBAN negli appunti
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
 * Inizializzazione globale all'evento DOMContentLoaded
 */
function init() {
  initCountdown();
  initScrollReveal();
  initGallery();
  initRsvpForm();
  initCopyIban();
}

document.addEventListener("DOMContentLoaded", init);
