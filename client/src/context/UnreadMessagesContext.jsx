import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { rtdb } from '../firebase';
import { ref, onValue, off } from 'firebase/database';

const UnreadMessagesContext = createContext();

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    // Return default values instead of throwing error
    return {
      unreadCount: 0,
      markChatAsRead: () => {},
      clearAllUnread: () => {},
      lastReadTimes: {}
    };
  }
  return context;
};

export const UnreadMessagesProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTimes, setLastReadTimes] = useState({});

  // Load last read times from localStorage
  useEffect(() => {
    if (currentUser) {
      const savedLastReadTimes = localStorage.getItem(`lastReadTimes_${currentUser.uid}`);
      if (savedLastReadTimes) {
        setLastReadTimes(JSON.parse(savedLastReadTimes));
      }
    }
  }, [currentUser]);

  // Listen for new messages and calculate unread count
  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    const conversationsRef = ref(rtdb, `userChats/${currentUser.uid}`);
    
    const unsubscribe = onValue(conversationsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setUnreadCount(0);
        return;
      }

      let totalUnread = 0;

      Object.entries(data).forEach(([chatId, chatData]) => {
        // Skip messages sent by current user
        if (chatData.lastSenderId === currentUser.uid) {
          return;
        }

        const lastReadTime = lastReadTimes[chatId] || 0;
        // Convert Firebase serverTimestamp to number if needed
        let lastMessageTime = chatData.lastMessageTime || 0;
        if (typeof lastMessageTime === 'object' && lastMessageTime.seconds) {
          // Handle Firebase Timestamp object
          lastMessageTime = lastMessageTime.seconds * 1000;
        } else if (typeof lastMessageTime !== 'number') {
          lastMessageTime = Date.now();
        }

        // If there's a newer message than the last read time, count it as unread
        if (lastMessageTime > lastReadTime && chatData.lastMessage) {
          totalUnread++;
        }
      });

      setUnreadCount(totalUnread);
    });

    return () => off(conversationsRef, 'value', unsubscribe);
  }, [currentUser, lastReadTimes]);

  // Mark chat as read
  const markChatAsRead = (chatId) => {
    if (!currentUser) return;

    const now = Date.now();
    const updatedLastReadTimes = {
      ...lastReadTimes,
      [chatId]: now
    };

    setLastReadTimes(updatedLastReadTimes);
    localStorage.setItem(`lastReadTimes_${currentUser.uid}`, JSON.stringify(updatedLastReadTimes));
  };

  // Clear all unread messages
  const clearAllUnread = () => {
    if (!currentUser) return;

    const now = Date.now();
    const clearedTimes = {};
    
    // Set all chats as read with current timestamp
    Object.keys(lastReadTimes).forEach(chatId => {
      clearedTimes[chatId] = now;
    });

    setLastReadTimes(clearedTimes);
    localStorage.setItem(`lastReadTimes_${currentUser.uid}`, JSON.stringify(clearedTimes));
    setUnreadCount(0);
  };

  const value = {
    unreadCount,
    markChatAsRead,
    clearAllUnread,
    lastReadTimes
  };

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};