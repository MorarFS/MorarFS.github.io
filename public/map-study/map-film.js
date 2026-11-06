'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const video = $('map-film');
  const reader = $('narrative');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let story, film, current = -1, following = false, explore = false, osd, sourceVersion = 0;
  let dragging = false, raf = 0, lastUi = 0, pendingTime = null, currentSubtitle = -1;
  const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2,'0')}`;

  function sourceFor(index = current) { return story.assets[film.cues[Math.max(0,index)].asset]; }
  function announce(text) { $('film-announcement').textContent = text; }
  function setFollow(active, scroll = true) {
    following = active; $('follow-film').setAttribute('aria-pressed',String(active));
    if (active && scroll && current >= 0) scrollNarrative(false);
  }
  function scrollNarrative(smooth) {
    const section = reader.querySelector(`[data-passage="${current}"]`);
    if (!section) return;
    reader.scrollTo({ top:section.offsetTop - reader.offsetTop, behavior:smooth && !reduced.matches ? 'smooth':'auto' });
  }
  function updateScene(index, scroll = true) {
    if (index === current) return;
    current = index;
    const passage = story.stops[index], cue = film.cues[index], asset = sourceFor(index);
    $('scene-title').textContent = passage.title;
    $('scene-count').textContent = `Passage ${index + 1} of ${film.cues.length}`;
    $('narrative-position').textContent = `Passage ${index + 1} of ${film.cues.length}`;
    $('film-chapter').value = String(passage.chapter);
    $('current-source').textContent = `${asset.title} · ${asset.credit}`;
    $('current-source-short').textContent = asset.credit.includes('Liaoning Provincial Museum') ? 'Liaoning Provincial Museum' : asset.credit.includes('James Ford Bell Library') ? 'James Ford Bell Library, Minnesota' : cue.asset === 'great-ming' ? 'Author’s photograph of a facsimile' : 'Source figure from the original essay';
    $('open-source').href = asset.original;
    $('previous-scene').disabled = index === 0;
    $('next-scene').disabled = index === film.cues.length - 1;
    reader.querySelectorAll('.narrative-passage').forEach((element,i) => {
      element.classList.toggle('is-current',i === index);
      if (i === index) element.setAttribute('aria-current','step'); else element.removeAttribute('aria-current');
    });
    if (following && scroll) scrollNarrative(!video.paused);

  }
  function updateTime() {
    if (!film) return;
    const time = Math.max(0,Math.min(film.duration,pendingTime ?? video.currentTime ?? 0));
    // Media clocks may round a frame boundary down by a fraction of a microsecond.
    const lookupTime = time + 0.0001;
    let index = film.cues.findIndex(cue => lookupTime >= cue.start && lookupTime < cue.end);
    if (index < 0) index = time >= film.duration ? film.cues.length - 1 : 0;
    updateScene(index);
    let captionIndex=film.subtitles.findIndex(c=>lookupTime>=c.start&&lookupTime<c.end);
    if(captionIndex<0)captionIndex=time>=film.duration?film.subtitles.length-1:0;
    if(captionIndex!==currentSubtitle){currentSubtitle=captionIndex;$('subtitle-text').textContent=film.subtitles[captionIndex].text;$('subtitle-position').textContent=`Subtitle ${captionIndex+1} of ${film.subtitles.length}`;}
    $('previous-scene').disabled=captionIndex===0;
    $('next-scene').disabled=captionIndex===film.subtitles.length-1;
    $('film-clock').textContent = `${clock(time)} / ${clock(film.duration)}`;
    if (!dragging) $('film-position').value = String(time);
    $('film-position').setAttribute('aria-valuetext',`${clock(time)} of ${clock(film.duration)}. ${story.stops[index].title}`);
  }
  function loop(now) {
    if (now - lastUi > 150) { updateTime(); lastUi = now; }
    if (!video.paused && !video.ended) raf = requestAnimationFrame(loop);
  }
  function updatePlay() {
    const playing = !video.paused && !video.ended;
    const soundOn = !video.muted && video.volume > 0;
    $('play-label').textContent = playing ? 'Pause' : video.ended ? 'Replay' : 'Play';
    $('play-symbol').setAttribute('href',playing ? '#film-pause':'#film-play');
    $('film-state').textContent = video.ended ? 'End of film' : playing ? `Playing · ${soundOn ? 'sound on' : 'muted'}` : soundOn ? 'Narration on' : 'Narration muted';
    $('toggle-sound').setAttribute('aria-pressed',String(soundOn));
    $('toggle-sound').title = soundOn ? 'Mute narration' : 'Unmute narration';
    $('sound-symbol').setAttribute('href',soundOn ? '#film-sound' : '#film-muted');
    cancelAnimationFrame(raf);
    if (playing) raf = requestAnimationFrame(loop);
  }
  async function playPause() {
    if (explore) setExplore(false);
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0;
      try { await video.play(); } catch { $('film-error').hidden = false; }
    } else video.pause();
  }
  function jump(time) {
    pendingTime = Math.max(0,Math.min(film.duration,time));
    if (video.readyState >= 1) { video.currentTime = pendingTime; pendingTime = null; }
    else video.load();
    updateTime();
  }
  function seek(index, record = true) {
    index = Math.max(0,Math.min(film.cues.length - 1,index));
    if (explore) setExplore(false);
    setFollow(true,false);
    jump(film.cues[index].start);
    updateScene(index);
    scrollNarrative(false);
    updateTime();
    if (record) history.replaceState(null,'',`#story=${story.stops[index].id}`);
  }
  function seekSubtitle(index){
    index=Math.max(0,Math.min(film.subtitles.length-1,index));
    if(explore)setExplore(false);
    jump(film.subtitles[index].start);
    history.replaceState(null,'',`#subtitle=${film.subtitles[index].id}`);
    announce(film.subtitles[index].text);
  }
  function frameSource() {
    if (!osd?.viewport) return;
    const cue = film.cues[current], asset = sourceFor();
    if (!cue.focus) { osd.viewport.goHome(true); return; }
    const [x,y,fraction] = cue.focus;
    const width = asset.width * fraction;
    const height = Math.min(asset.height,width / osd.viewport.getAspectRatio());
    const item = osd.world.getItemAt(0);
    osd.viewport.fitBoundsWithConstraints(item.imageToViewportRectangle(x*asset.width-width/2,y*asset.height-height/2,width,height),true);
  }
  function setExplore(active) {
    explore = active;
    if (active) video.pause();
    video.hidden = active;
    $('source-viewer').hidden = !active;
    $('source-viewer-tools').hidden = !active;
    $('explore-source').textContent = active ? 'Return to film' : 'Explore image';
    if (!active) return;
    if (!osd) osd = OpenSeadragon({ id:'source-viewer', drawer:'canvas', showNavigationControl:false,
      animationTime:reduced.matches ? 0 : .65, maxZoomPixelRatio:1.6, visibilityRatio:.7,
      constrainDuringPan:true, tabIndex:-1, gestureSettingsMouse:{clickToZoom:false,dblClickToZoom:true,scrollToZoom:true},
      gestureSettingsTouch:{clickToZoom:false,pinchToZoom:true,flickEnabled:true} });
    const version = ++sourceVersion;
    osd.addOnceHandler('open',() => { if (version === sourceVersion) frameSource(); });
    osd.open(sourceFor().dzi);
    $('source-viewer').focus({preventScroll:true});
  }
  function zoom(factor) { if (osd?.viewport) { osd.viewport.zoomBy(factor);osd.viewport.applyConstraints(reduced.matches); } }
  function readHash() {
    const hash = location.hash.slice(1);
    if(hash.startsWith('subtitle=')){const i=film.subtitles.findIndex(c=>c.id===hash.slice(9));if(i>=0)seekSubtitle(i);}
    else if (hash.startsWith('story=')) {
      const index = story.stops.findIndex(passage => passage.id === hash.slice(6));
      if (index >= 0) seek(index,false);
    } else if (hash.startsWith('detail=')) {
      const detail = story.hotspots.find(item => item.id === hash.slice(7));
      const index = detail ? story.stops.findIndex(passage => passage.id === detail.stop) : -1;
      if (index >= 0) { seek(index,false);setExplore(true); }
    }
  }
  async function init() {
    const responses = await Promise.all([fetch('data/story.json'),fetch('data/map-film-v6.json')]);
    if (responses.some(response => !response.ok)) throw new Error('The presentation data could not load');
    [story,film] = await Promise.all(responses.map(response => response.json()));
    reader.replaceChildren();
    story.stops.forEach((passage,index) => {
      const section = document.createElement('section');section.className='narrative-passage';section.dataset.passage=String(index);
      const heading = document.createElement('h2');
      const button = document.createElement('button');button.type='button';button.textContent=passage.title;
      button.setAttribute('aria-label',`Show ${passage.title} in the film`);button.addEventListener('click',()=>seek(index));heading.append(button);
      const body = document.createElement('div');body.className='scholarly-text';body.innerHTML=passage.html;
      section.append(heading,body);reader.append(section);
    });
    $('film-chapter').innerHTML = story.chapters.map((chapter,index)=>`<option value="${index}">${chapter.title}</option>`).join('');
    $('film-position').max = String(film.duration);
    video.src = film.movie;
    video.muted = false;
    if ('preservesPitch' in video) video.preservesPitch = true;
    $('play-film').addEventListener('click',playPause);
    $('toggle-sound').addEventListener('click',()=>{video.muted=!video.muted;});
    video.addEventListener('click',playPause);
    ['play','pause','ended','volumechange'].forEach(name=>video.addEventListener(name,()=>{ updatePlay();updateTime(); }));
    ['timeupdate','seeked'].forEach(name=>video.addEventListener(name,updateTime));
    video.addEventListener('loadedmetadata',()=>{if(pendingTime !== null){video.currentTime=pendingTime;pendingTime=null;}updateTime();});
    video.addEventListener('error',()=>{ $('film-error').hidden=false;updatePlay(); });
    $('previous-scene').addEventListener('click',()=>seekSubtitle(currentSubtitle-1));
    $('next-scene').addEventListener('click',()=>seekSubtitle(currentSubtitle+1));
    $('film-chapter').addEventListener('change',event=>seek(story.stops.findIndex(passage=>passage.chapter===Number(event.target.value))));
    $('follow-film').addEventListener('click',()=>setFollow(!following));
    ['wheel','touchstart'].forEach(name=>reader.addEventListener(name,()=>setFollow(false,false),{passive:true}));
    reader.addEventListener('keydown',event=>{ if (['PageDown','PageUp','ArrowDown','ArrowUp','Home','End'].includes(event.key)) setFollow(false,false); });
    $('film-speed').addEventListener('change',event=>{video.playbackRate=Number(event.target.value);});
    $('film-position').addEventListener('input',event=>{dragging=true;$('film-clock').textContent=`${clock(Number(event.target.value))} / ${clock(film.duration)}`;});
    $('film-position').addEventListener('change',event=>{dragging=false;jump(Number(event.target.value));});
    $('explore-source').addEventListener('click',()=>setExplore(!explore));
    $('source-in').addEventListener('click',()=>zoom(1.5));$('source-out').addEventListener('click',()=>zoom(1/1.5));$('source-fit').addEventListener('click',()=>osd?.viewport?.goHome(reduced.matches));
    $('presentation-stage').addEventListener('keydown',event=>{
      if (event.target.closest('button,input,select')) return;
      if (explore && osd?.viewport) {
        const b=osd.viewport.getBounds(), moves={ArrowLeft:[-b.width*.12,0],ArrowRight:[b.width*.12,0],ArrowUp:[0,-b.height*.12],ArrowDown:[0,b.height*.12]};
        if (moves[event.key]) {osd.viewport.panBy(new OpenSeadragon.Point(...moves[event.key]),reduced.matches);osd.viewport.applyConstraints(reduced.matches);}
        else if (['+','='].includes(event.key)) zoom(1.5);else if (event.key==='-') zoom(1/1.5);else if (event.key==='0') osd.viewport.goHome(reduced.matches);else return;
      } else if (event.key===' ') playPause();
      else if(event.key==='ArrowRight') jump((pendingTime ?? video.currentTime)+10);
      else if(event.key==='ArrowLeft') jump((pendingTime ?? video.currentTime)-10);
      else return;
      event.preventDefault();event.stopPropagation();
    },true);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
    window.addEventListener('hashchange',readHash);
    updateScene(0,false);updateTime();readHash();
  }
  init().catch(error=>{
    console.error(error);$('film-error').hidden=false;
    $('subtitle-text').textContent='The subtitles could not load. You can read the complete original essay using the link above.';
  });
})();
