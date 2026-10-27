# @hipmaster/illustrations

Import and optimisation pipeline for the card illustrations (US-015,
[ADR 0015](../../docs/decisions/0015-illustrations-statiques-optimisees.md)).

## Add or replace a card's illustration

1. Drop the original as a PNG in `sources/set-1/<numero>.png`: preferably in **4:3** format (otherwise it is cropped
   to the most interesting area), **at least 640 px wide** (1365 × 1024 recommended).
2. Describe the image in [`set-1.json`](set-1.json):

   ```json
   {
     "numero": 1,
     "alt": "Un vieux serveur de fichiers couvert de post-it, dans un local technique sombre",
     "altEn": "An old file server covered in sticky notes, in a dark server room",
     "consigne": "La consigne donnée au générateur, pour pouvoir refaire l'image",
     "provenance": { "outil": "Recraft", "date": "2026-10-18" }
   }
   ```

   The alternative text says **what the image shows**, in one sentence, without repeating the card's name (it is
   already read). It is written in both languages of the site (US-081): `alt` in French, `altEn` in English (British,
   like the rest of the `/en/` version); both are mandatory.

3. Run, at the root of the repository:

   ```bash
   npm run illustrations
   ```

   The script produces `apps/web/public/illustrations/set-1/<numero>-{320,640}.<empreinte>.{avif,webp}` and
   regenerates the manifest `apps/web/src/app/cartes/illustrations.generated.ts`: the alternative texts (language →
   number → text, each version of the site reads those of its language) and the file names of each card. It **writes
   nothing** if an error remains (original missing or too small, alternative text missing, unknown card number, file
   of 100 KB or more).

4. Commit `set-1.json`, the produced images and the manifest. **Not the originals**: `sources/` is ignored by Git;
   archive them separately (they will be stored in an Azure Storage Account at launch).

Removing a card from `set-1.json` and rerunning the script deletes its served images.

## Fingerprint and cache (US-078)

The **fingerprint** is made of the first 8 hexadecimal characters of the file's SHA-256
([ADR 0046](../../docs/decisions/0046-illustrations-a-empreinte-cache-long.md)): a redone image changes name, an
unchanged image keeps its own. This is what lets Firebase Hosting serve `/illustrations/**` with
`Cache-Control: public, max-age=31536000, immutable`: a player never redownloads an image already seen, and sees the
new one from the next version of the site. The script deletes the files of an old fingerprint; the front end only
reads the names of the manifest. Never rename or touch up a file by hand: the versioned-files test rejects a name whose
fingerprint does not match the content.

## Provisional illustrations (US-018)

While waiting for real illustrations, `npm run illustrations:provisoires` draws the 71 cards in code
(`src/vectoriel/`, [ADR 0016](../../docs/decisions/0016-illustrations-provisoires-vectorielles.md)), rewrites
`set-1.json` then runs the derivation. The generator is deterministic: it is authoritative, there is no original to
archive. To replace a card with a real illustration, drop its original and update its entry in `set-1.json`, then
run `npm run illustrations` (and no longer `illustrations:provisoires`, which would overwrite the entry).
