/* تصحيح اختبارات الوحدات على الخادم
   - مفاتيح الإجابات في Firestore: quiz_keys/{mid} = {a:[...]} — لا يقرؤها إلا المدرب (والخادم)
   - الدرجة يكتبها الخادم وحده في trainees/{uid}.scores — القواعد تمنع المتدرب من تعديلها */
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const ADMIN_EMAILS = ['hatemattia1982@gmail.com'];
const COOLDOWN_MS = 60 * 1000; // دقيقة بين محاولتين لنفس الوحدة

exports.gradeQuiz = onCall({region: 'us-central1'}, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'سجّل الدخول أولًا');
  const {mid, answers} = req.data || {};
  if (typeof mid !== 'string' || !/^m\d{1,3}$/.test(mid)) throw new HttpsError('invalid-argument', 'وحدة غير صحيحة');
  if (!Array.isArray(answers)) throw new HttpsError('invalid-argument', 'الإجابات غير صحيحة');

  const uid = req.auth.uid;
  const isAdmin = ADMIN_EMAILS.includes(String(req.auth.token.email || '').toLowerCase());
  const tRef = db.doc(`trainees/${uid}`);

  const keySnap = await db.doc(`quiz_keys/${mid}`).get();
  const key = keySnap.exists ? keySnap.data().a : null;
  if (!Array.isArray(key) || !key.length) throw new HttpsError('failed-precondition', 'مفتاح إجابات هذه الوحدة غير مرفوع بعد — تواصل مع المدرب');
  if (answers.length !== key.length || !answers.every(x => Number.isInteger(x) && x >= 0 && x < 10)) {
    throw new HttpsError('invalid-argument', 'أجب على كل الأسئلة');
  }

  const results = key.map((k, i) => answers[i] === k);
  const correct = results.filter(Boolean).length;
  const total = key.length;
  const pct = Math.round(correct / total * 100);
  const now = Date.now();

  const best = await db.runTransaction(async tx => {
    const snap = await tx.get(tRef);
    const t = snap.exists ? snap.data() : null;
    if (!isAdmin && (!t || (t.status && t.status !== 'active'))) throw new HttpsError('permission-denied', 'حسابك غير مفعّل');
    const att = ((t && t.quizAttempts) || {})[mid] || {n: 0, last: 0};
    const wait = COOLDOWN_MS - (now - (att.last || 0));
    if (!isAdmin && wait > 0) {
      throw new HttpsError('resource-exhausted', `انتظر ${Math.ceil(wait / 1000)} ثانية قبل إعادة المحاولة`, {waitSec: Math.ceil(wait / 1000)});
    }
    const prev = ((t && t.scores) || {})[mid];
    const upd = {quizAttempts: {[mid]: {n: (att.n || 0) + 1, last: now}}};
    let b = prev || null;
    if (!prev || pct > prev.pct) {
      b = {pct, correct, total, at: now};
      upd.scores = {[mid]: b};
    }
    tx.set(tRef, upd, {merge: true});
    return b;
  });

  return {correct, total, pct, pass: pct >= 80, results, best};
});
