import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestJson } from '../services/apiClient';
import { fetchAssets } from '../services/assetApi';
import {
  addIncidentComment,
  assignTechnician,
  closeIncident,
  createIncident,
  deleteIncidentAttachment,
  getIncidentById,
  getIncidentComments,
  getIncidents,
  getUsers,
  linkIncidentAsset,
  rejectIncident,
  resolveIncident,
} from '../services/incidentApi';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString();
}

export default function IncidentPage() {
  const { token, role, name } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [comments, setComments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [assets, setAssets] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [createForm, setCreateForm] = useState({
    location: '',
    category: '',
    description: '',
    priority: 'MEDIUM',
    preferredContact: '',
    assetId: '',
  });
  const [createFormErrors, setCreateFormErrors] = useState({
    location: '',
    category: '',
    description: '',
    preferredContact: '',
  });

  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');

  const [technicianId, setTechnicianId] = useState('');
  const [technicianError, setTechnicianError] = useState('');
  const [assetIdToLink, setAssetIdToLink] = useState('');
  const [assetLinkError, setAssetLinkError] = useState('');

  const canAssign = role === 'ADMIN';
  const canResolve = role === 'TECHNICIAN';
  const canPostUpdate = role === 'TECHNICIAN';

  const selectedIncidentSummary = useMemo(
    () => incidents.find((incident) => incident.id === selectedIncidentId) || null,
    [incidents, selectedIncidentId],
  );

  async function loadIncidents(currentFilter = statusFilter) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      let data = [];

      if (role === 'ADMIN') {
        data = await getIncidents(token, currentFilter || undefined);
      } else if (role === 'TECHNICIAN') {
        data = await requestJson('/api/incidents/assigned', {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        data = await requestJson('/api/incidents/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (role !== 'ADMIN' && currentFilter) {
        data = data.filter((incident) => incident.status === currentFilter);
      }

      setIncidents(data);

      if (data.length > 0) {
        const defaultId = selectedIncidentId && data.some((item) => item.id === selectedIncidentId)
          ? selectedIncidentId
          : data[0].id;
        setSelectedIncidentId(defaultId);
      } else {
        setSelectedIncidentId(null);
        setSelectedIncident(null);
        setComments([]);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadIncidentDetails(incidentId) {
    if (!incidentId) {
      return;
    }

    try {
      const [incidentData, commentData] = await Promise.all([
        getIncidentById(token, incidentId),
        getIncidentComments(token, incidentId),
      ]);
      setSelectedIncident(incidentData);
      setComments(commentData);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    loadIncidents('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadIncidentDetails(selectedIncidentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIncidentId]);

  useEffect(() => {
    if (!canAssign) {
      return;
    }

    getUsers(token)
      .then((users) => {
        const list = users.filter((user) => user.role === 'TECHNICIAN');
        setTechnicians(list);
      })
      .catch(() => {
        setTechnicians([]);
      });
  }, [canAssign, token]);

  useEffect(() => {
    fetchAssets()
      .then((data) => {
        setAssets(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setAssets([]);
      });
  }, []);

  const onCreateFormChange = (event) => {
    const { name: fieldName, value } = event.target;
    setCreateForm((previous) => ({ ...previous, [fieldName]: value }));
    setCreateFormErrors((previous) => ({ ...previous, [fieldName]: '' }));
  };

  const validateCreateForm = () => {
    const errors = {
      location: '',
      category: '',
      description: '',
      preferredContact: '',
    };
    let isValid = true;

    if (!createForm.location.trim()) {
      errors.location = 'Location is required.';
      isValid = false;
    } else if (createForm.location.trim().length < 3) {
      errors.location = 'Location must be at least 3 characters.';
      isValid = false;
    }

    if (!createForm.category.trim()) {
      errors.category = 'Category is required.';
      isValid = false;
    } else if (createForm.category.trim().length < 3) {
      errors.category = 'Category must be at least 3 characters.';
      isValid = false;
    }

    if (!createForm.description.trim()) {
      errors.description = 'Description is required.';
      isValid = false;
    } else if (createForm.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
      isValid = false;
    }

    if (createForm.preferredContact.trim() && createForm.preferredContact.trim().length < 5) {
      errors.preferredContact = 'Preferred contact must be at least 5 characters.';
      isValid = false;
    }

    setCreateFormErrors(errors);
    return isValid;
  };

  const onCreateIncident = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateCreateForm()) {
      return;
    }

    try {
      const payload = {
        ...createForm,
        assetId: createForm.assetId ? Number(createForm.assetId) : null,
      };

      await createIncident(token, payload, []);
      setSuccessMessage('Incident created successfully.');
      setCreateForm({
        location: '',
        category: '',
        description: '',
        priority: 'MEDIUM',
        preferredContact: '',
        assetId: '',
      });
      setCreateFormErrors({
        location: '',
        category: '',
        description: '',
        preferredContact: '',
      });
      await loadIncidents(statusFilter);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onCreateComment = async (event) => {
    event.preventDefault();
    if (!selectedIncidentId) {
      return;
    }

    if (!canPostUpdate) {
      setErrorMessage('Only technicians can post incident updates.');
      return;
    }

    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }

    if (commentText.trim().length < 2) {
      setCommentError('Comment must be at least 2 characters.');
      return;
    }

    setCommentError('');

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await addIncidentComment(token, selectedIncidentId, commentText.trim());
      setCommentText('');
      setSuccessMessage('Comment added.');
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onResolveIncident = async () => {
    if (!selectedIncidentId) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await resolveIncident(token, selectedIncidentId);
      setSuccessMessage('Incident marked as resolved.');
      await loadIncidents(statusFilter);
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onRejectIncident = async () => {
    if (!selectedIncidentId) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await rejectIncident(token, selectedIncidentId);
      setSuccessMessage('Incident rejected.');
      await loadIncidents(statusFilter);
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onCloseIncident = async () => {
    if (!selectedIncidentId) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await closeIncident(token, selectedIncidentId);
      setSuccessMessage('Incident closed.');
      await loadIncidents(statusFilter);
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onAssignTechnician = async (event) => {
    event.preventDefault();
    if (!selectedIncidentId) {
      return;
    }

    if (!technicianId) {
      setTechnicianError('Please select a technician.');
      return;
    }

    setTechnicianError('');

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await assignTechnician(token, selectedIncidentId, Number(technicianId));
      setSuccessMessage('Technician assigned.');
      await loadIncidents(statusFilter);
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onLinkAsset = async (event) => {
    event.preventDefault();
    if (!selectedIncidentId) {
      return;
    }

    if (!assetIdToLink) {
      setAssetLinkError('Please select an asset.');
      return;
    }

    setAssetLinkError('');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await linkIncidentAsset(token, selectedIncidentId, Number(assetIdToLink));
      setSuccessMessage('Asset linked to incident.');
      await loadIncidents(statusFilter);
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onDeleteAttachment = async (attachmentId) => {
    if (!selectedIncidentId) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteIncidentAttachment(token, selectedIncidentId, attachmentId);
      setSuccessMessage('Attachment deleted.');
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <main className="incident-page">
      <header className="page-topbar">
        <div>
          <p className="topbar-kicker">Smart Campus</p>
          <h1>Incident Dashboard</h1>
          <p className="topbar-sub">Welcome, {name}. Create and track your incident tickets.</p>
        </div>
        <Link to="/dashboard/student" className="topbar-link">
          Back To Student Dashboard
        </Link>
      </header>

      {errorMessage ? <p className="alert error">{errorMessage}</p> : null}
      {successMessage ? <p className="alert success">{successMessage}</p> : null}

      {role !== 'ADMIN' ? (
        <section className="panel create-panel">
          <h2>Create New Incident</h2>
          <form className="incident-form" onSubmit={onCreateIncident} noValidate>
            <input
              name="location"
              value={createForm.location}
              onChange={onCreateFormChange}
              placeholder="Location"
              required
            />
            {createFormErrors.location ? <p className="form-error">{createFormErrors.location}</p> : null}
            <input
              name="category"
              value={createForm.category}
              onChange={onCreateFormChange}
              placeholder="Category"
              required
            />
            {createFormErrors.category ? <p className="form-error">{createFormErrors.category}</p> : null}
            <select name="priority" value={createForm.priority} onChange={onCreateFormChange}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <input
              name="preferredContact"
              value={createForm.preferredContact}
              onChange={onCreateFormChange}
              placeholder="Preferred contact"
            />
            {createFormErrors.preferredContact ? <p className="form-error">{createFormErrors.preferredContact}</p> : null}
            <textarea
              name="description"
              value={createForm.description}
              onChange={onCreateFormChange}
              placeholder="Describe the issue"
              required
            />
            {createFormErrors.description ? <p className="form-error">{createFormErrors.description}</p> : null}
            <button type="submit">Create Incident</button>
          </form>
        </section>
      ) : null}

      <section className="incident-layout">
        <aside className="panel list-panel">
          <div className="list-head">
            <h2>Incidents</h2>
            <select
              value={statusFilter}
              onChange={(event) => {
                const value = event.target.value;
                setStatusFilter(value);
                loadIncidents(value);
              }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? <p>Loading incidents...</p> : null}

          <ul className="incident-list">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <button
                  type="button"
                  className={incident.id === selectedIncidentId ? 'incident-chip active' : 'incident-chip'}
                  onClick={() => setSelectedIncidentId(incident.id)}
                >
                  <span>#{incident.id}</span>
                  <strong>{incident.category}</strong>
                  <small>{incident.status}</small>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel detail-panel">
          {selectedIncident ? (
            <>
              <h2>
                Incident #{selectedIncident.id} - {selectedIncident.category}
              </h2>
              <div className="incident-meta-grid">
                <p>
                  <strong>Status:</strong> {selectedIncident.status}
                </p>
                <p>
                  <strong>Priority:</strong> {selectedIncident.priority}
                </p>
                <p>
                  <strong>Location:</strong> {selectedIncident.location}
                </p>
                <p>
                  <strong>Reporter:</strong> {selectedIncident.reportedByName || selectedIncident.reportedBy?.name || '-'}
                </p>
                <p>
                  <strong>Technician:</strong> {selectedIncident.assignedTechnicianName || selectedIncident.assignedTechnician?.name || '-'}
                </p>
                <p>
                  <strong>Related Asset:</strong>{' '}
                  {selectedIncident.relatedAsset ? `${selectedIncident.relatedAsset.name} (${selectedIncident.relatedAsset.location})` : '-'}
                </p>
                <p>
                  <strong>Created:</strong> {formatDateTime(selectedIncident.createdAt)}
                </p>
              </div>

              <p className="incident-description">{selectedIncident.description}</p>

              <div className="attachments-block">
                <h3>Attachments</h3>
                <ul className="attachment-grid">
                  {selectedIncident.attachments?.map((file) => (
                    <li key={file.id} className="attachment-card">
                      {file.previewDataUrl ? (
                        <img
                          src={file.previewDataUrl}
                          alt={file.originalFileName}
                          className="attachment-preview"
                        />
                      ) : (
                        <div className="attachment-preview attachment-preview-fallback">
                        <select name="assetId" value={createForm.assetId} onChange={onCreateFormChange}>
                          <option value="">Optional: select related asset</option>
                          {assets.map((asset) => (
                            <option key={asset.id} value={asset.id}>
                              #{asset.id} - {asset.name} ({asset.location})
                            </option>
                          ))}
                        </select>
                          <span>{file.originalFileName}</span>
                        </div>
                      )}

                      <div className="attachment-card-footer">
                        <span>{file.originalFileName}</span>
                        <button type="button" onClick={() => onDeleteAttachment(file.id)}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

              </div>

              {canAssign ? (
                <form className="inline-form" onSubmit={onAssignTechnician} noValidate>
                  <select
                    value={technicianId}
                    onChange={(event) => {
                      setTechnicianId(event.target.value);
                      setTechnicianError('');
                    }}
                  >
                    <option value="">Select technician</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.name} ({technician.email})
                      </option>
                    ))}
                  </select>
                  {technicianError ? <p className="form-error">{technicianError}</p> : null}
                  <button type="submit">Assign Technician</button>
                </form>
              ) : null}

              {canAssign ? (
                <form className="inline-form" onSubmit={onLinkAsset} noValidate>
                  <select
                    value={assetIdToLink}
                    onChange={(event) => {
                      setAssetIdToLink(event.target.value);
                      setAssetLinkError('');
                    }}
                  >
                    <option value="">Select asset for incident</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        #{asset.id} - {asset.name} ({asset.location})
                      </option>
                    ))}
                  </select>
                  {assetLinkError ? <p className="form-error">{assetLinkError}</p> : null}
                  <button type="submit">Link Asset</button>
                </form>
              ) : null}

              {canResolve && (selectedIncident.status === 'OPEN' || selectedIncident.status === 'IN_PROGRESS') ? (
                <div className="status-form">
                  <h3>Technician Action</h3>
                  <button type="button" onClick={onResolveIncident}>Mark as Resolved</button>
                </div>
              ) : null}

              {canAssign ? (
                <div className="status-form">
                  <h3>Admin Actions</h3>
                  {selectedIncident.status === 'OPEN' ? (
                    <button type="button" onClick={onRejectIncident}>Reject Incident</button>
                  ) : null}
                  {selectedIncident.status === 'RESOLVED' ? (
                    <button type="button" onClick={onCloseIncident}>Close Incident</button>
                  ) : null}
                </div>
              ) : null}

              <section className="comments-block">
                <h3>Updates</h3>

                {canPostUpdate ? (
                  <form onSubmit={onCreateComment} className="inline-form comment-create" noValidate>
                    <input
                      value={commentText}
                      onChange={(event) => {
                        setCommentText(event.target.value);
                        setCommentError('');
                      }}
                      placeholder="Add an update"
                      required
                    />
                    {commentError ? <p className="form-error">{commentError}</p> : null}
                    <button type="submit">Post Update</button>
                  </form>
                ) : (
                  <p className="form-error">Only technicians can post updates for incidents.</p>
                )}

                <ul className="comment-list">
                  {comments.map((comment) => (
                    <li key={comment.id}>
                      <header>
                        <strong>{comment.technicianName || comment.authorName || 'Technician'}</strong>
                        <small>
                          {comment.authorRole || 'TECHNICIAN'} | {formatDateTime(comment.date || comment.updatedAt || comment.createdAt)}
                        </small>
                      </header>
                      <p>{comment.updateText || comment.message || '-'}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <p>Select an incident to see details.</p>
          )}
        </section>
      </section>

      {selectedIncidentSummary ? (
        <footer className="page-footer-note">
          Tracking incident #{selectedIncidentSummary.id} in {selectedIncidentSummary.location}
        </footer>
      ) : null}
    </main>
  );
}
