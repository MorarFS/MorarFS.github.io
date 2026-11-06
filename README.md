# Florin-Stefan Morar

Public academic website, published through GitHub Pages.

Biographical source: [NUS faculty profile](https://fass.nus.edu.sg/hist/people/florin-stefan-morar/).
Portrait source: [Harvard I Tatti profile](https://itatti.harvard.edu/people/florin-stefan-morar).
Book: [Connected Cartographies](https://doi.org/10.1017/9781009636049).

The research summaries are intentionally broad. This website contains no research datasets, private repository links, unpublished findings, or project credentials.

## Development

Run `npm ci`, then `npm run dev`. Build with `npm run build`.
GitHub Actions publishes only the static `dist/client` output.

## Sino-Western map catalogue

The sourced catalogue is served from `public/sino-western-maps/` at `/sino-western-maps/`. It preserves250source records, including181map/copy units, institutional image credits and explicit coverage gaps. The book section links to it. The catalogue itself is buildless HTML/CSS/JavaScript; the existing website build copies it into the GitHub Pages artifact.
