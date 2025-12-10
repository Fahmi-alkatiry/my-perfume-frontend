// frontend/src/app/(dashboard)/ai-assistant/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import axios from "@/lib/axios";
import { Send, Bot, User, Loader2, Sparkles, Eraser } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function AiAssistantPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "bot", 
      text: "Halo Bos! 👋 Saya Asisten Bisnis Toko Parfum Anda.\n\nSaya punya akses ke data **Omzet**, **Profit**, **Stok**, dan **Tren Penjualan**. Mau tanya apa hari ini?" 
    }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post("/ai/chat", { question: userMsg });
      setMessages(prev => [...prev, { role: "bot", text: res.data.answer }]);
    } catch (error) {
      toast.error("Gagal terhubung ke AI");
      setMessages(prev => [...prev, { role: "bot", text: "Maaf, koneksi terputus. Coba lagi ya." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("Hapus semua percakapan?")) {
        setMessages([{ role: "bot", text: "Chat telah dibersihkan. Ada yang bisa saya bantu lagi?" }]);
    }
  };

  return (
    <div className="h-full p-4 lg:p-6 flex flex-col gap-4">
      {/* Header Halaman */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            Asisten Bisnis AI
            </h1>
            <p className="text-muted-foreground">Analisis performa toko secara instan dengan kecerdasan buatan.</p>
        </div>
        <Button variant="outline" onClick={handleClearChat} title="Bersihkan Chat">
            <Eraser className="h-4 w-4 mr-2" /> Reset
        </Button>
      </div>

      {/* Area Chat Utama - Mengisi sisa layar */}
      <Card className="flex-1 flex flex-col min-h-0 shadow-md border-purple-100">
        <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50">
            <ScrollArea className="h-full p-4 md:p-6">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                
                                {/* Avatar */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === "user" ? "bg-blue-600" : "bg-purple-600"}`}>
                                    {msg.role === "user" ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
                                </div>

                                {/* Bubble Chat */}
                                <div className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                                    msg.role === "user" 
                                    ? "bg-white text-slate-800 rounded-tr-none border border-slate-100" 
                                    : "bg-white text-slate-800 rounded-tl-none border border-purple-100"
                                }`}>
                                    {/* Render Markdown agar Tebal/List berfungsi */}
                                    <div className="prose prose-sm max-w-none text-slate-700">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-purple-100 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Sedang menganalisis data toko...
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
        </CardContent>

        {/* Input Area */}
        <CardFooter className="p-4 bg-white border-t">
            <form onSubmit={handleSend} className="flex w-full gap-3 max-w-4xl mx-auto">
                <Input 
                    placeholder="Contoh: 'Berapa omzet hari ini?' atau 'Cek stok yang mau habis'" 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 focus-visible:ring-purple-500 h-12"
                    autoFocus
                />
                <Button type="submit" size="icon" disabled={isLoading || !input} className="h-12 w-12 bg-purple-600 hover:bg-purple-700">
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </CardFooter>
      </Card>
    </div>
  );
}