# YouTube Restyled - PB Edition

Een Chrome extensie die YouTube transformeert naar een strakke, cyberpunk-geïnspireerde interface.

![Version](https://img.shields.io/badge/version-1.0.0-red)
![Chrome](https://img.shields.io/badge/Chrome-Extension-blue)

## ✨ Features

### Visual Effects
- **Tech Grid Background** - Subtiel rasterpatroon voor die cyberpunk vibe
- **Scanline Animation** - Retro CRT monitor effect
- **Vignette Overlay** - Donkere randen voor focus op content
- **Corner Brackets** - Hoekaccenten op thumbnails die oplichten bij hover
- **Grayscale Thumbnails** - Thumbnails worden kleur bij hover

### Functionaliteit
- **NEW Video Badges** - Rode badge op video's van de afgelopen 24 uur
- **Hide Shorts** - Verberg YouTube Shorts secties
- **Compact Layout** - Meer video's per rij, efficiënter gebruik van schermruimte
- **Monospace Typography** - JetBrains Mono voor metadata

## 🚀 Installatie

### Stap 1: Download
De extensie staat al in je folder: `youtube-restyled/`

### Stap 2: Chrome Developer Mode
1. Open Chrome
2. Ga naar `chrome://extensions/`
3. Zet **Developer mode** AAN (toggle rechtsboven)

### Stap 3: Extensie Laden
1. Klik op **"Load unpacked"** (Uitgepakte extensie laden)
2. Navigeer naar de `youtube-restyled` folder
3. Selecteer de folder en klik **Open**

### Stap 4: Klaar!
- Je ziet nu het YouTube Restyled icoon in je Chrome toolbar
- Ga naar youtube.com en geniet van de nieuwe look!

## ⚙️ Instellingen

Klik op het extensie-icoon om de instellingen te openen:

| Setting | Beschrijving |
|---------|-------------|
| Tech Grid | Achtergrond rasterpatroon |
| Scanline | Bewegende scanline animatie |
| Vignette | Donkere hoeken overlay |
| Corner Brackets | Hoekaccenten op thumbnails |
| Grayscale | Thumbnails grijs tot hover |
| NEW Badges | Badge op recente video's |
| Hide Shorts | Verberg Shorts secties |
| Compact Layout | Meer video's per rij |
| Threshold | Hoeveel uur een video "NEW" blijft |

## 🎨 Design System

### Kleuren
```css
--background: #050505
--text-primary: #f1f1f1
--text-secondary: #a3a3a3
--text-muted: #525252
--accent: #FF0000
--border: rgba(255, 255, 255, 0.1)
```

### Fonts
- **Body**: Inter
- **Mono**: JetBrains Mono

## 📁 Structuur

```
youtube-restyled/
├── manifest.json        # Extensie configuratie
├── styles/
│   └── main.css         # Alle CSS styling
├── scripts/
│   ├── content.js       # DOM manipulatie
│   └── background.js    # Service worker
├── popup/
│   ├── popup.html       # Settings UI
│   └── popup.js         # Settings logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🔧 Troubleshooting

### Extensie werkt niet
1. Zorg dat je op `youtube.com` bent (niet `m.youtube.com`)
2. Refresh de pagina (Ctrl+R / Cmd+R)
3. Check of de extensie enabled is in `chrome://extensions/`

### Styling ziet er raar uit
1. Clear je browser cache
2. Disable andere YouTube extensies die mogelijk conflicteren
3. Probeer de Reset knop in de popup

### NEW badges verschijnen niet
- NEW badges verschijnen alleen op video's van de laatste 24 uur (aanpasbaar in settings)
- Video's die je al bekeken hebt krijgen geen badge

## 📝 Aanpassen

Wil je de kleuren of styling aanpassen? Edit `styles/main.css`:

```css
:root {
  --ytr-accent: #FF0000;  /* Verander de accent kleur */
  --ytr-bg-primary: #050505;  /* Achtergrond kleur */
}
```

## 🤝 Credits

Design: PB Edition
Built with: CSS, JavaScript, Chrome Extension APIs

---

**Enjoy your restyled YouTube! 🎬**
