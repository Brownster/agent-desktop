/**
 * @fileoverview Chat interface component for messaging contacts
 * @module components/ChatInterface
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  PhoneIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { useActiveContact } from '@/store/contact.store';

/**
 * Chat message interface
 */
interface ChatMessage {
  id: string;
  contactId: string;
  content: string;
  timestamp: Date;
  sender: 'customer' | 'agent' | 'system';
  messageType: 'text' | 'attachment' | 'system';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: ChatAttachment[];
}

/**
 * Chat attachment interface
 */
interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

/**
 * Chat interface props
 */
interface ChatInterfaceProps {
  onSendMessage?: (message: string, attachments?: File[]) => Promise<void>;
  onTypingIndicator?: (isTyping: boolean) => void;
  onEscalateToVoice?: () => void;
  className?: string;
}

/**
 * Chat message component
 */
interface ChatMessageProps {
  message: ChatMessage;
  isLastInGroup?: boolean;
}

function ChatMessageComponent({ message, isLastInGroup = false }: ChatMessageProps): React.ReactElement {
  const isAgent = message.sender === 'agent';
  const isSystem = message.sender === 'system';

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <CheckIcon className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircleIcon className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCircleIcon className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex', isAgent ? 'justify-end' : 'justify-start', 'mb-1')}>
      <div className={clsx('max-w-xs lg:max-w-md px-4 py-2 rounded-lg', {
        'bg-blue-600 text-white': isAgent,
        'bg-gray-100 text-gray-900': !isAgent,
        'rounded-br-md': isAgent && isLastInGroup,
        'rounded-bl-md': !isAgent && isLastInGroup,
      })}>
        <div className="text-sm">{message.content}</div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={clsx(
                  'flex items-center space-x-2 p-2 rounded border',
                  isAgent ? 'border-blue-400 bg-blue-500' : 'border-gray-300 bg-white'
                )}
              >
                <PaperClipIcon className="h-4 w-4" />
                <span className="text-xs truncate">{attachment.name}</span>
                <span className="text-xs opacity-75">({Math.round(attachment.size / 1024)}KB)</span>
              </div>
            ))}
          </div>
        )}
        
        <div className={clsx('flex items-center justify-between mt-1', {
          'text-blue-100': isAgent,
          'text-gray-500': !isAgent,
        })}>
          <span className="text-xs">{formatTime(message.timestamp)}</span>
          {isAgent && (
            <div className="ml-2">
              {getStatusIcon()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Typing indicator component
 */
function TypingIndicator(): React.ReactElement {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-xs lg:max-w-md px-4 py-2 bg-gray-100 rounded-lg">
        <div className="flex space-x-1">
          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Chat interface component
 */
function ChatInterface({
  onSendMessage,
  onTypingIndicator,
  onEscalateToVoice,
  className,
}: ChatInterfaceProps): React.ReactElement {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [customerTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const activeContact = useActiveContact();

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Initialize sample messages for demo
   */
  useEffect(() => {
    if (activeContact?.type === 'chat') {
      setMessages([
        {
          id: '1',
          contactId: activeContact.contactId,
          content: 'Hello, I need help with my account',
          timestamp: new Date(Date.now() - 300000),
          sender: 'customer',
          messageType: 'text',
          status: 'read',
        },
        {
          id: '2',
          contactId: activeContact.contactId,
          content: 'Customer connected to chat',
          timestamp: new Date(Date.now() - 299000),
          sender: 'system',
          messageType: 'system',
        },
        {
          id: '3',
          contactId: activeContact.contactId,
          content: 'Hi! I\'d be happy to help you with your account. Can you please provide me with your account number?',
          timestamp: new Date(Date.now() - 240000),
          sender: 'agent',
          messageType: 'text',
          status: 'read',
        },
      ]);
    }
  }, [activeContact]);

  /**
   * Scroll to bottom when messages change
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Handle typing indicator
   */
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      onTypingIndicator?.(true);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingIndicator?.(false);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, onTypingIndicator]);

  /**
   * Handle message input change
   */
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
    }
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isTyping]);

  /**
   * Handle sending message
   */
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (isSending) return;

    setIsSending(true);
    setIsTyping(false);

    try {
      // Create new message
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        contactId: activeContact?.contactId || '',
        content: message.trim(),
        timestamp: new Date(),
        sender: 'agent',
        messageType: attachments.length > 0 ? 'attachment' : 'text',
        status: 'sending',
        attachments: attachments.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      };

      // Add message to state
      setMessages(prev => [...prev, newMessage]);

      // Call parent handler
      if (onSendMessage) {
        await onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
      }

      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'sent' }
          : msg
      ));

      // Clear inputs
      setMessage('');
      setAttachments([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
    } catch (error) {
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === messages[messages.length - 1]?.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    } finally {
      setIsSending(false);
    }
  }, [message, attachments, isSending, activeContact, onSendMessage, messages]);

  /**
   * Handle file attachment
   */
  const handleFileAttachment = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * Remove attachment
   */
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (!activeContact || activeContact.type !== 'chat') {
    return (
      <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Chat</h3>
          <div className="text-center text-gray-500 text-sm py-8">
            No active chat contact
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col', className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Chat</h3>
          <div className="text-xs text-gray-500">
            {activeContact.customer?.phoneNumber || 'Web Chat'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onEscalateToVoice && (
            <button
              onClick={onEscalateToVoice}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Escalate to voice call"
            >
              <PhoneIcon className="h-4 w-4" />
            </button>
          )}
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
              <EllipsisVerticalIcon className="h-4 w-4" />
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg focus:outline-none z-50">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          'w-full flex items-center px-3 py-2 text-sm',
                          active ? 'bg-gray-100' : '',
                          'text-gray-700'
                        )}
                      >
                        Export Chat History
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          'w-full flex items-center px-3 py-2 text-sm',
                          active ? 'bg-gray-100' : '',
                          'text-gray-700'
                        )}
                      >
                        Add Internal Note
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px]">
        <div className="space-y-1">
          {messages.map((msg, index) => {
            const isLastInGroup = index === messages.length - 1 || 
              messages[index + 1]?.sender !== msg.sender;
            return (
              <ChatMessageComponent
                key={msg.id}
                message={msg}
                isLastInGroup={isLastInGroup}
              />
            );
          })}
          {customerTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-white border border-gray-200 rounded-md px-3 py-1"
              >
                <PaperClipIcon className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-700 truncate max-w-24">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={isSending}
            />
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileAttachment}
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            disabled={isSending}
            title="Attach file"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            disabled={isSending}
            title="Add emoji"
          >
            <FaceSmileIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={(!message.trim() && attachments.length === 0) || isSending}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              (message.trim() || attachments.length > 0) && !isSending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
            title="Send message"
          >
            {isSending ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;