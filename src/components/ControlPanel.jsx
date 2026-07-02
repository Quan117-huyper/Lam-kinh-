export default function ControlPanel({ 
  stats, 
  status, 
  analysis, 
  spectralMode,
  isDrawing, 
  onToggleDrawing, 
  onSetDensity, 
  onToggleReference, 
  onToggleSatellite, 
  onSetSpectralMode, 
  onToggleForest, 
  onToggleZone 
}) {
  return (
    <aside className="panel" id="controlPanel">
      <div className="panel-intro">
        <span className="eyebrow">BẢN ĐỒ TƯƠNG TÁC</span>
        <h1>Lô rừng 68 ha<br/><em>phủ xanh từng đường biên.</em></h1>
        <p>Trực quan hóa toàn bộ polygon từ KML bằng ranh giới chính xác và lớp cây 3D procedural.</p>
      </div>

      <div className="draw-tools">
        <button id="drawPolygon" className={`draw-primary ${isDrawing ? 'active' : ''}`} onClick={onToggleDrawing}>
          <svg viewBox="0 0 24 24"><path d="m5 6 6-3 8 5-2 10-10 2-4-8Z"/><circle cx="5" cy="6" r="1.5"/><circle cx="19" cy="8" r="1.5"/><circle cx="17" cy="18" r="1.5"/></svg>
          <span>{isDrawing ? "Hủy vẽ polygon" : "Vẽ vùng phân tích"}</span>
        </button>
      </div>

      <section className="control-section">
        <div className="section-heading"><span>LỚP DỮ LIỆU</span></div>
        <label className="layer-row">
          <span className="layer-icon osm"></span>
          <span><strong>Nền tham chiếu</strong><small>Ảnh nét để định vị, không đại diện ngày chụp</small></span>
          <input className="switch" id="referenceToggle" type="checkbox" defaultChecked onChange={e => onToggleReference?.(e.target.checked)} />
        </label>
        <label className="layer-row">
          <span className="layer-icon spectral"></span>
          <span><strong>Ảnh Sentinel-2</strong><small id="spectralStatus">{status.spectralStatus}</small></span>
          <input className="switch" id="satelliteToggle" type="checkbox" disabled={status.satelliteDisabled} checked={status.satelliteChecked} onChange={e => onToggleSatellite?.(e.target.checked)} />
        </label>
        <p className="map-update-time" id="mapUpdatedAt">{status.mapUpdatedAt}</p>
        <div className="band-picker">
          <span>TỔ HỢP BAND</span>
          <select id="spectralMode" value={spectralMode} disabled={status.spectralModeDisabled} onChange={e => onSetSpectralMode?.(e.target.value)}>
            <optgroup label="Hiển thị">
              <option value="true-color">True Color · RGB</option>
              <option value="false-color">False Color · tán lá</option>
            </optgroup>
            <optgroup label="Ranh giới & sinh khối">
              <option value="ndvi">NDVI · độ xanh</option>
              <option value="evi">EVI · tán dày</option>
            </optgroup>
            <optgroup label="Sức khỏe lá">
              <option value="ndre">NDRE · red edge</option>
              <option value="gci">GCI · diệp lục</option>
            </optgroup>
            <optgroup label="Nước & stress">
              <option value="ndmi">NDMI · độ ẩm</option>
            </optgroup>
          </select>
        </div>
        <label className="layer-row">
          <span className="layer-icon forest"></span>
          <span><strong>Rừng 3D</strong><small>Phủ kín bên trong polygon</small></span>
          <input className="switch" id="forestToggle" type="checkbox" onChange={e => onToggleForest?.(e.target.checked)} />
        </label>
        <label className="layer-row">
          <span className="layer-icon zones"></span>
          <span><strong>Ranh giới KML</strong><small>Polygon lô rừng</small></span>
          <input className="switch" id="zoneToggle" type="checkbox" defaultChecked onChange={e => onToggleZone?.(e.target.checked)} />
        </label>
      </section>

      <section className="control-section density-control">
        <div className="section-heading"><span>MẬT ĐỘ HIỂN THỊ</span></div>
        <input id="densityRange" type="range" min="20" max="100" defaultValue="65" step="5" onChange={e => onSetDensity?.(e.target.value)} />
      </section>

      <section className="stats-card">
        <div><small>LÔ RỪNG</small><strong id="visibleRegions">{stats.visibleRegions}</strong><span>polygon</span></div>
        <div><small>DIỆN TÍCH</small><strong id="totalArea">{stats.totalArea}</strong><span>hecta</span></div>
        <div><small>CÂY 3D</small><strong id="carbonTotal">{stats.carbonTotal}</strong><span>đối tượng</span></div>
      </section>

      <section className="health-card" id="healthCard">
        <div className="health-head">
          <span>ĐÁNH GIÁ THẢM THỰC VẬT</span>
          <strong id="analysisConfidence">{analysis.confidence}</strong>
        </div>
        <div className="health-score">
          <div><small>NDVI TB · ĐỘ XANH</small><strong id="ndviMean">{analysis.mean}</strong><span className="metric-detail">Trung vị {analysis.ndviMedian}</span></div>
          <div><small>EVI · TÁN DÀY</small><strong>{analysis.evi}</strong></div>
          <div><small>NDRE · RED EDGE</small><strong>{analysis.ndre}</strong></div>
          <div><small>GCI · DIỆP LỤC</small><strong>{analysis.gci}</strong></div>
          <div><small>NDMI TB · ĐỘ ẨM</small><strong id="ndmiMean">{analysis.ndmi}</strong><span className="metric-detail">Trung vị {analysis.ndmiMedian}</span></div>
          <div className="health-result"><small>ĐÁNH GIÁ LÔ ĐẤT</small><strong id="healthClass">{analysis.healthClass}</strong></div>
        </div>
        <div className="ndvi-meter"><i id="ndviBar" style={{left: analysis.barLeft}}></i><span></span></div>
        <p id="analysisNote">{analysis.note}</p>
        <p className="analysis-limit">LAI cần mô hình hiệu chỉnh thực địa; VV/VH cần Sentinel-1; CWSI cần dữ liệu nhiệt. Chưa hiển thị ước tính khi thiếu các nguồn này.</p>
      </section>
    </aside>
  );
}
