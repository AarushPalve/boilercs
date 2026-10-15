import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
      <p className="eyebrow">404</p>
      <h1>This page is not in the archive.</h1>
      <p className="muted">The lesson or exam you were looking for could not be found.</p>
      <Link className="btn btn--primary" href="/" style={{ marginTop: '1rem', display: 'inline-block' }}>
        Return to the classes
      </Link>
    </div>
  );
}
