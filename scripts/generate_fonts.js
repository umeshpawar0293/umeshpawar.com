import fs from 'fs';
import path from 'path';
import opentype from 'opentype.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function convertTtfToTypefaceJson(ttfPath, familyName, styleName) {
  const buffer = fs.readFileSync(ttfPath);
  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
  const result = { glyphs: {} };

  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);
    const unicodes = [];
    if (glyph.unicode !== undefined) unicodes.push(glyph.unicode);
    if (glyph.unicodes && glyph.unicodes.length) {
      glyph.unicodes.forEach((u) => {
        if (!unicodes.includes(u)) unicodes.push(u);
      });
    }

    unicodes.forEach((unicode) => {
      const token = {
        ha: Math.round(glyph.advanceWidth * scale),
        x_min: Math.round((glyph.xMin || 0) * scale),
        x_max: Math.round((glyph.xMax || 0) * scale),
        o: '',
      };

      glyph.path.commands.forEach((cmd) => {
        let type = cmd.type.toLowerCase();
        if (type === 'c') type = 'b';
        token.o += type + ' ';
        if (cmd.x !== undefined && cmd.y !== undefined) {
          token.o += Math.round(cmd.x * scale) + ' ' + Math.round(cmd.y * scale) + ' ';
        }
        if (cmd.x1 !== undefined && cmd.y1 !== undefined) {
          token.o += Math.round(cmd.x1 * scale) + ' ' + Math.round(cmd.y1 * scale) + ' ';
        }
        if (cmd.x2 !== undefined && cmd.y2 !== undefined) {
          token.o += Math.round(cmd.x2 * scale) + ' ' + Math.round(cmd.y2 * scale) + ' ';
        }
      });

      result.glyphs[String.fromCodePoint(unicode)] = token;
    });
  }

  // Synthesize chubby down arrow '↓' if not present
  if (!result.glyphs['↓']) {
    result.glyphs['↓'] = {
      ha: 600,
      x_min: 80,
      x_max: 520,
      // Chubby arrow pointing downwards
      o: 'm 300 120 l 100 380 l 230 380 l 230 720 l 370 720 l 370 380 l 500 380 l 300 120 ',
    };
  }

  result.familyName = familyName;
  result.ascender = Math.round(font.ascender * scale);
  result.descender = Math.round(font.descender * scale);
  result.underlinePosition = Math.round((font.tables?.post?.underlinePosition || -100) * scale);
  result.underlineThickness = Math.round((font.tables?.post?.underlineThickness || 50) * scale);
  result.boundingBox = {
    yMin: Math.round((font.tables?.head?.yMin || font.descender || -200) * scale),
    xMin: Math.round((font.tables?.head?.xMin || 0) * scale),
    yMax: Math.round((font.tables?.head?.yMax || font.ascender || 800) * scale),
    xMax: Math.round((font.tables?.head?.xMax || 1000) * scale),
  };
  result.resolution = 1000;
  result.cssFontWeight = styleName.toLowerCase().includes('bold') ? 'bold' : 'normal';
  result.cssFontStyle = 'normal';

  return result;
}

// Convert Fredoka Bold
const fredokaJson = convertTtfToTypefaceJson('/tmp/Fredoka-Bold.ttf', 'Fredoka', 'Bold');
const fredokaOut = path.join(rootDir, 'public', 'fonts', 'Fredoka_Bold.json');
fs.writeFileSync(fredokaOut, JSON.stringify(fredokaJson));
console.log(`Generated ${fredokaOut} (${Object.keys(fredokaJson.glyphs).length} glyphs)`);

// Convert Sniglet Regular
if (fs.existsSync('/tmp/Sniglet-Regular.ttf')) {
  const snigletJson = convertTtfToTypefaceJson('/tmp/Sniglet-Regular.ttf', 'Sniglet', 'Regular');
  const snigletOut = path.join(rootDir, 'public', 'fonts', 'Sniglet_Regular.json');
  fs.writeFileSync(snigletOut, JSON.stringify(snigletJson));
  console.log(`Generated ${snigletOut} (${Object.keys(snigletJson.glyphs).length} glyphs)`);
}
