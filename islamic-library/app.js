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
  salah: typeof SALAH !== "undefined" ? SALAH : null,
  mujizat: typeof MUJIZAT !== "undefined" ? MUJIZAT : {categories:[]},
  asma: typeof ASMA !== "undefined" ? ASMA : {names:[]},
  adhkar: typeof ADHKAR !== "undefined" ? ADHKAR : {categories:[]},
  seerah: typeof SEERAH !== "undefined" ? SEERAH : {periods:[]},
  khutab: typeof KHUTAB_DATA !== "undefined" ? KHUTAB_DATA : [],
  duas: typeof DUAS !== "undefined" ? DUAS : {quran:[], sunnah:[]},
  hajj: typeof HAJJ !== "undefined" ? HAJJ : null,
  karamatIntro: typeof KARAMAT_INTRO !== "undefined" ? KARAMAT_INTRO : ""
};

const SECTIONS = [
  {id:"home", name:"الرئيسية", icon:"home"},
  {id:"quran", name:"القرآن الكريم", icon:"quran", desc:"١١٤ سورة بالرسم العثماني مع ستة تفاسير والتلاوة"},
  {id:"seerah", name:"السيرة النبوية", icon:"seerah", desc:"حياة النبي ﷺ من المولد إلى الوفاة على خط زمني، والشمائل المحمدية"},
  {id:"asma", name:"أسماء الله الحسنى", icon:"allah", desc:"الأسماء الحسنى بمعانيها وشرحها وأثرها في القلب"},
  {id:"adhkar", name:"الأذكار", icon:"beads", desc:"أذكار الصباح والمساء والنوم واليوم والليلة مع عدّاد"},
  {id:"duas", name:"الأدعية", icon:"dua", desc:"أدعية القرآن الكريم والأدعية النبوية الصحيحة مصنفة، وآداب الدعاء"},
  {id:"khutab", name:"خطب الجمعة", icon:"minbar", desc:"خطب جاهزة للإلقاء بالأدلة، مع وضع الخطيب والطباعة"},
  {id:"hajj", name:"الحج والعمرة", icon:"tawaf", desc:"صفة العمرة والحج خطوة بخطوة ويوماً بيوم، والمواقيت والمحظورات"},
  {id:"islam", name:"أركان الإسلام", icon:"salah", desc:"الشهادتان، الصلاة، الزكاة، الصوم، الحج"},
  {id:"iman", name:"أركان الإيمان", icon:"allah", desc:"الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر"},
  {id:"wudu", name:"الوضوء", icon:"wudu", desc:"صفة الوضوء خطوة بخطوة بالرسوم، ونواقضه، والتيمم والغسل"},
  {id:"salah", name:"الصلاة", icon:"salah", desc:"صفة الصلاة بالرسوم، الأوقات، الأركان والواجبات والسنن"},
  {id:"prophets", name:"قصص الأنبياء", icon:"prophets", desc:"الأنبياء الخمسة والعشرون مرتبين زمنياً"},
  {id:"mujizat", name:"معجزات النبي ﷺ", icon:"sawm", desc:"دلائل النبوة: انشقاق القمر، نبع الماء، حنين الجذع، الإخبار بالغيب…"},
  {id:"sahaba", name:"الصحابة", icon:"sahaba", desc:"سير أعلام الصحابة رضي الله عنهم"},
  {id:"sahabiyat", name:"الصحابيات", icon:"sahabiyat", desc:"أمهات المؤمنين وبنات النبي ﷺ وأعلام الصحابيات"},
  {id:"ghazawat", name:"الغزوات", icon:"ghazawat", desc:"غزوات النبي ﷺ وسراياه مع خريطة المواقع"}
];
// الأقسام التي لم يصل محتواها بعد لا تظهر
const EMPTY = {mujizat: !D.mujizat.categories.length, asma: !D.asma.names.length, adhkar: !D.adhkar.categories.length, seerah: !D.seerah.periods.length, khutab: !D.khutab.length, duas: !D.duas.quran.length && !D.duas.sunnah.length, hajj: !D.hajj};
for (let i = SECTIONS.length - 1; i >= 0; i--) if (EMPTY[SECTIONS[i].id]) SECTIONS.splice(i, 1);
const count = id => ({quran:114, islam:D.islam.items.length, iman:D.iman.items.length, prophets:D.prophets.length,
  sahaba:D.sahaba.length, khutab:D.khutab.length, duas:D.duas.quran.length + D.duas.sunnah.reduce((a,c) => a + c.items.length, 0), asma:D.asma.names.length, adhkar:D.adhkar.categories.reduce((a,c) => a + c.items.length, 0), seerah:D.seerah.periods.reduce((a,p) => a + p.events.length, 0), mujizat:D.mujizat.categories.reduce((a,c) => a + c.items.length, 0), sahabiyat:D.sahabiyat.length, ghazawat:D.ghazawat.length}[id]);

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
function tocHTML(sections, extra = []){
  if (!sections || sections.length + extra.length < 3) return "";
  return `<div class="toc">${sections.map((s,i) => `<a class="chip" href="javascript:void(0)" data-jump="sec-${i}">${esc(s.h)}</a>`).join("")}${extra.map(([id,t]) => `<a class="chip on" href="javascript:void(0)" data-jump="${id}">${t}</a>`).join("")}</div>`;
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

function miraclesHTML(list, title, id, fem){
  if (!list) return "";
  return `<h3 class="sec" id="${id}">${title}</h3>` + (list.length ? `<div class="mir">${list.map((m,i) => `<div class="mir-item">
    <h4><span class="mir-n">${toAr(i+1)}</span>${esc(m.title)}${m.grade ? ` <span class="tag${/صحيح|حسن/.test(m.grade) ? " gold" : ""}">${esc(m.grade)}</span>` : ""}</h4>
    <p>${esc(m.text)}</p>${m.verses && m.verses.length ? `<div class="verses" data-refs='${JSON.stringify(m.verses)}'><div class="meta">جارٍ تحميل الآيات…</div></div>` : ""}
    ${(m.hadith || []).map(h => `<div class="hadith">«${esc(h.text).replace(/^«|»$/g,"")}»<small>${esc(h.source || "")}</small></div>`).join("")}
    ${m.source ? `<div class="meta">المصدر: ${esc(m.source)}</div>` : ""}</div>`).join("")}</div>`
    : `<p class="meta">لم نقف على كرامات خاصة مروية ${fem ? "عنها" : "عنه"} بأسانيد معتبرة، و${fem ? "فضائلها" : "فضائله"} الثابتة مذكورة أعلاه.</p>`);
}
function sourcesHTML(list){
  return list && list.length ? `<div class="box src"><h4>المصادر والمراجع</h4><ul class="lst">${list.map(x => `<li>${/^https?:/.test(x) ? `<a href="${esc(x)}" target="_blank" rel="noopener">${esc(x)}</a>` : esc(x)}</li>`).join("")}</ul></div>` : "";
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
const verseObserver = "IntersectionObserver" in window ? new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { verseObserver.unobserve(e.target); loadVerses(e.target); }
}), {rootMargin: "400px"}) : null;
function hydrateVerses(root){
  root.querySelectorAll(".verses[data-refs]").forEach(el => {
    const closed = el.closest("details:not([open])");
    if (closed && closed !== root) return;
    if (verseObserver) verseObserver.observe(el); else loadVerses(el);
  });
}
async function loadVerses(el){
  {
    if (el.dataset.done) return; el.dataset.done = 1;
    const refs = JSON.parse(el.dataset.refs).filter(r => r && SURAHS[r[0]-1] && r[1] >= 1 && r[1] <= SURAHS[r[0]-1][1]);
    // تجميع الآيات المتتالية من السورة نفسها في مقطع واحد
    const groups = [];
    refs.forEach(([s,a]) => {
      const g = groups[groups.length-1];
      if (g && g.s === s && a === g.to + 1) g.to = a; else groups.push({s, from:a, to:a});
    });
    // المقاطع الطويلة (كسورة كاملة) تُعرض رابطاً إلى القارئ بدل جلب عشرات الآيات
    const LONG = 12, long = groups.filter(g => g.to - g.from + 1 > LONG), short = groups.filter(g => g.to - g.from + 1 <= LONG);
    const longHTML = long.map(g => `<div class="verse" style="font-family:Tajawal;font-size:16px"><a class="chip on" href="#quran/${g.s}/${g.from}">📖 اقرأ ${g.from === 1 && g.to === SURAHS[g.s-1][1] ? "سورة " + sname(g.s) + " كاملة" : `سورة ${sname(g.s)}: ${toAr(g.from)}–${toAr(g.to)}`} ←</a></div>`).join("");
    groups.length = 0; groups.push(...short);
    try{
      const texts = await Promise.all(groups.map(g => Promise.all(
        Array.from({length: g.to - g.from + 1}, (_, i) => fetchAyah(g.s, g.from + i)))));
      el.innerHTML = groups.map((g, gi) => `<div class="verse">﴿${texts[gi].map((t, i) =>
        `${esc(t)} <span class="amark" style="width:28px;height:28px;min-width:28px;font-size:12px">${toAr(g.from+i)}</span>`).join(" ")}﴾
        <span class="ref"><a href="#quran/${g.s}/${g.from}">[${sname(g.s)}: ${toAr(g.from)}${g.to > g.from ? "–" + toAr(g.to) : ""}]</a></span></div>`).join("") + longHTML;
    }catch(e){
      el.innerHTML = `<div class="meta">تعذّر تحميل نص الآيات (يحتاج اتصالاً بالإنترنت). المراجع: ` +
        groups.map(g => `<a href="#quran/${g.s}/${g.from}">${sname(g.s)}: ${toAr(g.from)}${g.to > g.from ? "–" + toAr(g.to) : ""}</a>`).join("، ") + `</div>`;
    }
  }
}

/* ===== الرئيسية ===== */
function allIndex(){
  const out = [];
  D.prophets.forEach((p,i) => out.push({t:p.name, sub:"قصص الأنبياء", h:`prophets/${i}`, x:p.summary}));
  D.sahaba.forEach((p,i) => out.push({t:p.name, sub:"الصحابة", h:`sahaba/${i}`, x:p.summary}));
  D.sahabiyat.forEach((p,i) => out.push({t:p.name, sub:"الصحابيات", h:`sahabiyat/${i}`, x:p.summary}));
  D.ghazawat.forEach((g,i) => out.push({t:g.name, sub:"الغزوات", h:`ghazawat/${i}`, x:g.summary}));
  D.mujizat.categories.forEach(c => c.items.forEach(m => out.push({t:m.title, sub:"معجزات النبي ﷺ", h:"mujizat", x:m.text})));
  D.asma.names.forEach((n,i) => out.push({t:n.name, sub:"أسماء الله الحسنى", h:`asma/${i}`, x:n.meaning}));
  D.seerah.periods.forEach(p => p.events.forEach(e => out.push({t:e.title, sub:"السيرة النبوية", h:`seerah/${p.key}`, x:(e.text||[]).join(" ")})));
  D.adhkar.categories.forEach(c => out.push({t:c.name, sub:"الأذكار", h:`adhkar/${c.key}`, x:c.time || ""}));
  D.khutab.forEach((k,i) => out.push({t:k.title, sub:"خطب الجمعة", h:`khutab/${i}`, x:k.summary}));
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
    <div class="waqf"><b>🤲 وقفٌ لله تعالى</b>
      هذا العمل صدقةٌ جارية لوجه الله تعالى، يُتاح مجاناً للجميع بلا مقابل، <b style="display:inline;font-size:inherit">ولا أُبيح لأحدٍ بيعه</b> ولا التكسّب به.
      نرجو منكم الدعاء لصاحب العمل ولوالديه وأهله وللمسلمين بظهر الغيب، بالمغفرة والرحمة وأن يجعله في ميزان حسناتهم.
      <br><small class="meta">مرخّص بموجب <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.ar" target="_blank" rel="noopener">المشاع الإبداعي: نسب المصنف – غير تجاري (CC BY-NC 4.0)</a></small></div>
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
    ${opts.karamat && D.karamatIntro ? `<details class="acc"><summary>✨ ما هي الكرامة؟ معتقد أهل السنة في كرامات الأولياء</summary><div><p>${esc(D.karamatIntro)}</p></div></details>` : ""}
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
    <div class="lead">${esc(p.summary)}</div>${tocHTML(p.sections, p.miracles ? [["sec-mir","✨ المعجزات والآيات"]] : [])}
    ${sectionsHTML(p.sections)}${miraclesHTML(p.miracles, "✨ المعجزات والآيات التي أيّده الله بها", "sec-mir")}
    ${versesBox(p.verses)}${hadithBox(p.hadith)}${listBox("دروس وعبر", p.lessons)}${sourcesHTML(p.sources)}
    ${prevNext(D.prophets, i, "prophets", x => x.name)}</article>`;
}

function personView(base, data, i, honor, backName){
  const p = data[i]; if (!p) return go(base);
  $("#view").innerHTML = `<a class="back" href="#${base}">→ ${backName}</a><article class="art">
    <div class="art-head">${ILL.icons[base]}<div><h2 class="pg">${esc(p.name)} <small style="font-size:18px">${honor}</small></h2><div class="meta">${esc(p.kunya || "")}</div></div></div>
    ${factsHTML([["الاسم والنسب", p.full],["الوفاة", p.died],["التصنيف", (p.tags || [p.group]).join("، ")]])}
    <div class="lead">${esc(p.summary)}</div>${tocHTML(p.sections, p.karamat ? [["sec-kar","✨ الكرامات"]] : [])}
    ${sectionsHTML(p.sections)}${listBox("من فضائله" + (base === "sahabiyat" ? "ا" : ""), p.virtues)}
    ${miraclesHTML(p.karamat, "✨ الكرامات والبشارات", "sec-kar", base === "sahabiyat")}
    ${hadithBox(p.hadith)}${versesBox(p.verses, "آيات ذات صلة")}${sourcesHTML(p.sources)}
    ${prevNext(data, i, base, x => x.name)}</article>`;
}
const personCard = (base, honor) => (p,i) => `<a class="card" href="#${base}/${i}"><h3>${esc(p.name)} <small class="meta">${honor}</small></h3>
  <div class="meta">${esc(p.kunya || p.full || "")}</div><p style="margin-top:4px;font-size:15px">${esc(p.summary)}</p>
  <div>${(p.tags || [p.group]).map(t => `<span class="tag">${esc(t)}</span>`).join("")}<span class="tag">الوفاة: ${esc(p.died)}</span></div></a>`;

/* ===== خطب الجمعة ===== */
const KH_OPEN = "إِنَّ الْحَمْدَ لِلَّهِ، نَحْمَدُهُ وَنَسْتَعِينُهُ وَنَسْتَغْفِرُهُ، وَنَعُوذُ بِاللَّهِ مِنْ شُرُورِ أَنْفُسِنَا وَمِنْ سَيِّئَاتِ أَعْمَالِنَا، مَنْ يَهْدِهِ اللَّهُ فَلَا مُضِلَّ لَهُ، وَمَنْ يُضْلِلْ فَلَا هَادِيَ لَهُ، وَأَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ.";
const KH_AMMA = "أَمَّا بَعْدُ: فَإِنَّ خَيْرَ الْحَدِيثِ كِتَابُ اللَّهِ، وَخَيْرَ الْهَدْيِ هَدْيُ مُحَمَّدٍ ﷺ، وَشَرَّ الْأُمُورِ مُحْدَثَاتُهَا، وَكُلَّ بِدْعَةٍ ضَلَالَةٌ.";
const khBlocks = blocks => (blocks || []).map(b => {
  if (b.t === "h") return `<h4 class="kh-h">${esc(b.v)}</h4>`;
  if (b.t === "ayah") return `<div class="kh-ayah">${b.intro ? `<div class="meta">${esc(b.intro)}</div>` : ""}<div class="verses" data-refs='${JSON.stringify(b.refs)}'><div class="meta">جارٍ تحميل الآيات…</div></div></div>`;
  if (b.t === "hadith") return `<div class="hadith">«${esc(b.v).replace(/^«|»$/g,"")}»<small>${esc(b.source || "")}</small></div>`;
  return `<p>${esc(b.v)}</p>`;
}).join("");
function viewKhutab(i){
  const K = D.khutab;
  if (i !== undefined && K[i]){
    const k = K[i];
    $("#view").innerHTML = `<div class="no-print"><a class="back" href="#khutab">→ خطب الجمعة</a>
      <div class="bar"><button class="chip on" id="presBtn">🎤 وضع الخطيب</button><button class="chip" id="khDown">أ−</button><button class="chip" id="khUp">أ+</button><button class="chip" id="khPrint">🖨 طباعة</button></div></div>
      <article class="art khutba" id="khutba">
      <div class="meta">${esc(k.category)} · ${esc(k.duration || "")}</div><h2 class="pg">${esc(k.title)}</h2>
      <h3 class="sec">الخطبة الأولى</h3>
      <p class="kh-fixed">${KH_OPEN}</p>
      <div class="kh-ayah"><div class="verses" data-refs='[[3,102],[4,1],[33,70],[33,71]]'><div class="meta">جارٍ تحميل الآيات…</div></div></div>
      <p class="kh-fixed">${KH_AMMA}</p>
      ${khBlocks(k.first)}
      <p class="kh-fixed">أَقُولُ قَوْلِي هَذَا، وَأَسْتَغْفِرُ اللَّهَ لِي وَلَكُمْ، فَاسْتَغْفِرُوهُ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ.</p>
      <div class="kh-sit no-print">— يجلس الخطيب جلسة خفيفة —</div>
      <h3 class="sec">الخطبة الثانية</h3>
      <p class="kh-fixed">الْحَمْدُ لِلَّهِ وَكَفَى، وَالصَّلَاةُ وَالسَّلَامُ عَلَى عَبْدِهِ الَّذِي اصْطَفَى، وَأَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ. أَمَّا بَعْدُ:</p>
      ${khBlocks(k.second)}
      <p class="kh-fixed">ثُمَّ صَلُّوا وَسَلِّمُوا عَلَى مَنْ أَمَرَكُمُ اللَّهُ بِالصَّلَاةِ وَالسَّلَامِ عَلَيْهِ، فَقَالَ جَلَّ مِنْ قَائِلٍ:</p>
      <div class="kh-ayah"><div class="verses" data-refs='[[33,56]]'><div class="meta">جارٍ تحميل الآيات…</div></div></div>
      <p class="kh-fixed">اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، وَبَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ.</p>
      ${(k.dua || []).length ? `<div class="kh-dua">${k.dua.map(d => `<p>${esc(d)}</p>`).join("")}</div>` : ""}
      <p class="kh-fixed">عِبَادَ اللَّهِ:</p>
      <div class="kh-ayah"><div class="verses" data-refs='[[16,90]]'><div class="meta">جارٍ تحميل الآيات…</div></div></div>
      <p class="kh-fixed">فَاذْكُرُوا اللَّهَ الْعَظِيمَ يَذْكُرْكُمْ، وَاشْكُرُوهُ عَلَى نِعَمِهِ يَزِدْكُمْ، وَأَقِمِ الصَّلَاةَ.</p>
      <p class="meta no-print" style="margin-top:14px">خطبة الحاجة رواها أبو داود والترمذي والنسائي وابن ماجه من حديث ابن مسعود، و«أما بعد…» من حديث جابر في صحيح مسلم (867).</p>
      ${prevNext(K, i, "khutab", x => x.title)}</article>`;
    let fs = store.get("khsize", 20);
    const setFs = d => { fs = Math.min(40, Math.max(15, fs + d)); $("#khutba").style.setProperty("--khfs", fs + "px"); store.set("khsize", fs); };
    setFs(0);
    $("#khUp").onclick = () => setFs(2); $("#khDown").onclick = () => setFs(-2);
    $("#khPrint").onclick = () => { document.querySelectorAll("#khutba .verses").forEach(loadVerses); setTimeout(() => print(), 1200); };
    $("#presBtn").onclick = () => {
      const on = document.body.classList.toggle("presenter");
      $("#presBtn").textContent = on ? "✕ الخروج من وضع الخطيب" : "🎤 وضع الخطيب";
      if (on) { setFs(Math.max(0, 26 - fs)); if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); }
      else if (document.fullscreenElement) document.exitFullscreen();
    };
    return;
  }
  let cat = "all";
  const cats = [...new Set(K.map(k => k.category))];
  $("#view").innerHTML = `<h2 class="pg">خطب الجمعة</h2>
    <p class="intro">خطب كاملة جاهزة للإلقاء، تبدأ بخطبة الحاجة وتنتهي بالدعاء، والآيات تُعرض بنص المصحف. في صفحة الخطبة: «وضع الخطيب» لتكبير الخط وملء الشاشة، وزر الطباعة.</p>
    <div class="bar"><input class="search" id="khS" placeholder="ابحث عن موضوع خطبة…"></div>
    <div class="bar" id="khC"><button class="chip on" data-c="all">الكل (${toAr(K.length)})</button>${cats.map(c => `<button class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="grid" id="khL"></div>`;
  const render = () => {
    const q = norm($("#khS").value.trim());
    $("#khL").innerHTML = K.map((k,i) => ({k,i})).filter(({k}) => (cat === "all" || k.category === cat) && (!q || norm(k.title + k.summary).includes(q)))
      .map(({k,i}) => `<a class="card" href="#khutab/${i}"><div class="meta">${esc(k.category)}</div><h3>${esc(k.title)}</h3><p style="font-size:15px;margin-top:4px">${esc(k.summary)}</p></a>`).join("") || `<div class="empty">لا توجد نتائج</div>`;
  };
  $("#khS").oninput = render;
  $("#khC").onclick = e => { if (!e.target.dataset.c) return; cat = e.target.dataset.c; $("#khC").querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === e.target)); render(); };
  render();
}

/* ===== الأدعية ===== */
function viewDuas(tab){
  const A = D.duas; tab = tab || "quran";
  const copyBtn = t => `<button class="chip dua-copy" data-t="${esc(t)}">نسخ</button>`;
  let body = "";
  if (tab === "quran") body = `<p class="meta" style="margin-bottom:10px">أدعية وردت في القرآن الكريم على ألسنة الأنبياء والصالحين، والنص يُعرض من المصحف.</p>` +
    A.quran.map(d => `<div class="card dua"><h3>${esc(d.title)}</h3>${d.context ? `<div class="meta">${esc(d.context)}</div>` : ""}
      <div class="verses" data-refs='${JSON.stringify(d.refs)}'><div class="meta">جارٍ تحميل الآيات…</div></div></div>`).join("");
  else if (tab === "adab") body = acc("آداب الدعاء", A.adab, true) + acc("أوقات وأحوال يُرجى فيها الإجابة", A.times, true);
  else {
    const c = A.sunnah.find(x => x.cat === tab) || A.sunnah[0];
    body = `<h3 class="sec" style="margin-top:0">${esc(c.cat)}</h3>` + c.items.map(d => `<div class="card dua"><div class="dh-text">${esc(d.text)}</div>
      ${d.note ? `<p class="meta">${esc(d.note)}</p>` : ""}<div class="dh-foot"><small class="meta">${esc(d.source || "")}${d.grade ? " · " + esc(d.grade) : ""}</small>${copyBtn(d.text)}</div></div>`).join("");
  }
  $("#view").innerHTML = `<h2 class="pg">الأدعية من القرآن والسنة</h2><div class="lead">${esc(A.intro)}</div>
    <div class="bar"><a class="chip${tab==="quran"?" on":""}" href="#duas/quran">📖 من القرآن (${toAr(A.quran.length)})</a>
      ${A.sunnah.map(c => `<a class="chip${tab===c.cat?" on":""}" href="#duas/${encodeURIComponent(c.cat)}">${esc(c.cat)}</a>`).join("")}
      <a class="chip${tab==="adab"?" on":""}" href="#duas/adab">آداب الدعاء وأوقات الإجابة</a></div>
    <div id="duaL">${body}</div>${sourcesHTML(A.sources)}`;
  $("#duaL").onclick = e => { const b = e.target.closest(".dua-copy"); if (b && navigator.clipboard) navigator.clipboard.writeText(b.dataset.t).then(() => { b.textContent = "تم ✓"; setTimeout(() => b.textContent = "نسخ", 1500); }); };
}

/* ===== الحج والعمرة ===== */
function viewHajj(){
  const H = D.hajj;
  const stepCard = (s, i) => `<div class="card step"><span class="n">${toAr(i+1)}</span><div style="color:var(--pri)">${ILL.icons[s.icon] || ILL.icons.tawaf}</div>
    <h4>${esc(s.title)}</h4><p>${esc(s.text)}</p>${s.say ? `<div class="say">${esc(s.say)}</div>` : ""}${s.verses && s.verses.length ? versesBox(s.verses, "") : ""}</div>`;
  const table2 = (title, obj) => obj ? `<h3 class="sec">${title}</h3><div class="hj2"><div class="box"><h4>في الحج</h4><ul class="lst">${(obj.hajj||[]).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="box"><h4>في العمرة</h4><ul class="lst">${(obj.umrah||[]).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>` : "";
  $("#view").innerHTML = `<article class="art"><div class="art-head">${ILL.icons.tawaf}<h2 class="pg">صفة الحج والعمرة</h2></div>
    <div class="lead">${esc(H.intro)}</div>${versesBox(H.verses)}${hadithBox(H.hadith)}
    <div class="toc">${[["hj-types","أنواع النسك"],["hj-miqat","المواقيت"],["hj-ihram","الإحرام"],["hj-umrah","صفة العمرة"],["hj-days","صفة الحج يوماً بيوم"],["hj-arkan","الأركان والواجبات"],["hj-mistakes","أخطاء شائعة"]].map(([id,t]) => `<a class="chip" href="javascript:void(0)" data-jump="${id}">${t}</a>`).join("")}</div>
    <h3 class="sec" id="hj-types">أنواع النسك</h3>
    <div class="grid">${(H.types||[]).map(t => `<div class="card"><h3>${esc(t.name)}</h3><p style="font-size:15px">${esc(t.text)}</p>${t.hady ? `<span class="tag gold">الهدي: ${esc(t.hady)}</span>` : ""}</div>`).join("")}</div>
    <h3 class="sec" id="hj-miqat">المواقيت المكانية</h3>
    <div style="overflow-x:auto"><table class="tb"><tr><th>الميقات</th><th>لمن</th><th>المسافة</th></tr>${(H.mawaqit||[]).map(m => `<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.for)}</td><td>${esc(m.distance || "")}</td></tr>`).join("")}</table></div>
    <h3 class="sec" id="hj-ihram">الإحرام</h3>${H.ihram ? `<p>${esc(H.ihram.text)}</p><ul class="lst">${(H.ihram.steps||[]).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="box"><h4>التلبية</h4><div class="say">${esc(H.ihram.talbiyah)}</div><small class="meta">${esc(H.ihram.talbiyahSource || "")}</small></div>` : ""}
    ${acc("محظورات الإحرام", H.mahzurat, false)}
    <h3 class="sec" id="hj-umrah">صفة العمرة خطوة بخطوة</h3><div class="steps">${(H.umrah||[]).map(stepCard).join("")}</div>
    <h3 class="sec" id="hj-days">صفة الحج يوماً بيوم</h3>
    <div class="timeline">${(H.hajj||[]).map((d,i) => `<div class="tl gold" data-n="${toAr(i+1)}"><div class="card"><div class="art-head" style="margin:0"><span style="color:var(--pri)">${ILL.icons[d.icon] || ""}</span><div><div class="meta">${esc(d.day)}</div><h3>${esc(d.name)}</h3></div></div>
      <p style="margin-top:6px">${esc(d.text || "")}</p>${d.steps && d.steps.length ? `<ul class="lst">${d.steps.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${(d.hadith||[]).map(h => `<div class="hadith">«${esc(h.text).replace(/^«|»$/g,"")}»<small>${esc(h.source || "")}</small></div>`).join("")}
      ${d.verses && d.verses.length ? versesBox(d.verses, "") : ""}</div></div>`).join("")}</div>
    <div id="hj-arkan">${table2("أركان النسك", H.arkan)}${table2("واجبات النسك", H.wajibat)}</div>
    ${acc("سنن الحج والعمرة", H.sunan)}${acc("أحكام خاصة بالمرأة", H.women)}
    <h3 class="sec" id="hj-mistakes">أخطاء شائعة ينبغي تجنبها</h3><ul class="lst">${(H.mistakes||[]).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    ${H.madinah ? acc("زيارة المسجد النبوي", H.madinah.steps, false, H.madinah.text) : ""}
    ${sourcesHTML(H.sources)}</article>`;
}

/* ===== السيرة النبوية ===== */
function viewSeerah(key){
  const S = D.seerah;
  const gIndex = name => D.ghazawat.findIndex(g => g.name === name);
  $("#view").innerHTML = `<article class="art"><div class="art-head">${ILL.icons.seerah}<h2 class="pg">السيرة النبوية</h2></div>
    <div class="lead">${esc(S.intro)}</div>
    <div class="toc">${S.periods.map(p => `<a class="chip" href="javascript:void(0)" data-jump="per-${p.key}">${esc(p.name)}</a>`).join("")}${S.shamail ? `<a class="chip on" href="javascript:void(0)" data-jump="per-shamail">${esc(S.shamail.name)}</a>` : ""}</div>
    ${S.periods.map(p => `<h3 class="sec" id="per-${p.key}">${esc(p.name)}${p.range ? ` <small class="meta">(${esc(p.range)})</small>` : ""}</h3>
      <div class="timeline">${p.events.map((e,i) => { const gi = e.ghazwa ? gIndex(e.ghazwa) : -1; return `<div class="tl${gi >= 0 ? " gold" : ""}" data-n="${toAr(i+1)}"><details class="acc ev"><summary><span class="meta" style="display:block;font-weight:500">${esc(e.date)}</span>${esc(e.title)}</summary><div>
        ${(Array.isArray(e.text) ? e.text : [e.text]).map(t => `<p>${esc(t)}</p>`).join("")}
        ${e.verses && e.verses.length ? versesBox(e.verses, "") : ""}
        ${(e.hadith || []).map(h => `<div class="hadith">«${esc(h.text).replace(/^«|»$/g,"")}»<small>${esc(h.source || "")}</small></div>`).join("")}
        ${gi >= 0 ? `<p><a class="chip on" href="#ghazawat/${gi}">اقرأ تفاصيل ${esc(e.ghazwa)} ←</a></p>` : ""}</div></details></div>`; }).join("")}</div>`).join("")}
    ${S.shamail ? `<h3 class="sec" id="per-shamail">${esc(S.shamail.name)}</h3>${sectionsHTML(S.shamail.sections)}` : ""}
    ${sourcesHTML(S.sources)}</article>`;
  document.querySelectorAll("details.acc").forEach(d => d.addEventListener("toggle", () => d.open && hydrateVerses(d), {once:true}));
  if (key) setTimeout(() => { const t = document.getElementById("per-" + key); if (t) t.scrollIntoView({block:"start"}); }, 0);
}

/* ===== أسماء الله الحسنى ===== */
function viewAsma(idx){
  const A = D.asma;
  $("#view").innerHTML = `<h2 class="pg">أسماء الله الحسنى</h2><div class="lead">${esc(A.intro)}</div>
    ${hadithBox(A.hadith, "الدليل")}${A.note ? `<div class="note">${esc(A.note)}</div>` : ""}
    <div class="bar"><input class="search" id="asmaS" placeholder="ابحث عن اسم أو معنى…"></div>
    <div class="asma-grid" id="asmaL"></div>${sourcesHTML(A.sources)}`;
  const render = () => {
    const q = norm($("#asmaS").value.trim());
    $("#asmaL").innerHTML = A.names.map((n,i) => ({n,i})).filter(({n}) => !q || norm(n.name + n.meaning + n.explanation).includes(q))
      .map(({n,i}) => `<details class="acc asma" id="asma-${i}"><summary><span class="asma-n">${toAr(i+1)}</span><span class="asma-name">${esc(n.name)}</span><span class="meta asma-m">${esc(n.meaning)}</span></summary><div>
        <p>${esc(n.explanation)}</p>${n.verses && n.verses.length ? versesBox(n.verses, "من القرآن الكريم") : ""}
        ${n.effect ? `<div class="note"><b>أثره في القلب والسلوك:</b> ${esc(n.effect)}</div>` : ""}</div></details>`).join("") || `<div class="empty">لا توجد نتائج</div>`;
    document.querySelectorAll("details.asma").forEach(d => d.addEventListener("toggle", () => d.open && hydrateVerses(d), {once:true}));
  };
  $("#asmaS").oninput = render; render();
  if (idx !== undefined && A.names[idx]) { const d = document.getElementById("asma-" + idx); d.open = true; setTimeout(() => d.scrollIntoView({block:"center"}), 0); }
}

/* ===== الأذكار ===== */
const todayKey = () => "adhkar-" + new Date().toISOString().slice(0,10);
function viewAdhkar(key){
  const A = D.adhkar;
  const cat = A.categories.find(c => c.key === key) || A.categories[0];
  const prog = store.get(todayKey(), {});
  $("#view").innerHTML = `<h2 class="pg">الأذكار</h2><p class="intro">${esc(A.intro)}</p>
    <div class="bar">${A.categories.map(c => `<a class="chip${c === cat ? " on" : ""}" href="#adhkar/${c.key}">${esc(c.name)}</a>`).join("")}</div>
    <h3 class="sec" style="font-size:22px;color:var(--pri);border-right:4px solid var(--gold);padding-right:12px">${esc(cat.name)}</h3>
    ${cat.time ? `<p class="meta" style="margin-bottom:10px">${esc(cat.time)}</p>` : ""}
    <div class="bar"><span class="meta" id="dhDone"></span><button class="chip" id="dhReset">↺ إعادة العدّ</button></div>
    <div id="dhL">${cat.items.map((d,i) => { const k = cat.key + i, left = prog[k] ?? d.count ?? 1; return `<div class="card dhikr${left <= 0 ? " done" : ""}" data-k="${k}" data-c="${d.count || 1}">
      ${d.quran ? `<div class="say" style="background:none;padding:0">${esc(d.text)}</div>${versesBox(d.verses, "")}` : `<div class="dh-text">${esc(d.text)}</div>`}
      ${d.virtue ? `<p class="meta" style="margin-top:6px">✨ ${esc(d.virtue)}</p>` : ""}
      <div class="dh-foot"><small class="meta">${esc(d.source || "")}${d.grade ? " · " + esc(d.grade) : ""}</small>
        <button class="dh-count" data-k="${k}">${left <= 0 ? "✓" : toAr(left)}</button></div></div>`; }).join("")}</div>
    ${sourcesHTML(A.sources)}`;
  const upd = () => { const all = document.querySelectorAll(".dhikr").length, done = document.querySelectorAll(".dhikr.done").length; $("#dhDone").textContent = `أنجزت ${toAr(done)} من ${toAr(all)}`; };
  $("#dhL").onclick = e => {
    const b = e.target.closest(".dh-count"); if (!b) return;
    const card = b.closest(".dhikr"), k = b.dataset.k, p = store.get(todayKey(), {});
    const left = Math.max(0, (p[k] ?? +card.dataset.c) - 1); p[k] = left; store.set(todayKey(), p);
    b.textContent = left <= 0 ? "✓" : toAr(left); card.classList.toggle("done", left <= 0);
    if (navigator.vibrate) navigator.vibrate(15);
    if (left <= 0) { const nx = card.nextElementSibling; if (nx) nx.scrollIntoView({behavior:"smooth", block:"center"}); }
    upd();
  };
  $("#dhReset").onclick = () => { const p = store.get(todayKey(), {}); Object.keys(p).filter(k => k.startsWith(cat.key)).forEach(k => delete p[k]); store.set(todayKey(), p); viewAdhkar(cat.key); hydrateVerses($("#view")); };
  upd();
}

/* ===== معجزات النبي ﷺ ===== */
function viewMujizat(){
  const M = D.mujizat;
  if (!M.categories.length) { $("#view").innerHTML = `<div class="empty">المحتوى غير متوفر</div>`; return; }
  $("#view").innerHTML = `<article class="art"><div class="art-head">${ILL.icons.sawm}<h2 class="pg">معجزات النبي ﷺ ودلائل نبوته</h2></div>
    <div class="lead">${esc(M.intro)}</div>
    <div class="toc">${M.categories.map(c => `<a class="chip" href="javascript:void(0)" data-jump="cat-${c.key}">${esc(c.name)} (${toAr(c.items.length)})</a>`).join("")}</div>
    ${M.categories.map(c => `<h3 class="sec" id="cat-${c.key}">${esc(c.name)}</h3>
      ${c.items.map(m => `<details class="acc"><summary>${esc(m.title)}${m.grade ? ` <span class="tag${/صحيح|حسن/.test(m.grade) ? " gold" : ""}">${esc(m.grade)}</span>` : ""}</summary><div>
        <p>${esc(m.text)}</p>${m.verses && m.verses.length ? versesBox(m.verses, "") : ""}
        ${(m.hadith || []).map(h => `<div class="hadith">«${esc(h.text).replace(/^«|»$/g,"")}»<small>${esc(h.source || "")}</small></div>`).join("")}</div></details>`).join("")}`).join("")}
    ${sourcesHTML(M.sources)}</article>`;
  // الآيات داخل البنود المطوية تُحمَّل عند فتحها
  document.querySelectorAll("details.acc").forEach(d => d.addEventListener("toggle", () => d.open && hydrateVerses(d), {once:true}));
}

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

/* صور خطوات الوضوء والصلاة (img/)، ويُستخدم الرسم المتجهي بديلاً لأي خطوة بلا صورة */
const WUDU_IMG = {niyyah:1, hands:2, mouth:3, nose:3, face:4, arms:4, head:5, ears:5, feet:6, dua:1};
const POSE_IMG = {takbir:1, takbeer:1, qiyam:2, ruku:3, itidal:4, sujud:5, julus:6, tashahhud:8, taslim:8};
const stepImg = (src, alt) => `<img class="stepimg" src="${src}" alt="${esc(alt)}" loading="lazy">`;
const wuduPic = s => WUDU_IMG[s.key] ? stepImg(`img/wudu-${WUDU_IMG[s.key]}.jpg`, s.title) : ILL.wudu(s.key);
const posePic = s => POSE_IMG[s.pose] ? stepImg(`img/salah-${POSE_IMG[s.pose]}.jpg`, s.title) : ILL.pose(s.pose);

/* ===== الوضوء ===== */
function viewWudu(){
  const W = D.wudu; if (!W) { $("#view").innerHTML = `<div class="empty">المحتوى غير متوفر</div>`; return; }
  $("#view").innerHTML = `<article class="art"><div class="art-head">${ILL.icons.wudu}<h2 class="pg">الوضوء</h2></div>
    <div class="lead">${esc(W.intro)}</div>${versesBox(W.verses, "آية الوضوء")}${hadithBox(W.virtues, "فضل الوضوء")}
    <h3 class="sec">صفة الوضوء خطوة بخطوة</h3>
    <figure class="card" style="margin-bottom:14px"><img src="img/wudu-steps.jpg" alt="خطوات الوضوء" style="width:100%;border-radius:12px;display:block" loading="lazy">
      <figcaption class="meta" style="text-align:center;margin-top:6px">ملخّص خطوات الوضوء</figcaption></figure>
    <p class="meta">الشارة الذهبية تعني أن الخطوة من فروض الوضوء، والبقية من سننه.</p>
    <div class="steps">${W.steps.map((s,i) => `<div class="card step"><span class="n">${toAr(i+1)}</span>${wuduPic(s)}
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
    <p class="meta">الصور توضيحية لهيئة المصلي في كل خطوة.</p>
    <div class="steps">${S.steps.map((s,i) => `<div class="card step"><span class="n">${toAr(i+1)}</span>${posePic(s)}
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

/* القرّاء: من واجهة alquran.cloud، والمصحف المعلّم للحصري من everyayah.com (الآية بصوت الشيخ ثم فراغ لترديدها) */
const pad3 = n => String(n).padStart(3, "0");
const RECITERS = [
  {id:"ar.husary", name:"محمود خليل الحصري — مرتّل"},
  {id:"husary_muallim", name:"الحصري — المصحف المعلّم (للتحفيظ)", url:(s,a) => `https://everyayah.com/data/Husary_Muallim_128kbps/${pad3(s)}${pad3(a)}.mp3`},
  {id:"ar.husarymujawwad", name:"الحصري — مجوّد"},
  {id:"ar.minshawi", name:"محمد صديق المنشاوي — مرتّل"},
  {id:"ar.minshawimujawwad", name:"المنشاوي — مجوّد"},
  {id:"ar.abdulbasitmurattal", name:"عبد الباسط عبد الصمد — مرتّل"},
  {id:"ar.alafasy", name:"مشاري راشد العفاسي"},
  {id:"ar.mahermuaiqly", name:"ماهر المعيقلي"},
  {id:"ar.abdurrahmaansudais", name:"عبد الرحمن السديس"},
  {id:"ar.saoodshuraym", name:"سعود الشريم"}
];
const reciter = () => RECITERS.find(r => r.id === store.get("reciter", "ar.husary")) || RECITERS[0];

let current = 0, audioList = [], playIdx = -1, continuous = false, fontSize = store.get("qsize", 26);
let memo = null; // خطة التحفيظ الجارية
const audio = new Audio();
document.documentElement.style.setProperty("--qsize", fontSize + "px");

async function viewSurah(n, focusAyah){
  if (!SURAHS[n-1]) return go("quran");
  stopAudio(); current = n;
  store.set("last", {n, a: focusAyah || 1});
  const [name, cnt, type] = SURAHS[n-1];
  const tafsir = store.get("tafsir", "ar.muyassar");
  const rec = reciter(), M = store.get("memo", {rep:3, range:1, gap:2, speed:1});
  const opt = (vals, cur, fmt = v => toAr(v)) => vals.map(v => `<option value="${v}"${v == cur ? " selected" : ""}>${fmt(v)}</option>`).join("");
  $("#view").innerHTML = `<div class="rtop"><a href="#quran">→ الفهرس</a>
      <select id="tafsirSel" title="التفسير">${TAFSIRS.map(([id,nm]) => `<option value="${id}"${id===tafsir?" selected":""}>${nm}</option>`).join("")}</select>
      <select id="recSel" title="القارئ">${RECITERS.map(r => `<option value="${r.id}"${r.id===rec.id?" selected":""}>🎙 ${r.name}</option>`).join("")}</select>
      <button id="toggleTafsir">إخفاء التفسير</button><button id="fontDown" title="تصغير الخط">أ−</button><button id="fontUp" title="تكبير الخط">أ+</button>
      <button id="playAll">▶ تلاوة السورة</button></div>
    <details class="acc memo-box" id="memoBox"><summary>📖 وضع التحفيظ: تكرار الآيات والمقاطع</summary><div>
      <div class="memo-grid">
        <label>من الآية <input type="number" id="mFrom" min="1" max="${cnt}" value="${focusAyah || 1}"></label>
        <label>إلى الآية <input type="number" id="mTo" min="1" max="${cnt}" value="${Math.min(cnt, (focusAyah || 1) + 4)}"></label>
        <label>تكرار كل آية <select id="mRep">${opt([1,2,3,5,7,10,20], M.rep, v => toAr(v) + " مرات")}</select></label>
        <label>تكرار المقطع كاملاً <select id="mRange">${opt([1,2,3,5,10,0], M.range, v => v ? toAr(v) + " مرات" : "بلا توقف")}</select></label>
        <label>مهلة للترديد بعد كل آية <select id="mGap">${opt([0,1,2,3,5,8,12], M.gap, v => toAr(v) + " ث")}</select></label>
        <label>سرعة التلاوة <select id="mSpeed">${opt([0.75,1,1.25], M.speed, v => ({0.75:"أبطأ",1:"عادية",1.25:"أسرع"})[v])}</select></label>
      </div>
      <label class="memo-hide"><input type="checkbox" id="mHide"> إخفاء نص الآيات لاختبار الحفظ (اضغط على الآية لإظهارها)</label>
      <div class="bar" style="margin:10px 0 0"><button class="chip on" id="mStart">▶ ابدأ التحفيظ</button><span class="meta" id="mStatus"></span></div>
      <p class="meta" style="margin-top:6px">نصيحة: اختر «الحصري — المصحف المعلّم» ليقرأ الشيخ الآية ثم يترك لك وقتاً لترديدها.</p>
    </div></details>
    <div id="audioErr" class="note err" hidden></div>
    <div id="readerBody"><div class="stitle">سورة ${name}</div><p class="meta" style="text-align:center">${type} · ${toAr(cnt)} آية</p><div class="status">جارٍ تحميل السورة والتفسير…</div></div>`;
  $("#tafsirSel").onchange = e => { store.set("tafsir", e.target.value); viewSurah(n); };
  $("#recSel").onchange = e => { store.set("reciter", e.target.value); viewSurah(n, playIdx >= 0 ? playIdx + 1 : focusAyah); };
  $("#toggleTafsir").onclick = () => { const h = $("#readerBody").classList.toggle("hide-tafsir"); $("#toggleTafsir").textContent = h ? "إظهار التفسير" : "إخفاء التفسير"; };
  $("#fontUp").onclick = () => setFont(2); $("#fontDown").onclick = () => setFont(-2);
  $("#playAll").onclick = () => playIdx >= 0 ? stopAudio() : playFrom(0, true);
  $("#mHide").onchange = e => $("#readerBody").classList.toggle("memo-hidden", e.target.checked);
  $("#mStart").onclick = () => memo ? stopAudio() : startMemo(cnt);
  if (store.get("memoOpen", false)) $("#memoBox").open = true;
  $("#memoBox").ontoggle = e => store.set("memoOpen", e.target.open);
  try{
    const eds = `quran-uthmani,${tafsir}` + (rec.url ? "" : `,${rec.id}`);
    const j = await (await fetch(`${API}/surah/${n}/editions/${eds}`)).json();
    if (j.code !== 200) throw new Error("API");
    if (current !== n || !$("#readerBody")) return;
    const [qur, taf, aud] = j.data;
    audioList = rec.url ? qur.ayahs.map(a => rec.url(n, a.numberInSurah)) : aud.ayahs.map(a => a.audio);
    const body = $("#readerBody");
    body.innerHTML = `<div class="stitle">سورة ${name}</div><p class="meta" style="text-align:center">${type} · ${toAr(cnt)} آية · ${esc(taf.name)} · ${rec.name}</p>
      ${n !== 1 && n !== 9 ? `<div class="basmala">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>` : ""}
      ${qur.ayahs.map((a,i) => `<div class="ayah" id="ayah-${a.numberInSurah}">
        <div class="atext" data-reveal="1">${esc(stripBasmala(a.text, n, a.numberInSurah))}<span class="amark">${toAr(a.numberInSurah)}</span></div>
        <div class="atools"><button data-play="${i}">▶ استماع</button><button data-memo="${i}">🔁 حفظ هذه الآية</button><button data-copy="${i}">نسخ</button></div>
        <div class="tafsir">${esc(taf.ayahs[i].text)}</div></div>`).join("")}
      <div class="pn">${n < 114 ? `<a href="#quran/${n+1}">← السورة التالية: ${sname(n+1)}</a>` : "<span></span>"}
        ${n > 1 ? `<a href="#quran/${n-1}">السورة السابقة: ${sname(n-1)} →</a>` : "<span></span>"}</div>`;
    if ($("#mHide").checked) body.classList.add("memo-hidden");
    body.onclick = e => {
      const t = e.target;
      const at = t.closest(".atext");
      if (at && body.classList.contains("memo-hidden")) { at.closest(".ayah").classList.toggle("reveal"); return; }
      if (t.dataset.play !== undefined) playFrom(+t.dataset.play, false);
      else if (t.dataset.memo !== undefined) {
        $("#mFrom").value = $("#mTo").value = +t.dataset.memo + 1;
        $("#memoBox").open = true; startMemo(cnt);
      }
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

function highlight(i, scroll){
  document.querySelectorAll(".ayah.playing").forEach(x => x.classList.remove("playing"));
  const el = document.getElementById("ayah-" + (i+1));
  if (el) { el.classList.add("playing"); if (scroll) el.scrollIntoView({block:"center", behavior:"smooth"}); }
}
function playAyah(i){
  playIdx = i;
  store.set("last", {n: current, a: i+1});
  if ($("#audioErr")) $("#audioErr").hidden = true;
  audio.src = audioList[i];
  audio.playbackRate = memo ? memo.speed : 1;
  audio.play().catch(() => {});
}
function playFrom(i, cont){
  memo = null; clearTimeout(memoTimer); continuous = cont;
  if (i >= audioList.length) { stopAudio(); return; }
  highlight(i, cont); playAyah(i);
  if ($("#playAll")) $("#playAll").textContent = "■ إيقاف التلاوة";
  if ($("#mStart")) $("#mStart").textContent = "▶ ابدأ التحفيظ";
}
function stopAudio(){
  audio.pause(); playIdx = -1; continuous = false; memo = null; clearTimeout(memoTimer);
  document.querySelectorAll(".ayah.playing").forEach(x => x.classList.remove("playing"));
  if ($("#playAll")) $("#playAll").textContent = "▶ تلاوة السورة";
  if ($("#mStart")) $("#mStart").textContent = "▶ ابدأ التحفيظ";
  if ($("#mStatus")) $("#mStatus").textContent = "";
}

/* وضع التحفيظ: كل آية تُكرر rep مرات مع مهلة للترديد، ثم المقطع كله يُكرر range مرات (0 = بلا توقف) */
let memoTimer = null;
function startMemo(cnt){
  const from = Math.max(1, Math.min(cnt, +$("#mFrom").value || 1));
  const to = Math.max(from, Math.min(cnt, +$("#mTo").value || from));
  const cfg = {rep:+$("#mRep").value, range:+$("#mRange").value, gap:+$("#mGap").value, speed:+$("#mSpeed").value};
  store.set("memo", cfg);
  if (!audioList.length) return;
  audio.pause(); clearTimeout(memoTimer); continuous = false;
  memo = {...cfg, from: from-1, to: to-1, i: from-1, r: 1, round: 1};
  $("#mStart").textContent = "■ إيقاف التحفيظ";
  if ($("#playAll")) $("#playAll").textContent = "▶ تلاوة السورة";
  memoPlay();
}
function memoPlay(){
  if (!memo) return;
  highlight(memo.i, true);
  $("#mStatus").textContent = `الآية ${toAr(memo.i+1)} · التكرار ${toAr(memo.r)}/${toAr(memo.rep)} · الجولة ${toAr(memo.round)}${memo.range ? "/" + toAr(memo.range) : ""}`;
  playAyah(memo.i);
}
function memoNext(){
  if (!memo) return;
  if (memo.r < memo.rep) memo.r++;
  else if (memo.i < memo.to) { memo.i++; memo.r = 1; }
  else if (!memo.range || memo.round < memo.range) { memo.round++; memo.i = memo.from; memo.r = 1; }
  else { stopAudio(); if ($("#mStatus")) $("#mStatus").textContent = "✓ انتهى التحفيظ، بارك الله فيك"; return; }
  memoTimer = setTimeout(memoPlay, memo.gap * 1000);
}
audio.onended = () => memo ? memoNext() : continuous ? playFrom(playIdx + 1, true) : stopAudio();
audio.onerror = () => {
  if (playIdx < 0 || !$("#audioErr")) return;
  $("#audioErr").hidden = false;
  $("#audioErr").textContent = "تعذّر تشغيل التلاوة بهذا الصوت. تأكد من الاتصال بالإنترنت أو اختر قارئاً آخر.";
};

/* ===== التوجيه ===== */
function go(h){ location.hash = h; }
function route(){
  const [sec = "home", a, b] = location.hash.replace(/^#/, "").split("/").map(decodeURIComponent);
  const id = SECTIONS.some(s => s.id === sec) ? sec : "home";
  if (id !== "quran") stopAudio();
  document.body.classList.remove("presenter");
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
      : viewList("sahaba", D.sahaba, {intro:"سِيَر أعلام الصحابة رضي الله عنهم. اضغط على أي صحابي لقراءة سيرته كاملة.", tags:p => p.tags || [], karamat:true, card:personCard("sahaba","رضي الله عنه")}); break;
    case "sahabiyat": n !== null ? personView("sahabiyat", D.sahabiyat, n, "رضي الله عنها", "الصحابيات")
      : viewList("sahabiyat", D.sahabiyat, {intro:"سِيَر أمهات المؤمنين وبنات النبي ﷺ وأعلام الصحابيات رضي الله عنهن.", tags:p => [p.group], karamat:true, card:personCard("sahabiyat","رضي الله عنها")}); break;
    case "mujizat": viewMujizat(); break;
    case "seerah": viewSeerah(a); break;
    case "khutab": viewKhutab(n !== null && !isNaN(n) ? n : undefined); break;
    case "duas": viewDuas(a); break;
    case "hajj": viewHajj(); break;
    case "asma": viewAsma(n !== null && !isNaN(n) ? n : undefined); break;
    case "adhkar": viewAdhkar(a); break;
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
