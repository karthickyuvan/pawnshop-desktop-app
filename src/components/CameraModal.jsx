// import { useEffect, useRef, useState } from "react";

// export default function CameraModal({ onCapture, onClose }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [error, setError] = useState(null);

//   // 1. Start Camera on Mount
//   useEffect(() => {
//     let currentStream = null;

//     // ✅ SAFETY CHECK: Verify browser support
//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       setError("Camera API is not supported in this environment.");
//       return;
//     }

//     navigator.mediaDevices
//       .getUserMedia({ video: { width: 640, height: 480 } })
//       .then((mediaStream) => {
//         currentStream = mediaStream;
//         if (videoRef.current) {
//           videoRef.current.srcObject = mediaStream;
//         }
//       })
//       .catch((err) => {
//         console.error("Camera Access Error:", err);
//         setError("Unable to access camera. Check OS permissions.");
//       });

//     // Cleanup: Stop camera when modal closes
//     return () => {
//       if (currentStream) {
//         currentStream.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, []);

//   // 2. Capture Image
//   const handleCapture = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;

//     if (video && canvas) {
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;

//       const context = canvas.getContext("2d");
//       context.drawImage(video, 0, 0, canvas.width, canvas.height);

//       // Convert to Base64 String
//       const base64Image = canvas.toDataURL("image/jpeg", 0.8);
//       onCapture(base64Image);
//     }
//   };

//   return (
//     <div className="camera-overlay">
//       <div className="camera-box">
//         <h3>Capture Photo</h3>
        
//         {/* Error State */}
//         {error ? (
//           <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
//             <p>{error}</p>
//             <p style={{fontSize: '12px', color:'#666'}}>
//               (On macOS, ensure 'Info.plist' has NSCameraUsageDescription)
//             </p>
//           </div>
//         ) : (
//           <div className="video-container">
//             <video ref={videoRef} autoPlay playsInline className="video-feed" />
//             <canvas ref={canvasRef} style={{ display: "none" }} />
//           </div>
//         )}

//         <div className="camera-actions">
//           <button className="btn btn-secondary" onClick={onClose}>
//             Cancel
//           </button>
//           {!error && (
//             <button className="btn btn-primary" onClick={handleCapture}>
//               Click Photo
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }







import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast"; // 🚀 Imported toast

export default function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  // 1. Start Camera on Mount
  useEffect(() => {
    let currentStream = null;

    // ✅ SAFETY CHECK: Verify browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const apiError = "Camera API is not supported in this environment.";
      setError(apiError);
      toast.error(apiError); // 🚀 Fire toast if system context locks out media capture APIs
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((mediaStream) => {
        currentStream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((err) => {
        console.error("Camera Access Error:", err);
        const accessError = "Unable to access camera. Check permissions.";
        setError(accessError);
        toast.error(accessError); // 🚀 Fire toast if OS or browser level blocks permission requests
      });

    // Cleanup: Stop camera when modal closes
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Capture Image
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to Base64 String
      const base64Image = canvas.toDataURL("image/jpeg", 0.8);
      onCapture(base64Image);
      toast.success("Photo captured successfully!"); // 🚀 Fire success toast on frame freezing
    } else {
      toast.error("Failed to capture snapshot. Video feed streaming invalid.");
    }
  };

  return (
    <div className="camera-overlay">
      <div className="camera-box">
        <h3>Capture Photo</h3>
        
        {/* Error State */}
        {error ? (
          <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
            <p>{error}</p>
            <p style={{fontSize: '12px', color:'#666'}}>
              (On macOS, ensure 'Info.plist' has NSCameraUsageDescription)
            </p>
          </div>
        ) : (
          <div className="video-container">
            <video ref={videoRef} autoPlay playsInline className="video-feed" />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        <div className="camera-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {!error && (
            <button className="btn btn-primary" onClick={handleCapture}>
              Click Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}