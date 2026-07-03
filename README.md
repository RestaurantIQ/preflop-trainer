# Preflop Trainer (6-max)

Poker-Preflop-Trainer: Raise oder Fold? Mit drei Szenarien (unopened Pot, gegen Raise, gegen Limper), Stack-Tiefe inkl. Push-or-Fold unter 15 BB und Session-Bericht nach 50 Händen.

## Lokal starten

```bash
npm install
npm run dev
```

## Deploy auf Vercel

1. Repo auf GitHub pushen:
   ```bash
   git init
   git add .
   git commit -m "Preflop Trainer v2"
   git branch -M main
   git remote add origin https://github.com/DEIN-USER/preflop-trainer.git
   git push -u origin main
   ```
2. Auf [vercel.com](https://vercel.com) → **Add New Project** → Repo importieren.
3. Vercel erkennt Vite automatisch (Build: `vite build`, Output: `dist`). Einfach **Deploy** klicken.

Fertig – kein Config-File nötig.
