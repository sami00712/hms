# Hospital Management System (HMS)

Full-featured multi-role Hospital Management System built with **Next.js 14 (App Router)**, **Prisma + PostgreSQL (Neon)**, and **NextAuth**. Ready to deploy on **Vercel**.

## Roles / Portals

| Role | Route | Capabilities |
|---|---|---|
| Admin | `/admin` | Manage all staff accounts, view dashboard stats & revenue chart, billing & inventory reports, full access to all other portals |
| Receptionist | `/receptionist` | Register patients, book appointments, create invoices & record payments |
| Doctor | `/doctor` | View daily appointments, open patient chart, write prescriptions, order lab tests, view patient history |
| Lab | `/lab` | View pending lab orders, process tests, submit results |
| Pharmacist | `/pharmacy` | Dispense prescriptions (auto stock deduction + auto invoice), manage medicine inventory |

Login automatically redirects each user to their role's portal. Non-admin roles are locked to their own portal via middleware; Admin can access everything.

## Tech Stack

- **Next.js 14** (App Router, Server Components, Route Handlers)
- **PostgreSQL** via **Neon** (or Vercel Postgres) using **Prisma ORM**
- **NextAuth** (Credentials provider, JWT sessions, role-based)
- **Tailwind CSS** for styling
- **Recharts** for the admin revenue chart

## Local Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Postgres database**
   - Go to [neon.tech](https://neon.tech), create a free project, and copy the connection string.
   - Or use [Vercel Postgres](https://vercel.com/storage/postgres).

3. **Set environment variables** — copy `.env.example` to `.env` and fill in:
   ```
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."     # Neon: use the non-pooled connection string here
   NEXTAUTH_SECRET="run: openssl rand -base64 32"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed initial accounts + sample data**
   ```bash
   npm run prisma:seed
   ```
   This creates one login per role, all with password `Password123!`:
   - admin@hms.com
   - receptionist@hms.com
   - doctor@hms.com
   - lab@hms.com
   - pharmacy@hms.com

   **Change these passwords (or delete/recreate the users) before going live.**

6. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. On [vercel.com](https://vercel.com), import the repo as a new project.
3. In **Project Settings → Environment Variables**, add:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → set to your production URL, e.g. `https://your-app.vercel.app`
4. Deploy. Vercel runs `npm run build`, which executes `prisma generate` automatically (via `postinstall`/`build` scripts).
5. **Run migrations against your production database** once, from your local machine (pointing `DATABASE_URL` at the production DB):
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

## Project Structure

```
prisma/schema.prisma      → all data models (User, Patient, Appointment, Prescription,
                             Medicine, LabTest, LabOrder, Invoice, Notification, ...)
prisma/seed.ts             → creates one login per role + sample lab tests & medicines
src/lib/auth.ts            → NextAuth config + role→portal route mapping
src/middleware.ts          → locks each role to its own portal
src/app/login/             → shared login page
src/app/admin/             → Admin portal (dashboard, users, reports)
src/app/receptionist/      → Receptionist portal (patients, appointments, billing)
src/app/doctor/            → Doctor portal (appointments, patient chart, prescribing)
src/app/lab/               → Lab portal (pending orders, results)
src/app/pharmacy/          → Pharmacy portal (dispensing, inventory)
src/app/api/                → all REST route handlers used by the above pages
```

## Key Automated Workflows

- **Dispensing a prescription** automatically deducts stock for every medicine in it, logs an `InventoryTransaction`, and generates a billing `Invoice`.
- **Ordering a lab test** automatically generates a billing `Invoice` for that test.
- **Completing a lab result** sends an in-app `Notification` to the ordering doctor.
- **Booking an appointment** sends an in-app `Notification` to the assigned doctor.
- Low-stock medicines (stock ≤ reorder level) are flagged across Admin Reports and the Pharmacy Inventory page.

## Extending Further

This covers the core end-to-end flow for all five roles. Natural next additions:
- PDF generation for prescriptions/invoices (there's a `pdf` skill available if you want this built next)
- Email/SMS notifications (currently in-app only)
- Doctor scheduling / time-slot conflict checks
- Multi-branch / multi-hospital support
- Audit logs for sensitive actions

Ask and these can be added on top of this codebase.
"# hms" 
