import { Camera, ImagePlus, X } from 'lucide-react';

interface Props {
  images: { file: File; preview: string }[];
  onAdd: (files: File[]) => void;
  onRemove: (idx: number) => void;
  disabled?: boolean;
}

export const InvoiceCameraCapture = ({ images, onAdd, onRemove, disabled }: Props) => {
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    onAdd(Array.from(files));
  };

  const tileClass =
    'h-20 flex flex-col items-center justify-center gap-1 rounded-md border text-sm font-medium cursor-pointer select-none transition-colors';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label
          htmlFor="invoice-camera-input"
          className={`${tileClass} bg-primary text-primary-foreground hover:bg-primary/90 ${
            disabled ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <Camera className="h-6 w-6" />
          <span>Take Photo</span>
          <input
            id="invoice-camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>

        <label
          htmlFor="invoice-library-input"
          className={`${tileClass} bg-background hover:bg-accent hover:text-accent-foreground ${
            disabled ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <ImagePlus className="h-6 w-6" />
          <span>From Library</span>
          <input
            id="invoice-library-input"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
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
