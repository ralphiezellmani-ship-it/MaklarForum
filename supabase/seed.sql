-- ============================================================
-- MÄKLARFORUM.SE — SEED DATA (Testdata)
-- Kör EFTER schema.sql i Supabase SQL Editor
-- OBS: Ersätt UUID:erna med riktiga auth.users UUIDs
-- ============================================================

-- ============================================================
-- MARKNADSDATA — De 10 största städerna
-- ============================================================
insert into public.market_data (municipality, year, month, avg_price_sqm, avg_days_on_market, total_sold, price_trend_pct, source) values
('Stockholm', 2026, 1, 89500, 18, 842, 1.2, 'Mäklarstatistik'),
('Stockholm', 2025, 12, 88400, 22, 701, -0.8, 'Mäklarstatistik'),
('Stockholm', 2025, 11, 89100, 20, 756, 0.5, 'Mäklarstatistik'),
('Göteborg', 2026, 1, 56200, 21, 423, 0.9, 'Mäklarstatistik'),
('Göteborg', 2025, 12, 55700, 26, 389, -1.1, 'Mäklarstatistik'),
('Malmö', 2026, 1, 38900, 28, 312, 1.4, 'Mäklarstatistik'),
('Malmö', 2025, 12, 38400, 32, 278, -0.6, 'Mäklarstatistik'),
('Uppsala', 2026, 1, 51200, 24, 198, 0.7, 'Mäklarstatistik'),
('Västerås', 2026, 1, 32400, 31, 143, -0.2, 'Mäklarstatistik'),
('Örebro', 2026, 1, 29800, 33, 167, 1.1, 'Mäklarstatistik'),
('Linköping', 2026, 1, 34100, 27, 189, 0.4, 'Mäklarstatistik'),
('Helsingborg', 2026, 1, 36700, 29, 201, 0.8, 'Mäklarstatistik'),
('Jönköping', 2026, 1, 28900, 35, 134, -0.3, 'Mäklarstatistik'),
('Norrköping', 2026, 1, 26400, 38, 118, 0.6, 'Mäklarstatistik'),
('Lund', 2026, 1, 52800, 22, 156, 1.3, 'Mäklarstatistik');


-- ============================================================
-- INNEHÅLLSSIDOR — Guider och ordlista
-- ============================================================
insert into public.content_pages (slug, title, body, meta_title, meta_desc, category, is_published, published_at) values

('guide-salja-bostad', 
'Komplett guide: Så säljer du din bostad', 
'# Komplett guide: Så säljer du din bostad

Att sälja sin bostad är ofta en av de största ekonomiska transaktionerna i livet. Här går vi igenom allt du behöver veta, från förberedelser till tillträde.

## 1. Förberedelser inför försäljningen

Innan du kontaktar en mäklare finns det flera saker du kan göra för att maximera försäljningspriset...

## 2. Hur väljer jag rätt mäklare?

Det finns flera viktiga faktorer att ta hänsyn till när du väljer mäklare...

## 3. Värdering och utgångspris

En professionell värdering är grunden för en lyckad försäljning...

## 4. Fotografering och styling

Professionella foton kan öka försäljningspriset med upp till 10%...

## 5. Budgivning och avslut

Så fungerar budgivningsprocessen i Sverige...

## 6. Från kontrakt till tillträde

Efter en lyckad budgivning vidtar en rad praktiska moment...',
'Komplett guide: Så säljer du din bostad | Mäklarforum',
'Allt du behöver veta om att sälja din bostad. Från förberedelser och mäklarval till budgivning och tillträde.',
'guide-seller',
true,
now()),

('guide-kopa-bostad',
'Komplett guide: Så köper du en bostad',
'# Komplett guide: Så köper du en bostad

Att köpa bostad är ett stort steg. Den här guiden hjälper dig genom hela processen.

## 1. Ekonomiska förutsättningar

Innan du börjar leta behöver du ha koll på din ekonomi...

## 2. Hitta rätt bostad

Vad ska du tänka på vid visningar?...

## 3. Budgivning som köpare

Strategi och taktik i budgivningen...

## 4. Besiktning

Varför besiktning är viktigt och vad den täcker...

## 5. Köpekontrakt och handpenning

Vad du skriver under och vad det innebär...

## 6. Tillträdet

Vad händer på tillträdesdagen?...',
'Komplett guide: Så köper du en bostad | Mäklarforum',
'Din kompletta guide till bostadsköpet. Från budget och visningar till budgivning, besiktning och tillträde.',
'guide-buyer',
true,
now()),

('ordlista-bostadstermer',
'Ordlista: Fastighetstermer förklarade',
'# Ordlista: Fastighetstermer

## A

**Amortering** — Återbetalning av lån. Enligt amorteringskravet måste du amortera minst 1% per år om belåningsgraden är under 50%, och 2% om den är 50-85%.

**Arrende** — Rätten att nyttja någon annans mark mot betalning.

## B

**Besiktning** — Teknisk genomgång av en fastighet för att identifiera fel och brister. Rekommenderas alltid vid husköp.

**Boendekostnad** — Totalbeloppet du betalar per månad för ditt boende inklusive bolåneränta, amortering, driftkostnad och avgift.

**Budgivning** — Processen där intressenter lägger bud på en bostad. I Sverige är budgivning inte juridiskt bindande förrän köpekontraktet är undertecknat.

## D

**Dolda fel** — Fel i en fastighet som inte var kända vid köpet och som köparen inte rimligen borde ha upptäckt vid en normal undersökning. Säljaren kan hållas ansvarig i upp till 10 år.

**Driftkostnad** — Löpande kostnader för ett hus: el, vatten, värme, sophämtning etc.

## H

**Handpenning** — Vanligtvis 10% av köpeskillingen som betalas vid kontraktsskrivning.

## K

**Kontantinsats** — Minst 15% av bostadens pris måste betalas kontant. Resterande 85% kan finansieras med bolån.

## L

**Lagfart** — Registrering av äganderätt till fastighet hos Lantmäteriet. Kostar 1,5% av köpeskillingen + en expeditionsavgift.

## P

**Pantbrev** — Dokument som används som säkerhet för ett bolån. Kostar 2% av pantbrevets belopp att utfärda.

## T

**Tillträde** — Dagen då äganderätten formellt övergår och nycklarna lämnas över.

**Tomträtt** — Rätten att nyttja en tomt som ägs av kommunen mot en årlig avgäld.',
'Ordlista: Fastighetstermer och bostadsbegrepp förklarade | Mäklarforum',
'Förstå alla termer kring bostadsköp och -sälj. Komplett ordlista med 50+ fastighetstermer förklarade på ett enkelt sätt.',
'glossary',
true,
now());


-- ============================================================
-- EXEMPELFRÅGOR (utan koppling till riktiga användare)
-- Ersätt 'asked_by' med riktiga consumer UUIDs efter setup
-- ============================================================

-- OBS: Dessa frågor kräver att det finns användare i systemet.
-- Lägg till testfrågor manuellt via gränssnittet när systemet är uppe,
-- eller kör detta script med riktiga UUIDs.

-- Exempel på hur en fråga kan se ut (kommenterat tills du har UUIDs):
/*
insert into public.questions (asked_by, title, body, category, geo_scope, municipality, status)
values (
  'CONSUMER_UUID_HÄR',
  'Vad kostar det att sälja en lägenhet i Göteborg?',
  'Jag funderar på att sälja min 3:a i Majorna, Göteborg. Vad kan jag förvänta mig att betala i mäklararvode och andra kostnader? Är det stor skillnad mellan olika mäklare?',
  'selling',
  'local',
  'Göteborg',
  'open'
),
(
  'CONSUMER_UUID_HÄR',
  'Hur fungerar budgivning om man är köpare?',
  'Jag ska lägga bud på en lägenhet för första gången. Hur fungerar processen egentligen? Kan mäklaren se mina bud? Är jag bunden av mitt bud?',
  'buying',
  'national',
  null,
  'open'
),
(
  'CONSUMER_UUID_HÄR',
  'Måste man ha en besiktning när man köper hus?',
  'Vi håller på att köpa ett hus från 1962. Säljaren säger att besiktning inte behövs eftersom huset är nyrenovat. Stämmer det?',
  'renovation',
  'national',
  null,
  'open'
);
*/


-- ============================================================
-- KONTROLLERA ATT ALLT FUNGERAR
-- ============================================================

-- Kör dessa queries för att verifiera att schemat är korrekt:

-- Kontrollera tabeller
select table_name from information_schema.tables 
where table_schema = 'public' 
order by table_name;

-- Kontrollera enums
select typname, enumlabel 
from pg_type t 
join pg_enum e on t.oid = e.enumtypid 
order by typname, enumsortorder;

-- Kontrollera triggers
select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table;

-- Kontrollera RLS är aktiverat
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public'
order by tablename;
