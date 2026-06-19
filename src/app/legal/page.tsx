import { StatusPill } from "@/components/status-pill";

const documents = [
  "Booking Terms",
  "Credit Terms",
  "Dangerous Goods Policy",
  "Delivery Disclaimer",
  "Privacy Policy",
  "Collection Notice",
  "Data Retention & Destruction",
  "Information Security"
];

export default function LegalPage() {
  return (
    <main className="page stack">
      <span className="eyebrow">Legal</span>
      <h1>Legal Library</h1>
      <p className="lead">
        Source documents exist, but approved customer-facing copy is not final until the policy owners
        complete review.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Status</th>
              <th>Source state</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document}>
                <td>{document}</td>
                <td><StatusPill tone="red">Not Published</StatusPill></td>
                <td>Awaiting approved release copy</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
