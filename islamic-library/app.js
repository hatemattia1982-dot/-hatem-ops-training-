/* منطق المكتبة الإسلامية: التوجيه (hash routing)، عرض الأقسام، قارئ القرآن، وجلب الآيات. */

const $ = s => document.querySelector(s);
const API = "https://api.alquran.cloud/v1";
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm = s => String(s ?? "").replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g,"")
  .replace(/[أإآٱ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").toLowerCase();
const toAr = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const sname = n => SURAHS[n-1] ? SURAHS[n-1][0] : n;

const D = {
  prophets: typeof PROPHETS_DATA !== "undefined" ? PROPHETS_DATA : [],
  sahaba: typeof SAHABA !== "undefined" ? SAHABA : [],
  sahabiyat: typeof SAHABIYAT !== "undefined" ? SAHABIYAT : [],
  ghazawat: typeof GHAZAWAT !== "undefined" ? GHAZAWAT : [],
  islam: typeof ARKAN_ISLAM !== "undefined" ? ARKAN_ISLAM : {items:[]},
  iman: typeof ARKAN_IMAN !== "undefined" ? ARKAN_IMAN : {items:[]},
  wudu: typeof WUDU !== "undefined" ? WUDU : null,
  salah: typeof SALAH !== "undefined" ? SALAH : null
};

const SECTIONS = [
  {id:"home", name:"الرئيسية", icon:"home"},
  {id:"quran", name:"القرآن الكريم", icon:"quran", desc:"١١٤ سورة بالرسم العثماني مع ستة تفاسير والتلاوة"},
  {id:"islam", name:"أركان الإسلام", icon:"salah", desc:"الشهادتان، الصلاة، الزكاة، الصوم، الحج"},
  {id:"iman", name:"أركان الإيمان", icon:"allah", desc:"الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر"},
  {id:"wudu", name:"الوضوء", icon:"wudu", desc:"صفة الوضوء خطوة بخطوة بالرسوم، ونواقضه، والتيمم والغسل"},
  {id:"salah", name:"الصلاة", icon:"salah", desc:"صفة الصلاة بالرسوم، الأوقات، الأركان والواجبات والسنن"},
  {id:"prophets", name:"قصص الأنبياء", icon:"prophets", desc:"الأنبياء الخمسة والعشرون مرتبين زمنياً"},
  {id:"sahaba", name:"الصحابة", icon:"sahaba", desc:"سير أعلام الصحابة رضي الله عنهم"},
  {id:"sahabiyat", name:"الصحابيات", icon:"sahabiyat", desc:"أمهات المؤمنين وبنات النبي ﷺ وأعلام الصحابيات"},
  {id:"ghazawat", name:"الغزوات", icon:"ghazawat", desc:"غزوات النبي ﷺ وسراياه مع خريطة المواقع"}
];
const count = id => ({quran:114, islam:D.islam.items.length, iman:D.iman.items.length, prophets:D.prophets.length,
  sahaba:D.sahaba.length, sahabiyat:D.sahabiyat.length, ghazawat:D.ghazawat.length}[id]);

/* ===== الثيم ===== */
(function(){
  const t = store.get("theme", null);
  if (t) document.documentElement.dataset.theme = t;
  $("#themeBtn").onclick = () => {
    const cur = document.documentElement.dataset.theme;
    const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "light" : "dark";
    store.set("theme", dark ? "light" : "dark");
  };
})();

$("#nav").innerHTML = SECTIONS.map(s => `<a href="#${s.id}" data-s="${s.id}">${s.name}</a>`).join("");

/* ===== أدوات عرض مشتركة ===== */
function sectionsHTML(sections){
  return (sections || []).map((s, i) => `<h3 class="sec" id="sec-${i}">${esc(s.h)}</h3>
    ${(s.p || []).map(p => `<p>${esc(p)}</p>`).join("")}
    ${s.list ? `<ul class="lst">${s.list.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}`).join("");
}
function tocHTML(sections){
  if (!sections || sections.length < 3) return "";
  return `<div class="toc">${sections.map((s,i) => `<a class="chip" href="javascript:void(0)" data-jump="sec-${i}">${esc(s.h)}</a>`).join("")}</div>`;
}
function listBox(title, arr){
  if (!arr || !arr.length) return "";
  return `<div class="box"><h4>${title}</h4><ul class="lst">${arr.map(x => `<li>${esc(typeof x === "string" ? x : x.text)}</li>`).join("")}</ul></div>`;
}
function hadithBox(arr, title = "من السنة النبوية"){
  if (!arr || !arr.length) return "";
  return `<div class="box"><h4>${title}</h4>${arr.map(h => `<div class="hadith">«${esc(h.text).replace(/^«|»$/g,"")}»<small>${esc(h.source || "")}</small></div>`).join("")}</div>`;
}
function versesBox(refs, title = "آيات من القرآن الكريم"){
  if (!refs || !refs.length) return "";
  return `<div class="box"><h4>${title}</h4><div class="verses" data-refs='${JSON.stringify(refs)}'><div class="meta">جارٍ تحميل الآيات…</div></div></div>`;
}
function factsHTML(pairs){
  const f = pairs.filter(([,v]) => v && v !== "-" && v !== "—");
  return f.length ? `<div class="facts">${f.map(([k,v]) => `<div class="fact"><span>${k}</span>${esc(v)}</div>`).join("")}</div>` : "";
}
function prevNext(list, i, base, label){
  const p = list[i-1], n = list[i+1];
  return `<div class="pn">${n ? `<a href="#${base}/${i+1}">← ${esc(label(n))}</a>` : "<span></span>"}
    ${p ? `<a href="#${base}/${i-1}">${esc(label(p))} →</a>` : "<span></span>"}</div>`;
}

/* جلب نص الآيات من المصدر بدقة المصحف */
const verseCache = new Map();
const BASMALA_WORDS = 4;
function stripBasmala(text, s, a){
  if (a !== 1 || s === 1 || s === 9) return text;
  const w = text.split(" ");
  return norm(w[0]) === "بسم" ? w.slice(BASMALA_WORDS).join(" ") : text;
}
async function fetchAyah(s, a){
  const k = s + ":" + a;
  if (!verseCache.has(k)) verseCache.set(k, fetch(`${API}/ayah/${k}/quran-uthmani`).then(r => r.json())
    .then(j => { if (j.code !== 200) throw 0; return stripBasmala(j.data.text, s, a); })
    .catch(e => { verseCache.delete(k); throw e; }));
  return verseCache.get(k);
}
function hydrateVerses(root){
  root.querySelectorAll(".verses[data-refs]").forEach(async el => {
    const refs = JSON.parse(el.dataset.refs).filter(r => r && SURAHS[r[0]-1] && r[1] >= 1 && r[1] <= SURAHS[r[0]-1][1]);
    // تجميع الآيات المتتالية من السورة نفسها في مقطع واحد
    const groups = [];
    refs.forEach(([s,a]) => {
      const g = groups[groups.length-1];
      if (g && g.s === s && a === g.to + 1) g.to = a; else groups.push({s, from:a, to:a});
    });
    try{
      const texts = await Promise.all(groups.map(g => Promise.all(
        Array.from({length: g.to - g.from + 1}, (_, i) => fetchAyah(g.s, g.from + i)))));
      el.innerHTML = groups.map((g, gi) => `<div class="verse">﴿${texts[gi].map((t, i) =>
        `${esc(t)} <span class="amark" style="width:28px;height:28px;min-width:28px;font-size:12px">${toAr(g.from+i)}</span>`).join(" ")}﴾
        <span class="ref"><a href="#quran/${g.s}/${g.from}">[${sname(g.s)}: ${toAr(g.from)}${g.to > g.from ? "–" + toAr(g.to) : ""}]</a></span></div>`).join("");
    }catch(e){
      el.innerHTML = `<div class="meta">تعذّر تحميل نص الآيات (يحتاج اتصالاً بالإنترنت). المراجع: ` +
        groups.map(g => `<a href="#quran/${g.s}/${g.from}">${sname(g.s)}: ${toAr(g.from)}${g.to > g.from ? "–" + toAr(g.to) : ""}</a>`).join("، ") + `</div>`;
    }
  });
}

/* ===== الرئيسية ===== */
function allIndex(){
  const out = [];
  D.prophets.forEach((p,i) => out.push({t:p.name, sub:"قصص الأنبياء", h:`prophets/${i}`, x:p.summary}));
  D.sahaba.forEach((p,i) => out.push({t:p.name, sub:"الصحابة", h:`sahaba/${i}`, x:p.summary}));
  D.sahabiyat.forEach((p,i) => out.push({t:p.name, sub:"الصحابيات", h:`sahabiyat/${i}`, x:p.summary}));
  D.ghazawat.forEach((g,i) => out.push({t:g.name, sub:"الغزوات", h:`ghazawat/${i}`, x:g.summary}));
  D.islam.items.forEach(it => out.push({t:it.name, sub:"أركان الإسلام", h:`islam/${it.key}`, x:it.short}));
  D.iman.items.forEach(it => out.push({t:it.name, sub:"أركان الإيمان", h:`iman/${it.key}`, x:it.short}));
  SURAHS.forEach((s,i) => out.push({t:"سورة " + s[0], sub:"القرآن الكريم", h:`quran/${i+1}`, x:`${s[2]} · ${s[1]} آية`}));
  return out;
}
function viewHome(){
  const last = store.get("last", null);
  $("#view").innerHTML = `
    <div class="hero"><div class="bism">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
      <p class="intro">مكتبة جامعة للقرآن الكريم وتفسيره، وأصول العقيدة والعبادات، وسير الأنبياء والصحابة، وغزوات النبي ﷺ.</p>
      <input class="search" id="gsearch" placeholder="ابحث في المكتبة كلها: نبي، صحابي، غزوة، سورة…" style="width:100%">
      ${last && SURAHS[last.n-1] ? `<p style="margin-top:10px"><a class="chip" href="#quran/${last.n}/${last.a}">متابعة القراءة: سورة ${sname(last.n)} — الآية ${toAr(last.a)}</a></p>` : ""}
    </div>
    <div id="gres"></div>
    <div class="tiles">${SECTIONS.slice(1).map(s => `<a class="card tile" href="#${s.id}">${ILL.icons[s.icon]}
      <div><b>${s.name}</b><span class="meta">${s.desc}</span>${count(s.id) && s.id !== "quran" ? `<br><span class="tag">${toAr(count(s.id))} موضوعاً</span>` : ""}</div></a>`).join("")}</div>`;
  const idx = allIndex();
  $("#gsearch").oninput = e => {
    const q = norm(e.target.value.trim());
    if (q.length < 2) { $("#gres").innerHTML = ""; return; }
    const r = idx.filter(o => norm(o.t).includes(q)).concat(idx.filter(o => !norm(o.t).includes(q) && norm(o.x).includes(q))).slice(0, 30);
    $("#gres").innerHTML = `<div class="grid" style="margin-bottom:18px">${r.map(o => `<a class="card" href="#${o.h}"><h3>${esc(o.t)}</h3><div class="meta">${o.sub}</div></a>`).join("") || '<div class="empty">لا توجد نتائج</div>'}</div>`;
  };
}

/* ===== القوائم العامة (الأنبياء، الصحابة، الصحابيات) ===== */
function viewList(id, data, opts){
  const sec = SECTIONS.find(s => s.id === id);
  let filter = "all";
  const tags = opts.tags ? [...new Set(data.flatMap(opts.tags))] : [];
  $("#view").innerHTML = `<h2 class="pg">${sec.name}</h2><p class="intro">${opts.intro}</p>${opts.note || ""}
    <div class="bar"><input class="search" id="ls" placeholder="ابحث…"></div>
    ${tags.length ? `<div class="bar" id="lt"><button class="chip on" data-t="all">الكل (${toAr(data.length)})</button>${tags.map(t => `<button class="chip" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}
    <div class="${opts.timeline ? "timeline" : "grid"}" id="ll"></div>`;
  const render = () => {
    const q = norm($("#ls").value.trim());
    $("#ll").innerHTML = data.map((p,i) => ({p,i}))
      .filter(({p}) => (filter === "all" || opts.tags(p).includes(filter)) && (!q || norm(p.name + (p.full||"") + (p.summary||"") + JSON.stringify(p.sections||"")).includes(q)))
      .map(({p,i}) => opts.card(p, i)).join("") || `<div class="empty">لا توجد نتائج</div>`;
  };
  $("#ls").oninput = render;
  if ($("#lt")) $("#lt").onclick = e => {
    if (!e.target.dataset.t) return;
    filter = e.target.dataset.t;
    $("#lt").querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === e.target));
    render();
  };
  render();
}

function viewProphets(){
  viewList("prophets", D.prophets, {
    timeline:true,
    intro:"الأنبياء والرسل الخمسة والعشرون المذكورون في القرآن الكريم، مرتّبين ترتيباً زمنياً. اضغط على أي نبي لقراءة قصته كاملة.",
    note:`<div class="note">الدائرة الذهبية = من <b>أولي العزم من الرسل</b>: نوح، إبراهيم، موسى، عيسى، ومحمد ﷺ. وترتيب بعض الأنبياء كأيوب وشعيب وذي الكفل ويونس فيه اجتهاد بين المؤرخين.</div>`,
    card:(p,i) => `<div class="tl ${p.ulul?"gold":""}" data-n="${toAr(i+1)}"><a class="card" href="#prophets/${i}">
      <h3>${esc(p.name)} ${p.name.includes("ﷺ") ? "" : "عليه السلام"}</h3><div class="meta">${esc(p.title)}</div>
      <p style="margin-top:4px">${esc(p.summary)}</p>
      <div>${p.ulul?'<span class="tag gold">أولو العزم</span>':""}<span class="tag">${esc(p.people)}</span><span class="tag">ذُكر ${toAr(p.mentions)} مرة</span></div></a></div>`
  });
}
function viewProphet(i){
  const p = D.prophets[i]; if (!p) return go("prophets");
  $("#view").innerHTML = `<a class="back" href="#prophets">→ قصص الأنبياء</a><article class="art">
    <div class="art-head">${ILL.icons.prophets}<div><h2 class="pg">${esc(p.name)} ${p.name.includes("ﷺ") ? "" : "عليه السلام"}</h2><div class="meta">${esc(p.title)}</div></div></div>
    ${factsHTML([["الترتيب الزمني", toAr(i+1) + " من ٢٥"],["القوم", p.people],["المكان", p.place],["مرات ذكر اسمه في القرآن", toAr(p.mentions)],["أبرز السور", p.surahs],["من أولي العزم", p.ulul ? "نعم" : ""]])}
    <div class="lead">${esc(p.summary)}</div>${tocHTML(p.sections)}
    ${sectionsHTML(p.sections)}${versesBox(p.verses)}${hadithBox(p.hadith)}${listBox("دروس وعبر", p.lessons)}
    ${prevNext(D.prophets, i, "prophets", x => x.name)}</article>`;
}

function personView(base, data, i, honor, backName){
  const p = data[i]; if (!p) return go(base);
  $("#view").innerHTML = `<a class="back" href="#${base}">→ ${backName}</a><article class="art">
    <div class="art-head">${ILL.icons[base]}<div><h2 class="pg">${esc(p.name)} <small style="font-size:18px">${honor}</small></h2><div class="meta">${esc(p.kunya || "")}</div></div></div>
    ${factsHTML([["الاسم والنسب", p.full],["الوفاة", p.died],["التصنيف", (p.tags || [p.group]).join("، ")]])}
    <div class="lead">${esc(p.summary)}</div>${tocHTML(p.sections)}
    ${sectionsHTML(p.sections)}${listBox("من فضائله" + (base === "sahabiyat" ? "ا" : ""), p.virtues)}${hadithBox(p.hadith)}${versesBox(p.verses, "آيات ذات صلة")}
    ${prevNext(data, i, base, x => x.name)}</article>`;
}
const personCard = (base, honor) => (p,i) => `<a class="card" href="#${base}/${i}"><h3>${esc(p.name)} <small class="meta">${honor}</small></h3>
  <div class="meta">${esc(p.kunya || p.full || "")}</div><p style="margin-top:4px;font-size:15px">${esc(p.summary)}</p>
  <div>${(p.tags || [p.group]).map(t => `<span class="tag">${esc(t)}</span>`).join("")}<span class="tag">الوفاة: ${esc(p.died)}</span></div></a>`;

/* ===== الغزوات ===== */
function viewGhazawat(){
  let filter = "all";
  $("#view").innerHTML = `<h2 class="pg">الغزوات والسرايا</h2>
    <p class="intro">أبرز غزوات النبي ﷺ وسراياه مرتبة زمنياً. اضغط على نقطة في الخريطة أو على الغزوة لقراءة تفاصيلها.</p>
    <div class="mapwrap"><div class="card">${ILL.map()}</div>
    <div><div class="note">غزا النبي ﷺ بنفسه <b>٢٧ غزوة</b> على المشهور، قاتل في تسع منها: بدر، وأحد، والخندق، وقريظة، والمصطلق، وخيبر، والفتح، وحنين، والطائف (وفي عدّ الفتح منها خلاف). و«السرية» ما أرسل فيه جيشاً ولم يخرج بنفسه.</div>
    <div class="bar"><input class="search" id="gs" placeholder="ابحث عن غزوة…"></div>
    <div class="bar"><button class="chip on" data-g="all">الكل</button><button class="chip" data-g="fought">وقع فيها قتال</button><button class="chip" data-g="quran">ذُكرت في القرآن</button></div></div></div>
    <div class="timeline" id="gl"></div>`;
  const render = (loc) => {
    const q = norm($("#gs").value.trim());
    $("#gl").innerHTML = D.ghazawat.map((g,i) => ({g,i}))
      .filter(({g}) => (!loc || ILL.place(g.loc) === loc) && (filter === "all" || (filter === "fought" && g.fought) || (filter === "quran" && g.verses && g.verses.length))
        && (!q || norm(g.name + g.summary + g.date + g.place).includes(q)))
      .map(({g,i}) => `<div class="tl ${g.fought?"gold":""}" data-n="${toAr(i+1)}"><a class="card" href="#ghazawat/${i}">
        <h3>${esc(g.name)}</h3><div class="meta">${esc(g.date)} · ${esc(g.place)}</div>
        <p style="margin-top:4px;font-size:15px">${esc(g.summary)}</p>
        <div><span class="tag ${g.type==="سرية"?"":"gold"}">${esc(g.type)}</span><span class="tag">${g.fought?"وقع قتال":"لم يقع قتال"}</span><span class="tag">المسلمون: ${esc(g.muslims)}</span></div></a></div>`).join("")
      || `<div class="empty">لا توجد نتائج</div>`;
  };
  $("#gs").oninput = () => render();
  document.querySelectorAll("[data-g]").forEach(b => b.onclick = () => {
    filter = b.dataset.g; document.querySelectorAll("[data-g]").forEach(x => x.classList.toggle("on", x === b)); render();
  });
  document.querySelectorAll(".mapdot").forEach(d => d.onclick = () => {
    const on = d.classList.contains("on");
    document.querySelectorAll(".mapdot").forEach(x => x.classList.remove("on"));
    if (!on) d.classList.add("on");
    render(on ? null : d.dataset.loc);
    $("#gl").scrollIntoView({behavior:"smooth", block:"start"});
  });
  render();
}
function viewGhazwa(i){
  const g = D.ghazawat[i]; if (!g) return go("ghazawat");
  $("#view").innerHTML = `<a class="back" href="#ghazawat">→ الغزوات</a><article class="art">
    <h2 class="pg">${esc(g.name)}</h2><div class="meta">${esc(g.date)}</div>
    <div class="mapwrap" style="margin-top:12px"><div class="card">${ILL.map(g.loc)}</div><div>
    ${factsHTML([["النوع", g.type],["التاريخ", g.date],["المكان", g.place],["عدد المسلمين", g.muslims],["العدو", g.enemy],["القادة", g.leaders],["النتيجة", g.result],["الخسائر", g.losses]])}</div></div>
    <div class="lead">${esc(g.summary)}</div>${tocHTML(g.sections)}
    ${sectionsHTML(g.sections)}${listBox("أبطال ومواقف", g.heroes)}${versesBox(g.verses, "ما نزل فيها من القرآن")}${hadithBox(g.hadith)}
    ${prevNext(D.ghazawat, i, "ghazawat", x => x.name)}</article>`;
}

/* ===== أركان الإسلام والإيمان ===== */
function viewArkan(id, key){
  const A = D[id], sec = SECTIONS.find(s => s.id === id);
  if (!A.items.length) { $("#view").innerHTML = `<div class="empty">المحتوى غير متوفر</div>`; return; }
  if (key){
    const idx = A.items.findIndex(x => x.key === key), it = A.items[idx];
    if (!it) return go(id);
    $("#view").innerHTML = `<a class="back" href="#${id}">→ ${sec.name}</a><article class="art">
      <div class="art-head">${ILL.icons[it.key] || ILL.icons[sec.icon]}<div><div class="meta">الركن ${toAr(idx+1)} من ${toAr(A.items.length)}</div><h2 class="pg">${esc(it.name)}</h2></div></div>
      <div class="lead">${esc(it.short)}</div>${tocHTML(it.sections)}${sectionsHTML(it.sections)}
      ${versesBox(it.verses)}${hadithBox(it.hadith)}
      <div class="pn">${A.items[idx+1] ? `<a href="#${id}/${A.items[idx+1].key}">← ${esc(A.items[idx+1].name)}</a>` : "<span></span>"}
      ${A.items[idx-1] ? `<a href="#${id}/${A.items[idx-1].key}">${esc(A.items[idx-1].name)} →</a>` : "<span></span>"}</div></article>`;
    return;
  }
  $("#view").innerHTML = `<h2 class="pg">${sec.name}</h2><div class="lead">${esc(A.intro)}</div>${hadithBox(A.hadith, "الدليل")}
    <div class="tiles">${A.items.map((it,i) => `<a class="card tile" href="#${id}/${it.key}">${ILL.icons[it.key] || ILL.icons[sec.icon]}
      <div><span class="meta">${toAr(i+1)}</span><b>${esc(it.name)}</b><span class="meta">${esc(it.short)}</span></div></a>`).join("")}</div>`;
}

/* ===== الوضوء ===== */
function viewWudu(){
  const W = D.wudu; if (!W) { $("#view").innerHTML = `<div class="empty">المحتوى غير متوفر</div>`; return; }
  $("#view").innerHTML = `<article class="art"><div class="art-head">${ILL.icons.wudu}<h2 class="pg">الوضوء</h2></div>
    <div class="lead">${esc(W.intro)}</div>${versesBox(W.verses, "آية الوضوء")}${hadithBox(W.virtues, "فضل الوضوء")}
    <h3 class="sec">صفة الوضوء خطوة بخطوة</h3>
    <p class="meta">العضو المظلّل باللون الأزرق هو موضع الغسل أو المسح في كل خطوة. الشارة الذهبية تعني أن الخطوة من فروض الوضوء.</p>
    <div class="steps">${W.steps.map((s,i) => `<div class="card step"><span class="n">${toAr(i+1)}</span>${ILL.wudu(s.key)}
      <h4>${esc(s.title)}</h4><div>${s.fard ? '<span class="tag gold">فرض</span>' : '<span class="tag">سنة</span>'}${s.count && s.count !== "—" ? `<span class="tag">${esc(s.count)}</span>` : ""}</div>
      <p>${esc(s.text)}</p></div>`).join("")}</div>
    <div style="margin-top:18px">
    ${acc("شروط الوضوء", W.conditions)}${acc("فروض الوضوء", W.faraid, true)}${acc("سنن الوضوء", W.sunan)}${acc("نواقض الوضوء", W.nawaqid, true)}
    ${W.tayammum ? acc("التيمم", W.tayammum.steps, false, W.tayammum.text) : ""}
    ${W.ghusl ? acc("الغسل", W.ghusl.steps, false, W.ghusl.text) : ""}</div></article>`;
}
function acc(title, list, open, text){
  if ((!list || !list.length) && !text) return "";
  return `<details class="acc"${open ? " open" : ""}><summary>${title}</summary><div>
    ${text ? `<p>${esc(text)}</p>` : ""}${list && list.length ? `<ul class="lst">${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div></details>`;
}

/* ===== الصلاة ===== */
function viewSalah(){
  const S = D.salah; if (!S) { $("#view").innerHTML = `<div class="empty">المحتوى غير متوفر</div>`; return; }
  $("#view").innerHTML = `<article class="art"><div class="art-head">${ILL.icons.salah}<h2 class="pg">الصلاة</h2></div>
    <div class="lead">${esc(S.intro)}</div>${versesBox(S.verses)}${hadithBox(S.hadith)}
    <h3 class="sec">الصلوات الخمس وأوقاتها</h3>
    <div style="overflow-x:auto"><table class="tb"><tr><th>الصلاة</th><th>الفرض</th><th>السنن الرواتب</th><th>الوقت</th></tr>
    ${(S.times || []).map(t => `<tr><td><b>${esc(t.name)}</b></td><td>${toAr(t.fard)} ركعات</td><td>${esc(t.sunnah)}</td><td>${esc(t.time)}</td></tr>`).join("")}</table></div>
    <h3 class="sec">صفة الصلاة خطوة بخطوة</h3>
    <p class="meta">الرسوم توضيحية لهيئة المصلي، والمكعب في الزاوية يشير إلى اتجاه القبلة.</p>
    <div class="steps">${S.steps.map((s,i) => `<div class="card step"><span class="n">${toAr(i+1)}</span>${ILL.pose(s.pose)}
      <h4>${esc(s.title)}</h4><p>${esc(s.text)}</p>${s.say ? `<div class="say">${esc(s.say)}</div>` : ""}
      ${s.verses ? versesBox(s.verses, "") : ""}</div>`).join("")}</div>
    <div style="margin-top:18px">
    ${acc("شروط الصلاة", S.conditions)}${acc("أركان الصلاة", S.arkan, true)}${acc("واجبات الصلاة", S.wajibat)}${acc("سنن الصلاة", S.sunan)}${acc("مبطلات الصلاة", S.mubtilat)}
    ${S.sahw ? acc("سجود السهو", S.sahw.list, false, S.sahw.text) : ""}</div>
    ${S.adhkar && S.adhkar.length ? `<div class="box"><h4>الأذكار بعد الصلاة</h4>${S.adhkar.map(a => `<div class="hadith"><span class="say" style="display:block;background:none;padding:0">${esc(a.text)}</span>${a.verses ? versesBox(a.verses, "") : ""}<small>${a.count ? "العدد: " + esc(a.count) + " · " : ""}${esc(a.source || "")}</small></div>`).join("")}</div>` : ""}
    </article>`;
}

/* ===== القرآن الكريم ===== */
let qFilter = "all";
function viewQuranIndex(){
  const last = store.get("last", null);
  $("#view").innerHTML = `<h2 class="pg">القرآن الكريم</h2>
    <p class="intro">اختر سورة لقراءتها مع التفسير والاستماع إلى التلاوة. النص القرآني يُجلب من مصدر موثّق بالرسم العثماني.</p>
    <div class="bar"><input class="search" id="qSearch" placeholder="ابحث باسم السورة أو رقمها…">
      <button class="chip ${qFilter==="all"?"on":""}" data-f="all">الكل</button><button class="chip ${qFilter==="مكية"?"on":""}" data-f="مكية">مكية</button><button class="chip ${qFilter==="مدنية"?"on":""}" data-f="مدنية">مدنية</button>
      ${last && SURAHS[last.n-1] ? `<a class="chip" href="#quran/${last.n}/${last.a}">متابعة: ${sname(last.n)} (${toAr(last.a)})</a>` : ""}</div>
    <div class="bar"><input class="search" id="ayahSearch" placeholder="ابحث عن كلمة في آيات القرآن (مثال: الصبر)…"><button class="chip" id="ayahGo">بحث في الآيات</button></div>
    <div id="ayahResults"></div><div class="grid" id="surahGrid"></div>`;
  const render = () => {
    const q = norm($("#qSearch").value.trim());
    $("#surahGrid").innerHTML = SURAHS.map((s,i) => ({n:i+1, name:s[0], ayat:s[1], type:s[2]}))
      .filter(s => (qFilter === "all" || s.type === qFilter) && (!q || norm(s.name).includes(q) || String(s.n) === q))
      .map(s => `<a class="card surah" href="#quran/${s.n}"><div class="num">${toAr(s.n)}</div>
        <div><div class="nm">سورة ${s.name}</div><div class="meta">${s.type} · ${toAr(s.ayat)} آية</div></div></a>`).join("") || `<div class="empty">لا توجد نتائج</div>`;
  };
  $("#qSearch").oninput = render;
  document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => {
    qFilter = b.dataset.f; document.querySelectorAll("[data-f]").forEach(x => x.classList.toggle("on", x === b)); render();
  });
  $("#ayahGo").onclick = searchAyat;
  $("#ayahSearch").onkeydown = e => { if (e.key === "Enter") searchAyat(); };
  render();
}
async function searchAyat(){
  const kw = $("#ayahSearch").value.trim(), box = $("#ayahResults");
  if (!kw) { box.innerHTML = ""; return; }
  box.innerHTML = `<div class="status">جارٍ البحث…</div>`;
  try{
    const j = await (await fetch(`${API}/search/${encodeURIComponent(kw)}/all/quran-simple-clean`)).json();
    const m = (j.data && j.data.matches) || [];
    if (!m.length) { box.innerHTML = `<div class="empty">لم يُعثر على نتائج لـ «${esc(kw)}»</div>`; return; }
    box.innerHTML = `<p class="meta" style="margin-bottom:8px">عدد النتائج: ${toAr(m.length)}${m.length>50?" (يُعرض أول ٥٠)":""}</p>` +
      m.slice(0,50).map(a => `<a class="card" style="margin-bottom:8px" href="#quran/${a.surah.number}/${a.numberInSurah}">
        <div class="atext" style="font-size:22px">${esc(a.text)}</div><div class="meta">سورة ${sname(a.surah.number)} · الآية ${toAr(a.numberInSurah)}</div></a>`).join("") +
      `<hr style="border:0;border-top:1px solid var(--line);margin:14px 0">`;
  }catch(e){ box.innerHTML = `<div class="status err">تعذّر الاتصال بخدمة البحث. تحقق من اتصال الإنترنت.</div>`; }
}

let current = 0, audioList = [], playIdx = -1, continuous = false, fontSize = store.get("qsize", 26);
const audio = new Audio();
document.documentElement.style.setProperty("--qsize", fontSize + "px");

async function viewSurah(n, focusAyah){
  if (!SURAHS[n-1]) return go("quran");
  stopAudio(); current = n;
  store.set("last", {n, a: focusAyah || 1});
  const [name, cnt, type] = SURAHS[n-1];
  const tafsir = store.get("tafsir", "ar.muyassar");
  $("#view").innerHTML = `<div class="rtop"><a href="#quran">→ الفهرس</a>
      <select id="tafsirSel" title="التفسير">${TAFSIRS.map(([id,nm]) => `<option value="${id}"${id===tafsir?" selected":""}>${nm}</option>`).join("")}</select>
      <button id="toggleTafsir">إخفاء التفسير</button><button id="fontDown" title="تصغير الخط">أ−</button><button id="fontUp" title="تكبير الخط">أ+</button>
      <button id="playAll">▶ تلاوة السورة (العفاسي)</button></div>
    <div id="readerBody"><div class="stitle">سورة ${name}</div><p class="meta" style="text-align:center">${type} · ${toAr(cnt)} آية</p><div class="status">جارٍ تحميل السورة والتفسير…</div></div>`;
  $("#tafsirSel").onchange = e => { store.set("tafsir", e.target.value); viewSurah(n); };
  $("#toggleTafsir").onclick = () => { const h = $("#readerBody").classList.toggle("hide-tafsir"); $("#toggleTafsir").textContent = h ? "إظهار التفسير" : "إخفاء التفسير"; };
  $("#fontUp").onclick = () => setFont(2); $("#fontDown").onclick = () => setFont(-2);
  $("#playAll").onclick = () => playIdx >= 0 ? stopAudio() : playFrom(0, true);
  try{
    const j = await (await fetch(`${API}/surah/${n}/editions/quran-uthmani,${tafsir},ar.alafasy`)).json();
    if (j.code !== 200) throw new Error("API");
    if (current !== n || !$("#readerBody")) return;
    const [qur, taf, aud] = j.data;
    audioList = aud.ayahs.map(a => a.audio);
    const body = $("#readerBody");
    body.innerHTML = `<div class="stitle">سورة ${name}</div><p class="meta" style="text-align:center">${type} · ${toAr(cnt)} آية · ${esc(taf.name)}</p>
      ${n !== 1 && n !== 9 ? `<div class="basmala">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>` : ""}
      ${qur.ayahs.map((a,i) => `<div class="ayah" id="ayah-${a.numberInSurah}">
        <div class="atext">${esc(stripBasmala(a.text, n, a.numberInSurah))}<span class="amark">${toAr(a.numberInSurah)}</span></div>
        <div class="atools"><button data-play="${i}">▶ استماع</button><button data-copy="${i}">نسخ</button></div>
        <div class="tafsir">${esc(taf.ayahs[i].text)}</div></div>`).join("")}
      <div class="pn">${n < 114 ? `<a href="#quran/${n+1}">← السورة التالية: ${sname(n+1)}</a>` : "<span></span>"}
        ${n > 1 ? `<a href="#quran/${n-1}">السورة السابقة: ${sname(n-1)} →</a>` : "<span></span>"}</div>`;
    body.onclick = e => {
      const t = e.target;
      if (t.dataset.play !== undefined) playFrom(+t.dataset.play, false);
      else if (t.dataset.copy !== undefined) {
        const a = qur.ayahs[+t.dataset.copy];
        const txt = `${stripBasmala(a.text, n, a.numberInSurah)} [${name}: ${a.numberInSurah}]`;
        navigator.clipboard && navigator.clipboard.writeText(txt).then(() => { t.textContent = "تم النسخ ✓"; setTimeout(() => t.textContent = "نسخ", 1500); });
      }
    };
    if (focusAyah) {
      const el = document.getElementById("ayah-" + focusAyah);
      if (el) { el.scrollIntoView({block:"center"}); el.classList.add("playing"); setTimeout(() => el.classList.remove("playing"), 2500); }
    }
  }catch(e){
    if (!$("#readerBody")) return;
    $("#readerBody").innerHTML = `<div class="stitle">سورة ${name}</div><div class="status err">تعذّر تحميل السورة. تأكد من اتصالك بالإنترنت ثم حاول مجدداً.<br>
      <button class="chip" style="margin-top:10px" id="retry">إعادة المحاولة</button></div>`;
    $("#retry").onclick = () => viewSurah(n, focusAyah);
  }
}
function setFont(d){ fontSize = Math.min(44, Math.max(18, fontSize + d)); document.documentElement.style.setProperty("--qsize", fontSize + "px"); store.set("qsize", fontSize); }
function playFrom(i, cont){
  continuous = cont;
  document.querySelectorAll(".ayah.playing").forEach(x => x.classList.remove("playing"));
  if (i >= audioList.length) { stopAudio(); return; }
  playIdx = i;
  const el = document.getElementById("ayah-" + (i+1));
  if (el) { el.classList.add("playing"); if (cont) el.scrollIntoView({block:"center", behavior:"smooth"}); }
  store.set("last", {n: current, a: i+1});
  audio.src = audioList[i]; audio.play().catch(() => {});
  if ($("#playAll")) $("#playAll").textContent = "■ إيقاف التلاوة";
}
function stopAudio(){
  audio.pause(); playIdx = -1; continuous = false;
  document.querySelectorAll(".ayah.playing").forEach(x => x.classList.remove("playing"));
  if ($("#playAll")) $("#playAll").textContent = "▶ تلاوة السورة (العفاسي)";
}
audio.onended = () => continuous ? playFrom(playIdx + 1, true) : stopAudio();

/* ===== التوجيه ===== */
function go(h){ location.hash = h; }
function route(){
  const [sec = "home", a, b] = location.hash.replace(/^#/, "").split("/").map(decodeURIComponent);
  const id = SECTIONS.some(s => s.id === sec) ? sec : "home";
  if (id !== "quran") stopAudio();
  document.querySelectorAll("#nav a").forEach(x => x.classList.toggle("on", x.dataset.s === id));
  const active = $(`#nav a[data-s="${id}"]`); if (active) active.scrollIntoView({inline:"center", block:"nearest"});
  const n = a !== undefined ? +a : null;
  switch (id){
    case "quran": n ? viewSurah(n, b ? +b : 0) : viewQuranIndex(); break;
    case "islam": case "iman": viewArkan(id, a); break;
    case "wudu": viewWudu(); break;
    case "salah": viewSalah(); break;
    case "prophets": n !== null ? viewProphet(n) : viewProphets(); break;
    case "sahaba": n !== null ? personView("sahaba", D.sahaba, n, "رضي الله عنه", "الصحابة")
      : viewList("sahaba", D.sahaba, {intro:"سِيَر أعلام الصحابة رضي الله عنهم. اضغط على أي صحابي لقراءة سيرته كاملة.", tags:p => p.tags || [], card:personCard("sahaba","رضي الله عنه")}); break;
    case "sahabiyat": n !== null ? personView("sahabiyat", D.sahabiyat, n, "رضي الله عنها", "الصحابيات")
      : viewList("sahabiyat", D.sahabiyat, {intro:"سِيَر أمهات المؤمنين وبنات النبي ﷺ وأعلام الصحابيات رضي الله عنهن.", tags:p => [p.group], card:personCard("sahabiyat","رضي الله عنها")}); break;
    case "ghazawat": n !== null ? viewGhazwa(n) : viewGhazawat(); break;
    default: viewHome();
  }
  if (!(id === "quran" && b)) scrollTo(0, 0);
  hydrateVerses($("#view"));
}
document.addEventListener("click", e => {
  const j = e.target.closest("[data-jump]");
  if (j) { e.preventDefault(); const t = document.getElementById(j.dataset.jump); if (t) t.scrollIntoView({behavior:"smooth", block:"start"}); }
});
addEventListener("hashchange", route);
route();
