import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { fetchFacilities } from '../services/facilityApi';

function getStatusStyles(status) {
  return String(status).toUpperCase() === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';
}

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const { name } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadFacilities() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchFacilities();
        if (isMounted) {
          setFacilities(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error?.message || 'Failed to load facilities.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFacilities();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFacilities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return facilities;
    }

    return facilities.filter((facility) => {
      const nameText = String(facility?.name ?? '').toLowerCase();
      const typeText = String(facility?.type ?? '').toLowerCase();
      const locationText = String(facility?.location ?? '').toLowerCase();

      return (
        nameText.includes(term) ||
        typeText.includes(term) ||
        locationText.includes(term)
      );
    });
  }, [facilities, searchTerm]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50">
      <AppNavbar />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-xl shadow-sky-100/60 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Smart Campus</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Facilities</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Browse campus facilities, check capacity and status, and jump straight to booking.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                Back to Dashboard
              </Link>
              <Link
                to="/dashboard/bookings"
                className="rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Open Booking Page
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <label htmlFor="facility-search" className="mb-2 block text-sm font-semibold text-slate-800">
              Search facilities
            </label>
            <input
              id="facility-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, type, or location"
              className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                  className="h-56 animate-pulse rounded-2xl border border-sky-100 bg-slate-50 p-5"
                >
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                  <div className="mt-8 space-y-3">
                    <div className="h-4 w-full rounded bg-slate-200" />
                    <div className="h-4 w-5/6 rounded bg-slate-200" />
                    <div className="h-4 w-2/3 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFacilities.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredFacilities.map((facility) => (
                <article
                  key={facility.id}
                  className="group flex h-full flex-col rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-100/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-500">
                        {facility.type || 'Facility'}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-950">{facility.name}</h2>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(
                        facility.status,
                      )}`}
                    >
                      {facility.status || 'UNKNOWN'}
                    </span>
                  </div>

                  <dl className="mt-5 grid gap-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <dt className="font-medium text-slate-500">Location</dt>
                      <dd className="font-semibold text-slate-900">{facility.location || '-'}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <dt className="font-medium text-slate-500">Capacity</dt>
                      <dd className="font-semibold text-slate-900">
                        {facility.capacity ?? '-'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <dt className="font-medium text-slate-500">Type</dt>
                      <dd className="font-semibold text-slate-900">{facility.type || '-'}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/bookings')}
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                  >
                    Book Now
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {searchTerm ? 'No facilities match your search.' : 'No facilities found.'}
            </p>
          )}

          <p className="mt-6 text-sm text-slate-500">
            Signed in as <span className="font-semibold text-slate-700">{name || 'User'}</span>
          </p>
        </div>
      </section>
    </main>
  );
}