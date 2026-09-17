import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Card, Spinner, StatusPill } from "../../components/ui";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function Field({ label, value }) {
  return (
    <div className="pf-row">
      <span className="pf-label">{label}</span>
      <span className="pf-value">
        {value || <em className="pf-empty">—</em>}
      </span>
    </div>
  );
}

export default function EmploymentDetailsPage() {
  const [employment, setEmployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { employment: data } = await api.get(
          "/api/employees/me/employment",
        );
        if (alive) {
          setEmployment(data);
          setError(null);
        }
      } catch (err) {
        if (alive) setError(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading)
    return (
      <div className="ws-page">
        <div className="ws-page-head">
          <h1>My Employment</h1>
          <span className="ws-scope">Your employment record</span>
        </div>
        <Spinner />
      </div>
    );
  if (error) {
    return (
      <div className="ws-page">
        <div className="ws-page-head">
          <h1>My Employment</h1>
          <span className="ws-scope">Your employment record</span>
        </div>
        <Card>
          <div className="ws-state ws-err">
            {error.status === 403
              ? "This employment record is only available to the signed-in employee."
              : "Could not load your employment details."}
          </div>
        </Card>
      </div>
    );
  }

  const e = employment || {};

  return (
    <div className="ws-page">
      <div className="ws-page-head">
        <h1>My Employment</h1>
        <span className="ws-scope">Read-only employment information</span>
      </div>

      <div className="ws-grid2">
        <Card title="Employment overview" sub="Current role and work status">
          <Field label="Employee ID" value={e.employeeId} />
          <Field label="Employee name" value={e.fullName} />
          <Field label="Current designation" value={e.designation} />
          <Field label="Department" value={e.department} />
          <Field
            label="Employment status"
            value={e.status ? <StatusPill value={e.status} /> : "—"}
          />
          <Field label="Employment type" value={e.employmentType} />
          <Field label="Joining date" value={formatDate(e.joiningDate)} />
          <Field label="Probation status" value={e.probationStatus} />
        </Card>

        <Card
          title="Organization information"
          sub="Manager and work contact details"
        >
          <Field
            label="Reporting manager"
            value={e.reportingManager || e.manager}
          />
          <Field label="Work location" value={e.workLocation || e.location} />
          <Field label="Company email" value={e.companyEmail || e.email} />
          <Field label="Work contact" value={e.workContact || e.phone} />
          <Field label="Company contact" value={e.workContact || e.phone} />
        </Card>
      </div>

      <Card
        title="Employment details"
        sub="Read-only information managed by HR"
      >
        <div className="pf-row">
          <span className="pf-label">Employee</span>
          <span className="pf-value">{e.fullName || "—"}</span>
        </div>
        <div className="pf-row">
          <span className="pf-label">Department</span>
          <span className="pf-value">{e.department || "—"}</span>
        </div>
        <div className="pf-row">
          <span className="pf-label">Designation</span>
          <span className="pf-value">{e.designation || "—"}</span>
        </div>
        <div className="pf-row">
          <span className="pf-label">Status</span>
          <span className="pf-value">
            {e.status ? <StatusPill value={e.status} /> : "—"}
          </span>
        </div>
        <div className="pf-row">
          <span className="pf-label">Manager</span>
          <span className="pf-value">
            {e.reportingManager || e.manager || "—"}
          </span>
        </div>
        <div className="pf-row">
          <span className="pf-label">Location</span>
          <span className="pf-value">
            {e.workLocation || e.location || "—"}
          </span>
        </div>
        <div className="pf-row">
          <span className="pf-label">Company email</span>
          <span className="pf-value">{e.companyEmail || e.email || "—"}</span>
        </div>
        <div className="pf-row">
          <span className="pf-label">Work contact</span>
          <span className="pf-value">{e.workContact || e.phone || "—"}</span>
        </div>
      </Card>
    </div>
  );
}
