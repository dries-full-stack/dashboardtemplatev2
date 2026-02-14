# Belivert Dashboard - Vragen Ter Afstemming

Datum: 2026-02-12

Doel: de gevraagde uitbreidingen aan het Belivert dashboard correct implementeren, met 1:1 cijfers t.o.v. de bronsystemen (Teamleader + GoHighLevel).

## Overzicht Van Gevraagde Items

1. Lead generatoren aangekocht vs retour
2. Hoeveelheid leads per bron en campagnes + algemeen aantal
3. Totaal behaalde omzet sales (verkoop nieuwe installaties) + algemeen totaal (incl. service werken)
4. Dynamische KPI sales totaal -> omzet 1M
5. Maandelijkse omzet: vergelijking met dezelfde maand 3 jaar terug
6. Overzicht sales per productcategorie
7. Overzicht sales per regio
8. Overzicht omzet per verkoper
9. Cyclustijd opgemaakte offerte tot closen (algemeen)
10. Gemiddelde deal waarde

## Algemene Vragen (Geldt Voor Alles)

1. Tijdzone en daggrenzen
   - Kunnen we bevestigen dat alles in het dashboard op **Europe/Brussels** moet rekenen (dag- en maandgrenzen)?
2. Bron van waarheid per type metric
   - Leads: tellen we **GHL opportunities** (huidige dashboard definitie) of **unieke contacten**?
   - Sales/omzet: is Teamleader de bron van waarheid (deals/quotations/invoices), en zo ja welke entity telt als omzet?
3. Periodedefinitie
   - Tellen we metrics op basis van `created_at`, `updated_at`, `closed_at`, `invoice_date`, of iets anders?
4. Statusfilters
   - Welke statussen tellen mee voor:
     - "Won"/behaalde omzet
     - "Open pipeline"
     - Retour/chargebacks/credits
5. Valideren (acceptatie)
   - Kunnen jullie voor 1 vaste testperiode (bijv. 2026-02-01 t/m 2026-02-12) de "verwachte" aantallen/bedragen doorgeven zodat we 1:1 kunnen vergelijken?

## Vragen Per Item

### 1) Lead Generatoren Aangekocht vs Retour

1. Wat is de definitie van "aangekocht"?
   - Op basis van lead status in GHL, pipeline stage, tag, custom field, of facturatie?
2. Wat is de definitie van "retour"?
   - Welke signalen gebruiken we (tag/stage/reason) en geldt dat per leadgenerator verschillend?
3. Wordt een retour een negatieve lead (aftrekken) of apart rapporteren?
4. Moet "retour" ook financieel doorwerken (credit) of enkel tellen?

### 2) Aantal Leads Per Bron en Campagnes (+ Totaal)

1. "Lead" = opportunity of contact?
   - Als 1 contact meerdere opportunities kan hebben: tellen we beide of dedupliceren we?
2. "Bron" = `source_guess` (utm_source/attribution) of een vaste Belivert mapping?
3. "Campagne" komt uit waar?
   - UTM (`utm_campaign`) in GHL?
   - Een specifiek GHL custom field (id/naam)?
   - Of marketing platform campagnes (Meta/Google) op basis van spend tabellen?
4. Moeten we breakdown tonen per:
   - Bron
   - Bron + campagne
   - Campagne (ongeacht bron)
5. Welke datum telt voor leads in deze grafieken?
   - Opportunity `created_at` (aanrader) of contact `dateAdded`?

### 3) Behaalde Omzet (Nieuwe Installaties) + Algemeen Totaal (Incl. Service)

1. Omzet bron van waarheid:
   - Teamleader **invoices** (aanrader) of Teamleader deals (estimated_value) of quotations?
2. Bedrag:
   - Inclusief of exclusief btw?
   - Alleen EUR (en wat bij andere currencies)?
3. Status:
   - Tellen we alleen "paid" invoices, of ook "sent"/"booked"/"open"?
4. "Nieuwe installaties" vs "service werken":
   - Op basis van productcategorie op de deal (custom field), invoice type, of iets anders?
   - Welke categorieen vallen onder "service" (bijv. "Service / regie")?
5. Als 1 invoice meerdere producten bevat:
   - Hoe splitsen we omzet per categorie? (nodig als we op invoice line items willen werken)

### 4) Dynamische KPI: Sales Totaal -> Omzet 1M

1. Target definitie:
   - 1M per kalenderjaar, rolling 12 maanden, of een andere periode?
2. Welke omzet teller:
   - Alleen nieuwe installaties, of totaal incl. service?
3. Visualisatie:
   - KPI + progress bar (x% naar 1M) en eventueel prognose?

### 5) Maandelijkse Omzet: Vergelijking Met Zelfde Maand 3 Jaar Terug

1. Welke omzet bron/status/bedrag (zelfde als item 3)?
2. Vergelijking:
   - Willen jullie 1 lijn "huidig jaar" + 3 lijnen (t-1, t-2, t-3), of enkel "huidig vs t-3"?
3. Maandgrenzen:
   - Moeten we maanden op Europe/Brussels sluiten (aanrader) of puur UTC?

### 6) Sales Overzicht Per Productcategorie

1. Bevestigen welke productcategorie lijst we willen tonen:
   - Voorbeelden die we in Teamleader deals zien: PV, BESS, EV charger, FlexiO, BeliStorage, Service / regie.
2. Moeten we categorieen groeperen (bijv. "BESS + BeliStorage" als 1 bucket)?
3. Tellen we aantallen (deals) en omzet (invoices), of beide?

### 7) Sales Overzicht Per Regio

1. Wat is "regio" concreet?
   - Provincie, taalregio, verkoopgebied, of een eigen indeling?
2. Bron voor regio:
   - Contact/company **postal_code** (Teamleader primary_address) -> mapping naar provincie/regio?
   - Of een specifiek custom field?
3. Welke adres geldt:
   - Installatieadres, facturatieadres, of hoofdadres?

### 8) Omzet Overzicht Per Verkoper

1. Verkoper bron:
   - Teamleader deal `responsible_user` (aanrader) of invoice creator/owner?
2. Wat met deals die van verkoper wisselen?
   - Op basis van verantwoordelijke bij close, of bij create?
3. Rapporteren:
   - Omzet per verkoper + aantal won deals + gemiddelde dealwaarde?

### 9) Cyclustijd Offerte -> Close (Algemeen)

1. Wanneer start "offerte" timing precies?
   - Moment dat deal in "offerte verzonden klant" fase komt?
   - Of quotation `created_at`?
2. "Close" = won only, of alle gesloten (won + lost)?
3. Output:
   - Gemiddelde, mediaan, p75/p90?
4. Edge cases:
   - Deals die terug uit quote fase gaan en later opnieuw erin gaan: nemen we eerste keer of laatste keer?

### 10) Gemiddelde Deal Waarde

1. Deal waarde definitie:
   - Invoice total per deal (aanrader), of deal `estimated_value`, of quotation total?
2. Filter:
   - Alleen won deals, of ook open?
3. Periode:
   - Op basis van close datum of invoice datum?

## Toegang / Setup (Als Nodig)

1. Kunnen we Teamleader invoices synchroniseren (API scopes + toestemming)?
2. Zijn er credits/credit notes in Teamleader die we moeten meenemen voor "retour" of omzetcorrecties?
3. Kunnen jullie 3-5 concrete voorbeelden aanleveren:
   - 1 "retour" lead (met id/link) + welke bron/campagne
   - 1 invoice voor "service" en 1 invoice voor "nieuwe installatie"
   - 1 deal met duidelijke productcategorie + verkoper + regio

Contact: Dries Kitslaar (dries.kitslaar@gmail.com)

