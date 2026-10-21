// =========================================================
// QUICK SCOUT VOLLEY PRO - MOTORE PRINCIPALE PWA
// =========================================================

const Fondamentali = {
  battuta: { id: 'battuta', nome: 'Battuta', sigla: 'BAT', icona: 'icona_battuta.png' },
  ricezione: { id: 'ricezione', nome: 'Ricezione', sigla: 'RIC', icona: 'icona_ricezione.png' },
  alzata: { id: 'alzata', nome: 'Alzata', sigla: 'ALZ', icona: 'icona_alzata.png' },
  attacco: { id: 'attacco', nome: 'Attacco', sigla: 'ATT', icona: 'icona_attacco.png' },
  muro: { id: 'muro', nome: 'Muro', sigla: 'MUR', icona: 'icona_muro.png' },
  difesa: { id: 'difesa', nome: 'Difesa', sigla: 'DIF', icona: 'icona_difesa.png' }
};

const Valutazioni = {
  doppioPiu: { id: '++', label: '++', nome: 'Punto / Perfetto', colore: '#2E7D32' },
  piu: { id: '+', label: '+', nome: 'Positivo', colore: '#7CB342' },
  neutro: { id: '!', label: '!', nome: 'Neutro', colore: '#FFA000' },
  meno: { id: '-', label: '-', nome: 'Negativo', colore: '#E65100' },
  doppioMeno: { id: '==', label: '==', nome: 'Errore', colore: '#C62828' }
};

class ScoutApp {
  constructor() {
    this.maxSostituzioni = 8; // Regola 8 sostituzioni per set

    this.squadraCasa = "Volley Club Pro";
    this.squadraOspite = "Polisportiva Riva";
    this.dataPartita = new Date().toLocaleDateString('it-IT');

    this.puntiCasa = 0;
    this.puntiOspite = 0;
    this.setCorrente = 1;
    this.setVintiCasa = 0;
    this.setVintiOspite = 0;
    this.haPallaCasa = true;

    this.timeoutCasa = 0;
    this.timeoutOspite = 0;
    this.sostituzioniCasa = 0;

    this.fondamentaleSelezionato = 'battuta';
    this.giocatoreAttivo = null;
    this.campoInvertito = false;

    this.numeroPunto = 1;
    this.numeroScambio = 0;

    // Roster 10 atleti
    this.tuttiGiocatori = [
      { id: 1, numero: 1, nome: 'Marco', cognome: 'Rossi', ruolo: 'P' },
      { id: 2, numero: 4, nome: 'Luca', cognome: 'Bianchi', ruolo: 'S' },
      { id: 3, numero: 7, nome: 'Matteo', cognome: 'Ferrari', ruolo: 'C' },
      { id: 4, numero: 9, nome: 'Andrea', cognome: 'Esposito', ruolo: 'O' },
      { id: 5, numero: 10, nome: 'Davide', cognome: 'Romano', ruolo: 'S' },
      { id: 6, numero: 13, nome: 'Gabriele', cognome: 'Colombo', ruolo: 'C' },
      { id: 7, numero: 16, nome: 'Simone', cognome: 'Ricci', ruolo: 'L' },
      { id: 8, numero: 2, nome: 'Filippo', cognome: 'Marino', ruolo: 'P' },
      { id: 9, numero: 11, nome: 'Lorenzo', cognome: 'Greco', ruolo: 'S' },
      { id: 10, numero: 14, nome: 'Edoardo', cognome: 'Bruno', ruolo: 'C' }
    ];

    // Formazione campo 6 zone [Z1, Z2, Z3, Z4, Z5, Z6]
    this.formazione = [
      this.tuttiGiocatori[0], // Z1 (Servizio)
      this.tuttiGiocatori[1], // Z2
      this.tuttiGiocatori[2], // Z3
      this.tuttiGiocatori[3], // Z4
      this.tuttiGiocatori[4], // Z5
      this.tuttiGiocatori[5]  // Z6
    ];

    this.giocatoreAttivo = this.formazione[0];
    this.storicoEventi = [];
    this.traiettoria = { xInizio: null, yInizio: null, xFine: null, yFine: null };

    this.initLocalStorage();
    this.initCanvasCampetto();
    this.initRuotaInteractive();
    this.initServiceWorker();
    this.render();
  }

  // =========================================================
  // PERSISTENZA LOCAL STORAGE
  // =========================================================
  initLocalStorage() {
    const saved = localStorage.getItem('quickscout_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.squadraCasa = data.squadraCasa || this.squadraCasa;
        this.squadraOspite = data.squadraOspite || this.squadraOspite;
        this.puntiCasa = data.puntiCasa ?? 0;
        this.puntiOspite = data.puntiOspite ?? 0;
        this.setCorrente = data.setCorrente ?? 1;
        this.setVintiCasa = data.setVintiCasa ?? 0;
        this.setVintiOspite = data.setVintiOspite ?? 0;
        this.haPallaCasa = data.haPallaCasa ?? true;
        this.timeoutCasa = data.timeoutCasa ?? 0;
        this.sostituzioniCasa = data.sostituzioniCasa ?? 0;
        this.tuttiGiocatori = data.tuttiGiocatori || this.tuttiGiocatori;
        if (data.formazioneIds) {
          this.formazione = data.formazioneIds.map(id => this.tuttiGiocatori.find(g => g.id === id) || this.tuttiGiocatori[0]);
        }
        this.storicoEventi = data.storicoEventi || [];
        this.giocatoreAttivo = this.formazione[0];
      } catch (e) {
        console.error('Errore ripristino dati:', e);
      }
    }
  }

  salvaStato() {
    const data = {
      squadraCasa: this.squadraCasa,
      squadraOspite: this.squadraOspite,
      puntiCasa: this.puntiCasa,
      puntiOspite: this.puntiOspite,
      setCorrente: this.setCorrente,
      setVintiCasa: this.setVintiCasa,
      setVintiOspite: this.setVintiOspite,
      haPallaCasa: this.haPallaCasa,
      timeoutCasa: this.timeoutCasa,
      sostituzioniCasa: this.sostituzioniCasa,
      tuttiGiocatori: this.tuttiGiocatori,
      formazioneIds: this.formazione.map(g => g.id),
      storicoEventi: this.storicoEventi
    };
    localStorage.setItem('quickscout_state', JSON.stringify(data));
  }

  // =========================================================
  // LOGICA PUNTEGGI & ROTAZIONI
  // =========================================================
  assegnaPuntoCasa() {
    this.puntiCasa++;
    this.numeroPunto++;
    this.numeroScambio = 0;
    if (!this.haPallaCasa) {
      this.haPallaCasa = true;
      this.eseguiRotazione();
    }
    this.fondamentaleSelezionato = 'battuta';
    this.giocatoreAttivo = this.formazione[0];
    this.verificaFineSet();
    this.salvaStato();
    this.render();
  }

  puntoAvversario() {
    this.puntiOspite++;
    this.haPallaCasa = false;
    this.numeroPunto++;
    this.numeroScambio = 0;
    this.fondamentaleSelezionato = 'ricezione';
    this.giocatoreAttivo = this.formazione[5]; // Ricezione posto 6
    this.verificaFineSet();
    this.salvaStato();
    this.render();
  }

  erroreAvversario() {
    this.puntiCasa++;
    this.numeroPunto++;
    this.numeroScambio = 0;
    if (!this.haPallaCasa) {
      this.haPallaCasa = true;
      this.eseguiRotazione();
    }
    this.fondamentaleSelezionato = 'battuta';
    this.giocatoreAttivo = this.formazione[0];
    this.verificaFineSet();
    this.salvaStato();
    this.render();
  }

  correggiPunti(deltaCasa, deltaOspite) {
    this.puntiCasa = Math.max(0, this.puntiCasa + deltaCasa);
    this.puntiOspite = Math.max(0, this.puntiOspite + deltaOspite);
    this.salvaStato();
    this.render();
  }

  eseguiRotazione() {
    const [p1, p2, p3, p4, p5, p6] = this.formazione;
    this.formazione = [p2, p3, p4, p5, p6, p1];
    this.giocatoreAttivo = this.formazione[0];
    this.salvaStato();
    this.render();
  }

  eseguiRotazioneInversa() {
    const [p1, p2, p3, p4, p5, p6] = this.formazione;
    this.formazione = [p6, p1, p2, p3, p4, p5];
    this.giocatoreAttivo = this.formazione[0];
    this.salvaStato();
    this.render();
  }

  verificaFineSet() {
    const target = this.setCorrente === 5 ? 15 : 25;
    if ((this.puntiCasa >= target || this.puntiOspite >= target) && Math.abs(this.puntiCasa - this.puntiOspite) >= 2) {
      if (this.puntiCasa > this.puntiOspite) {
        this.setVintiCasa++;
      } else {
        this.setVintiOspite++;
      }
      this.puntiCasa = 0;
      this.puntiOspite = 0;
      this.setCorrente++;
      this.timeoutCasa = 0;
      this.timeoutOspite = 0;
      this.sostituzioniCasa = 0;
      this.campoInvertito = !this.campoInvertito;
    }
  }

  // =========================================================
  // LE 2 AZIONI SPECIALI DI ATTACCO
  // =========================================================

  // 1) MANI OUT (Palla tocca il muro ed esce: PUNTO NOSTRO!)
  registraAttaccoManiOut() {
    const g = this.giocatoreAttivo || this.formazione[3] || this.tuttiGiocatori[0];
    this.puntiCasa++;
    const eraNostro = this.haPallaCasa;
    if (!eraNostro) {
      this.haPallaCasa = true;
      this.eseguiRotazione();
    }

    const evento = {
      id: Date.now(),
      set: this.setCorrente,
      punto: this.numeroPunto++,
      scambio: this.numeroScambio++,
      giocatore: g,
      fondamentale: 'attacco',
      valutazione: '++',
      speciale: 'MANI OUT',
      puntiCasa: this.puntiCasa,
      puntiOspite: this.puntiOspite,
      orario: new Date().toLocaleTimeString('it-IT')
    };

    this.storicoEventi.push(evento);
    this.fondamentaleSelezionato = 'battuta';
    this.giocatoreAttivo = this.formazione[0];
    this.numeroScambio = 0;
    this.cancellaTraiettoria();
    this.verificaFineSet();
    this.salvaStato();
    this.render();
  }

  // 2) TOCCATO MURO / RIGIOCANO (Palla viva nel campo avversario, azione continua!)
  registraAttaccoToccatoMuro() {
    const g = this.giocatoreAttivo || this.formazione[3] || this.tuttiGiocatori[0];

    const evento = {
      id: Date.now(),
      set: this.setCorrente,
      punto: this.numeroPunto,
      scambio: this.numeroScambio++,
      giocatore: g,
      fondamentale: 'attacco',
      valutazione: '!',
      speciale: 'TOCCATO MURO (RIGIOCANO)',
      puntiCasa: this.puntiCasa,
      puntiOspite: this.puntiOspite,
      orario: new Date().toLocaleTimeString('it-IT')
    };

    this.storicoEventi.push(evento);
    this.fondamentaleSelezionato = 'muro';
    this.cancellaTraiettoria();
    this.salvaStato();
    this.render();
  }

  // =========================================================
  // REGISTRAZIONE EVENTO STANDARD (Ruota o Tastierino)
  // =========================================================
  registraEventoStandard(valutazioneId, fondamentaleSpecifico = null) {
    const g = this.giocatoreAttivo || this.formazione[0] || this.tuttiGiocatori[0];
    const fond = fondamentaleSpecifico || this.fondamentaleSelezionato;
    let chiudePunto = false;

    if (valutazioneId === '++' && (fond === 'battuta' || fond === 'attacco' || fond === 'muro')) {
      this.puntiCasa++;
      chiudePunto = true;
      if (!this.haPallaCasa) {
        this.haPallaCasa = true;
        this.eseguiRotazione();
      }
    } else if (valutazioneId === '==') {
      this.puntiOspite++;
      chiudePunto = true;
      this.haPallaCasa = false;
    }

    const evento = {
      id: Date.now(),
      set: this.setCorrente,
      punto: this.numeroPunto,
      scambio: this.numeroScambio++,
      giocatore: g,
      fondamentale: fond,
      valutazione: valutazioneId,
      speciale: null,
      puntiCasa: this.puntiCasa,
      puntiOspite: this.puntiOspite,
      orario: new Date().toLocaleTimeString('it-IT')
    };

    this.storicoEventi.push(evento);

    if (chiudePunto) {
      this.numeroPunto++;
      this.numeroScambio = 0;
      this.fondamentaleSelezionato = this.haPallaCasa ? 'battuta' : 'ricezione';
      this.giocatoreAttivo = this.haPallaCasa ? this.formazione[0] : this.formazione[5];
      this.verificaFineSet();
    } else {
      if (fond === 'battuta') this.fondamentaleSelezionato = 'difesa';
      else if (fond === 'ricezione') {
        this.fondamentaleSelezionato = 'alzata';
        this.giocatoreAttivo = this.formazione.find(p => p.ruolo === 'P') || this.formazione[2];
      }
      else if (fond === 'alzata') {
        this.fondamentaleSelezionato = 'attacco';
        this.giocatoreAttivo = this.formazione[3]; // posto 4
      }
      else if (fond === 'attacco') this.fondamentaleSelezionato = 'difesa';
      else if (fond === 'difesa' || fond === 'muro') this.fondamentaleSelezionato = 'alzata';
    }

    this.cancellaTraiettoria();
    this.chiudiRuota();
    this.salvaStato();
    this.render();
  }

  annullaUltimaAzione() {
    if (this.storicoEventi.length === 0) return;
    this.storicoEventi.pop();

    if (this.storicoEventi.length > 0) {
      const u = this.storicoEventi[this.storicoEventi.length - 1];
      this.puntiCasa = u.puntiCasa;
      this.puntiOspite = u.puntiOspite;
      this.setCorrente = u.set;
      this.numeroPunto = u.punto;
      this.numeroScambio = u.scambio + 1;
      this.fondamentaleSelezionato = u.fondamentale;
      this.giocatoreAttivo = u.giocatore;
    } else {
      this.puntiCasa = 0;
      this.puntiOspite = 0;
      this.numeroPunto = 1;
      this.numeroScambio = 0;
      this.fondamentaleSelezionato = 'battuta';
      this.giocatoreAttivo = this.formazione[0];
    }

    this.salvaStato();
    this.render();
  }

  // =========================================================
  // GESTIONE SOSTITUZIONI (MAX 8 PER SET)
  // =========================================================
  eseguiSostituzione(indexZona, idNuovoGiocatore) {
    const nuovo = this.tuttiGiocatori.find(g => g.id === idNuovoGiocatore);
    const vecchio = this.formazione[indexZona];
    if (!nuovo || !vecchio || nuovo.id === vecchio.id) return;

    const isLibero = (nuovo.ruolo === 'L' || vecchio.ruolo === 'L');
    if (!isLibero) {
      if (this.sostituzioniCasa >= this.maxSostituzioni) {
        alert("Attenzione: Raggiunto il limite massimo di 8 sostituzioni per questo set!");
        return;
      }
      this.sostituzioniCasa++;
    }

    this.formazione[indexZona] = nuovo;
    if (this.giocatoreAttivo?.id === vecchio.id) {
      this.giocatoreAttivo = nuovo;
    }

    this.salvaStato();
    this.render();
  }

  scambiaLiberoConCentrale() {
    const libero = this.tuttiGiocatori.find(g => g.ruolo === 'L');
    if (!libero) return;

    const indexLibero = this.formazione.findIndex(g => g.ruolo === 'L');
    if (indexLibero !== -1) {
      const riserveCentrale = this.tuttiGiocatori.find(g => g.ruolo === 'C' && !this.formazione.some(inC => inC.id === g.id));
      if (riserveCentrale) {
        this.eseguiSostituzione(indexLibero, riserveCentrale.id);
      }
      return;
    }

    const zone2aLinea = [0, 5, 4];
    for (const z of zone2aLinea) {
      if (this.formazione[z].ruolo === 'C') {
        this.eseguiSostituzione(z, libero.id);
        return;
      }
    }
  }

  chiamaTimeout() {
    if (this.timeoutCasa < 2) {
      this.timeoutCasa++;
      this.salvaStato();
      this.render();
    }
  }

  // =========================================================
  // RUOTA SCOUT INTERATTIVA POPUP (Fedele al 100% all'originale)
  // =========================================================
  initRuotaInteractive() {
    const canvas = document.getElementById('canvas-ruota-interactive');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Carica immagini originali
    const imgWheel = new Image();
    imgWheel.src = 'assets/images/totale_ruota_5.png';

    const imgLines = new Image();
    imgLines.src = 'assets/images/linee_cerchio.png';

    // Geometria dei 6 settori:
    // Ore 12: Alzata (-90°), Ore 2: Attacco (-30°), Ore 4: Ricezione (+30°)
    // Ore 6: Battuta (+90°), Ore 8: Muro (+150°), Ore 10: Difesa (-150°)
    const settori = [
      { id: 'alzata', nome: 'ALZATA', angleRad: -Math.PI / 2, startRad: -2 * Math.PI / 3, endRad: -Math.PI / 3 },
      { id: 'attacco', nome: 'ATTACCO', angleRad: -Math.PI / 6, startRad: -Math.PI / 3, endRad: 0 },
      { id: 'ricezione', nome: 'RICEZIONE', angleRad: Math.PI / 6, startRad: 0, endRad: Math.PI / 3 },
      { id: 'battuta', nome: 'BATTUTA', angleRad: Math.PI / 2, startRad: Math.PI / 3, endRad: 2 * Math.PI / 3 },
      { id: 'muro', nome: 'MURO', angleRad: 5 * Math.PI / 6, startRad: 2 * Math.PI / 3, endRad: Math.PI },
      { id: 'difesa', nome: 'DIFESA', angleRad: -5 * Math.PI / 6, startRad: -Math.PI, endRad: -2 * Math.PI / 3 }
    ];

    const valutazioni = ['==', '-', '!', '+', '++']; // Indici 0..4 dall'interno all'esterno
    const valNomi = ['Errore (==)', 'Negativo (-)', 'Neutro (!)', 'Positivo (+)', 'Punto / Perfetto (++)'];

    let activeSector = null;
    let activeRing = null;

    const redraw = () => {
      const size = 520;
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const rInner = 45; // Bordo interno foro centrale (cerchio atleta r=45)
      const rOuter = 214; // Bordo esterno anello rosso (prima dei badge icone a r=215)
      const dr = (rOuter - rInner) / 5.0; // 33.8px esatti per ogni anello
      const ringRadii = [60, 93, 128, 163, 196]; // Centro esatto di ciascun anello misurato su pixel autentici

      // 1. Disegna sfondo originale totale_ruota_5.png
      if (imgWheel.complete && imgWheel.naturalWidth > 0) {
        ctx.drawImage(imgWheel, 0, 0, size, size);
      }

      // 2. Disegna l'evidenziatore del settore e anello attivo (se toccato o in hover)
      if (activeSector !== null) {
        const sec = settori[activeSector];
        
        // Evidenzia l'intero settore attivo (come nello screenshot del tablet)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter, sec.startRad, sec.endRad, false);
        ctx.arc(cx, cy, rInner, sec.endRad, sec.startRad, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        ctx.fill();
        ctx.restore();

        // Evidenzia l'anello specifico toccato
        if (activeRing !== null) {
          const r1 = rInner + activeRing * dr;
          const r2 = rInner + (activeRing + 1) * dr;

          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r2, sec.startRad, sec.endRad, false);
          ctx.arc(cx, cy, r1, sec.endRad, sec.startRad, true);
          ctx.closePath();
          ctx.fillStyle = 'rgba(0, 229, 255, 0.50)';
          ctx.fill();
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. Linee cerchio
      if (imgLines.complete && imgLines.naturalWidth > 0) {
        ctx.drawImage(imgLines, 0, 0, size, size);
      }

      // 4. SIMBOLI PERMANENTI (-- - ! + ++) DISEGNATI SU OGNI SETTORE E ANELLO!
      // Esattamente come nello screenshot del tablet, posizionati perfettamente al centro di ciascun anello
      const simboli = ['--', '-', '!', '+', '++'];

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      settori.forEach((sec, sIdx) => {
        const angle = sec.angleRad; // Perfettamente centrato nell'asse del settore

        for (let i = 0; i < 5; i++) {
          const r = ringRadii[i];
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const text = simboli[i];

          const isHighlight = (activeSector === sIdx && activeRing === i);

          if (isHighlight) {
            ctx.font = '900 21px Arial, sans-serif';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3.5;
            ctx.strokeText(text, x, y);

            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(text, x, y);
          } else {
            ctx.font = text.length > 1 ? '900 14px Arial, sans-serif' : '900 16px Arial, sans-serif';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2.5;
            ctx.strokeText(text, x, y);

            ctx.fillStyle = '#1A1A1A';
            ctx.fillText(text, x, y);
          }
        }
      });
      ctx.restore();
    };

    imgWheel.onload = redraw;
    imgLines.onload = redraw;

    const calcolaCoordinate = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const x = (clientX - rect.left) * scale;
      const y = (clientY - rect.top) * scale;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      const rInner = 45;
      const rOuter = 214;
      const dr = (rOuter - rInner) / 5.0;

      if (dist < rInner || dist > rOuter * 1.05) {
        return null;
      }

      let angleRad = Math.atan2(dy, dx); // [-PI, PI]
      let sIdx = settori.findIndex(sec => {
        if (sec.startRad <= sec.endRad) {
          return angleRad >= sec.startRad && angleRad < sec.endRad;
        } else {
          return angleRad >= sec.startRad || angleRad < sec.endRad;
        }
      });

      // Normalizzazione speciale per i confini a PI
      if (sIdx === -1) {
        if (angleRad >= 2 * Math.PI / 3 && angleRad <= Math.PI) sIdx = 4; // Muro
        else if (angleRad >= -Math.PI && angleRad < -2 * Math.PI / 3) sIdx = 5; // Difesa
      }

      const ringIdx = Math.min(4, Math.max(0, Math.floor((dist - rInner) / dr)));

      return { sectorIndex: sIdx, ringIndex: ringIdx };
    };

    const updateHUD = () => {
      const hud = document.getElementById('ruota-hud-selection');
      if (!hud) return;
      if (activeSector !== null && activeRing !== null) {
        const sec = settori[activeSector];
        const val = valNomi[activeRing];
        hud.textContent = `${sec.nome}  •  ${val}`;
        hud.style.display = 'block';
      } else {
        hud.style.display = 'none';
      }
    };

    // Eventi Pointer (Touch e Mouse unificati)
    canvas.addEventListener('pointermove', (e) => {
      const res = calcolaCoordinate(e.clientX, e.clientY);
      if (res) {
        activeSector = res.sectorIndex;
        activeRing = res.ringIndex;
      } else {
        activeSector = null;
        activeRing = null;
      }
      updateHUD();
      redraw();
    });

    canvas.addEventListener('pointerleave', () => {
      activeSector = null;
      activeRing = null;
      updateHUD();
      redraw();
    });

    canvas.addEventListener('pointerup', (e) => {
      const res = calcolaCoordinate(e.clientX, e.clientY);
      if (res && res.sectorIndex !== -1) {
        const sec = settori[res.sectorIndex];
        const val = valutazioni[res.ringIndex];
        this.registraEventoStandard(val, sec.id);
        this.chiudiRuota();
      }
      activeSector = null;
      activeRing = null;
      updateHUD();
      redraw();
    });

    this.redrawRuotaInteractive = redraw;
  }

  apriRuota(giocatore) {
    this.giocatoreAttivo = giocatore || this.giocatoreAttivo || this.formazione[0];
    const overlay = document.getElementById('ruota-scout-modal');
    if (overlay) {
      overlay.classList.add('visibile');
      const numEl = document.getElementById('ruota-center-number');
      if (numEl && this.giocatoreAttivo) {
        numEl.textContent = this.giocatoreAttivo.numero;
      }

      // Aggiorna punteggio live nella top bar della ruota
      const scoreTop = document.getElementById('ruota-score-top');
      if (scoreTop) {
        scoreTop.textContent = `${this.squadraCasa} ${this.puntiCasa} - ${this.puntiOspite} ${this.squadraOspite} (SET ${this.setCorrente})`;
      }

      if (this.redrawRuotaInteractive) {
        setTimeout(this.redrawRuotaInteractive, 50);
      }
    }
  }

  chiudiRuota() {
    const overlay = document.getElementById('ruota-scout-modal');
    if (overlay) {
      overlay.classList.remove('visibile');
    }
  }

  toggleFullscreen() {
    const doc = document;
    const docEl = doc.documentElement;
    const isFull = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

    if (!isFull) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => console.warn(err));
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(err => console.warn(err));
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }

  // =========================================================
  // CAMPETTO TRAIETTORIE CANVAS
  // =========================================================
  initCanvasCampetto() {
    const canvas = document.getElementById('canvas-campetto');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const redraw = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      const w = canvas.width;
      const h = canvas.height;

      // Sfondo campo arancione (#F39C12)
      ctx.fillStyle = '#F39C12';
      ctx.fillRect(0, 0, w, h);

      // Linee bianche perimetro
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(6, 6, w - 12, h - 12);

      // Rete centrale verde (#27AE60)
      ctx.strokeStyle = '#27AE60';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(6, h / 2);
      ctx.lineTo(w - 6, h / 2);
      ctx.stroke();

      // Linee dei 3 metri tratteggiate
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.moveTo(6, h / 2 - h * 0.16);
      ctx.lineTo(w - 6, h / 2 - h * 0.16);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(6, h / 2 + h * 0.16);
      ctx.lineTo(w - 6, h / 2 + h * 0.16);
      ctx.stroke();
      ctx.setLineDash([]);

      // Freccia traiettoria
      if (this.traiettoria.xInizio !== null && this.traiettoria.xFine !== null) {
        ctx.strokeStyle = '#00ADB5';
        ctx.fillStyle = '#00ADB5';
        ctx.lineWidth = 3.5;

        const x1 = this.traiettoria.xInizio * w;
        const y1 = this.traiettoria.yInizio * h;
        const x2 = this.traiettoria.xFine * w;
        const y2 = this.traiettoria.yFine * h;

        ctx.beginPath();
        ctx.arc(x1, y1, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    };

    window.addEventListener('resize', redraw);
    setTimeout(redraw, 100);

    let drawing = false;
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.traiettoria.xInizio = (e.clientX - rect.left) / rect.width;
      this.traiettoria.yInizio = (e.clientY - rect.top) / rect.height;
      this.traiettoria.xFine = this.traiettoria.xInizio;
      this.traiettoria.yFine = this.traiettoria.yInizio;
      drawing = true;
      redraw();
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      this.traiettoria.xFine = (e.clientX - rect.left) / rect.width;
      this.traiettoria.yFine = (e.clientY - rect.top) / rect.height;
      redraw();
    });

    canvas.addEventListener('pointerup', () => {
      drawing = false;
    });

    this.redrawCampetto = redraw;
  }

  cancellaTraiettoria() {
    this.traiettoria = { xInizio: null, yInizio: null, xFine: null, yFine: null };
    if (this.redrawCampetto) this.redrawCampetto();
  }

  // =========================================================
  // REPORT PDF COMPLETO
  // =========================================================
  generaReportPDF() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Intestazione con palette Quick Scout
      doc.setFillColor(15, 168, 156); // #0FA89C
      doc.rect(0, 0, 297, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("QUICK SCOUT VOLLEY - REPORT PARTITA", 14, 15);

      doc.setFontSize(10);
      doc.text(`Data: ${this.dataPartita}  |  Set ${this.setCorrente} (${this.puntiCasa} - ${this.puntiOspite})`, 180, 15);

      doc.setFillColor(235, 248, 247);
      doc.rect(14, 28, 269, 18, 'F');
      doc.setTextColor(30, 58, 58);
      doc.setFontSize(13);
      doc.text(`${this.squadraCasa}  (Set vinti: ${this.setVintiCasa})  vs  ${this.squadraOspite}  (Set vinti: ${this.setVintiOspite})`, 20, 39);

      const stats = {};
      this.tuttiGiocatori.forEach(g => {
        stats[g.id] = {
          atleta: g,
          puntiTot: 0,
          battutaTot: 0, ace: 0, battutaErr: 0,
          ricTot: 0, ricPos: 0, ricPrf: 0, ricErr: 0,
          attTot: 0, attPunti: 0, attManiOut: 0, attToccatoMuro: 0, attErr: 0,
          muroPunti: 0
        };
      });

      this.storicoEventi.forEach(ev => {
        const s = stats[ev.giocatore.id];
        if (!s) return;

        if (ev.fondamentale === 'battuta') {
          s.battutaTot++;
          if (ev.valutazione === '++') { s.ace++; s.puntiTot++; }
          if (ev.valutazione === '==') s.battutaErr++;
        } else if (ev.fondamentale === 'ricezione') {
          s.ricTot++;
          if (ev.valutazione === '++') s.ricPrf++;
          if (ev.valutazione === '+') s.ricPos++;
          if (ev.valutazione === '==') s.ricErr++;
        } else if (ev.fondamentale === 'attacco') {
          s.attTot++;
          if (ev.speciale === 'MANI OUT') {
            s.attManiOut++;
            s.attPunti++;
            s.puntiTot++;
          } else if (ev.speciale === 'TOCCATO MURO (RIGIOCANO)') {
            s.attToccatoMuro++;
          } else {
            if (ev.valutazione === '++') { s.attPunti++; s.puntiTot++; }
            if (ev.valutazione === '==') s.attErr++;
          }
        } else if (ev.fondamentale === 'muro') {
          if (ev.valutazione === '++') { s.muroPunti++; s.puntiTot++; }
        }
      });

      const tableRows = this.tuttiGiocatori.map(g => {
        const s = stats[g.id];
        const ricPosPct = s.ricTot > 0 ? Math.round(((s.ricPos + s.ricPrf) / s.ricTot) * 100) + '%' : '-';
        const ricPrfPct = s.ricTot > 0 ? Math.round((s.ricPrf / s.ricTot) * 100) + '%' : '-';
        const attEffPct = s.attTot > 0 ? Math.round(((s.attPunti - s.attErr) / s.attTot) * 100) + '%' : '-';

        return [
          g.numero,
          `${g.cognome} ${g.nome}`,
          g.ruolo,
          s.puntiTot,
          s.battutaTot, s.battutaErr, s.ace,
          s.ricTot, s.ricErr, ricPosPct, ricPrfPct,
          s.attTot, s.attErr, s.attPunti, `${s.attManiOut}`, `${s.attToccatoMuro}`, attEffPct,
          s.muroPunti
        ];
      });

      doc.autoTable({
        startY: 50,
        head: [[
          'N°', 'Giocatore', 'Ruolo', 'Punti',
          'Bat', 'Err', 'Ace',
          'Ric', 'Err', 'Pos%', 'Prf%',
          'Att', 'Err', 'Punti', 'ManiOut', 'ToccMuro', 'Eff%',
          'Muro'
        ]],
        body: tableRows,
        theme: 'striped',
        styles: { fontSize: 8, halign: 'center' },
        headStyles: { fillColor: [12, 138, 128], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          1: { halign: 'left', fontStyle: 'bold' },
          14: { fillColor: [248, 187, 208], fontStyle: 'bold' },
          15: { fillColor: [178, 223, 219], fontStyle: 'bold' }
        }
      });

      doc.save(`QuickScout_Report_${this.squadraCasa.replace(/\s+/g, '_')}_vs_${this.squadraOspite.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      alert("Errore generazione PDF: " + e.message);
    }
  }

  // =========================================================
  // SERVICE WORKER OFFLINE
  // =========================================================
  initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('ServiceWorker registrato con successo (Offline PWA attiva)'))
        .catch(err => console.log('Errore ServiceWorker:', err));
    }
  }

  // =========================================================
  // RENDER INTERFACCIA
  // =========================================================
  render() {
    // 1. Tabelloni
    document.getElementById('display-punti-casa').textContent = this.puntiCasa;
    document.getElementById('display-punti-ospite').textContent = this.puntiOspite;
    document.getElementById('nome-casa-display').textContent = this.squadraCasa;
    document.getElementById('nome-ospite-display').textContent = this.squadraOspite;
    document.getElementById('set-display').textContent = `SET ${this.setCorrente}`;

    const pallaCasa = document.getElementById('palla-casa');
    const pallaOspite = document.getElementById('palla-ospite');
    if (pallaCasa) pallaCasa.style.display = this.haPallaCasa ? 'block' : 'none';
    if (pallaOspite) pallaOspite.style.display = !this.haPallaCasa ? 'block' : 'none';

    // 2. Sostituzioni (Capsula con conteggio 8 max)
    const sostNum = document.getElementById('sostituzioni-counter');
    const sostLabel = document.getElementById('sostituzioni-label');
    if (sostNum) {
      sostNum.textContent = this.sostituzioniCasa;
      if (this.sostituzioniCasa >= this.maxSostituzioni) {
        sostNum.classList.add('alert');
      } else {
        sostNum.classList.remove('alert');
      }
    }
    if (sostLabel) {
      sostLabel.textContent = `${this.sostituzioniCasa}/${this.maxSostituzioni} Sost`;
    }

    // 3. Timeout Panchina
    const timeoutImg = document.getElementById('timeout-img');
    if (timeoutImg) {
      timeoutImg.src = this.timeoutCasa === 1 ? 'assets/images/timeout_1.png' :
                       this.timeoutCasa >= 2 ? 'assets/images/timeout_2.png' : 'assets/images/timeout_0.png';
    }
    const btnTimeout = document.getElementById('btn-timeout-casa');
    if (btnTimeout) {
      btnTimeout.disabled = (this.timeoutCasa >= 2);
    }

    // 4. Panchina Lista
    const panchinaList = document.getElementById('panchina-lista');
    if (panchinaList) {
      panchinaList.innerHTML = '';
      const riserve = this.tuttiGiocatori.filter(g => !this.formazione.some(inC => inC.id === g.id));
      riserve.forEach(g => {
        const d = document.createElement('div');
        d.className = 'atleta-panchina';
        d.textContent = g.numero;
        d.title = `${g.cognome} (${g.ruolo})`;
        d.onclick = () => this.apriModalSostituzione(g);
        panchinaList.appendChild(d);
      });
    }

    // 5. Formazione Campo (6 Zone)
    const zoneMap = [
      { idEl: 'zona-4', index: 3, numZona: 4 },
      { idEl: 'zona-3', index: 2, numZona: 3 },
      { idEl: 'zona-2', index: 1, numZona: 2 },
      { idEl: 'zona-5', index: 4, numZona: 5 },
      { idEl: 'zona-6', index: 5, numZona: 6 },
      { idEl: 'zona-1', index: 0, numZona: 1 }
    ];

    zoneMap.forEach(z => {
      const el = document.getElementById(z.idEl);
      if (!el) return;
      const g = this.formazione[z.index];
      const cerchio = el.querySelector('.cerchio-giocatore');
      const label = el.querySelector('.label-giocatore');

      if (cerchio) {
        cerchio.textContent = g ? g.numero : `Z${z.numZona}`;
        cerchio.className = 'cerchio-giocatore';
        if (g?.ruolo === 'L') cerchio.classList.add('libero');
        if (g && this.giocatoreAttivo?.id === g.id) cerchio.classList.add('attivo');
      }

      if (label) {
        label.textContent = g ? `${g.cognome} (${g.ruolo})` : `Zona ${z.numZona}`;
      }

      el.onclick = () => {
        if (g) {
          this.giocatoreAttivo = g;
          this.apriRuota(g);
          this.render();
        }
      };
    });

    // 6. Barra Fondamentali
    document.querySelectorAll('.btn-fondamentale').forEach(btn => {
      const f = btn.getAttribute('data-fond');
      if (f === this.fondamentaleSelezionato) {
        btn.classList.add('attivo');
      } else {
        btn.classList.remove('attivo');
      }
    });

    // 7. Tasti Speciali Attacco (visibili solo se Attacco è selezionato)
    const rigaSpeciali = document.getElementById('riga-speciali-attacco');
    if (rigaSpeciali) {
      rigaSpeciali.style.display = (this.fondamentaleSelezionato === 'attacco') ? 'flex' : 'none';
    }

    // 8. Ultima Azione Label
    const ultimoLabel = document.getElementById('ultimo-evento-label');
    const ruotaLastInfo = document.getElementById('ruota-last-info');

    let testoUltima = "Pronto per lo scout";
    let miniBadge = null;

    if (this.storicoEventi.length > 0) {
      const u = this.storicoEventi[this.storicoEventi.length - 1];
      const spec = u.speciale ? ` [${u.speciale}]` : '';
      testoUltima = `#${u.giocatore.numero} ${u.giocatore.cognome} • ${u.fondamentale.toUpperCase()} (${u.valutazione})${spec}`;
      miniBadge = u.giocatore.numero;
    }

    if (ultimoLabel) ultimoLabel.textContent = `Ultimo: ${testoUltima}`;
    if (ruotaLastInfo) {
      ruotaLastInfo.innerHTML = miniBadge 
        ? `<span class="badge-mini-player">${miniBadge}</span> <span>${testoUltima}</span>`
        : `<span>${testoUltima}</span>`;
    }
  }

  // =========================================================
  // MODALE SOSTITUZIONI
  // =========================================================
  apriModalSostituzione(atletaPanchinaSelezionato = null) {
    const modal = document.getElementById('modal-sostituzioni');
    if (!modal) return;

    const selectZona = document.getElementById('sost-select-zona');
    const selectEntrante = document.getElementById('sost-select-entrante');
    const infoConteggio = document.getElementById('sost-info-conteggio');

    selectZona.innerHTML = '';
    this.formazione.forEach((g, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Zona ${idx === 0 ? 1 : idx === 1 ? 2 : idx === 2 ? 3 : idx === 3 ? 4 : idx === 4 ? 5 : 6}: #${g.numero} ${g.cognome} (${g.ruolo})`;
      selectZona.appendChild(opt);
    });

    selectEntrante.innerHTML = '';
    const riserve = this.tuttiGiocatori.filter(g => !this.formazione.some(inC => inC.id === g.id));
    riserve.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `#${g.numero} ${g.cognome} ${g.nome} (${g.ruolo})`;
      if (atletaPanchinaSelezionato && atletaPanchinaSelezionato.id === g.id) {
        opt.selected = true;
      }
      selectEntrante.appendChild(opt);
    });

    if (infoConteggio) {
      infoConteggio.textContent = `Sostituzioni effettuate nel Set ${this.setCorrente}: ${this.sostituzioniCasa} di ${this.maxSostituzioni}`;
    }

    modal.classList.add('visibile');
  }

  chiudiModalSostituzione() {
    const modal = document.getElementById('modal-sostituzioni');
    if (modal) modal.classList.remove('visibile');
  }

  confermaSostituzione() {
    const selectZona = document.getElementById('sost-select-zona');
    const selectEntrante = document.getElementById('sost-select-entrante');
    if (selectZona && selectEntrante) {
      const idxZona = parseInt(selectZona.value);
      const idEntrante = parseInt(selectEntrante.value);
      this.eseguiSostituzione(idxZona, idEntrante);
    }
    this.chiudiModalSostituzione();
  }

  // =========================================================
  // GESTIONE ROSTER, ATLETI E FORMAZIONE
  // =========================================================
  apriGestioneRoster(tab = 'roster') {
    const modal = document.getElementById('modal-gestione');
    if (!modal) return;
    modal.classList.add('visibile');
    this.cambiaTabGestione(tab);
    this.renderRosterList();
    this.renderFormazioneSelects();
  }

  cambiaTabGestione(tabName) {
    const tabs = ['roster', 'formazione', 'partita'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const content = document.getElementById(`tab-gestione-${t}`);
      if (btn) btn.classList.toggle('attivo', t === tabName);
      if (content) content.style.display = (t === tabName) ? 'block' : 'none';
    });
    if (tabName === 'roster') this.renderRosterList();
    if (tabName === 'formazione') this.renderFormazioneSelects();
  }

  renderRosterList() {
    const container = document.getElementById('lista-roster-container');
    if (!container) return;
    container.innerHTML = '';

    const sorted = [...this.tuttiGiocatori].sort((a, b) => a.numero - b.numero);

    sorted.forEach(g => {
      const idxInCampo = this.formazione.findIndex(c => c.id === g.id);
      const inCampo = idxInCampo !== -1;
      const numZona = inCampo ? (idxInCampo === 0 ? 1 : idxInCampo === 1 ? 2 : idxInCampo === 2 ? 3 : idxInCampo === 3 ? 4 : idxInCampo === 4 ? 5 : 6) : null;

      const riga = document.createElement('div');
      riga.className = 'riga-atleta-roster';
      riga.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="cerchio-giocatore ${g.ruolo === 'L' ? 'libero' : ''}" style="width:36px; height:36px; font-size:16px;">
            ${g.numero}
          </div>
          <div>
            <div style="font-weight:900; font-size:14px; color:white;">
              ${g.cognome} ${g.nome || ''}
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
              <span class="badge-ruolo badge-ruolo-${g.ruolo}">${g.ruolo}</span>
              ${inCampo ? `<span class="badge-stato-campo">🏐 In Campo (Z${numZona})</span>` : `<span style="font-size:10px; opacity:0.75;">Panchina</span>`}
            </div>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn-bottom" style="padding:4px 8px; font-size:11px; background:#00ADB5;" onclick="app.caricaGiocatoreInForm(${g.id})" title="Modifica Giocatore">✏️</button>
          <button class="btn-bottom" style="padding:4px 8px; font-size:11px; background:#C62828;" onclick="app.eliminaGiocatore(${g.id})" title="Elimina dal Roster">🗑️</button>
        </div>
      `;
      container.appendChild(riga);
    });
  }

  caricaGiocatoreInForm(id) {
    const g = this.tuttiGiocatori.find(item => item.id === id);
    if (!g) return;

    document.getElementById('input-giocatore-id').value = g.id;
    document.getElementById('input-giocatore-numero').value = g.numero;
    document.getElementById('input-giocatore-cognome').value = g.cognome;
    document.getElementById('input-giocatore-nome').value = g.nome || '';
    document.getElementById('select-giocatore-ruolo').value = g.ruolo || 'S';

    const titolo = document.getElementById('form-giocatore-titolo');
    if (titolo) titolo.textContent = `✏️ Modifica Giocatore #${g.numero} ${g.cognome}`;

    const btnAnnulla = document.getElementById('btn-annulla-modifica-giocatore');
    if (btnAnnulla) btnAnnulla.style.display = 'inline-flex';
  }

  resetFormGiocatore() {
    document.getElementById('input-giocatore-id').value = '';
    document.getElementById('input-giocatore-numero').value = '';
    document.getElementById('input-giocatore-cognome').value = '';
    document.getElementById('input-giocatore-nome').value = '';
    document.getElementById('select-giocatore-ruolo').value = 'S';

    const titolo = document.getElementById('form-giocatore-titolo');
    if (titolo) titolo.textContent = '➕ Aggiungi Nuovo Giocatore';

    const btnAnnulla = document.getElementById('btn-annulla-modifica-giocatore');
    if (btnAnnulla) btnAnnulla.style.display = 'none';
  }

  salvaGiocatore() {
    const idInput = document.getElementById('input-giocatore-id').value;
    const numInput = parseInt(document.getElementById('input-giocatore-numero').value);
    const cognome = document.getElementById('input-giocatore-cognome').value.trim();
    const nome = document.getElementById('input-giocatore-nome').value.trim();
    const ruolo = document.getElementById('select-giocatore-ruolo').value;

    if (isNaN(numInput) || numInput < 1 || numInput > 99) {
      alert('Inserisci un numero di maglia valido (tra 1 e 99).');
      return;
    }
    if (!cognome) {
      alert('Inserisci il cognome dell\'atleta.');
      return;
    }

    if (idInput) {
      // Modifica esistente
      const id = parseInt(idInput);
      const esisteAltro = this.tuttiGiocatori.find(g => g.id !== id && g.numero === numInput);
      if (esisteAltro) {
        alert(`Il numero #${numInput} è già utilizzato da ${esisteAltro.cognome}.`);
        return;
      }
      const g = this.tuttiGiocatori.find(item => item.id === id);
      if (g) {
        g.numero = numInput;
        g.cognome = cognome;
        g.nome = nome;
        g.ruolo = ruolo;
      }
    } else {
      // Nuovo giocatore
      const esisteGia = this.tuttiGiocatori.find(g => g.numero === numInput);
      if (esisteGia) {
        alert(`Il numero #${numInput} è già presente nel roster (${esisteGia.cognome}).`);
        return;
      }
      const nuovoId = Date.now();
      this.tuttiGiocatori.push({
        id: nuovoId,
        numero: numInput,
        cognome: cognome,
        nome: nome,
        ruolo: ruolo
      });
    }

    this.salvaStato();
    this.render();
    this.renderRosterList();
    this.renderFormazioneSelects();
    this.resetFormGiocatore();
  }

  eliminaGiocatore(id) {
    if (this.tuttiGiocatori.length <= 6) {
      alert('Non puoi avere meno di 6 giocatori nel roster della squadra!');
      return;
    }

    const g = this.tuttiGiocatori.find(item => item.id === id);
    if (!g) return;

    if (!confirm(`Sei sicuro di voler eliminare #${g.numero} ${g.cognome} dal roster?`)) {
      return;
    }

    // Se il giocatore è in campo, sostituiscilo con la prima riserva disponibile
    const idxCampo = this.formazione.findIndex(c => c.id === id);
    if (idxCampo !== -1) {
      const riserva = this.tuttiGiocatori.find(item => item.id !== id && !this.formazione.some(c => c.id === item.id));
      if (riserva) {
        this.formazione[idxCampo] = riserva;
      }
    }

    this.tuttiGiocatori = this.tuttiGiocatori.filter(item => item.id !== id);
    if (this.giocatoreAttivo?.id === id) {
      this.giocatoreAttivo = this.formazione[0];
    }

    this.salvaStato();
    this.render();
    this.renderRosterList();
    this.renderFormazioneSelects();
  }

  renderFormazioneSelects() {
    const zoneKeys = [
      { idSel: 'setup-zona-1', idx: 0, label: 'Zona 1 (Battuta)' },
      { idSel: 'setup-zona-2', idx: 1, label: 'Zona 2 (Avanti Dx)' },
      { idSel: 'setup-zona-3', idx: 2, label: 'Zona 3 (Centro)' },
      { idSel: 'setup-zona-4', idx: 3, label: 'Zona 4 (Avanti Sx)' },
      { idSel: 'setup-zona-5', idx: 4, label: 'Zona 5 (Difesa Sx)' },
      { idSel: 'setup-zona-6', idx: 5, label: 'Zona 6 (Difesa Centro)' }
    ];

    zoneKeys.forEach(z => {
      const select = document.getElementById(z.idSel);
      if (!select) return;
      select.innerHTML = '';

      const attuale = this.formazione[z.idx];

      this.tuttiGiocatori.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = `#${g.numero} ${g.cognome} (${g.ruolo})`;
        if (attuale && attuale.id === g.id) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    });
  }

  applicaFormazioneIniziale() {
    const idZ1 = parseInt(document.getElementById('setup-zona-1').value);
    const idZ2 = parseInt(document.getElementById('setup-zona-2').value);
    const idZ3 = parseInt(document.getElementById('setup-zona-3').value);
    const idZ4 = parseInt(document.getElementById('setup-zona-4').value);
    const idZ5 = parseInt(document.getElementById('setup-zona-5').value);
    const idZ6 = parseInt(document.getElementById('setup-zona-6').value);

    const ids = [idZ1, idZ2, idZ3, idZ4, idZ5, idZ6];
    const uniqueIds = new Set(ids);
    if (uniqueIds.size < 6) {
      alert('Attenzione: un giocatore non può essere schierato in più zone contemporaneamente! Seleziona 6 giocatori differenti.');
      return;
    }

    const nuovaFormazione = ids.map(id => this.tuttiGiocatori.find(g => g.id === id));
    this.formazione = nuovaFormazione;
    this.giocatoreAttivo = this.formazione[0];

    this.salvaStato();
    this.render();
    this.renderRosterList();
    alert('Formazione iniziale applicata con successo!');
    document.getElementById('modal-gestione').classList.remove('visibile');
  }
}

// Istanza globale
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new ScoutApp();
});
