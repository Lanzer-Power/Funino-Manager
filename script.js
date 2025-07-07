document.addEventListener('DOMContentLoaded', () => {
  const teamsInput = document.getElementById('teams');
  const felderInput = document.getElementById('felder');
  const spielzeitInput = document.getElementById('spielzeit');
  const pauseInput = document.getElementById('pause');
  const startzeitInput = document.getElementById('startzeit');
  const logoInput = document.getElementById('logo');
  const logoVorschau = document.getElementById('logo-vorschau');
  const logoPDF = document.getElementById('logo-pdf');
  const erstellenBtn = document.getElementById('spielplan-erstellen');
  const resetBtn = document.getElementById('reset');
  const pdfBtn = document.getElementById('pdf-drucken');
  const ausgabe = document.getElementById('spielplan');
  const pdfBereich = document.getElementById('pdf-bereich');
  const torListe = document.getElementById('tor-liste');
  const startzeitHinweis = document.getElementById('startzeit-hinweis');
  const einzelplaeneCheckbox = document.getElementById('einzelplaene');
  const einzelplaenePDF = document.getElementById('einzelplaene-pdf');

  const torTypen = ['Minitore', 'Jugendtore'];

  logoInput.addEventListener('change', () => {
    const file = logoInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        logoVorschau.innerHTML = `<img src="${e.target.result}" alt="Logo" style="max-height: 80px;" />`;
        logoPDF.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  function aktualisiereTorTypen(felder) {
    torListe.innerHTML = '';
    for (let i = 1; i <= felder; i++) {
      const feldDiv = document.createElement('div');
      feldDiv.innerHTML = `
        <label for="tor-feld${i}">Feld ${i}:</label>
        <select id="tor-feld${i}">
          ${torTypen.map(t => `<option>${t}</option>`).join('')}
        </select>
      `;
      torListe.appendChild(feldDiv);
    }
  }

  felderInput.addEventListener('input', () => {
    const felder = parseInt(felderInput.value);
    if (!isNaN(felder) && felder > 0) {
      aktualisiereTorTypen(felder);
    }
  });

  aktualisiereTorTypen(parseInt(felderInput.value));

  function generiereSpiele(teams) {
    const spiele = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        spiele.push({ team1: teams[i], team2: teams[j] });
      }
    }

    for (let i = spiele.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spiele[i], spiele[j]] = [spiele[j], spiele[i]];
    }

    return spiele;
  }

  function berechneZeitplan(spiele, felder, spielzeit, pause) {
    const zeitplan = [];
    const [stunden, minuten] = startzeitInput.value.split(':').map(Number);
    let startZeit = new Date();
    startZeit.setHours(stunden, minuten, 0, 0);

    let feldIndex = 0;
    for (let i = 0; i < spiele.length; i++) {
      const spiel = spiele[i];
      const beginn = new Date(startZeit);
      const ende = new Date(startZeit.getTime() + spielzeit * 60000);

      const feldNummer = feldIndex + 1;
      const torTyp = document.getElementById(`tor-feld${feldNummer}`)?.value || '';
      const feldBezeichnung = `Feld ${feldNummer}${torTyp ? ` (${torTyp})` : ''}`;

      zeitplan.push({
        ...spiel,
        feld: feldBezeichnung,
        beginn: beginn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ende: ende.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      feldIndex++;
      if (feldIndex >= felder) {
        feldIndex = 0;
        startZeit = new Date(startZeit.getTime() + (spielzeit + pause) * 60000);
      }
    }

    return zeitplan;
  }

  function zeigeSpielplan(spiele, zeitplan) {
    ausgabe.innerHTML = '';

    const tabelle = document.createElement('table');
    tabelle.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Team 1</th>
          <th>Team 2</th>
          <th>Feld</th>
          <th>Start</th>
          <th>Ende</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = tabelle.querySelector('tbody');
    zeitplan.forEach((spiel, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${spiel.team1}</td>
        <td>${spiel.team2}</td>
        <td>${spiel.feld}</td>
        <td>${spiel.beginn}</td>
        <td>${spiel.ende}</td>
      `;
      tbody.appendChild(row);
    });

    ausgabe.appendChild(tabelle);

    const startzeitText = zeitplan.length > 0 ? zeitplan[0].beginn : '–';
    startzeitHinweis.textContent = `Spielbeginn: ${startzeitText} Uhr`;

    document.getElementById('zeitplan-pdf').innerHTML = ausgabe.innerHTML;
  }
  function zeigeEinzelplaene(teams, zeitplan) {
    einzelplaenePDF.innerHTML = '';

    teams.forEach(team => {
      const eigeneSpiele = zeitplan.filter(spiel =>
        spiel.team1 === team || spiel.team2 === team
      );

      if (eigeneSpiele.length === 0) return;

      const block = document.createElement('div');
      block.innerHTML = `<h3>📄 Spielplan für ${team}</h3>`;

      const tabelle = document.createElement('table');
      tabelle.innerHTML = `
        <thead>
          <tr>
            <th>Gegner</th>
            <th>Feld</th>
            <th>Start</th>
            <th>Ende</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = tabelle.querySelector('tbody');
      eigeneSpiele.forEach(spiel => {
        const gegner = spiel.team1 === team ? spiel.team2 : spiel.team1;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${gegner}</td>
          <td>${spiel.feld}</td>
          <td>${spiel.beginn}</td>
          <td>${spiel.ende}</td>
        `;
        tbody.appendChild(row);
      });

      block.appendChild(tabelle);
      einzelplaenePDF.appendChild(block);
    });
  }

  function fuellePDFKopf() {
    document.getElementById('kopf-turniername').textContent = document.getElementById('turniername').value || '';
    const datum = document.getElementById('datum').value || '';
    const ort = document.getElementById('ort').value || '';
    document.getElementById('kopf-datum-ort').textContent = `${datum} – ${ort}`;
    document.getElementById('kopf-ansprechpartner').textContent = `Ansprechpartner: ${document.getElementById('ansprechpartner').value || ''}`;
    document.getElementById('kopf-email').textContent = `E-Mail: ${document.getElementById('email').value || ''}`;
  }

  erstellenBtn.addEventListener('click', () => {
    const teams = teamsInput.value.split(',').map(t => t.trim()).filter(t => t);
    const felder = parseInt(felderInput.value);
    const spielzeit = parseInt(spielzeitInput.value);
    const pause = parseInt(pauseInput.value);

    if (teams.length < 2 || isNaN(felder) || isNaN(spielzeit)) {
      ausgabe.innerHTML = '<p>⚠️ Bitte alle Felder korrekt ausfüllen!</p>';
      return;
    }

    const spiele = generiereSpiele(teams);
    const zeitplan = berechneZeitplan(spiele, felder, spielzeit, pause);
    zeigeSpielplan(spiele, zeitplan);
    fuellePDFKopf();

    if (einzelplaeneCheckbox.checked) {
      zeigeEinzelplaene(teams, zeitplan);
    } else {
      einzelplaenePDF.innerHTML = '';
    }

    pdfBereich.style.display = 'block';
  });

  pdfBtn.addEventListener('click', () => {
    window.print();
  });

  resetBtn.addEventListener('click', () => {
    document.getElementById('turniername').value = '';
    document.getElementById('datum').value = '';
    document.getElementById('ort').value = '';
    document.getElementById('ansprechpartner').value = '';
    document.getElementById('email').value = '';
    teamsInput.value = '';
    felderInput.value = 3;
    spielzeitInput.value = 8;
    pauseInput.value = 2;
    startzeitInput.value = '10:00';
    logoInput.value = '';
    logoVorschau.innerHTML = '';
    logoPDF.src = '';
    ausgabe.innerHTML = '';
    document.getElementById('zeitplan-pdf').innerHTML = '';
    einzelplaenePDF.innerHTML = '';
    pdfBereich.style.display = 'none';
    startzeitHinweis.textContent = '';
    aktualisiereTorTypen(3);
    einzelplaeneCheckbox.checked = false;
  });
});
