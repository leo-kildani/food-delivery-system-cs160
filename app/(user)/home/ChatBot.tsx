"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendChatMessage, SerializedProduct, getSerializedProducts, getCartId, CartItem } from "./actions";
import ProductSelectionModal from "./product-suggest-modal";
import { getCartItems } from "../checkout/actions";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface SuggestedProduct {
  productID: number;
  productName: string;
  quantity: number;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{
    id: crypto.randomUUID(),
    role: "assistant",
    content: "Hi! I'm your site assistant. Ask me anything about this page."
  }]);
  const [input, setInput] = useState("");
  const [modalOpen, setModalOpen] = useState(false); //Modal Pop Up state
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<SerializedProduct[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<number>(-1);
  const [loadingData, setLoadingData] = useState(false);
  const hasLoadedData = useRef(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Load products and cart ID when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (hasLoadedData.current) {
        return;
      }
      
      setLoadingData(true);
      
      try {
        const products = await getSerializedProducts();
        const id = await getCartId();
        const items = await getCartItems();
        
        setAllProducts(products);
        setCartId(id);
        setCartItems(items);
        hasLoadedData.current = true;
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoadingData(false);
      }
    };
    
    loadData();
  }, []);

  const parseProductSuggestions = (content: string): SuggestedProduct[] | null => {
    try {
      const parsed = JSON.parse(content);
      
      // Handle both array format and object with products array
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.products && Array.isArray(parsed.products)) {
        return parsed.products;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  const sendToOpenAI = async (userText: string, currentMessages: Msg[]) => {
    // Check if data is loaded before processing
    if (allProducts.length === 0 || cartId === -1) {
      try {
        const products = await getSerializedProducts();
        const id = await getCartId();
        const items = await getCartItems();
        setAllProducts(products);
        setCartId(id);
        setCartItems(items);
      } catch (error) {
        console.error('Failed to reload data:', error);
      }
    }

    const thinking: Msg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Thinking…"
    };
    setMessages(prev => [...prev, thinking]);

    try {
      const response = await sendChatMessage(
        currentMessages.map(m => ({
          role: m.role,
          content: m.content,
        }))
      );

      const assistantMessage = response.content || "I couldn't generate a response. Please try again."; //JSON OBJECT

      const suggestions = parseProductSuggestions(assistantMessage); //PARSE JSON
      
      if (suggestions && suggestions.length > 0) {
        // Refresh cart items before showing modal
        const items = await getCartItems();
        setCartItems(items);
        
        // Show the modal with suggestions
        setSuggestedProducts(suggestions);
        setModalOpen(true);
        
        setMessages(prev => prev.map(m => m.id === thinking.id ? ({
          ...m,
          content: `I found ${suggestions.length} ingredient${suggestions.length > 1 ? 's' : ''} for you! Check out the popup to add them to your cart.`,
        }) : m));
      } else {
        setMessages(prev => prev.map(m => m.id === thinking.id ? ({
          ...m,
          content: assistantMessage,
        }) : m));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m => m.id === thinking.id ? ({
        ...m,
        content: "Sorry, I encountered an error. Please try again later.",
      }) : m));
    }
  };

  const onSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    sendToOpenAI(text, [...messages, userMsg]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSend();
    }
  };

  const handleCartUpdate = useCallback((items: CartItem[]) => {
  setCartItems(items);
}, []);

  return (
    <>
      <div className="fixed right-4 bottom-4 z-50">
        {/* FAB (closed state) */}
        {!open && (
          <button
            aria-label="Open chat"
            onClick={() => setOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center border border-white/70 bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        )}

        {/* Widget (open state) */}
        {open && (
          <Card className="w-[320px] sm:w-[360px] max-h-[70vh] shadow-2xl border-blue-100">
            <CardHeader className="p-3 pb-2 bg-blue-600 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Chat</CardTitle>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Close chat"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col h-[52vh]">
                {/* Messages */}
                <ScrollArea className="flex-1 p-3 overflow-y-auto">
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={
                            m.role === "user"
                              ? "max-w-[80%] rounded-2xl px-3 py-2 bg-blue-600 text-white shadow break-words"
                              : "max-w-[80%] rounded-2xl px-3 py-2 bg-white text-blue-900 border border-blue-100 shadow break-words"
                          }
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={listEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Type your message…"
                      className="focus-visible:ring-blue-600"
                    />
                    <Button onClick={onSend} className="bg-blue-600 text-white hover:bg-blue-700" aria-label="Send message">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        suggestedProducts={suggestedProducts}
        allProducts={allProducts}
        cartId={cartId}
        cartItems={cartItems}
        onCartUpdate={handleCartUpdate}
      />
    </>
  );
}