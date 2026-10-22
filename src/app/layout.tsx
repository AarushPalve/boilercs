import type { Metadata } from 'next';
import Link from 'next/link';
import RuntimeBootstrap from '@/components/RuntimeBootstrap';
import Icon from '@/components/Icon';
import './globals.css';

export const metadata: Metadata = {
  title: 'Boiler CS — Purdue CS Practice & Exam Archive',
  description:
    'Practice and exam archive for Purdue Computer Science. Browse courses, open practice exams, and run or grade Java in the browser.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+Garamond:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RuntimeBootstrap />
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">
              <Icon name="code" size={20} className="brand-icon" />
              Boiler&nbsp;<span className="brand-accent">CS</span>
            </Link>
            <nav className="site-nav">
              <Link href="/">Courses</Link>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSeIQh_Rdr3To4nMsr63NebB6NoXQ8PlOskTonTcE8QO1YKF9A/viewform?usp=publish-editor"
                target="_blank"
                rel="noreferrer"
                className="nav-feedback"
              >
                <Icon name="message" size={16} /> Feedback
              </a>
              <a
                href="https://github.com/AarushPalve/boilercs"
                target="_blank"
                rel="noreferrer"
                className="nav-github"
              >
                <Icon name="github" size={16} /> GitHub
              </a>
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
