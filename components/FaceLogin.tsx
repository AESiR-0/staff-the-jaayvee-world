"use client";
import { useRef, useState, useCallback } from "react";
import { Camera, RotateCcw, Check, AlertCircle, Lightbulb } from "lucide-react";
import Image from "next/image";
import { FaceVerificationError } from "@/lib/types";

interface FaceLoginProps {
  onCapture: (imageData: string) => void;
  onError?: (error: FaceVerificationError) => void;
  isVerifying?: boolean;
}

export default function FaceLogin({ onCapture, onError, isVerifying = false }: FaceLoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Unable to access camera. Please allow camera permissions.");
      console.error("Camera access error:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const validateImage = useCallback((imageData: string): FaceVerificationError | null => {
    // Basic image validation
    if (!imageData || imageData.length < 1000) {
      return {
        code: 'POOR_QUALITY',
        message: 'Image quality too poor. Use clearer image'
      };
    }

    // Check image size (max 5MB)
    const sizeInBytes = (imageData.length * 3) / 4; // Approximate base64 to bytes
    if (sizeInBytes > 5 * 1024 * 1024) {
      return {
        code: 'POOR_QUALITY',
        message: 'Image too large. Please use a smaller image'
      };
    }

    return null;
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        
        // Validate image quality
        const validationError = validateImage(imageData);
        if (validationError) {
          onError?.(validationError);
          return;
        }

        setCapturedImage(imageData);
        setIsCaptured(true);
        onCapture(imageData);
        stopCamera();
      }
    }
  }, [onCapture, stopCamera, validateImage, onError]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setIsCaptured(false);
    startCamera();
  }, [startCamera]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative bg-fg rounded-xl overflow-hidden">
        {!isCaptured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center text-white">
                  <Camera size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Camera not started</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-muted">
            <Image
              src={capturedImage!}
              alt="Captured face"
              width={640}
              height={480}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Instructions */}
      {stream && !isCaptured && (
        <div className="mt-4 p-4 bg-primary-accent-light rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="text-primary-accent mt-0.5" size={16} />
            <div className="text-sm text-primary-fg">
              <p className="font-medium mb-2">For best results:</p>
              <ul className="space-y-1 text-primary-muted">
                <li>• Face the camera directly</li>
                <li>• Ensure good lighting</li>
                <li>• Keep your face centered</li>
                <li>• Remove glasses if possible</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-3 justify-center">
        {!isCaptured ? (
          <>
            {!stream ? (
              <button
                onClick={startCamera}
                disabled={isVerifying}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Camera size={20} />
                {isVerifying ? "Starting..." : "Start Camera"}
              </button>
            ) : (
              <button
                onClick={capturePhoto}
                disabled={isVerifying}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Camera size={20} />
                {isVerifying ? "Capturing..." : "Capture Photo"}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={retakePhoto}
            disabled={isVerifying}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw size={20} />
            Retake
          </button>
        )}
      </div>

      {isCaptured && (
        <div className="mt-3 flex items-center justify-center gap-2 text-primary-accent">
          <Check size={16} />
          <span className="text-sm font-medium">Photo captured successfully</span>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
