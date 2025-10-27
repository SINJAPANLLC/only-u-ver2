import React from "react";
import { Home, Star, Crown, User, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUnreadMessages } from "../context/UnreadMessagesContext";

const BottomNavigation = ({ active = "Home" }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { unreadCount } = useUnreadMessages();

    const items = [
        { icon: Home, key: "home", onClick: () => navigate("/") },
        { icon: Star, key: "feed", onClick: () => navigate("/feed") },
        { icon: Crown, key: "ranking", onClick: () => navigate("/rankingpage") },
        { icon: MessageCircle, key: "messages", onClick: () => navigate("/messages") },
        { icon: User, key: "account", onClick: () => navigate("/account") },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between px-4 py-2">
                    {items.map((item) => (
                        <button
                            key={item.key}
                            onClick={item.onClick}
                            className={`flex flex-col items-center p-2 transition-all duration-200 relative flex-1
                ${active.toLowerCase() === item.key ? "text-pink-500 scale-110" : "text-gray-500"}
                hover:text-pink-500 hover:scale-110`}
                        >
                            <div className="relative">
                                <item.icon size={20} />
                                {/* Show unread count badge for messages */}
                                {item.key === "messages" && unreadCount > 0 && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium border-2 border-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs mt-1 whitespace-nowrap">{t(`navigation.${item.key}`)}</span>
                            {active.toLowerCase() === item.key && (
                                <div className="w-1 h-1 bg-pink-500 rounded-full mt-1" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default BottomNavigation;
