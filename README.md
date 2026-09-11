# Vinyl - Devine la musique

Jeu de type "devine le morceau" a partir d'un extrait audio de plus en plus long, avec difficultes (Facile a Expert, extraits de 0.1s a 16s), point de depart aleatoire ou fixe, filtres par artiste/genre/periode, et import des gouts musicaux via Spotify ou Apple Music.

## Demarrer

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000). Le jeu fonctionne des le depart grace a l'API iTunes Search (extraits de 30s gratuits, sans compte requis) pour la banque de morceaux.

## Connexions Spotify / Apple Music (optionnel)

Ces connexions importent les artistes/genres favoris de l'utilisateur pour personnaliser les filtres. Sans elles, le jeu reste jouable avec la liste d'artistes par defaut.

Copie `.env.example` vers `.env.local` et complete :

### Spotify

1. Cree une app sur le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Ajoute `http://localhost:3000/api/auth/callback/spotify` comme Redirect URI.
3. Renseigne `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` dans `.env.local`.

### Apple Music

Necessite un compte Apple Developer Program (payant).

1. Cree une cle MusicKit dans le [Apple Developer Portal](https://developer.apple.com/help/account/configure-app-capabilities/create-a-musickit-key).
2. Renseigne `APPLE_TEAM_ID`, `APPLE_KEY_ID` et `APPLE_MUSICKIT_PRIVATE_KEY` (la cle .p8 avec les retours a la ligne remplaces par `\n`).

Sans ces variables, le bouton "Se connecter" d'Apple Music affiche un message indiquant qu'il n'est pas configure, sans bloquer le reste du jeu.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Zustand (reglages persistes en local)
- Auth.js (NextAuth v5) avec le provider Spotify
- Web Audio API pour une lecture d'extrait au sample pres (precision 0.1s)
- API iTunes Search comme source de morceaux/extraits par defaut
