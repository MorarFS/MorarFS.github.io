'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const e = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uri = value => /^(https?:\/\/|\.\.?\/|data\/|media\/)/.test(value || '') ? e(value) : '#';
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const urlFor = id => `record.html?id=${encodeURIComponent(id)}`;
  const names = record => record.creators.map(c=>c.name).join('; ');
  const date = record => record.dates.copy || record.dates.edition || 'Copy date not established';
  const accessLabel = record => ({iiif:'IIIF source',image:'Image source','source-link':'Source link'}[record.imageAccess]);
  const kinds = {'physical-copy':'Print or manuscript copy','book-map-component':'Map in a book or atlas','compound-map-copy':'Multi-sheet map','facsimile':'Facsimile','photographic-reproduction':'Photographic reproduction','photographic-facsimile':'Photographic facsimile','modern-reconstruction':'Modern reconstruction','digital-reproduction':'Digital mirror','lost-attested-copy':'Lost copy, attested','lost-attested-edition':'Lost edition, attested','map-sheet':'Sheet or surviving fragment','book-copy':'Book copy','printing-blocks':'Printing blocks','atlas-copy':'Atlas copy','manuscript-atlas-copy':'Manuscript atlas','institutionally-attested-copy':'Institutionally attested copy','modern-facsimile-copy':'Modern facsimile','fragmentary-copy':'Surviving fragment','printed-map-group':'Map group','detached-map-group':'Map group','lost-work-attestation':'Lost work, attested','later-impression-from-original-plates':'Later impression','map-copy-or-later-impression':'Copy or later impression','manuscript-derivative-copy':'Manuscript derivative'};
  const typeLabel = record => record.recordKind==='later-impression'?'Later impression':kinds[record.type] || record.type.replaceAll('-',' ');
  const year = record => Number((date(record).match(/(?:1[5-9]|20)\d{2}/) || [9999])[0]);
  let data;

  document.addEventListener('error',event=>{const img=event.target;if(img.tagName!=='IMG')return;const link=img.closest('.map-thumbnail');if(link){img.remove();const text=document.createElement('span');text.className='no-image';text.textContent='Source image';link.append(text);}},true);
  function thumbnail(record) {
    return record.cachedThumbnail || record.thumbnail || record.canvases.find(c=>c.cachedThumbnail)?.cachedThumbnail || record.canvases.find(c=>c.thumbnail)?.thumbnail;
  }
  function imageMarkup(record, className='') {
    const src = thumbnail(record);
    return `<a class="map-thumbnail ${className}" href="${urlFor(record.id)}" aria-label="Inspect ${e(record.title)}">${src ? `<img src="${uri(src)}" alt="" loading="lazy" decoding="async">` : `<span class="no-image">${record.displayMode==='external-link-only'?'View at source':'Source record'}</span>`}</a>`;
  }
  function setupIndex() {
    let family='all', page=1, filtered=[], debounce, wasLater=false, contextBeforeLater=false;
    const perPage=24;
    $('family-nav').innerHTML = `<a href="?family=all" data-family="all">All families</a>` + data.families.map(f=>`<a href="?family=${f.id}" data-family="${f.id}">${e(f.label)}</a>`).join('');
    function readParams() {
      const p=new URLSearchParams(location.search);
      family=data.families.some(f=>f.id===p.get('family'))?p.get('family'):'all';
      $('q').value=p.get('q')||'';
      ['type','access','sort'].forEach(id=>{const v=p.get(id);if(v&&Array.from($(id).options).some(o=>o.value===v))$(id).value=v;else $(id).selectedIndex=0;});
      $('include-context').checked=p.get('context')==='1';
      page=Math.max(1,Number(p.get('page'))||1);
    }
    function updateUrl() {
      const p=new URLSearchParams();
      if(family!=='all')p.set('family',family);
      if($('q').value.trim())p.set('q',$('q').value.trim());
      ['type','access','sort'].forEach(id=>{if($(id).selectedIndex)p.set(id,$(id).value);});
      if($('include-context').checked&&$('type').value!=='later')p.set('context','1');
      if(page>1)p.set('page',String(page));
      history.replaceState(null,'',p.size?'?'+p.toString():location.pathname);
    }
    function render(resetPage=true) {
      if(resetPage)page=1;
      const later=$('type').value==='later';
      if(later&&!wasLater){contextBeforeLater=$('include-context').checked;$('include-context').checked=true;}
      else if(!later&&wasLater)$('include-context').checked=contextBeforeLater;
      $('include-context').disabled=later;wasLater=later;
      const terms=norm($('q').value).split(/\s+/).filter(Boolean), type=$('type').value, access=$('access').value;
      filtered=data.records.filter(r=>{
        if(family!=='all'&&r.family!==family)return false;
        if(!$('include-context').checked&&!r.countable)return false;
        if(type==='later'&&!/facsimile|reproduction|reconstruction|impression/.test(r.type+' '+r.recordKind))return false;
        if(!['all','later'].includes(type)&&r.type!==type)return false;
        if(access!=='all'&&r.imageAccess!==access)return false;
        return terms.every(term=>norm(r.searchText).includes(term));
      });
      const sort=$('sort').value, order=data.families.map(f=>f.id);
      filtered.sort((a,b)=>sort==='date'?year(a)-year(b)||a.title.localeCompare(b.title):sort==='title'?a.title.localeCompare(b.title):sort==='holding'?(a.holding||'').localeCompare(b.holding||''):(order.indexOf(a.family)-order.indexOf(b.family)||year(a)-year(b)||a.title.localeCompare(b.title)));
      const pages=Math.max(1,Math.ceil(filtered.length/perPage));page=Math.min(page,pages);
      const chunk=filtered.slice((page-1)*perPage,page*perPage);
      let lastFamily='';
      $('map-rows').innerHTML=chunk.map(r=>{
        let heading='';
        if(sort==='family'&&r.family!==lastFamily){lastFamily=r.family;const f=data.families.find(f=>f.id===r.family);heading=`<tr class="family-row"><th colspan="5" scope="rowgroup">${e(f.title)}<span>${filtered.filter(x=>x.family===r.family).length} records</span></th></tr>`;}
        return heading+`<tr><td>${imageMarkup(r)}</td><td><a class="map-title" href="${urlFor(r.id)}">${e(r.title)}</a><p class="map-makers">${e(names(r))}</p><p class="record-kind">${e(typeLabel(r))}<span class="mobile-date"> · ${e(date(r))}</span></p></td><td>${e(date(r))}</td><td><span class="holding-name">${e(r.holding||'Holding not established')}</span>${r.shelfmark?`<span class="map-shelfmark">${e(r.shelfmark)}</span>`:''}</td><td><span class="access-label"><a href="${urlFor(r.id)}">${accessLabel(r)}</a></span>${r.cachedThumbnail?'<span class="map-shelfmark">Preview saved</span>':''}</td></tr>`;
      }).join('');
      $('results-count').textContent=`${filtered.length} ${$('include-context').checked?'records':'map and copy records'}${family!=='all'?' in '+data.families.find(f=>f.id===family).label:''} · sources checked 6 November 2026`;
      $('catalogue-empty').hidden=filtered.length>0;$('pagination').hidden=filtered.length===0;
      $('page-position').textContent=`Page ${page} of ${pages}`;
      $('previous-page').disabled=page===1;$('next-page').disabled=page===pages;
      $('family-nav').querySelectorAll('a').forEach(a=>{if(a.dataset.family===family)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
      updateUrl();
    }
    function clear(){family='all';$('q').value='';['type','access','sort'].forEach(id=>$(id).selectedIndex=0);wasLater=false;$('include-context').disabled=false;$('include-context').checked=false;render();}
    $('catalogue-filters').addEventListener('submit',ev=>{ev.preventDefault();render();});
    $('q').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(()=>render(),150);});
    ['type','access','sort','include-context'].forEach(id=>$(id).addEventListener('change',()=>render()));
    $('family-nav').addEventListener('click',ev=>{const link=ev.target.closest('[data-family]');if(!link)return;ev.preventDefault();family=link.dataset.family;render();});
    $('clear-filters').addEventListener('click',clear);$('reset-empty').addEventListener('click',clear);
    function changePage(direction){page+=direction;render(false);$('map-results').scrollIntoView({block:'start',behavior:'auto'});$('map-results').focus({preventScroll:true});}
    $('previous-page').addEventListener('click',()=>changePage(-1));$('next-page').addEventListener('click',()=>changePage(1));
    window.addEventListener('popstate',()=>{readParams();render(false);});
    readParams();render(false);
  }

  function fact(label,value){return value?`<dt>${e(label)}</dt><dd>${e(value)}</dd>`:'';}
  function sourceList(record){return record.sources.map(s=>`<li><a href="${uri(s.url)}" target="_blank" rel="noopener">${e(s.title)}</a>${s.locator?`<span class="source-locator">${e(s.locator)}</span>`:''}${s.note?`<span class="source-locator">${e(s.note)}</span>`:''}</li>`).join('');}
  function relatedList(record){
    const group=data.records.filter(r=>r.id!==record.id&&r.family===record.family&&r.countable);
    group.sort((a,b)=>(a.workId===record.workId?-1:0)-(b.workId===record.workId?-1:0)||year(a)-year(b));
    return group.slice(0,9).map(r=>`<li><a href="${urlFor(r.id)}">${e(r.title)}</a><span>${e(r.holding)} · ${e(date(r))}</span></li>`).join('');
  }
  function viewerMarkup(key,record){
    return `<section class="image-view" id="image-view-${key}" aria-label="${e(record.holding||record.title)}"><div class="image-view-head"><h2 id="view-title-${key}">${e(record.holding||record.title)}</h2><label class="visually-hidden" for="canvas-${key}">Image or sheet</label><select id="canvas-${key}" aria-label="${key==='a'?'Primary':'Comparison'} image or sheet"></select></div><div class="map-viewport" id="viewport-${key}" tabindex="0" aria-label="Map image. Arrow keys move, plus and minus zoom, zero fits the map."></div><div class="viewer-controls"><button data-view="${key}" data-action="in" aria-label="Zoom in ${key==='a'?'primary':'comparison'} map"><svg><use href="#catalogue-plus"/></svg></button><button data-view="${key}" data-action="out" aria-label="Zoom out ${key==='a'?'primary':'comparison'} map"><svg><use href="#catalogue-minus"/></svg></button><button data-view="${key}" data-action="fit" aria-label="Fit ${key==='a'?'primary':'comparison'} map"><svg><use href="#catalogue-fit"/></svg></button><a id="source-image-${key}" href="${uri(record.viewerUrl||record.recordUrl)}" target="_blank" rel="noopener">Institutional viewer ↗</a></div><p class="viewer-credit" id="credit-${key}"></p></section>`;
  }
  function setupRecord(){
    const params=new URLSearchParams(location.search),record=data.records.find(r=>r.id===params.get('id'));
    if(!record){$('record-main').innerHTML='<div class="record-error"><h1>Map record not found</h1><p>This link does not identify a record in the current catalogue. Search the title or holding in the index.</p><a href="./">Open the map catalogue</a></div>';return;}
    document.title=record.title+' · Connected Cartographies';
    const family=data.families.find(f=>f.id===record.family),cross=record.cross;
    const alternatives=data.records.filter(r=>r.id!==record.id&&r.displayMode!=='external-link-only'&&r.canvases.length&&r.family===record.family);
    const metadata= fact('Maker / attribution',names(record))+fact('Work date',record.dates.work)+fact('Edition date',record.dates.edition)+fact('Copy / impression',record.dates.copy)+fact('Holding',record.holding)+fact('Shelfmark',record.shelfmark)+fact('Record type',typeLabel(record));
    $('record-main').innerHTML=`<div class="record-breadcrumb"><a href="./">Map catalogue</a><span aria-hidden="true">/</span><a href="?family=${family.id}" id="family-back">${e(family.label)}</a><span aria-hidden="true">/</span><span>${e(typeLabel(record))}</span></div><div class="record-title-row"><div><h1>${e(record.title)}</h1>${record.originalTitle&&record.originalTitle!==record.title?`<p class="original-title">${e(record.originalTitle)}</p>`:''}</div><div class="record-actions"><button id="compare-button" class="primary-action" aria-expanded="false" aria-controls="compare-chooser"${alternatives.length?'':' disabled'}>Compare copies</button><button id="copy-citation">Copy citation</button><button id="download-record">Record JSON</button></div></div><div class="compare-chooser" id="compare-chooser" hidden><label for="compare-select">Compare with</label><select id="compare-select"><option value="">Choose a map or copy</option>${alternatives.map(r=>`<option value="${e(r.id)}">${e(r.title)} · ${e(r.holding)} · ${e(date(r))}</option>`).join('')}</select><button id="close-compare">Close comparison</button></div><div class="image-workspace" id="image-workspace"><div class="map-viewers" id="map-viewers">${viewerMarkup('a',record)}</div><aside class="record-facts"><h2>The identified copy</h2><dl>${metadata}</dl><p class="record-id">${e(record.id)}</p>${record.recordUrl?`<a href="${uri(record.recordUrl)}" target="_blank" rel="noopener">Open the source record ↗</a>`:''}</aside></div><div class="evidence-layout"><div class="evidence-main" id="record-evidence" tabindex="-1"><h2>Evidence and identification</h2><p>${e(record.evidence||'The cited holding record supplies the current identification.')}</p>${record.accessNote?`<p>${e(record.accessNote)}</p>`:''}${record.uncertainties.length?`<h3>Qualifications</h3><ul>${record.uncertainties.map(v=>`<li>${e(v)}</li>`).join('')}</ul>`:''}${cross?`<section class="cross-assessment"><h3>The CROSS reading</h3><p>${e(cross.claim)}</p><p class="assessment-meta">${e(cross.situation)} · evidence for this translation claim: ${e(cross.grade)} · <a href="${uri(cross.url)}" target="_blank" rel="noopener">CROSS ${e(cross.id)}, version 4</a></p><p class="cross-operations">${cross.operations.map(v=>`<span>${e(v)}</span>`).join('')}</p>${cross.languages?`<p class="assessment-meta">Languages: ${e(cross.languages)}</p>`:''}<p class="assessment-meta">The assessment belongs to the cited CROSS record. It does not grade every metadata field or the availability of an image.</p></section>`:''}<h3>Sources</h3><ol class="source-list">${sourceList(record)}</ol>${record.manifests.length?`<h3>IIIF resources</h3><ul>${record.manifests.map((u,i)=>`<li><a href="${uri(u)}" target="_blank" rel="noopener">Institutional manifest${record.manifests.length>1?' '+(i+1):''}</a>${record.cachedManifests.find(m=>m.url===u)?` · <a href="${uri(record.cachedManifests.find(m=>m.url===u).local)}" download>Saved metadata</a>`:''}</li>`).join('')}</ul>`:''}<h3>Image credit and reuse</h3><p>${e(record.rights||'No object-specific reuse licence has been established. Consult the holding institution’s record for its current terms.')}</p><p class="record-provenance">Stable record: ${e(record.id)}. Sources checked 6 November 2026. <a href="coverage.html">Scope, counting rules and image-access checks</a>.</p></div><aside class="related-records"><h2>Related maps and copies</h2><ul>${relatedList(record)}</ul><a class="family-browse" href="./?family=${family.id}">Browse all ${e(family.label)} records ↗</a><p class="record-provenance">A family groups related research material. Direct reproduction or transformation requires evidence specific to the linked objects.</p></aside></div>`;
    $('family-back').href='./?family='+family.id;
    const views={};
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    function notice(key,message,source){
      const box=document.createElement('div');box.className='viewer-notice';box.innerHTML=`<p>${e(message)}</p>${source?`<a href="${uri(source)}" target="_blank" rel="noopener">Open the institutional viewer ↗</a>`:''}`;
      $('viewport-'+key).append(box);
    }
    function openCanvas(key,index){
      const view=views[key],r=view.record,c=r.canvases[index];
      view.index=index;view.generation++;
      const generation=view.generation;
      clearTimeout(view.timeout);
      $('viewport-'+key).querySelectorAll('.viewer-notice,.viewer-preview').forEach(v=>v.remove());
      $('credit-'+key).innerHTML=e(r.holding||'')+(r.shelfmark?' · '+e(r.shelfmark):'')+`<span>${e(c?.label||'Source record')}${c?.verification?.studyDimensions?' · saved study image '+c.verification.studyDimensions.join(' × ')+' px':''}</span>`;
      if(r.displayMode==='external-link-only'||!c){view.osd?.close();notice(key,r.displayMode==='external-link-only'?'This institution provides the image in its own viewer. Its stated reuse conditions are linked below.':'An image has not been verified for this record. The source record and any known digital resources remain available below.',r.viewerUrl||r.recordUrl);return;}
      if(!view.osd){
        view.osd=OpenSeadragon({id:'viewport-'+key,drawer:'canvas',showNavigationControl:false,animationTime:reduced?0:.5,maxZoomPixelRatio:1.6,visibilityRatio:.6,constrainDuringPan:true,tabIndex:-1,crossOriginPolicy:false,gestureSettingsMouse:{clickToZoom:false,dblClickToZoom:true,scrollToZoom:true},gestureSettingsTouch:{clickToZoom:false,pinchToZoom:true,flickEnabled:true}});
        view.osd.addHandler('open-failed',()=>{
          if(view.fallback){notice(key,'The source image is temporarily unavailable. Open the holding institution’s viewer to inspect it.',view.record.viewerUrl||view.record.recordUrl);return;}
          view.fallback=true;const current=view.record.canvases[view.index];const fallback=current.preview||current.image||current.thumbnail;
          if(fallback)view.osd.open({type:'image',url:fallback,crossOriginPolicy:false});else notice(key,'The image service could not be reached. The institutional viewer and source metadata are still available.',view.record.viewerUrl||view.record.recordUrl);
        });
        view.osd.addHandler('tile-loaded',()=>{$('viewport-'+key).querySelector('.viewer-preview')?.remove();clearTimeout(view.timeout);});
      }
      if(c.preview){const preview=document.createElement('img');preview.className='viewer-preview';preview.src=c.preview;preview.alt='';$('viewport-'+key).append(preview);}
      view.fallback=false;
      if(c.dzi)view.osd.open(c.dzi);
      else if(c.info){
        fetch(c.info).then(r=>{if(!r.ok)throw Error('Missing image metadata');return r.json();}).then(info=>{if(generation!==view.generation)return;view.osd.open(info);}).catch(()=>{if(generation!==view.generation)return;view.osd.open(c.service?c.service.replace(/\/$/,'')+'/info.json':{type:'image',url:c.preview||c.image,crossOriginPolicy:false});});
      }else if(c.service)view.osd.open(c.service.replace(/\/$/,'')+'/info.json');
      else view.osd.open({type:'image',url:c.preview||c.image||c.thumbnail,crossOriginPolicy:false});
      if(c.service&&c.preview)view.timeout=setTimeout(()=>{if(generation!==view.generation||!$('viewport-'+key).querySelector('.viewer-preview'))return;view.fallback=true;view.osd.open({type:'image',url:c.preview,crossOriginPolicy:false});$('credit-'+key).insertAdjacentHTML('beforeend','<span>Saved preview. The live image service is taking longer to respond.</span>');},12000);
      if(key==='a'){const p=new URLSearchParams(location.search);if(index)p.set('canvas',String(index));else p.delete('canvas');history.replaceState(null,'','?'+p.toString());}
    }
    function setupViewer(key,r,index=0){
      views[key]={record:r,index:0,generation:0,fallback:false};
      const canvasSelect=$('canvas-'+key);
      canvasSelect.innerHTML=r.canvases.length?r.canvases.map((c,i)=>`<option value="${i}">${e(c.label||'Image '+(i+1))}</option>`).join(''):'<option value="0">Source record</option>';
      canvasSelect.disabled=r.canvases.length<2||r.displayMode==='external-link-only';
      canvasSelect.selectedIndex=Math.max(0,Math.min(index,canvasSelect.options.length-1));
      canvasSelect.addEventListener('change',()=>openCanvas(key,Number(canvasSelect.value)));
      $('viewport-'+key).addEventListener('keydown',event=>{
        if(event.target.closest('a,button,select'))return;
        const v=views[key].osd?.viewport;if(!v)return;const b=v.getBounds(),moves={ArrowLeft:[-b.width*.12,0],ArrowRight:[b.width*.12,0],ArrowUp:[0,-b.height*.12],ArrowDown:[0,b.height*.12]};
        if(moves[event.key])v.panBy(new OpenSeadragon.Point(...moves[event.key]),reduced);
        else if(['+','='].includes(event.key))v.zoomBy(1.5);else if(event.key==='-')v.zoomBy(1/1.5);else if(event.key==='0')v.goHome(reduced);else return;
        v.applyConstraints(reduced);event.preventDefault();event.stopPropagation();
      },true);
      openCanvas(key,canvasSelect.selectedIndex);
    }
    $('record-main').addEventListener('click',event=>{
      const button=event.target.closest('[data-action]');if(!button)return;
      const v=views[button.dataset.view]?.osd?.viewport;if(!v)return;
      if(button.dataset.action==='fit')v.goHome(reduced);else v.zoomBy(button.dataset.action==='in'?1.5:1/1.5);
      v.applyConstraints(reduced);
    });
    function showCompare(show){$('compare-chooser').hidden=!show;$('compare-button').setAttribute('aria-expanded',String(show));if(show)$('compare-select').focus();}
    $('compare-button').addEventListener('click',()=>showCompare($('compare-chooser').hidden));
    function closeCompare(){if(views.b){views.b.generation++;clearTimeout(views.b.timeout);views.b.osd?.destroy();}delete views.b;$('image-view-b')?.remove();$('map-viewers').classList.remove('two-viewers');$('image-workspace').classList.remove('is-comparing');$('compare-select').value='';showCompare(false);const p=new URLSearchParams(location.search);p.delete('compare');history.replaceState(null,'','?'+p.toString());$('compare-button').focus();}
    $('close-compare').addEventListener('click',closeCompare);
    $('compare-select').addEventListener('change',()=>{
      const r=data.records.find(r=>r.id===$('compare-select').value);if(!r){closeCompare();return;}
      if(views.b){views.b.generation++;clearTimeout(views.b.timeout);views.b.osd?.destroy();}$('image-view-b')?.remove();
      $('map-viewers').insertAdjacentHTML('beforeend',viewerMarkup('b',r));$('map-viewers').classList.add('two-viewers');$('image-workspace').classList.add('is-comparing');setupViewer('b',r);
      const p=new URLSearchParams(location.search);p.set('compare',r.id);history.replaceState(null,'','?'+p.toString());$('record-status').textContent='Comparing '+record.holding+' with '+r.holding+'. Each view moves independently.';
    });
    const citation=`Connected Cartographies, “${record.title},” ${record.id}, sources checked 6 November 2026. Holding: ${record.holding||'not established'}${record.shelfmark?', '+record.shelfmark:''}. ${record.recordUrl||''}`;
    $('copy-citation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(citation);$('copy-citation').textContent='Citation copied';$('record-status').textContent='Citation copied.';}catch{const p=document.createElement('p');p.className='record-provenance';p.textContent=citation;$('record-evidence').prepend(p);$('record-status').textContent='The citation is displayed above the evidence for copying.';}});
    $('download-record').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({catalogue:data.title,version:data.schemaVersion,checked:data.checked,record},null,2)],{type:'application/json'});const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=record.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);});
    setupViewer('a',record,Number(params.get('canvas'))||0);
    if(params.get('compare')&&alternatives.some(r=>r.id===params.get('compare'))){showCompare(true);$('compare-select').value=params.get('compare');$('compare-select').dispatchEvent(new Event('change'));}
  }
  function setupStudy(){
    $('study-nav').innerHTML=data.families.map(f=>`<a href="#${f.id}">${e(f.label)}</a>`).join('');
    const preferred={ricci:'ricci-liangyi-1603-liaoning',martini:'other-martini-zurich-map-01',ruggieri:'other-ruggieri-rome-map-004',qing:'other-danville-gottingen-map-02'};
    $('study-families').innerHTML=data.families.map(f=>{
      const maps=data.records.filter(r=>r.family===f.id&&r.countable);
      const illustrated=data.records.find(r=>r.id===preferred[f.id]&&thumbnail(r))||maps.find(r=>r.cachedThumbnail)||maps.find(r=>thumbnail(r));
      const source=illustrated||maps[0];
      return `<section class="study-family" id="${f.id}"><div><h2>${e(f.title)}</h2><p>${e(f.description)}</p><ul>${maps.slice(0,3).map(r=>`<li><a href="${urlFor(r.id)}">${e(r.title)}</a> · ${e(r.holding)}</li>`).join('')}</ul><a class="study-browse" href="./?family=${f.id}">Browse ${maps.length} map and copy records ↗</a></div><figure>${illustrated?`<a href="${urlFor(illustrated.id)}" class="study-image"><img src="${uri(illustrated.canvases.find(c=>c.preview)?.preview||thumbnail(illustrated))}" alt="${e(illustrated.title)}" loading="lazy" decoding="async"></a><figcaption class="study-caption">${e(illustrated.holding)}${illustrated.shelfmark?' · '+e(illustrated.shelfmark):''}. <a href="${urlFor(illustrated.id)}">Image credit and source record</a>.</figcaption>`:source?`<div class="study-image"><a href="${urlFor(source.id)}" style="color:#fff;padding:24px">Open the institutional images and source records ↗</a></div>`:''}</figure></section>`;
    }).join('');
  }
  async function init(){
    const response=await fetch('data/catalogue.json');if(!response.ok)throw Error('Catalogue data unavailable');data=await response.json();
    if(document.body.dataset.page==='index')setupIndex();else if(document.body.dataset.page==='record')setupRecord();else if(document.body.dataset.page==='study')setupStudy();
  }
  init().catch(error=>{console.error(error);const target=$('results-count')||$('record-main')||$('study-families');target.innerHTML='The catalogue data could not load. <a href="data/catalogue.csv">Download the CSV</a> or reload this page to try again.';});
})();
