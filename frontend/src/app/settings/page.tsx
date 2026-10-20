"use client";

import { useTheme } from "@/components/theme-provider";

export default function SettingsPage(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  return (
    <div className="page-wrap settings-wrap">
      <div className="eyebrow">WORKSPACE / SETTINGS</div>
      <div className="page-heading">
        <div>
          <h1>설정</h1>
          <p>작업 공간에 맞는 화면 분위기를 선택하세요.</p>
        </div>
      </div>
      <section className="panel content-panel">
        <div className="section-heading">
          <div>
            <h2>화면 테마</h2>
            <p>선택한 테마는 이 브라우저에 저장됩니다.</p>
          </div>
        </div>
        <div className="theme-grid">
          <button
            type="button"
            className={`theme-option kinetic-preview ${theme === "kinetic" ? "selected" : ""}`}
            aria-pressed={theme === "kinetic"}
            onClick={() => {
              setTheme("kinetic");
            }}
          >
            <div className="theme-sample">
              <div className="sample-sidebar" />
              <div className="sample-content">
                <span />
                <span />
                <span />
              </div>
            </div>
            <span className="theme-name">
              Kinetic Clarity <span>{theme === "kinetic" ? "✓ 선택됨" : ""}</span>
            </span>
            <span className="theme-description">차분한 슬레이트와 선명한 인디고</span>
          </button>
          <button
            type="button"
            className={`theme-option warm-preview ${theme === "warm" ? "selected" : ""}`}
            aria-pressed={theme === "warm"}
            onClick={() => {
              setTheme("warm");
            }}
          >
            <div className="theme-sample">
              <div className="sample-sidebar" />
              <div className="sample-content">
                <span />
                <span />
                <span />
              </div>
            </div>
            <span className="theme-name">
              Warm Focus <span>{theme === "warm" ? "✓ 선택됨" : ""}</span>
            </span>
            <span className="theme-description">따뜻한 에스프레소와 테라코타</span>
          </button>
        </div>
      </section>
    </div>
  );
}
