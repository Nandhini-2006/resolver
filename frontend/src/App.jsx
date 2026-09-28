import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const SERVICES = [
  "Amazon EC2", "Amazon S3", "AWS Lambda", "Amazon RDS", "Amazon DynamoDB",
  "Amazon ECR", "AWS IAM", "AWS CloudFormation", "Amazon SQS", "Amazon SNS",
  "Amazon API Gateway", "Amazon CloudWatch", "Amazon VPC", "Amazon ECS",
  "Amazon EKS", "AWS Secrets Manager",
];

const EXAMPLES = [
  { service: "Amazon S3", error: "AccessDenied", context: "Application cannot download an S3 object." },
  { service: "Amazon EC2", error: "InvalidAMIID.NotFound", context: "The specified AMI cannot be found when launching the instance." },
  { service: "AWS Lambda", error: "Task timed out", context: "Function times out after 3 seconds when calling an external API." },
  { service: "Amazon RDS", error: "Connection refused", context: "App in a private subnet cannot reach the database." },
];

// The model may return "Likely Cause / Diagnosis / Possible Solution / Verification".
// Split them into sections when present; otherwise show the raw text.
const LABELS = ["Likely Cause", "Probable Cause", "Diagnosis", "Possible Solution", "Solution", "Verification"];

function parseSections(text) {
  const pattern = new RegExp(`^\\s*(?:\\*\\*)?(${LABELS.join("|")})(?:\\*\\*)?\\s*:\\s*`, "im");
  const lines = text.split("\n");
  const sections = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(pattern);
    if (m) {
      current = { title: m[1], body: line.replace(pattern, "").trim() };
      sections.push(current);
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  const clean = sections
    .map((s) => ({ ...s, body: s.body.trim() }))
    .filter((s) => s.body);
  return clean.length ? clean : null;
}

export default function App() {
  const [form, setForm] = useState({ service: SERVICES[0], error: "", context: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!form.error.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: form.service,
          error: form.error.trim(),
          context: form.context.trim(),
        }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot reach the backend. Make sure FastAPI is running on port 8000."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result.diagnosis).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const sections = result ? parseSections(result.diagnosis) : null;

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <span className="mark" />
          <span>AWS Error Resolver</span>
        </div>
        <span className="meta">Qwen2.5-3B · QLoRA</span>
      </header>

      <main className="grid">
        <section className="panel">
          <h1>Paste the error.<br />Get the fix.</h1>
          <p className="lede">
            Choose the AWS service, enter the error code or message, and add any
            context you have. The model returns a probable cause and remediation.
          </p>

          <form onSubmit={submit}>
            <label>
              Service
              <select value={form.service} onChange={set("service")}>
                {SERVICES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>

            <label>
              Error
              <input
                type="text"
                placeholder="e.g. AccessDenied: Access Denied"
                value={form.error}
                onChange={set("error")}
                className="mono"
                required
              />
            </label>

            <label>
              Context <span className="opt">optional</span>
              <textarea
                rows={4}
                placeholder="What were you doing when it happened?"
                value={form.context}
                onChange={set("context")}
              />
            </label>

            <button type="submit" disabled={loading || !form.error.trim()}>
              {loading ? "Diagnosing…" : "Diagnose"}
            </button>
          </form>

          <div className="examples">
            <p>Try an example</p>
            <div className="chips">
              {EXAMPLES.map((ex) => (
                <button
                  type="button"
                  key={ex.service + ex.error}
                  className="chip"
                  onClick={() => setForm(ex)}
                >
                  <b>{ex.service.replace(/^(Amazon|AWS) /, "")}</b> {ex.error}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel output" aria-live="polite">
          {!result && !loading && !error && (
            <div className="empty">
              <div className="bar" />
              <p>The diagnosis will appear here.</p>
            </div>
          )}

          {loading && (
            <div className="empty">
              <div className="bar running" />
              <p>The model is analysing your error. This can take a few seconds.</p>
            </div>
          )}

          {error && (
            <div className="alert">
              <strong>Request failed</strong>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="result">
              <div className="result-head">
                <div>
                  <div className="svc">{result.service}</div>
                  <div className="err mono">{result.error}</div>
                </div>
                <button type="button" className="ghost" onClick={copy}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {sections ? (
                sections.map((s) => (
                  <div className="sec" key={s.title}>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                ))
              ) : (
                <div className="sec"><h3>Diagnosis</h3><p>{result.diagnosis}</p></div>
              )}

              <p className="note">
                This is a probable suggestion. Verify before changing production infrastructure.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer>AWS Error Resolver · For educational use</footer>
    </div>
  );
}
