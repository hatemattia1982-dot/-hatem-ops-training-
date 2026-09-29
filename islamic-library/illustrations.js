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
    beads: I(`<circle cx="32" cy="10" r="4" ${st}/><circle cx="20" cy="16" r="4" ${st}/><circle cx="44" cy="16" r="4" ${st}/><circle cx="14" cy="28" r="4" ${st}/><circle cx="50" cy="28" r="4" ${st}/><circle cx="20" cy="40" r="4" ${st}/><circle cx="44" cy="40" r="4" ${st}/><path d="M32 44 v8 M28 56 h8 l-4 4z" ${st}/>`),
    seerah: I(`<path d="M10 54 q10-20 22-20 q12 0 22-20" ${st} stroke-dasharray="4 5"/><circle cx="10" cy="54" r="4" fill="currentColor"/><path d="M50 8 l4 10 -8 0z" fill="currentColor"/><path d="M50 18 v8" ${st}/>`),
    ihram: I(`<path d="M14 12 h16 v40 h-16z M34 12 h16 l-4 24 h-12z" ${st}/><path d="M34 36 v16 h12 v-16" ${st}/>`),
    tawaf: I(`<rect x="22" y="22" width="20" height="20" rx="2" fill="currentColor"/><rect x="22" y="27" width="20" height="3" fill="var(--gold)"/><path d="M54 32 a22 22 0 1 1 -8 -17" ${st}/><path d="M46 8 l1 8 -8 1" ${st}/>`),
    maqam: I(`<path d="M18 56 V28 q14-16 28 0 V56z" ${st}/><rect x="26" y="40" width="12" height="10" rx="2" ${st}/>`),
    zamzam: I(`<path d="M20 14 h24 l-4 40 h-16z" ${st}/><path d="M22 26 h20" ${st}/><path d="M32 34 q-5 7 0 11 q5-4 0-11z" fill="currentColor"/>`),
    sai: I(`<path d="M4 50 q8-16 16 0 M44 50 q8-16 16 0" ${st}/><path d="M22 40 h20 M36 35 l6 5 -6 5 M28 45 l-6 -5" ${st}/>`),
    halq: I(`<circle cx="18" cy="46" r="7" ${st}/><circle cx="46" cy="46" r="7" ${st}/><path d="M23 41 L44 10 M41 41 L20 10" ${st}/>`),
    mina: I(`<path d="M6 50 L18 26 L30 50z M26 50 L38 22 L50 50z M42 50 L52 32 L60 50z" ${st}/><path d="M4 50 h58" ${st}/>`),
    arafah: I(`<path d="M6 54 L26 20 L36 34 L44 26 L60 54z" ${st}/><path d="M26 20 v-8 M22 14 h8" ${st}/>`),
    muzdalifah: I(`<path d="M40 8 a14 14 0 1 0 12 20 a11 11 0 1 1 -12 -20z" ${st}/><circle cx="16" cy="50" r="3" fill="currentColor"/><circle cx="26" cy="54" r="3" fill="currentColor"/><circle cx="36" cy="50" r="3" fill="currentColor"/>`),
    jamarat: I(`<path d="M26 56 V14 h12 V56" ${st}/><path d="M18 56 h28" ${st}/><circle cx="12" cy="24" r="2.5" fill="currentColor"/><circle cx="16" cy="32" r="2.5" fill="currentColor"/><circle cx="50" cy="28" r="2.5" fill="currentColor"/>`),
    minbar: I(`<path d="M14 56 V36 h10 V26 h10 V16 h10 V56" ${st}/><path d="M44 16 l8 -6 v46" ${st}/>`),
    dua: I(`<path d="M20 54 q-8-10-6-24 l4-10 q2-4 5 0 l3 14 M44 54 q8-10 6-24 l-4-10 q-2-4-5 0 l-3 14" ${st}/><path d="M26 34 v20 M38 34 v20" ${st}/>`),
    tajweed: I(`<path d="M10 18 q12-4 22 4 q10-8 22-4 v32 q-12-4-22 4 q-10-8-22-4z" ${st}/><path d="M20 30 q4 -6 8 0 t8 0" ${st}/><circle cx="44" cy="26" r="3" fill="currentColor"/>`),
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


  /* ===== مخارج الحروف: مقطع جانبي للفم والحلق (الوجه إلى اليسار) ===== */
  const AREA_COLOR = {jawf:"#5b8def", halq:"#e67e22", lisan:"#c0392b", shafatan:"#8e44ad", khayshum:"#27ae60"};
  // [x, y, area]
  const MKH = {
    jawf:[178,172,"jawf"], halq_adna:[247,178,"halq"], halq_wasat:[251,214,"halq"], halq_aqsa:[253,256,"halq"],
    qaf:[226,150,"lisan"], kaf:[209,146,"lisan"], jeem_sheen_ya:[166,145,"lisan"], dad:[146,158,"lisan"],
    lam:[132,150,"lisan"], noon:[122,148,"lisan"], ra:[126,157,"lisan"], ta_dal_ta:[110,150,"lisan"],
    za_dhal_tha:[101,165,"lisan"], sad_zay_seen:[104,176,"lisan"], fa:[92,170,"shafatan"], ba_meem_waw:[82,170,"shafatan"],
    khayshum:[112,120,"khayshum"]
  };
  function makharij(active){
    const dots = Object.entries(MKH).map(([id,[x,y,a]]) => {
      const on = id === active;
      return `<g class="mkh${on ? " on" : ""}" data-id="${id}" style="cursor:pointer">
        ${on ? `<circle cx="${x}" cy="${y}" r="13" fill="${AREA_COLOR[a]}" opacity=".25"><animate attributeName="r" values="9;15;9" dur="1.6s" repeatCount="indefinite"/></circle>` : ""}
        <circle cx="${x}" cy="${y}" r="${on ? 6 : 4.2}" fill="${AREA_COLOR[a]}" stroke="#fff" stroke-width="1.5"/></g>`;
    }).join("");
    return `<svg viewBox="55 60 250 250" class="mkh-svg" role="img" aria-label="رسم توضيحي لمخارج الحروف">
      <rect x="55" y="60" width="250" height="250" fill="var(--card)"/>
      <!-- الرأس -->
      <path d="M150 20 Q125 40 118 62 Q112 80 108 90 L74 120 Q72 126 80 128 L96 132 Q90 140 86 150 Q82 156 84 164 Q80 168 84 174 Q82 182 88 190 Q90 206 96 216 Q112 236 132 242 Q158 250 170 272 L176 380 L300 380 L300 250 Q340 236 360 200 L360 60 Z"
        fill="var(--skin)" stroke="var(--line)" stroke-width="2"/>
      <!-- التجويف الأنفي -->
      <path d="M92 128 Q104 112 130 106 Q190 98 252 108 L256 132 Q200 126 150 128 Q118 130 100 132 Z" fill="#f6d6d0" stroke="#d9a79d" stroke-width="1.2"/>
      <!-- البلعوم -->
      <path d="M238 132 L264 132 L266 330 L246 330 L244 262 Q240 220 236 190 Z" fill="#f6d6d0" stroke="#d9a79d" stroke-width="1.2"/>
      <!-- تجويف الفم -->
      <path d="M104 150 Q140 136 190 134 Q222 136 236 150 L238 172 Q220 158 196 152 Q160 148 124 162 Q110 170 104 176 Z" fill="#f6d6d0"/>
      <!-- الحنك الأعلى واللهاة -->
      <path d="M103 149 Q140 135 190 133 Q222 135 234 146 Q240 156 237 168" fill="none" stroke="#b5655a" stroke-width="3" stroke-linecap="round"/>
      <circle cx="237" cy="169" r="3.5" fill="#b5655a"/>
      <!-- اللسان -->
      <path d="M103 178 Q108 166 124 160 Q160 146 200 150 Q228 158 236 182 Q242 214 244 250 Q222 236 200 222 Q160 208 128 204 Q110 198 103 188 Z" fill="#e8868c" stroke="#b8505a" stroke-width="1.5"/>
      <!-- لسان المزمار والحنجرة -->
      <path d="M244 250 Q250 240 256 246" fill="none" stroke="#b8505a" stroke-width="2.5"/>
      <path d="M232 262 L232 330 M252 262 L252 330" stroke="#d9a79d" stroke-width="2"/>
      <!-- الأسنان -->
      <path d="M97 146 L106 146 L105 166 L99 167 Z" fill="#fff" stroke="#bbb"/>
      <path d="M98 172 L106 172 L106 190 L99 190 Z" fill="#fff" stroke="#bbb"/>
      <!-- الشفتان -->
      <path d="M100 144 Q86 146 83 160 Q86 168 97 167 Z" fill="#d97b7b" stroke="#b8505a"/>
      <path d="M99 173 Q84 172 82 180 Q86 194 101 192 Z" fill="#d97b7b" stroke="#b8505a"/>
      ${dots}</svg>`;
  }

  /* ===== الأسنان: منظر علوي للفك الأعلى مع أسمائها ===== */
  const TEETH = [["الثنايا","#c0392b",11],["الرباعيات","#e67e22",10],["الأنياب","#d4ac0d",10],["الضواحك","#27ae60",11],
    ["الطواحن","#2e86c1",14],["الطواحن","#2e86c1",14],["الطواحن","#2e86c1",14],["النواجذ","#8e44ad",13]];
  function teeth(){
    const ang = [0.1,0.3,0.5,0.72,0.95,1.18,1.39,1.56];
    let t = "";
    [-1,1].forEach(side => TEETH.forEach(([n,c,r],i) => {
      const a = Math.PI/2 + side*ang[i];
      const x = 160 + 105*Math.cos(a), y = 30 + 150*Math.sin(a);
      t += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}" opacity=".85" stroke="#fff" stroke-width="2"/>`;
    }));
    const legend = [...new Map(TEETH.map(([n,c]) => [n,c])).entries()]
      .map(([n,c],i) => `<g transform="translate(${i%3*104+8},${210+Math.floor(i/3)*24})"><rect width="14" height="14" rx="3" fill="${c}"/><text x="20" y="12" font-size="13" fill="var(--ink)" style="direction:ltr" text-anchor="start">${n}</text></g>`).join("");
    return `<svg viewBox="0 0 320 262" class="teeth-svg" role="img" aria-label="أسماء الأسنان">
      <text x="160" y="96" text-anchor="middle" font-size="13" fill="var(--soft)" style="direction:ltr">الفك الأعلى</text>
      <text x="160" y="196" text-anchor="middle" font-size="12" fill="var(--soft)" style="direction:ltr">↓ مقدمة الفم</text>
      ${t}${legend}</svg>`;
  }

  return { pose, wudu, icons, map, PLACES, place, makharij, teeth, AREA_COLOR };
})();
