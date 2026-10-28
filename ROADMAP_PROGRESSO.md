# ROADMAP AVANZAMENTO QUICK SCOUT - PARITÀ COMPLETA APK ORIGINALE

Stato del progetto e avanzamento delle funzionalità rispetto all'APK originale Quick Scout Volley (`it.dotnext.volley`).

---

## 📊 STATO GENERALE
- **Punti Totali**: 14
- **Completati**: 14 / 14 (100%)
- **Stato**: COMPLETATO & VERIFICATO
- **Ultimo Aggiornamento**: 2026-10-28
- **Suite di Test**: 33 test automatici passati con successo (`verify_14_points.js`)

---

## GRUPPO 1: FUNZIONI RAPIDE LIVE SCOUT (UX PARTITA)
- [x] **1. Regolazione manuale rapida punteggio (`+` / `-`)**
  - Tasti `+` e `-` diretti sul tabellone punteggio principale e sulla ruota scout sia per Casa che per Ospiti.
  - Aggiornamento istantaneo del punteggio, persistenza in `localStorage` e salvataggio evento `tipo: 'punteggio'` con snapshot completo.
  - Annullamento dell'incremento/decremento tramite il pannello annulla.
- [x] **2. Rotazione inversa (Antioraria)**
  - Pulsante rotazione antioraria `↺` affiancato al pulsante rotazione oraria `↻`.
  - Spostamento corretto delle posizioni antiorario `[p6, p1, p2, p3, p4, p5]`.
  - Gestione del rientro automatico del centrale e uscita del libero secondo le regole ufficiali FIVB.
- [x] **3. Panchina visuale a bordo campo per cambi al volo**
  - Riquadro panchina visuale a bordo campo a sinistra del campetto con le riserve e badge sostituzioni.
  - Toccando un atleta in panchina si apre la griglia visuale a 6 zone (`modal-cambio-rapido`); un singolo tocco su una zona completa immediatamente il cambio senza dover cambiare schermata.
- [x] **4. Pannello Annulla descrittivo (Undo Contestuale)**
  - Sostituito il pulsante generico con la barra `scout-pannello-annulla` in stile DotNext con badge colorati per giocatore, fondamentale, valutazione, o dettagli per sostituzione (`🔄 Sostituzione #X ➔ #Y`), timeout, punti o rotazioni.
  - Il metodo `annullaUltimaAzione()` ripristina fedelmente lo snapshot precedente (punteggi, rotazioni, formazione, sostituzioni, timeout, set).
- [x] **5. Finestra / Flusso "Inizio Set" tra i set**
  - Finestra di transizione tra i set (`modal-inizio-set`) che riepiloga il punteggio del set appena terminato, la durata in minuti, i selettori per assegnare il servizio (battuta) per il nuovo set e l'anteprima delle 6 zone di formazione.
  - Pulsante per la chiusura manuale del set sempre disponibile in caso di interruzioni o decisioni arbitrali.
- [x] **6. Tempi e Durata dei Set**
  - Cronometraggio automatico di inizio e fine per ciascun set con calcolo della durata in minuti.
  - Finestra di modifica manuale dei tempi dei set (`modal-tempi-set`) per correggere la durata di ogni set da 1 a 5.
  - Integrazione delle durate nei tabelloni, nei report interattivi e nel referto PDF ufficiale.

---

## GRUPPO 2: DETTAGLIO COLPI & TRAIETTORIE
- [x] **7. Tipologie di Alzata e Attacco (Sub-actions)**
  - Attacco: bottoni rapidi per `Mani Out`, `Toccato Muro`, `Pallonetto`, `Piazzata`, `Fast`, `Pipe`, `Slash`.
  - Alzata: bottoni contestuali per `Alta`, `Mezza`, `Tesa`, `Super/Veloce`.
  - Barra dinamica contestuale con evidenziazione attiva `.sub-attiva` e reset automatico alla registrazione della valutazione.
- [x] **8. Tracciamento Traiettorie con Freccia (`CampoDirezione`)**
  - Mini-campetto interattivo arancione (#F39C12) direttamente nella colonna scout per tracciare con il dito o mouse la direzione della palla con freccia direzionale.
  - Memorizzazione delle coordinate relative `(xInizio, yInizio, xFine, yFine)` per ciascuna azione registrata.
  - Visualizzazione di tutte le frecce di attacco e battuta nel tab dedicato "Traiettorie" del Report.

---

## GRUPPO 3: REPORT A SCHERMO & FEDELTÀ PDF
- [x] **9. Schermata Report In-App Navigabile**
  - Modal navigabile `modal-report-interattivo` con 3 tab tematici:
    - **Riepilogo & Grafici**: punteggi parziali dei set con durata, 4 grafici a ciambella interattivi (Donut) per i fondamentali ed evoluzione punteggio punto a punto su canvas.
    - **Statistiche Giocatori**: tabella completa per atleta con filtri interattivi per Set (`Tutti`, `Set 1`, `Set 2`, `Set 3`, `Set 4`, `Set 5`).
    - **Traiettorie**: campetto con rendering delle direttrici di battuta e attacco tracciate durante la gara.
- [x] **10. Perfezionamento Grafico e Fedeltà PDF (Stile DotNext)**
  - Generazione PDF A4 multipagina ad alta risoluzione:
    - **Pagina 1**: Box punteggio DotNext con pallini dei set vinti/persi, separatore rosso `#fe5100`, logo ufficiale Quick Scout Volley, metadati gara (tipologia incontro, stagione, durate per set), grafico temporale a linee e 6 grafici a ciambella per fondamentali con dettaglio valutazioni (`++`, `+`, `!`, `-`, `==`).
    - **Pagina 2**: Tabella analitica completa delle statistiche individuali dei giocatori con punti totali, battute/ace, attacchi/kill, % efficienza attacco, ricezioni perfette/positive e muri vincenti.

---

## GRUPPO 4: GESTIONE SQUADRE, CONVOCATI E BACKUP
- [x] **11. Gestione Multi-Squadra**
  - Tab "🏢 Squadre" dedicato nella schermata di gestione per creare, gestire, selezionare o eliminare più squadre societarie (es. Under 16, Under 18, Prima Squadra).
  - Selezione rapida con caricamento istantaneo del roster associato e della formazione di partenza.
- [x] **12. Rosa Generale vs Convocati Partita**
  - Gestione dello stato convocazione per ciascun atleta (`✓ Conv` / `Escluso`) con pulsante rapido "Convoca Tutti".
  - Assegnazione del Capitano di gara con badge `★ K`.
- [x] **13. Export / Import Backup dei dati (File JSON)**
  - Tasto "Esporta Backup (.json)" per scaricare l'intero database locale (squadre, roster, formazioni, impostazioni, storico partite, snapshot).
  - Tasto "Importa Backup (.json)" con validazione automatica della struttura per trasferire o ripristinare i dati su qualsiasi dispositivo.
- [x] **14. Statistiche Aggregate Cumulative di Stagione**
  - Sotto-tab nello storico "📈 Statistiche Stagionali" che raggruppa e aggrega tutte le partite archiviate e la partita corrente.
  - Tabella completa con totali e percentuali per atleta su tutta la stagione agonistica (punti, ace, attacchi, % efficienza, ricezione %, muri).
