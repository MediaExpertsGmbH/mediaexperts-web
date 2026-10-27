"""Builds de/, fr/ and it/ from the English page index.html.

Edit the English page, add any new text to TEXT below, then run:  python3 build-lang.py
The script lists every English string it could not find, so stale entries show up.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).parent
LANGS = ["de", "fr", "it"]
HTML_LANG = {"de": "de-CH", "fr": "fr-CH", "it": "it-CH"}

# (English, Deutsch, Français, Italiano) — whole text nodes or attribute values
TEXT = [
 ("Media Experts — Swiss software for off-plan real estate",
  "Media Experts — Schweizer Software für Neubauprojekte",
  "Media Experts — Logiciel suisse pour les constructions neuves",
  "Media Experts — Software svizzero per nuove costruzioni"),
 ("Media Experts GmbH is the Zurich prop-tech company behind GroundZero and RPLX, from the first building permit to the last unit sold.",
  "Media Experts GmbH ist das Zürcher Prop-Tech-Unternehmen hinter GroundZero und RPLX, von der ersten Baubewilligung bis zur letzten verkauften Einheit.",
  "Media Experts GmbH est l’entreprise prop-tech zurichoise derrière GroundZero et RPLX, du premier permis de construire au dernier lot vendu.",
  "Media Experts GmbH è l’azienda prop-tech di Zurigo dietro GroundZero e RPLX, dalla prima licenza edilizia all’ultima unità venduta."),
 ("Media Experts home", "Media Experts Startseite", "Accueil Media Experts", "Home Media Experts"),
 ("Company", "Unternehmen", "Entreprise", "Azienda"),
 ("Contact", "Kontakt", "Contact", "Contatti"),
 ("Language", "Sprache", "Langue", "Lingua"),
 ("MEDIA EXPERTS · ZÜRICH · SINCE 2018", "MEDIA EXPERTS · ZÜRICH · SEIT 2018", "MEDIA EXPERTS · ZURICH · DEPUIS 2018", "MEDIA EXPERTS · ZURIGO · DAL 2018"),
 ("Swiss software for ", "Schweizer Software für ", "Logiciel suisse pour les ", "Software svizzero per "),
 ("off-plan", "Neubauprojekte", "constructions neuves.", "nuove costruzioni."),
 (" real estate.", ".", "", ""),
 ("We’re the Zurich prop-tech company behind ", "Wir sind das Zürcher Prop-Tech-Unternehmen hinter ", "Nous sommes l’entreprise prop-tech zurichoise derrière ", "Siamo l’azienda prop-tech di Zurigo dietro "),
 (" and ", " und ", " et ", " e "),
 (", from the first building permit to the last unit sold.", ", von der ersten Baubewilligung bis zur letzten verkauften Einheit.", ", du premier permis de construire au dernier lot vendu.", ", dalla prima licenza edilizia all’ultima unità venduta."),
 ("SCROLL THE STORY", "ZUR GESCHICHTE", "DÉFILER L’HISTOIRE", "SCORRI LA STORIA"),
 ("GROUNDZERO · PARCEL, PERMIT, LIVE", "GROUNDZERO · PARZELLE, BEWILLIGUNG, LIVE", "GROUNDZERO · PARCELLE, PERMIS, EN DIRECT", "GROUNDZERO · LOTTO, LICENZA, LIVE"),
 ("It starts with a permit", "Alles beginnt mit einer Bewilligung", "Tout commence par un permis", "Tutto inizia con una licenza"),
 ("GroundZero is the live radar of new-build homes, from Prague to Zurich, Miami to Dubai. Building permits, construction starts and off-plan availability, refreshed every hour.",
  "GroundZero ist das Live-Radar für Neubauwohnungen, von Prag bis Zürich, von Miami bis Dubai. Baubewilligungen, Baustarts und Verfügbarkeit ab Plan, stündlich aktualisiert.",
  "GroundZero est le radar en direct des logements neufs, de Prague à Zurich, de Miami à Dubaï. Permis de construire, mises en chantier et disponibilités sur plan, actualisés toutes les heures.",
  "GroundZero è il radar live delle nuove costruzioni, da Praga a Zurigo, da Miami a Dubai. Licenze edilizie, avvii di cantiere e disponibilità su carta, aggiornati ogni ora."),
 ("10,288", "10’288", "10 288", "10.288"),
 ("732,017", "732’017", "732 017", "732.017"),
 ("PROJECTS", "PROJEKTE", "PROJETS", "PROGETTI"),
 ("UNITS", "EINHEITEN", "LOGEMENTS", "UNITÀ"),
 ("COUNTRIES", "LÄNDER", "PAYS", "PAESI"),
 ("Draw your radar ↗", "Ihr Radar zeichnen ↗", "Tracez votre radar ↗", "Disegna il tuo radar ↗"),
 ("RPLX Property Navigator", "RPLX Property Navigator", "RPLX Property Navigator", "RPLX Property Navigator"),
 ("Unit A-4.02", "Einheit A-4.02", "Lot A-4.02", "Unità A-4.02"),
 ("Unit A-3.02", "Einheit A-3.02", "Lot A-3.02", "Unità A-3.02"),
 ("Unit B-2.05", "Einheit B-2.05", "Lot B-2.05", "Unità B-2.05"),
 ("A-4.02 · AVAILABLE", "A-4.02 · VERFÜGBAR", "A-4.02 · DISPONIBLE", "A-4.02 · DISPONIBILE"),
 ("A-3.02 · AVAILABLE", "A-3.02 · VERFÜGBAR", "A-3.02 · DISPONIBLE", "A-3.02 · DISPONIBILE"),
 ("B-2.05 · WAITLIST", "B-2.05 · WARTELISTE", "B-2.05 · LISTE D’ATTENTE", "B-2.05 · LISTA D’ATTESA"),
 ("Walk through it before the first wall stands", "Begehen Sie es, bevor die erste Wand steht", "Visitez-le avant que le premier mur ne soit posé", "Visitalo prima che sorga il primo muro"),
 ("Keep scrolling. The building is live.", "Scrollen Sie weiter. Das Gebäude ist live.", "Continuez à défiler. L’immeuble est en direct.", "Continua a scorrere. L’edificio è live."),
 ("Pick a unit", "Wählen Sie eine Einheit", "Choisissez un lot", "Scegli un’unità"),
 ("Every unit is live: plan, status and price. Tap one on the building.", "Jede Einheit ist live: Plan, Status und Preis. Tippen Sie auf eine am Gebäude.", "Chaque lot est en direct : plan, statut et prix. Touchez-en un sur l’immeuble.", "Ogni unità è live: pianta, stato e prezzo. Toccane una sull’edificio."),
 ("From click to reservation", "Vom Klick zur Reservation", "Du clic à la réservation", "Dal clic alla prenotazione"),
 ("Unit selected", "Einheit gewählt", "Lot sélectionné", "Unità selezionata"),
 ("3D tour viewed", "3D-Rundgang angesehen", "Visite 3D effectuée", "Tour 3D visto"),
 ("Buyer details", "Käuferdaten", "Coordonnées de l’acheteur", "Dati dell’acquirente"),
 ("Deposit in escrow", "Anzahlung auf Treuhand", "Acompte sous séquestre", "Acconto in deposito fiduciario"),
 ("Reserved", "Reserviert", "Réservé", "Prenotata"),
 ("UNIT", "EINHEIT", "LOT", "UNITÀ"),
 ("AVAILABLE", "VERFÜGBAR", "DISPONIBLE", "DISPONIBILE"),
 ("WAITLIST", "WARTELISTE", "LISTE D’ATTENTE", "LISTA D’ATTESA"),
 ("RESERVED", "RESERVIERT", "RÉSERVÉ", "PRENOTATA"),
 ("ROOMS", "ZIMMER", "PIÈCES", "LOCALI"),
 ("LIVING AREA", "WOHNFLÄCHE", "SURFACE HABITABLE", "SUPERFICIE ABITABILE"),
 ("BALCONY", "BALKON", "BALCON", "BALCONE"),
 ("FLOOR · FACING", "ETAGE · AUSRICHTUNG", "ÉTAGE · ORIENTATION", "PIANO · ESPOSIZIONE"),
 ("Price", "Preis", "Prix", "Prezzo"),
 ("3D walkthrough of the unit: living room and dining area", "3D-Rundgang durch die Einheit: Wohn- und Essbereich", "Visite 3D du lot : séjour et coin repas", "Tour 3D dell’unità: soggiorno e zona pranzo"),
 ("3D walkthrough", "3D-Rundgang", "Visite 3D", "Tour 3D"),
 ("Viewed ✓", "Angesehen ✓", "Vue ✓", "Visto ✓"),
 ("BUYER", "KÄUFERIN", "ACHETEUSE", "ACQUIRENTE"),
 ("EMAIL", "E-MAIL", "E-MAIL", "E-MAIL"),
 ("Financing", "Finanzierung", "Financement", "Finanziamento"),
 ("Pre-approved ✓", "Vorab bewilligt ✓", "Pré-approuvé ✓", "Pre-approvato ✓"),
 ("M1 · Reservation deposit 10%", "M1 · Reservationsanzahlung 10%", "M1 · Acompte de réservation 10 %", "M1 · Acconto di prenotazione 10%"),
 ("Secured in escrow ✓", "Auf Treuhandkonto gesichert ✓", "Sécurisé sous séquestre ✓", "Garantito in deposito fiduciario ✓"),
 (" is reserved for Anna.", " ist für Anna reserviert.", " est réservé pour Anna.", " è prenotata per Anna."),
 ("Nothing has been built yet. The sale already has.", "Noch ist nichts gebaut. Der Verkauf schon.", "Rien n’est encore construit. La vente, si.", "Non è ancora costruito nulla. La vendita sì."),
 ("RPLX · REAL ESTATE OS FOR OFF-PLAN", "RPLX · REAL ESTATE OS FÜR VERKAUF AB PLAN", "RPLX · L’OS IMMOBILIER POUR LA VENTE SUR PLAN", "RPLX · L’OS IMMOBILIARE PER LA VENDITA SU CARTA"),
 ("Sell it before it stands", "Verkaufen, bevor es steht", "Vendez-le avant qu’il ne soit construit", "Vendilo prima che sia costruito"),
 ("One system for the whole off-plan sale. Inventory, buyers, agents and money in one place, instead of spreadsheets, PDFs and a dozen tools.",
  "Ein System für den ganzen Verkauf ab Plan. Inventar, Käufer, Vermittler und Zahlungen an einem Ort, statt Tabellen, PDFs und einem Dutzend Tools.",
  "Un seul système pour toute la vente sur plan. Inventaire, acheteurs, agents et paiements au même endroit, au lieu de tableurs, de PDF et d’une douzaine d’outils.",
  "Un unico sistema per tutta la vendita su carta. Inventario, acquirenti, agenti e pagamenti in un solo posto, invece di fogli di calcolo, PDF e una dozzina di strumenti."),
 ("Demand heatmap", "Nachfrage-Heatmap", "Carte de chaleur de la demande", "Heatmap della domanda"),
 ("See which units buyers want before you price.", "Sehen, welche Einheiten Käufer wollen, bevor die Preise stehen.", "Voyez quels lots les acheteurs veulent avant de fixer les prix.", "Scopri quali unità vogliono gli acquirenti prima di fissare i prezzi."),
 ("3D tours of homes not yet built.", "3D-Rundgänge durch noch nicht gebaute Wohnungen.", "Visites 3D de logements pas encore construits.", "Tour 3D di case non ancora costruite."),
 ("From architect’s sketch to sales-ready render.", "Von der Architektenskizze zum verkaufsfertigen Rendering.", "Du croquis de l’architecte au rendu prêt à vendre.", "Dallo schizzo dell’architetto al render pronto per la vendita."),
 ("Live inventory", "Live-Inventar", "Inventaire en direct", "Inventario live"),
 ("Every unit, plan and price, always current.", "Jede Einheit, jeder Plan, jeder Preis, immer aktuell.", "Chaque lot, plan et prix, toujours à jour.", "Ogni unità, pianta e prezzo, sempre aggiornati."),
 ("Lead board", "Lead Board", "Tableau des leads", "Lead board"),
 ("Every inquiry from first click to reservation.", "Jede Anfrage vom ersten Klick bis zur Reservation.", "Chaque demande, du premier clic à la réservation.", "Ogni richiesta dal primo clic alla prenotazione."),
 ("Escrow &amp; commissions", "Treuhand &amp; Provisionen", "Séquestre &amp; commissions", "Deposito fiduciario &amp; provvigioni"),
 ("Milestone payments and who gets paid, clearly.", "Etappenzahlungen und wer was erhält, klar geregelt.", "Paiements par étapes et qui est payé, en toute clarté.", "Pagamenti a tappe e chi viene pagato, con chiarezza."),
 ("LIVE MARKETS · MORE EACH QUARTER", "LIVE-MÄRKTE · JEDES QUARTAL MEHR", "MARCHÉS EN DIRECT · PLUS CHAQUE TRIMESTRE", "MERCATI LIVE · DI PIÙ OGNI TRIMESTRE"),
 ("Six", "Sechs", "Six", "Sei"),
 (" skylines. One radar", " Skylines. Ein Radar", " skylines. Un radar", " skyline. Un radar"),
 ("projects", "Projekte", "projets", "progetti"),
 ("units", "Einheiten", "logements", "unità"),
 ("Czech Republic", "Tschechien", "République tchèque", "Repubblica Ceca"),
 ("Switzerland", "Schweiz", "Suisse", "Svizzera"),
 ("Dubai", "Dubai", "Dubaï", "Dubai"),
 ("United States", "USA", "États-Unis", "Stati Uniti"),
 ("Germany", "Deutschland", "Allemagne", "Germania"),
 ("Austria", "Österreich", "Autriche", "Austria"),
 ("3,340 projects · 145,526 units", "3’340 Projekte · 145’526 Einheiten", "3 340 projets · 145 526 logements", "3.340 progetti · 145.526 unità"),
 ("1,736 projects · 24,154 units", "1’736 Projekte · 24’154 Einheiten", "1 736 projets · 24 154 logements", "1.736 progetti · 24.154 unità"),
 ("828 projects · 314,144 units", "828 Projekte · 314’144 Einheiten", "828 projets · 314 144 logements", "828 progetti · 314.144 unità"),
 ("2,731 projects · 93,268 units", "2’731 Projekte · 93’268 Einheiten", "2 731 projets · 93 268 logements", "2.731 progetti · 93.268 unità"),
 ("1,219 projects · 97,968 units", "1’219 Projekte · 97’968 Einheiten", "1 219 projets · 97 968 logements", "1.219 progetti · 97.968 unità"),
 ("434 projects · 56,957 units", "434 Projekte · 56’957 Einheiten", "434 projets · 56 957 logements", "434 progetti · 56.957 unità"),
 ("From studio to product", "Vom Studio zum Produkt", "Du studio au produit", "Dallo studio al prodotto"),
 ("Years of client work in property, media and visualisation showed us what the industry was missing. So we stopped doing everything, and built it.",
  "Jahre der Kundenarbeit in Immobilien, Medien und Visualisierung haben uns gezeigt, was der Branche fehlt. Also haben wir aufgehört, alles zu machen, und es gebaut.",
  "Des années de travail pour des clients dans l’immobilier, les médias et la visualisation nous ont montré ce qui manquait au secteur. Alors nous avons arrêté de tout faire, et nous l’avons construit.",
  "Anni di lavoro per clienti nell’immobiliare, nei media e nella visualizzazione ci hanno mostrato cosa mancava al settore. Così abbiamo smesso di fare tutto, e l’abbiamo costruito."),
 ("Software studio", "Software-Studio", "Studio logiciel", "Studio software"),
 ("Web, apps, 3D and VR for real estate, media and industry clients.", "Web, Apps, 3D und VR für Kunden aus Immobilien, Medien und Industrie.", "Web, apps, 3D et VR pour des clients de l’immobilier, des médias et de l’industrie.", "Web, app, 3D e VR per clienti dell’immobiliare, dei media e dell’industria."),
 ("THEN", "DANACH", "ENSUITE", "POI"),
 ("Focus on property", "Fokus Immobilien", "Cap sur l’immobilier", "Focus sull’immobiliare"),
 ("Virtual tours and sales tools for developers showed us where off-plan sales break down.", "Virtuelle Rundgänge und Verkaufstools für Entwickler zeigten uns, wo der Verkauf ab Plan scheitert.", "Visites virtuelles et outils de vente pour promoteurs nous ont montré où la vente sur plan échoue.", "Tour virtuali e strumenti di vendita per sviluppatori ci hanno mostrato dove si inceppa la vendita su carta."),
 ("TODAY", "HEUTE", "AUJOURD’HUI", "OGGI"),
 ("Product company", "Produktunternehmen", "Éditeur de logiciels", "Azienda di prodotto"),
 ("All our energy goes into RPLX and GroundZero, built in Switzerland.", "Unsere ganze Energie fliesst in RPLX und GroundZero, gebaut in der Schweiz.", "Toute notre énergie va à RPLX et GroundZero, conçus en Suisse.", "Tutta la nostra energia va in RPLX e GroundZero, realizzati in Svizzera."),
 ("Selected engagements on request.", "Ausgewählte Mandate auf Anfrage.", "Mandats choisis sur demande.", "Incarichi selezionati su richiesta."),
 ("Talk to us →", "Sprechen Sie mit uns →", "Parlons-en →", "Parliamone →"),
 ("Our office", "Unser Büro", "Nos bureaux", "Il nostro ufficio"),
 ("Reception of the Media Experts office in Zurich: carved wooden staircase, brass desk and large paintings.",
  "Empfang des Media Experts Büros in Zürich: geschnitzte Holztreppe, Messingtheke und grosse Gemälde.",
  "Accueil des bureaux de Media Experts à Zurich : escalier en bois sculpté, comptoir en laiton et grands tableaux.",
  "Reception dell’ufficio Media Experts a Zurigo: scala in legno intagliato, bancone in ottone e grandi dipinti."),
 ("OUR OFFICE", "UNSER BÜRO", "NOS BUREAUX", "IL NOSTRO UFFICIO"),
 ("Bahnhofstrasse 10, Zürich", "Bahnhofstrasse 10, Zürich", "Bahnhofstrasse 10, Zurich", "Bahnhofstrasse 10, Zurigo"),
 ("LET’S BUILD WHAT’S NEXT", "BAUEN WIR, WAS KOMMT", "CONSTRUISONS LA SUITE", "COSTRUIAMO IL FUTURO"),
 ("Have a project in mind", "Haben Sie ein Projekt", "Vous avez un projet", "Hai un progetto in mente"),
 ("Or just leave us a message. We reply within one working day.", "Oder schreiben Sie uns einfach. Wir antworten innert eines Arbeitstages.", "Ou laissez-nous simplement un message. Nous répondons sous un jour ouvrable.", "Oppure lasciaci un messaggio. Rispondiamo entro un giorno lavorativo."),
 ("Thanks, ", "Danke, ", "Merci, ", "Grazie, "),
 ("Your email app should have opened with your message. If not, write to info@mediaexperts.ch.",
  "Ihr E-Mail-Programm sollte sich mit Ihrer Nachricht geöffnet haben. Falls nicht, schreiben Sie an info@mediaexperts.ch.",
  "Votre messagerie devrait s’être ouverte avec votre message. Sinon, écrivez à info@mediaexperts.ch.",
  "La tua app di posta dovrebbe essersi aperta con il messaggio. In caso contrario, scrivi a info@mediaexperts.ch."),
 ("Your message is on its way to our team. We’ve sent you a confirmation by email.",
  "Ihre Nachricht ist unterwegs zu unserem Team. Wir haben Ihnen eine Bestätigung per E-Mail geschickt.",
  "Votre message est en route vers notre équipe. Nous vous avons envoyé une confirmation par e-mail.",
  "Il tuo messaggio è in viaggio verso il nostro team. Ti abbiamo inviato una conferma via e-mail."),
 ("Send another message →", "Weitere Nachricht senden →", "Envoyer un autre message →", "Invia un altro messaggio →"),
 ("RPLX demo", "RPLX-Demo", "Démo RPLX", "Demo RPLX"),
 ("A project", "Ein Projekt", "Un projet", "Un progetto"),
 ("Something else", "Etwas anderes", "Autre chose", "Altro"),
 ("NAME", "NAME", "NOM", "NOME"),
 ("COMPANY · OPTIONAL", "FIRMA · OPTIONAL", "ENTREPRISE · FACULTATIF", "AZIENDA · FACOLTATIVO"),
 ("MESSAGE", "NACHRICHT", "MESSAGE", "MESSAGGIO"),
 ("Tell us about your project, timeline or question.", "Erzählen Sie uns von Ihrem Projekt, Zeitplan oder Ihrer Frage.", "Parlez-nous de votre projet, de votre calendrier ou de votre question.", "Raccontaci il tuo progetto, le tempistiche o la tua domanda."),
 ("We only use your details to reply.", "Wir verwenden Ihre Angaben nur für die Antwort.", "Nous utilisons vos coordonnées uniquement pour vous répondre.", "Usiamo i tuoi dati solo per risponderti."),
 ("Send message →", "Nachricht senden →", "Envoyer le message →", "Invia messaggio →"),
 ("Bahnhofstrasse 10, 8001 Zürich", "Bahnhofstrasse 10, 8001 Zürich", "Bahnhofstrasse 10, 8001 Zurich", "Bahnhofstrasse 10, 8001 Zurigo"),
 ("Legal notice", "Impressum", "Mentions légales", "Note legali"),
]

# chapter names shown in the floating pill (data-name)
CHAPTERS = [
 ("GROUNDZERO", "GROUNDZERO", "GROUNDZERO", "GROUNDZERO"),
 ("PROPERTY NAVIGATOR", "PROPERTY NAVIGATOR", "PROPERTY NAVIGATOR", "PROPERTY NAVIGATOR"),
 ("MARKETS", "MÄRKTE", "MARCHÉS", "MERCATI"),
 ("COMPANY", "UNTERNEHMEN", "ENTREPRISE", "AZIENDA"),
 ("CONTACT", "KONTAKT", "CONTACT", "CONTATTI"),
]

# punctuation spacing in French before ? (headline "Vous avez un projet" + "?")
EXTRA = {"fr": [('Vous avez un projet<span style="color:#F04A55">?</span>', 'Vous avez un projet<span style="color:#F04A55">&#8239;?</span>')]}


def build(lang):
    i = LANGS.index(lang) + 1
    s = (ROOT / "index.html").read_text()
    missing = []
    for row in TEXT:
        en, tr = row[0], row[i]
        n = 0
        # whole text node (keeps surrounding whitespace) and attribute values
        pat = re.compile(r">(\s*)" + re.escape(en) + r"(\s*)<")
        s, k = pat.subn(lambda m: ">" + m.group(1) + tr + m.group(2) + "<", s); n += k
        for attr in ("alt", "aria-label", "placeholder", "content", "data-l-available", "data-l-waitlist", "data-l-reserved", "data-l-projects", "data-l-units"):
            a = f'{attr}="{en}"'
            n += s.count(a); s = s.replace(a, f'{attr}="{tr}"')
        if n == 0:
            missing.append(en)
    for row in CHAPTERS:
        s = s.replace(f'data-name="{row[0]}"', f'data-name="{row[i]}"')
    for a, b in EXTRA.get(lang, []):
        s = s.replace(a, b)
    # html lang, paths one level down, language menu
    s = s.replace('<html lang="en">', f'<html lang="{HTML_LANG[lang]}">')
    s = s.replace('"assets/', '"../assets/').replace('href="impressum.html"', 'href="../impressum.html"')
    s = s.replace('aria-label="' + TEXT[5][i] + '">EN</summary>', 'aria-label="' + TEXT[5][i] + '">' + lang.upper() + '</summary>')
    s = s.replace('<a href="./" hreflang="en" aria-current="true">', '<a href="../" hreflang="en">')
    for l in LANGS:
        cur = ' aria-current="true"' if l == lang else ''
        s = s.replace(f'<a href="{l}/" hreflang="{l}">', f'<a href="../{l}/" hreflang="{l}"{cur}>')
    out = ROOT / lang / "index.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(s)
    return missing


for lang in LANGS:
    miss = build(lang)
    print(f"{lang}/index.html written" + (f" — not found: {miss}" if miss else ""))
