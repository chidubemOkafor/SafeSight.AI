import { API_BASE_URL, apiEndpoints } from "@/lib/api";

const workflowSteps = [
  {
    label: "01",
    title: "Upload footage",
    copy: "Send an MP4 from the site walk-through or CCTV export.",
  },
  {
    label: "02",
    title: "Inspect with AI",
    copy: "SafeSight extracts frames, runs YOLO, and records safety events.",
  },
  {
    label: "03",
    title: "Review evidence",
    copy: "Open ignored safety concerns with timestamps, risk, and frames.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative isolate px-6 py-8 sm:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(249,184,77,0.28),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(28,95,91,0.22),transparent_30%),linear-gradient(135deg,#fff8e7_0%,#edf4ef_52%,#f6efe1_100%)]" />
        <div className="absolute left-1/2 top-10 -z-10 h-64 w-64 -translate-x-1/2 rounded-full border border-black/10 bg-white/25 blur-3xl" />

        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-black/10 bg-white/55 px-5 py-3 shadow-[0_20px_60px_rgba(33,42,35,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-[var(--ink)] text-sm font-black text-[var(--sand)]">
              SS
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[var(--ink)]">
                SafeSight
              </p>
              <p className="text-xs text-black/55">AI safety inspector</p>
            </div>
          </div>
          <a
            className="rounded-full bg-[var(--signal)] px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-[0_8px_0_rgba(31,41,35,0.14)] transition hover:-translate-y-0.5"
            href={`${API_BASE_URL}/docs`}
            target="_blank"
            rel="noreferrer"
          >
            Open API Docs
          </a>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-10 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm font-bold text-[var(--teal)] shadow-sm">
              Backend connected at {API_BASE_URL}
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.07em] text-[var(--ink)] sm:text-7xl lg:text-8xl">
              Find ignored safety concerns before they become incidents.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-black/68">
              This frontend is ready to connect to the SafeSight FastAPI server:
              upload site footage, inspect it with YOLO, review persisted
              inspection history, and ask AI for a supervisor-style summary.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                className="rounded-2xl bg-[var(--ink)] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_0_rgba(31,41,35,0.14)] transition hover:-translate-y-1"
                href="#workflow"
              >
                View Flow
              </a>
              <a
                className="rounded-2xl border border-black/15 bg-white/65 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-[var(--ink)] transition hover:-translate-y-1 hover:bg-white"
                href="#endpoints"
              >
                Frontend Endpoints
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-[2rem] bg-[var(--signal)] shadow-[0_18px_0_rgba(31,41,35,0.12)]" />
            <div className="relative rounded-[2.25rem] border border-black/10 bg-[var(--ink)] p-5 text-white shadow-[0_30px_90px_rgba(31,41,35,0.22)]">
              <div className="rounded-[1.75rem] bg-[#f9f3df] p-5 text-[var(--ink)]">
                <div className="flex items-center justify-between border-b border-black/10 pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-black/45">
                      Current MVP
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                      Inspection Console
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                    Ready
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                      Stored history
                    </p>
                    <p className="mt-2 text-4xl font-black tracking-[-0.06em]">
                      JSON
                    </p>
                    <p className="mt-2 text-sm leading-6 text-black/58">
                      The UI can load previous inspections from
                      storage-backed endpoints.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Metric label="Events" value="YOLO" />
                    <Metric label="Evidence" value="Frames" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="mx-auto grid max-w-7xl gap-4 px-6 py-12 sm:px-10 lg:grid-cols-3 lg:px-16"
      >
        {workflowSteps.map((step) => (
          <article
            className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_20px_70px_rgba(31,41,35,0.08)]"
            key={step.label}
          >
            <p className="text-sm font-black text-[var(--signal-deep)]">
              {step.label}
            </p>
            <h3 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--ink)]">
              {step.title}
            </h3>
            <p className="mt-3 leading-7 text-black/60">{step.copy}</p>
          </article>
        ))}
      </section>

      <section id="endpoints" className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--teal)]">
              API map
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[var(--ink)]">
              Endpoints the client will call
            </h2>
          </div>
          <p className="max-w-xl leading-7 text-black/60">
            These are the backend routes already exposed for upload, inspection,
            history, Q&A, and evidence frames.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {apiEndpoints.map((endpoint) => (
            <article
              className="group rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_50px_rgba(31,41,35,0.1)]"
              key={`${endpoint.method}-${endpoint.path}`}
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[var(--ink)] px-3 py-1 text-xs font-black text-white">
                  {endpoint.method}
                </span>
                <code className="text-sm font-bold text-[var(--teal)]">
                  {endpoint.path}
                </code>
              </div>
              <h3 className="mt-4 text-xl font-black tracking-[-0.04em] text-[var(--ink)]">
                {endpoint.title}
              </h3>
              <p className="mt-2 leading-7 text-black/60">
                {endpoint.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-0.05em]">{value}</p>
    </div>
  );
}
