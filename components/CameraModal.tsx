
import React, { useRef, useState, useCallback } from 'react';

interface CameraModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Erro ao acessar a câmera. Verifique as permissões.");
    }
  }, []);

  React.useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-[60vh] object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute bottom-6 left-0 right-0 flex justify-around items-center">
          <button 
            onClick={onClose}
            className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <button 
            onClick={capture}
            className="p-6 bg-white rounded-full hover:scale-105 transition-transform border-4 border-gray-300"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
          </button>
          
          <div className="w-14"></div> {/* Spacer */}
        </div>
      </div>
      <p className="mt-4 text-white text-sm font-medium">Aponte para o odômetro e capture</p>
    </div>
  );
};

export default CameraModal;
