import { useState } from 'react';
import { Range, Select } from '../../components/tools/kit';
import { canEncode, processImage } from '../../lib/file-processing/image';
import { extForMime } from '../../lib/file-processing/image-geometry';
import { withExtension } from '../../lib/security/url';
import { BatchImageTool } from './shared';

type Mime = 'image/jpeg' | 'image/png' | 'image/webp';

export default function ImageConverter() {
  const [target, setTarget] = useState<Mime>('image/webp');
  const [quality, setQuality] = useState(90);
  const [bg, setBg] = useState('#ffffff');
  return (
    <BatchImageTool
      actionLabel="Convert images"
      zipName="converted-images.zip"
      options={
        <>
          <Select<Mime>
            label="Convert to"
            value={target}
            onChange={setTarget}
            options={[
              { value: 'image/webp', label: 'WebP' },
              { value: 'image/jpeg', label: 'JPEG' },
              { value: 'image/png', label: 'PNG' },
            ]}
          />
          {target !== 'image/png' && <Range label="Quality" value={quality} onChange={setQuality} min={10} max={100} format={(v) => `${v}%`} />}
          {target === 'image/jpeg' && (
            <div>
              <label className="label" htmlFor="conv-bg">
                Background for transparent areas
              </label>
              <input id="conv-bg" type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-20 rounded border" />
            </div>
          )}
        </>
      }
      process={async (f) => {
        if (!(await canEncode(target))) throw new Error(`Your browser cannot encode ${target.replace('image/', '').toUpperCase()}.`);
        const blob = await processImage(f.file, { mime: target, quality: quality / 100, background: target === 'image/jpeg' ? bg : null });
        return { id: f.id, name: withExtension(f.name, extForMime(target)), blob, originalSize: f.size };
      }}
    />
  );
}
