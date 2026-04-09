# YouTube Restyled: Een Cyberpunk Makeover voor YouTube

**Vandaag hebben we iets leuks gebouwd: een Chrome extensie die YouTube transformeert naar een strakke, cyberpunk-geïnspireerde interface.**

## Het Probleem

YouTube is geweldig voor content, maar de interface? Die is druk, vol afleiding, en die eindeloze Shorts scroll... daar worden we niet blij van. We wilden YouTube gebruiken zoals wíj dat willen: gefocust op echte video's, met een visuele stijl die past bij onze eigen esthetiek.

## De Oplossing

**YouTube Restyled** is een Chrome extensie die YouTube volledig restylet:

### Visuele Overhaul
- **Donkere achtergrond** met subtiele tech-grid overlay
- **Grayscale thumbnails** die kleur onthullen bij hover
- **Hoekige brackets** op thumbnails voor die terminal-look
- **Monospace fonts** voor metadata en timestamps
- **Geen afgeronde hoeken** - alles is strak en hoekig

### Slimme Features
- **Channel labels** direct op de thumbnails - je ziet meteen van wie de video is
- **Shorts verwijderd** - focus op echte content
- **Compacte sidebar** met gestylede categorieën
- **PB.NL branding** geïntegreerd in de header

### Technische Details
De extensie is gebouwd met:
- **Manifest V3** - de nieuwste Chrome extensie standaard
- **Content Scripts** - voor DOM manipulatie en styling
- **CSS Injection** - voor de visuele overhaul
- **MutationObserver** - om dynamisch geladen content te stylen

## Het Bouwproces

Het hele project is in één sessie gebouwd met Claude als pair-programming partner. Van concept tot Chrome Web Store-ready in een paar uur. De iteraties gingen snel:

1. Basis styling en dark theme
2. Channel labels toevoegen op thumbnails
3. Filter pills matchen met de labels (dit kostte wat tweaking!)
4. Sidebar headers stylen
5. Mini-player border toevoegen
6. PB.NL logo met link naar onze site

## Problemen Onderweg

Niet alles ging smooth. YouTube's CSS is... agressief. Ze gebruiken zeer specifieke selectors en veel `!important` declarations. Onze oplossing? Nog specifiekere selectors én JavaScript `setProperty()` met de 'important' flag. Brute force, maar het werkt.

De filter pills waren het lastigst - YouTube nest daar zoveel elementen in met allemaal hun eigen `min-height: 17px`. Uiteindelijk moesten we élk child element targeten om de hoogte te overrulen.

## Het Resultaat

Een YouTube die eruitziet alsof het uit een sci-fi film komt. Rustig, gefocust, en visueel consistent met de PB.NL esthetiek.

De extensie staat klaar voor de Chrome Web Store (zodra Google onze identiteit heeft geverifieerd 😅).

---

*Wil je de extensie proberen? Neem contact op of wacht tot hij live staat in de Chrome Web Store.*

**Tags:** Chrome Extension, YouTube, Cyberpunk, Web Development, CSS, JavaScript
