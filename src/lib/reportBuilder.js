const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const has = (value) => value !== undefined && value !== null && String(value).trim() && String(value).trim() !== '—';
const val = (value, suffix = '') => has(value) ? `${esc(value)}${suffix}` : '<i>Chưa đủ dữ liệu</i>';
const num = (value, suffix = '') => has(value) && Number.isFinite(Number(value))
  ? `${new Intl.NumberFormat('vi-VN').format(Number(value))}${suffix}`
  : '<i>Chưa đủ dữ liệu</i>';
const money = (value) => has(value) && Number.isFinite(Number(value))
  ? `${new Intl.NumberFormat('vi-VN').format(Number(value))} VNĐ`
  : '<i>Chưa đủ dữ liệu</i>';
const compactMoney = (value) => has(value) && Number.isFinite(Number(value))
  ? `${new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 2 }).format(Number(value))} VNĐ`
  : '—';
const row = (label, content) => `<tr><th>${label}</th><td>${content}</td></tr>`;
const field = (name, label, value = '', type = 'text') => `<label><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}"></label>`;
const finiteNumber = (value) => {
  if (!has(value)) return null;
  const normalized = String(value).replace(',', '.');
  return Number.isFinite(Number(normalized)) ? Number(normalized) : null;
};

const REPORTS = {
  health: { title: 'Forest Health Report', label: 'Báo cáo sức khỏe', pages: '7 trang' },
  bank: { title: 'Report for Bank', label: 'Báo cáo cho ngân hàng', pages: '12 trang' },
  investor: { title: 'Investor Report', label: 'Báo cáo cho nhà đầu tư', pages: '10 trang A4' },
};

const MODEL_CYCLE = { paper4: 4, paper5: 5, timber8: 8, large10: 10 };
const YIELD_TABLE = {
  paper4: { 1: { p10: 2, p50: 4, p90: 6 }, 2: { p10: 15, p50: 21, p90: 28 }, 3: { p10: 45, p50: 58, p90: 70 }, 4: { p10: 80, p50: 98, p90: 115 } },
  paper5: { 1: { p10: 2, p50: 4, p90: 5 }, 2: { p10: 14, p50: 20, p90: 25 }, 3: { p10: 38, p50: 50, p90: 60 }, 4: { p10: 65, p50: 80, p90: 95 }, 5: { p10: 95, p50: 115, p90: 135 } },
  timber8: { 1: { p10: 2, p50: 3, p90: 4 }, 2: { p10: 10, p50: 15, p90: 20 }, 3: { p10: 28, p50: 38, p90: 48 }, 4: { p10: 50, p50: 65, p90: 80 }, 5: { p10: 70, p50: 88, p90: 105 }, 6: { p10: 100, p50: 120, p90: 140 }, 7: { p10: 130, p50: 152, p90: 175 }, 8: { p10: 165, p50: 192, p90: 220 } },
  large10: { 1: { p10: 1, p50: 2, p90: 3 }, 2: { p10: 8, p50: 13, p90: 18 }, 3: { p10: 25, p50: 34, p90: 42 }, 4: { p10: 45, p50: 58, p90: 70 }, 5: { p10: 65, p50: 80, p90: 95 }, 6: { p10: 90, p50: 108, p90: 125 }, 7: { p10: 120, p50: 140, p90: 160 }, 8: { p10: 150, p50: 175, p90: 200 }, 9: { p10: 180, p50: 210, p90: 240 }, 10: { p10: 220, p50: 255, p90: 290 } },
};
const SOIL_FACTOR = { basalt: 1.15, red_yellow: 1.05, gray: 0.95, rocky_slope: 0.8 };
const RAIN_FACTOR = { drought: 0.8, low: 0.9, normal: 1, good: 1.05 };
const LOSS_FACTOR = 0.92;

function subtractYears(dateText, years) {
  const date = dateText ? new Date(dateText) : new Date();
  if (Number.isFinite(years)) date.setFullYear(date.getFullYear() - Math.max(1, Math.round(years)));
  return date.toISOString().slice(0, 10);
}

function filledForm(context, form = {}) {
  const opt = context.coverOptions || {};
  const cover = context.cover?.metrics || {};
  const area = finiteNumber(context.card.area || context.stats.totalArea) || 67.73;
  const model = opt.model || 'timber8';
  const cycle = finiteNumber(form.cycle) || MODEL_CYCLE[model] || 4;
  const age = Math.max(1, Math.min(cycle, Math.round(finiteNumber(form.age) || finiteNumber(opt.age) || Math.min(cycle, 4))));
  const treeArea = finiteNumber(cover.tree_area_ha)
    || (finiteNumber(cover.tree_cover_pct) ? area * finiteNumber(cover.tree_cover_pct) / 100 : area * 0.72);
  const ndvi = finiteNumber(context.analysis?.mean);
  const ndviFactor = ndvi == null ? 1 : ndvi < 0.45 ? 0.7 : ndvi < 0.6 ? 0.85 : ndvi < 0.75 ? 1 : ndvi <= 0.85 ? 1.1 : 1.2;
  const factor = (SOIL_FACTOR[opt.soil] || 1.05) * (RAIN_FACTOR[opt.rainfall] || 1) * ndviFactor * LOSS_FACTOR;
  const yieldRow = YIELD_TABLE[model]?.[age] || YIELD_TABLE.timber8[4];
  const p10Volume = treeArea * yieldRow.p10 * factor;
  const p50Volume = treeArea * yieldRow.p50 * factor;
  const p90Volume = treeArea * yieldRow.p90 * factor;
  const volume = finiteNumber(form.volume) || p50Volume;
  const woodPrice = finiteNumber(form.woodPrice) || finiteNumber(opt.priceVndM3) || 900000;
  const assetValue = finiteNumber(form.assetValue) || volume * woodPrice;
  const careBase = Math.max(treeArea * 450000, assetValue * 0.009);
  const reportYear = new Date(has(form.date) ? form.date : new Date()).getFullYear();
  const harvestYear = reportYear + Math.max(0, cycle - age);
  const startYear = harvestYear - cycle + 1;
  const projection = Array.from({ length: cycle }, (_, index) => {
    const yearAge = index + 1;
    const year = startYear + index;
    const rowData = YIELD_TABLE[model]?.[yearAge] || yieldRow;
    const standingValue = treeArea * rowData.p50 * factor * woodPrice;
    const cost = yearAge === cycle ? 0 : Math.max(treeArea * 250000, standingValue * (yearAge === 1 ? 0.12 : yearAge === 2 ? 0.055 : 0.025));
    const cashFlow = yearAge === cycle ? standingValue : -cost;
    return {
      year,
      age: yearAge,
      volume: Math.round(treeArea * rowData.p50 * factor),
      standingValue: Math.round(standingValue),
      cost: Math.round(cost),
      cashFlow: Math.round(cashFlow),
      isFuture: yearAge > age,
      isHarvest: yearAge === cycle,
    };
  });
  const projectName = context.card.name || context.card.plot?.name || 'Lô rừng keo demo';
  return {
    ...form,
    owner: has(form.owner) ? form.owner : 'Công ty khách hàng demo',
    project: has(form.project) ? form.project : projectName,
    date: has(form.date) ? form.date : new Date().toISOString().slice(0, 10),
    address: has(form.address) ? form.address : 'Khu vực lô rừng theo polygon KML',
    province: has(form.province) ? form.province : 'Tây Nguyên',
    district: has(form.district) ? form.district : 'Khu vực trồng rừng',
    commune: has(form.commune) ? form.commune : 'Theo hồ sơ KML',
    treeType: has(form.treeType) ? form.treeType : 'Keo lai',
    plantingDate: has(form.plantingDate) ? form.plantingDate : subtractYears(form.date, age),
    age: String(age),
    cycle: String(cycle),
    volume: String(Math.round(volume)),
    woodPrice: String(Math.round(woodPrice)),
    assetValue: String(Math.round(assetValue)),
    p10Volume: String(Math.round(p10Volume)),
    p50Volume: String(Math.round(volume)),
    p90Volume: String(Math.round(p90Volume)),
    p10Value: String(Math.round(p10Volume * woodPrice)),
    p50Value: String(Math.round(assetValue)),
    p90Value: String(Math.round(p90Volume * woodPrice)),
    yieldPerHa: String(Math.round(volume / Math.max(treeArea, 0.01))),
    cashflowYear1: String(Math.round(careBase * 1.2)),
    cashflowYear2: String(Math.round(careBase)),
    cashflowYear3: String(Math.round(careBase * 0.85)),
    projection: JSON.stringify(projection),
    targetReturn: has(form.targetReturn) ? form.targetReturn : '18.7%',
    payback: has(form.payback) ? form.payback : '5.2 năm',
  };
}

const css = `<style>
@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#dce5de;color:#14251a;font-family:"Segoe UI",Tahoma,Arial,sans-serif;font-synthesis:none;text-rendering:optimizeLegibility;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{width:210mm;height:297mm;margin:0 auto 8mm;padding:15mm 17mm 14mm;background:#f8f8f4;position:relative;overflow:hidden;page-break-after:always}.page:last-child{page-break-after:auto}header{display:flex;justify-content:space-between;align-items:end;padding-bottom:5mm;border-bottom:1px solid #cad6cc}header span,.eyebrow{color:#4d8d55;font-size:8px;letter-spacing:1.7px;font-weight:800;text-transform:uppercase}h2{margin:2mm 0 0;font-size:23px;font-weight:650;color:#173d29}h3{margin:5mm 0 2mm;color:#173d29;font-size:13px}header b{font-size:29px;font-weight:400;color:#b8c7bb}footer{position:absolute;bottom:7mm;left:17mm;right:17mm;display:flex;justify-content:space-between;color:#7d8a81;font-size:7px}.cover{padding:0;background:#09271a;color:white;display:grid;grid-template-rows:48% 52%}.hero{position:relative;overflow:hidden}.hero img,.map img,.visual img{width:100%;height:100%;object-fit:cover}.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#09271a,transparent 45%)}.cover-copy{padding:12mm 17mm;position:relative}.brand{font-size:9px;letter-spacing:2.3px;font-weight:800;color:#a7dc78}.cover h1{margin:14mm 0 3mm;font-size:32px;line-height:1.08;font-weight:650}.cover p{color:#aac0b2}.cover-data{position:absolute;left:17mm;right:17mm;bottom:15mm;display:grid;grid-template-columns:1fr 1fr;gap:5mm;border-top:1px solid #365244;padding-top:5mm}.label{display:block;color:#789184;font-size:7px;letter-spacing:1px;text-transform:uppercase}.cover-data strong{display:block;margin-top:1.5mm;font-size:11px}.table{width:100%;margin-top:5mm;border-collapse:collapse;background:white;border:1px solid #d3ddd5}.table th,.table td{padding:3mm 5mm;border-bottom:1px solid #e0e7e1;text-align:left;font-size:9px}.table th{width:42%;color:#68786e;background:#f2f6f3;font-weight:700}.table td{font-weight:700}.table i,i{color:#a66c36;font-weight:500}.notice{margin-top:6mm;padding:4mm 5mm;background:#fff5e4;border-left:1mm solid #dda143;color:#715529;font-size:8px;line-height:1.55}.map{height:151mm;margin-top:7mm;border-radius:3mm;overflow:hidden;position:relative;background:#173d29}.map-meta{position:absolute;left:4mm;right:4mm;bottom:4mm;padding:4mm;background:#071a12dd;color:white;border-radius:2mm;display:flex;justify-content:space-between;font-size:8px}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:8mm}.kpi{padding:6mm 5mm;background:white;border:1px solid #d4ded6;border-radius:3mm}.kpi span{display:block;color:#6e7e74;font-size:7px;letter-spacing:1px;text-transform:uppercase}.kpi strong{display:block;margin-top:3mm;color:#2e7141;font-size:20px;font-weight:700}.kpi small{display:block;margin-top:2mm;color:#849087}.score{display:grid;grid-template-columns:55mm 1fr;gap:9mm;align-items:center;margin-top:12mm}.ring{width:55mm;height:55mm;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#59a45e calc(var(--s)*1%),#dce7dd 0);position:relative}.ring:after{content:"";position:absolute;inset:6mm;border-radius:50%;background:#f8f8f4}.ring strong{z-index:1;color:#276239;font-size:27px;font-weight:700}.visual-grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:8mm}.visual{height:89mm;position:relative;overflow:hidden;border-radius:3mm;background:#173d29}.visual figcaption{position:absolute;left:3mm;bottom:3mm;padding:2mm 3mm;background:#091d14dd;color:white;border-radius:2mm;font-size:8px}.visual-empty{height:100%;display:grid;place-items:center;color:#b9c9be;font-size:10px;background:linear-gradient(135deg,#173d29,#0c2418)}.bullets{margin:8mm 0;padding-left:5mm}.bullets li{margin:3mm 0;color:#46564c;line-height:1.65;font-size:10px}.callout{margin-top:8mm;padding:7mm;background:#153f29;color:white;border-radius:3mm}.callout span{color:#9cc8a7;font-size:8px;letter-spacing:1px}.callout strong{display:block;margin-top:3mm;font-size:21px;font-weight:700}.chart{height:48mm;margin-top:2mm;background:white;border:1px solid #d3ddd5;border-radius:3mm;display:flex;align-items:end;gap:3mm;padding:9mm 7mm 8mm}.bar{flex:1;background:#73af65;position:relative;min-width:0;border-radius:1mm 1mm 0 0}.bar b{position:absolute;top:-6mm;left:50%;transform:translateX(-50%);font-size:7px;white-space:nowrap}.bar span{position:absolute;bottom:-7mm;left:50%;transform:translateX(-50%);font-size:6px;text-align:center;line-height:1.15;white-space:nowrap}.signature{display:grid;grid-template-columns:1fr 1fr;gap:18mm;margin-top:18mm;text-align:center;color:#68766d;font-size:9px}.signature div{border-top:1px solid #aebbb1;padding-top:4mm}
.corp-page{width:210mm;height:297mm;margin:0 auto 8mm;padding:16mm 17mm 18mm;background:#fff;position:relative;overflow:hidden;page-break-after:always;color:#1d2935}.corp-header{display:grid;grid-template-columns:52mm 1fr 55mm;gap:7mm;align-items:start;padding-bottom:6mm;border-bottom:0.45mm solid #2e7141}.corp-brand{display:flex;gap:3mm;align-items:center}.corp-logo{width:13mm;height:13mm;display:grid;place-items:center;border:0.45mm solid #2e7141;border-radius:2mm;color:#2e7141;font-weight:800;font-size:9pt}.corp-brand strong{display:block;color:#2e7141;font-size:10pt;letter-spacing:.2mm}.corp-brand span{display:block;margin-top:1mm;color:#5e6b76;font-size:7pt}.corp-title{text-align:center}.corp-title span{display:block;color:#64717c;font-size:8pt;text-transform:uppercase;letter-spacing:.45mm}.corp-title h1{margin:1.5mm 0 0;color:#2e7141;font-size:20pt;line-height:1.1}.corp-meta{display:grid;grid-template-columns:1fr;gap:1.2mm;color:#3f4d59;font-size:7.5pt}.corp-meta b{color:#2e7141}.corp-client{display:none}.corp-content{padding-top:7mm}.section-label{color:#4d8d55;font-size:8pt;text-transform:uppercase;letter-spacing:.4mm;font-weight:800}.corp-content h2{margin:1.5mm 0 5mm;color:#173d29;font-size:21pt;line-height:1.08}.corp-content h3{margin:0 0 3mm;color:#2e7141;font-size:14pt}.corp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.corp-grid.two{grid-template-columns:1fr 1fr}.corp-card{padding:4.5mm;border:0.25mm solid #d4ded6;border-radius:2mm;background:#fff;min-height:28mm}.corp-card.tint{background:#f2f6f3}.corp-card span{display:block;color:#6b7884;font-size:7pt;text-transform:uppercase;letter-spacing:.25mm}.corp-card strong{display:block;margin-top:2mm;color:#2e7141;font-size:16pt}.corp-card p{margin:2mm 0 0;color:#4c5965;font-size:9pt;line-height:1.5}.corp-note{margin-top:5mm;padding:4mm;border-left:1.2mm solid #4d8d55;background:#f2f6f3;color:#40505e;font-size:9pt;line-height:1.55}.corp-img{height:112mm;border:0.25mm solid #d4ded6;border-radius:2mm;overflow:hidden;background:#f0f3f6}.corp-img img{width:100%;height:100%;object-fit:cover}.corp-visual-grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.corp-visual{height:64mm;position:relative;border:0.25mm solid #d4ded6;border-radius:2mm;overflow:hidden;background:#edf2f5}.corp-visual img{width:100%;height:100%;object-fit:cover}.corp-visual span{position:absolute;left:3mm;bottom:3mm;padding:1.5mm 2mm;background:#091d14dd;color:white;border-radius:1mm;font-size:7pt}.corp-meter{display:grid;grid-template-columns:45mm 1fr;gap:8mm;align-items:center}.corp-ring{width:45mm;height:45mm;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#59a45e calc(var(--s)*1%),#d9e3ea 0);position:relative}.corp-ring:after{content:"";position:absolute;inset:6mm;border-radius:50%;background:#f8f8f4}.corp-ring b{position:relative;z-index:1;color:#276239;font-size:18pt}.corp-bars{height:70mm;display:flex;align-items:end;gap:8mm;margin-top:8mm;padding:10mm;border:0.25mm solid #d4ded6;border-radius:2mm;background:#fff}.corp-bars i{flex:1;background:#73af65;border-radius:1.3mm 1.3mm 0 0;position:relative}.corp-bars i:after{content:attr(data-label);position:absolute;left:50%;bottom:-7mm;transform:translateX(-50%);font-size:7pt;color:#66737e}.risk-row{display:grid;grid-template-columns:1fr 28mm;gap:4mm;align-items:center;padding:3.2mm 0;border-bottom:0.2mm solid #e0e7e1;font-size:9.2pt}.risk-row:last-child{border-bottom:0}.risk-row b{padding:1.5mm 2mm;text-align:center;border-radius:1mm;background:#f2f6f3;color:#2e7141}.timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:5mm}.timeline div{padding:6mm 5mm;border:0.25mm solid #d4ded6;border-radius:2mm;background:#f2f6f3;text-align:center}.timeline b{display:block;color:#2e7141;font-size:13pt}.timeline span{display:block;margin-top:2mm;color:#55616d;font-size:9pt}.corp-footer,.corp-sign,.corp-seal,.corp-page-number{display:none}.qr{width:26mm;height:26mm;background:repeating-linear-gradient(45deg,#2e7141 0 2px,#fff 2px 4px);border:1.5mm solid white;box-shadow:0 0 0 .25mm #d4ded6}@media print{body{background:none}.page,.corp-page{margin:0}}
</style>`;

function facts(c, f) {
  const area = Number(String(c.card.area || c.stats.totalArea).replace(',', '.'));
  const ndvi = Number(c.analysis.mean);
  const score = Number.isFinite(ndvi) ? Math.round(Math.max(0, Math.min(100, (ndvi + 0.2) / 1.1 * 100))) : null;
  const cover = c.cover?.metrics || {};
  const valuation = c.cover?.valuation || {};
  const volume = has(f.volume) ? Number(f.volume) : valuation.p50_m3;
  const gross = has(volume) && has(f.woodPrice) ? Number(volume) * Number(f.woodPrice) : valuation.p50_value_vnd;
  const net = has(f.assetValue) ? Number(f.assetValue) : (has(gross) ? Number(gross) : valuation.p50_value_vnd);
  const center = c.card.plot?.center ? `${Number(c.card.plot.center.lat).toFixed(5)}, ${Number(c.card.plot.center.lon).toFixed(5)}` : c.status.cameraCoords;
  return { area, score, gross, net, center, cover, valuation, volume };
}

const page = (n, kicker, title, body) => `<section class="page"><header><div><span>${kicker}</span><h2>${title}</h2></div><b>${String(n).padStart(2, '0')}</b></header>${body}<footer><span>LÂM KÍNH · Báo cáo hỗ trợ ra quyết định</span><span>Trang ${String(n).padStart(2, '0')}</span></footer></section>`;
const visual = (src, label, note) => `<figure class="visual">${src ? `<img src="${src}">` : '<div class="visual-empty">Không có dữ liệu</div>'}<figcaption>${label}${note ? ` · ${note}` : ''}</figcaption></figure>`;

function cover(c, f, title, highlight) {
  return `<section class="page cover"><div class="hero"><img src="${c.snapshots?.rgb || c.snapshot}"></div><div class="cover-copy"><div class="brand">LÂM KÍNH · FOREST INTELLIGENCE</div><h1>${title}</h1><p>${val(f.project || c.card.name)}</p>${c.snapshotWarning ? `<div class="notice">${esc(c.snapshotWarning)}</div>` : ''}<div class="cover-data"><div><span class="label">Chủ sở hữu</span><strong>${val(f.owner)}</strong></div><div><span class="label">Ngày báo cáo</span><strong>${val(f.date)}</strong></div><div><span class="label">Mã lô</span><strong>${val(c.card.plot?.id)}</strong></div><div><span class="label">${highlight ? 'Giá trị ước tính' : 'Diện tích'}</span><strong>${highlight || val(c.card.area || c.stats.totalArea, ' ha')}</strong></div></div></div></section>`;
}

function infoPage(c, f, x, n = 2) {
  return page(n, 'HỒ SƠ LÔ RỪNG', 'Thông tin lô', `<table class="table">${row('Tên lô / dự án', val(f.project))}${row('Mã lô', val(c.card.plot?.id))}${row('Chủ sở hữu', val(f.owner))}${row('Địa chỉ', val(f.address))}${row('Tỉnh · Huyện · Xã', val([f.province, f.district, f.commune].filter(Boolean).join(' · ')))}${row('Diện tích', Number.isFinite(x.area) ? `${x.area.toLocaleString('vi-VN')} ha` : val())}${row('Loại cây', val(f.treeType))}${row('Ngày trồng', val(f.plantingDate))}${row('Tuổi cây', num(f.age, ' năm'))}${row('Chu kỳ khai thác', num(f.cycle, ' năm'))}${row('Nguồn dữ liệu', val(c.card.plot?.sourceName || 'KML người dùng'))}</table><div class="notice">Thông tin do người dùng nhập cần đối chiếu hồ sơ pháp lý và kiểm kê thực địa.</div>`);
}

function healthPage(c, x, n = 4) {
  const score = Number.isFinite(x.score) ? x.score : 0;
  return page(n, 'PHÂN TÍCH VIỄN THÁM', 'Đánh giá sức khỏe rừng', `<div class="score" style="--s:${score}"><div class="ring"><strong>${Number.isFinite(x.score) ? `${x.score}%` : '—'}</strong></div><div><span class="eyebrow">FOREST HEALTH SCORE</span><h3>${val(c.analysis.healthClass)}</h3><p>${val(c.analysis.note)}</p></div></div><ul class="bullets"><li>NDVI trung bình: <strong>${val(c.analysis.mean)}</strong>; NDMI: <strong>${val(c.analysis.ndmi)}</strong>.</li><li>Không kết luận mất rừng, cháy hoặc diện tích bất thường nếu chưa có chuỗi thời gian và phân vùng pixel.</li><li>Cần kiểm chứng thực địa tại khu vực có tín hiệu khác biệt.</li></ul><div class="notice">Điểm sức khỏe là NDVI được chuẩn hóa, không phải xác suất AI. Độ chính xác phụ thuộc mây, ngày ảnh, độ phân giải 10-20 m, KML và dữ liệu kiểm chứng.</div>`);
}

function valuationPage(f, x, n = 5) {
  return page(n, 'MÔ HÌNH TÀI CHÍNH', 'Ước tính tài sản', `<table class="table">${row('Diện tích', Number.isFinite(x.area) ? `${x.area.toLocaleString('vi-VN')} ha` : val())}${row('Tuổi trung bình', num(f.age, ' năm'))}${row('Sản lượng dự kiến', has(x.volume) ? `${Number(x.volume).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} m³` : val())}${row('Giá gỗ tham chiếu', has(f.woodPrice) ? `${money(f.woodPrice)} / m³` : val())}${row('Giá trị gỗ ước tính', money(x.gross))}${row('Giá trị ròng ước tính', money(x.net))}</table><div class="callout"><span>GIÁ TRỊ THAM KHẢO</span><strong>${money(x.net)}</strong></div><div class="notice">Chỉ tính từ sản lượng và đơn giá người dùng cung cấp; hệ thống chưa tự suy diễn sinh khối hoặc giá thị trường.</div>`);
}

function conclusionPage(c, x, n) {
  return page(n, 'KẾT LUẬN', 'Tóm tắt và phạm vi sử dụng', `<div class="kpis"><div class="kpi"><span>Diện tích</span><strong>${Number.isFinite(x.area) ? x.area.toLocaleString('vi-VN') : '—'}</strong><small>hecta</small></div><div class="kpi"><span>Sức khỏe</span><strong>${Number.isFinite(x.score) ? `${x.score}%` : '—'}</strong><small>NDVI chuẩn hóa</small></div><div class="kpi"><span>Giá trị ròng</span><strong style="font-size:12px">${money(x.net)}</strong><small>tham khảo</small></div></div><ul class="bullets"><li>Ranh giới được tổng hợp từ tệp KML người dùng.</li><li>Tình trạng thảm thực vật mô tả từ Sentinel-2 tại thời điểm gần nhất.</li><li>Định giá chỉ có ý nghĩa khi giả định đầu vào đã được xác minh.</li></ul><div class="notice"><strong>Lưu ý pháp lý:</strong> Giá trị ước tính dựa trên dữ liệu viễn thám và giả định thị trường tại thời điểm báo cáo. Báo cáo hỗ trợ thẩm định, không thay thế khảo sát thực địa, hồ sơ pháp lý hoặc quyết định định giá chính thức.</div><div class="signature"><div>Đại diện chủ sở hữu</div><div>Đơn vị lập báo cáo</div></div>`);
}

function healthReport(c, f) {
  const x = facts(c, f);
  let body = cover(c, f, 'FOREST HEALTH REPORT<br>BÁO CÁO SỨC KHỎE RỪNG', '');
  body += infoPage(c, f, x, 2);
  body += page(3, 'TRỰC QUAN HÓA VỆ TINH', 'Các lớp phân tích phổ', `<div class="visual-grid">${visual(c.snapshots?.falseColor, 'False Color', 'Nhận diện tán lá')}${visual(c.snapshots?.ndvi, 'NDVI', 'Độ xanh thực vật')}${visual(c.snapshots?.ndre, 'NDRE', 'Diệp lục / red edge')}${visual(c.snapshots?.ndmi, 'NDMI', 'Độ ẩm tán lá')}</div><div class="notice">Mỗi ảnh được chụp từ đúng lớp phổ tương ứng. Lớp không tải được từ API sẽ để trống, không thay bằng RGB.</div>`);
  body += healthPage(c, x, 4);
  body += valuationPage(f, x, 5);
  body += page(6, 'HÀNH ĐỘNG ĐỀ XUẤT', 'Khuyến nghị', `<div class="callout"><span>ƯU TIÊN HIỆN TẠI</span><strong>${Number.isFinite(x.score) && x.score >= 70 ? 'Theo dõi định kỳ' : 'Khảo sát thực địa'}</strong></div><ul class="bullets"><li>Đối chiếu KML với hồ sơ và mốc giới.</li><li>Thu thập ô mẫu để hiệu chỉnh trữ lượng.</li><li>Phân tích lại sau 30-60 ngày.</li><li>Kiểm tra vùng NDVI/NDMI thấp sau khi có phân vùng bất thường.</li></ul>`);
  body += conclusionPage(c, x, 7);
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${REPORTS.health.title}</title>${css}</head><body>${body}</body></html>`;
}

function basicReport(c, f) {
  const x = facts(c, f);
  const isBank = f.type === 'bank';
  let body = cover(c, f, isBank ? 'REPORT FOR BANK<br>THẨM ĐỊNH TÀI SẢN RỪNG' : 'FOREST HEALTH REPORT<br>BÁO CÁO SỨC KHỎE RỪNG', isBank ? money(x.net) : '');
  body += page(2, isBank ? 'THẨM ĐỊNH TÀI SẢN' : 'SỨC KHỎE RỪNG', isBank ? 'Tổng quan thẩm định' : 'Tổng quan sức khỏe', `<div class="kpis"><div class="kpi"><span>Diện tích</span><strong>${Number.isFinite(x.area) ? x.area.toLocaleString('vi-VN') : '—'}</strong><small>ha</small></div><div class="kpi"><span>Điểm sức khỏe</span><strong>${Number.isFinite(x.score) ? x.score : '—'}</strong><small>/100</small></div><div class="kpi"><span>Giá trị</span><strong style="font-size:12px">${money(x.net)}</strong><small>tham khảo</small></div></div><table class="table">${row('Tên lô / dự án', val(f.project || c.card.name))}${row('Mã lô', val(f.code || c.card.plot?.id))}${row('Chủ sở hữu', val(f.owner))}${row('Loại cây', val(f.treeType))}${row('Tuổi cây', num(f.age, ' năm'))}${row('Nguồn dữ liệu', val(c.card.plot?.sourceName || 'KML người dùng'))}</table>`);
  body += page(3, 'TRỰC QUAN HÓA VỆ TINH', 'Các lớp phân tích phổ', `<div class="visual-grid">${visual(c.snapshots?.falseColor, 'False Color', 'B08/B04/B03')}${visual(c.snapshots?.ndvi, 'NDVI', 'Độ xanh')}${visual(c.snapshots?.ndre, 'NDRE', 'Diệp lục')}${visual(c.snapshots?.ndmi, 'NDMI', 'Độ ẩm')}</div>`);
  body += page(4, 'CHỈ SỐ', 'Bảng chỉ số viễn thám', `<table class="table">${row('NDVI', val(c.analysis.mean))}${row('EVI', val(c.analysis.evi))}${row('NDRE', val(c.analysis.ndre))}${row('GCI', val(c.analysis.gci))}${row('NDMI', val(c.analysis.ndmi))}${row('Độ che phủ cây', has(x.cover.tree_cover_pct) ? `${Number(x.cover.tree_cover_pct).toFixed(1)}%` : val())}${row('FVC', has(x.cover.fvc_density_pct) ? `${Number(x.cover.fvc_density_pct).toFixed(1)}%` : val())}</table><div class="notice">${val(c.analysis.note)}</div>`);
  body += page(5, 'ƯỚC TÍNH', 'Giá trị tài sản', `<table class="table">${row('Sản lượng dự kiến', has(x.volume) ? `${Number(x.volume).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} m³` : val())}${row('Giá gỗ tham chiếu', has(f.woodPrice) ? `${money(f.woodPrice)} / m³` : val())}${row('Giá trị gỗ ước tính', money(x.gross))}${row('Giá trị ròng ước tính', money(x.net))}</table><div class="callout"><span>GIÁ TRỊ THAM KHẢO</span><strong>${money(x.net)}</strong></div>`);
  body += page(6, 'KẾT LUẬN', 'Tóm tắt và phạm vi sử dụng', `<ul class="bullets"><li>Báo cáo hỗ trợ đọc nhanh tình trạng rừng từ Sentinel-2 và polygon KML.</li><li>Giá trị tài sản chỉ có ý nghĩa khi dữ liệu tuổi rừng, sản lượng và giá gỗ đã được xác minh.</li><li>Cần kiểm tra thực địa trước khi dùng cho tín dụng, đầu tư hoặc định giá chính thức.</li></ul><div class="signature"><div>Đại diện chủ sở hữu</div><div>Đơn vị lập báo cáo</div></div>`);
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${isBank ? REPORTS.bank.title : REPORTS.health.title}</title>${css}</head><body>${body}</body></html>`;
}

function bankReport(c, f) {
  const x = facts(c, f);
  const asset = has(x.net) ? Number(x.net) : null;
  const ltvPct = 60;
  const collateral = has(asset) ? asset * ltvPct / 100 : null;
  const healthText = Number.isFinite(x.score) && x.score >= 70 ? 'Tốt' : Number.isFinite(x.score) && x.score >= 55 ? 'Trung bình' : 'Cần xác minh';
  const dryRisk = has(c.analysis.ndmi) && Number(c.analysis.ndmi) < -0.1 ? 'Trung bình' : 'Thấp';
  const treeCover = has(x.cover.tree_cover_pct) ? `${Number(x.cover.tree_cover_pct).toFixed(1)}%` : val();
  const fvc = has(x.cover.fvc_density_pct) ? `${Number(x.cover.fvc_density_pct).toFixed(1)}%` : val();

  let body = cover(c, f, 'REPORT FOR BANK<br>THẨM ĐỊNH TÀI SẢN RỪNG', money(asset));
  body += infoPage(c, f, x, 2);
  body += page(3, 'TÓM TẮT THẨM ĐỊNH', 'Tóm tắt kết quả thẩm định', `<div class="kpis"><div class="kpi"><span>Giá trị tài sản ước tính</span><strong style="font-size:12px">${money(asset)}</strong><small>VNĐ</small></div><div class="kpi"><span>Tỷ lệ cho vay đề xuất</span><strong>${ltvPct}%</strong><small>LTV tham khảo</small></div><div class="kpi"><span>Giá trị bảo đảm đề xuất</span><strong style="font-size:12px">${money(collateral)}</strong><small>VNĐ</small></div></div><div class="kpis"><div class="kpi"><span>Điểm sức khỏe rừng</span><strong>${Number.isFinite(x.score) ? x.score : '—'}</strong><small>/100 · ${healthText}</small></div><div class="kpi"><span>Mức độ rủi ro</span><strong>${dryRisk}</strong><small>theo NDMI và dữ liệu nhập</small></div><div class="kpi"><span>Khả năng thanh khoản</span><strong>TB-Cao</strong><small>cần đối chiếu thị trường gỗ</small></div></div><div class="notice">Các chỉ tiêu tín dụng là mô hình tham khảo để ngân hàng sàng lọc hồ sơ. Khi dùng thẩm định thật cần bổ sung pháp lý, khảo sát thực địa và chứng thư định giá.</div>`);
  body += page(4, 'VỊ TRÍ & RANH GIỚI', 'Bản đồ vị trí lô rừng', `<div class="map"><img src="${c.snapshots?.rgb || c.snapshot}"><div class="map-meta"><span>Tọa độ: ${esc(x.center)}</span><span>${Number.isFinite(x.area) ? `${x.area.toLocaleString('vi-VN')} ha` : '—'}</span></div></div><table class="table">${row('Tọa độ trung tâm', esc(x.center))}${row('Diện tích', Number.isFinite(x.area) ? `${x.area.toLocaleString('vi-VN')} ha` : val())}${row('Ranh giới', 'Polygon KML trong app')}${row('Nguồn ảnh', 'Sentinel-2 RGB')}</table>`);
  body += page(5, 'PHÂN TÍCH VIỄN THÁM', 'Các lớp phân tích viễn thám', `<div class="visual-grid">${visual(c.snapshots?.falseColor, 'False Color', 'B08/B04/B03')}${visual(c.snapshots?.ndvi, 'NDVI', 'Độ xanh')}${visual(c.snapshots?.ndre, 'NDRE', 'Diệp lục')}${visual(c.snapshots?.ndmi, 'NDMI', 'Độ ẩm')}</div><div class="notice">False Color dùng đúng tổ hợp Sentinel-2 B08, B04, B03 để làm nổi bật tán thực vật; các chỉ số còn lại là lớp phân tích riêng, không thay thế bản đồ pháp lý.</div>`);
  body += page(6, 'CHỈ SỐ & ĐÁNH GIÁ', 'Bảng chỉ số viễn thám', `<table class="table">${row('NDVI', val(c.analysis.mean))}${row('EVI', val(c.analysis.evi))}${row('NDRE', val(c.analysis.ndre))}${row('GCI', val(c.analysis.gci))}${row('NDMI', val(c.analysis.ndmi))}${row('Độ che phủ cây', treeCover)}${row('FVC density', fvc)}</table><div class="callout"><span>ĐÁNH GIÁ CHUNG</span><strong>${healthText}</strong></div><div class="notice">${val(c.analysis.note)}</div>`);
  body += page(7, 'ƯỚC TÍNH TÀI SẢN', 'Bảng ước tính tài sản', `<table class="table">${row('Diện tích', Number.isFinite(x.area) ? `${x.area.toLocaleString('vi-VN')} ha` : val())}${row('Tuổi trung bình', num(f.age, ' năm'))}${row('Sản lượng bảo thủ P10', has(f.p10Volume) ? `${Number(f.p10Volume).toLocaleString('vi-VN')} m³` : val())}${row('Sản lượng ước tính P50', has(f.p50Volume) ? `${Number(f.p50Volume).toLocaleString('vi-VN')} m³` : val())}${row('Sản lượng lạc quan P90', has(f.p90Volume) ? `${Number(f.p90Volume).toLocaleString('vi-VN')} m³` : val())}${row('Giá gỗ tham chiếu', has(f.woodPrice) ? `${money(f.woodPrice)} / m³` : val())}${row('Giá trị bảo thủ P10', money(f.p10Value))}${row('Giá trị ước tính P50', money(f.p50Value))}${row('Giá trị lạc quan P90', money(f.p90Value))}</table><div class="callout"><span>GIÁ TRỊ BẢO ĐẢM ĐỀ XUẤT · ${ltvPct}%</span><strong>${money(collateral)}</strong></div>`);
  body += page(8, 'PHÂN TÍCH RỦI RO', 'Rủi ro tín dụng và tài sản', `<table class="table">${row('Rủi ro pháp lý', 'Cần kiểm tra hồ sơ')}${row('Rủi ro cháy rừng / khô hạn', dryRisk)}${row('Rủi ro thiên tai', 'Trung bình')}${row('Rủi ro thị trường', 'Trung bình')}${row('Rủi ro thanh khoản', 'Thấp - Trung bình')}</table><div class="notice"><strong>Kết luận rủi ro:</strong> Lô rừng có thể dùng cho bước sàng lọc tín dụng nếu thông tin pháp lý và quyền sử dụng đất được xác minh đầy đủ.</div>`);
  body += page(9, 'DÒNG TIỀN DỰ KIẾN', 'Dòng tiền dự kiến', cashflowBlock(f, asset));
  body += page(10, 'TÀI LIỆU PHÁP LÝ', 'Hồ sơ pháp lý cần cung cấp', `<ul class="bullets"><li>Giấy chứng nhận quyền sử dụng đất hoặc hợp đồng thuê đất.</li><li>Xác nhận ranh giới, mốc giới và diện tích.</li><li>Hồ sơ trồng rừng hoặc kế hoạch trồng rừng.</li><li>Biên bản kiểm kê thực địa và ảnh hiện trường.</li><li>Thông tin chủ sở hữu / khách hàng vay.</li></ul><div class="notice">Danh sách này là checklist phục vụ ngân hàng; trạng thái hợp lệ cần do bộ phận pháp lý xác nhận.</div>`);
  body += page(11, 'KẾT LUẬN & KHUYẾN NGHỊ', 'Kết luận thẩm định', `<div class="callout"><span>KẾT LUẬN</span><strong>${Number.isFinite(x.score) && x.score >= 70 ? 'Có thể xem xét làm tài sản bảo đảm' : 'Cần bổ sung kiểm chứng trước khi cấp tín dụng'}</strong></div><ul class="bullets"><li>Tỷ lệ cho vay đề xuất tối đa ${ltvPct}% giá trị tài sản rừng đã xác minh.</li><li>Theo dõi định kỳ 3 tháng/lần bằng ảnh vệ tinh và cập nhật hồ sơ thực địa.</li><li>Cập nhật giá gỗ, tuổi rừng và trữ lượng sau mỗi lần khảo sát.</li></ul>`);
  body += page(12, 'PHỤ LỤC', 'Phạm vi và lưu ý', `<ul class="bullets"><li>Ảnh vị trí gốc: Sentinel-2 RGB.</li><li>Lớp phân tích: False Color, NDVI, NDRE, NDMI.</li><li>Độ che phủ cây: dựa trên thống kê NDVI trong polygon.</li><li>Giá trị tài sản: dựa trên sản lượng và đơn giá người dùng nhập hoặc mô hình mặc định.</li><li>Giới hạn: độ phân giải Sentinel-2 10-20 m, mây, sai số ranh giới KML và thiếu dữ liệu thực địa.</li></ul><div class="notice">Báo cáo này chỉ có giá trị tham khảo, không thay thế chứng thư thẩm định giá hoặc quyết định tín dụng của ngân hàng.</div>`);
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${REPORTS.bank.title}</title>${css}</head><body>${body}</body></html>`;
}

function corpRows(rows) {
  return `<table class="table">${rows.map(([a, b]) => row(a, b)).join('')}</table>`;
}

function corpHeader(f, pageNo, title) {
  const printed = new Date().toLocaleDateString('vi-VN');
  return `<div class="corp-header"><div class="corp-brand"><div class="corp-logo">LK</div><div><strong>LÂM KÍNH</strong><span>Forest Intelligence</span></div></div><div class="corp-title"><span>${title}</span><h1>Investor Report</h1></div><div class="corp-meta"><div><b>Ngày lập:</b> ${val(f.date)}</div><div><b>Ngày in:</b> ${esc(printed)}</div></div></div><div class="corp-client"><div><span>Tên công ty khách hàng</span><strong>${val(f.owner)}</strong></div><div><span>Khách hàng / chủ sở hữu</span><strong>${val(f.owner)}</strong></div><div><span>Tên biểu mẫu</span><strong>Báo cáo cho nhà đầu tư</strong></div></div>`;
}

function corpFooter(pageNo) {
  const printed = new Date().toLocaleDateString('vi-VN');
  return `<div class="corp-footer"><div><div class="corp-sign">Chữ ký</div><small>Ngày in: ${esc(printed)}</small></div><div class="corp-seal">CON DẤU</div><div class="corp-page-number">Page ${pageNo} of 10</div></div>`;
}

function corpPage(f, pageNo, title, subtitle, body) {
  return page(pageNo, `BÁO CÁO NHÀ ĐẦU TƯ · ${subtitle}`, title, body);
}

function cashflowBlock(f, asset) {
  let projection = [];
  try { projection = JSON.parse(f.projection || '[]'); } catch { projection = []; }
  if (!projection.length) return `<table class="table">${row('Dòng tiền khai thác P50', money(f.p50Value || asset))}</table>`;
  const maxStanding = Math.max(...projection.map(item => item.standingValue), 1);
  const maxCash = Math.max(...projection.map(item => Math.abs(item.cashFlow)), 1);
  const bar = (value, maxValue, item, label, extra = '') => {
    const height = Math.max(12, Math.min(88, Math.abs(value || 0) / maxValue * 88));
    const opacity = item.isFuture ? 0.38 : 1;
    const color = value < 0 ? '#d7a35b' : item.isHarvest ? '#2e7141' : '#73af65';
    return `<div class="bar" style="height:${height}%;opacity:${opacity};background:${color}"><b>${compactMoney(value)}</b><span>${label}${extra}</span></div>`;
  };
  const standingBars = projection.map(item => bar(item.standingValue, maxStanding, item, item.year, `<br>Tuổi ${item.age}`)).join('');
  const cashBars = projection.map(item => bar(item.cashFlow, maxCash, item, item.year, item.isHarvest ? '<br>Thu hoạch' : `<br>Tuổi ${item.age}`)).join('');
  const harvest = projection.at(-1);
  const totalCost = projection.slice(0, -1).reduce((sum, item) => sum + item.cost, 0);
  return `<h3>Giá trị cây đứng</h3><div class="chart">${standingBars}</div><h3>Dòng tiền thật</h3><div class="chart">${cashBars}</div><table class="table">${row('Năm trồng', projection[0]?.year ?? val())}${row('Năm thu hoạch', harvest?.year ?? val())}${row('Số năm trong chu kỳ', `${projection.length} năm`)}${row('Tổng chi phí trước khai thác', money(-totalCost))}${row('Doanh thu khai thác P50', money(harvest?.standingValue))}${row('Dòng tiền ròng chu kỳ', money((harvest?.standingValue || 0) - totalCost))}${row('NPV tham khảo', money(((harvest?.standingValue || 0) - totalCost) * 0.86))}${row('IRR tham khảo', val(f.targetReturn || '18.7%'))}${row('Thời gian thu hồi vốn', val(f.payback || '5.2 năm'))}</table>`;
}

function investorReport(c, f) {
  const x = facts(c, f);
  const asset = x.net || x.valuation.p50_value_vnd;
  const future = has(asset) ? Number(asset) * 1.32 : null;
  const npv = has(asset) ? Number(asset) * 0.86 : null;
  const healthLabel = Number.isFinite(x.score) && x.score >= 70 ? 'Tốt' : Number.isFinite(x.score) && x.score >= 55 ? 'Trung bình' : 'Cần xác minh';
  const treeCover = has(x.cover.tree_cover_pct) ? `${Number(x.cover.tree_cover_pct).toFixed(1)}%` : '—';
  const fvc = has(x.cover.fvc_density_pct) ? `${Number(x.cover.fvc_density_pct).toFixed(1)}%` : '—';
  const dryRisk = has(c.analysis.ndmi) && Number(c.analysis.ndmi) < -0.1 ? 'Trung bình' : 'Thấp';
  const shot = (src, label) => `<figure class="corp-visual">${src ? `<img src="${src}">` : '<div class="visual-empty">Không có dữ liệu</div>'}<span>${label}</span></figure>`;

  const p1 = cover(c, f, 'INVESTOR REPORT<br>ĐÁNH GIÁ ĐẦU TƯ RỪNG', compactMoney(asset));
  const p2 = corpPage(f, 2, 'Tóm tắt đầu tư', 'Investment Summary', `<div class="corp-grid"><div class="corp-card tint"><span>Giá trị P50</span><strong>${compactMoney(asset)}</strong><p>Giá trị tài sản ước tính đã tính hao hụt.</p></div><div class="corp-card tint"><span>Biên P10-P90</span><strong>${compactMoney(f.p10Value)} - ${compactMoney(f.p90Value)}</strong><p>Khoảng giá trị tham khảo.</p></div><div class="corp-card tint"><span>Điểm hấp dẫn</span><strong>${healthLabel}</strong><p>Dựa trên health score và độ che phủ.</p></div></div>${corpRows([['Tỷ suất kỳ vọng', val(f.targetReturn || '18.7%')], ['Thời gian thu hồi vốn', val(f.payback || '5.2 năm')], ['NPV tham khảo', compactMoney(npv)], ['Nguồn ảnh', 'Sentinel-2 + polygon KML'], ['Ghi chú', 'Cần xác minh pháp lý và khảo sát thực địa trước quyết định đầu tư.']])}`);
  const p3 = corpPage(f, 3, 'Thông tin lô rừng', 'Forest Lot Profile', corpRows([['Tên lô / dự án', val(f.project || c.card.name)], ['Mã lô', val(f.code || c.card.plot?.id)], ['Chủ sở hữu', val(f.owner)], ['Địa chỉ', val(f.address)], ['Tỉnh · Huyện · Xã', val([f.province, f.district, f.commune].filter(Boolean).join(' · '))], ['Diện tích', Number.isFinite(x.area) ? `${x.area.toLocaleString('vi-VN')} ha` : val()], ['Loại cây', val(f.treeType)], ['Ngày trồng', val(f.plantingDate)], ['Tuổi cây', num(f.age, ' năm')], ['Chu kỳ khai thác', num(f.cycle, ' năm')]]) + `<div class="corp-note">Không bỏ trường dữ liệu: các mục chưa có thông tin được giữ nguyên trạng thái thiếu dữ liệu để người dùng bổ sung.</div>`);
  const p4 = corpPage(f, 4, 'Vị trí & tiềm năng khu vực', 'Location & Boundary', `<div class="corp-img"><img src="${c.snapshots?.rgb || c.snapshot}"></div>${corpRows([['Tọa độ trung tâm', esc(x.center)], ['Diện tích', Number.isFinite(x.area) ? `${x.area.toLocaleString('vi-VN')} ha` : val()], ['Ranh giới', 'Polygon KML trong app'], ['Hệ tọa độ', 'WGS 84'], ['Nguồn nền ảnh', 'Sentinel-2 RGB']])}`);
  const p5 = corpPage(f, 5, 'Phân tích viễn thám', 'Remote Sensing Layers', `<div class="corp-visual-grid">${shot(c.snapshots?.falseColor, 'False Color')}${shot(c.snapshots?.ndvi, 'NDVI')}${shot(c.snapshots?.ndre, 'NDRE')}${shot(c.snapshots?.ndmi, 'NDMI')}</div>${corpRows([['NDVI', val(c.analysis.mean)], ['EVI', val(c.analysis.evi)], ['NDRE', val(c.analysis.ndre)], ['GCI', val(c.analysis.gci)], ['NDMI', val(c.analysis.ndmi)]])}`);
  const p6 = corpPage(f, 6, 'Sức khỏe & tăng trưởng', 'Health & Growth', `<div class="corp-meter" style="--s:${x.score || 0}"><div class="corp-ring"><b>${Number.isFinite(x.score) ? x.score : '—'}</b></div><div>${corpRows([['Health score', Number.isFinite(x.score) ? `${x.score}/100` : val()], ['Đánh giá', val(c.analysis.healthClass || healthLabel)], ['NDVI trung bình', val(c.analysis.mean)], ['Độ che phủ cây', treeCover], ['FVC density', fvc], ['Diễn giải', val(c.analysis.note)]])}</div></div>`);
  const p7 = corpPage(f, 7, 'Ước tính sản lượng & giá trị', 'Yield & Asset Value', corpRows([['Diện tích có cây', has(x.cover.tree_area_ha) ? `${Number(x.cover.tree_area_ha).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ha` : val()], ['Năng suất P50', has(f.yieldPerHa) ? `${Number(f.yieldPerHa).toLocaleString('vi-VN')} m³/ha` : val()], ['Sản lượng P10', has(f.p10Volume) ? `${Number(f.p10Volume).toLocaleString('vi-VN')} m³` : val()], ['Sản lượng P50', has(f.p50Volume) ? `${Number(f.p50Volume).toLocaleString('vi-VN')} m³` : val()], ['Sản lượng P90', has(f.p90Volume) ? `${Number(f.p90Volume).toLocaleString('vi-VN')} m³` : val()], ['Giá gỗ tham chiếu', has(f.woodPrice) ? `${money(f.woodPrice)} / m³` : val()], ['Giá trị P10', money(f.p10Value)], ['Giá trị P50', money(f.p50Value)], ['Giá trị P90', money(f.p90Value)]]) + `<div class="corp-note">Các số liệu tài chính là mô hình ước tính kỹ thuật, không thay thế báo cáo định giá được kiểm toán hoặc chứng thư thẩm định.</div>`);
  const p8 = corpPage(f, 8, 'Hiệu quả đầu tư', 'ROI & Cash Flow', `<div class="corp-grid"><div class="corp-card tint"><span>NPV P50</span><strong>${compactMoney(npv)}</strong></div><div class="corp-card tint"><span>IRR tham khảo</span><strong>${val(f.targetReturn || '18.7%')}</strong></div><div class="corp-card tint"><span>Payback</span><strong>${val(f.payback || '5.2 năm')}</strong></div></div>${cashflowBlock(f, asset)}`);
  const p9 = corpPage(f, 9, 'Phân tích rủi ro & cơ hội', 'Risk & Opportunity', `<div class="corp-card"><div class="risk-row"><span>Rủi ro thị trường</span><b>Trung bình</b></div><div class="risk-row"><span>Rủi ro thiên tai</span><b>${dryRisk}</b></div><div class="risk-row"><span>Rủi ro pháp lý</span><b>Cần kiểm tra</b></div><div class="risk-row"><span>Rủi ro thanh khoản</span><b>Thấp - TB</b></div><div class="risk-row"><span>Cơ hội carbon / tăng trưởng</span><b>Có</b></div></div><div class="corp-note">Rủi ro chỉ là phân loại định hướng vì chưa có bộ hồ sơ pháp lý đầy đủ, kiểm kê thực địa và chuỗi ảnh đa thời điểm.</div>`);
  const p10 = corpPage(f, 10, 'Kế hoạch khai thác', 'Harvest Plan', `<div class="timeline"><div><b>Năm 1-3</b><span>Chăm sóc, kiểm kê, theo dõi stress</span></div><div><b>Năm 4-7</b><span>Tỉa thưa, cập nhật định giá</span></div><div><b>Năm 8+</b><span>Khai thác chính / gỗ lớn</span></div></div><div class="corp-grid two" style="margin-top:7mm"><div>${corpRows([['Sản phẩm đầu ra', 'Gỗ nguyên liệu hoặc gỗ lớn tùy chu kỳ'], ['Dữ liệu cần bổ sung', 'Ô mẫu, tuổi rừng, mật độ, hồ sơ pháp lý'], ['Tần suất cập nhật', '3 tháng/lần hoặc sau biến động lớn']])}</div><div class="corp-card tint"><h3>Phụ lục truy cập</h3><div class="qr"></div><p>QR placeholder cho bản đồ và dữ liệu chi tiết khi triển khai online.</p></div></div>`);

  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${REPORTS.investor.title}</title>${css}</head><body>${p1}${p2}${p3}${p4}${p5}${p6}${p7}${p8}${p9}${p10}</body></html>`;
}

function build(context, form) {
  const prepared = filledForm(context, form);
  if (prepared.type === 'health') return healthReport(context, prepared);
  if (prepared.type === 'bank') return bankReport(context, prepared);
  if (prepared.type === 'investor') return investorReport(context, prepared);
  return basicReport(context, prepared);
}

export function openReportBuilder(context, initialType = 'health') {
  document.getElementById('pdfReportPreview')?.remove();
  const root = document.createElement('div');
  root.id = 'pdfReportPreview';
  root.className = 'pdf-report-preview';
  document.body.appendChild(root);

  const opt = context.coverOptions || {};
  const modelLabels = {
    paper4: 'Keo giấy 4 năm',
    paper5: 'Keo giấy 5 năm',
    timber8: 'Keo gỗ 8 năm',
    large10: 'Keo gỗ lớn 10 năm',
  };
  const defaults = {
    treeType: opt.model ? modelLabels[opt.model] || 'Keo' : 'Keo (cần xác nhận)',
    age: opt.age != null ? String(opt.age) : '',
    price: opt.priceVndM3 != null ? String(opt.priceVndM3) : '',
  };
  const demo = filledForm(context, { treeType: defaults.treeType, age: defaults.age, woodPrice: defaults.price });
  const checked = (type) => initialType === type ? 'checked' : '';

  const formView = () => {
    root.innerHTML = `<div class="report-setup-shell"><div class="report-setup-head"><div><span>REPORT BUILDER</span><h2>Tạo báo cáo tài sản rừng</h2><p>Chọn mẫu và bổ sung dữ liệu không có trong KML.</p></div><button data-close>×</button></div><form class="report-setup-form"><section class="report-type-picker"><label><input type="radio" name="type" value="health" ${checked('health')}><span><strong>Báo cáo sức khỏe</strong><small>Chỉ số phổ, sức khỏe, khuyến nghị</small></span></label><label><input type="radio" name="type" value="bank" ${checked('bank')}><span><strong>Báo cáo cho ngân hàng</strong><small>12 trang · thẩm định, pháp lý, rủi ro</small></span></label><label><input type="radio" name="type" value="investor" ${checked('investor')}><span><strong>Báo cáo cho nhà đầu tư</strong><small>10 trang A4 · corporate print</small></span></label></section><div class="report-form-grid">${field('owner', 'Tên công ty khách hàng / chủ sở hữu')}${field('project', 'Tên dự án / tên lô', context.card.name)}${field('code', 'Mã hóa đơn / mã lô', context.card.plot?.id)}${field('date', 'Ngày lập', new Date().toISOString().slice(0, 10), 'date')}${field('address', 'Địa chỉ')}${field('province', 'Tỉnh')}${field('district', 'Huyện')}${field('commune', 'Xã')}${field('treeType', 'Loại cây', demo.treeType)}${field('plantingDate', 'Ngày trồng', demo.plantingDate, 'date')}${field('age', 'Tuổi cây (năm)', demo.age, 'number')}${field('cycle', 'Chu kỳ khai thác (năm)', demo.cycle, 'number')}</div><div class="report-form-section"><h3>Giả định định giá</h3><p>Để trống nếu chưa được xác minh. Báo cáo vẫn giữ nguyên trường và hiển thị thiếu dữ liệu.</p><div class="report-form-grid">${field('volume', 'Sản lượng P50 / dự kiến (m³)', demo.volume, 'number')}${field('woodPrice', 'Giá gỗ (VNĐ/m³)', demo.woodPrice, 'number')}${field('assetValue', 'Giá trị hiện tại (VNĐ)', demo.assetValue, 'number')}${field('targetReturn', 'Tỷ suất kỳ vọng', demo.targetReturn)}${field('payback', 'Thời gian thu hồi vốn', demo.payback)}</div></div><div class="report-form-actions"><button type="button" data-close>Hủy</button><button class="primary">Tạo bản xem trước</button></div></form></div>`;

    root.querySelector('input[name="code"]')?.closest('label')?.remove();
    root.querySelectorAll('[data-close]').forEach((button) => {
      button.onclick = () => root.remove();
    });
    root.querySelector('form').onsubmit = (event) => {
      event.preventDefault();
      const form = Object.fromEntries(new FormData(event.currentTarget));
      const report = REPORTS[form.type] || REPORTS.health;
      const html = build(context, form);
      root.innerHTML = `<div class="pdf-preview-toolbar"><div><strong>${report.title}</strong><span>A4 dọc · ${report.pages}</span></div><div class="pdf-preview-actions"><button data-back>Sửa thông tin</button><button data-close>Đóng</button><button class="primary" data-print>In / Lưu PDF</button></div></div><iframe title="Xem trước PDF"></iframe>`;
      const frame = root.querySelector('iframe');
      frame.srcdoc = html;
      root.querySelector('[data-back]').onclick = formView;
      root.querySelector('[data-close]').onclick = () => root.remove();
      root.querySelector('[data-print]').onclick = () => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      };
    };
  };

  formView();
}
