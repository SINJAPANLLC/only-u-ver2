import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, ArrowLeft, MoreVertical, Plus, X, Users, ChevronRight, Sparkles, MessageCircle } from 'lucide-react';
import BottomNavigationWithCreator from '../BottomNavigationWithCreator';
import { useAuth } from '../../context/AuthContext';
import { useUnreadMessages } from '../../context/UnreadMessagesContext';
import { rtdb, db } from '../../firebase';
import { ref, push, onValue, off, serverTimestamp, set } from 'firebase/database';
import { collection, getDocs, query, doc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const MessagesUI = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { markChatAsRead, lastReadTimes } = useUnreadMessages();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' or 'unread'
  const messagesEndRef = useRef(null);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userSelectTab, setUserSelectTab] = useState('followed'); // 'followed' or 'all'

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Firestoreからフォローしているユーザーとすべてのユーザーを取得
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        // すべてのユーザーを取得
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        // ユーザーデータを正規化（displayName → name, photoURL → avatar）
        const usersData = usersSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // 正規化: name/avatarフィールドを追加
              name: data.displayName || data.name || data.email || 'Unknown',
              avatar: data.photoURL || data.avatar || '',
              username: data.username || data.email || '',
              isVerified: data.isVerified || false,
              isOnline: data.isOnline || false
            };
          })
          .filter(user => user.id !== currentUser.uid); // 自分自身を除外

        setAllUsers(usersData);

        // フォローしているユーザーを取得（既に取得したusersSnapshotを再利用）
        const currentUserData = usersSnapshot.docs.find(d => d.id === currentUser.uid)?.data();
        
        if (currentUserData?.following && Array.isArray(currentUserData.following)) {
          const followed = usersData.filter(user => currentUserData.following.includes(user.id));
          setFollowedUsers(followed);
        } else {
          setFollowedUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const conversationsRef = ref(rtdb, `userConversations/${currentUser.uid}`);
    
    const unsubscribe = onValue(conversationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const convArray = Object.entries(data).map(([id, conv]) => ({
          id,
          ...conv
        }));
        convArray.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        setConversations(convArray);
      } else {
        setConversations([]);
      }
    });

    return () => off(conversationsRef);
  }, [currentUser]);

  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const chatId = activeChat.id;
    const messagesRef = ref(rtdb, `messages/${chatId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.entries(data).map(([id, msg]) => ({
          id,
          ...msg
        }));
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesArray);
      } else {
        setMessages([]);
      }
    });

    return () => off(messagesRef);
  }, [activeChat, currentUser]);

  const hasUnreadMessages = (conversation) => {
    if (!currentUser || !conversation) return false;
    const lastRead = lastReadTimes[conversation.id];
    return !lastRead || (conversation.lastMessageTime && conversation.lastMessageTime > lastRead);
  };

  const handleChatSelect = (conversation) => {
    setActiveChat(conversation);
    if (currentUser) {
      markChatAsRead(conversation.id);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !currentUser) return;

    setIsLoading(true);
    
    try {
      const chatId = activeChat.id;
      const messagesRef = ref(rtdb, `messages/${chatId}`);
      const newMessageRef = push(messagesRef);

      const messageData = {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email || 'Anonymous',
        timestamp: Date.now()
      };

      await set(newMessageRef, messageData);

      // 自分の会話リストのみ更新（相手のリストは相手が開いたときに更新される）
      const currentUserConvRef = ref(rtdb, `userConversations/${currentUser.uid}/${chatId}`);
      
      const now = Date.now();
      await set(currentUserConvRef, {
        ...activeChat,
        lastMessage: newMessage,
        lastMessageTime: now
      });

      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.message);
      alert(`メッセージの送信に失敗しました: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async (user) => {
    if (!currentUser) {
      console.error('No current user');
      return;
    }

    try {
      console.log('Creating new chat with user:', user);
      
      const chatId = [currentUser.uid, user.id].sort().join('_');
      console.log('Chat ID:', chatId);

      const conversationData = {
        userId: user.id,
        userName: user.name || user.displayName || 'Unknown',
        userAvatar: user.avatar || user.photoURL || '',
        lastMessage: '',
        lastMessageTime: Date.now()
      };

      // 自分の会話リストにのみ追加（相手のリストには相手が開いたときに追加される）
      const currentUserConvRef = ref(rtdb, `userConversations/${currentUser.uid}/${chatId}`);

      await set(currentUserConvRef, conversationData);

      console.log('Chat created successfully');

      setActiveChat({
        id: chatId,
        ...conversationData
      });

      markChatAsRead(chatId);
      
      setShowUserSelect(false);
      
    } catch (error) {
      console.error('Error creating chat:', error);
      console.error('Error details:', error.message);
      alert(`チャットの作成に失敗しました: ${error.message}`);
    }
  };

  const handleNewChatClick = () => {
    setShowUserSelect(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-6 inline-block"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-3">
            {t('messages.pleaseLogin')}
          </h2>
          <p className="text-pink-700">{t('messages.loginRequired')}</p>
        </motion.div>
      </div>
    );
  }

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'unread' && hasUnreadMessages(conv));
    return matchesSearch && matchesFilter;
  });

  const unreadCount = conversations.filter(conv => hasUnreadMessages(conv)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex flex-col pb-20">
      <div className="flex flex-1 relative">
        {/* Left Sidebar - Conversations List */}
        <div className={`${activeChat ? 'hidden lg:block' : 'block'} w-full lg:w-96 bg-white/80 backdrop-blur-sm border-r border-pink-100 shadow-sm`}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-b border-pink-100 bg-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg"
                  data-testid="icon-messages"
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                  {t('messages.title')}
                </h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewChatClick}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                data-testid="button-new-chat"
              >
                <Plus className="w-4 h-4" />
                <span>{t('messages.newChat')}</span>
              </motion.button>
            </div>
            
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('messages.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 shadow-sm"
                data-testid="input-search"
              />
            </motion.div>
          </motion.div>

          {/* Filter Options */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 border-b border-pink-100 bg-white/50"
          >
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter('all')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-full shadow-md transition-all ${
                  activeFilter === 'all'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-pink-50'
                }`}
                data-testid="button-filter-all"
              >
                <span>{t('messages.all')}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === 'all' ? 'bg-white/30' : 'bg-pink-100 text-pink-600'
                }`}>
                  {conversations.length}
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter('unread')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-full shadow-md transition-all ${
                  activeFilter === 'unread'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-pink-50'
                }`}
                data-testid="button-filter-unread"
              >
                <span>{t('messages.unread')}</span>
                {unreadCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeFilter === 'unread' ? 'bg-white/30' : 'bg-pink-100 text-pink-600'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation, index) => {
                  const isUnread = hasUnreadMessages(conversation);
                  return (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      onClick={() => handleChatSelect(conversation)}
                      className={`p-4 border-b border-pink-100 cursor-pointer transition-all duration-300 ${
                        activeChat?.id === conversation.id 
                          ? 'bg-gradient-to-r from-pink-100 to-pink-200 border-l-4 border-l-pink-500' 
                          : 'hover:bg-pink-50/50'
                      }`}
                      data-testid={`conversation-item-${conversation.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <motion.div
                          animate={isUnread ? { 
                            y: [0, -3, 0],
                          } : {}}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="relative"
                        >
                          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 border-2 border-pink-200 shadow-md flex items-center justify-center">
                            <Users className="w-7 h-7 text-white" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-br from-pink-400 to-pink-500 border-2 border-white rounded-full shadow-sm"></div>
                          </div>
                          {isUnread && (
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                              }}
                              transition={{ 
                                duration: 1.5,
                                repeat: Infinity,
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center"
                              data-testid={`unread-badge-${conversation.id}`}
                            >
                              <span className="text-white text-xs font-bold">•</span>
                            </motion.div>
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-semibold truncate ${
                              isUnread ? 'text-gray-900' : 'text-gray-700'
                            }`} data-testid={`text-conversation-name-${conversation.id}`}>
                              {conversation.userName}
                            </h3>
                            <span className="text-xs text-pink-500 font-medium" data-testid={`text-time-${conversation.id}`}>
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${
                            isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
                          }`} data-testid={`text-last-message-${conversation.id}`}>
                            {conversation.lastMessage || t('messages.startChatting')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center"
                  data-testid="empty-state"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="mb-4"
                  >
                    <Users className="w-16 h-16 mx-auto text-gray-300" />
                  </motion.div>
                  <p className="text-gray-500 font-medium mb-4">{t('messages.noConversations')}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNewChatClick}
                    className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg"
                    data-testid="button-start-chatting"
                  >
                    {t('messages.startChatting')}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-pink-50 to-pink-100 border-b border-pink-100 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setActiveChat(null)}
                      className="lg:hidden p-2 hover:bg-pink-100 rounded-full transition-colors"
                      data-testid="button-back"
                    >
                      <ArrowLeft className="w-5 h-5 text-pink-600" />
                    </motion.button>
                    <motion.div
                      animate={{ 
                        y: [0, -3, 0],
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 border-2 border-pink-300 shadow-md flex items-center justify-center"
                    >
                      <Users className="w-6 h-6 text-white" />
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gradient-to-br from-pink-400 to-pink-500 border-2 border-white rounded-full"></div>
                    </motion.div>
                    <div>
                      <h2 className="font-bold text-gray-900" data-testid="text-active-chat-name">{activeChat.userName}</h2>
                      <p className="text-xs text-pink-500 font-medium">● オンライン</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-pink-100 rounded-full transition-colors"
                    data-testid="button-more"
                  >
                    <MoreVertical className="w-5 h-5 text-pink-600" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-pink-50/30 via-white to-pink-100/30">
                <AnimatePresence>
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === currentUser.uid;
                    const showDate = index === 0 || 
                      formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {showDate && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center my-6"
                          >
                            <span className="bg-white px-4 py-1.5 rounded-full text-xs text-gray-500 shadow-sm border border-pink-100">
                              {formatDate(message.timestamp)}
                            </span>
                          </motion.div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-md ${
                              isOwn 
                                ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-br-sm' 
                                : 'bg-white text-gray-900 border border-pink-100 rounded-bl-sm'
                            }`}
                            data-testid={`message-${message.id}`}
                          >
                            <p className="text-sm leading-relaxed">{message.text}</p>
                            <p className={`text-xs mt-1.5 ${
                              isOwn ? 'text-pink-100' : 'text-gray-400'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-t border-pink-100 p-4 sticky bottom-20 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('messages.typeMessagePlaceholder')}
                    className="flex-1 px-6 py-4 border-2 border-pink-100 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 shadow-sm"
                    disabled={isLoading}
                    data-testid="input-message"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    data-testid="button-send"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </>
          ) : (
            // Empty State - Minimal clean version
            <div className="flex-1 bg-white"></div>
          )}
        </div>
      </div>

      {/* User Selection Modal - フォローしたユーザー */}
      <AnimatePresence>
        {showUserSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUserSelect(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">新しいチャット</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowUserSelect(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    data-testid="button-close-modal"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                
                {/* タブ */}
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserSelectTab('followed')}
                    className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      userSelectTab === 'followed'
                        ? 'bg-white text-pink-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    data-testid="button-tab-followed"
                  >
                    フォロー中
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserSelectTab('all')}
                    className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      userSelectTab === 'all'
                        ? 'bg-white text-pink-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    data-testid="button-tab-all"
                  >
                    すべてのユーザー
                  </motion.button>
                </div>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                {userSelectTab === 'followed' ? (
                  followedUsers.length > 0 ? (
                    <div className="space-y-3">
                      {followedUsers.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          onClick={() => createNewChat(user)}
                          className="flex items-center space-x-3 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100 cursor-pointer transition-all duration-300 border border-pink-100"
                          data-testid={`user-select-${user.id}`}
                        >
                          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-pink-200 shadow-md">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">
                                  {(user.name || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900" data-testid={`text-user-name-${user.id}`}>
                                {user.name}
                              </h4>
                              {user.isVerified && (
                                <motion.div
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                  className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                                >
                                  <span className="text-white text-xs">✓</span>
                                </motion.div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{user.username}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-pink-400" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">フォローしているユーザーがいません</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setUserSelectTab('all')}
                        className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium"
                        data-testid="button-see-all-users"
                      >
                        すべてのユーザーを見る
                      </motion.button>
                    </div>
                  )
                ) : (
                  allUsers.length > 0 ? (
                    <div className="space-y-3">
                      {allUsers.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          onClick={() => createNewChat(user)}
                          className="flex items-center space-x-3 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100 cursor-pointer transition-all duration-300 border border-pink-100"
                          data-testid={`user-select-all-${user.id}`}
                        >
                          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-pink-200 shadow-md">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">
                                  {(user.name || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900" data-testid={`text-user-name-all-${user.id}`}>
                                {user.name}
                              </h4>
                              {user.isVerified && (
                                <motion.div
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                  className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                                >
                                  <span className="text-white text-xs">✓</span>
                                </motion.div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{user.username}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-pink-400" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">ユーザーが見つかりません</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigationWithCreator active="messages" />
    </div>
  );
};

export default MessagesUI;
