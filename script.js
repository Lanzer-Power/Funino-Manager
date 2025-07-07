const form = document.getElementById("spielformular");
const torTypenDiv = document.getElementById("torTypen");

// 👥 Teams verarbeiten (z. B. FC Köln-2 → FC Köln 1, FC Köln 2)
function parseTeams(input) {
  const teams = [];
  input.split(",").forEach(entry => {
    const [name, count] = entry.trim().split("-");
    for (let i = 1; i <= parseInt(count); i++) {
      teams.push(`${name.trim()} ${i}`);
    }
  });
  return teams;
}

// ⏱️ Spielrunden & Spielzeiten berechnen
function generatePlan(teams, dauer, pause, start, rundenwahl) {
  let list = [...teams];
  if (list.length % 2 === 1) list.push("Pause");

  const totalRounds = rundenwahl === "auto" ? list.length - 1 : parseInt(rundenwahl);
  const rounds = [], times = [];

  let [hour, min] = start.split(":").map(Number);

  for (let i = 0; i < totalRounds; i++) {
    const round = [];

    for (let j = 0; j < list.length / 2; j++) {
      const t1 = list[j];
      const t2 = list[list.length - 1 - j];
      if (t1 !== "Pause" && t2 !== "Pause") round.push([t1, t2]);
    }

    rounds.push(round);

    const startStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    min += dauer;
    const endStr = `${String(hour + Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
    times.push({ start: startStr, end: endStr });

    min += pause;
    hour += Math.floor(min / 60);
    min %= 60;

    const fixed = list.shift();
    list.splice(list.length - 1, 0, fixed);
  }

  return { rounds, times };
}

// ⚖️ Spiele fair auf Felder (mit Tor-Typen) verteilen
function verteileSpieleAufFelder(rounds, feldTypen) {
  const teamStats = {};
  const belegung = [];

  rounds.forEach(runde => {
    const belegteFelder = new Set();
    const zuweisungen = [];

    runde.forEach(pair => {
      const [t1, t2] = pair;

      [t1, t2].forEach(t => {
        if (!teamStats[t]) teamStats[t] = { Minitore: 0, Jugendtore: 0 };
      });

      let bestFeld = null;
      let bestSum = Infinity;

      feldTypen.forEach((feld, index) => {
        if (belegteFelder.has(index)) return;
        const sum = teamStats[t1][feld.typ] + teamStats[t2][feld.typ];
        if (sum < bestSum) {
          bestFeld = index;
          bestSum = sum;
        }
      });

      if (bestFeld !== null) {
        belegteFelder.add(bestFeld);
        teamStats[t1][feldTypen[bestFeld].typ]++;
        teamStats[t2][feldTypen[bestFeld].typ]++;
        zuweisungen.push({
          team1: t1,
          team2: t2,
          feld: bestFeld + 1,
          torTyp: feldTypen[bestFeld].typ
        });
      }
    });

    belegung.push(zuweisungen);
  });

  return belegung;
}// 🧱 Tor-Typ-Auswahlfelder erzeugen
function generateTorTypInputs() {
  const count = parseInt(document.getElementById("felder").value);
  torTypenDiv.innerHTML = "<strong>Tor-Typ pro Spielfeld:</strong>";
  for (let i = 0; i < count; i++) {
    const label = document.createElement("label");
    label.innerText = `Feld ${i + 1}: `;
    const select = document.createElement("select");
    select.name = `torTyp${i}`;
    select.className = "tor-select";
    select.innerHTML = `
      <option value="Minitore">Minitore</option>
      <option value="Jugendtore">Jugendtore</option>
    `;
    label.appendChild(select);
    torTypenDiv.appendChild(label);
  }
}
document.getElementById("felder").addEventListener("change", generateTorTypInputs);
generateTorTypInputs();

// 📋 Spielformular absenden & Spielplan generieren
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const dauer = parseInt(document.getElementById("dauer").value);
  const pause = parseInt(document.getElementById("pause").value);
  const start = document.getElementById("startzeit").value;
  const rundenwahl = document.getElementById("runden").value;
  const felder = parseInt(document.getElementById("felder").value);
  const teams = parseTeams(document.getElementById("teams").value);
  const torTypen = Array.from(document.querySelectorAll(".tor-select")).map(sel => sel.value);

  if (teams.length < 3) {
    alert("Mindestens 3 Teams erforderlich");
    return;
  }

  const feldTypen = torTypen.map((typ, i) => ({ feld: i + 1, typ }));
  const { rounds, times } = generatePlan(teams, dauer, pause, start, rundenwahl);
  const belegung = verteileSpieleAufFelder(rounds, feldTypen);

  // 🧾 Spielplan anzeigen
  const out = document.getElementById("spielplan");
  out.innerHTML = "<h2>📋 Spielplan</h2>";
  const table = document.createElement("table");
  table.innerHTML = "<tr><th>Runde</th><th>Start</th><th>Ende</th><th>Spielpaarung</th><th>Feld</th></tr>";

  belegung.forEach((runde, i) => {
    runde.forEach(spiel => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${times[i].start}</td>
        <td>${times[i].end}</td>
        <td>${spiel.team1} vs ${spiel.team2}</td>
        <td>Feld ${spiel.feld} (${spiel.torTyp})</td>
      `;
      if ((i + 1) % 2 === 0) {
        tr.style.backgroundColor = "#f9f9f9"; // leicht graue Zeilen für gerade Runden
      }
      table.appendChild(tr);
    });
  });

  out.appendChild(table);

  // 🧢 Turnierkopf mit Titel & Logo anzeigen
  const kopf = document.getElementById("kopfbereich");
  const turniername = document.getElementById("turniername").value;
  const logoFile = document.getElementById("logoUpload").files[0];
  kopf.innerHTML = "";

  if (turniername) {
    const title = document.createElement("h2");
    title.textContent = turniername;
    kopf.appendChild(title);
  }

  if (logoFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.maxHeight = "80px";
      kopf.appendChild(img);
    };
    reader.readAsDataURL(logoFile);
  }

  generiereStatistik(belegung);
  window.currentPlan = { belegung, times, teams, turniername };
});

// 📷 Logo-Vorschau im Formular
document.getElementById("logoUpload").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.maxHeight = "80px";
      img.style.marginTop = "10px";
      const container = document.getElementById("logoVorschau");
      container.innerHTML = "";
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});
// 📊 Teamstatistik berechnen & anzeigen
function generiereStatistik(belegung) {
  const statistik = {};
  belegung.flat().forEach(({ team1, team2, torTyp }) => {
    [team1, team2].forEach(team => {
      if (!statistik[team]) statistik[team] = { Minitore: 0, Jugendtore: 0 };
      statistik[team][torTyp]++;
    });
  });

  const statDiv = document.getElementById("statistik");
  statDiv.innerHTML = "<h2>📊 Teamstatistik (Spiele pro Tor-Typ)</h2>";
  const table = document.createElement("table");
  table.innerHTML = "<tr><th>Mannschaft</th><th>Minitore</th><th>Jugendtore</th><th>Gesamt</th></tr>";

  Object.entries(statistik)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([team, werte]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${team}</td>
        <td>${werte.Minitore}</td>
        <td>${werte.Jugendtore}</td>
        <td>${werte.Minitore + werte.Jugendtore}</td>
      `;
      table.appendChild(tr);
    });

  statDiv.appendChild(table);
}

// 🖨️ PDF-/Druckexport mit Teamplänen auf separaten Seiten
function exportPDF() {
  if (!window.currentPlan) {
    alert("Bitte erst den Spielplan erstellen.");
    return;
  }

  const { belegung, times, teams, turniername } = window.currentPlan;
  const includeEinzelplaene = document.getElementById("einzelplaene").checked;

  const kopfbereich = document.getElementById("kopfbereich").innerHTML;
  const spielplanHTML = document.getElementById("spielplan").innerHTML;
  const statistikHTML = document.getElementById("statistik").innerHTML;

  let allPages = `
    <div style="text-align:center;">${kopfbereich}</div>
    ${spielplanHTML}
    ${statistikHTML}
  `;

  if (includeEinzelplaene) {
    teams.sort().forEach((team, index) => {
      const entries = [];

      belegung.forEach((runde, rundeIndex) => {
        runde.forEach(spiel => {
          if (spiel.team1 === team || spiel.team2 === team) {
            entries.push({
              runde: rundeIndex + 1,
              start: times[rundeIndex].start,
              ende: times[rundeIndex].end,
              gegner: spiel.team1 === team ? spiel.team2 : spiel.team1,
              feld: spiel.feld,
              torTyp: spiel.torTyp
            });
          }
        });
      });

      let block = `<h2>🎫 Spielplan: ${team}</h2>`;
      block += "<table><tr><th>Runde</th><th>Uhrzeit</th><th>Gegner</th><th>Feld</th></tr>";
      entries.forEach((e, i) => {
        block += `<tr style="background-color:${i % 2 === 1 ? "#f9f9f9" : "#ffffff"};">
          <td>${e.runde}</td>
          <td>${e.start} – ${e.ende}</td>
          <td>${e.gegner}</td>
          <td>Feld ${e.feld} (${e.torTyp})</td>
        </tr>`;
      });
      block += "</table>";
      allPages += `<div style="page-break-before: always;">${block}</div>`;
    });
  }

  // 💅 Style für PDF-Druck inkl. Farbe & Umrandung
  const style = `
    <style>
      body { font-family: sans-serif; margin: 0 20px; }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 20px;
      }
      th, td {
        border: 1px solid #444;
        padding: 6px;
        text-align: center;
      }
      tr:nth-child(even) td {
        background-color: #f9f9f9 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      tr:nth-child(odd) td {
        background-color: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      h2 {
        text-align: center;
        margin: 40px 0 10px;
      }
      img {
        max-height: 80px;
        display: block;
        margin: 10px auto;
      }
      div[style*="page-break-before"] {
        page-break-before: always;
      }
    </style>
  `;

  const popup = window.open('', '', 'width=800,height=600');
  popup.document.write(`<html><head><title>${turniername || "Turnierplan"}</title>${style}</head><body>${allPages}</body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

