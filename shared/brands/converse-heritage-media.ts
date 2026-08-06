/**
 * Images embedded on Converse’s official History landing pages.
 * Source page (UK): https://www.converse.com/uk/en/landing-converse-history
 * US twin: https://www.converse.com/c/converse-history
 *
 * Asset paths extracted from the History LP FirstSpirit / Demandware library
 * (`M-Converse-Heritage-LP-{year}.jpg`). Deep-link only — do not rehost without
 * a Converse/Nike press-kit license. CDN may 403 bot IPs; real browsers load fine.
 */

export const CONVERSE_HISTORY_PAGE_UK =
  'https://www.converse.com/uk/en/landing-converse-history'

export const CONVERSE_HISTORY_PAGE_US = 'https://www.converse.com/c/converse-history'

const CDN =
  'https://www.converse.com/on/demandware.static/-/Library-Sites-SharedLibrary/default'

/** Year (or year-suffix) → History LP mobile tile filename hash path */
const BY_YEAR: Record<string, string> = {
  '1908': `${CDN}/dw7c916a26/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1908-0.jpg`,
  '1909': `${CDN}/dwa3da651e/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1909.jpg`,
  '1910': `${CDN}/dw038ffa97/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1910.jpg`,
  '1913': `${CDN}/dw9078dce8/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1913.jpg`,
  '1917': `${CDN}/dw3aae8f53/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1917.jpg`,
  '1919': `${CDN}/dwd05caad0/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1919.jpg`,
  '1922': `${CDN}/dw9a24b2c6/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1922.jpg`,
  '1924': `${CDN}/dw616bc6e3/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1924.jpg`,
  '1933': `${CDN}/dw8044ff88/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1933.jpg`,
  '1934': `${CDN}/dwbe59ab3d/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1934.jpg`,
  '1936': `${CDN}/dw0976be84/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1936.jpg`,
  '1939': `${CDN}/dwa527569e/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1939.jpg`,
  '1945': `${CDN}/dw3bff86c8/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1945.jpg`,
  '1957': `${CDN}/dwa8877b05/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1957.jpg`,
  '1971': `${CDN}/dwe5995b07/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1971-1.jpg`,
  '1975': `${CDN}/dwc4051d26/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1975-1.jpg`,
  '1976': `${CDN}/dw14c93cc5/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1976-1.jpg`,
  '1982': `${CDN}/dwd6780921/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1982.jpg`,
  '1984': `${CDN}/dw9e8bca38/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1984.jpg`,
  '1986': `${CDN}/dwef0ab9d3/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1986.jpg`,
  '1991': `${CDN}/dwa17f2589/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1991.jpg`,
  '1993': `${CDN}/dw8b15d5ba/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1993.jpg`,
  '1994': `${CDN}/dwc213367b/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-1994.jpg`,
  '2000': `${CDN}/dwe2bc3ffa/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2000-0.jpg`,
  '2003': `${CDN}/dw12effc16/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2003.jpg`,
  '2008': `${CDN}/dw02ceb58b/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2008.jpg`,
  '2009': `${CDN}/dw10d55130/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2009.jpg`,
  '2013': `${CDN}/dw7b63c85b/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2013.jpg`,
  '2015': `${CDN}/dw282c9c74/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2015.jpg`,
  '2017': `${CDN}/dw43a5b024/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2017.jpg`,
  '2019': `${CDN}/dwc5984014/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2019-1.jpg`,
  '2020': `${CDN}/dwd07e97d9/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2020-1.jpg`,
  '2021': `${CDN}/dw873fedfe/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2021.jpg`,
  '2022': `${CDN}/dwa4ac3b72/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2022.jpg`,
  '2023': `${CDN}/dwcb425312/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2023.jpg`,
  '2024': `${CDN}/dw44290a39/firstspirit/media/19_landing_pages/2025_summer_9/heritage/M-Converse-Heritage-LP-2024.jpg`,
}

export interface HeritageImage {
  url: string
  alt: string
  /** Always the Converse History landing the asset was taken from. */
  sourcePageUrl: string
  credit: string
}

export function heritageImageForYear(
  year: string | number,
  alt: string,
): HeritageImage | undefined {
  const key = String(year).slice(0, 4)
  const url = BY_YEAR[key]
  if (!url) return undefined
  return {
    url,
    alt,
    sourcePageUrl: CONVERSE_HISTORY_PAGE_UK,
    credit: 'Converse History',
  }
}
