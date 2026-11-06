# Ricci catalogue coverage

Checked 6 November 2026. `sources.json` contains 37 records. These are **not 37 original maps**. The file separates physical copies, digital surrogates, historical photographs, facsimiles, reconstructions and lost attested editions. `works.json` supplies the two work nodes used by the relations.

Seven physical holdings have verified IIIF manifests: Kyoto, Miyagi’s 1602 print, National Archives of Japan, Bologna, Austrian National Library, Tohoku, and Miyagi’s later manuscript. Eighteen exact manifests are archived. Twelve belong to sections of **one** cut and remounted National Archives copy. The first image service from each holding returned HTTP 200; exact responses and timestamps are in `image-service-checks.json` and the seven `*-image-info.json` files. No large original images were downloaded.

| Institution searched | Result |
|---|---|
| Kyoto University | 1602 print; two composite IIIF canvases; confirmed shelfmark and reuse URL. |
| Miyagi Prefectural Library | 1602 print and colored Japanese manuscript after 1664; separate records and IIIF images. |
| National Archives of Japan | Cut 1602 print pasted on the reverse of Huangyu tu, split into 12 digital items; all manifests saved. The Qing manuscript date belongs to the containing object. |
| Minnesota / Library of Congress | Bell Library physical print and LOC scan are explicitly related. LOC says reproduction from the Bell Foundation copy. UMedia and LOC retrieval returned 403; this does not imply missing scans or missing IIIF. |
| Vatican | Barb.or.150 positively identified by Vatican exhibition and digitization notices. Exact public manifest unresolved; candidate viewer/manifest checks returned 404. A later partial printing is mentioned by RGS, but no verified Vatican shelfmark was found. |
| Bologna, Museo della Specola | MdS-103, 1602 lateral panels. IIIF holds a modest-resolution assembly photo including reconstructed center; not an intact 1602 print. |
| Austrian National Library | Rolle 119; catalogued after 1644 despite an unqualified 1602 date field; IIIF verified. |
| Royal Geographical Society | Later print in or after circa 1644, whole-map website image; no shelfmark retrieved. Its narrative also attests lost 1584 and 1600 maps. |
| Tohoku University | Kano 3/9389/2 manuscript, 11 digital views; copy date unassigned. |
| Yokohama City University | Three distinct manuscript copies, two fragmentary, and a 1936 facsimile; institutional images/zoom viewers. |
| Kobe City Museum | One individual screen record plus two separately listed manuscripts in its 2026 exhibition. The site sometimes redirects HTTP to maintenance pages. |
| Hayashibara Museum | Ikeda family screen, possible 1702 identification, links to ultra-high-resolution viewers. Linked host returned 502. |
| Edo-Tokyo Museum | Three-scroll Edo-period set attested by museum exhibition list; individual accession/image endpoint unresolved. |
| National Museum of Japanese History | Clearly labelled replica of Miyagi panel 2; not a 1602 original. |
| Nanjing Museum | Museum annual identifies its 1608 colored court manuscript. Individual digital record and manifest unresolved. |
| Liaoning / Shenyang Palace Museum | 1603 Liangyi print transfer confirmed by museum history; printed date and dimensions corroborated in Beijing Library’s catalogue. Manchu additions are a later layer. |
| Soongsil University | 1603 Liangyi print, museum web image. Museum’s “only surviving copy” claim conflicts with Liaoning evidence and is flagged. |
| Seoul National University / Korea Heritage Service | 1708 painted copy, participants and images established. Heritage page has conflicting wording about a different Bongseonsa model; not silently reconciled. |
| Silhak Museum / Kyujanggak | Museum’s own partner record distinguishes the lost September 1708 Bongseonsa copy, surviving photographs and the 2011 reconstruction. |
| Hong Kong Maritime Museum | Partner record for Japanese screen in K. L. Tam collection, HKMM2014.02.0005; digital object is right half and does not establish museum ownership. |
| Beijing Library / National Library of China | Historical *Yutu yaolu* catalogue hosted by Academia Sinica establishes a colored manuscript fourth-strip fragment, 1936 facsimile, and separate photographs after Miyagi, Nanjing, Kitamura, Liaoning and a Waseda photograph. The catalogue host is not the physical owner. |
| Harvard | Verified a current IIIF route for *Sancai tuhui* volume 62, but that volume does not establish the map leaf. It was excluded from the catalogue. Map-bearing *Sancai tuhui*, *Yueling guangyi* and *Tushu bian* witnesses still need exact volume/canvas verification. Harvard’s Jesuit exhibit uses LOC’s scan, not evidence of a separate Harvard Ricci print. |
| Cambridge | Searched library and CUDL sites under Ricci, Kunyu, Liangyi and Chinese titles. No precise Ricci holding record was established. CUDL request returned 403. No absence claim is made. |

Remaining gaps include the full historical edition sequence (particularly the alleged 1596 stele and 1609 double-hemisphere version), current provenance of the Schiller/Robinson print, a possible second Vatican holding, the Vatican later-print fragment, Waseda’s source photograph, Japanese manuscript copies beyond the institutions above, and exact digital book witnesses for early lost maps. Aleni, Sambiasi and Verbiest derivatives belong in related work families; they are not silently counted as Ricci editions here.

All unknown manifest/image endpoints are null. Historical catalogue titles and date inconsistencies are retained in `uncertainties`. The inventory is systematic but is not a claim that every worldwide copy has been found.
