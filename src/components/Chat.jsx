"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { getClientId } from "../utils";
import Spinner from "react-bootstrap/Spinner";

export default function Home() {
  const [message, setMessage] = useState(
    "Circuit jumpers are used in service work to:  a. Temporarily defeat safety circuits  b. Lock and tagout an elevator  c. Ground the lighting circuits at the controller  d. All of the above"
  );
  const [socket, setSocket] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [messageHeight, setMessageHeight] = useState(35);

  const chatHistoryRef = useRef(null); // Create a ref for the chat history container

  useEffect(() => {
    // Initialize the client ID
    const clientId = getClientId();
    console.log("Client ID:", clientId);

    console.log("Socket-URL: ", process.env.NEXT_PUBLIC_SOCKET_URL);
    console.log("Socket-Domain: ", process.env.NEXT_PUBLIC_DOMAIN);

    // Check if socket is already initialized
    const newSocket = io(
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_SOCKET_URL // your backend directly in dev
        : process.env.NEXT_PUBLIC_DOMAIN, // Nginx domain in prod
      {
        path: "/socket.io", // must match Nginx location
        auth: {
          serverOffset: 0,
          clientId, // use the client ID from localStorage
        },
      }
    );

    console.log("Socket initialized:", newSocket);

    if (!socket) {
      console.log("Socket initialized");
      setSocket(newSocket);
    }
  }, []);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [allMessages]); // Scroll on new message

  useEffect(() => {
    console.log("ℹ️ Setting up socket listeners");

    if (!socket) return;

    console.log("Socket Changed:");

    function handleIncomingMessage(response) {
      if (isCanceled) {
        console.warn("Ignored message because request was canceled");
        return;
      }

      if (!response || !response.text || !response.sender) {
        console.warn("Received invalid message format:", response);
        return;
      }

      console.log("Received response:", response);

      const { text, sender, timestamp } = response;

      // Avoid empty messages
      if (!text || !text.trim()) {
        console.warn("Received empty message, ignoring.");
        return;
      }

      // Construct message object
      const msg = {
        text: text.trim(),
        sender,
        timestamp: timestamp || Date.now(), // fallback to current time
      };

      // Append message to state
      setAllMessages((prevMessages) => [...prevMessages, msg]);

      // Re-enable send button when a server message arrives
      if (response.sender === "server") {
        setIsSending(false);
      }
    }

    // Listen for incoming messages from the server
    socket.on("chatMessage", handleIncomingMessage);

    // console.log("Received message:", handleIncomingMessage);

    // Cleanup on unmount or socket change
    return () => {
      socket.off("chatMessage", handleIncomingMessage);
    };
  }, [socket]);

  async function handleSendMessage(event, textareaEl) {
    event.preventDefault();

    console.log("Send btn clicked");
    if (!message || isSending) return;
    console.log("Sending message:", message);

    // disable button until server responds
    setIsSending(true);
    setIsCanceled(false);

    // Emit the message to the server
    if (socket) {
      console.log("Message sent:", message);
      console.log("Socket ID:", socket.id);

      socket.emit("chatMessage", {
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

    // reset textarea height
    setMessageHeight(35); // reset to default
  }

  return (
    <div style={styles.container}>
      <div>
        <h3
          style={{
            color: "var(--foreground)",
            textAlign: "center",
            marginBottom: "10px",
            fontSize: "1.5rem",
          }}
        >
          🛗 Elevator Tech Chat
        </h3>

        <p
          style={{
            color: "var(--foreground)",
            textAlign: "center",
            fontSize: "1.2rem",
            marginBottom: "20px",
          }}
        >
          Fast, smart, and always connected!
        </p>
        <p
          style={{
            color: "var(--foreground)",
            textAlign: "center",
            fontSize: "0.9rem",
            marginBottom: "20px",
            // text wrap for even
            wordWrap: "break-word",
            // maxWidth: "600px",
          }}
        >
          Ask your questions, get clear guidance, and stay on top of elevator
          maintenance and service operations in real-time.
        </p>
      </div>

      <section style={{ marginTop: "20px" }}></section>

      <div>
        <div ref={chatHistoryRef} style={styles.chatHistoryContainer}>
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

              {/* Spinner bubble only if waiting for bot */}
              {isSending && (
                <li
                  style={{
                    ...styles.messageItem,
                    alignSelf: "flex-start", // bot side
                    backgroundColor: "var(--bubble-receiver)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Spinner animation="border" size="sm" />
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <Form onSubmit={handleSendMessage}>
        <div style={styles.chatbox}>
          <Form.Group controlId="formMessage" style={styles.formMessage}>
            <Form.Control
              as="textarea"
              type="text"
              disabled={isSending}
              placeholder="Ask Anything"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setMessageHeight(e.target.scrollHeight || 35);
              }}
              rows={1} // Start with 1 row
              style={{ ...styles.inputMessage, height: messageHeight }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // Prevents adding a new line
                  handleSendMessage(e, e.target); // Calls the send message function
                }
              }}
            />
          </Form.Group>
          {!isSending ? (
            <Button
              type="submit"
              disabled={isSending}
              size="sm"
              style={styles.button}
            >
              Send
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              style={styles.button}
              onClick={() => {
                setIsSending(false);
                setIsCanceled(true);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    // width: "100%",
    maxWidth: "800px",
    padding: "5px",
    marginBottom: "50px",
    backgroundColor: "var(--background)", // uses theme
    color: "var(--foreground)", // ensure text contrast
  },

  chatHistoryContainer: {
    border: "1px solid blue",

    minHeight: "50vh",
    maxHeight: "50vh",
    overflowY: "auto",
    border: "1px solid var(--gray-alpha-200)",
    padding: "10px",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
    backgroundColor: "var(--gray-alpha-100)",
    marginBottom: "20px",
  },
  messageItem: {
    // border: "1px solid red",
    // background: "rgba(var(--gray-rgb), 0.15)",
    border: "1px solid var(--gray-alpha-200)",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
    textAlign: "left",
    // maxWidth: "70vw",
    color: "var(--foreground)",
    padding: "8px 10px",
    borderRadius: "12px",
    marginBottom: "18px",
    maxWidth: "80%",
    display: "flex",
  },
  chatbox: {
    // border: "1px solid red",
    // borderTop: "1px solid var(--gray-alpha-200)",

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "auto",
  },
  formMessage: {
    // border: "1px solid green",
    marginRight: "10px",
    width: "100%",
    // boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    // borderRadius: "6px",
  },
  inputMessage: {
    // border: "10px solid orange",
    flex: 1,
    marginRight: "16px",
    width: "100%",
    maxHeight: "200px",
    // padding: "7px 5px 5px 7px",
    borderRadius: "6px",
    // border: "1px solid var(--gray-alpha-200)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    transition: "border-color 0.2s ease",
    overflowY: "auto",
    resize: "none", // prevents manual resizing
    transition: "height 0.2s ease",
  },
  button: {
    marginRight: "5px",
  },
};
