import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { fetchAssets } from '../services/assetApi';

function getStatusStyles(status) {
  return String(status).toUpperCase() === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';
}

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchAssets();
        if (isMounted) {
          setAssets(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error?.message || 'Failed to load assets.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAssets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return assets;
    }

    return assets.filter((asset) => {
      const nameText = String(asset?.name ?? '').toLowerCase();
      const categoryText = String(asset?.category ?? '').toLowerCase();
      const locationText = String(asset?.location ?? '').toLowerCase();

      return (
        nameText.includes(term) ||
        categoryText.includes(term) ||
        locationText.includes(term)
      );
    });
  }, [assets, searchTerm]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50">
      <AppNavbar />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-xl shadow-blue-100/60 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Smart Campus</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Assets</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Track campus assets, their categories, locations, and operational status.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Back to Dashboard
              </Link>
              <Link
                to="/dashboard/facilities"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
              >
                View Facilities
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <label htmlFor="asset-search" className="mb-2 block text-sm font-semibold text-slate-800">
              Search assets
            </label>
            <input
              id="asset-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, category, or location"
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          {isLoading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-2xl border border-blue-100 bg-slate-50 p-5"
                >
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                  <div className="mt-8 space-y-3">
                    <div className="h-4 w-full rounded bg-slate-200" />
                    <div className="h-4 w-5/6 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAssets.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredAssets.map((asset) => (
                <article
                  key={asset.id}
                  className="group flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-100/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">
                        {asset.category || 'Asset'}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-950">{asset.name}</h2>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(
                        asset.status,
                      )}`}
                    >
                      {asset.status || 'UNKNOWN'}
                    </span>
                  </div>

                  <dl className="mt-5 grid gap-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <dt className="font-medium text-slate-500">Category</dt>
                      <dd className="font-semibold text-slate-900">{asset.category || '-'}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <dt className="font-medium text-slate-500">Location</dt>
                      <dd className="font-semibold text-slate-900">{asset.location || '-'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {searchTerm ? 'No assets match your search.' : 'No assets found.'}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}