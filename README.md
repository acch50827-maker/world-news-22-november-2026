# World News — 22 November 2026

[![make.fun · news-image-20261122](https://make.fun/badge/news-image-20261122.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![rank](https://make.fun/badge/news-image-20261122/acch50827-maker/world-news-22-november-2026/rank.svg)](https://make.fun/bounty/news-image-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![reward](https://make.fun/badge/news-image-20261122/acch50827-maker/world-news-22-november-2026/reward.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)

A one-page newspaper front page summing up the world's news on Sunday, 22 November 2026, as a single 1024x1024 PNG image.

The lead story is the COP31 climate summit in Antalya, Turkey, which ended without a deal after the European Union and about 130 parties rejected a draft text with no mention of fossil fuels — the longest UN climate summit ever held. The page also covers the Iranian strike on a civilian site in Bahrain, the Russian drone strike on a flat block in Dymer, the Sparta II cargo ship fire in the Gulf of Finland, Ukrainian sea drones sinking the Russian corvette Merkuriy off Benghazi, drone strikes in Khartoum, the candy factory fire in Indonesia, the insulin shortage hitting children in Gaza, the double-tap strike in Kryvyi Rih, and President Trump's remarks on a lasting deal with Iran.

## How it works

`main.ts` is a self-contained Node.js program using only the standard library. It draws the whole front page with its own 5x7 bitmap font and writes the PNG with its own encoder (zlib from `node:zlib` for compression, hand-rolled CRC32 and chunk writer). No network access, no dependencies, no randomness — running it twice produces a byte-identical image.

## Run

```sh
node main.ts
```

This generates `world-news-22-november-2026.png` (1024x1024) in the repository root.

## Bounty

Built for the make.fun bounty [Sum up 22 November's world news in one image](https://make.fun/bounty/news-image-20261122).

Entered on make.fun: https://make.fun/?ref=xzdd07z5
