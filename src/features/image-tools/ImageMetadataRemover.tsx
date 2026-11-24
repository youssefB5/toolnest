import { Notice } from '../../components/tools/kit';
import { processImage } from '../../lib/file-processing/image';
import { extForMime } from '../../lib/file-processing/image-geometry';
import { withSuffix } from '../../lib/security/url';
import { BatchImageTool, outputMimeFor } from './shared';

export default function ImageMetadataRemover() {
  return (
    <BatchImageTool
      actionLabel="Remove metadata"
      zipName="clean-images.zip"
      showSavings={false}
      options={
        <div className="sm:col-span-2">
          <Notice>
            Each image is redrawn on a canvas and re-encoded. EXIF, GPS, camera serial numbers, XMP and embedded thumbnails are not copied. JPEG is saved at 95%
            quality.
          </Notice>
        </div>
      }
      process={async (f) => {
        const mime = outputMimeFor(f.type);
        const blob = await processImage(f.file, { mime, quality: 0.95, background: null });
        return { id: f.id, name: withSuffix(f.name, 'clean', extForMime(mime)), blob, originalSize: f.size };
      }}
    />
  );
}
