/**
 * MSpec Wheels — Wheel-Well Renderer (v0.7 — Label-Anchored Icons)
 *
 * Architecture: dual photographic illustrations + small ✓/✗ icons positioned
 * next to the existing TEXT LABELS on each image (STRUT, FENDER LIP, BOLT PATTERN, etc.).
 * Plus structured checklist on the right side.
 *
 * Icons are HTML elements absolutely positioned via percentage coords. No polygon
 * overlays. View labels moved OUT of images (above as captions) so they don't collide.
 * Grid uses align-items:start so empty space below images doesn't pad with black.
 *
 * Cache-busting: image URLs have ?v=2 query string.
 */

(function () {
  'use strict';

  const OK_MIN_MM = 8;
  const TIGHT_MIN_MM = 3;
  const IMG_VERSION = '2';

  const COLORS = {
    ok:      '#4ade80',
    tight:   '#facc15',
    contact: '#E22718',
    text:    '#F0F0EC',
    silver:  '#C8CCD0',
    muted:   '#9CA3AF',
    line:    '#2A3142',
    bg:      '#0A0E14',
    panel:   '#14181F',
  };

  // Position of each existing TEXT LABEL on each image, as [x_pct, y_pct].
  // Icon is rendered as a circular badge anchored to the existing image label.
  // Calibrated 2026-05-07 against full-res renders (PIL preview loop).
  // Icons that don't carry go/no-go meaning (fender_ref, inner_label, outer_label,
  // wheel_cl) were removed — the image already labels those zones, no badge needed.
  const LABEL_POSITIONS = {
    v1: {
      // Engineering cross-section (732 × 781).
      // strut + bolt_pattern => icon LEFT of the word.
      // fender_lip + hub_center => icon RIGHT of the word.
      strut:         { x: 0.04, y: 0.10, key: 'inner' },
      fender_lip:    { x: 0.88, y: 0.09, key: 'outer' },
      hub_center:    { x: 0.92, y: 0.44, key: 'always_ok' },
      bolt_pattern:  { x: 0.04, y: 0.54, key: 'always_ok' },
    },
    v2: {
      // 3D photorealistic (1031 × 1100).
      // strut/caliper/hub_center/bolt_pattern => icon LEFT of the word.
      // fender_lip + brake_radial => icon BELOW the word.
      strut:         { x: 0.04, y: 0.30, key: 'inner' },
      caliper:       { x: 0.09, y: 0.49, key: 'caliper' },
      hub_center:    { x: 0.05, y: 0.71, key: 'always_ok' },
      bolt_pattern:  { x: 0.05, y: 0.78, key: 'always_ok' },
      fender_lip:    { x: 0.90, y: 0.13, key: 'outer' },
      brake_radial:  { x: 0.89, y: 0.82, key: 'caliper' },
    }
  };

  function classFor(mm) {
    if (mm >= OK_MIN_MM) return 'ok';
    if (mm >= TIGHT_MIN_MM) return 'tight';
    return 'contact';
  }

  function iconFor(cls) {
    if (cls === 'ok') return '✓';
    if (cls === 'tight') return '⚠';
    return '✗';
  }

  function statusWordFor(mm, type) {
    if (mm >= OK_MIN_MM) return 'OK';
    if (mm >= TIGHT_MIN_MM) return 'TIGHT';
    if (mm >= 0) {
      if (type === 'fender') return 'WILL RUB';
      if (type === 'strut') return 'WILL CONTACT';
      if (type === 'brake') return 'CALIPER CONFLICT';
      if (type === 'driveshaft') return 'WILL CONTACT';
      return 'CONTACT RISK';
    }
    return 'INTERFERENCE';
  }

  function resolveChassis(chassisName, geometryDB) {
    const direct = geometryDB.chassis[chassisName];
    if (!direct) return null;
    const template = direct.extends ? geometryDB.templates[direct.extends] : {};
    const front = Object.assign({}, (template.front || {}), (direct.front || {}));
    const rear = Object.assign({}, (template.rear || {}), (direct.rear || {}));
    return Object.assign({}, template, direct, { front, rear });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderLabelIcon(pos, cls) {
    const colors = { ok: COLORS.ok, tight: COLORS.tight, contact: COLORS.contact };
    const icon = iconFor(cls);
    const color = colors[cls];
    return (
      '<div class="ww-label-icon" style="' +
        'position:absolute;' +
        'left:' + (pos.x * 100).toFixed(2) + '%;' +
        'top:' + (pos.y * 100).toFixed(2) + '%;' +
        'transform:translate(-50%, -50%);' +
        'width:24px;height:24px;' +
        'background:' + color + ';' +
        'border:2px solid rgba(255,255,255,0.85);' +
        'border-radius:50%;' +
        'display:flex;align-items:center;justify-content:center;' +
        'color:#fff;font-weight:700;font-size:13px;line-height:1;' +
        'font-family:Inter,sans-serif;' +
        'box-shadow:0 2px 6px rgba(0,0,0,0.5);' +
        'z-index:3;pointer-events:none;' +
      '">' + icon + '</div>'
    );
  }

  function renderImageView(imgSrc, imgAlt, viewLabel, labelPositions, statusByKey) {
    const icons = [];
    for (const labelName of Object.keys(labelPositions)) {
      const pos = labelPositions[labelName];
      let cls;
      if (pos.key === 'always_ok') {
        cls = 'ok';
      } else {
        cls = statusByKey[pos.key] || 'ok';
      }
      icons.push(renderLabelIcon(pos, cls));
    }

    return (
      '<div class="ww-image-block">' +
        '<div style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:' + COLORS.muted + ';letter-spacing:0.15em;text-transform:uppercase;padding:6px 0;text-align:center;">— ' + viewLabel + ' —</div>' +
        '<div class="ww-image-wrap" style="position:relative;display:block;width:100%;background:#000;border:1px solid ' + COLORS.line + ';overflow:hidden;">' +
          '<img src="' + imgSrc + '" alt="' + escapeHtml(imgAlt) + '" style="display:block;width:100%;height:auto;"/>' +
          icons.join('') +
        '</div>' +
      '</div>'
    );
  }

  function renderVerdictBadge(overallStatus) {
    const badges = {
      good:  { label: 'GOOD FIT',  color: COLORS.ok,      bg: 'rgba(74, 222, 128, 0.10)', sub: 'Plenty of clearance.' },
      tight: { label: 'TIGHT FIT', color: COLORS.tight,   bg: 'rgba(250, 204, 21, 0.08)', sub: 'Workable with mods.' },
      poor:  { label: 'POOR FIT',  color: COLORS.contact, bg: 'rgba(226, 39, 24, 0.10)', sub: 'Will rub or interfere.' }
    };
    const b = badges[overallStatus] || badges.tight;
    return (
      '<div style="border:1px solid ' + b.color + ';background:' + b.bg + ';padding:16px;margin-bottom:16px;">' +
        '<div style="font-family:Anton,sans-serif;font-size:24px;color:' + b.color + ';letter-spacing:0.05em;">' + b.label + '</div>' +
        '<div style="font-family:Inter,sans-serif;font-size:13px;color:' + COLORS.silver + ';margin-top:4px;">' + b.sub + '</div>' +
      '</div>'
    );
  }

  function renderChecklistRow(label, mm, type, alwaysOk) {
    const cls = alwaysOk ? 'ok' : classFor(mm);
    const colors = { ok: COLORS.ok, tight: COLORS.tight, contact: COLORS.contact };
    const color = colors[cls];
    const icon = alwaysOk ? '✓' : iconFor(cls);
    const status = alwaysOk ? 'MATCH' : statusWordFor(mm, type);
    const valueText = mm != null ? mm.toFixed(1) + ' mm' : '';
    const isFailed = cls === 'contact';
    const fontWeight = isFailed ? '700' : '500';
    const rowBg = isFailed ? 'rgba(226, 39, 24, 0.06)' : 'transparent';
    const rowPadL = isFailed ? '8px' : '0';
    const rowBorderL = isFailed ? '3px solid ' + COLORS.contact : '3px solid transparent';

    return (
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 10px ' + rowPadL + ';border-bottom:1px solid ' + COLORS.line + ';border-left:' + rowBorderL + ';background:' + rowBg + ';font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:' + fontWeight + ';">' +
        '<div style="display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:6px;color:' + color + ';">' +
            '<span style="font-size:14px;flex-shrink:0;">' + icon + '</span>' +
            '<span style="text-transform:uppercase;letter-spacing:0.05em;font-size:11px;">' + escapeHtml(label) + '</span>' +
          '</div>' +
          (valueText ? '<div style="color:' + COLORS.silver + ';font-size:11px;padding-left:20px;">' + valueText + '</div>' : '') +
        '</div>' +
        '<div style="font-size:10px;color:' + color + ';font-weight:700;letter-spacing:0.08em;text-transform:uppercase;flex-shrink:0;padding-left:8px;">' + status + '</div>' +
      '</div>'
    );
  }

  function renderWhyRow(passed, line) {
    const lineL = line.toLowerCase();
    const isContact = lineL.indexOf('interfere') >= 0 || lineL.indexOf('will rub') >= 0 || lineL.indexOf('will contact') >= 0 || lineL.indexOf('caliper conflict') >= 0 || lineL.indexOf('driveshaft contact') >= 0;
    const color = passed ? COLORS.ok : (isContact ? COLORS.contact : COLORS.tight);
    const icon = passed ? '✓' : (isContact ? '✗' : '⚠');
    return (
      '<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;font-family:Inter,sans-serif;font-size:12px;">' +
        '<span style="color:' + color + ';font-weight:700;flex-shrink:0;">' + icon + '</span>' +
        '<span style="color:' + COLORS.silver + ';">' + escapeHtml(line) + '</span>' +
      '</div>'
    );
  }

  function renderWheelWell(args) {
    const { chassis, geometryDB, diameter_in, width_in, offset_mm, axle = 'front' } = args;
    const cd = resolveChassis(chassis, geometryDB);

    if (!cd) {
      return '<div style="padding:20px;text-align:center;color:' + COLORS.muted + ';font-family:monospace;">No geometry data for ' + escapeHtml(chassis) + '</div>';
    }

    const oem = axle === 'rear' ? cd.oem_rear : cd.oem_front;
    const axleData = axle === 'rear' ? cd.rear : cd.front;
    if (!oem || !axleData) {
      return '<div style="padding:20px;text-align:center;color:' + COLORS.muted + ';font-family:monospace;">No OEM ' + axle + ' data for ' + escapeHtml(chassis) + '</div>';
    }

    const xdrive = (typeof args.xdrive === 'boolean')
      ? args.xdrive
      : !!(axleData.has_xdrive_driveshaft || axleData.has_xdrive_driveshaft_variant);

    // ===== Math =====
    const oemRimWidthMm = oem.width_in * 25.4;
    const newRimWidthMm = width_in * 25.4;
    const newRimDiamMm = diameter_in * 25.4;

    const outerPokeMm = ((newRimWidthMm - oemRimWidthMm) / 2) + (oem.offset_mm - offset_mm);
    const innerPushMm = ((newRimWidthMm - oemRimWidthMm) / 2) - (oem.offset_mm - offset_mm);

    const newOuterClearanceMm = axleData.oem_outer_clearance_mm - outerPokeMm;
    const newInnerClearanceMm = axleData.oem_inner_clearance_mm - innerPushMm;

    const rimInnerRadiusMm = newRimDiamMm / 2 - 12;
    const brakeRadialClearanceMm = rimInnerRadiusMm - axleData.brake_caliper_outer_radius_mm;

    const driveshaftClearanceMm = (xdrive && axleData.driveshaft_inboard_of_inner_tire_mm != null)
      ? axleData.driveshaft_inboard_of_inner_tire_mm - innerPushMm - (axleData.driveshaft_radius_mm || 28)
      : null;

    const allClasses = [classFor(newOuterClearanceMm), classFor(newInnerClearanceMm), classFor(brakeRadialClearanceMm)];
    if (driveshaftClearanceMm != null) allClasses.push(classFor(driveshaftClearanceMm));
    let overall = 'good';
    if (allClasses.indexOf('contact') >= 0) overall = 'poor';
    else if (allClasses.indexOf('tight') >= 0) overall = 'tight';

    // Status by semantic key — used to color icons on image labels
    const statusByKey = {
      inner:   classFor(newInnerClearanceMm),
      outer:   classFor(newOuterClearanceMm),
      caliper: classFor(brakeRadialClearanceMm),
    };

    // ===== Build HTML =====
    const parts = [];
    parts.push('<div class="ww-container" style="display:grid;grid-template-columns:1fr 1fr 320px;gap:12px;padding:16px;background:' + COLORS.bg + ';color:' + COLORS.text + ';font-family:Inter,sans-serif;align-items:start;">');

    parts.push(renderImageView('assets/wheelwell_v1_technical.png?v=' + IMG_VERSION, 'Engineering cross-section view', 'Engineering View', LABEL_POSITIONS.v1, statusByKey));
    parts.push(renderImageView('assets/wheelwell_v2_3d.png?v=' + IMG_VERSION, '3D photorealistic view', '3D View', LABEL_POSITIONS.v2, statusByKey));

    // Verdict panel
    parts.push('<div class="ww-verdict-panel" style="display:flex;flex-direction:column;gap:0;">');
    parts.push('<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:' + COLORS.muted + ';letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;">— Fitment Verdict —</div>');
    parts.push(renderVerdictBadge(overall));

    parts.push('<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:' + COLORS.muted + ';letter-spacing:0.1em;text-transform:uppercase;margin:8px 0 4px;">Component Checks</div>');
    parts.push('<div style="border-top:1px solid ' + COLORS.line + ';">');
    parts.push(renderChecklistRow('Bolt Pattern', null, 'bolt', true));
    parts.push(renderChecklistRow('Hub Center', null, 'hub', true));
    parts.push(renderChecklistRow('Strut Clearance', newInnerClearanceMm, 'strut'));
    parts.push(renderChecklistRow('Brake Radial', brakeRadialClearanceMm, 'brake'));
    parts.push(renderChecklistRow('Fender (Outer Poke)', newOuterClearanceMm, 'fender'));
    if (driveshaftClearanceMm != null) {
      parts.push(renderChecklistRow('Driveshaft (xDrive)', driveshaftClearanceMm, 'driveshaft'));
    }
    parts.push('</div>');

    parts.push('<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:' + COLORS.muted + ';letter-spacing:0.1em;text-transform:uppercase;margin:16px 0 4px;">Why</div>');
    parts.push('<div>');
    const strutClass = classFor(newInnerClearanceMm);
    parts.push(renderWhyRow(strutClass === 'ok',
      strutClass === 'ok'
        ? newInnerClearanceMm.toFixed(1) + ' mm to strut — clear of ' + OK_MIN_MM + ' mm minimum'
        : strutClass === 'contact'
          ? 'WILL CONTACT STRUT (' + newInnerClearanceMm.toFixed(1) + ' mm — interference)'
          : 'Strut clearance is tight (' + newInnerClearanceMm.toFixed(1) + ' mm)'));
    const fenderClass = classFor(newOuterClearanceMm);
    parts.push(renderWhyRow(fenderClass === 'ok',
      fenderClass === 'ok'
        ? newOuterClearanceMm.toFixed(1) + ' mm to fender — clear of ' + OK_MIN_MM + ' mm minimum'
        : fenderClass === 'contact'
          ? 'WILL RUB FENDER (' + newOuterClearanceMm.toFixed(1) + ' mm — needs camber + roll/pull)'
          : 'Fender clearance is tight (' + newOuterClearanceMm.toFixed(1) + ' mm)'));
    const brakeClass = classFor(brakeRadialClearanceMm);
    parts.push(renderWhyRow(brakeClass === 'ok',
      brakeClass === 'ok'
        ? brakeRadialClearanceMm.toFixed(1) + ' mm to brake — wheel clears caliper'
        : brakeClass === 'contact'
          ? 'CALIPER CONFLICT — wheel will not seat over brakes (' + brakeRadialClearanceMm.toFixed(1) + ' mm)'
          : 'Brake clearance is tight (' + brakeRadialClearanceMm.toFixed(1) + ' mm)'));
    if (driveshaftClearanceMm != null) {
      const dsClass = classFor(driveshaftClearanceMm);
      parts.push(renderWhyRow(dsClass === 'ok',
        dsClass === 'ok'
          ? driveshaftClearanceMm.toFixed(1) + ' mm to driveshaft — xDrive safe'
          : dsClass === 'contact'
            ? 'DRIVESHAFT CONTACT — xDrive front shaft hits inner tire (' + driveshaftClearanceMm.toFixed(1) + ' mm)'
            : 'Driveshaft clearance is tight (' + driveshaftClearanceMm.toFixed(1) + ' mm)'));
    }
    parts.push('</div>');

    const pokeClass = classFor(newOuterClearanceMm);
    const pushClass = classFor(newInnerClearanceMm);
    const colorMap = { ok: COLORS.ok, tight: COLORS.tight, contact: COLORS.contact };
    parts.push('<div style="margin-top:16px;padding:12px;background:' + COLORS.panel + ';border:1px solid ' + COLORS.line + ';font-family:\'JetBrains Mono\',monospace;font-size:11px;">');
    parts.push('<div style="color:' + COLORS.muted + ';font-size:9px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">vs OEM (' + oem.diameter_in + '×' + oem.width_in + ' ET' + oem.offset_mm + '):</div>');
    parts.push('<div style="display:flex;justify-content:space-between;color:' + COLORS.text + ';">Outer poke <span style="color:' + colorMap[pokeClass] + ';font-weight:600;">' + (outerPokeMm >= 0 ? '+' : '') + outerPokeMm.toFixed(1) + ' mm</span></div>');
    parts.push('<div style="display:flex;justify-content:space-between;color:' + COLORS.text + ';margin-top:4px;">Inner push <span style="color:' + colorMap[pushClass] + ';font-weight:600;">' + (innerPushMm >= 0 ? '+' : '') + innerPushMm.toFixed(1) + ' mm</span></div>');
    parts.push('</div>');

    parts.push('<div style="margin-top:16px;font-family:Inter,sans-serif;font-size:10px;color:#6B7280;line-height:1.5;">Always test-fit before mounting tires. Geometry approximate; actual results vary by camber, ride height, and tire brand.</div>');
    parts.push('</div>');
    parts.push('</div>');
    parts.push('<style>@media (max-width: 900px) { .ww-container { grid-template-columns: 1fr !important; } }</style>');

    return parts.join('');
  }

  window.renderWheelWell = renderWheelWell;
})();
