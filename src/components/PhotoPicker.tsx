import { Camera, ImagePlus, Leaf, RotateCcw, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Button, Card } from './UI';
import { useTranslation } from '../hooks/useTranslation';

export function PhotoPicker() {
  const t = useTranslation();
  const navigate = useNavigate();
  const selectedImage = useAppStore((state) => state.selectedImage);
  const setSelectedImage = useAppStore((state) => state.setSelectedImage);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(selectedImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [cameraOpen]);

  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function selectFile(file?: File) {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError(t('chooseImageError'));
      return;
    }
    setSelectedImage(file);
    stopCamera();
    setCameraOpen(false);
  }

  async function openCamera() {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t('cameraUnavailable'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError(t('cameraDenied'));
    }
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) selectFile(new File([blob], `plantpulse-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6"><p className="eyebrow">{t('takePhotoEyebrow')}</p><h1 className="page-title">{t('takePhotoTitle')}</h1><p className="mt-2 text-coffee">{t('takePhotoIntro')}</p></div>
      {cameraOpen ? (
        <Card className="overflow-hidden p-3 sm:p-5">
          <div className="camera-frame">
            <video ref={videoRef} autoPlay playsInline muted aria-label={t('cameraPreview')} />
            <div className="leaf-frame" aria-hidden="true"><Leaf size={58} /></div>
          </div>
          <ul className="my-4 grid gap-2 text-sm font-bold text-coffee sm:grid-cols-2"><li>☀️ {t('daylight')}</li><li>🍃 {t('affectedLeaf')}</li></ul>
          <div className="flex flex-wrap gap-3"><Button onClick={takePhoto}><Camera size={20} />{t('usePhoto')}</Button><button className="button button-secondary" onClick={() => { stopCamera(); setCameraOpen(false); }}><RotateCcw size={20} />{t('closeCamera')}</button></div>
        </Card>
      ) : preview ? (
        <Card className="p-4 sm:p-6">
          <img src={preview} alt={t('selectedLeafAlt')} className="mx-auto max-h-[55vh] w-full rounded-2xl object-contain" />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate('/analyzing')}><Leaf size={20} />{t('usePhoto')}</Button>
            <label className="button button-secondary cursor-pointer"><RotateCcw size={20} />{t('retakeChoose')}<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => selectFile(event.target.files?.[0])} /></label>
          </div>
        </Card>
      ) : (
        <Card
          className={`p-5 sm:p-8 ${dragging ? 'ring-4 ring-forest/20' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}
        >
          <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-forest/20 bg-warm px-5 py-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white text-forest shadow-sm"><ImagePlus size={31} /></span>
            <h2 className="mt-4 text-xl font-extrabold">{t('addClearPhoto')}</h2>
            <p className="mt-2 max-w-sm text-coffee">{t('photoAdvice')}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button onClick={openCamera}><Camera size={20} />{t('openCamera')}</Button>
              <label className="button button-secondary cursor-pointer"><Upload size={20} />{t('choosePhoto')}<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => selectFile(event.target.files?.[0])} /></label>
            </div>
            <p className="mt-4 text-xs font-bold text-coffee-light md:hidden">{t('dragPhoto')}</p>
          </div>
        </Card>
      )}
      {(cameraError || error) && <p className="notice notice-error mt-4" role="alert">{cameraError || error}</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="tip-card"><span>☀️</span><div><strong>{t('daylight')}</strong><p>{t('steadyPhone')}</p></div></div><div className="tip-card"><span>🍃</span><div><strong>{t('wholeLeaf')}</strong><p>{t('focusLeaf')}</p></div></div></div>
    </div>
  );
}
