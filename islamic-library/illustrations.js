/* رسوم توضيحية (SVG) مرسومة بالكود: أوضاع الصلاة، خطوات الوضوء، أيقونات الأركان، وخريطة الغزوات.
   تستخدم currentColor ومتغيرات CSS لتعمل في الوضعين الفاتح والداكن. */

const ILL = (() => {
  const S = 'stroke="var(--fig)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  const head = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="var(--fig)"/>`;
  const line = pts => `<polyline points="${pts}" ${S}/>`;
  const ground = `<line x1="4" y1="131" x2="116" y2="131" stroke="var(--line)" stroke-width="3"/>
    <rect x="10" y="129" width="100" height="4" rx="2" fill="var(--gold)" opacity=".45"/>`;
  // مكعب صغير يرمز لاتجاه القبلة (الشخص يتجه يساراً)
  const qibla = `<g transform="translate(6,8)"><rect width="14" height="14" rx="1.5" fill="var(--ink)"/>
    <rect y="4" width="14" height="2.5" fill="var(--gold)"/></g>`;

  const poses = {
    qiyam: head(58, 20) + line("58,32 58,76") + line("58,76 60,102 58,127 48,127") + line("58,76 62,102 62,127 52,127")
      + line("58,38 66,56 50,52") + line("58,38 62,58 48,54"),
    takbir: head(58, 20) + line("58,32 58,76") + line("58,76 60,102 58,127 48,127") + line("58,76 62,102 62,127 52,127")
      + line("58,38 50,48 46,24") + line("58,38 56,50 52,26"),
    itidal: head(58, 20) + line("58,32 58,76") + line("58,76 60,102 58,127 48,127") + line("58,76 62,102 62,127 52,127")
      + line("58,38 62,58 60,76") + line("58,38 58,58 56,76"),
    ruku: head(26, 70) + line("38,72 76,72") + line("76,72 76,100 76,127 66,127") + line("76,72 78,100 80,127 70,127")
      + line("42,74 58,88 72,100") + line("44,74 62,90 76,101"),
    sujud: head(24, 119) + line("36,112 76,86") + line("76,86 70,124") + line("70,124 96,126 100,118")
      + line("40,110 52,118 36,127") + line("44,108 58,116 44,127"),
    julus: head(66, 56) + line("66,68 70,110") + line("70,110 40,118 36,126 80,126")
      + line("66,74 60,96 46,108"),
    tashahhud: head(66, 56) + line("66,68 70,110") + line("70,110 40,118 36,126 80,126")
      + line("66,74 60,96 46,108") + `<line x1="45" y1="106" x2="40" y2="96" stroke="var(--gold)" stroke-width="4" stroke-linecap="round"/>`,
    taslim: head(66, 56) + line("66,68 70,110") + line("70,110 40,118 36,126 80,126")
      + line("66,74 60,96 46,108")
      + `<path d="M80 44 q10 12 0 24" stroke="var(--gold)" stroke-width="3" fill="none" stroke-linecap="round"/>
         <path d="M52 44 q-10 12 0 24" stroke="var(--gold)" stroke-width="3" fill="none" stroke-linecap="round"/>
         <polygon points="78,68 84,66 80,62" fill="var(--gold)"/><polygon points="54,68 48,66 52,62" fill="var(--gold)"/>`
  };
  poses.takbeer = poses.takbir;

  function pose(key){
    const body = poses[key] || poses.qiyam;
    return `<svg viewBox="0 0 120 140" class="ill" role="img" aria-label="وضع ${key}">${qibla}${ground}${body}</svg>`;
  }

  /* ===== الوضوء: شكل أمامي مع تظليل العضو المقصود ===== */
  const WUDU_PARTS = {
    niyyah: ["heart"], hands: ["hands"], mouth: ["mouth"], nose: ["nose"], face: ["face", "nose", "mouth"],
    arms: ["forearms", "hands"], head: ["cap"], ears: ["ears"], feet: ["feet"], dua: ["finger"]
  };
  function wudu(step){
    const on = new Set(WUDU_PARTS[step] || []);
    const f = p => on.has(p) ? 'fill="var(--water)" stroke="var(--water-2)"' : 'fill="var(--skin)" stroke="var(--line)"';
    const drops = on.size ? `<g fill="var(--water)" opacity=".85">
      <path d="M98 20 q5 8 0 12 q-5 -4 0 -12z"/><path d="M106 34 q4 6 0 9 q-4 -3 0 -9z"/><path d="M14 26 q4 6 0 9 q-4 -3 0 -9z"/></g>` : "";
    return `<svg viewBox="0 0 120 170" class="ill" role="img" aria-label="خطوة الوضوء">
      <g stroke-width="2">
        <ellipse cx="60" cy="32" rx="17" ry="21" ${f("face")}/>
        <path d="M43 28 q2 -20 17 -21 q15 1 17 21 q-8 -9 -17 -9 q-9 0 -17 9z" ${f("cap")}/>
        <ellipse cx="42" cy="34" rx="4" ry="7" ${f("ears")}/><ellipse cx="78" cy="34" rx="4" ry="7" ${f("ears")}/>
        <path d="M60 30 l-3 9 h6z" ${f("nose")}/>
        <ellipse cx="60" cy="45" rx="6" ry="2.6" ${f("mouth")}/>
        <circle cx="53" cy="29" r="1.8" fill="var(--ink)" stroke="none"/><circle cx="67" cy="29" r="1.8" fill="var(--ink)" stroke="none"/>
        <rect x="54" y="52" width="12" height="8" fill="var(--skin)" stroke="var(--line)"/>
        <rect x="40" y="58" width="40" height="52" rx="10" fill="var(--cloth)" stroke="var(--line)"/>
        <path d="M60 76 c-4 -6 -12 -2 -8 4 l8 8 l8 -8 c4 -6 -4 -10 -8 -4z" ${on.has("heart") ? 'fill="var(--gold)" stroke="var(--gold)"' : 'fill="none" stroke="none"'}/>
        <path d="M40 64 l-10 26" stroke="var(--cloth)" stroke-width="9" stroke-linecap="round" fill="none"/>
        <path d="M80 64 l10 26" stroke="var(--cloth)" stroke-width="9" stroke-linecap="round" fill="none"/>
        <path d="M30 90 l-6 26" stroke-width="9" stroke-linecap="round" fill="none" style="stroke:${on.has("forearms") ? "var(--water)" : "var(--skin)"}"/>
        <path d="M90 90 l6 26" stroke-width="9" stroke-linecap="round" fill="none" style="stroke:${on.has("forearms") ? "var(--water)" : "var(--skin)"}"/>
        <circle cx="23" cy="122" r="7" ${f("hands")}/><circle cx="97" cy="122" r="7" ${f("hands")}/>
        <line x1="97" y1="115" x2="99" y2="104" stroke-width="3.5" stroke-linecap="round" stroke="${on.has("finger") ? "var(--gold)" : "none"}"/>
        <rect x="45" y="108" width="12" height="42" rx="5" fill="var(--cloth)" stroke="var(--line)"/>
        <rect x="63" y="108" width="12" height="42" rx="5" fill="var(--cloth)" stroke="var(--line)"/>
        <path d="M44 150 h13 v6 q0 6 -8 6 h-9 q-4 0 -3 -5z" ${f("feet")}/>
        <path d="M76 150 h-13 v6 q0 6 8 6 h9 q4 0 3 -5z" ${f("feet")}/>
      </g>${drops}</svg>`;
  }

  /* ===== أيقونات الأركان ===== */
  const I = inner => `<svg viewBox="0 0 64 64" class="icon" aria-hidden="true">${inner}</svg>`;
  const st = 'stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    shahada: I(`<path d="M24 56 V30 q0-5 5-5 q5 0 5 5 v-18 q0-5 5-5 q5 0 5 5 v30 q0 14-12 14z" ${st}/>`),
    salah: I(`<path d="M12 56 V30 q20-18 40 0 V56z" ${st}/><path d="M32 12 v8 M28 16 h8" ${st}/><path d="M26 56 V42 q6-6 12 0 V56" ${st}/>`),
    zakah: I(`<ellipse cx="32" cy="18" rx="16" ry="6" ${st}/><path d="M16 18 v10 q16 12 32 0 V18 M16 28 v10 q16 12 32 0 V28 M16 38 v10 q16 12 32 0 V38" ${st}/>`),
    sawm: I(`<path d="M40 10 a22 22 0 1 0 14 34 a18 18 0 1 1 -14 -34z" ${st}/><path d="M48 18 l2 5 5 1 -4 3 1 5 -4 -3 -4 3 1 -5 -4 -3 5 -1z" fill="currentColor"/>`),
    hajj: I(`<path d="M12 22 L32 12 L52 22 V52 L32 60 L12 52z" ${st}/><path d="M12 22 L32 32 L52 22 M32 32 V60" ${st}/><path d="M14 30 L32 39 L50 30" stroke="var(--gold)" stroke-width="4" fill="none"/>`),
    allah: I(`<circle cx="32" cy="32" r="22" ${st}/><path d="M32 16 l4 10 10 0 -8 7 3 11 -9 -6 -9 6 3 -11 -8 -7 10 0z" ${st}/>`),
    angels: I(`<path d="M32 44 C20 44 8 34 6 18 C16 26 22 28 32 30 C42 28 48 26 58 18 C56 34 44 44 32 44z" ${st}/><path d="M18 30 q6 4 14 4 q8 0 14-4" ${st}/>`),
    books: I(`<path d="M32 16 q-10-6-24-4 v38 q14-2 24 4 q10-6 24-4 V12 q-14-2-24 4z" ${st}/><path d="M32 16 v38" ${st}/>`),
    messengers: I(`<path d="M16 12 h28 q6 0 6 6 v34 q0 6-6 6 H16" ${st}/><path d="M16 12 q-6 0-6 6 q0 6 6 6 M16 58 q-6 0-6-6 q0-6 6-6 V12" ${st}/><path d="M24 26 h18 M24 34 h18 M24 42 h12" ${st}/>`),
    akhirah: I(`<path d="M18 8 h28 M18 56 h28 M20 8 q0 16 12 24 q-12 8-12 24 M44 8 q0 16-12 24 q12 8 12 24" ${st}/><path d="M26 50 q6-8 12 0z" fill="currentColor"/>`),
    qadar: I(`<path d="M32 10 v44 M18 56 h28 M12 20 h40" ${st}/><path d="M12 20 l-6 16 h12z M52 20 l-6 16 h12z" ${st}/>`),
    wudu: I(`<path d="M32 8 C22 24 16 32 16 40 a16 16 0 0 0 32 0 C48 32 42 24 32 8z" ${st}/><path d="M24 42 q2 7 9 8" ${st}/>`),
    quran: I(`<path d="M10 18 q12-4 22 4 q10-8 22-4 v32 q-12-4-22 4 q-10-8-22-4z" ${st}/><path d="M32 22 v32" ${st}/>`),
    prophets: I(`<path d="M8 50 l14-26 10 14 8-10 16 22z" ${st}/><circle cx="46" cy="16" r="5" ${st}/>`),
    sahaba: I(`<circle cx="22" cy="22" r="7" ${st}/><circle cx="42" cy="22" r="7" ${st}/><path d="M8 52 q2-16 14-16 q12 0 14 16 M28 52 q2-16 14-16 q12 0 14 16" ${st}/>`),
    sahabiyat: I(`<path d="M32 10 q12 0 12 14 q0 10-12 12 q-12-2-12-12 q0-14 12-14z" ${st}/><path d="M14 56 q2-18 18-18 q16 0 18 18" ${st}/>`),
    ghazawat: I(`<path d="M14 50 L46 14 M40 14 h6 v6 M20 40 l4 4 M50 50 L18 14 M18 14 h6 M18 14 v6 M44 40 l-4 4" ${st}/>`),
    home: I(`<path d="M10 30 L32 12 L54 30 M16 26 V54 h32 V26" ${st}/><path d="M28 54 V40 h8 v14" ${st}/>`)
  };

  /* ===== خريطة الغزوات ===== */
  // المواقع القريبة جداً من بعضها تُدمج في نقطة واحدة حتى لا تتزاحم التسميات
  const ALIAS = { uhud:"madinah", hamra:"madinah", dhuqarad:"madinah", hudaybiyah:"makkah" };
  // [خط العرض، خط الطول، التسمية، جهة التسمية (r = يمين النقطة)]
  const PLACES = {
    madinah:[24.47,39.61,"المدينة"], makkah:[21.42,39.83,"مكة"], taif:[21.27,40.42,"الطائف","r"], hunayn:[21.62,40.08],
    badr:[23.78,38.79,"بدر"], abwa:[23.10,39.15,"الأبواء"], muraysi:[22.60,39.25], najd:[24.90,40.95,"نجد"],
    dumah:[29.81,39.87,"دومة الجندل"], khaybar:[25.70,39.29,"خيبر"], tabuk:[28.38,36.57,"تبوك"], mutah:[31.08,35.70,"مؤتة","r"]
  };
  const place = k => ALIAS[k] || k;
  const P = (lat, lon) => [((lon - 34.3) * 44).toFixed(1), ((31.7 - lat) * 44).toFixed(1)];
  const COAST = [[29.55,34.95],[29.35,34.97],[28.6,34.8],[28.0,35.2],[27.35,35.7],[26.23,36.45],[25.05,37.27],
    [24.09,38.06],[22.8,39.0],[21.5,39.17],[20.8,39.45]];
  function map(active){
    const sea = COAST.map(([a,o]) => P(a,o).join(",")).join(" ") + ` ${P(20.8,34.3).join(",")} ${P(28.0,34.3).join(",")} ${P(29.55,34.5).join(",")}`;
    const act = active && place(active);
    const dots = Object.entries(PLACES).map(([k,[lat,lon,label,side]]) => {
      const [x,y] = P(lat,lon); const on = act === k;
      const t = label ? (side === "r" ? `<text x="${+x+9}" y="${+y+4}" text-anchor="start">${label}</text>`
        : `<text x="${x-9}" y="${+y+4}" text-anchor="end">${label}</text>`) : "";
      return `<g class="mapdot${on?" on":""}" data-loc="${k}"><circle cx="${x}" cy="${y}" r="${on?8:5}"/>${t}</g>`;
    }).join("");
    return `<svg viewBox="0 0 320 470" class="map" role="img" aria-label="خريطة مواقع الغزوات">
      <rect width="320" height="470" fill="var(--land)" rx="12"/>
      <polygon points="${sea}" fill="var(--sea)"/>
      <text x="${P(24.2,36.4)[0]}" y="${P(24.2,36.4)[1]}" class="sealabel" transform="rotate(-58 ${P(24.2,36.4).join(" ")})">البحر الأحمر</text>
      ${dots}</svg>`;
  }

  return { pose, wudu, icons, map, PLACES, place };
})();
