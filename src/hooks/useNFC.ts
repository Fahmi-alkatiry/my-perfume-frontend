import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

export function useNFC() {
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported] = useState(typeof window !== "undefined" && "NDEFReader" in window);
  const abortControllerRef = useRef<AbortController | null>(null);

  const write = useCallback(async (content: string) => {
    if (!("NDEFReader" in window)) {
      toast.error("Browser ini tidak mendukung Web NFC (Gunakan Chrome Android).");
      return false;
    }

    try {
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.write(content);
      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(`Gagal menulis ke NFC: ${error.message || "Pastikan kartu didekatkan."}`);
      return false;
    }
  }, []);

  const scan = useCallback(async (onRead: (message: string) => void) => {
    if (!("NDEFReader" in window)) {
      toast.error("Browser ini tidak mendukung Web NFC (Gunakan Chrome Android).");
      return;
    }

    try {
      abortControllerRef.current = new AbortController();
      setIsScanning(true);
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.scan({ signal: abortControllerRef.current.signal });
      
      // @ts-ignore
      ndef.onreading = (event) => {
        try {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            if (record.recordType === "text") {
              // Only decode the raw bytes, avoid extra logic since Web NFC API natively supports passing string
              const text = decoder.decode(record.data);
              onRead(text);
              return;
            }
          }
        } catch (err) {
          console.error("Error decoding NFC data", err);
        }
      };
      
      // @ts-ignore
      ndef.onreadingerror = () => {
        toast.error("Gagal membaca kartu NFC. Coba lagi.");
      };
    } catch (error: any) {
      console.error(error);
      setIsScanning(false);
      toast.error(`Gagal memulai scan NFC: ${error.message || "Pastikan NFC aktif."}`);
    }
  }, []);

  const stopScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  return { isSupported, isScanning, write, scan, stopScan };
}
