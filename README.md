# Sports & MMA Hub PWA

A Progressive Web App for tracking your favorite sports teams and MMA events. Quick reference for scheduled games with team, opponent, date, and local time.

## Features

- 📱 **Install as PWA** - Add to iPhone Home Screen for app-like experience
- 🏆 **Multi-Sport Support** - MLB, NBA, NHL, NFL, and MMA events
- 🔍 **Search & Filter** - Find games by team, fighter, or league
- ⏰ **Time-based Views** - Today, Tomorrow, This Week, or All upcoming
- 🌙 **Dark Theme** - Easy on the eyes with modern design
- 📶 **Offline Ready** - Cached content works without internet

## Quick Start

### Option 1: GitHub Pages (Recommended)
1. Fork this repository or create a new one
2. Upload all files to your repository
3. Go to Settings → Pages → Deploy from branch → main
4. Your app will be available at `https://yourusername.github.io/repository-name`

### Option 2: Netlify
1. Drag and drop this entire folder to [Netlify Drop](https://app.netlify.com/drop)
2. Get instant deployment with custom URL

### Option 3: Vercel
1. Upload to GitHub
2. Connect to [Vercel](https://vercel.com)
3. Deploy with one click

## Installing on iPhone

1. Open your deployed app URL in Safari
2. Tap the Share button (square with arrow up)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to install
5. Launch from your Home Screen like any other app!

## Adding App Icons

You need to create two icon files and place them in an `icons/` folder:
- `icons/icon-192.png` (192x192 pixels)
- `icons/icon-512.png` (512x512 pixels)

Use any design tool or online icon generator. Simple sports-themed icons work great!

## Customizing Your Teams

Edit `data/teams.json` to add/remove your favorite teams:

```json
[
  {"type": "mlb", "team": "New York Yankees", "city": "New York"},
  {"type": "nba", "team": "Los Angeles Lakers", "city": "Los Angeles"},
  {"type": "mma", "promotion": "UFC"}
]
```

## Adding Real Sports Data

The app currently uses sample data. To connect real sports APIs, update the `fetchEventsFromAPIs()` function in `app.js`.

### Free API Options
- **MLB**: [MLB Stats API](https://statsapi.mlb.com) (Free)
- **NBA**: [balldontlie](https://www.balldontlie.io) (Free tier)
- **NHL**: [NHL API](https://statsapi.web.nhl.com) (Free)
- **NFL**: [ESPN API](http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard) (Free)

## File Structure

```
├── index.html          # Main app page
├── styles.css          # Styling and responsive design
├── app.js             # Core app logic and API integration
├── sw.js              # Service worker for offline functionality
├── manifest.json      # PWA configuration
├── data/
│   ├── teams.json     # Your favorite teams configuration
│   └── sample-events.json # Sample data (replace with real APIs)
├── icons/             # App icons (you need to add these)
│   ├── icon-192.png
│   └── icon-512.png
└── README.md          # This file
```

## Next Steps

1. **Deploy** to GitHub Pages, Netlify, or Vercel
2. **Create app icons** (192x192 and 512x512 PNG files)
3. **Test** the "Add to Home Screen" functionality on iPhone
4. **Customize** your teams list in `data/teams.json`
5. **Integrate** real sports APIs when ready

## License

MIT License - Use it however you want!