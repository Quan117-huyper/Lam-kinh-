export default function Header({ onExport, onFlyToAll, onTogglePanel }) {
  return (
    <header className="topbar">
      <div className="brand" aria-label="Lâm Kính">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path d="M24 5C14 12 8 21 9 31c1 8 8 13 15 12 9-1 15-8 15-17C39 17 32 10 24 5Z" />
            <path className="vein" d="M24 36V15m0 13-8-6m8 9 8-7" />
          </svg>
        </span>
        <span>
          <strong>LÂM KÍNH</strong>
          <small>VIETNAM FOREST 3D</small>
        </span>
      </div>
      <div className="top-actions">
        <button className="icon-button" id="exportMap" onClick={onExport} title="Xuất ảnh bản đồ PNG" aria-label="Xuất ảnh bản đồ PNG">
          <svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" /></svg>
        </button>
        <button className="icon-button" id="resetView" onClick={onFlyToAll} title="Về góc nhìn Việt Nam" aria-label="Về góc nhìn Việt Nam">
          <svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7M5 10v10h14V10M9 20v-6h6v6" /></svg>
        </button>
        <button className="icon-button" id="togglePanel" onClick={onTogglePanel} title="Ẩn/hiện bảng điều khiển" aria-label="Ẩn hiện bảng điều khiển">
          <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
    </header>
  );
}
