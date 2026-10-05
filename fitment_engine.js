/**
 * MSpec Wheels — Fitment A
 * Client-side mechanical check. No network calls, no LLM.
 * Bolt pattern, center bore, brake diameter, and width/ET versus OEM.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MSpecFitment = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var TIERS = ['YES_DIRECT_FIT', 'YES_WITH_MODS', 'MAYBE_HEAVY_MODS', 'NO_NOT_RECOMMENDED'];
  var SHORT = {
    YES_DIRECT_FIT: 'YES — DIRECT FIT',
    YES_WITH_MODS: 'YES — WITH MODS',
    MAYBE_HEAVY_MODS: 'MAYBE — HEAVY MODS',
    NO_NOT_RECOMMENDED: 'NO — NOT RECOMMENDED',
  };
  var DISCLAIMER = 'Mechanical estimate only — confirm on the car; not a guarantee.';

  // Select value → chassis_database header prefix, geometry key, clearance-budget key.
  var CHASSIS = {
    'F87 M2':              { header: 'F87 M2 (2016', geometry: 'F87 M2', budget: 'F87 M2' },
    'F87 M2 Competition':  { header: 'F87 M2 Competition', geometry: 'F87 M2', budget: 'F87 M2' },
    'F87 M2 CS':           { header: 'F87 M2 CS', geometry: 'F87 M2', budget: 'F87 M2' },
    'G87 M2':              { header: 'G87 M2', geometry: 'G87 M2', budget: 'G87 M2' },
    'E30 M3':              { header: 'E30 M3', geometry: null, budget: 'E30 M3' },
    'E36 M3':              { header: 'E36 M3', geometry: 'E36 M3', budget: 'E36 M3' },
    'E46 M3':              { header: 'E46 M3', geometry: 'E46 M3', budget: 'E46 M3' },
    'E9X M3':              { header: 'E90/E92/E93 M3', geometry: 'E9X M3', budget: 'E9X M3' },
    'E92 M3 GTS':          { header: 'E92 M3 GTS', geometry: 'E9X M3', budget: 'E9X M3' },
    'F80 M3':              { header: 'F80 M3', geometry: 'F80 M3', budget: 'F8X M3/M4' },
    'G80 M3':              { header: 'G80 M3', geometry: 'G80 M3', budget: 'G8X M3/M4' },
    'G81 M3 Touring':      { header: 'G81 M3 Touring', geometry: 'G81 M3 Touring', budget: 'G8X M3/M4' },
    'F82/F83 M4':          { header: 'F82/F83 M4', geometry: 'F82/F83 M4', budget: 'F8X M3/M4' },
    'G82/G83 M4':          { header: 'G82/G83 M4', geometry: 'G82/G83 M4', budget: 'G8X M3/M4' },
    'E28 M5':              { header: 'E28 M5', geometry: null, budget: 'E28 M5 / E24 M6' },
    'E34 M5':              { header: 'E34 M5', geometry: null, budget: 'E34 M5' },
    'E39 M5':              { header: 'E39 M5', geometry: 'E39 M5', budget: 'E39 M5' },
    'E60 M5':              { header: 'E60 M5', geometry: 'E60 M5', budget: 'E60 M5 / E63 M6' },
    'F10 M5':              { header: 'F10 M5', geometry: 'F10 M5', budget: 'F10 M5 / F1X M6' },
    'F90 M5':              { header: 'F90 M5', geometry: 'F90 M5', budget: 'F90 M5 / F9X M8' },
    'G90 M5':              { header: 'G90 M5', geometry: 'G90 M5', budget: 'F90 M5 / F9X M8' },
    'G99 M5 Touring':      { header: 'G99 M5 Touring', geometry: null, budget: 'F90 M5 / F9X M8' },
    'E24 M6':              { header: 'E24 M635', geometry: null, budget: 'E28 M5 / E24 M6' },
    'E63/E64 M6':          { header: 'E63/E64 M6', geometry: 'E63/E64 M6', budget: 'E60 M5 / E63 M6' },
    'F06/F12/F13 M6':      { header: 'F06/F12/F13 M6', geometry: null, budget: 'F10 M5 / F1X M6' },
    'F92 M8':              { header: 'F91/F92/F93 M8', geometry: null, budget: 'F90 M5 / F9X M8' },
    'F97 X3 M':            { header: 'F97 X3 M', geometry: 'F97 X3 M', budget: 'F97/F98 X3M/X4M' },
    'F98 X4 M':            { header: 'F98 X4 M', geometry: 'F98 X4 M', budget: 'F97/F98 X3M/X4M' },
    'F95 X5 M':            { header: 'F95 X5 M', geometry: 'F95 X5 M', budget: 'F95/F96 X5M/X6M' },
    'F96 X6 M':            { header: 'F96 X6 M', geometry: 'F96 X6 M', budget: 'F95/F96 X5M/X6M' },
    'G09 XM':              { header: 'G09 XM', geometry: 'G09 XM', budget: 'G09 XM' },
    'E36/7 Z3 M':          { header: 'E36/7 / E36/8 Z3 M', geometry: 'E36/7 Z3 M', budget: 'E36/7 Z3 M' },
    'E85/E86 Z4 M':        { header: 'E85/E86 Z4 M', geometry: 'E85/E86 Z4 M', budget: 'E85/E86 Z4 M' },
    'E82 1M':              { header: 'E82 1 Series M Coupe', geometry: 'E82 1M', budget: 'E82 1M' },
    'E26 M1':              { header: 'E26 M1', geometry: 'E26 M1', budget: 'E26 M1' },
  };

  function worse(a, b) {
    return TIERS.indexOf(a) >= TIERS.indexOf(b) ? a : b;
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function parseSetup(raw) {
    var s = String(raw || '').trim();
    if (!s) return { error: 'Enter wheel specs.' };
    var boltM = s.match(/5\s*[x×]\s*(112|120|130)/i);
    var cbM = s.match(/(?:cb|bore|center\s*bore)\s*[:=]?\s*(\d{2}(?:\.\d+)?)|(\d{2}\.\d+)\s*mm/i);
    var wheelRe = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:j)?\s*(?:et\s*([+-]?\d+(?:\.\d+)?)|([+-]\d+(?:\.\d+)?))/gi;
    var wheels = [];
    var m;
    while ((m = wheelRe.exec(s))) {
      wheels.push({
        diameter_in: parseFloat(m[1]),
        width_in: parseFloat(m[2]),
        offset_mm: parseFloat(m[3] != null ? m[3] : m[4]),
      });
    }
    if (!wheels.length) {
      return { error: 'Could not read specs. Use a format like 19x10 ET25 5x120.' };
    }
    return {
      front: wheels[0],
      rear: wheels[1] || wheels[0],
      square: wheels.length === 1,
      bolt: boltM ? ('5x' + boltM[1]) : null,
      center_bore_mm: cbM ? parseFloat(cbM[1] || cbM[2]) : null,
    };
  }

  function findCard(database, headerPrefix) {
    var cards = (database && database.chassis) || [];
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].header && cards[i].header.indexOf(headerPrefix) === 0) return cards[i];
    }
    return null;
  }

  function resolveGeometry(geometryDB, key) {
    if (!geometryDB || !key || !geometryDB.chassis || !geometryDB.chassis[key]) return null;
    var direct = geometryDB.chassis[key];
    var template = (direct.extends && geometryDB.templates && geometryDB.templates[direct.extends]) || {};
    var front = Object.assign({}, template.front || {}, direct.front || {});
    var rear = Object.assign({}, template.rear || {}, direct.rear || {});
    return Object.assign({}, template, direct, { front: front, rear: rear });
  }

  function fmtWheel(w) {
    return w.diameter_in + 'x' + w.width_in + ' ET' + w.offset_mm;
  }

  function scoreAxle(wheel, oem, clearance, budget, lowered) {
    var half = ((wheel.width_in - oem.width_in) / 2) * 25.4;
    var offsetDelta = oem.offset_mm - wheel.offset_mm;
    var outerPoke = half + offsetDelta + (lowered ? 4 : 0);
    var innerPush = half - offsetDelta;
    var outerLeft = clearance.oem_outer_clearance_mm - outerPoke;
    var innerLeft = clearance.oem_inner_clearance_mm - innerPush;
    var detail = 'vs OEM ' + oem.diameter_in + 'x' + oem.width_in + ' ET' + oem.offset_mm +
      ' · outer ' + (outerPoke >= 0 ? '+' : '') + round1(outerPoke) + ' mm' +
      ' · inner room ' + round1(innerLeft) + ' mm';

    var tier = 'YES_DIRECT_FIT';
    var mods = [];
    if (innerLeft < -15) {
      tier = 'NO_NOT_RECOMMENDED';
      mods.push('The wheel moves too far inboard for this chassis.');
    } else if (innerLeft < -8) {
      tier = 'MAYBE_HEAVY_MODS';
      mods.push('Inner clearance is used up. This needs a spacer, a higher offset, or a narrower wheel.');
    } else if (innerLeft < 3) {
      tier = 'YES_WITH_MODS';
      mods.push('Inner clearance is tight. A small hub-centric spacer can move the wheel out if the fender still has room.');
    }

    // Poke budgets are the extra outward travel past OEM. Stay inside them.
    var byPoke = 'NO_NOT_RECOMMENDED';
    if (outerPoke <= budget.safe_extra && innerLeft >= 5) byPoke = 'YES_DIRECT_FIT';
    else if (outerPoke <= budget.aggressive_street && innerLeft >= 0) byPoke = 'YES_WITH_MODS';
    else if (outerPoke <= budget.heavy_mod_track && innerLeft >= -8) byPoke = 'MAYBE_HEAVY_MODS';

    tier = worse(tier, byPoke);
    if (byPoke === 'YES_WITH_MODS') mods.push('Outer position is past a direct-fit poke. Plan on camber, a mild roll, or a tire-size change.');
    if (byPoke === 'MAYBE_HEAVY_MODS') mods.push('Outer poke is in heavy-mod territory (roll, pull, or significant camber).');
    if (byPoke === 'NO_NOT_RECOMMENDED' && innerLeft >= 0) mods.push('Outer poke is past the clearance budget for this chassis.');
    if (lowered && outerPoke > budget.safe_extra) mods.push('Lowered ride height was treated as about 4 mm less outer clearance.');

    return { tier: tier, detail: detail, mods: mods, outerPoke: outerPoke, innerLeft: innerLeft, outerLeft: outerLeft };
  }

  function scoreBrakes(diameter, caliperRadius, ccb) {
    if (!caliperRadius) return null;
    var need = caliperRadius + (ccb ? 10 : 6);
    var available = (diameter * 25.4 / 2) - 22;
    var gap = available - need;
    if (gap >= 8) {
      return { tier: 'YES_DIRECT_FIT', text: diameter + '" clears the modeled caliper with room.' };
    }
    if (gap >= 0) {
      return { tier: 'YES_WITH_MODS', text: diameter + '" is tight on caliper radius. Confirm the barrel, and a thin spacer only if the spoke design needs it.' };
    }
    if (gap >= -8) {
      return { tier: 'MAYBE_HEAVY_MODS', text: diameter + '" is likely too small for these brakes unless the barrel is specifically clearanced.' };
    }
    return { tier: 'NO_NOT_RECOMMENDED', text: diameter + '" is too small for the brakes on this chassis.' };
  }

  function evaluateFitment(specs, chassisName, context, data) {
    var setup = parseSetup(specs);
    if (setup.error) return { error: setup.error };
    var map = CHASSIS[chassisName];
    if (!map) return { error: 'That chassis is not in the mechanical table yet.' };
    var card = findCard(data.database, map.header);
    if (!card) return { error: 'Chassis data is missing for ' + chassisName + '.' };

    var rules = data.rules || {};
    var budgets = rules.clearance_budget_mm || {};
    var budget = budgets[map.budget] || { safe_extra: 8, aggressive_street: 14, heavy_mod_track: 22 };
    var geo = resolveGeometry(data.geometry, map.geometry);
    var ctx = String(context || '');
    var lowered = /lower|dropped|coilover|slammed/i.test(ctx);
    var ccb = /ccb|carbon ceramic|carbon-ceramic/i.test(ctx);
    var xdrive = /xdrive|awd|all[-\s]?wheel/i.test(ctx) || (geo && (geo.front.has_xdrive_driveshaft || geo.front.has_xdrive_driveshaft_variant));

    var tier = 'YES_DIRECT_FIT';
    var mods = [];
    var asks = [];
    var caveats = [];

    var boltText;
    if (!setup.bolt) {
      boltText = 'Not in the spec. This chassis is ' + card.bolt_pattern + '.';
      tier = worse(tier, 'YES_WITH_MODS');
      asks.push('What is the bolt pattern? This chassis needs ' + card.bolt_pattern + '.');
    } else if (setup.bolt === card.bolt_pattern) {
      boltText = setup.bolt + ' matches ' + chassisName + '.';
    } else {
      boltText = setup.bolt + ' does not match ' + card.bolt_pattern + '. Adapters are not treated as a direct fit.';
      tier = 'NO_NOT_RECOMMENDED';
      mods.push('Wrong bolt pattern. Do not run adapters unless you accept the thickness and the effective-offset change.');
    }

    var hub = card.center_bore_mm;
    var boreText;
    if (setup.center_bore_mm == null) {
      boreText = 'Not in the spec. Hub is ' + hub + ' mm. The wheel bore must be at least that.';
      asks.push('What is the center bore? It must be ≥ ' + hub + ' mm. A larger bore needs hub-centric rings.');
    } else if (setup.center_bore_mm + 0.3 < hub) {
      boreText = setup.center_bore_mm + ' mm is smaller than the ' + hub + ' mm hub. It will not seat.';
      tier = 'NO_NOT_RECOMMENDED';
      mods.push('Center bore is too small for this hub.');
    } else if (setup.center_bore_mm > hub + 0.4) {
      boreText = setup.center_bore_mm + ' mm is larger than the ' + hub + ' mm hub. Use hub-centric rings.';
      tier = worse(tier, 'YES_WITH_MODS');
      mods.push('Hub-centric rings (' + setup.center_bore_mm + ' → ' + hub + ' mm).');
    } else {
      boreText = setup.center_bore_mm + ' mm matches the ' + hub + ' mm hub.';
    }

    var frontBrake = null;
    var rearBrake = null;
    var frontFit = null;
    var rearFit = null;
    if (geo && geo.oem_front && geo.oem_rear) {
      frontBrake = scoreBrakes(setup.front.diameter_in, geo.front.brake_caliper_outer_radius_mm, ccb);
      rearBrake = scoreBrakes(setup.rear.diameter_in, geo.rear.brake_caliper_outer_radius_mm, ccb);
      frontFit = scoreAxle(setup.front, geo.oem_front, geo.front, budget, lowered);
      rearFit = scoreAxle(setup.rear, geo.oem_rear, geo.rear, budget, lowered);
      [frontBrake, rearBrake, frontFit, rearFit].forEach(function (part) {
        if (part) tier = worse(tier, part.tier);
      });
      frontFit.mods.concat(rearFit.mods).forEach(function (line) {
        if (mods.indexOf(line) === -1) mods.push(line);
      });
    } else {
      caveats.push('No wheel-well geometry for this chassis yet, so width and offset were not scored.');
      tier = worse(tier, 'YES_WITH_MODS');
      asks.push('Confirm width and offset against a known fitment for ' + chassisName + '.');
    }

    if (ccb && frontBrake && frontBrake.tier !== 'YES_DIRECT_FIT') {
      mods.push('Carbon-ceramic brakes were assumed, which tightens the diameter check.');
    }

    if (setup.square) {
      caveats.push('One size was entered, so both axles were scored as a square setup.');
    }

    if (xdrive && setup.front.diameter_in !== setup.rear.diameter_in) {
      caveats.push('xDrive: keep front and rear rolling diameters close. This spec changes diameter by axle.');
      tier = worse(tier, 'YES_WITH_MODS');
    }

    if (card.verification_status && /unverified|limited|partial/i.test(card.verification_status)) {
      caveats.push('Chassis card status: ' + card.verification_status + '.');
    }

    var whyBits = [];
    if (setup.bolt && setup.bolt !== card.bolt_pattern) {
      whyBits.push('Bolt pattern does not match this hub.');
    } else if (tier === 'YES_DIRECT_FIT') {
      whyBits.push('Bolt pattern, bore, diameter, and width/offset stay inside the direct-fit budget versus OEM.');
    } else if (tier === 'YES_WITH_MODS') {
      whyBits.push('It can work with common supporting changes. It is not a stock bolt-on on every axle.');
    } else if (tier === 'MAYBE_HEAVY_MODS') {
      whyBits.push('Only realistic with aggressive fitment work. The conservative call is not to promise a street bolt-on.');
    } else {
      whyBits.push('A hard mismatch showed up: pattern, bore, brakes, or poke past the heavy-mod budget.');
    }
    whyBits.push(DISCLAIMER);

    var brakeText = 'Not scored.';
    if (frontBrake && rearBrake) {
      brakeText = 'Front: ' + frontBrake.text + ' Rear: ' + rearBrake.text;
    }

    var recommendation = {
      YES_DIRECT_FIT: 'Reasonable to pursue if the bore and bolt pattern match the wheels in hand. Still test-fit.',
      YES_WITH_MODS: 'Buy only if you are ready for rings, a mild spacer, camber, or a tire adjustment. Test-fit before mounting.',
      MAYBE_HEAVY_MODS: 'Treat this as a project fit, not a daily bolt-on. Get a second measurement before you pay.',
      NO_NOT_RECOMMENDED: 'Skip this setup on this chassis unless the spec you typed is wrong.',
    }[tier];

    return {
      verdict: tier,
      verdict_short: SHORT[tier],
      why: whyBits.join(' '),
      disclaimer: DISCLAIMER,
      breakdown: {
        bolt_pattern: boltText,
        center_bore: boreText,
        brake_clearance: brakeText,
        front_fitment: frontFit ? (fmtWheel(setup.front) + ' ' + frontFit.detail) : 'Width/offset not scored.',
        rear_fitment: rearFit ? (fmtWheel(setup.rear) + ' ' + rearFit.detail) : 'Width/offset not scored.',
        tire_concerns: (rules.tire_caveats && rules.tire_caveats[0]) || 'Tire brand and overall diameter change the result.',
        required_mods: mods,
      },
      buyer_recommendation: recommendation,
      ask_seller: asks,
      data_caveats: caveats.join(' '),
      geometry_key: map.geometry,
      square: setup.square,
      front: setup.front,
      rear: setup.rear,
    };
  }

  return {
    parseSetup: parseSetup,
    evaluateFitment: evaluateFitment,
    DISCLAIMER: DISCLAIMER,
    CHASSIS: CHASSIS,
  };
});
