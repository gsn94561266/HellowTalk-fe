import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true,
});

const ChatRoom = () => {
  const [isPairing, setIsPairing] = useState(false);
  const [chattingUser, setChattingUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [otherUserLeft, setOtherUserLeft] = useState(false);

  // 固定卷軸
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 開始配對
  const handlePairing = () => {
    socket.emit('startPairing');
    setIsPairing(true);
  };

  // 解除配對
  const handleUnpair = () => {
    socket.emit('unpair');
    setIsPairing(false);
    setChattingUser(null);
    setChatMessages([]);
  };

  // 發送訊息
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      const message = {
        sender: socket.id,
        text: inputMessage,
        timestamp: new Date(),
      };
      socket.emit('sendMessage', message);
      setInputMessage('');
      setChatMessages((prevMessages) => [...prevMessages, message]);
    } else {
      setInputMessage('');
    }
  };

  useEffect(() => {
    socket.on('startChat', (pairedUser) => {
      setIsPairing(false);
      setChattingUser(pairedUser);
      setChatMessages([]);
      setOtherUserLeft(false);
    });

    socket.on('otherUserLeft', () => {
      setOtherUserLeft(true);
    });
    socket.on('receiveMessage', (message) => {
      if (message.sender === chattingUser) {
        setChatMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off('startChat');
      socket.off('otherUserLeft');
      socket.off('receiveMessage');
    };
  }, [chattingUser]);

  return (
    <div
      className="vh-100 d-flex flex-column justify-content-end"
      style={{
        background: "url('/images/background.jpg') center/cover",
      }}>
      <div className="overflow-auto" ref={scrollRef}>
        {chattingUser ? (
          <div>
            <h1 className="text-primary text-center py-5 fw-bold">
              HellowTalk
            </h1>
            <div className="container bg-light bg-opacity-75 rounded-top px-2 py-5">
              <div className="text-center mb-5">加密連線完成，開始聊天囉！</div>
              {chatMessages.map((v, i) => {
                let timeAgo = formatDistanceToNow(new Date(v.timestamp), {
                  locale: zhTW,
                  addSuffix: true,
                });
                return (
                  <div
                    className={
                      v.sender === chattingUser
                        ? 'd-flex m-3 align-items-end'
                        : 'd-flex m-3 align-items-end justify-content-end'
                    }
                    key={i}>
                    <span className="bg-white rounded-4 py-2 px-3 order-1">
                      {v.text}
                    </span>
                    <span
                      className={
                        v.sender === chattingUser
                          ? 'text-secondary mx-2 order-2'
                          : 'text-secondary mx-2 order-0'
                      }
                      style={{ fontSize: '0.5rem' }}>
                      {timeAgo.includes('少於')
                        ? '剛剛'
                        : timeAgo.replace('大約', '')}
                    </span>
                  </div>
                );
              })}
              {otherUserLeft && (
                <div className="text-center mb-5">
                  對方離開了，請按離開按鈕回到首頁
                </div>
              )}
            </div>
            <form
              className="bg-light d-flex p-2 input-group position-fixed bottom-0"
              onSubmit={handleSendMessage}>
              <button
                type="button"
                className="btn btn-light text-primary fw-bold p-0"
                onClick={handleUnpair}>
                離開
              </button>
              <input
                className="form-control mx-2"
                type="text"
                value={inputMessage}
                placeholder="輸入訊息"
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-light text-primary fw-bold p-0"
                onClick={handleSendMessage}>
                傳送
              </button>
            </form>
          </div>
        ) : (
          <div className="position-absolute top-50 start-50 translate-middle text-center">
            <h1 className="text-primary text-center py-5 fw-bold">
              HellowTalk
            </h1>
            {isPairing ? (
              <div className="text-center">找個人聊天...</div>
            ) : (
              <button
                className="btn btn-outline-primary px-md-5 fs-1"
                onClick={handlePairing}>
                開始聊天
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
