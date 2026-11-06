'use strict';

// The story is imported without rewriting the source essay. Camera positions
// describe the displayed image, never a reconstructed historical state.
const el = id => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reducedMotion.matches;
try { const saved = localStorage.getItem('cc-camera-motion'); if (saved !== null) motion = saved === 'on'; } catch {}
let data, viewer, peer, mode = 'welcome', current = 0, assetId = 'xuantu';
let sourceOpen = false, comparison = false, markersVisible = true, ready = false;
let selectedHotspot = null, trackers = [], toastTimer, cameraTimer;
let openVersion = 0;
let previousMode = 'welcome';
let readingScroll = 0;
const svg = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

function announce(message) { el('announcement').textContent = message; }
function toast(message) {
  clearTimeout(toastTimer); el('toast').textContent = message; el('toast').hidden = false;
  toastTimer = setTimeout(() => { el('toast').hidden = true; }, 4000);
}
function updateMotion() {
  el('motion-toggle').textContent = `Camera motion: ${motion ? 'on' : 'off'}`;
  el('motion-toggle').setAttribute('aria-pressed', String(motion));
  for (const v of [viewer, peer]) if (v) {
    v.animationTime = motion ? .85 : 0;
    if (v.viewport) for (const name of ['centerSpringX', 'centerSpringY', 'zoomSpring']) {
      if (v.viewport[name]) v.viewport[name].animationTime = motion ? .85 : 0;
    }
  }
}

function makeViewer(id, navigator = false) {
  return OpenSeadragon({
    id, showNavigationControl: false, showNavigator: navigator,
    ...(navigator ? { navigatorId: 'overview', navigatorAutoFade: false,
      navigatorDisplayRegionColor: '#c62026', navigatorBorderColor: 'transparent',
      navigatorBackground: '#f2f2f2', navigatorOpacity: 1 } : {}),
    drawer: 'canvas', animationTime: motion ? .85 : 0, springStiffness: 5,
    maxZoomPixelRatio: 1.6, minZoomImageRatio: .8, visibilityRatio: .75,
    constrainDuringPan: true, homeFillsViewer: false, tabIndex: -1,
    blendTime: motion ? .15 : 0, immediateRender: true, imageLoaderLimit: 6,
    gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true, scrollToZoom: true },
    gestureSettingsTouch: { clickToZoom: false, dblClickToZoom: true, pinchToZoom: true, flickEnabled: true },
    showFullPageControl: false, loadTilesWithAjax: false
  });
}

function currentAsset() { return data.assets[assetId]; }
function updateImageLabels() {
  const a = currentAsset();
  el('image-title').textContent = a.title;
  el('image-context').textContent = assetId === 'xuantu' ? 'Liaoning Provincial Museum, Shenyang' : a.credit;
  el('fallback-link').href = a.original;
  el('map-viewer').setAttribute('aria-label', `${a.title}. Zoomable source image. Arrow keys move; plus and minus zoom; 0 fits the image.`);
  if (sourceOpen) renderSource();
}

function addHotspots() {
  trackers.forEach(tracker => tracker.destroy()); trackers = [];
  viewer.clearOverlays();
  if (assetId !== 'xuantu') return;
  const item = viewer.world.getItemAt(0);
  if (!item) return;
  for (const mark of data.hotspots) {
    const button = document.createElement('button');
    button.className = 'hotspot'; button.type = 'button'; button.dataset.detail = mark.id;
    button.setAttribute('aria-label', `Detail ${mark.number}: ${mark.label}`);
    button.setAttribute('aria-pressed', String(mark.id === selectedHotspot));
    button.innerHTML = `<span aria-hidden="true">${mark.number}</span><span class="hotspot-label" aria-hidden="true">${mark.label}</span>`;
    if (mark.id === selectedHotspot) button.classList.add('is-selected');
    // OpenSeadragon owns pointer gestures; retain native keyboard activation.
    trackers.push(new OpenSeadragon.MouseTracker({ element: button,
      clickHandler: event => { if (event.quick) focusHotspot(mark.id, true); event.preventDefaultAction = true; }
    }));
    button.addEventListener('click', event => { if (event.detail === 0) focusHotspot(mark.id, true); });
    viewer.addOverlay({ element: button,
      location: item.imageToViewportCoordinates(mark.point[0] * currentAsset().width, mark.point[1] * currentAsset().height),
      placement: OpenSeadragon.Placement.CENTER, checkResize: false });
  }
  updateMarkerVisibility();
}

function updateMarkerVisibility() {
  el('main-frame').classList.toggle('hotspots-hidden', !markersVisible);
  el('markers-toggle').setAttribute('aria-pressed', String(markersVisible));
  el('markers-toggle').disabled = assetId !== 'xuantu' || comparison;
}

function openAsset(id, focus = null, instant = false) {
  clearTimeout(cameraTimer);
  if (!data.assets[id]) return;
  const changed = assetId !== id || !ready;
  assetId = id; updateImageLabels();
  el('image-error').hidden = true;
  if (!changed) { frameImage(focus, instant); return; }
  ready = false;
  const version = ++openVersion;
  el('map-poster').src = currentAsset().preview;
  el('map-poster').alt = currentAsset().title;
  el('map-poster').classList.remove('is-loaded');
  el('load-message').hidden = false;
  el('load-message').textContent = 'Opening the image…';
  viewer.clearOverlays();
  viewer.addOnceHandler('open', () => {
    if (version !== openVersion) return;
    ready = true;
    viewer.addOnceHandler('tile-drawn', () => {
      if (version !== openVersion) return;
      el('map-poster').classList.add('is-loaded'); el('load-message').hidden = true;
    });
    updateMarkerVisibility(); addHotspots(); frameImage(focus, true); updateZoom();
  });
  viewer.open(currentAsset().dzi);
}

function frameImage(focus, instant = false) {
  if (!ready || !viewer.viewport) return;
  clearTimeout(cameraTimer);
  if (!focus) { viewer.viewport.goHome(instant || !motion); return; }
  const item = viewer.world.getItemAt(0), a = currentAsset();
  if (!item) return;
  const [cx, cy, fraction] = focus;
  const width = a.width * fraction;
  const aspect = viewer.viewport.getAspectRatio();
  let height = width / aspect;
  // Portrait source figures keep a useful amount of vertical context.
  if (height > a.height * .97) height = a.height * .97;
  const rect = item.imageToViewportRectangle(cx * a.width - width / 2, cy * a.height - height / 2, width, height);
  viewer.viewport.fitBoundsWithConstraints(rect, instant || !motion);
}

function updateZoom() {
  if (!viewer.viewport || !ready) return;
  const ratio = viewer.viewport.getZoom(true) / viewer.viewport.getHomeZoom();
  el('zoom-level').textContent = `${Math.round(ratio * 100)}%`;
  el('zoom-in').disabled = viewer.viewport.getZoom(true) >= viewer.viewport.getMaxZoom() * .99;
  el('zoom-out').disabled = viewer.viewport.getZoom(true) <= viewer.viewport.getMinZoom() * 1.01;
}

function refreshPanels() {
  el('welcome').hidden = sourceOpen || mode !== 'welcome';
  el('story-content').hidden = sourceOpen || mode !== 'story';
  el('explore-content').hidden = sourceOpen || mode !== 'explore';
  el('source-content').hidden = !sourceOpen;
  el('story-controls').hidden = mode !== 'story' || sourceOpen;
  el('source-button').setAttribute('aria-expanded', String(sourceOpen));
}

function setHash(value) {
  if (location.hash.slice(1) !== value) history.pushState(null, '', `#${value}`);
}

function showStop(index, { focusReading = false, history = true } = {}) {
  if (comparison) setComparison(false, false);
  current = Math.max(0, Math.min(data.stops.length - 1, index));
  const stop = data.stops[current]; mode = 'story'; sourceOpen = false;
  selectedHotspot = null;
  el('passage-title').textContent = stop.title;
  el('passage-body').innerHTML = stop.html;
  el('chapter-select').value = String(stop.chapter);
  el('step-count').textContent = `Passage ${current + 1} of ${data.stops.length}`;
  el('story-position').value = String(current);
  el('story-position').setAttribute('aria-valuetext', `${current + 1} of ${data.stops.length}: ${stop.title}`);
  el('previous').disabled = current === 0;
  el('next').innerHTML = current === data.stops.length - 1 ? `Explore the map${svg('right')}` : `Next${svg('right')}`;
  refreshPanels();
  el('reading').scrollTop = 0;
  openAsset(stop.asset, stop.focus);
  if (history) setHash(`story=${stop.id}`);
  if (focusReading) el('passage-title').focus({ preventScroll: true });
  announce(`${stop.title}. Passage ${current + 1} of ${data.stops.length}.`);
}

function showExplore({ history = true, home = true } = {}) {
  if (comparison) setComparison(false, false);
  mode = 'explore'; sourceOpen = false;
  refreshPanels();
  if (home) { selectedHotspot = null; el('detail-reading').hidden = true; updateDetailSelection(); openAsset('xuantu'); }
  if (history) setHash('explore');
  el('reading').scrollTop = 0;
  announce('Free exploration. Choose a marker or move around the map.');
}

function updateDetailSelection() {
  document.querySelectorAll('[data-detail]').forEach(button => {
    const active = button.dataset.detail === selectedHotspot;
    button.setAttribute('aria-pressed', String(active)); button.classList.toggle('is-selected', active);
  });
}

function focusHotspot(id, history = true) {
  const mark = data.hotspots.find(item => item.id === id);
  if (!mark) return;
  mode = 'explore'; sourceOpen = false; selectedHotspot = id;
  current = data.stops.findIndex(stop => stop.id === mark.stop);
  const stop = data.stops[current];
  el('detail-title').textContent = mark.label;
  el('detail-body').innerHTML = stop.html;
  el('detail-reading').hidden = false;
  refreshPanels(); updateDetailSelection();
  openAsset('xuantu', mark.focus);
  if (history) setHash(`detail=${id}`);
  // Keep the selected reading in view, including in the mobile lower panel.
  el('detail-reading').scrollIntoView({ block: 'nearest', behavior: 'instant' });
  announce(`${mark.label}. The source detail and its passage are selected.`);
}

function renderSource() {
  const a = currentAsset();
  el('source-title').textContent = a.title;
  el('source-thumb').src = a.preview; el('source-thumb').alt = a.title;
  el('source-credit').textContent = a.credit;
  el('original-link').href = a.original;
  el('source-resolution').textContent = a.crop
    ? `Zoomable image: ${a.width.toLocaleString()} × ${a.height.toLocaleString()} pixels. The original file includes the surrounding white margin.`
    : `Zoomable image: ${a.width.toLocaleString()} × ${a.height.toLocaleString()} pixels.`;
  const stop = data.stops[current];
  el('essay-section-link').href = `essay.html#section-${stop.originalSection + 1}`;
}

function setSource(open) {
  if (comparison) setComparison(false);
  if (open) readingScroll = el('reading').scrollTop;
  sourceOpen = open;
  if (open) renderSource();
  refreshPanels();
  if (open) { el('reading').scrollTop = 0; el('source-title').setAttribute('tabindex', '-1'); el('source-title').focus({ preventScroll: true }); }
  else { el('reading').scrollTop = readingScroll; el('source-button').focus({ preventScroll: true }); }
}

function setComparison(active, history = true) {
  if (active === comparison) return;
  comparison = active;
  document.body.classList.toggle('is-comparing', active);
  el('compare-toggle').setAttribute('aria-pressed', String(active));
  el('compare-frame').hidden = !active;
  el('compare-close').hidden = !active;
  el('main-comparison-caption').hidden = !active;
  if (active) {
    previousMode = mode; sourceOpen = false; refreshPanels(); openAsset('xuantu', null, true);
    if (!peer) {
      peer = makeViewer('compare-viewer'); peer.open(data.assets.ricci.dzi);
      peer.addHandler('open-failed', () => toast('The 1602 map could not load. Its original is available in the essay.'));
    }
    if (history) setHash('compare');
    announce('Two separate maps, with independent zoom controls. The 1602 map is first; the 1603 Xuantu is second.');
  } else {
    mode = previousMode; refreshPanels();
    if (mode === 'story') openAsset(data.stops[current].asset, data.stops[current].focus, true);
    else openAsset('xuantu', mode === 'explore' && selectedHotspot ? data.hotspots.find(m => m.id === selectedHotspot).focus : null, true);
    if (history) setHash(mode === 'story' ? `story=${data.stops[current].id}` : mode === 'explore' ? selectedHotspot ? `detail=${selectedHotspot}` : 'explore' : '');
  }
  requestAnimationFrame(() => {
    for (const [v, id] of [[viewer, 'map-viewer'], [peer, 'compare-viewer']]) {
      const container = el(id);
      if (v?.viewport && container.clientWidth && container.clientHeight) {
        v.viewport.resize(new OpenSeadragon.Point(container.clientWidth, container.clientHeight), true);
        v.viewport.goHome(true);
      }
    }
    if (!active && mode === 'story') frameImage(data.stops[current].focus, true);
    if (!active && mode === 'explore' && selectedHotspot) frameImage(data.hotspots.find(m => m.id === selectedHotspot).focus, true);
    updateZoom();
  });
}

function readLocation() {
  let hash;
  try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = ''; }
  if (hash.startsWith('story=')) {
    const index = data.stops.findIndex(stop => stop.id === hash.slice(6));
    if (index >= 0) { showStop(index, { history: false }); return; }
  }
  if (hash.startsWith('detail=')) {
    const mark = data.hotspots.find(mark => mark.id === hash.slice(7));
    if (mark) { focusHotspot(mark.id, false); return; }
  }
  if (hash === 'compare') { setComparison(true, false); return; }
  if (hash === 'explore') { showExplore({ history: false }); return; }
  if (comparison) setComparison(false, false);
  mode = 'welcome'; sourceOpen = false; refreshPanels(); openAsset('xuantu');
}

function zoom(v, factor) {
  if (!v?.viewport) return;
  v.viewport.zoomBy(factor); v.viewport.applyConstraints(!motion);
}

function keyNavigation(event, v) {
  if (!v?.viewport) return;
  const bounds = v.viewport.getBounds();
  const moves = { ArrowLeft: [-bounds.width * .13, 0], ArrowRight: [bounds.width * .13, 0], ArrowUp: [0, -bounds.height * .13], ArrowDown: [0, bounds.height * .13] };
  if (moves[event.key]) {
    const [x, y] = moves[event.key]; v.viewport.panBy(new OpenSeadragon.Point(x, y), !motion); v.viewport.applyConstraints(!motion);
  } else if (['+', '=', 'Add'].includes(event.key)) zoom(v, 1.45);
  else if (['-', 'Subtract'].includes(event.key)) zoom(v, 1 / 1.45);
  else if (['0', 'Home'].includes(event.key)) v.viewport.goHome(!motion);
  else return;
  event.preventDefault(); event.stopPropagation();
}

async function init() {
  const response = await fetch('data/story.json');
  if (!response.ok) throw new Error('The story data could not load.');
  data = await response.json();
  if (!window.OpenSeadragon) throw new Error('The zoom viewer could not load.');
  el('chapter-select').innerHTML = data.chapters.map((chapter, i) => `<option value="${i}">${chapter.title}</option>`).join('');
  el('detail-list').innerHTML = data.hotspots.map(mark => `<button type="button" data-detail="${mark.id}" aria-pressed="false"><span class="detail-number" aria-hidden="true">${mark.number}</span><span>${mark.label}</span>${svg('right')}</button>`).join('');
  el('detail-list').querySelectorAll('button').forEach(button => button.addEventListener('click', () => focusHotspot(button.dataset.detail)));
  document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); el('reading').focus(); });
  el('story-position').max = String(data.stops.length - 1);
  viewer = makeViewer('map-viewer', true);
  viewer.addHandler('animation', updateZoom); viewer.addHandler('animation-finish', updateZoom);
  viewer.addHandler('open-failed', () => {
    ready = false; el('load-message').hidden = true; el('image-error').hidden = false;
    el('map-poster').classList.remove('is-loaded');
  });
  updateMotion();
  el('start-story').addEventListener('click', () => showStop(0, { focusReading: true }));
  el('start-explore').addEventListener('click', () => showExplore());
  el('to-free').addEventListener('click', () => showExplore());
  el('explore-to-story').addEventListener('click', () => showStop(0, { focusReading: true }));
  el('continue-story').addEventListener('click', () => showStop(current, { focusReading: true }));
  el('previous').addEventListener('click', () => showStop(current - 1, { focusReading: true }));
  el('next').addEventListener('click', () => current === data.stops.length - 1 ? showExplore() : showStop(current + 1, { focusReading: true }));
  el('chapter-select').addEventListener('change', event => {
    const chapter = Number(event.target.value); showStop(data.stops.findIndex(stop => stop.chapter === chapter));
  });
  el('story-position').addEventListener('input', event => {
    const stop = data.stops[Number(event.target.value)];
    event.target.setAttribute('aria-valuetext', `${Number(event.target.value) + 1} of ${data.stops.length}: ${stop.title}`);
  });
  el('story-position').addEventListener('change', event => showStop(Number(event.target.value)));
  el('reframe').addEventListener('click', () => openAsset(data.stops[current].asset, data.stops[current].focus));
  el('whole-map').addEventListener('click', () => {
    selectedHotspot = null; updateDetailSelection(); openAsset('xuantu');
    announce('The whole Xuantu map is shown.');
  });
  el('zoom-in').addEventListener('click', () => zoom(viewer, 1.5));
  el('zoom-out').addEventListener('click', () => zoom(viewer, 1 / 1.5));
  el('markers-toggle').addEventListener('click', () => { markersVisible = !markersVisible; updateMarkerVisibility(); });
  el('source-button').addEventListener('click', () => setSource(!sourceOpen));
  el('source-back').addEventListener('click', () => setSource(false));
  el('motion-toggle').addEventListener('click', () => {
    motion = !motion; updateMotion(); try { localStorage.setItem('cc-camera-motion', motion ? 'on' : 'off'); } catch {}
  });
  reducedMotion.addEventListener('change', event => { if (event.matches) { motion = false; updateMotion(); } });
  el('compare-toggle').addEventListener('click', () => setComparison(!comparison));
  el('compare-close').addEventListener('click', () => setComparison(false));
  el('peer-in').addEventListener('click', () => zoom(peer, 1.5));
  el('peer-out').addEventListener('click', () => zoom(peer, 1 / 1.5));
  el('peer-fit').addEventListener('click', () => peer?.viewport?.goHome(!motion));
  el('map-viewer').addEventListener('keydown', event => { if (!event.target.closest('.hotspot')) keyNavigation(event, viewer); }, true);
  el('compare-viewer').addEventListener('keydown', event => keyNavigation(event, peer), true);
  el('retry-image').addEventListener('click', () => { ready = false; openAsset(assetId, mode === 'story' ? data.stops[current].focus : null); });
  el('share-button').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); toast('Link copied.'); }
    catch { toast(`Copy this link: ${location.href}`); }
  });
  window.addEventListener('hashchange', readLocation);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (sourceOpen) setSource(false); else if (comparison) setComparison(false);
    }
  });
  readLocation();
}

init().catch(error => {
  console.error(error);
  el('load-message').textContent = 'The explorer could not load. Read the complete essay using the link above.';
  el('start-story').disabled = true; el('start-explore').disabled = true;
});
