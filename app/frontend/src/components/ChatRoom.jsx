import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "../api";
import { getValidAccessToken } from "../Utils/tokenUtils";

const ChatRoom = () => {
    const { roomId, standupId } = useParams();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [error, setError] = useState(null);

    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // Auto-scroll to the bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Use useCallback to memoize the connectSocket function
    const connectSocket = useCallback(async () => {
        try {
            const token = await getValidAccessToken();
            if (!token) {
                setError("Authentication required.");
                return;
            }

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                return;
            }

            const socket = new WebSocket(`${import.meta.env.VITE_WS_URL}api/ws/${roomId}/?token=${token}`);

            socketRef.current = socket;

            socket.onopen = () => {
                setError(null);
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
                console.log("WebSocket connection opened successfully.");
            };

            socket.onmessage = (e) => {
                setError(null);
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === "chat_message") {
                        if (!data.id) return;
                        setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
                    } else if (data.type === "writing_active") {
                        // Show typing indicator for other users only
                        if (data.sender !== currentUser.username) {
                            setTypingUsers((prev) => new Set(prev).add(data.sender));
                            // Clear existing timeout for this user and reset it
                            if (window[`typingTimeout_${data.sender}`]) {
                                clearTimeout(window[`typingTimeout_${data.sender}`]);
                            }
                            window[`typingTimeout_${data.sender}`] = setTimeout(() => {
                                setTypingUsers((prev) => {
                                    const copy = new Set(prev);
                                    copy.delete(data.sender);
                                    return copy;
                                });
                            }, 3000);
                        }
                    } else if (data.type === "chat_delete") {
                        setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
                    }
                } catch {
                    setError("Server error");
                }
            };

            socket.onerror = (error) => {
                console.error("WebSocket Error:", error);
                setError("Connection error. Try again later");
            };

            socket.onclose = (event) => {
                console.log("WebSocket Closed:", event.code, event.reason);
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectSocket();
                    }, 5000);
                }
            };
        } catch (err) {
            console.error("Failed to connect to WebSocket:", err);
            setError("Failed to establish WebSocket connection.");
        }
    }, [roomId, currentUser.username]);

    useEffect(() => {
        let isMounted = true;

        const fetchMessages = async () => {
            setError(null);
            try {
                const res = await api.get(`chats/messages/standup/${standupId}/`);
                if (isMounted) setMessages(res.data);
            } catch {
                setError("Failed to fetch chat messages. Try again later");
            }
        };

        if (roomId && standupId) {
            fetchMessages();
            connectSocket();
        }

        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.close(1000, "Component unmounted.");
            }
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [roomId, standupId, connectSocket]);

    const sendMessage = () => {
        setError(null);
        if (!input.trim() || socketRef.current?.readyState !== WebSocket.OPEN) {
            console.error("Cannot send message. Socket not open or input is empty.");
            return;
        }
        socketRef.current.send(JSON.stringify({ type: "message", content: input.trim() }));
        setInput("");
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "delete", id }));
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            if (handleInputChange.timeoutId) clearTimeout(handleInputChange.timeoutId);
            handleInputChange.timeoutId = setTimeout(() => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({ type: "update", content: "typing" }));
                }
            }, 300);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".message")) setSelectedMessageId(null);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="p-4">
            <button
                onClick={() => navigate(-1)}
                className="mb-4 text-blue-500 hover:underline"
            >
                Back
            </button>
            {error && (
                <div className="mb-2 flex justify-center">
                    <div className="text-red-500 px-4 py-2 border border-red-300 bg-white rounded-md">
                        {error}
                    </div>
                </div>
            )}
            <h2 className="text-xl font-bold mb-4">Chat Room</h2>
            <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-md p-4 space-y-2">
                {messages.map((msg) => {
                    const isCurrentUser =
                        msg.sender === currentUser.id || msg.sender === currentUser.username;
                    return (
                        <div
                            key={msg.id || Math.random()}
                            className={`message flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-xs p-3 rounded-lg cursor-pointer relative ${
                                    isCurrentUser
                                        ? "bg-blue-500 text-white rounded-br-none"
                                        : "bg-gray-200 text-gray-900 rounded-bl-none"
                                } ${selectedMessageId === msg.id ? "ring-2 ring-blue-300" : ""}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id);
                                }}
                            >
                                <p className="font-semibold text-sm">{msg.sender_username || msg.sender}</p>
                                <p>{msg.content}</p>
                                <span className="block text-xs text-gray-500 mt-1">
                                    {msg.timestamp
                                        ? new Date(msg.timestamp).toLocaleTimeString()
                                        : msg.created_at
                                            ? new Date(msg.created_at).toLocaleTimeString()
                                            : new Date().toLocaleTimeString()}
                                </span>
                                {selectedMessageId === msg.id && isCurrentUser && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md p-1 flex gap-2 z-10">
                                        <button
                                            className="text-red-500 hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(msg.id);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            {/* Typing indicator */}
            {typingUsers.size > 0 && (
                <div className="mt-2 italic text-gray-500 text-sm">
                    {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
                </div>
            )}
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-md p-2"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage();
                    }}
                />
                <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatRoom;