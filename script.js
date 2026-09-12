// script.js

/**
 * Configurazione Endpoint per la trasmissione dei dati del form RSVP.
 * Inserire qui l'endpoint di Formspree (es. "https://formspree.io/f/XXXXX")
 * o il Webhook / Google Script deputato alla ricezione.
 *
 * Finche' resta vuoto il modulo NON invia nulla e mostra un avviso esplicito:
 * meglio un avviso che una falsa conferma con la risposta persa.
 */
const ENDPOINT_RSVP = "";

/** Data e ora del matrimonio, usate da countdown e file calendario. */
const DATA_MATRIMONIO_INIZIO = "2028-05-26T16:00:00+02:00";
const DATA_MATRIMONIO_FINE = "2028-05-27T02:00:00+02:00";

/**
 * 1. Apertura interattiva Busta in stile SiSempre (Immagine 2)
 */
function initEnvelopeIntro() {
  const btnSeal = document.getElementById("btnOpenEnvelope");
  const btnPill = document.getElementById("btnOpenPill");
  const envelopeStage = document.querySelector(".sisempre-envelope-stage");
  const envelopeScreen = document.getElementById("envelopeScreen");
  const siteContent = document.getElementById("siteContent");

  if (!envelopeScreen) return;

  const CHIAVE_SESSIONE = "invito-gia-aperto";

  const sbloccaSito = () => {
    envelopeScreen.classList.add("opened");
    envelopeScreen.setAttribute("aria-hidden", "true");
    document.body.classList.remove("envelope-locked");
    try {
      sessionStorage.setItem(CHIAVE_SESSIONE, "1");
    } catch (e) {
      /* navigazione privata o storage bloccato: pazienza, l'intro si ripete */
    }
  };

  // Chi arriva da un link diretto a una sezione (es. .../#rsvp) o chi ha gia'
  // aperto la busta in questa sessione non deve rivedere l'animazione.
  let giaAperto = false;
  try {
    giaAperto = sessionStorage.getItem(CHIAVE_SESSIONE) === "1";
  } catch (e) {
    giaAperto = false;
  }
  const arrivaDaAncora = window.location.hash && window.location.hash !== "#hero";

  if (giaAperto || arrivaDaAncora) {
    envelopeScreen.style.transition = "none";
    sbloccaSito();
    return;
  }

  let inApertura = false;

  const handleOpen = () => {
    if (inApertura) return;
    inApertura = true;

    if (envelopeStage) {
      envelopeStage.classList.add("anim-opening");
    }

    const motoRidotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setTimeout(() => {
      sbloccaSito();

      // Il focus segue il contenuto appena rivelato, altrimenti chi naviga da
      // tastiera resterebbe fermo su un bottone ormai invisibile.
      if (siteContent) {
        siteContent.setAttribute("tabindex", "-1");
        siteContent.focus({ preventScroll: true });
      }

      setTimeout(() => {
        window.dispatchEvent(new Event("scroll"));
      }, 250);
    }, motoRidotto ? 0 : 900);
  };

  if (btnSeal) btnSeal.addEventListener("click", handleOpen);
  if (btnPill) btnPill.addEventListener("click", handleOpen);

  // Invio o Esc aprono comunque l'invito, senza dover centrare il sigillo.
  document.addEventListener("keydown", (e) => {
    if (document.body.classList.contains("envelope-locked") && (e.key === "Escape" || e.key === "Enter")) {
      handleOpen();
    }
  });
}

/**
 * 2. Indicatore di Progresso Scorrimento, Navigazione e Ritorno in Cima
 */
function initScrollIndicator() {
  const progressBar = document.getElementById("scrollProgress");
  const backToTopBtn = document.getElementById("btnBackToTop");
  const nav = document.getElementById("mainNav");
  const heroSection = document.getElementById("hero");
  const navLinks = Array.from(document.querySelectorAll(".site-nav-list a"));
  const sezioni = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  let inAttesaDiFrame = false;

  const aggiorna = () => {
    inAttesaDiFrame = false;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) {
      progressBar.style.width = `${scrollPercent}%`;
      progressBar.setAttribute("aria-valuenow", Math.round(scrollPercent));
    }

    if (backToTopBtn) {
      backToTopBtn.classList.toggle("show", scrollTop > 450);
    }

    // La barra di navigazione compare solo dopo la hero, per non coprirla.
    if (nav) {
      const sogliaNav = heroSection ? heroSection.offsetHeight * 0.75 : 500;
      nav.classList.toggle("is-visible", scrollTop > sogliaNav);
    }

    // Evidenzia la voce di menu della sezione che si sta leggendo.
    if (sezioni.length) {
      let attiva = null;
      for (const sezione of sezioni) {
        if (sezione.getBoundingClientRect().top <= 140) {
          attiva = sezione;
        }
      }
      navLinks.forEach((link) => {
        const bersaglio = link.getAttribute("href").slice(1);
        link.classList.toggle("is-active", Boolean(attiva) && attiva.id === bersaglio);
      });
    }
  };

  // Lo scroll puo' scattare decine di volte al secondo: si lavora una volta
  // per frame, cosi' lo scorrimento resta fluido anche su telefoni lenti.
  const onScroll = () => {
    if (!inAttesaDiFrame) {
      inAttesaDiFrame = true;
      window.requestAnimationFrame(aggiorna);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  aggiorna();

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Su mobile il menu si richiude dopo aver scelto una sezione.
  const menu = document.getElementById("navLinks");
  if (menu && window.bootstrap) {
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (menu.classList.contains("show")) {
          bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      });
    });
  }
}

/**
 * 3. Countdown live al 26 Maggio 2028 ore 16:00 (Europe/Rome)
 */
function initCountdown() {
  const targetDate = new Date(DATA_MATRIMONIO_INIZIO).getTime();

  const daysElem = document.getElementById("cd-days");
  const hoursElem = document.getElementById("cd-hours");
  const minutesElem = document.getElementById("cd-minutes");
  const secondsElem = document.getElementById("cd-seconds");
  const clockElem = document.getElementById("countdown-clock");
  const doneElem = document.getElementById("countdown-done");

  if (!daysElem || !hoursElem || !minutesElem || !secondsElem) return;

  const updateClock = () => {
    const difference = targetDate - Date.now();

    if (difference <= 0) {
      clearInterval(timerInterval);
      // A conto terminato quattro zeri sembrano un errore: meglio un saluto.
      if (clockElem) clockElem.classList.add("d-none");
      if (doneElem) doneElem.classList.remove("d-none");
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
 * 4. Animazioni al raggiungimento dello scroll tramite IntersectionObserver
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
        threshold: 0.12,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("active"));
  }
}

/**
 * 5. Galleria fotografica e Lightbox modale Bootstrap
 */
function initGallery() {
  const modalEl = document.getElementById("galleryModal");
  if (!modalEl || !window.bootstrap) return;

  const bsModal = new bootstrap.Modal(modalEl);
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const thumbs = document.querySelectorAll(".gallery-thumb");

  thumbs.forEach((thumb) => {
    // Le miniature sono <button>: Invio e Spazio funzionano gia' da soli.
    thumb.addEventListener("click", () => {
      const src = thumb.getAttribute("data-img-src");
      const caption = thumb.getAttribute("data-caption");
      const immagine = thumb.querySelector("img");
      if (!src || !lightboxImg) return;

      lightboxImg.src = src;
      // L'alternativa testuale deve descrivere la foto aperta, non restare fissa.
      lightboxImg.alt = immagine ? immagine.alt : caption || "";
      lightboxCaption.textContent = caption || "";
      bsModal.show();
    });
  });
}

/**
 * 6. Logica del form RSVP: sezioni condizionali, campi ripetibili, validazione
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
  const notConfiguredAlert = document.getElementById("rsvpNotConfigured");
  const presenceFeedback = document.getElementById("presenceFeedback");
  const submitBtn = document.getElementById("btnRsvpSubmit");
  const honeypot = document.getElementById("rsvpWebsite");

  if (!form) return;

  let guestCounter = 0;

  /**
   * Un campo obbligatorio dentro una sezione nascosta blocca l'invio senza che
   * il browser possa mostrare l'errore (l'elemento non e' raggiungibile): il
   * modulo sembra semplicemente non rispondere. Disattivando i campi nascosti
   * la validazione li ignora e non finiscono nemmeno nei dati inviati.
   */
  const attivaSezione = (sezione, attiva) => {
    if (!sezione) return;
    sezione.classList.toggle("d-none", !attiva);
    sezione.querySelectorAll("input, select, textarea").forEach((campo) => {
      campo.disabled = !attiva;
    });
  };

  const toggleAttendanceView = () => {
    attivaSezione(detailsYes, presenceYes.checked);
    attivaSezione(detailsNo, presenceNo.checked);
    if (presenceFeedback) presenceFeedback.classList.add("d-none");
  };

  presenceYes.addEventListener("change", toggleAttendanceView);
  presenceNo.addEventListener("change", toggleAttendanceView);

  // All'avvio nessuna delle due sezioni e' scelta: entrambe restano inerti.
  attivaSezione(detailsYes, false);
  attivaSezione(detailsNo, false);

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
        <span class="form-label mb-0 text-uppercase">Ospite Aggiuntivo #${guestCounter}</span>
        <button type="button" class="btn-close btn-sm" aria-label="Rimuovi Ospite" data-remove-target="guestBlock_${guestCounter}"></button>
      </div>
      <div class="mb-3">
        <label class="form-label" for="guestName_${guestCounter}">Nome Completo</label>
        <input type="text" class="form-control" id="guestName_${guestCounter}" name="ospite_aggiuntivo_nome_${guestCounter}" placeholder="Nome e Cognome">
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

  const mostraConferma = () => {
    form.classList.add("d-none");
    feedbackAlert.classList.remove("d-none");
    feedbackAlert.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const ripristinaPulsante = () => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Invia Conferma";
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // I bot compilano ogni campo che trovano, gli invitati non vedono questo.
    if (honeypot && honeypot.value.trim() !== "") {
      mostraConferma();
      return;
    }

    if (!form.checkValidity()) {
      form.classList.add("was-validated");

      // I radio "presenza" sono nascosti dietro i riquadri grafici: il
      // messaggio d'errore standard di Bootstrap non comparirebbe mai.
      if (presenceFeedback) {
        presenceFeedback.classList.toggle("d-none", presenceYes.checked || presenceNo.checked);
      }

      // Porta l'utente sul primo campo sbagliato invece di lasciarlo a
      // chiedersi perche' il pulsante non faccia nulla.
      const primoNonValido = form.querySelector(":invalid:not(fieldset)");
      if (primoNonValido) {
        primoNonValido.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof primoNonValido.focus === "function") {
          primoNonValido.focus({ preventScroll: true });
        }
      }
      return;
    }

    form.classList.add("was-validated");

    // Senza endpoint la risposta non arriverebbe a nessuno: lo si dice, invece
    // di mostrare una conferma che non corrisponde al vero.
    if (ENDPOINT_RSVP.trim() === "") {
      if (notConfiguredAlert) {
        notConfiguredAlert.classList.remove("d-none");
        notConfiguredAlert.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Invio in corso...';

    fetch(ENDPOINT_RSVP, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Errore durante la registrazione");
        mostraConferma();
      })
      .catch(() => {
        ripristinaPulsante();
        alert("Si è verificato un errore durante l'invio. Riprova più tardi o scrivici direttamente.");
      });
  });
}

/**
 * 7. Copia IBAN negli appunti
 */
function initCopyIban() {
  const btnCopy = document.getElementById("btnCopyIban");
  const ibanElem = document.getElementById("ibanText");
  const copyText = document.getElementById("copyText");
  const copyIcon = document.getElementById("copyIcon");

  if (!btnCopy || !ibanElem) return;

  const segnalaCopia = () => {
    const originalText = copyText.textContent;
    copyText.textContent = "Copiato!";
    copyIcon.className = "bi bi-check-lg me-1";

    setTimeout(() => {
      copyText.textContent = originalText;
      copyIcon.className = "bi bi-clipboard me-1";
    }, 2400);
  };

  btnCopy.addEventListener("click", () => {
    // Si copiano solo le lettere e le cifre: spazi e parentesi del segnaposto
    // farebbero rifiutare l'IBAN da molte app bancarie.
    const iban = ibanElem.textContent.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(iban).then(segnalaCopia).catch(copiaDiRiserva);
    } else {
      copiaDiRiserva();
    }

    // Su http:// e su alcuni browser da telefono l'API degli appunti non esiste.
    function copiaDiRiserva() {
      const appoggio = document.createElement("textarea");
      appoggio.value = iban;
      appoggio.setAttribute("readonly", "");
      appoggio.style.position = "fixed";
      appoggio.style.opacity = "0";
      document.body.appendChild(appoggio);
      appoggio.select();
      let riuscito = false;
      try {
        riuscito = document.execCommand("copy");
      } catch (e) {
        riuscito = false;
      }
      document.body.removeChild(appoggio);
      if (riuscito) {
        segnalaCopia();
      } else {
        alert("Impossibile copiare automaticamente. Seleziona il testo manualmente.");
      }
    }
  });
}

/**
 * 8. Aggiunta dell'evento al calendario (file .ics)
 */
function initAddToCalendar() {
  const btn = document.getElementById("btnAddCalendar");
  if (!btn) return;

  const perIcs = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  btn.addEventListener("click", () => {
    const righe = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mirko e Alessia//Matrimonio 2028//IT",
      "BEGIN:VEVENT",
      `UID:matrimonio-mirko-alessia-2028@${window.location.hostname || "invito"}`,
      `DTSTAMP:${perIcs(new Date().toISOString())}`,
      `DTSTART:${perIcs(DATA_MATRIMONIO_INIZIO)}`,
      `DTEND:${perIcs(DATA_MATRIMONIO_FINE)}`,
      "SUMMARY:Matrimonio di Mirko e Alessia",
      "DESCRIPTION:Rito civile alle 16:30\\, aperitivo\\, cena e festa fino alle 02:00.",
      "LOCATION:Agriturismo Solive\\, Via Calvarole 15\\, 25030 Nigoline di Corte Franca (BS)",
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    const blob = new Blob([righe.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "matrimonio-mirko-alessia.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

/**
 * Inizializzazione globale
 */
function init() {
  initEnvelopeIntro();
  initScrollIndicator();
  initCountdown();
  initScrollReveal();
  initGallery();
  initRsvpForm();
  initCopyIban();
  initAddToCalendar();
}

document.addEventListener("DOMContentLoaded", init);
