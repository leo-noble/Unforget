import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, Search, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { easeOut } from '../components/ui/motion'
import { APP_NAME } from '../brand'

// The admin view: visits, sign-ups and who's active. Everything comes from one
// server function, admin_overview(), which refuses anyone not in the admins
// table — this page only displays what that call returns.

function ago(ts) {
  if (!ts) return '—'
  const s = (Date.now() - new Date(ts).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const shortDate = (ts) => (ts ? new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—')

function Stat({ label, value, hint }) {
  return (
    <div className="bg-card rounded-[12px] p-4">
      <p className="eyebrow text-label-2">{label}</p>
      <p className="font-display text-[28px] leading-none tabular mt-3">{value ?? '—'}</p>
      {hint && <p className="text-footnote text-label-3 mt-1.5">{hint}</p>}
    </div>
  )
}

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-3 mb-2.5 px-1">
        <h2 className="eyebrow text-label">{title}</h2>
        {action}
      </div>
      <div className="bg-card rounded-[12px] overflow-hidden">{children}</div>
    </section>
  )
}

export default function AdminPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const [picked, setPicked] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('admin_overview')
    if (err) setError(err.message || 'Could not load admin data.')
    else setData(res)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const users = useMemo(() => {
    const list = data?.userList || []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((u) => (u.email || '').toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q))
  }, [data, query])

  const daily = data?.daily || []
  const maxViews = Math.max(1, ...daily.map((d) => d.views))
  const sel = picked != null ? daily[picked] : null

  async function copyEmails() {
    const emails = (data?.userList || []).map((u) => u.email).filter(Boolean).join(', ')
    try {
      await navigator.clipboard.writeText(emails)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — nothing to do
    }
  }

  return (
    <div
      className="min-h-[100dvh] w-full max-w-[1120px] mx-auto px-4 sm:px-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)' }}
    >
      <header className="flex items-center justify-between gap-3 h-11">
        <Link to="/dashboard" className="flex items-center gap-1.5 h-9 pl-2 pr-3 rounded-[9px] text-subhead text-label-2 hover:bg-fill hover:text-label">
          <ArrowLeft size={16} /> {APP_NAME}
        </Link>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 h-9 px-3 rounded-[9px] bg-card text-subhead disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      <div className="mt-4 mb-6">
        <p className="eyebrow text-label-2">Admin</p>
        <h1 className="font-display text-[26px] leading-[32px] mt-1">Overview</h1>
      </div>

      {error && <p className="mb-6 px-4 py-3 rounded-[10px] bg-fill text-subhead">{error}</p>}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: easeOut }} className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Visits today" value={data?.visits?.today} hint={data && `${data.visits.d7} this week`} />
          <Stat label="Visitors · 7 days" value={data?.visits?.visitors7} hint={data && `${data.visits.visitors30} in 30 days`} />
          <Stat label="Accounts" value={data?.users?.total} hint={data && `${data.users.new7} new this week`} />
          <Stat label="Signed in · 7 days" value={data?.users?.active7} hint="active accounts" />
        </div>

        <Panel title="Visits · last 30 days">
          <div className="p-4">
            <div className="flex items-baseline justify-between mb-4 min-h-[40px]">
              <div>
                <p className="font-display text-[22px] leading-none tabular">
                  {sel ? sel.views : data?.visits?.d30 ?? '—'}
                  <span className="text-subhead font-normal text-label-2 ml-1.5">visits</span>
                </p>
                <p className="text-footnote text-label-2 mt-1">
                  {sel ? `${shortDate(sel.day)} · ${sel.visitors} visitors` : `${data?.visits?.visitors30 ?? 0} unique visitors`}
                </p>
              </div>
              <p className="text-footnote text-label-3">{data?.visits?.allTime ?? 0} all time</p>
            </div>
            <div className="flex items-end gap-[3px] h-28" onPointerLeave={() => setPicked(null)}>
              {daily.map((d, i) => (
                <button
                  key={d.day}
                  type="button"
                  onPointerEnter={() => setPicked(i)}
                  onClick={() => setPicked(picked === i ? null : i)}
                  aria-label={`${shortDate(d.day)}: ${d.views} visits`}
                  className="flex-1 h-full flex items-end"
                >
                  <span
                    className={`block w-full rounded-[3px] ${d.views ? 'bg-label' : 'bg-fill'} ${picked != null && picked !== i ? 'opacity-40' : ''}`}
                    style={{ height: `${Math.max(3, (d.views / maxViews) * 100)}%` }}
                  />
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-caption text-label-3">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </Panel>

        <Panel
          title={`Accounts · ${data?.userList?.length ?? 0}`}
          action={
            <button type="button" onClick={copyEmails} className="flex items-center gap-1.5 text-footnote text-label-2 hover:text-label">
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy emails'}
            </button>
          }
        >
          <div className="p-3 hairline-b">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-3" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search email or name"
                aria-label="Search accounts"
                className="w-full h-9 rounded-[8px] bg-fill pl-9 pr-3 outline-none placeholder:text-label-3"
              />
            </div>
          </div>
          {/* Phones get a stacked list; wider screens a table. */}
          <div className="md:hidden ios-list">
            {users.map((u) => (
              <div key={u.email} className="px-4 py-3">
                <p className="text-body truncate">{u.email}</p>
                <p className="text-footnote text-label-2 mt-0.5">
                  {u.name ? `${u.name} · ` : ''}
                  {u.provider} · {u.chapters} chapters
                </p>
                <p className="text-footnote text-label-3 mt-0.5">
                  Joined {shortDate(u.created_at)} · last sign-in {ago(u.last_sign_in_at)}
                </p>
              </div>
            ))}
          </div>
          <table className="hidden md:table w-full text-subhead">
            <thead>
              <tr className="text-left text-footnote text-label-2 hairline-b">
                <th className="font-medium px-4 py-2.5">Email</th>
                <th className="font-medium px-4 py-2.5">Name</th>
                <th className="font-medium px-4 py-2.5">Via</th>
                <th className="font-medium px-4 py-2.5 text-right">Chapters</th>
                <th className="font-medium px-4 py-2.5">Joined</th>
                <th className="font-medium px-4 py-2.5">Last sign-in</th>
                <th className="font-medium px-4 py-2.5">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} className="hairline-b last:shadow-none hover:bg-fill">
                  <td className="px-4 py-2.5 max-w-[260px] truncate">{u.email}</td>
                  <td className="px-4 py-2.5 text-label-2 max-w-[180px] truncate">{u.name || '—'}</td>
                  <td className="px-4 py-2.5 text-label-2 capitalize">{u.provider}</td>
                  <td className="px-4 py-2.5 text-right tabular">{u.chapters}</td>
                  <td className="px-4 py-2.5 text-label-2 whitespace-nowrap">{shortDate(u.created_at)}</td>
                  <td className="px-4 py-2.5 text-label-2 whitespace-nowrap">{ago(u.last_sign_in_at)}</td>
                  <td className="px-4 py-2.5 text-label-2 whitespace-nowrap">{ago(u.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && users.length === 0 && <p className="px-4 py-4 text-subhead text-label-2">No accounts match.</p>}
        </Panel>

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
          <Panel title="Top pages · 30 days">
            <div className="ios-list">
              {(data?.topPaths || []).map((p) => (
                <div key={p.path} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-subhead truncate font-mono">{p.path}</span>
                  <span className="text-subhead text-label-2 tabular">{p.views}</span>
                </div>
              ))}
              {data && !data.topPaths?.length && <p className="px-4 py-4 text-subhead text-label-2">No visits yet.</p>}
            </div>
          </Panel>

          <Panel title="Recent visits">
            <div className="ios-list max-h-[420px] overflow-y-auto">
              {(data?.recent || []).map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-footnote text-label-3 w-[64px] shrink-0">{ago(r.created_at)}</span>
                  <span className="text-subhead font-mono truncate">{r.path}</span>
                  <span className="ml-auto text-footnote text-label-2 truncate max-w-[50%]">{r.email || 'Visitor'}</span>
                </div>
              ))}
              {data && !data.recent?.length && <p className="px-4 py-4 text-subhead text-label-2">No visits yet.</p>}
            </div>
          </Panel>
        </div>

        <p className="text-footnote text-label-3 px-1">
          Visits are counted per device with a random id; no IP addresses are stored. Visits from the app count once per
          half hour.
        </p>
      </motion.div>
    </div>
  )
}
