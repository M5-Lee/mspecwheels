/**
 * Smoke check for factory-size direct fit.
 * Run: node scripts/fitment_oem_smoke.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var engine = require('../fitment_engine.js');

var root = path.join(__dirname, '..');
var data = {
  database: JSON.parse(fs.readFileSync(path.join(root, 'chassis_database.json'), 'utf8')),
  geometry: JSON.parse(fs.readFileSync(path.join(root, 'chassis_geometry.json'), 'utf8')),
  rules: JSON.parse(fs.readFileSync(path.join(root, 'assets/fitment/RULE-TABLES.json'), 'utf8')),
};

var failed = 0;

function run(chassis, specs, ctx) {
  return engine.evaluateFitment(specs, chassis, ctx || '', data);
}

function expectVerdict(chassis, specs, ctx, expected) {
  var result = run(chassis, specs, ctx);
  var got = result.verdict_short || result.error;
  if (got !== expected) {
    failed += 1;
    console.error('FAIL  ' + chassis + '  ' + specs + '\n      expected ' + expected + '\n      got      ' + got);
  } else {
    console.log('ok    ' + expected + '  ' + chassis + '  ' + specs);
  }
  return result;
}

var g90 = expectVerdict('G90 M5', '20x10.5 ET28 F / 21x11 ET28 R 5x132', '', 'YES — DIRECT FIT');
if (!g90.data_caveats || g90.data_caveats.indexOf('xDrive') === -1) {
  failed += 1;
  console.error('FAIL  G90 OEM should keep an xDrive note');
}
if (!g90.breakdown || g90.breakdown.center_bore.indexOf('Not in the spec') === -1) {
  failed += 1;
  console.error('FAIL  G90 OEM should keep the missing center-bore note');
}

var f90 = expectVerdict('F90 M5', '20x9.5 ET28 / 20x10.5 ET28', '', 'YES — DIRECT FIT');
if (!f90.breakdown || f90.breakdown.center_bore.indexOf('Not in the spec') === -1) {
  failed += 1;
  console.error('FAIL  F90 OEM should keep the missing center-bore note');
}

expectVerdict('G90 M5', '20x10.5 ET28 / 21x11 ET28 5x132 cb 66.6', '', 'YES — DIRECT FIT');
expectVerdict('G90 M5', '20x10.5 ET27 / 21x11 ET29 5x132', '', 'YES — DIRECT FIT');
expectVerdict('G80 M3', '19x9.5 ET20 / 20x10.5 ET20 5x112', '', 'YES — DIRECT FIT');

expectVerdict('G90 M5', '20x10.5 ET28 / 21x11 ET28 5x132 cb 60', '', 'NO — NOT RECOMMENDED');
expectVerdict('G90 M5', '20x10.5 ET28 / 21x11 ET28 5x132 cb 72.56', '', 'YES — WITH MODS');
expectVerdict('G90 M5', '20x10.5 ET28 / 21x11 ET28 5x112', '', 'NO — NOT RECOMMENDED');
expectVerdict('G90 M5', '20x10.5 ET26 / 21x11 ET28 5x132', '', 'YES — WITH MODS');
expectVerdict('G90 M5', '20x10 ET28 / 21x11 ET28 5x132', '', 'YES — WITH MODS');
expectVerdict('G90 M5', '19x9.5 ET28 / 20x10.5 ET28 5x132', '', 'MAYBE — HEAVY MODS');
expectVerdict('G80 M3', '19x10 ET25 5x112', '', 'YES — DIRECT FIT');
expectVerdict('G80 M3', '20x10 ET15 5x120', '', 'NO — NOT RECOMMENDED');
expectVerdict('G80 M3', '21x10.5 ET10', 'lowered, -3 camber, willing to roll', 'MAYBE — HEAVY MODS');
expectVerdict('G80 M3', '19x10 ET15 / 20x11 ET10 5x112', '', 'YES — WITH MODS');
expectVerdict('F80 M3', '19x9 ET29 5x120', '', 'YES — DIRECT FIT');
expectVerdict('E39 M5', '18x9.5 ET22', '', 'YES — WITH MODS');
expectVerdict('E46 M3', '18x9 ET30 5x120', '', 'NO — NOT RECOMMENDED');
expectVerdict('F90 M5', '21x10.5 ET20 / 21x11.5 ET20 5x112', 'xdrive', 'MAYBE — HEAVY MODS');
expectVerdict('F95 X5 M', '21x10 ET35 / 22x11 ET25 5x112', '', 'YES — WITH MODS');
expectVerdict('F96 X6 M', '21x10.5 ET30 / 22x11.5 ET28 5x112', '', 'MAYBE — HEAVY MODS');
expectVerdict('E30 M3', '16x7 ET20 5x120', '', 'YES — WITH MODS');
expectVerdict('G99 M5 Touring', '20x10.5 ET28 / 21x11 ET28 5x132', '', 'YES — WITH MODS');

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('fitment OEM smoke passed');
