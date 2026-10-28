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

    this.squadraCasa = "CASA";
    this.squadraOspite = "OSPITI";
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
    this.storicoSet = [];

    this.fondamentaleSelezionato = 'battuta';
    this.giocatoreAttivo = null;
    this.campoInvertito = false;

    this.numeroPunto = 1;
    this.numeroScambio = 0;

    // Roster predefinito (12 atleti numerati, senza nomi fittizi)
    this.tuttiGiocatori = [
      { id: 1, numero: 1, nome: '', cognome: '', ruolo: 'P' },
      { id: 2, numero: 2, nome: '', cognome: '', ruolo: 'S' },
      { id: 3, numero: 3, nome: '', cognome: '', ruolo: 'C' },
      { id: 4, numero: 4, nome: '', cognome: '', ruolo: 'O' },
      { id: 5, numero: 5, nome: '', cognome: '', ruolo: 'S' },
      { id: 6, numero: 6, nome: '', cognome: '', ruolo: 'C' },
      { id: 7, numero: 7, nome: '', cognome: '', ruolo: 'L' },
      { id: 8, numero: 8, nome: '', cognome: '', ruolo: 'P' },
      { id: 9, numero: 9, nome: '', cognome: '', ruolo: 'S' },
      { id: 10, numero: 10, nome: '', cognome: '', ruolo: 'C' },
      { id: 11, numero: 11, nome: '', cognome: '', ruolo: 'O' },
      { id: 12, numero: 12, nome: '', cognome: '', ruolo: 'L' }
    ];

    // Formazione campo 6 zone [Z1, Z2, Z3, Z4, Z5, Z6]
    this.formazione = [
      this.tuttiGiocatori[0], // Z1 (Servizio) -> #1
      this.tuttiGiocatori[1], // Z2 -> #2
      this.tuttiGiocatori[2], // Z3 -> #3
      this.tuttiGiocatori[3], // Z4 -> #4
      this.tuttiGiocatori[4], // Z5 -> #5
      this.tuttiGiocatori[5]  // Z6 -> #6
    ];

    this.giocatoreAttivo = null;
    this.storicoEventi = [];
    this.traiettoria = { xInizio: null, yInizio: null, xFine: null, yFine: null };

    this.liberoDesignatoId = null; // Memorizza quale dei liberi è designato come titolare
    this.liberoSostituitoId = null;
    this.autoLiberoRotazione = true; // Uscita automatica del Libero da prima linea (Regola FIVB)
    this.autoLiberoEntrata = true; // Entrata automatica del Libero in seconda linea (attiva di default)

    this.archivioPartite = []; // Storico partite archiviate

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
    // 0. Ripristina lo storico delle partite salvate
    const savedArchivio = localStorage.getItem('quickscout_archivio_partite');
    if (savedArchivio) {
      try {
        this.archivioPartite = JSON.parse(savedArchivio) || [];
      } catch (e) {
        console.error('Errore ripristino archivio partite:', e);
      }
    }

    // 1. Ripristina il Roster permanente (se salvato in precedenza)
    const savedRoster = localStorage.getItem('quickscout_roster');
    if (savedRoster) {
      try {
        const rData = JSON.parse(savedRoster);
        if (rData.squadraCasa && rData.squadraCasa !== "Volley Club Pro") {
          this.squadraCasa = rData.squadraCasa;
        }
        if (rData.tuttiGiocatori && Array.isArray(rData.tuttiGiocatori) && rData.tuttiGiocatori.length >= 6) {
          this.tuttiGiocatori = rData.tuttiGiocatori;
        }
        if (rData.formazioneIds && Array.isArray(rData.formazioneIds)) {
          this.formazione = rData.formazioneIds.map(id => this.tuttiGiocatori.find(g => g.id === id) || this.tuttiGiocatori[0]);
        }
        if (rData.autoLiberoRotazione !== undefined) this.autoLiberoRotazione = rData.autoLiberoRotazione;
        if (rData.autoLiberoEntrata !== undefined) this.autoLiberoEntrata = rData.autoLiberoEntrata;
        if (rData.liberoDesignatoId !== undefined) this.liberoDesignatoId = rData.liberoDesignatoId;
      } catch (e) {
        console.error('Errore ripristino roster permanente:', e);
      }
    }

    // 2. Ripristina lo stato della partita corrente (se presente)
    const saved = localStorage.getItem('quickscout_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.squadraCasa === "Volley Club Pro") data.squadraCasa = "CASA";
        if (data.squadraOspite === "Polisportiva Riva") data.squadraOspite = "OSPITI";

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
        this.liberoSostituitoId = data.liberoSostituitoId ?? null;
        if (data.autoLiberoRotazione !== undefined) this.autoLiberoRotazione = data.autoLiberoRotazione;
        if (data.autoLiberoEntrata !== undefined) this.autoLiberoEntrata = data.autoLiberoEntrata;
        if (data.liberoDesignatoId !== undefined) this.liberoDesignatoId = data.liberoDesignatoId;

        const dummySurnames = ['Rossi', 'Bianchi', 'Ferrari', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno'];
        if (data.tuttiGiocatori && Array.isArray(data.tuttiGiocatori)) {
          this.tuttiGiocatori = data.tuttiGiocatori.map(g => {
            if (dummySurnames.includes(g.cognome)) {
              return { ...g, nome: '', cognome: '' };
            }
            return g;
          });
        }
        if (data.formazioneIds && Array.isArray(data.formazioneIds)) {
          this.formazione = data.formazioneIds.map(id => this.tuttiGiocatori.find(g => g.id === id) || this.tuttiGiocatori[0]);
        }
        this.storicoEventi = data.storicoEventi || [];
        this.storicoEventi.forEach(ev => {
          if (ev.giocatore && dummySurnames.includes(ev.giocatore.cognome)) {
            ev.giocatore.cognome = '';
            ev.giocatore.nome = '';
          }
        });
        this.storicoSet = data.storicoSet || [];
        this.giocatoreAttivo = null;
      } catch (e) {
        console.error('Errore ripristino dati:', e);
      }
    }
  }

  salvaRosterPermanente() {
    try {
      const data = {
        squadraCasa: this.squadraCasa,
        tuttiGiocatori: this.tuttiGiocatori,
        formazioneIds: this.formazione.map(g => g.id),
        liberoDesignatoId: this.liberoDesignatoId,
        autoLiberoRotazione: this.autoLiberoRotazione,
        autoLiberoEntrata: this.autoLiberoEntrata
      };
      localStorage.setItem('quickscout_roster', JSON.stringify(data));
    } catch (e) {
      console.error('Errore salvataggio roster permanente:', e);
    }
  }

  salvaArchivioPartitePermanente() {
    try {
      localStorage.setItem('quickscout_archivio_partite', JSON.stringify(this.archivioPartite || []));
    } catch (e) {
      console.error('Errore salvataggio archivio partite:', e);
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
      liberoDesignatoId: this.liberoDesignatoId,
      liberoSostituitoId: this.liberoSostituitoId,
      autoLiberoRotazione: this.autoLiberoRotazione,
      autoLiberoEntrata: this.autoLiberoEntrata,
      storicoEventi: this.storicoEventi,
      storicoSet: this.storicoSet || []
    };
    localStorage.setItem('quickscout_state', JSON.stringify(data));
    this.salvaRosterPermanente();
  }

  // =========================================================
  // GESTIONE POSSESSO PALLA (BATTUTA / RICEZIONE)
  // =========================================================
  impostaPossessoPalla(casaHaPalla) {
    this.haPallaCasa = Boolean(casaHaPalla);

    if (this.haPallaCasa) {
      // Squadra CASA in battuta: fondamentale Battuta
      this.fondamentaleSelezionato = 'battuta';
      this.giocatoreAttivo = null;
    } else {
      // Squadra OSPITI in battuta: squadra CASA in RICEZIONE
      this.fondamentaleSelezionato = 'ricezione';
      if (this.autoLiberoEntrata) {
        this.verificaEntrataAutomaticaLibero();
      }
      this.giocatoreAttivo = null;
    }

    this.salvaStato();
    this.render();
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
    this.giocatoreAttivo = null;
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
    if (this.autoLiberoEntrata) {
      this.verificaEntrataAutomaticaLibero();
    }
    this.giocatoreAttivo = null;
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
    this.giocatoreAttivo = null;
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

    // 1. Regola FIVB/FIPAV: Il Libero non può stare in prima linea (Zona 4 = index 3)
    if (this.autoLiberoRotazione) {
      const idxZona4 = 3;
      if (this.formazione[idxZona4]?.ruolo === 'L') {
        let centraleDaRientrare = null;
        if (this.liberoSostituitoId) {
          centraleDaRientrare = this.tuttiGiocatori.find(g => g.id === this.liberoSostituitoId);
        }
        if (!centraleDaRientrare) {
          centraleDaRientrare = this.tuttiGiocatori.find(g => g.ruolo === 'C' && !this.formazione.some(inC => inC.id === g.id));
        }
        if (centraleDaRientrare) {
          this.formazione[idxZona4] = centraleDaRientrare;
          this.liberoSostituitoId = null;
        }
      }
    }

    // 2. Entrata automatica Libero in 2ª linea (se attiva nelle opzioni)
    if (this.autoLiberoEntrata) {
      this.verificaEntrataAutomaticaLibero();
    }

    this.giocatoreAttivo = null;
    this.salvaStato();
    this.render();
  }

  getLiberoDesignato() {
    // 1. Libero espressamente designato / memorizzato per questo match
    if (this.liberoDesignatoId) {
      const l = this.tuttiGiocatori.find(g => g.id === this.liberoDesignatoId);
      if (l && l.ruolo === 'L') return l;
    }
    // 2. Se c'è un libero attualmente in campo, quello è il designato
    const inCampo = this.formazione.find(g => g.ruolo === 'L');
    if (inCampo) {
      this.liberoDesignatoId = inCampo.id;
      return inCampo;
    }
    // 3. Altrimenti il primo con ruolo 'L' presente nel roster
    const primo = this.tuttiGiocatori.find(g => g.ruolo === 'L');
    if (primo) this.liberoDesignatoId = primo.id;
    return primo;
  }

  verificaEntrataAutomaticaLibero() {
    const libero = this.getLiberoDesignato();
    if (!libero) return;
    const giaInCampo = this.formazione.some(g => g.ruolo === 'L');
    if (giaInCampo) return;

    // Se un centrale è in 2ª linea (Zona 6 = idx 5 o Zona 5 = idx 4), il libero entra
    const zone2a = [5, 4];
    for (const z of zone2a) {
      if (this.formazione[z]?.ruolo === 'C') {
        this.liberoSostituitoId = this.formazione[z].id;
        this.formazione[z] = libero;
        break;
      }
    }
  }

  eseguiRotazioneInversa() {
    const [p1, p2, p3, p4, p5, p6] = this.formazione;
    this.formazione = [p6, p1, p2, p3, p4, p5];
    this.giocatoreAttivo = null;
    this.salvaStato();
    this.render();
  }

  verificaFineSet() {
    const target = this.setCorrente === 5 ? 15 : 25;
    if ((this.puntiCasa >= target || this.puntiOspite >= target) && Math.abs(this.puntiCasa - this.puntiOspite) >= 2) {
      const vintoCasa = this.puntiCasa > this.puntiOspite;
      if (!this.storicoSet) this.storicoSet = [];
      this.storicoSet.push({
        set: this.setCorrente,
        puntiCasa: this.puntiCasa,
        puntiOspite: this.puntiOspite,
        vintoCasa: vintoCasa
      });
      if (vintoCasa) {
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
    this.giocatoreAttivo = null;
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
    this.giocatoreAttivo = null;
    this.cancellaTraiettoria();
    this.salvaStato();
    this.render();
  }

  // =========================================================
  // REGISTRAZIONE EVENTO STANDARD (Ruota o Tastierino)
  // =========================================================
  registraEventoStandard(valutazioneId, fondamentaleSpecifico = null) {
    const g = this.giocatoreAttivo;
    if (!g) {
      alert("Tocca prima sul campetto il giocatore che ha fatto l'azione!");
      return;
    }
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
      this.giocatoreAttivo = null; // Nessun giocatore pre-selezionato a priori
      this.verificaFineSet();
    } else {
      // Suggerisci il fondamentale successivo ma lascia lo scout libero al 100% di toccare chiunque
      if (fond === 'battuta') this.fondamentaleSelezionato = 'difesa';
      else if (fond === 'ricezione') this.fondamentaleSelezionato = 'alzata';
      else if (fond === 'alzata') this.fondamentaleSelezionato = 'attacco';
      else if (fond === 'attacco') this.fondamentaleSelezionato = 'difesa';
      else if (fond === 'difesa' || fond === 'muro') this.fondamentaleSelezionato = 'alzata';

      this.giocatoreAttivo = null; // Nessun giocatore pre-selezionato a priori
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
      this.giocatoreAttivo = null;
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
    } else {
      // Se entra un atleta con ruolo 'L', memorizzalo come Libero designato per non scambiarlo con l'altro Libero
      if (nuovo.ruolo === 'L') {
        this.liberoDesignatoId = nuovo.id;
      }
    }

    this.formazione[indexZona] = nuovo;
    if (this.giocatoreAttivo?.id === vecchio.id) {
      this.giocatoreAttivo = nuovo;
    }

    this.salvaStato();
    this.render();
  }

  scambiaLiberoConCentrale() {
    const libero = this.getLiberoDesignato();
    if (!libero) {
      alert("Nessun atleta con ruolo 'L' (Libero) registrato nel Roster!");
      return;
    }

    const indexLibero = this.formazione.findIndex(g => g.ruolo === 'L');
    if (indexLibero !== -1) {
      // Il Libero è in campo: fallo uscire e fai rientrare il centrale sostituito
      let centraleDaRientrare = null;
      if (this.liberoSostituitoId) {
        centraleDaRientrare = this.tuttiGiocatori.find(g => g.id === this.liberoSostituitoId);
      }
      if (!centraleDaRientrare) {
        centraleDaRientrare = this.tuttiGiocatori.find(g => g.ruolo === 'C' && !this.formazione.some(inC => inC.id === g.id));
      }
      if (centraleDaRientrare) {
        this.eseguiSostituzione(indexLibero, centraleDaRientrare.id);
        this.liberoSostituitoId = null;
      }
      return;
    }

    // Il Libero è in panchina: fallo entrare al posto del centrale in 2ª linea (Zona 5, 6 o 1)
    const zone2aLinea = [4, 5, 0];
    for (const z of zone2aLinea) {
      if (this.formazione[z]?.ruolo === 'C') {
        this.liberoSostituitoId = this.formazione[z].id;
        this.eseguiSostituzione(z, libero.id);
        return;
      }
    }
    alert("Nessun Centrale ('C') trovato in seconda linea (Zone 5, 6 o 1) da sostituire con il Libero.");
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
        
        // Evidenzia l'intero settore attivo (fino al bordo esterno r=250)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 250, sec.startRad, sec.endRad, false);
        ctx.arc(cx, cy, 44, sec.endRad, sec.startRad, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        ctx.fill();
        ctx.restore();

        // Evidenzia l'anello specifico toccato
        if (activeRing !== null) {
          const r1 = (activeRing === 0) ? 44 : (activeRing === 1 ? 74 : (activeRing === 2 ? 106 : (activeRing === 3 ? 138 : 172)));
          const r2 = (activeRing === 4) ? 250 : (activeRing === 3 ? 172 : (activeRing === 2 ? 138 : (activeRing === 1 ? 106 : 74)));

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

      // 1. Se tocca nel cerchio centrale del giocatore (r < 42), lascia il tocco al pulsante "CHIUDI"
      if (dist < 42) {
        return null;
      }
      // 2. Limite massimo esterno (fino a 265px sul canvas 520x520)
      if (dist > 265) {
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

      // Spessore progressivo: l'anello '++' (Punto/Kill) copre tutta l'area esterna della ruota (da 172px a 265px).
      // Questo impedisce tocchi a vuoto ed è fedele al parametro 'wheel_pp_thickness_add' dell'app originale!
      let ringIdx = 0;
      if (dist >= 172) {
        ringIdx = 4; // '++' (Punto / Perfetto)
      } else if (dist >= 138) {
        ringIdx = 3; // '+' (Positivo)
      } else if (dist >= 106) {
        ringIdx = 2; // '!' (Neutro)
      } else if (dist >= 74) {
        ringIdx = 1; // '-' (Negativo)
      } else {
        ringIdx = 0; // '==' (Errore)
      }

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

    // Eventi Pointer (Touch e Mouse unificati, con reattività immediata al tocco e rilascio)
    canvas.addEventListener('pointerdown', (e) => {
      const res = calcolaCoordinate(e.clientX, e.clientY);
      if (res && res.sectorIndex !== -1) {
        activeSector = res.sectorIndex;
        activeRing = res.ringIndex;
        updateHUD();
        redraw();
      }
    });

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
      const secIdx = (res && res.sectorIndex !== -1) ? res.sectorIndex : activeSector;
      const ringIdx = (res && res.ringIndex !== null) ? res.ringIndex : activeRing;

      if (secIdx !== null && secIdx !== -1 && ringIdx !== null && ringIdx !== -1) {
        const sec = settori[secIdx];
        const val = valutazioni[ringIdx];
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
  // REPORT PDF COMPLETO (REPLICA ESATTA ORIGINALE QUICK SCOUT)
  // =========================================================
  async generaReportPDF(matchData = null) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Supporto per matchData (per scaricare PDF direttamente dallo Storico Partite)
      const squadraCasa = matchData ? matchData.squadraCasa : this.squadraCasa;
      const squadraOspite = matchData ? matchData.squadraOspite : this.squadraOspite;
      const setVintiCasa = matchData ? (matchData.setVintiCasa ?? 0) : this.setVintiCasa;
      const setVintiOspite = matchData ? (matchData.setVintiOspite ?? 0) : this.setVintiOspite;
      const setCorrente = matchData ? (matchData.setCorrente ?? 1) : this.setCorrente;
      const storicoSet = matchData ? (matchData.storicoSet || []) : (this.storicoSet || []);
      const storicoEventi = matchData ? (matchData.storicoEventi || []) : (this.storicoEventi || []);

      // 1. Precaricamento delle immagini ufficiali
      const immaginiDaCaricare = {
        logo: 'assets/images/logo_pdf.png',
        icona_alzata: 'assets/images/icona_alzata_report.png',
        icona_attacco: 'assets/images/icona_attacco_report.png',
        icona_battuta: 'assets/images/icona_battuta_report.png',
        icona_difesa: 'assets/images/icona_difesa_report.png',
        icona_muro: 'assets/images/icona_muro_report.png',
        icona_ricezione: 'assets/images/icona_ricezione_report.png',
        marker_alzata: 'assets/images/punto_grafico_alzata_stampa.png',
        marker_attacco: 'assets/images/punto_grafico_attacco_stampa.png',
        marker_battuta: 'assets/images/punto_grafico_battuta_stampa.png',
        marker_difesa: 'assets/images/punto_grafico_difesa_stampa.png',
        marker_muro: 'assets/images/punto_grafico_muro_stampa.png',
        marker_ricezione: 'assets/images/punto_grafico_ricezione_stampa.png'
      };

      const caricaImmagine = (src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.warn("Impossibile caricare immagine per PDF:", src);
            resolve(null);
          };
          img.src = src;
        });
      };

      const chiavi = Object.keys(immaginiDaCaricare);
      const promesse = chiavi.map(k => caricaImmagine(immaginiDaCaricare[k]));
      const risultati = await Promise.all(promesse);
      const imgMap = {};
      chiavi.forEach((k, idx) => {
        imgMap[k] = risultati[idx];
      });

      // 2. Definizione dei 6 fondamentali con colori e formule originali
      const FONDAMENTALI = [
        { id: 'alzata', nome: 'Alzata', colore: '#ee4600', formulaTipo: 'generale', iconKey: 'icona_alzata', markerKey: 'marker_alzata' },
        { id: 'attacco', nome: 'Attacco', colore: '#e68300', formulaTipo: 'punto', iconKey: 'icona_attacco', markerKey: 'marker_attacco' },
        { id: 'battuta', nome: 'Battuta', colore: '#f3c400', formulaTipo: 'generale', iconKey: 'icona_battuta', markerKey: 'marker_battuta' },
        { id: 'difesa', nome: 'Difesa', colore: '#45c866', formulaTipo: 'generale', iconKey: 'icona_difesa', markerKey: 'marker_difesa' },
        { id: 'muro', nome: 'Muro', colore: '#09ccff', formulaTipo: 'punto', iconKey: 'icona_muro', markerKey: 'marker_muro' },
        { id: 'ricezione', nome: 'Ricezione', colore: '#a973ff', formulaTipo: 'generale', iconKey: 'icona_ricezione', markerKey: 'marker_ricezione' }
      ];

      const calcolaEfficienza = (formulaTipo, pp, p, o, m, mm, tot) => {
        if (tot === 0) return 0;
        if (formulaTipo === 'punto') {
          // Attacco e Muro: (PP - MM) / tot * 100
          return ((pp - mm) / tot) * 100;
        } else {
          // Alzata, Battuta, Difesa, Ricezione: ((PP + P) - MM) / tot * 100
          return (((pp + p) - mm) / tot) * 100;
        }
      };

      // 3. Statistiche complessive partita (per le 6 torte)
      const matchStats = {};
      FONDAMENTALI.forEach(f => {
        const eventiFond = storicoEventi.filter(ev => ev.fondamentale === f.id);
        let pp = 0, p = 0, o = 0, m = 0, mm = 0;
        eventiFond.forEach(ev => {
          if (ev.valutazione === '++') pp++;
          else if (ev.valutazione === '+') p++;
          else if (ev.valutazione === '!') o++;
          else if (ev.valutazione === '-') m++;
          else if (ev.valutazione === '==') mm++;
        });
        const tot = pp + p + o + m + mm;
        const eff = calcolaEfficienza(f.formulaTipo, pp, p, o, m, mm, tot);
        matchStats[f.id] = { eff, tot, pp, p, o, m, mm };
      });

      // 4. Statistiche per set (per il grafico a linee)
      const maxSet = Math.min(5, Math.max(1, setCorrente, (setVintiCasa + setVintiOspite)));
      const setData = {};
      for (let s = 1; s <= maxSet; s++) {
        setData[s] = {};
        FONDAMENTALI.forEach(f => {
          const evSet = storicoEventi.filter(ev => ev.set === s && ev.fondamentale === f.id);
          let pp = 0, p = 0, o = 0, m = 0, mm = 0;
          evSet.forEach(ev => {
            if (ev.valutazione === '++') pp++;
            else if (ev.valutazione === '+') p++;
            else if (ev.valutazione === '!') o++;
            else if (ev.valutazione === '-') m++;
            else if (ev.valutazione === '==') mm++;
          });
          const tot = pp + p + o + m + mm;
          if (tot > 0) {
            const eff = calcolaEfficienza(f.formulaTipo, pp, p, o, m, mm, tot);
            setData[s][f.id] = { eff, tot };
          } else {
            setData[s][f.id] = null;
          }
        });
      }

      // 5. Generatore Canvas del Grafico a Linee
      const generaCanvasGraficoLinee = () => {
        const cvs = document.createElement('canvas');
        cvs.width = 1500;
        cvs.height = 620;
        const ctx = cvs.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        const leftMargin = 130;
        const rightMargin = 50;
        const topMargin = 25;
        const bottomMargin = 85;
        const plotW = cvs.width - leftMargin - rightMargin;
        const plotH = cvs.height - topMargin - bottomMargin;
        const zeroY = topMargin + plotH / 2;

        const yValues = [100, 80, 60, 40, 20, 0, -20, -40, -60, -80, -100];
        ctx.font = '24px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        yValues.forEach(val => {
          const y = topMargin + ((100 - val) / 200) * plotH;
          ctx.beginPath();
          ctx.moveTo(leftMargin, y);
          ctx.lineTo(leftMargin + plotW, y);
          if (val === 0) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3.5;
          } else {
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 1.5;
          }
          ctx.stroke();

          ctx.fillStyle = '#000000';
          ctx.fillText(`${val}%`, leftMargin - 15, y);
        });

        const getXForSet = (s) => {
          if (maxSet === 1) return leftMargin + plotW / 2;
          const innerPadding = 90;
          return leftMargin + innerPadding + (s - 1) * ((plotW - 2 * innerPadding) / (maxSet - 1));
        };

        for (let s = 1; s <= maxSet; s++) {
          const x = getXForSet(s);

          ctx.font = '22px sans-serif';
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText('▼', x, zeroY + 4);

          ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#000000';
          ctx.fillText(`Set ${s}`, x, cvs.height - 35);
        }

        FONDAMENTALI.forEach(f => {
          const punti = [];
          for (let s = 1; s <= maxSet; s++) {
            const d = setData[s]?.[f.id];
            if (d && d.tot > 0) {
              const x = getXForSet(s);
              const clampedEff = Math.max(-100, Math.min(100, d.eff));
              const y = topMargin + ((100 - clampedEff) / 200) * plotH;
              punti.push({ x, y, eff: d.eff });
            }
          }

          if (punti.length > 0) {
            if (punti.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(punti[0].x, punti[0].y);
              for (let i = 1; i < punti.length; i++) {
                ctx.lineTo(punti[i].x, punti[i].y);
              }
              ctx.strokeStyle = f.colore;
              ctx.lineWidth = 4;
              ctx.stroke();
            }

            const mImg = imgMap[f.markerKey];
            punti.forEach(p => {
              if (mImg) {
                ctx.drawImage(mImg, p.x - 14, p.y - 14, 28, 28);
              } else {
                ctx.fillStyle = f.colore;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI);
                ctx.fill();
              }
            });
          }
        });

        return cvs.toDataURL('image/png');
      };

      // 6. Generatore Canvas Donut Torta
      const generaCanvasDonut = (f, eff) => {
        const cvs = document.createElement('canvas');
        cvs.width = 300;
        cvs.height = 300;
        const ctx = cvs.getContext('2d');
        const cx = 150, cy = 150;
        const R = 125;
        const r = 80;
        const ringW = R - r;
        const midR = (R + r) / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, midR, 0, 2 * Math.PI);
        ctx.lineWidth = ringW;
        ctx.strokeStyle = '#cccccc';
        ctx.stroke();

        const clampedEff = Math.max(-100, Math.min(100, eff));
        if (clampedEff !== 0) {
          const sweep = (Math.abs(clampedEff) / 100) * 2 * Math.PI;
          const startA = -Math.PI / 2;
          ctx.beginPath();
          if (clampedEff > 0) {
            ctx.arc(cx, cy, midR, startA, startA + sweep, false);
          } else {
            ctx.arc(cx, cy, midR, startA, startA - sweep, true);
          }
          ctx.lineWidth = ringW;
          ctx.strokeStyle = f.colore;
          ctx.stroke();
        }

        const iconImg = imgMap[f.iconKey];
        if (iconImg) {
          const iw = 70;
          const ih = 70;
          ctx.drawImage(iconImg, cx - iw / 2, cy - ih / 2, iw, ih);
        }

        return cvs.toDataURL('image/png');
      };

      // 7. COMPOSIZIONE PDF (A4 Portrait, 210 x 297 mm)

      // HEADER: Box Punteggio a sinistra
      doc.setFillColor(0, 119, 107); // #00776b (sfondoGrafico)
      doc.roundedRect(15, 14, 23, 18, 1.5, 1.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(`${setVintiCasa}-${setVintiOspite}`, 26.5, 23, { align: "center" });

      // 5 pallini set nel box
      const dotY = 28;
      const dotStartX = 18;
      const dotSpacing = 2.1;
      for (let s = 1; s <= 5; s++) {
        const dx = dotStartX + (s - 1) * dotSpacing;
        if (s <= setVintiCasa + setVintiOspite) {
          const setStorico = storicoSet?.[s - 1];
          const vintoCasa = setStorico ? setStorico.vintoCasa : (s <= setVintiCasa);
          if (vintoCasa) {
            doc.setFillColor(104, 202, 196); // #68cac4 (pallinoSetVinto)
            doc.circle(dx, dotY, 0.9, 'F');
          } else {
            doc.setFillColor(71, 71, 71); // #474747 (pallinoSetPerso)
            doc.circle(dx, dotY, 0.9, 'F');
          }
        } else {
          doc.setDrawColor(71, 71, 71); // pallinoSetNonGiocato (trasparente con bordo)
          doc.setLineWidth(0.25);
          doc.circle(dx, dotY, 0.9, 'S');
        }
      }

      // Nomi squadre e separatore rosso
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(squadraCasa, 42, 20.5);

      doc.setDrawColor(254, 81, 0); // #fe5100 (separator_rosso_pdf)
      doc.setLineWidth(0.6);
      doc.line(42, 24, 150, 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(squadraOspite, 42, 30.5);

      // Logo ufficiale Quick Scout Volley in alto a destra
      if (imgMap.logo) {
        doc.addImage(imgMap.logo, 'PNG', 154, 13, 41, 18);
      }

      // SEZIONE 1: Statistiche / Efficienza generale
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(254, 81, 0); // #fe5100 (rossoPdf)
      doc.text("Statistiche", 15, 41);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text("Efficienza generale", 15, 48);

      // Legenda a destra sopra il grafico
      const legStartX = 72;
      const legW = (195 - legStartX) / 6;
      FONDAMENTALI.forEach((f, idx) => {
        const lx = legStartX + idx * legW;
        const markerImg = imgMap[f.markerKey];
        if (markerImg) {
          doc.addImage(markerImg, 'PNG', lx, 45.5, 3.2, 3.2);
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        doc.text(f.nome, lx + 4.2, 48.2);
      });

      // Inserimento Grafico a Linee
      const lineGraphImgData = generaCanvasGraficoLinee();
      doc.addImage(lineGraphImgData, 'PNG', 15, 51, 180, 80);

      // SEZIONE 2: Efficienza fondamentali
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Efficienza fondamentali", 15, 142);

      // 6 Colonne Donut
      const colWidth = 180 / 6; // 30 mm
      FONDAMENTALI.forEach((f, idx) => {
        const colLeft = 15 + idx * colWidth;
        const colCenter = colLeft + colWidth / 2;
        const stats = matchStats[f.id];

        // 1. Donut
        const donutImgData = generaCanvasDonut(f, stats.eff);
        const donutSize = 25;
        doc.addImage(donutImgData, 'PNG', colCenter - donutSize / 2, 147, donutSize, donutSize);

        // 2. Percentuale grande in grassetto
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text(`${Math.round(stats.eff)}%`, colCenter, 178, { align: "center" });

        // 3. Colpi totali
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        const colpiStr = `${stats.tot} ${stats.tot === 1 ? 'colpo' : 'colpi'}`;
        doc.text(colpiStr, colCenter, 183.5, { align: "center" });

        // 4. Linea divisoria nera
        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.3);
        doc.line(colCenter - 6.5, 187, colCenter + 6.5, 187);

        // 5. Elenco valutazioni
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(30, 30, 30);
        let rigaY = 192.5;
        doc.text(`${stats.pp} ++`, colCenter, rigaY, { align: "center" });
        rigaY += 5;
        doc.text(`${stats.p} +`, colCenter, rigaY, { align: "center" });
        rigaY += 5;
        doc.text(`${stats.o} !`, colCenter, rigaY, { align: "center" });
        rigaY += 5;
        doc.text(`${stats.m} -`, colCenter, rigaY, { align: "center" });
        rigaY += 5;
        doc.text(`${stats.mm} ==`, colCenter, rigaY, { align: "center" });
      });

      // FOOTER: Separatore rosso, pag. 1-1 e data corrente
      doc.setDrawColor(254, 81, 0); // #fe5100
      doc.setLineWidth(0.5);
      doc.line(15, 282, 195, 282);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text("pag. 1-1", 15, 287);

      const oggi = new Date();
      const dataFormattata = `${oggi.getDate().toString().padStart(2, '0')}/${(oggi.getMonth() + 1).toString().padStart(2, '0')}/${oggi.getFullYear()}`;
      doc.text(dataFormattata, 195, 287, { align: "right" });

      doc.save(`QuickScout_Report_${squadraCasa.replace(/\s+/g, '_')}_vs_${squadraOspite.replace(/\s+/g, '_')}.pdf`);
      return doc;
    } catch (e) {
      console.error("Errore generazione PDF:", e);
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
    if (pallaCasa) pallaCasa.style.display = this.haPallaCasa ? 'inline-block' : 'none';
    if (pallaOspite) pallaOspite.style.display = !this.haPallaCasa ? 'inline-block' : 'none';

    const tabCasa = document.getElementById('tabellone-casa');
    const tabOspite = document.getElementById('tabellone-ospite');
    if (tabCasa) tabCasa.classList.toggle('in-battuta', this.haPallaCasa);
    if (tabOspite) tabOspite.classList.toggle('in-battuta', !this.haPallaCasa);

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

    // Aggiornamento Chip Libero (indicatore visivo se è in campo o panchina)
    const chipLibero = document.getElementById('btn-chip-libero');
    const chipLiberoText = document.getElementById('chip-libero-text');
    if (chipLibero && chipLiberoText) {
      const liberoInCampo = this.formazione.some(g => g.ruolo === 'L');
      if (liberoInCampo) {
        chipLibero.classList.add('in-campo');
        chipLiberoText.textContent = 'Libero in Campo';
        chipLibero.title = 'Libero in campo. Tocca per farlo uscire e far rientrare il Centrale.';
      } else {
        chipLibero.classList.remove('in-campo');
        chipLiberoText.textContent = 'Libero (L)';
        chipLibero.title = 'Libero in panchina. Tocca per farlo entrare per il Centrale in 2ª linea.';
      }
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
        const nominativo = [g.cognome, g.nome].filter(Boolean).join(' ');
        d.title = nominativo ? `#${g.numero} ${nominativo}` : `#${g.numero}`;
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
        const nominativo = g ? [g.cognome, g.nome].filter(Boolean).join(' ') : '';
        label.textContent = nominativo;
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
      const nominativo = [u.giocatore.cognome, u.giocatore.nome].filter(Boolean).join(' ');
      const pStr = nominativo ? `#${u.giocatore.numero} ${nominativo}` : `#${u.giocatore.numero}`;
      testoUltima = `${pStr} • ${u.fondamentale.toUpperCase()} (${u.valutazione})${spec}`;
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
      const nominativo = [g.cognome, g.nome].filter(Boolean).join(' ');
      opt.textContent = `Zona ${idx === 0 ? 1 : idx === 1 ? 2 : idx === 2 ? 3 : idx === 3 ? 4 : idx === 4 ? 5 : 6}: #${g.numero}${nominativo ? ' ' + nominativo : ''}`;
      selectZona.appendChild(opt);
    });

    selectEntrante.innerHTML = '';
    const riserve = this.tuttiGiocatori.filter(g => !this.formazione.some(inC => inC.id === g.id));
    riserve.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      const nominativo = [g.cognome, g.nome].filter(Boolean).join(' ');
      opt.textContent = `#${g.numero}${nominativo ? ' ' + nominativo : ''}`;
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
    const tabs = ['roster', 'formazione', 'partita', 'storico'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const content = document.getElementById(`tab-gestione-${t}`);
      if (btn) btn.classList.toggle('attivo', t === tabName);
      if (content) content.style.display = (t === tabName) ? 'block' : 'none';
    });
    if (tabName === 'roster') this.renderRosterList();
    if (tabName === 'formazione') this.renderFormazioneSelects();
    if (tabName === 'storico') this.renderStoricoPartite();
    if (tabName === 'partita') {
      const inCasa = document.getElementById('input-nome-casa');
      const inOspite = document.getElementById('input-nome-ospite');
      if (inCasa) inCasa.value = this.squadraCasa;
      if (inOspite) inOspite.value = this.squadraOspite;
      const chkRot = document.getElementById('check-auto-libero-rotazione');
      const chkEnt = document.getElementById('check-auto-libero-entrata');
      if (chkRot) chkRot.checked = this.autoLiberoRotazione;
      if (chkEnt) chkEnt.checked = this.autoLiberoEntrata;
    }
  }

  avviaNuovaPartita() {
    // Se c'erano azioni registrate, archivia automaticamente la partita precedente!
    if (this.storicoEventi && this.storicoEventi.length > 0) {
      if (!confirm('Vuoi avviare una nuova partita azzerando punteggi, set ed eventi?\n\nLa partita attuale verrà salvata automaticamente nello "Storico Partite" e il tuo Roster rimarrà conservato.')) {
        return;
      }
      this.archiviaPartitaCorrente(false); // archivia senza mostrare alert invasivi
    } else {
      if (!confirm('Vuoi avviare una nuova partita azzerando punteggi e set?\n\nIl tuo Roster rimarrà conservato.')) {
        return;
      }
    }

    this.puntiCasa = 0;
    this.puntiOspite = 0;
    this.setCorrente = 1;
    this.setVintiCasa = 0;
    this.setVintiOspite = 0;
    this.haPallaCasa = true;

    this.timeoutCasa = 0;
    this.timeoutOspite = 0;
    this.sostituzioniCasa = 0;
    this.storicoSet = [];
    this.storicoEventi = [];
    this.numeroPunto = 1;
    this.numeroScambio = 0;
    this.fondamentaleSelezionato = 'battuta';
    this.liberoSostituitoId = null;

    // Se il libero era in campo al posto di un centrale, ripristina il centrale titolare
    const indexLibero = this.formazione.findIndex(g => g.ruolo === 'L');
    if (indexLibero !== -1) {
      const centrale = this.tuttiGiocatori.find(g => g.ruolo === 'C' && !this.formazione.some(inC => inC.id === g.id));
      if (centrale) {
        this.formazione[indexLibero] = centrale;
      }
    }
    this.giocatoreAttivo = null;

    this.salvaStato();
    this.salvaRosterPermanente();
    this.render();

    const modal = document.getElementById('modal-gestione');
    if (modal) modal.classList.remove('visibile');
    alert('Nuova partita avviata con successo! Punteggi azzerati, il tuo Roster è pronto.');
  }

  // =========================================================
  // ARCHIVIO & STORICO PARTITE
  // =========================================================
  archiviaPartitaCorrente(mostraAlert = true) {
    if (!this.storicoEventi || this.storicoEventi.length === 0) {
      if (mostraAlert) alert("Nessuna azione registrata in questa partita da archiviare.");
      return;
    }

    const ora = new Date();
    const dataStr = `${ora.getDate().toString().padStart(2, '0')}/${(ora.getMonth() + 1).toString().padStart(2, '0')}/${ora.getFullYear()} ${ora.getHours().toString().padStart(2, '0')}:${ora.getMinutes().toString().padStart(2, '0')}`;

    const partita = {
      id: Date.now(),
      data: dataStr,
      squadraCasa: this.squadraCasa,
      squadraOspite: this.squadraOspite,
      setVintiCasa: this.setVintiCasa,
      setVintiOspite: this.setVintiOspite,
      setCorrente: this.setCorrente,
      puntiCasa: this.puntiCasa,
      puntiOspite: this.puntiOspite,
      storicoSet: JSON.parse(JSON.stringify(this.storicoSet || [])),
      totaleAzioni: this.storicoEventi.length,
      storicoEventi: JSON.parse(JSON.stringify(this.storicoEventi)),
      tuttiGiocatori: JSON.parse(JSON.stringify(this.tuttiGiocatori)),
      formazioneIds: this.formazione.map(g => g.id)
    };

    if (!this.archivioPartite) this.archivioPartite = [];
    this.archivioPartite.unshift(partita);
    this.salvaArchivioPartitePermanente();
    this.renderStoricoPartite();

    if (mostraAlert) {
      alert(`Partita "${this.squadraCasa} vs ${this.squadraOspite}" salvata con successo nello Storico!`);
    }
  }

  salvaPartitaAttualeNelloStorico() {
    this.archiviaPartitaCorrente(true);
  }

  caricaPartitaDaStorico(id) {
    const p = this.archivioPartite.find(item => item.id === id);
    if (!p) return;

    if (!confirm(`Vuoi caricare la partita del ${p.data} (${p.squadraCasa} vs ${p.squadraOspite}) nello scout attivo?\nI dati non salvati del match attuale verranno sostituiti.`)) {
      return;
    }

    this.squadraCasa = p.squadraCasa;
    this.squadraOspite = p.squadraOspite;
    this.setVintiCasa = p.setVintiCasa ?? 0;
    this.setVintiOspite = p.setVintiOspite ?? 0;
    this.setCorrente = p.setCorrente ?? 1;
    this.puntiCasa = p.puntiCasa ?? 0;
    this.puntiOspite = p.puntiOspite ?? 0;
    this.storicoSet = p.storicoSet || [];
    this.storicoEventi = p.storicoEventi || [];
    if (p.tuttiGiocatori && p.tuttiGiocatori.length >= 6) this.tuttiGiocatori = p.tuttiGiocatori;
    if (p.formazioneIds) {
      this.formazione = p.formazioneIds.map(fid => this.tuttiGiocatori.find(g => g.id === fid) || this.tuttiGiocatori[0]);
    }
    this.giocatoreAttivo = null;
    this.haPallaCasa = true;

    this.salvaStato();
    this.render();

    const modal = document.getElementById('modal-gestione');
    if (modal) modal.classList.remove('visibile');
    alert(`Partita "${p.squadraCasa} vs ${p.squadraOspite}" caricata con successo!`);
  }

  eliminaPartitaDaStorico(id) {
    const p = this.archivioPartite.find(item => item.id === id);
    if (!p) return;

    if (!confirm(`Sei sicuro di voler eliminare dal tuo storico la partita del ${p.data} (${p.squadraCasa} vs ${p.squadraOspite})?`)) {
      return;
    }

    this.archivioPartite = this.archivioPartite.filter(item => item.id !== id);
    this.salvaArchivioPartitePermanente();
    this.renderStoricoPartite();
  }

  generaReportPDFPerPartita(id) {
    const p = this.archivioPartite.find(item => item.id === id);
    if (!p) return;
    this.generaReportPDF(p);
  }

  renderStoricoPartite() {
    const container = document.getElementById('lista-storico-container');
    if (!container) return;
    container.innerHTML = '';

    if (!this.archivioPartite || this.archivioPartite.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:rgba(255,255,255,0.7); font-size:13px; line-height:1.6;">
          Nessuna partita archiviata al momento.<br>
          <small style="opacity:0.8;">Quando salvi un match o premi "Avvia Nuova Partita", la partita appena conclusa viene salvata automaticamente qui con tutti i dati e il report PDF!</small>
        </div>
      `;
      return;
    }

    this.archivioPartite.forEach(p => {
      const card = document.createElement('div');
      card.className = 'riga-atleta-roster';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'stretch';
      card.style.gap = '8px';
      card.style.padding = '10px 12px';

      const parzialiStr = (p.storicoSet && p.storicoSet.length > 0)
        ? p.storicoSet.map(s => `${s.puntiCasa}-${s.puntiOspite}`).join(', ')
        : `${p.puntiCasa}-${p.puntiOspite} (Set ${p.setCorrente})`;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:900; font-size:15px; color:white;">
              ${p.squadraCasa} vs ${p.squadraOspite}
            </div>
            <div style="font-size:11px; opacity:0.75; margin-top:2px;">
              📅 ${p.data} • 🏐 ${p.totaleAzioni || p.storicoEventi?.length || 0} azioni scoutate
            </div>
          </div>
          <div style="text-align:right;">
            <span style="font-size:16px; font-weight:900; color:#00ADB5;">
              ${p.setVintiCasa ?? 0} - ${p.setVintiOspite ?? 0}
            </span>
          </div>
        </div>
        <div style="font-size:11px; background:rgba(0,0,0,0.25); padding:4px 8px; border-radius:4px; color:#E0E0E0;">
          Parziali Set: <strong>${parzialiStr}</strong>
        </div>
        <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:4px;">
          <button class="btn-bottom" style="padding:4px 10px; font-size:11px; background:#FE5100;" onclick="app.generaReportPDFPerPartita(${p.id})" title="Scarica Report PDF della Partita">
            📄 PDF
          </button>
          <button class="btn-bottom" style="padding:4px 10px; font-size:11px; background:#00ADB5;" onclick="app.caricaPartitaDaStorico(${p.id})" title="Ricarica Partita nello Scout">
            📂 Carica
          </button>
          <button class="btn-bottom" style="padding:4px 10px; font-size:11px; background:#C62828;" onclick="app.eliminaPartitaDaStorico(${p.id})" title="Elimina Partita dallo Storico">
            🗑️
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  ripristinaRosterPredefinito() {
    if (!confirm('Attenzione: questa operazione cancellerà il tuo Roster personalizzato e ripristinerà i numeri base da #1 a #12 vuoti.\n\nSei sicuro di voler procedere?')) {
      return;
    }
    localStorage.removeItem('quickscout_roster');
    localStorage.removeItem('quickscout_state');
    location.reload();
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
      const nominativo = [g.cognome, g.nome].filter(Boolean).join(' ');

      const riga = document.createElement('div');
      riga.className = 'riga-atleta-roster';
      riga.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="cerchio-giocatore ${g.ruolo === 'L' ? 'libero' : ''}" style="width:36px; height:36px; font-size:16px;">
            ${g.numero}
          </div>
          <div>
            <div style="font-weight:900; font-size:14px; color:white;">
              ${nominativo || `Giocatore #${g.numero}`}
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
    document.getElementById('input-giocatore-cognome').value = g.cognome || '';
    document.getElementById('input-giocatore-nome').value = g.nome || '';
    document.getElementById('select-giocatore-ruolo').value = g.ruolo || 'S';

    const titolo = document.getElementById('form-giocatore-titolo');
    const nominativo = [g.cognome, g.nome].filter(Boolean).join(' ');
    if (titolo) titolo.textContent = nominativo ? `✏️ Modifica Giocatore #${g.numero} ${nominativo}` : `✏️ Modifica Giocatore #${g.numero}`;

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

    if (idInput) {
      // Modifica esistente
      const id = parseInt(idInput);
      const esisteAltro = this.tuttiGiocatori.find(g => g.id !== id && g.numero === numInput);
      if (esisteAltro) {
        const nomeAltro = [esisteAltro.cognome, esisteAltro.nome].filter(Boolean).join(' ') || `#${esisteAltro.numero}`;
        alert(`Il numero #${numInput} è già utilizzato da ${nomeAltro}.`);
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
        const nomeGia = [esisteGia.cognome, esisteGia.nome].filter(Boolean).join(' ') || `#${esisteGia.numero}`;
        alert(`Il numero #${numInput} è già presente nel roster (${nomeGia}).`);
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

    const nominativo = [g.cognome, g.nome].filter(Boolean).join(' ');
    const desc = nominativo ? `#${g.numero} ${nominativo}` : `#${g.numero}`;
    if (!confirm(`Sei sicuro di voler eliminare ${desc} dal roster?`)) {
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
      this.giocatoreAttivo = null;
    }

    this.salvaStato();
    this.render();
    this.renderRosterList();
    this.renderFormazioneSelects();
  }

  renderFormazioneSelects() {
    const zoneKeys = [
      { idSel: 'setup-zona-1', idx: 0, label: 'Zona 1' },
      { idSel: 'setup-zona-2', idx: 1, label: 'Zona 2' },
      { idSel: 'setup-zona-3', idx: 2, label: 'Zona 3' },
      { idSel: 'setup-zona-4', idx: 3, label: 'Zona 4' },
      { idSel: 'setup-zona-5', idx: 4, label: 'Zona 5' },
      { idSel: 'setup-zona-6', idx: 5, label: 'Zona 6' }
    ];

    zoneKeys.forEach(z => {
      const select = document.getElementById(z.idSel);
      if (!select) return;
      select.innerHTML = '';

      const attuale = this.formazione[z.idx];

      this.tuttiGiocatori.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        const nominativo = [g.cognome, g.nome].filter(Boolean).join(' ');
        opt.textContent = nominativo ? `#${g.numero} ${nominativo}` : `#${g.numero}`;
        if (attuale && attuale.id === g.id) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    });

    // Popola anche il selettore del Libero Titolare Designato
    const selLibero = document.getElementById('setup-libero-titolare');
    if (selLibero) {
      selLibero.innerHTML = '';
      const liberi = this.tuttiGiocatori.filter(g => g.ruolo === 'L');
      if (liberi.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Nessun Libero (L) nel roster';
        selLibero.appendChild(opt);
      } else {
        const liberoAttivo = this.getLiberoDesignato();
        liberi.forEach(l => {
          const opt = document.createElement('option');
          opt.value = l.id;
          const nom = [l.cognome, l.nome].filter(Boolean).join(' ');
          opt.textContent = nom ? `#${l.numero} ${nom} (L)` : `#${l.numero} (L)`;
          if (liberoAttivo && liberoAttivo.id === l.id) {
            opt.selected = true;
          }
          selLibero.appendChild(opt);
        });
      }
    }
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

    const selLibero = document.getElementById('setup-libero-titolare');
    if (selLibero && selLibero.value) {
      this.liberoDesignatoId = parseInt(selLibero.value);
    }

    const nuovaFormazione = ids.map(id => this.tuttiGiocatori.find(g => g.id === id));
    this.formazione = nuovaFormazione;
    this.giocatoreAttivo = null;

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
  window.app = app = new ScoutApp();
});
