/* Pure image helpers (unit-tested). */

/** Build a .ico file containing PNG-compressed images (supported by all modern browsers and Windows Vista+). */
export function buildIco(images: { size: number; png: Uint8Array }[]): Uint8Array {
  const count = images.length;
  const headerSize = 6 + 16 * count;
  const total = headerSize + images.reduce((s, i) => s + i.png.length, 0);
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint16(0, 0, true); // reserved
  dv.setUint16(2, 1, true); // type: icon
  dv.setUint16(4, count, true);
  let offset = headerSize;
  images.forEach((img, i) => {
    const e = 6 + i * 16;
    out[e] = img.size >= 256 ? 0 : img.size; // width (0 = 256)
    out[e + 1] = img.size >= 256 ? 0 : img.size; // height
    out[e + 2] = 0; // palette
    out[e + 3] = 0; // reserved
    dv.setUint16(e + 4, 1, true); // color planes
    dv.setUint16(e + 6, 32, true); // bits per pixel
    dv.setUint32(e + 8, img.png.length, true);
    dv.setUint32(e + 12, offset, true);
    out.set(img.png, offset);
    offset += img.png.length;
  });
  return out;
}

export function faviconHtml(prefix = '/'): string {
  const p = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return [
    `<link rel="icon" href="${p}favicon.ico" sizes="48x48">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="${p}favicon-32x32.png">`,
    `<link rel="icon" type="image/png" sizes="16x16" href="${p}favicon-16x16.png">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="${p}apple-touch-icon.png">`,
    `<link rel="manifest" href="${p}site.webmanifest">`,
  ].join('\n');
}

export function webManifest(name: string, color: string, prefix = '/') {
  const p = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return JSON.stringify(
    {
      name,
      short_name: name.slice(0, 12),
      icons: [
        { src: `${p}android-chrome-192x192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${p}android-chrome-512x512.png`, sizes: '512x512', type: 'image/png' },
      ],
      theme_color: color,
      background_color: color,
      display: 'standalone',
    },
    null,
    2,
  );
}

/** Remove dangerous constructs from SVG markup before rendering it as an image (defense in depth). */
export function basicSvgSanitize(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href\s*=\s*)("|')\s*(?!#|data:image\/)[^"']*\2/gi, '$1$2#$2');
}

/** Parse width/height/viewBox from SVG markup. */
export function svgIntrinsicSize(svg: string): { width: number; height: number } | null {
  const tag = /<svg\b[^>]*>/i.exec(svg)?.[0];
  if (!tag) return null;
  const num = (name: string) => {
    const m = new RegExp(`\\s${name}\\s*=\\s*["']?([\\d.]+)(px)?["']?`, 'i').exec(tag);
    return m ? Number(m[1]) : null;
  };
  const w = num('width');
  const h = num('height');
  const vb = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(tag);
  if (w && h) return { width: w, height: h };
  if (vb) {
    const vw = Number(vb[1]);
    const vh = Number(vb[2]);
    if (w) return { width: w, height: (w * vh) / vw };
    if (h) return { width: (h * vw) / vh, height: h };
    return { width: vw, height: vh };
  }
  return null;
}

/** Ensure the root <svg> has explicit width/height so browsers rasterize it at the right size. */
export function withSvgSize(svg: string, width: number, height: number): string {
  return svg.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => {
    const cleaned = attrs.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    const ns = /xmlns=/.test(cleaned) ? '' : ' xmlns="http://www.w3.org/2000/svg"';
    return `<svg${cleaned}${ns} width="${width}" height="${height}">`;
  });
}

export function rgbToHexStr(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
