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
  const [createFormErrors, setCreateFormErrors] = useState({
    location: '',
    category: '',
    description: '',
    preferredContact: '',
    files: '',
  });

  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingCommentError, setEditingCommentError] = useState('');

  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: 'IN_PROGRESS',
    reason: '',
    resolutionNotes: '',
  });
  const [statusFormErrors, setStatusFormErrors] = useState({
    reason: '',
    resolutionNotes: '',
  });
  const [technicianId, setTechnicianId] = useState('');
  const [technicianError, setTechnicianError] = useState('');
  const [extraFiles, setExtraFiles] = useState([]);
  const [extraFilesError, setExtraFilesError] = useState('');

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
    setCreateFormErrors((previous) => ({ ...previous, [fieldName]: '' }));
  };

  const hasOnlyImages = (files) => files.every((file) => file.type.startsWith('image/'));

  const validateCreateForm = () => {
    const errors = {
      location: '',
      category: '',
      description: '',
      preferredContact: '',
      files: '',
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

    if (createFiles.length > 3) {
      errors.files = 'You can upload up to 3 images.';
      isValid = false;
    } else if (createFiles.length > 0 && !hasOnlyImages(createFiles)) {
      errors.files = 'Only image files are allowed.';
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
      setCreateFormErrors({
        location: '',
        category: '',
        description: '',
        preferredContact: '',
        files: '',
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

  const onUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      setEditingCommentError('Comment cannot be empty.');
      return;
    }

    if (editingCommentText.trim().length < 2) {
      setEditingCommentError('Comment must be at least 2 characters.');
      return;
    }

    setEditingCommentError('');

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

    const errors = { reason: '', resolutionNotes: '' };
    let isValid = true;

    if (statusUpdateForm.status === 'REJECTED' && !statusUpdateForm.reason.trim()) {
      errors.reason = 'Reason is required for REJECTED status.';
      isValid = false;
    }

    if (
      (statusUpdateForm.status === 'RESOLVED' || statusUpdateForm.status === 'CLOSED') &&
      !statusUpdateForm.resolutionNotes.trim()
    ) {
      errors.resolutionNotes = `Resolution notes are required for ${statusUpdateForm.status}.`;
      isValid = false;
    }

    setStatusFormErrors(errors);
    if (!isValid) {
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

  const onAddAttachments = async (event) => {
    event.preventDefault();
    if (!selectedIncidentId) {
      return;
    }

    if (extraFiles.length === 0) {
      setExtraFilesError('Please select at least one file.');
      return;
    }

    if (extraFiles.length > 3) {
      setExtraFilesError('You can upload up to 3 images at a time.');
      return;
    }

    if (!hasOnlyImages(extraFiles)) {
      setExtraFilesError('Only image files are allowed.');
      return;
    }

    setExtraFilesError('');

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await addIncidentAttachments(token, selectedIncidentId, extraFiles);
      setExtraFiles([]);
      setExtraFilesError('');
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
          <label className="upload-field">
            Attach up to 3 images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                setCreateFiles(Array.from(event.target.files || []).slice(0, 3));
                setCreateFormErrors((previous) => ({ ...previous, files: '' }));
              }}
            />
          </label>
          {createFormErrors.files ? <p className="form-error">{createFormErrors.files}</p> : null}
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

                <form onSubmit={onAddAttachments} className="inline-form" noValidate>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => {
                      setExtraFiles(Array.from(event.target.files || []).slice(0, 3));
                      setExtraFilesError('');
                    }}
                  />
                  {extraFilesError ? <p className="form-error">{extraFilesError}</p> : null}
                  <button type="submit">Upload</button>
                </form>
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

              {canUpdateStatus ? (
                <form className="status-form" onSubmit={onStatusUpdate} noValidate>
                  <h3>Update Status</h3>
                  <select
                    value={statusUpdateForm.status}
                    onChange={(event) => {
                      setStatusUpdateForm((previous) => ({
                        ...previous,
                        status: event.target.value,
                      }));
                      setStatusFormErrors({ reason: '', resolutionNotes: '' });
                    }}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <input
                    value={statusUpdateForm.reason}
                    onChange={(event) => {
                      setStatusUpdateForm((previous) => ({
                        ...previous,
                        reason: event.target.value,
                      }));
                      setStatusFormErrors((previous) => ({ ...previous, reason: '' }));
                    }}
                    placeholder="Reason (for REJECTED)"
                  />
                  {statusFormErrors.reason ? <p className="form-error">{statusFormErrors.reason}</p> : null}
                  <textarea
                    value={statusUpdateForm.resolutionNotes}
                    onChange={(event) => {
                      setStatusUpdateForm((previous) => ({
                        ...previous,
                        resolutionNotes: event.target.value,
                      }));
                      setStatusFormErrors((previous) => ({ ...previous, resolutionNotes: '' }));
                    }}
                    placeholder="Resolution notes (for RESOLVED)"
                  />
                  {statusFormErrors.resolutionNotes ? <p className="form-error">{statusFormErrors.resolutionNotes}</p> : null}
                  <button type="submit">Apply Status</button>
                </form>
              ) : null}

              <section className="comments-block">
                <h3>Comments</h3>

                <form onSubmit={onCreateComment} className="inline-form comment-create" noValidate>
                  <input
                    value={commentText}
                    onChange={(event) => {
                      setCommentText(event.target.value);
                      setCommentError('');
                    }}
                    placeholder="Add a comment"
                    required
                  />
                  {commentError ? <p className="form-error">{commentError}</p> : null}
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
                            onChange={(event) => {
                              setEditingCommentText(event.target.value);
                              setEditingCommentError('');
                            }}
                          />
                          {editingCommentError ? <p className="form-error">{editingCommentError}</p> : null}
                          <button type="button" onClick={() => onUpdateComment(comment.id)}>
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText('');
                              setEditingCommentError('');
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
