# Deploying the backend

Backend and database only. The frontend is not deployed yet — it covers about a
third of the system and its API base URL still assumes the Vite dev proxy.

Free throughout. Two accounts, roughly twenty minutes.

---

## 1. Database — Neon

1. <https://neon.tech> → sign up → **Create project**, region Singapore.
2. Copy the **pooled** connection string. It looks like:

   ```
   postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

   The pooled one — with `-pooler` in the host. A free Render instance restarts
   often, and direct connections are returned to the pool more slowly than it
   opens new ones.

**Why not Render's own Postgres:** its free tier is deleted after 90 days. This
database holds what tenants have paid and what deposits are being held for them.

**Why not Supabase:** it works, and its free project pauses after 7 days of
inactivity. For an app a landlord opens twice a month, that is a system that is
usually asleep. Neon wakes in about a second.

---

## 2. Backend — Render

1. <https://render.com> → sign up with GitHub → **New → Blueprint**.
2. Point it at this repository. It reads `render.yaml`.
3. Fill in the values it marks as required:

   | Variable | Where it comes from |
   |---|---|
   | `DATABASE_URL` | Neon, step 1 |
   | `PAYOS_CLIENT_ID` | my.payos.vn → your payment channel |
   | `PAYOS_API_KEY` | same |
   | `PAYOS_CHECKSUM_KEY` | same |
   | `OPENMAP_API_KEY` | optional — leave blank to run without address lookup |

   `JWT_SECRET` is generated for you. Do not paste the development one: it would
   make every token issued on your laptop valid in production.

4. Deploy. The build runs the migrations, so the schema is created on first
   deploy against an empty Neon database.

5. Create the first owner account. Render's free plan has no shell, so run it
   from your machine against the production database:

   ```bash
   cd backend
   DATABASE_URL='<the Neon URL>' npm run seed:owner -- \
     --phone 0900000000 --password '<a real password>' --name 'Your name'
   ```

---

## 3. Tell payOS where to send confirmations

Once Render gives you a URL — `https://apartment-management-api.onrender.com`:

```bash
curl -X POST https://api-merchant.payos.vn/confirm-webhook \
  -H 'content-type: application/json' \
  -H 'x-client-id: <PAYOS_CLIENT_ID>' \
  -H 'x-api-key: <PAYOS_API_KEY>' \
  -d '{"webhookUrl":"https://apartment-management-api.onrender.com/webhooks/payos"}'
```

A `code: "00"` means payOS called the endpoint and it answered. Until this is
run, confirmations still go to whatever URL was registered last — during
development that was a tunnel that no longer exists, and a payment made now
would be taken without being recorded.

---

## What to expect from the free tier

**The service sleeps after 15 minutes without traffic**, and takes around fifty
seconds to wake. For a payment confirmation that matters: payOS may give up
before the service is awake.

This is survivable rather than fine. A lost confirmation is caught the next time
the tenant opens the bill — the system asks payOS what became of the payment and
settles it rather than charging them twice. That path exists and is verified,
but it was built as a backstop, not as the normal way payments are recorded.

Render's paid tier is $7/month and does not sleep. For a system holding deposits
and taking payments, that is the first thing worth paying for.

---

## Checking it worked

```bash
curl https://apartment-management-api.onrender.com/health
# {"status":"ok"}                     the process is up and serving

curl https://apartment-management-api.onrender.com/health/db
# {"status":"ok","database":"ok"}     it can also reach Neon
```

The two are separate on purpose. `/health` is what Render polls every five
seconds and touches nothing; `/health/db` is the one a person asks after a
deploy.

Keeping the database probe out of the polled endpoint matters more than it
sounds. Render restarts a service whose health check fails — which cannot fix a
database that is down, and meanwhile takes the service out of rotation so
callers get Render's opaque 502 instead of this application's own error. And a
`SELECT 1` every five seconds is around seventeen thousand queries a day
against a database whose free tier suspends when idle: it never got to idle.
