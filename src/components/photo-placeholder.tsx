export function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="photo-placeholder" role="img" aria-label={label}>
      <span className="eyebrow">Image Pending</span>
      <h3>{label}</h3>
      <p className="small">Black-and-white operational photography is not approved yet.</p>
    </div>
  );
}
