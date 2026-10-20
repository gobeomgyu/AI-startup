import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TODO Workspace",
  description: "팀의 할 일을 정리하는 공간",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="shell">
            <aside className="sidebar">
              <Link className="brand" href="/tasks">
                <span className="brand-mark">✓</span>
                <span>
                  TODO<span className="brand-muted"> / Workspace</span>
                </span>
              </Link>
              <div className="nav-label">WORKSPACE</div>
              <nav aria-label="주 메뉴">
                <Link className="nav-link" href="/tasks">
                  ▤ <span>할 일</span>
                </Link>
                <Link className="nav-link" href="/settings">
                  ⚙ <span>설정</span>
                </Link>
              </nav>
              <div className="sidebar-foot">하나씩, 분명하게.</div>
            </aside>
            <div className="main-shell">
              <header className="topbar">
                <span>내 작업 공간</span>
                <span className="topbar-right">TODO / WORKSPACE</span>
              </header>
              <main>{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
