import React, { useState, useRef, useEffect } from 'react';
import { Camera, StopCircle } from 'lucide-react';

const CameraScanPanel = () => {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [count, setCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Prefer back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready before starting interval
        videoRef.current.onloadedmetadata = () => {
           videoRef.current.play();
           setScanning(true);
           // Start the capture loop
           intervalRef.current = setInterval(captureAndSend, 3000);
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please allow permissions.");
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const captureAndSend = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Prevent overlapping requests if one is slow
    if (isProcessing) return; 

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
            setIsProcessing(false);
            return;
        }

        const formData = new FormData();
        const driverId = localStorage.getItem('driver_id');
        
        if (!driverId) {
            setCameraError("Driver ID not found. Please login again.");
            stopScanning();
            setIsProcessing(false);
            return;
        }

        formData.append('file', blob, 'capture.jpg');
        // formData.append('driver_id', driverId); // Passed as query param in endpoint definition

        try {
          const res = await fetch(`http://localhost:8000/cv/detect?driver_id=${driverId}`, {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            setCount(data.passenger_count);
          } else {
            console.warn("Scan upload failed", res.status);
          }
        } catch (error) {
          console.error("Scan error:", error);
        } finally {
            setIsProcessing(false);
        }
      }, 'image/jpeg', 0.8); // 80% quality jpeg

    } catch (err) {
      console.error("Capture loop error:", err);
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: '20px', 
      right: '20px', 
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }}>
      <div className="location-panel" style={{ flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        
        {/* Header / Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} /> Passenger Scan
          </h3>
          
          {!scanning ? (
            <button 
              onClick={startScanning}
              style={{ 
                backgroundColor: '#3b82f6', color: 'white', border: 'none', 
                padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              Start <Camera size={16} />
            </button>
          ) : (
            <button 
              onClick={stopScanning}
              style={{ 
                backgroundColor: '#ef4444', color: 'white', border: 'none', 
                padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              Stop <StopCircle size={16} />
            </button>
          )}
        </div>

        {/* Hidden Video for Capture */}
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ display: 'none' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Text Display Only */}
        {scanning && (
            <div style={{ textAlign: 'center', color: 'white', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{count}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Passengers</div>
            </div>
        )}

        {cameraError && (
          <div style={{ color: '#f87171', fontSize: '0.9rem' }}>{cameraError}</div>
        )}

      </div>
    </div>
  );
};

export default CameraScanPanel;
