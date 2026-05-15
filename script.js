const playButton = document.querySelector("#playDemo");
const resetButton = document.querySelector("#resetDemo");
const statusLabel = document.querySelector("#demoStatus");
const speakerLabel = document.querySelector("#demoSpeaker");
const transcript = document.querySelector("#demoTranscript");
const voiceNote = document.querySelector("#voiceNote");
const slotBusy = document.querySelector("#slotBusy");
const slotOption = document.querySelector("#slotOption");
const demoMail = document.querySelector("#demoMail");
const meter = document.querySelector(".demo-meter");
const scenarioButtons = document.querySelectorAll(".scenario-button");

const demoLines = [
  {
    speaker: "Klant",
    text: "Goedemiddag, kan ik vandaag om twee uur langskomen voor knippen?",
    status: "Beller vraagt",
    audio: "assets/audio/line-1.m4a",
  },
  {
    speaker: "Voic3Desk AI",
    text: "Ik kijk het meteen voor u na. Twee uur is helaas al bezet. Om drie uur is er nog wel ruimte. Zal ik die tijd als optie klaarzetten?",
    status: "Agenda check",
    effect: "busy",
    audio: "assets/audio/line-2.m4a",
  },
  {
    speaker: "Klant",
    text: "Ja, drie uur is goed. Mijn naam is Anouk Jansen.",
    status: "Gegevens verzamelen",
    audio: "assets/audio/line-3.m4a",
  },
  {
    speaker: "Voic3Desk AI",
    text: "Dank u wel. Ik zet dit als optie klaar. De ondernemer bevestigt dit nog definitief.",
    status: "Optie klaarzetten",
    effect: "option",
    audio: "assets/audio/line-4.m4a",
  },
  {
    speaker: "Voic3Desk AI",
    text: "De eigenaar ontvangt nu een goedkeurmail met bevestigen, afwijzen of terugbellen.",
    status: "Wacht op akkoord",
    effect: "mail",
    audio: "assets/audio/line-5.m4a",
  },
];

let isPlaying = false;
let activeUtterance = null;
let activeAudio = null;
let dutchVoice = null;

function findDutchVoice() {
  if (!("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === "nl-NL") ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("nl")) ||
    voices.find((voice) => voice.name?.toLowerCase().includes("dutch")) ||
    voices.find((voice) => voice.name?.toLowerCase().includes("nederlands")) ||
    null
  );
}

function updateVoiceState() {
  dutchVoice = findDutchVoice();

  if (!("speechSynthesis" in window)) {
    voiceNote.textContent = "Je browser ondersteunt geen spraakweergave. De tekst-demo werkt wel.";
    return;
  }

  if (dutchVoice) {
    voiceNote.textContent = "Vaste demo-audio actief: klant vrouwelijke stem, service aparte Nederlandse stem.";
  } else {
    voiceNote.textContent = "Vaste demo-audio actief. Browserstem alleen als fallback.";
  }
}

updateVoiceState();

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = updateVoiceState;
}

function resetDemo() {
  window.speechSynthesis?.cancel();
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }
  isPlaying = false;
  activeUtterance = null;
  activeAudio = null;
  playButton.disabled = false;
  statusLabel.textContent = "Klaar";
  speakerLabel.textContent = "Voic3Desk AI";
  transcript.textContent = "Klik op Start demo om het voorbeeldgesprek te starten.";
  updateVoiceState();
  slotBusy.textContent = "Bezet";
  slotBusy.className = "busy";
  slotOption.textContent = "Vrij";
  slotOption.className = "free";
  demoMail.classList.remove("is-visible");
  meter.classList.remove("is-speaking");
}

const scenarios = {
  available: {
    status: "Afspraakoptie",
    speaker: "Voic3Desk AI",
    transcript: "Ik zet een afspraakoptie klaar voor 14:00. De salon bevestigt de afspraak nog definitief.",
    option: "OPTIE - Anouk",
    optionClass: "option is-highlighted",
    busy: "Bezet",
    busyClass: "busy",
    mail: true,
  },
  busy: {
    status: "Alternatief nodig",
    speaker: "Voic3Desk AI",
    transcript: "Dat moment lijkt bezet. Ik kan een alternatief voorstellen of een terugbelverzoek klaarzetten.",
    option: "14:00 Vrij",
    optionClass: "free is-highlighted",
    busy: "Bezet - alternatief nodig",
    busyClass: "busy is-highlighted",
    mail: false,
  },
  special: {
    status: "Terugbelverzoek",
    speaker: "Voic3Desk AI",
    transcript: "Daarvoor zet ik graag een terugbelverzoek klaar, zodat de salon u persoonlijk kan adviseren.",
    option: "Terugbelverzoek",
    optionClass: "option is-highlighted",
    busy: "Bezet",
    busyClass: "busy",
    mail: true,
  },
  closed: {
    status: "Buiten openingstijd",
    speaker: "Voic3Desk AI",
    transcript: "De zaak is nu gesloten, maar ik kan uw afspraakverzoek alvast klaarzetten.",
    option: "Wacht op akkoord",
    optionClass: "option is-highlighted",
    busy: "Bezet",
    busyClass: "busy",
    mail: true,
  },
};

function runScenario(key) {
  const scenario = scenarios[key];
  if (!scenario) return;

  resetDemo();
  statusLabel.textContent = scenario.status;
  speakerLabel.textContent = scenario.speaker;
  transcript.textContent = scenario.transcript;
  slotBusy.textContent = scenario.busy;
  slotBusy.className = scenario.busyClass;
  slotOption.textContent = scenario.option;
  slotOption.className = scenario.optionClass;
  demoMail.classList.toggle("is-visible", scenario.mail);
}

function applyEffect(effect) {
  if (effect === "busy") {
    slotBusy.textContent = "Bezet - alternatief nodig";
    slotBusy.className = "busy is-highlighted";
  }

  if (effect === "option") {
    slotOption.textContent = "OPTIE - Anouk";
    slotOption.className = "option is-highlighted";
  }

  if (effect === "mail") {
    demoMail.classList.add("is-visible");
  }
}

function speakLine(line, onDone) {
  statusLabel.textContent = line.status;
  speakerLabel.textContent = line.speaker;
  transcript.textContent = line.text;
  applyEffect(line.effect);
  meter.classList.add("is-speaking");

  if (line.audio) {
    activeAudio = new Audio(line.audio);
    activeAudio.onended = onDone;
    activeAudio.onerror = () => fallbackSpeak(line, onDone);
    activeAudio.play().catch(() => fallbackSpeak(line, onDone));
    return;
  }

  fallbackSpeak(line, onDone);
}

function fallbackSpeak(line, onDone) {
  if (!("speechSynthesis" in window)) {
    window.setTimeout(onDone, Math.max(1800, line.text.length * 45));
    return;
  }

  activeUtterance = new SpeechSynthesisUtterance(line.text);
  activeUtterance.lang = "nl-NL";
  activeUtterance.voice = dutchVoice || findDutchVoice();
  activeUtterance.rate = line.speaker === "Klant" ? 1 : 0.94;
  activeUtterance.pitch = line.speaker === "Klant" ? 1.08 : 0.92;
  activeUtterance.onend = onDone;
  activeUtterance.onerror = onDone;
  window.speechSynthesis.speak(activeUtterance);
}

function playDemo() {
  if (isPlaying) return;

  resetDemo();
  isPlaying = true;
  playButton.disabled = true;

  let index = 0;

  function nextLine() {
    if (!isPlaying) return;

    if (index >= demoLines.length) {
      isPlaying = false;
      playButton.disabled = false;
      statusLabel.textContent = "Demo klaar";
      meter.classList.remove("is-speaking");
      return;
    }

    const line = demoLines[index];
    index += 1;
    speakLine(line, () => window.setTimeout(nextLine, 420));
  }

  nextLine();
}

playButton.addEventListener("click", playDemo);
resetButton.addEventListener("click", resetDemo);
scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => runScenario(button.dataset.scenario));
});

const runWaitlistDemoButton = document.querySelector("#runWaitlistDemo");
const sendOffersButton = document.querySelector("#sendOffers");
const approveBookingButton = document.querySelector("#approveBooking");
const rejectBookingButton = document.querySelector("#rejectBooking");
const customerRows = document.querySelectorAll(".customer-row");
const matchStatus = document.querySelector("#matchStatus");
const slotStatus = document.querySelector("#slotStatus");
const replyStatus = document.querySelector("#replyStatus");
const approvalStatus = document.querySelector("#approvalStatus");
const proposalTitle = document.querySelector("#proposalTitle");
const proposalCopy = document.querySelector("#proposalCopy");
const auditLog = document.querySelector("#auditLog");
const messagePreview = document.querySelector("#messagePreview");
const filledMetric = document.querySelector("#filledMetric");
const revenueMetric = document.querySelector("#revenueMetric");
const responseMetric = document.querySelector("#responseMetric");
const activeWindow = document.querySelector("#activeWindow");
const timelineStatus = document.querySelector("#timelineStatus");
const aiStatus = document.querySelector("#aiStatus");
const aiExplanation = document.querySelector("#aiExplanation");
const timelineSteps = {
  Nora: document.querySelector("#stepNora"),
  Milan: document.querySelector("#stepMilan"),
  Reserve: document.querySelector("#stepReserve"),
  Proposal: document.querySelector("#stepProposal"),
};

const waitlistCustomers = {
  Nora: {
    name: "Nora Bakker",
    service: "knippen + kleuren",
    preference: "vrijdagmiddag",
    score: 96,
    replyId: "replyNora",
  },
  Milan: {
    name: "Milan Vos",
    service: "knippen",
    preference: "vrijdag na 14:00",
    score: 88,
    replyId: "replyMilan",
  },
  Samira: {
    name: "Samira El Amrani",
    service: "knippen",
    preference: "flexibel",
    score: 81,
    replyId: "replySamira",
  },
};

let selectedWaitlistCustomer = "Nora";
let proposedCustomer = null;
let waitlistStep = 0;

function addAuditLog(message) {
  if (!auditLog) return;

  const item = document.createElement("li");
  item.textContent = message;
  auditLog.append(item);
  auditLog.scrollTop = auditLog.scrollHeight;
}

function updateWaitlistMessage() {
  if (!messagePreview) return;

  const customer = waitlistCustomers[selectedWaitlistCustomer];
  messagePreview.textContent = `Hoi ${customer.name.split(" ")[0]}, er is vrijdag om 15:00 een plek vrijgekomen bij Salon Demo. Wil je deze optie? Antwoord met JA of NEE. De afspraak is pas definitief na bevestiging van de salon.`;
}

function selectWaitlistCustomer(customerKey) {
  selectedWaitlistCustomer = customerKey;
  customerRows.forEach((row) => {
    row.classList.toggle("is-selected", row.dataset.customer === customerKey);
  });
  updateWaitlistMessage();
}

function setReply(customerKey, status, className) {
  const customer = waitlistCustomers[customerKey];
  const row = document.querySelector(`#${customer.replyId}`);
  if (!row) return;

  row.classList.remove("is-yes", "is-no", "is-reserve");
  if (className) row.classList.add(className);
  row.querySelector("strong").textContent = status;
}

function setTimelineState(currentKey, doneKeys = []) {
  Object.entries(timelineSteps).forEach(([key, element]) => {
    if (!element) return;
    element.classList.toggle("is-current", key === currentKey);
    element.classList.toggle("is-done", doneKeys.includes(key));
  });
}

function explainAI(status, explanation) {
  if (aiStatus) aiStatus.textContent = status;
  if (aiExplanation) aiExplanation.textContent = explanation;
}

function runWaitlistDemo() {
  if (!slotStatus) return;

  waitlistStep = 0;
  proposedCustomer = null;
  selectedWaitlistCustomer = "Nora";
  updateWaitlistMessage();
  slotStatus.textContent = "Wacht op matching";
  matchStatus.textContent = "0 geselecteerd";
  replyStatus.textContent = "Nog geen aanbod";
  approvalStatus.textContent = "Geen voorstel";
  proposalTitle.textContent = "Nog geen positieve reactie";
  proposalCopy.textContent = "Klik op “Volgende stap” om te zien hoe de AI van annulering naar voorstelboeking gaat.";
  approveBookingButton.disabled = true;
  rejectBookingButton.disabled = true;
  sendOffersButton.disabled = false;
  sendOffersButton.textContent = "Volgende stap";
  filledMetric.textContent = "1";
  revenueMetric.textContent = "€45";
  responseMetric.textContent = "42%";
  activeWindow.textContent = "Nog niet gestart";
  timelineStatus.textContent = "Nog niet gestart";
  setReply("Nora", "Wacht", "");
  setReply("Milan", "Wacht", "");
  setReply("Samira", "Wacht", "");
  customerRows.forEach((row) => row.classList.toggle("is-selected", row.dataset.customer === "Nora"));
  setTimelineState("", []);
  auditLog.innerHTML = "<li>Geannuleerd slot ontvangen.</li><li>Wacht op matching.</li>";
  explainAI("Wacht", "De demo staat klaar. Klik op “Volgende stap” om eerst de annulering te analyseren.");
}

function waitlistStepOne() {
  slotStatus.textContent = "Annulering verwerkt";
  matchStatus.textContent = "0 geselecteerd";
  activeWindow.textContent = "Nog geen SMS";
  timelineStatus.textContent = "Annulering";
  revenueMetric.textContent = "€85";
  auditLog.innerHTML = "<li>Lisa de Jong annuleerde vrijdag 15 maart 2030, 15:00 - 16:00.</li>";
  addAuditLog("Vrij slot aangemaakt: knippen + kleuren, waarde €85.");
  explainAI("Annulering gelezen", "AI herkent: Lisa de Jong annuleerde vrijdag 15 maart 2030 om 15:00. Het systeem maakt precies dat uur beschikbaar voor herstel.");
}

function waitlistStepTwo() {
  slotStatus.textContent = "Matches gevonden";
  matchStatus.textContent = "3 geselecteerd";
  replyStatus.textContent = "Klaar voor exclusief venster";
  activeWindow.textContent = "Nora: 10 min";
  timelineStatus.textContent = "Nora eerst";
  setTimelineState("Nora", []);
  addAuditLog("Matching uitgevoerd op service, dag, tijdvenster en urgentie.");
  addAuditLog("Beste match: Nora Bakker, score 96%.");
  proposalCopy.textContent = "Eerst krijgt de beste match 10 minuten exclusief. Te late reacties worden reserve en de klant krijgt pas bevestiging na jouw akkoord.";
  explainAI("Matchscore berekend", "AI vergelijkt de wachtlijst met het vrijgekomen slot: behandeling, voorkeursdag, tijdvenster, urgentie en notities.");
}

function waitlistStepThree() {
  selectedWaitlistCustomer = "Nora";
  updateWaitlistMessage();
  slotStatus.textContent = "Nora actief";
  replyStatus.textContent = "Nora heeft 10 min";
  activeWindow.textContent = "Nora: 10 min actief";
  timelineStatus.textContent = "Exclusief venster";
  addAuditLog("SMS naar Nora verstuurd. Exclusieve reactietijd: 10 minuten.");
  explainAI("SMS naar Nora", "AI stuurt nog geen bevestiging, alleen een tijdelijk aanbod: reageer binnen 10 minuten met JA of NEE.");
}

function waitlistStepFour() {
  setReply("Nora", "Geen reactie binnen 10 min", "is-no");
  selectedWaitlistCustomer = "Milan";
  updateWaitlistMessage();
  slotStatus.textContent = "Milan actief";
  replyStatus.textContent = "Nora verlopen, Milan actief";
  activeWindow.textContent = "Milan: 10 min actief";
  timelineStatus.textContent = "Doorgezet naar Milan";
  customerRows.forEach((row) => row.classList.toggle("is-selected", row.dataset.customer === "Milan"));
  setTimelineState("Milan", ["Nora"]);
  addAuditLog("Nora reageerde niet binnen 10 minuten. SMS doorgestuurd naar Milan.");
  explainAI("Doorgezet", "AI laat Nora's exclusieve venster verlopen en stuurt hetzelfde slot naar de volgende beste match: Milan.");
}

function waitlistStepFive() {
  setReply("Nora", "Late reactie - reserve", "is-reserve");
  replyStatus.textContent = "Reserve-JA ontvangen";
  timelineStatus.textContent = "Reserve wacht";
  setTimelineState("Reserve", ["Nora"]);
  responseMetric.textContent = "67%";
  addAuditLog("Nora antwoordde later alsnog JA tijdens Milan's venster. Status: reserve, geen boeking zolang Milan actief is.");
  explainAI("Late reactie herkend", "AI ziet dat Nora te laat is voor haar eigen venster. Omdat Milan nu actief is, wordt Nora reserve en krijgt zij nog geen belofte.");
}

function waitlistStepSix() {
  proposedCustomer = waitlistCustomers.Nora;
  setReply("Milan", "Geen reactie binnen 10 min", "is-no");
  slotStatus.textContent = "Voorstel klaar";
  replyStatus.textContent = "Milan verlopen, reserve wint";
  approvalStatus.textContent = "Akkoord nodig";
  activeWindow.textContent = "Voorstel: Nora";
  timelineStatus.textContent = "Voorstel naar Nora";
  proposalTitle.textContent = "Voorstel: Nora Bakker om 15:00";
  proposalCopy.textContent = "Milan reageerde niet binnen zijn venster. Omdat Nora al als reserve positief reageerde, gaat het slot direct naar Nora als voorgestelde boeking. Nog niet definitief.";
  approveBookingButton.disabled = false;
  rejectBookingButton.disabled = false;
  setTimelineState("Proposal", ["Nora", "Milan", "Reserve"]);
  addAuditLog("Milan reageerde niet binnen 10 minuten. Systeem checkt reserve-reacties voordat Samira wordt benaderd.");
  addAuditLog("Oudste reserve-reactie gevonden: Nora. Voorgestelde boeking aangemaakt voor akkoord.");
  explainAI("Voorstel gemaakt", "AI benadert Samira niet, want er ligt al een reserve-reactie. Nora wordt voorstelboeking, maar nog steeds niet definitief.");
}

function sendWaitlistOffers() {
  if (!slotStatus || waitlistStep >= 6) return;

  waitlistStep += 1;
  const steps = [
    waitlistStepOne,
    waitlistStepTwo,
    waitlistStepThree,
    waitlistStepFour,
    waitlistStepFive,
    waitlistStepSix,
  ];
  steps[waitlistStep - 1]();

  if (waitlistStep >= 6) {
    sendOffersButton.disabled = true;
    sendOffersButton.textContent = "Wacht op akkoord";
  }
}

function approveWaitlistBooking() {
  if (!proposedCustomer) return;

  approvalStatus.textContent = "Goedgekeurd";
  slotStatus.textContent = "Gevuld";
  proposalTitle.textContent = "Bevestigd: Nora Bakker";
  proposalCopy.textContent = "De salon heeft goedgekeurd. Nora ontvangt nu de definitieve SMS-bevestiging. Samira is niet benaderd, omdat Nora als reserve won.";
  approveBookingButton.disabled = true;
  rejectBookingButton.disabled = true;
  filledMetric.textContent = "2";
  revenueMetric.textContent = "€170";
  addAuditLog("Eigenaar keurde de voorgestelde boeking goed.");
  addAuditLog("Definitieve SMS-bevestiging naar Nora verstuurd.");
  explainAI("Afgerond", "Pas na jouw akkoord stuurt het systeem de definitieve bevestiging. Tot dit moment was het alleen een voorstel.");
}

function rejectWaitlistBooking() {
  if (!proposedCustomer) return;

  approvalStatus.textContent = "Afgewezen";
  proposalTitle.textContent = "Voorstel afgewezen";
  proposalCopy.textContent = "De klant krijgt geen definitieve bevestiging. Het slot blijft beschikbaar voor handmatige opvolging of een nieuwe wachtronde.";
  approveBookingButton.disabled = true;
  rejectBookingButton.disabled = true;
  addAuditLog("Eigenaar wees de voorgestelde boeking af.");
  explainAI("Afgewezen", "Omdat de ondernemer afwijst, krijgt niemand automatisch een definitieve boeking. Het slot kan opnieuw of handmatig worden opgepakt.");
}

customerRows.forEach((row) => {
  row.addEventListener("click", () => selectWaitlistCustomer(row.dataset.customer));
});

runWaitlistDemoButton?.addEventListener("click", runWaitlistDemo);
sendOffersButton?.addEventListener("click", sendWaitlistOffers);
approveBookingButton?.addEventListener("click", approveWaitlistBooking);
rejectBookingButton?.addEventListener("click", rejectWaitlistBooking);
updateWaitlistMessage();

const agendaSlots = document.querySelector("#agendaSlots");
const agendaStatus = document.querySelector("#agendaStatus");
const addOptionButton = document.querySelector("#addOption");
const addStaffButton = document.querySelector("#addStaff");
const addBlockButton = document.querySelector("#addBlock");
const startWaitlistFromAgendaButton = document.querySelector("#startWaitlistFromAgenda");
const humanStatus = document.querySelector("#humanStatus");
const humanTitle = document.querySelector("#humanTitle");
const humanCopy = document.querySelector("#humanCopy");
const confirmHumanActionButton = document.querySelector("#confirmHumanAction");
const dismissHumanActionButton = document.querySelector("#dismissHumanAction");
const agendaLog = document.querySelector("#agendaLog");
const chairCountInput = document.querySelector("#chairCount");
const openTimeInput = document.querySelector("#openTime");
const closeTimeInput = document.querySelector("#closeTime");
const cutDurationInput = document.querySelector("#cutDuration");
const capacityStatus = document.querySelector("#capacityStatus");
const capacityExplanation = document.querySelector("#capacityExplanation");
const runCapacityCheckButton = document.querySelector("#runCapacityCheck");

let draggedAppointment = null;
let pendingHumanAction = null;
let newOptionCounter = 1;

function addAgendaLog(message) {
  if (!agendaLog) return;

  const item = document.createElement("li");
  item.textContent = message;
  agendaLog.append(item);
  agendaLog.scrollTop = agendaLog.scrollHeight;
}

function setAgendaStatus(message) {
  if (agendaStatus) agendaStatus.textContent = message;
}

function requestHumanAction(status, title, copy, onConfirm) {
  pendingHumanAction = onConfirm;
  humanStatus.textContent = status;
  humanTitle.textContent = title;
  humanCopy.textContent = copy;
  confirmHumanActionButton.disabled = false;
  dismissHumanActionButton.disabled = false;
}

function clearHumanAction() {
  pendingHumanAction = null;
  humanStatus.textContent = "Geen actie";
  humanTitle.textContent = "AI doet het voorwerk";
  humanCopy.textContent = "Opties, verplaatsingen en annuleringen worden klaargezet. Definitieve klantberichten gaan pas na jouw akkoord.";
  confirmHumanActionButton.disabled = true;
  dismissHumanActionButton.disabled = true;
}

function getSlotForCard(card) {
  return card?.closest(".agenda-slot");
}

function updateAppointmentTime(card) {
  const slot = getSlotForCard(card);
  if (!slot) return;

  const current = slot.dataset.time;
  const nextHour = String(Number(current.slice(0, 2)) + 1).padStart(2, "0") + ":00";
  const small = card.querySelector("small");
  if (small && !card.classList.contains("is-blocked")) {
    const service = card.classList.contains("is-option") ? "Kleuren • wacht op akkoord" : "Knippen";
    small.textContent = `${service} • ${current} - ${nextHour}`;
  }
}

function moveAppointment(card, direction) {
  const slot = getSlotForCard(card);
  if (!slot) return;

  const slots = Array.from(document.querySelectorAll(".agenda-slot"));
  const currentIndex = slots.indexOf(slot);
  const target = slots[currentIndex + direction];
  if (!target) return;

  const targetZone = target.querySelector(".slot-dropzone");
  if (targetZone.children.length > 0) {
    setAgendaStatus("Doel bezet");
    addAgendaLog(`Verplaatsen naar ${target.dataset.time} geblokkeerd: tijdslot is bezet.`);
    return;
  }

  targetZone.append(card);
  updateAppointmentTime(card);
  setAgendaStatus(`Verplaatst naar ${target.dataset.time}`);
  addAgendaLog(`${card.querySelector("strong")?.textContent} verplaatst naar ${target.dataset.time}.`);
}

function createAppointmentCard({ type, name, detail }) {
  const card = document.createElement("article");
  card.className = `appointment-card ${type}`;
  card.draggable = true;
  card.dataset.appointment = `new-${Date.now()}`;
  card.innerHTML = `
    <span>${type === "is-blocked" ? "BLOKTIJD" : "OPTIE"}</span>
    <strong>${name}</strong>
    <small>${detail}</small>
    <div class="appointment-actions">
      <button type="button" data-move="-1">Omhoog</button>
      <button type="button" data-move="1">Omlaag</button>
      ${type === "is-option" ? '<button type="button" data-action="approve">Bevestigen</button><button type="button" data-action="reject">Wijs af</button>' : ""}
    </div>
  `;
  bindAgendaCard(card);
  return card;
}

function firstEmptyDropzone() {
  return Array.from(document.querySelectorAll(".slot-dropzone")).find((zone) => zone.children.length === 0);
}

function bindAgendaCard(card) {
  card.addEventListener("dragstart", () => {
    draggedAppointment = card;
    setAgendaStatus("Sleep naar tijdslot");
  });

  card.addEventListener("dragend", () => {
    draggedAppointment = null;
    document.querySelectorAll(".slot-dropzone").forEach((zone) => zone.classList.remove("is-over"));
  });
}

function bindAgendaCards() {
  document.querySelectorAll(".appointment-card").forEach(bindAgendaCard);
}

if (agendaSlots) {
  bindAgendaCards();

  document.querySelectorAll(".slot-dropzone").forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("is-over");
    });

    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-over");
      if (!draggedAppointment || zone.children.length > 0) return;

      zone.append(draggedAppointment);
      updateAppointmentTime(draggedAppointment);
      const slot = zone.closest(".agenda-slot");
      setAgendaStatus(`Verplaatst naar ${slot.dataset.time}`);
      addAgendaLog(`${draggedAppointment.querySelector("strong")?.textContent} gesleept naar ${slot.dataset.time}.`);
    });
  });

  agendaSlots.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    const card = event.target.closest(".appointment-card");
    if (!button || !card) return;

    const move = button.dataset.move;
    const action = button.dataset.action;

    if (move) {
      moveAppointment(card, Number(move));
    }

    if (action === "approve") {
      requestHumanAction(
        "Akkoord nodig",
        `Optie goedkeuren: ${card.querySelector("strong")?.textContent}`,
        "Na bevestiging wordt de afspraak definitief en krijgt de klant een SMS-bevestiging.",
        () => {
          card.classList.remove("is-option");
          card.classList.add("is-confirmed");
          card.querySelector("span").textContent = "BEVESTIGD";
          setAgendaStatus("Optie bevestigd");
          addAgendaLog(`${card.querySelector("strong")?.textContent} definitief bevestigd na menselijk akkoord.`);
        }
      );
    }

    if (action === "reject") {
      requestHumanAction(
        "Afwijzen?",
        `Optie afwijzen: ${card.querySelector("strong")?.textContent}`,
        "Na afwijzen wordt de optie verwijderd. De klant krijgt geen definitieve bevestiging.",
        () => {
          addAgendaLog(`${card.querySelector("strong")?.textContent} optie afgewezen en verwijderd.`);
          card.remove();
          setAgendaStatus("Optie afgewezen");
        }
      );
    }

    if (action === "cancel") {
      requestHumanAction(
        "Annulering",
        `Afspraak annuleren: ${card.querySelector("strong")?.textContent}`,
        "Na akkoord wordt het slot vrijgemaakt en kan de wachtlijstmodule worden gestart.",
        () => {
          const slot = getSlotForCard(card);
          addAgendaLog(`${card.querySelector("strong")?.textContent} geannuleerd. Slot ${slot.dataset.time} is vrij.`);
          card.remove();
          setAgendaStatus("Slot vrijgekomen");
        }
      );
    }
  });
}

addOptionButton?.addEventListener("click", () => {
  const zone = firstEmptyDropzone();
  if (!zone) return;

  const slot = zone.closest(".agenda-slot");
  const card = createAppointmentCard({
    type: "is-option",
    name: `Nieuwe optie ${newOptionCounter}`,
    detail: `Wacht op akkoord • ${slot.dataset.time}`,
  });
  newOptionCounter += 1;
  zone.append(card);
  setAgendaStatus("Optie toegevoegd");
  addAgendaLog(`Nieuwe optie toegevoegd op ${slot.dataset.time}.`);
});

addStaffButton?.addEventListener("click", () => {
  const staffList = document.querySelector(".staff-list");
  const chairStrip = document.querySelector(".chair-strip");
  const newName = `Medewerker ${newOptionCounter}`;

  const chip = document.createElement("span");
  chip.textContent = `Stoel · ${newName}`;
  staffList?.append(chip);

  const stripChip = document.createElement("span");
  stripChip.textContent = `Stoel · ${newName}`;
  chairStrip?.append(stripChip);

  setAgendaStatus("Medewerker toegevoegd");
  addAgendaLog(`${newName} toegevoegd aan capaciteit.`);
});

addBlockButton?.addEventListener("click", () => {
  const zone = firstEmptyDropzone();
  if (!zone) return;

  const slot = zone.closest(".agenda-slot");
  zone.append(createAppointmentCard({
    type: "is-blocked",
    name: "Bloktijd",
    detail: "Niet beschikbaar",
  }));
  setAgendaStatus("Bloktijd toegevoegd");
  addAgendaLog(`Bloktijd toegevoegd op ${slot.dataset.time}.`);
});

startWaitlistFromAgendaButton?.addEventListener("click", () => {
  setAgendaStatus("Wachtlijst gestart");
  requestHumanAction(
    "Wachtlijst",
    "Vrijgekomen slot naar wachtlijst",
    "De AI zoekt passende klanten en stuurt eerst een tijdelijk SMS-aanbod. Definitieve boeking blijft op akkoord wachten.",
    () => {
      addAgendaLog("Wachtlijstflow handmatig gestart vanuit Agenda Light.");
      window.location.hash = "wachtlijst";
    }
  );
});

confirmHumanActionButton?.addEventListener("click", () => {
  if (pendingHumanAction) pendingHumanAction();
  clearHumanAction();
});

dismissHumanActionButton?.addEventListener("click", () => {
  addAgendaLog("Menselijke actie geannuleerd.");
  clearHumanAction();
});

function updateCapacityExplanation(hasRunCheck = false) {
  if (!chairCountInput || !capacityStatus || !capacityExplanation) return;

  const chairs = Number(chairCountInput.value || 1);
  const duration = Number(cutDurationInput.value || 45);
  const open = openTimeInput.value || "09:00";
  const close = closeTimeInput.value || "18:00";
  capacityStatus.textContent = "Zelf in te stellen";

  if (hasRunCheck) {
    capacityExplanation.textContent = `Slimme check voor 15:00: zaak open van ${open} tot ${close}, knippen duurt ${duration} minuten en capaciteit is ingesteld op ${chairs}. Past het duidelijk? Dan wordt een optie klaargezet. Bij twijfel volgt een terugbelverzoek.`;
    addAgendaLog(`Beschikbaarheidscheck: capaciteit ${chairs}, knippen ${duration} min, open ${open}-${close}.`);
  } else {
    capacityExplanation.textContent = `De AI kijkt naar je openingstijden, bestaande afspraken, medewerkers en de duur die jij per dienst hebt ingesteld. Jij bepaalt: knippen duurt bijvoorbeeld ${duration} minuten.`;
  }
}

[chairCountInput, openTimeInput, closeTimeInput, cutDurationInput].forEach((input) => {
  input?.addEventListener("input", () => updateCapacityExplanation(false));
});

runCapacityCheckButton?.addEventListener("click", () => updateCapacityExplanation(true));
updateCapacityExplanation(false);
