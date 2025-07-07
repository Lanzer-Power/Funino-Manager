document.addEventListener('DOMContentLoaded', () => {
  const planBtn = document.getElementById('spielplan-btn');
  const ausgabe = document.getElementById('spielplan');

  planBtn.addEventListener('click', () => {
    const teamsRaw = document.getElementById('teams-eingabe').value.trim();
    if (!teamsRaw) {
      ausgabe.innerHTML = '<p>⚠️ Bitte Teamnamen eingeben!</p>';
      return;
    }

    const teamliste = teamsRaw
      .split(',')
      .map(team => team.trim())
      .filter(team => team.length > 0);

    if (teamliste.length < 2) {
      ausgabe.innerHTML = '<p>⚠️ Mindestens zwei Teams benötigt!</p>';
      return;
    }

    const paarungen = erstellePaarungen(teamliste);
    zeigeSpielplan(paarungen);
  });
  function erstellePaarungen(teams) {
    const spiele = [];

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        spiele.push({
          team1: teams[i],
          team2: teams[j]
        });
      }
    }

    // Optional: Reihenfolge mischen
    for (let i = spiele.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spiele[i], spiele[j]] = [spiele[j], spiele[i]];
    }

    return spiele;
  }
  function zeigeSpielplan(spiele) {
    const ausgabe = document.getElementById('spielplan');
    ausgabe.innerHTML = ''; // Zurücksetzen

    const planListe = document.createElement('ol');
    spiele.forEach((spiel, index) => {
      const li = document.createElement('li');
      li.textContent = `Spiel ${index + 1}: ${spiel.team1} ⚔️ ${spiel.team2}`;
      planListe.appendChild(li);
    });

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📄 Spielplan als PDF drucken';
    exportBtn.addEventListener('click', () => window.print());

    ausgabe.appendChild(planListe);
    ausgabe.appendChild(exportBtn);
  }
}); // Ende DOMContentLoaded
