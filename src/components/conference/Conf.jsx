import { useState, useRef, useEffect } from "react";
import Peer from "peerjs";
import "./Conf.css";

export const Conf = () => {
  const [myId, setMyId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const remoteVideoRef = useRef(null);

  // Ref untuk menyimpan instance Peer agar bisa diakses di luar useEffect
  const peerInstance = useRef(null);

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

        //inisialisasi PeerJS setelah kamera aktif
        const peer = new Peer();

        peer.on("open", (id) => {
          console.log("ID Berhasil dibuat:", id);
          setMyId(id); // ini adalah ID unik
        });

        // Logika menerima telepon (Incoming Call)
        peer.on("call", (call) => {
          // Jawab telepon dengan mengirim stream kamera kita
          call.answer(mediaStream);

          // Terima stream dari penelpon
          call.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
        });

        peerInstance.current = peer;
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
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fungsi untuk menelpon orang lain
  const callUser = (idToCall) => {
    if (!stream) return;

    const call = peerInstance.current.call(idToCall, stream);

    call.on("stream", (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">
        Aplikasi Video Meeting (Dev Mode)
      </h1>

      {/* Panel Kontrol ID */}
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 shadow-lg">
        <div className="mb-4">
          <p className="text-gray-400 text-sm">ID Kamu:</p>
          <p className="text-lg font-mono font-bold text-green-400">
            {myId || "Sedang digenerate..."}
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Masukkan ID teman..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={remoteId}
            onChange={(e) => setRemoteId(e.target.value)}
          />
          <button
            onClick={() => callUser(remoteId)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition-all active:scale-95"
          >
            Panggil
          </button>
        </div>
      </div>

      {/* Grid Video */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        <div className="relative bg-black rounded-xl overflow-hidden border-2 border-blue-500 shadow-2xl">
          {/* Elemen Video Lokal */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted // Muted agar tidak ada feedback suara dari diri sendiri
            className="w-full h-full object-cover -scale-x-100"
          />

          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg text-sm">
            Kamu (Preview)
          </div>
        </div>

        <div className="relative bg-black rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full aspect-video object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-xs">
            Teman (Remote)
          </div>
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
