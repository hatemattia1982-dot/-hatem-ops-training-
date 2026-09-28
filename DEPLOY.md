# النشر

المنصة ثلاثة أجزاء تُنشر معًا:

| الجزء | الملف | أين يُنشر |
|---|---|---|
| الموقع | `index.html` | Cloudflare Pages — يُنشر تلقائيًا عند الدمج في `main` |
| قواعد الأمان | `firestore.rules` | Firebase |
| تصحيح الاختبارات | `functions/` | Firebase Cloud Functions (يتطلب خطة Blaze) |

## نشر القواعد والدوال (قبل دمج أي تعديل يغيّرها) (من المتصفح عبر Google Cloud Shell)

1. افتح: https://console.cloud.google.com/?cloudshell=true&project=hatem-ops-training
2. انسخ الأوامر التالية في النافذة السوداء أسفل الصفحة:

```bash
git clone https://github.com/hatemattia1982-dot/-hatem-ops-training-.git ops && cd ops
(cd functions && npm ci)
npx -y firebase-tools@latest login --no-localhost
npx -y firebase-tools@latest deploy --only functions,firestore:rules --project hatem-ops-training
```

## بعد النشر

- ادمج التعديلات في `main` — Cloudflare Pages ينشر الموقع تلقائيًا.
- من لوحة المدرب ← «مفاتيح إجابات الاختبارات» ← استورد ملف `quiz_keys.json`.
  الملف **لا يُحفظ في المستودع** — احتفظ به عندك. عند تعديل أسئلة أي وحدة عدّل مفتاحها في الملف وأعد استيراده.
