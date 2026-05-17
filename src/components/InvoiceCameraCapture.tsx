import { useRef } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  images: { file: File; preview: string }[];
  onAdd: (files: File[]) => void;
  onRemove: (idx: number) => void;
  disabled?: boolean;
}

export const InvoiceCameraCapture = ({ images, onAdd, onRemove, disabled }: Props) => {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    onAdd(Array.from(files));
  };

  return (
    <div className="space-y-4">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="default"
          className="h-20 flex-col gap-1"
          disabled={disabled}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="h-6 w-6" />
          <span>Take Photo</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-20 flex-col gap-1"
          disabled={disabled}
          onClick={() => libraryRef.current?.click()}
        >
          <ImagePlus className="h-6 w-6" />
          <span>From Library</span>
        </Button>
      </div>

      {images.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            {images.length} {images.length === 1 ? 'page' : 'pages'}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-[3/4] rounded-md overflow-hidden border bg-muted">
                <img src={img.preview} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  disabled={disabled}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-90"
                  aria-label="Remove page"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                  Page {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
