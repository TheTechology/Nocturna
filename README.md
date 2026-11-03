# NOCTURNA 0071 · Ascultăm cerul de noapte

**Recensământ acustic al migrației nocturne a păsărilor în lunca Siretului, construit de elevi din Adjud, Vrancea.**

Prezentarea web: **[nocturastartong.netlify.app](https://nocturastartong.netlify.app/)**

---

## Despre inițiativă

Multe păsări migrează noaptea. Zboară pe întuneric, se orientează după stele și, ca să rămână în stol, își trimit strigăte scurte de zbor. Nu le vedem, dar le putem auzi.

**NOCTURNA 0071** este programul prin care elevii construiesc, cu mâinile lor, stații acustice care ascultă aceste strigăte. Stațiile stau în situl Natura 2000 **ROSPA0071 „Lunca Siretului Inferior”**, din apropierea Adjudului. Înregistrările sunt analizate cu inteligență artificială (BirdNET), iar un ornitolog verifică rezultatele. Datele ajung la Direcția Județeană de Mediu Vrancea, custodele sitului.

Metoda e complet pasivă: nicio pasăre nu este capturată, inelată sau deranjată. Stațiile sunt prinse de copaci doar cu coliere, care se scot la final, fără cuie sau șuruburi.

## Ce construiesc elevii

Fiecare stație NOCTURNA este un mic laborator de ascultare, alimentat de acumulatori și închis într-o carcasă rezistentă la ploaie și praf (IP66):

| Piesa | Rolul ei |
|---|---|
| Placa **ESP32-S3** | „creierul”: decide când ascultă și scrie sunetul pe card |
| Microfonul digital **INMP441** | „urechea”: transformă vibrația aerului în date |
| Card **microSD** de 64 GB | „memoria”: câte un fișier pentru fiecare oră de noapte |
| Ceasul **DS3231** | „deșteptătorul”: trezește stația seara, la 17:00 |
| Modulul cu 4 acumulatori | energie pentru zile întregi în pădure |

Stația ascultă în fiecare noapte, de la 17:00 la 07:00, și doarme ziua.

## Programul, pe scurt

- **24 de stații** construite de elevi;
- **10 puncte** în lunca Siretului, cu câte 2 stații;
- **3 aparate profesionale AudioMoth**, ca termen de comparație;
- **10 săptămâni** de ascultare, noapte de noapte;
- peste **15.000 de ore** de sunet, analizate cu BirdNET;
- **provocarea elevilor:** stațiile construite de ei să audă cel puțin 80% din ce aude un aparat profesional.

Punctele exacte de amplasare se stabilesc împreună cu DJM Vrancea și cu proprietarii terenurilor.

## Cine participă

- **Asociația Grupul Verde**, Adjud: coordonarea programului, atelierele și formarea;
- **Colegiul Național „Emil Botta” Adjud**: elevii de clasa a X-a construiesc stațiile;
- **școlile gimnaziale din Adjud**: elevii de clasa a VIII-a sunt cercetătorii de teren;
- **Direcția Județeană de Mediu Vrancea (ANMAP)**: folosește datele pentru protecția păsărilor din luncă;
- **un ornitolog independent**: verifică recunoașterile făcute de inteligența artificială.

## Ce învață tinerii

Electronică, programare pe o placă reală, inteligență artificială aplicată, ecologie într-un sit Natura 2000, lucru în echipă, între colegi mai mari și mai mici, și un rezultat concret: date științifice predate unei instituții publice.

---

## Despre această prezentare web

Prezentarea pentru elevi este un site static, fără server, care merge și **fără internet**: se copiază dosarul pe un stick și se deschide `index.html`. Este gândită pentru **tabla interactivă din clasă**, pentru PC și pentru telefon.

- 38 de slide-uri, cu animații 3D ale fiecărei piese și ale montajului, pas cu pas;
- piesele 3D se pot roti cu mouse-ul sau cu degetul;
- peisaj sonor de pădure, de toamnă spre iarnă, și o **spectrogramă vie** care desenează sunetul în timp real;
- **hartă interactivă** a sitului ROSPA0071, cu o simulare a unei nopți de migrație;
- navigare cu săgețile, clicker-ul, rotița mouse-ului sau glisarea pe ecran.

### Structura

```
index.html      slide-urile
site.css        aspectul (brandul NOCTURNA și Grupul Verde)
site.js         animațiile, sunetul, spectrograma, harta
media/
  vid/          animațiile 3D (MP4) și imaginile lor de început
  audio/        sunetele pădurii (AAC)
  img/          imagini, iconițe, codul QR
  logos/        logo-urile programului, ale asociației și ale finanțatorului
  fonts/        Figtree și Caprasimo
```

### Surse și licențe

- **Sunete:** înregistrări cu licența CC0 (domeniu public), de pe [freesound.org](https://freesound.org).
- **Hartă:** râuri și localități © contribuitorii [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL).
- **Speciile protejate:** Planul de management al sitului ROSPA0071 (Ministerul Mediului, 2015).
- **Fonturi:** Figtree și Caprasimo (SIL Open Font License).
- **Codul** acestui depozit: GPL-3.0 (vezi fișierul de licență).
- Logo-urile Start ONG, Act for Tomorrow și Kaufland aparțin proprietarilor lor și se folosesc conform Ghidului de comunicare Start ONG.

---

<p align="center"><b>Proiect finanțat prin Start ONG</b><br>
Implementat de <b>Asociația Grupul Verde</b> · <a href="https://grupulverde.ro">grupulverde.ro</a></p>
