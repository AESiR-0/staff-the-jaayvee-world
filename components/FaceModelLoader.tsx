"use client";
import { useEffect, useState } from "react";
import { loadFaceModels } from "@/lib/face-recognition-client";

export default function FaceModelLoader() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const success = await loadFaceModels();
        setModelsLoaded(success);
      } catch (error) {
        console.error('Error loading face models:', error);
        setModelsLoaded(false);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // This component doesn't render anything
  return null;
}


