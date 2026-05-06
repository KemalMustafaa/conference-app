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

  // inisialisasi untuk Fitur Kontrol Media (muted dan toggle video)
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // untuk memantau apa yang sedang terjadi pada koneksi.
  const [connStatus, setConnStatus] = useState("idle"); // idle, calling, connected, disconnected

  // untuk menyimpan onjek panggilan
  const currentCallRef = useRef(null);

  const handleCall = (call) => {
    currentCallRef.current = call;

    call.on("stream", (remoteStream) => {
      setConnStatus("connected");
      // Gunakan timeout kecil jika ref video belum sempat ter-render oleh React
      setTimeout(() => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      }, 100);
    });

    call.on("close", () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setConnStatus("disconnected");
      currentCallRef.current = null;
    });

    call.on("error", (err) => {
      console.error("Call error:", err);
      setConnStatus("error");
    });
  };

  // Fungsi untuk menelpon orang lain
  const callUser = (idToCall) => {
    if (!stream) return;

    setConnStatus("calling"); // Set status saat sedang memanggil

    const call = peerInstance.current.call(idToCall, stream);
    handleCall(call);
  };

  // Fungsi untuk toggle audio
  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled; // Mematikan/menghidupkan track audio
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled; // Mematikan/menghidupkan track video
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const handleEndCall = () => {
    // Tutup koneksi jika ada
    if (currentCallRef.current) {
      currentCallRef.current.close();
    }

    // Update Status agar video remote hilang dari DOM (karena logic && di atas)
    setConnStatus("disconnected");
    setRemoteId("");

    // Bersihkan ref video (opsional tapi baik untuk memori)
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

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
          setConnStatus("connected"); // Update status saat ada telepon masuk
          currentCallRef.current = call; // Simpan di sini
          // Jawab telepon dengan mengirim stream kamera kita
          call.answer(mediaStream);
          handleCall(call);
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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">
        Conference Call - App
      </h1>

      {/* Panel Kontrol ID */}
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 shadow-lg">
        <div className="mb-4">
          <p className="text-gray-400 text-sm">ID Kamu:</p>
          <p className="text-lg font-mono font-bold text-green-400">
            {myId || "Sedang digenerate..."}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full">
          <input
            type="text"
            placeholder="Masukkan ID teman..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 md:py-2 focus:ring-2 focus:ring-blue-500 outline-none text-base"
            value={remoteId}
            onChange={(e) => setRemoteId(e.target.value)}
          />
          <button
            onClick={() => callUser(remoteId)}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 px-8 py-3 md:py-2 rounded-lg font-bold transition-all active:scale-95 whitespace-nowrap shadow-md"
          >
            Panggil
          </button>
        </div>
      </div>

      {/* Indikator Status */}
      <div className="mb-4 text-center">
        {connStatus === "calling" && (
          <p className="text-yellow-400 animate-pulse">
            Menghubungi teman... 📞
          </p>
        )}
        {connStatus === "connected" && (
          <p className="text-green-400 font-bold">● Terhubung</p>
        )}
        {connStatus === "disconnected" && (
          <p className="text-red-400">Panggilan berakhir.</p>
        )}
      </div>

      {/* Grid Video */}
      {/* Grid Video - Menggunakan class dinamis */}
      <div
        className={`grid gap-6 w-full max-w-5xl ${connStatus === "connected" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Kotak Video Lokal */}
        <div className="relative bg-black rounded-xl overflow-hidden border-2 border-blue-500 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg text-sm">
            Kamu (Preview)
          </div>
        </div>

        {/* Kotak Video Remote - HANYA MUNCUL JIKA TERHUBUNG */}
        {connStatus === "connected" && (
          <div className="relative bg-black rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover -scale-x-100"
            />
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-xs">
              Teman (Remote)
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-red-400 bg-red-900/20 px-4 py-2 rounded">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-4">
        {/* Placeholder untuk tombol kontrol nantinya */}
        {/* Tombol Mute */}
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-all ${isMuted ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
        {/* Tombol Stop Video */}
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all ${isVideoOff ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          {isVideoOff ? "Start Video" : "Stop Video"}
        </button>
        {/* Tombol End Call (Opsional) */}
        <button
          onClick={handleEndCall}
          className="bg-red-600 hover:bg-red-700 p-4 rounded-full font-bold"
        >
          End Call
        </button>
      </div>
    </div>
  );
};
