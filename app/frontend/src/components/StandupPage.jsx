import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getValidAccessToken } from "../Utils/tokenUtils";

const StandupPage = ({ standupList, setStandupList }) => {
    const [messages, setMessages] = useState({});
    const [rooms, setRooms] = useState({});
    const sockets = useRef({});
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const fetchRooms = useCallback(async () => {
        try {
            const res = await api.get("chats/rooms/");
            const roomMap = {};
            if (res.status === 200) {
                res.data.forEach((room) => {
                    if (room.standup) {
                        roomMap[room.standup] = room.id;
                        connectToRoom(room.id);
                    }
                });
                setRooms(roomMap);
            }
        } catch (err) {
            setError("Failed to fetch rooms.");
        }
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const connectToRoom = async (roomUUID) => {
        if (sockets.current[roomUUID]) return;
        const token = await getValidAccessToken();
        const socket = new WebSocket(`${import.meta.env.VITE_WS_URL}api/ws/${roomUUID}/?token=${token}`);
        sockets.current[roomUUID] = socket;
        socket.onopen = () => setError(null);
        socket.onmessage = (e) => { const data = JSON.parse(e.data); };
        socket.onclose = () => { delete sockets.current[roomUUID]; };
        socket.onerror = () => setError("Connection issue.");
    };

    const handleSendMessage = async (standupId) => {
        setError(null);
        const content = messages[standupId]?.trim();
        if (!content) return;
        setMessages((prev) => ({ ...prev, [standupId]: "" }));
        let roomUUID = rooms[standupId];
        try {
            if (!roomUUID) {
                const response = await api.post("chats/messages/", { content, standup: standupId });
                roomUUID = response.data.room;
                if (!roomUUID) throw new Error("Room UUID not returned");
                setRooms((prev) => ({ ...prev, [standupId]: roomUUID }));
                await new Promise((resolve, reject) => {
                    connectToRoom(roomUUID, () => {
                        const socket = sockets.current[roomUUID];
                        if (socket?.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({ type: "message", content }));
                            resolve();
                        } else {
                            reject(new Error("Socket not open after connect"));
                        }
                    });
                });
            } else {
                const socket = sockets.current[roomUUID];
                if (socket?.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: "message", content }));
                } else {
                    setError("Connection issue. Some messages may not be sent.");
                }
            }
        } catch (err) {
            console.error(err);
            setError("Failed to send due to server/API error.");
        }
    };

    const handleDeleteStandup = async (standupId) => {
        setError(null);
        const confirmDelete = window.confirm("Are you sure you want to delete this standup?");
        if (!confirmDelete) return;
        try {
            const response = await api.delete(`standups/delete/${standupId}/`);
            if (response.status === 200 || response.status === 204) {
                setStandupList((prev) => prev.filter((s) => s.id !== standupId));
            }
        } catch (err) {
            setError("Failed to delete standup.");
        }
    };

    const goToChatRoom = (roomUUID, standupId) => {
        navigate(`/chatroom/${roomUUID}/${standupId}`);
    };

    return (
        <>
            <h2 className="text-xl font-bold mb-4">Standups</h2>

            {error && (
                <div className="mb-2 flex justify-center">
                    <div className="text-red-500 px-4 py-2 border border-red-300 bg-white rounded-md">
                        {error}
                    </div>
                </div>
            )}

            {/* Desktop table — hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full border border-gray-300 border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border border-gray-300">Title</th>
                            <th className="p-2 border border-gray-300">Progress</th>
                            <th className="p-2 border border-gray-300">Author</th>
                            <th className="p-2 border border-gray-300">Created</th>
                            <th className="p-2 border border-gray-300">Chat Room</th>
                            <th className="p-2 border border-gray-300">Reply</th>
                            <th className="p-2 border border-gray-300">Edit</th>
                            <th className="p-2 border border-gray-300">Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standupList.map((standup) => {
                            const roomUUID = rooms[standup.id];
                            return (
                                <tr key={standup.id} className="border border-gray-300">
                                    <td className="p-2 border border-gray-300">{standup.title}</td>
                                    <td className="p-2 border border-gray-300">{standup.progress}</td>
                                    <td className="p-2 border border-gray-300">{standup.username}</td>
                                    <td className="p-2 border border-gray-300">{new Date(standup.created_at).toLocaleString()}</td>
                                    <td className="p-2 border border-gray-300 text-center">
                                        {roomUUID ? (
                                            <button onClick={() => goToChatRoom(roomUUID, standup.id)} className="bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600">Open Chat</button>
                                        ) : "No room yet"}
                                    </td>
                                    <td className="p-2 border border-gray-300 text-center">
                                        <div className="flex flex-col gap-1">
                                            <input type="text" placeholder="Reply..." value={messages[standup.id] || ""} className="border border-gray-300 rounded-md px-2 py-1" onChange={(e) => setMessages((prev) => ({ ...prev, [standup.id]: e.target.value }))} />
                                            <button onClick={() => handleSendMessage(standup.id)} className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600">Send</button>
                                        </div>
                                    </td>
                                    <td className="p-2 border border-gray-300 text-center">
                                        {standup.username === currentUser.username ? (
                                            <button onClick={() => navigate(`/edit/standup/${standup.id}`, { state: standup })} className="bg-yellow-500 text-white px-2 py-1 rounded-md hover:bg-yellow-600">Edit</button>
                                        ) : (
                                            <span className="text-gray-500 italic text-sm">You cannot edit this standup</span>
                                        )}
                                    </td>
                                    <td className="p-2 border border-gray-300 text-center">
                                        {currentUser.role === "Team leader" ? (
                                            <button onClick={() => handleDeleteStandup(standup.id)} className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600">Delete</button>
                                        ) : (
                                            <span className="text-gray-500 italic text-sm">You cannot delete standup</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards — hidden on desktop */}
            <div className="md:hidden flex flex-col gap-4">
                {standupList.map((standup) => {
                    const roomUUID = rooms[standup.id];
                    return (
                        <div key={standup.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                            <div className="mb-2">
                                <span className="font-bold text-gray-700">Title: </span>
                                <span>{standup.title}</span>
                            </div>
                            <div className="mb-2">
                                <span className="font-bold text-gray-700">Progress: </span>
                                <span>{standup.progress}</span>
                            </div>
                            <div className="mb-2">
                                <span className="font-bold text-gray-700">Author: </span>
                                <span>{standup.username}</span>
                            </div>
                            <div className="mb-3">
                                <span className="font-bold text-gray-700">Created: </span>
                                <span>{new Date(standup.created_at).toLocaleString()}</span>
                            </div>

                            {/* Chat room button */}
                            {roomUUID ? (
                                <button onClick={() => goToChatRoom(roomUUID, standup.id)} className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 mb-2">
                                    Open Chat
                                </button>
                            ) : (
                                <p className="text-gray-500 italic text-sm mb-2">No chat room yet</p>
                            )}

                            {/* Reply */}
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Reply..."
                                    value={messages[standup.id] || ""}
                                    className="flex-1 border border-gray-300 rounded-md px-2 py-1"
                                    onChange={(e) => setMessages((prev) => ({ ...prev, [standup.id]: e.target.value }))}
                                />
                                <button onClick={() => handleSendMessage(standup.id)} className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">
                                    Send
                                </button>
                            </div>

                            {/* Edit & Delete */}
                            <div className="flex gap-2">
                                {standup.username === currentUser.username && (
                                    <button onClick={() => navigate(`/edit/standup/${standup.id}`, { state: standup })} className="flex-1 bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600">
                                        Edit
                                    </button>
                                )}
                                {currentUser.role === "Team leader" && (
                                    <button onClick={() => handleDeleteStandup(standup.id)} className="flex-1 bg-red-500 text-white py-2 rounded-md hover:bg-red-600">
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default StandupPage;