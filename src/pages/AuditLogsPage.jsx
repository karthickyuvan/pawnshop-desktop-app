import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    invoke("get_audit_logs_cmd").then(setLogs);
  }, []);

  return (
    <div>
      <h2>Audit Logs</h2>

      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Date</th>
            <th>User ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{l.created_at}</td>
              <td>{l.user_id}</td>
              <td>{l.action}</td>
            </tr>
          ))}

          {logs.length === 0 && (
            <tr>
              <td colSpan="3">No audit logs</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
