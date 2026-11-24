import { useState } from 'react';
import { Range, Select } from '../../components/tools/kit';
import { canEncode, processImage } from '../../lib/file-processing/image';
import { extForMime } from '../../lib/file-processing/image-geometry';
import { withSuffix } from '../../lib/security/url';
import { BatchImageTool, outputMimeFor } from './shared';

type Target = 'keep' | 'image/jpeg' | 'image/webp';

export default function ImageCompressor() {
  const [quality, setQuality] = useState(75);
  const [target, setTarget] = useState<Target>('keep');
  return (
    <BatchImageTool
      actionLabel="Compress images"
      zipName="compressed-images.zip"
      options={
        <>
          <Range label="Quality" value={quality} onChange={setQuality} min={10} max={100} format={(v) => `${v}%`} />
          <Select<Target>
            label="Output format"
            value={target}
            onChange={setTarget}
            hint="PNG is lossless: choose JPEG or WebP for real savings on photos."
            options={[
              { value: 'keep', label: 'Keep original format' },
              { value: 'image/jpeg', label: 'JPEG' },
              { value: 'image/webp', label: 'WebP' },
            ]}
          />
        </>
      }
      process={async (f) => {
        const mime = target === 'keep' ? outputMimeFor(f.type) : target;
        if (mime === 'image/webp' && !(await canEncode('image/webp'))) throw new Error('Your browser cannot encode WebP. Choose JPEG instead.');
        const blob = await processImage(f.file, { mime, quality: quality / 100 });
        const bigger = blob.size >= f.size && mime === f.type;
        return {
          id: f.id,
          name: withSuffix(f.name, 'compressed', extForMime(mime)),
          blob: bigger ? f.file : blob,
          originalSize: f.size,
          note: bigger
            ? 'Re-encoding did not make this file smaller, so the original is kept.'
            : mime === 'image/png'
              ? 'PNG is lossless: the quality setting does not apply.'
              : undefined,
        };
      }}
    />
  );
}
