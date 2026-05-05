import { useState, useRef, useEffect } from "react";
import Peer from "peerjs";
import "./Conf.css";

export const Conf = () => {
    const [myId, setMyId] = useState('');
    const [remoteId, setRemoteId] = useState('');
    


  // Ref untuk menghubungkan stream kamera ke elemen <video> di HTML
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fungsi untuk mengambil akses kamera dan mikrofon
    const enableCamera = async () => {
      try {
        const constraints = {
          video: true,
          audio: true,
        };
        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);

        setStream(mediaStream);

        // Pasang stream ke elemen video
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // // HANYA pasang stream jika videoRef.current belum punya srcObject
        // if (videoRef.current && !videoRef.current.srcObject) {
        //   videoRef.current.srcObject = mediaStream;
        // }
      } catch (err) {
        console.error("Gagal mengakses kamera:", err);
        setError("Kamera tidak diizinkan atau tidak ditemukan.");
      }
    };

    enableCamera();

    // Cleanup: Mematikan kamera saat komponen tidak lagi digunakan (unmount)
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">
        Aplikasi Video Meeting (Dev Mode)
      </h1>

      <div className="relative w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-blue-500">
        {/* Elemen Video Lokal */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted // Muted agar tidak ada feedback suara dari diri sendiri
          className="w-full h-full object-cover"
        />

        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg text-sm">
          Kamu (Preview)
        </div>
      </div>

      {error && (
        <p className="mt-4 text-red-400 bg-red-900/20 px-4 py-2 rounded">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-4">
        {/* Placeholder untuk tombol kontrol nantinya */}
        <button className="bg-red-600 hover:bg-red-700 p-3 rounded-full">
          Mute
        </button>
        <button className="bg-gray-700 hover:bg-gray-600 p-3 rounded-full">
          Stop Video
        </button>
      </div>
    </div>
  );
};
