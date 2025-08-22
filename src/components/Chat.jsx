"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

export default function Home() {
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [allMessages, setAllMessages] = useState([]);

  const chatHistoryRef = useRef(null); // Create a ref for the chat history container

  useEffect(() => {
    if (socket === null) {
      const newSocket = io("http://192.168.0.209:4000", {
        auth: {
          serverOffset: 0,
        },
      });
      setSocket(newSocket);
    }
  }, []);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [allMessages]); // Scroll on new message

  useEffect(() => {
    if (!socket) return;

    console.log("Socket Changed:");

    function handleIncomingMessage(msg, serverOffset) {
      if (!msg?.text || !msg?.sender) return; // avoid empty messages

      setAllMessages((prevMessages) => [...prevMessages, msg]);
      socket.auth.serverOffset = serverOffset;
    }

    // Listen for incoming messages from the server
    socket.on("chat message", handleIncomingMessage);

    console.log("Received message:", handleIncomingMessage);
  }, [socket]);

  async function handleSendMessage(event) {
    event.preventDefault();

    console.log("Send btn clicked");
    if (!message) return;

    console.log("Sending message:", message);

    // Emit the message to the server
    if (socket) {
      console.log("Message sent:", message);
      console.log("Socket ID:", socket.id);

      socket.emit("chat message", {
        text: message,
        sender: socket.id,
      });
    } else {
      console.error("Socket is not connected");
      return;
    }

    // Update the chat history with the new message
    setAllMessages((prevMessages) => [
      ...prevMessages,
      { text: message, sender: socket.id },
    ]);

    // Clear the input field after sending
    setMessage("");
  }

  return (
    <div style={styles.section}>
      <h3>Hello World!</h3>
      <p>
        This is a simple chat application built with Next.js and Socket.IO. Send
        messages in real-time.
      </p>

      <section style={{ marginTop: "20px" }}></section>
      {/* <h4 style={{ marginTop: "20px" }}>Messages:</h4> */}

      <div style={styles.chatHistory} ref={chatHistoryRef}>
        {allMessages.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {allMessages.map((msg, index) => {
              // Skip if msg is null/undefined or msg.text is falsy
              if (!msg || !msg.text) return null;

              return (
                <li
                  key={index}
                  style={{
                    ...styles.messageItem,
                    alignSelf:
                      msg.sender === socket?.id ? "flex-end" : "flex-start",
                    backgroundColor:
                      msg.sender === socket?.id
                        ? "var(--bubble-sender)"
                        : "var(--bubble-receiver)",
                  }}
                >
                  {msg.text}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Form onSubmit={handleSendMessage} style={styles.chatbox}>
        <Form.Group controlId="formMessage">
          <Form.Control
            as="textarea"
            type="text"
            placeholder="Enter message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.inputMessage}
            rows={4}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevents adding a new line
                handleSendMessage(e); // Calls the send message function
              }
            }}
          />
        </Form.Group>
        <Button
          variant="primary"
          type="submit"
          style={{
            height: "24px",
            padding: "0 14px",
            fontSize: "16px",
            whiteSpace: "nowrap",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Send
        </Button>
      </Form>
    </div>
  );
}

const styles = {
  section: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    backgroundColor: "var(--background)", // uses theme
    color: "var(--foreground)", // ensure text contrast
  },
  chatHistory: {
    flex: 1,
    minHeight: "40vh",
    maxHeight: "40vh",
    overflowY: "auto",
    border: "1px solid var(--gray-alpha-200)",
    padding: "10px",
    borderRadius: "4px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    backgroundColor: "var(--gray-alpha-100)",
    marginBottom: "20px",
  },
  messageItem: {
    // background: "rgba(var(--gray-rgb), 0.15)",
    textAlign: "left",
    maxWidth: "50vw",
    color: "var(--foreground)",
    padding: "8px 10px",
    borderRadius: "16px",
    marginBottom: "8px",
    maxWidth: "60%",
    display: "flex",
  },
  chatbox: {
    // border: "1px solid red",
    borderTop: "1px solid var(--gray-alpha-200)",
    paddingTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputMessage: {
    // border: "1px solid orange",
    flex: 1,
    marginRight: "16px",
    minWidth: "60vw",
    maxWidth: "60vw",
    height: "40px",
    minHeight: "35px",
    maxHeight: "100px",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid var(--gray-alpha-200)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    transition: "border-color 0.2s ease",
  },
};
