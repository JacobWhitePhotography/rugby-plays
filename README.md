# Rugby Plays

An animated playbook for the team. Coaches build plays step by step on a phone. Players open one link, tap their name and watch. The coach can see who has watched each play.

- **Plays**: the team's approved plays, with a watched count for the coach
- **Library**: 27 ready-made moves (lineouts, scrums, backs, open play, defence, kick-offs), each tagged Beginner, Intermediate or Advanced to add or adapt
- **New**: draw a play. Drag players, drop the ball on a player to pass, and add steps with coaching notes
- **Suggested**: anyone can suggest a play. The coach approves it, edits it or turns it down
- **Squad**: 23 players (placeholders to start with). Players pick their name the first time they open the link

Nobody needs an account or an app. The coach unlocks coach mode with a PIN, which is checked on the server.

---

## Step 1: Put it online (GitHub Pages, free)

1. In this repo on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*, then set **Branch** to `main` and the folder to `/ (root)`. Press **Save**.
3. Wait a minute. Your site will be at **https://jacobwhitephotography.github.io/rugby-plays/**

At this point it runs in **demo mode**: it works fully, but plays are saved only on the device you're using. The demo coach PIN is `1234`.

## Step 2: Connect the team database (Supabase, free)

This is the step that lets everyone see the same plays and lets you see who has watched them.

1. Go to **supabase.com** → **Start your project** and sign in with GitHub.
2. Click **New project**. Name it `rugby-plays`, set a database password (save it somewhere), pick the **London** region, and create the project.
3. When it's ready, open **SQL Editor** in the left sidebar, then **New query**.
4. Open `supabase/setup.sql` from this repo and copy all of it.
   **Before you run it**, find `change-me-123` near the bottom and replace it with your own coach PIN of 6 or more characters.
5. Paste it into the SQL Editor and press **Run**. You should see "Success".
6. Go to **Project Settings → API Keys** (some projects call it **Data API**). Copy:
   - the **Project URL** (it looks like `https://abcd1234.supabase.co`)
   - the **anon public** key, or the **publishable** key
7. In this repo, open `config.js`, press the pencil icon to edit, and paste both values in between the quotes. Then **Commit changes**.

GitHub Pages updates within a minute or two, and the demo banner disappears.

## Step 3: Share it

- Open the site → **Coach** (top right) → enter your PIN.
- Tap **Coach** again → **Share** to send the link to the squad group chat.
- On a play, **Share this play** sends a link that goes straight to that play.
- Players can add it to their home screen. On iPhone, use Safari → Share → **Add to Home Screen**. On Android, use Chrome → ⋮ → **Add to Home screen**.

---

## Good to know

- **Tracking is on trust.** Players tap their own name, and nothing stops someone tapping a teammate's. That's the trade-off for not needing accounts.
- **Keep the PIN to coaches.** Anyone with the PIN can change plays. Change it from **Coach → Change coach PIN** if it gets out.
- **The anon key in `config.js` is meant to be public.** The database rules only let players read data, add suggestions and mark plays as watched. Everything else needs the PIN.
- **Free tier limits** are far beyond what a squad will use. Supabase pauses free projects after a week with no visits. If that happens, open the project on supabase.com and press **Restore**.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page |
| `app.js` | The app: pitch drawing, animation, editor, moves library, data |
| `styles.css` | The look, with light and dark themes |
| `config.js` | Your Supabase details (blank = demo mode) |
| `supabase/setup.sql` | Database tables, access rules and coach functions |
| `manifest.webmanifest`, `icon*.png`, `icon.svg` | Home-screen icon and app name |
