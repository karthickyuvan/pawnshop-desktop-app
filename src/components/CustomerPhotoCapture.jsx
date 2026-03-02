import { useEffect, useRef, useState } from "react";
import { saveCustomerPhoto } from "../services/customerApi";

export default function CustomerPhotoCapture({ customerId, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // Keep track of stream to stop it later
  
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);

  // --- 1. HELPER: Stop Camera ---
  const stopCamera = () => {
    if (streamRef.current) {
      // Stop all tracks (video/audio) to turn off the hardware light
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // --- 2. HELPER: Start Camera ---
  const startCamera = async () => {
    setError(null);
    try {
      // Ensure previous stream is stopped before starting new one
      stopCamera();

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  // --- 3. LIFECYCLE: Init & Cleanup ---
  useEffect(() => {
    startCamera();

    // Cleanup function: Runs when component closes/unmounts
    return () => {
      stopCamera();
    };
  }, []);

  // --- 4. ACTIONS ---
  
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(base64);
      
      // ✅ Turn off camera immediately after capture to save battery/privacy
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(); // Restart the stream
  };

  const handleConfirm = async () => {
    // Ensure camera is off
    stopCamera();

    if (!capturedImage) return;

    const cleanBase64 = capturedImage.replace(/^data:image\/[a-z]+;base64,/, "");

    // A. New Customer (Pass back to parent)
    if (!customerId) {
      onCapture(cleanBase64, null); 
      return;
    }

    // B. Existing Customer (Save to DB)
    try {
      const path = await saveCustomerPhoto(customerId, cleanBase64);
      onCapture(null, path); 
    } catch (err) {
      console.error(err);
      alert("Failed to save photo: " + err);
    }
  };

  const handleCancel = () => {
    stopCamera(); // ✅ Ensure light goes off
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: '500px', textAlign: 'center' }}>
        <h3>Capture Photo</h3>
        
        {error ? (
          <div style={{ color: 'red', padding: '20px' }}>{error}</div>
        ) : (
          <div style={{ background: '#000', margin: '0 auto', height: '300px', borderRadius:'8px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {!capturedImage ? (
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={capturedImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
          {!capturedImage ? (
            <button className="primary-btn" onClick={handleCapture} disabled={!!error}>Capture</button>
          ) : (
            <>
              <button className="secondary-btn" onClick={handleRetake}>Retake</button>
              <button className="primary-btn" onClick={handleConfirm}>
                {customerId ? "Save & Close" : "Use Photo"}
              </button>
            </>
          )}
          <button className="secondary-btn" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}