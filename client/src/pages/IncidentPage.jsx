import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  addIncidentAttachments,
  addIncidentComment,
  assignTechnician,
  createIncident,
  deleteIncidentAttachment,
  deleteIncidentComment,
  getIncidentById,
  getIncidentComments,
  getIncidents,
  getUsers,
  updateIncidentComment,
  updateIncidentStatus,
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
  });
  const [createFiles, setCreateFiles] = useState([]);

  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: 'IN_PROGRESS',
    reason: '',
    resolutionNotes: '',
  });
  const [technicianId, setTechnicianId] = useState('');
  const [extraFiles, setExtraFiles] = useState([]);

  const canAssign = role === 'ADMIN';
  const canUpdateStatus = role === 'ADMIN' || role === 'TECHNICIAN';

  const selectedIncidentSummary = useMemo(
    () => incidents.find((incident) => incident.id === selectedIncidentId) || null,
    [incidents, selectedIncidentId],
  );

  async function loadIncidents(currentFilter = statusFilter) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getIncidents(token, currentFilter || undefined);
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

  const onCreateFormChange = (event) => {
    const { name: fieldName, value } = event.target;
    setCreateForm((previous) => ({ ...previous, [fieldName]: value }));
  };

  const onCreateIncident = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await createIncident(token, createForm, createFiles);
      setSuccessMessage('Incident created successfully.');
      setCreateForm({
        location: '',
        category: '',
        description: '',
        priority: 'MEDIUM',
        preferredContact: '',
      });
      setCreateFiles([]);
      await loadIncidents(statusFilter);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onCreateComment = async (event) => {
    event.preventDefault();
    if (!selectedIncidentId || !commentText.trim()) {
      return;
    }

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

  const onUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateIncidentComment(token, commentId, editingCommentText.trim());
      setEditingCommentId(null);
      setEditingCommentText('');
      setSuccessMessage('Comment updated.');
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onDeleteComment = async (commentId) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteIncidentComment(token, commentId);
      setSuccessMessage('Comment deleted.');
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onStatusUpdate = async (event) => {
    event.preventDefault();

    if (!selectedIncidentId) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateIncidentStatus(token, selectedIncidentId, statusUpdateForm);
      setSuccessMessage('Incident status updated.');
      await loadIncidents(statusFilter);
      await loadIncidentDetails(selectedIncidentId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onAssignTechnician = async (event) => {
    event.preventDefault();
    if (!selectedIncidentId || !technicianId) {
      return;
    }

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

  const onAddAttachments = async (event) => {
    event.preventDefault();
    if (!selectedIncidentId || extraFiles.length === 0) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await addIncidentAttachments(token, selectedIncidentId, extraFiles);
      setExtraFiles([]);
      setSuccessMessage('Attachments uploaded.');
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

      <section className="panel create-panel">
        <h2>Create New Incident</h2>
        <form className="incident-form" onSubmit={onCreateIncident}>
          <input
            name="location"
            value={createForm.location}
            onChange={onCreateFormChange}
            placeholder="Location"
            required
          />
          <input
            name="category"
            value={createForm.category}
            onChange={onCreateFormChange}
            placeholder="Category"
            required
          />
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
          <textarea
            name="description"
            value={createForm.description}
            onChange={onCreateFormChange}
            placeholder="Describe the issue"
            required
          />
          <label className="upload-field">
            Attach up to 3 images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setCreateFiles(Array.from(event.target.files || []).slice(0, 3))}
            />
          </label>
          <button type="submit">Create Incident</button>
        </form>
      </section>

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
                  <strong>Reporter:</strong> {selectedIncident.reportedByName}
                </p>
                <p>
                  <strong>Technician:</strong> {selectedIncident.assignedTechnicianName || '-'}
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

                <form onSubmit={onAddAttachments} className="inline-form">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) =>
                      setExtraFiles(Array.from(event.target.files || []).slice(0, 3))
                    }
                  />
                  <button type="submit">Upload</button>
                </form>
              </div>

              {canAssign ? (
                <form className="inline-form" onSubmit={onAssignTechnician}>
                  <select value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}>
                    <option value="">Select technician</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.name} ({technician.email})
                      </option>
                    ))}
                  </select>
                  <button type="submit">Assign Technician</button>
                </form>
              ) : null}

              {canUpdateStatus ? (
                <form className="status-form" onSubmit={onStatusUpdate}>
                  <h3>Update Status</h3>
                  <select
                    value={statusUpdateForm.status}
                    onChange={(event) =>
                      setStatusUpdateForm((previous) => ({
                        ...previous,
                        status: event.target.value,
                      }))
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <input
                    value={statusUpdateForm.reason}
                    onChange={(event) =>
                      setStatusUpdateForm((previous) => ({
                        ...previous,
                        reason: event.target.value,
                      }))
                    }
                    placeholder="Reason (for REJECTED)"
                  />
                  <textarea
                    value={statusUpdateForm.resolutionNotes}
                    onChange={(event) =>
                      setStatusUpdateForm((previous) => ({
                        ...previous,
                        resolutionNotes: event.target.value,
                      }))
                    }
                    placeholder="Resolution notes (for RESOLVED)"
                  />
                  <button type="submit">Apply Status</button>
                </form>
              ) : null}

              <section className="comments-block">
                <h3>Comments</h3>

                <form onSubmit={onCreateComment} className="inline-form comment-create">
                  <input
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Add a comment"
                    required
                  />
                  <button type="submit">Post</button>
                </form>

                <ul className="comment-list">
                  {comments.map((comment) => (
                    <li key={comment.id}>
                      <header>
                        <strong>{comment.authorName}</strong>
                        <small>
                          {comment.authorRole} | {formatDateTime(comment.updatedAt)}
                        </small>
                      </header>

                      {editingCommentId === comment.id ? (
                        <div className="inline-form">
                          <input
                            value={editingCommentText}
                            onChange={(event) => setEditingCommentText(event.target.value)}
                          />
                          <button type="button" onClick={() => onUpdateComment(comment.id)}>
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p>{comment.message}</p>
                      )}

                      {editingCommentId !== comment.id ? (
                        <div className="comment-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.message);
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" onClick={() => onDeleteComment(comment.id)}>
                            Delete
                          </button>
                        </div>
                      ) : null}
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
