import React, { useState, useEffect, useRef } from "react";
import ScrollToBottom from 'react-scroll-to-bottom';
import io from "socket.io-client";
import "./ChatRoom.css";
import {
  AlertDialog,
  AlertDialogLabel,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogContent,
} from "@reach/alert-dialog";

let endPoint = "http://35.188.189.237:8000";
// let socket = io.connect(`${endPoint}`);

const ChatRoom = (props) => {
  // const { is_listener } = props.match.params;
  const listenerType = new URLSearchParams(props.location.search).get("type")
  const is_listener = (listenerType === "listener1" || listenerType === "listener2")// ? true ? listenerType === "client" : false : ""
  const show_predictions = listenerType === "listener2"
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [suggestionMessage, setSuggestionMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestion, setSuggestion] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [showDialog, setShowDialog] = React.useState(false);
  const close = () => setShowDialog(false);
  const cancelRef = React.useRef();
  const data = {
    "Grounding": "Use a short, neutral phrase to continue the conversation",
    "Open Question": "Pose a question to seek open ended information from the client",
    "Closed Question": "Pose a question to seek specific information from the client",
    "Introduction/Greeting" : "Greet or exchange introductions with the client",
    "Affirm" : "Offer positive feedback regarding the client's actions",
    "Persuade" : "Offer logical points to the client's conversation",
    "Reflection" : "Reflect on something the client has said",
    "Support" : "Be sympathetic towards the client's circumstances",
  }
  
  // const suggestions = ["nice message", "click this", "howdy"]
  let socketRef = useRef()
  const messageRef = useRef()

  useEffect(() => {
    socketRef.current = io.connect(`${endPoint}`);
    socketRef.current.on("error", args => {
      alert("Received error from backend: " + args);
    });
  
    socketRef.current.on("new_message", args => {
      setMessages([...messages, { "is_listener": args["is_listener"], "utterance": args["utterance"] }]);
      setSuggestions(args["suggestions"]);  
      setPredictions(args["predictions"]);
      console.log("event emitted")
    });
  
    socketRef.current.on("dump_logs_success", () => {
      console.log("Dumped logs successfully");
    });

    return () => {
      messageRef.current.scrollIntoView({behavior: "smooth"})
      socketRef.current.disconnect();
    };
  }, [messages])

  // const handleNewMessageChange = (event) => {
  //   setNewMessage(event.target.value);
  // };

  // const handleSendMessage = () => {
  //   sendMessage(newMessage);
  //   setNewMessage("");
  // };

  const onChangeMessage = e => {
    setMessage(e.target.value);
  };

  // const open = (text) => {
  //   setShowDialog(true);
  //   setSuggestionMessage(data[text]);
  //   setSuggestion(text);
  // };

  const onSendMessage = (e) => {
    e.preventDefault()
    if (message !== "") {
      socketRef.current.emit("add_message", is_listener, message);
      setMessage("");
    } else {
      alert("Please add a message.");
    }
  };

  const onSelectPred = x => {
    console.log(x, "messge")
    console.log(predictions.findIndex(i => i === x), "index")
    setMessage(x);
    socketRef.current.emit("log_click", is_listener, predictions.findIndex(i => i === x)); //["itte", "yye"]
  };

  const onSelectSuggestion = x => {
    setSuggestion(x);
    setSuggestionMessage(data[x]);
    setShowDialog(true);
  };

  const onDumpLogs = () => {
    socketRef.current.emit("dump_logs");
  };

  const onClearSession = () => {
    socketRef.current.emit("clear_session");
  };

  // useEffect(() => {
  //   messageRef?.current.scrollIntoView({behavior: "smooth"})
  // }, [messages])

  return (
    <>
      <div className="chat">
        <header className="chat__header">
          <div className="chat__header-container">
            <div className="chat__header-item">
              <div className="chat__item-group">
                <div><img src="/user_logo.png" alt="user logo" /></div>
                <h5>{!is_listener ? "Listener" : "Client"}</h5>
              </div>
            </div>
            {!is_listener && <div className="chat__header-item">
              <div className="chat__item-group">
                <button onClick={() => onClearSession()} className="chat__button">Clear Session</button>
                <button onClick={() => onDumpLogs()} className="chat__button">Dump Logs</button>
              </div>
            </div>}

          </div>
        </header>
        <section className="chat__body">
          <div className="chat__body-container" >
            <ScrollToBottom className="chat__messages-list">
              {messages?.length > 0 &&
                messages.map((message, i) => (
                  <li
                    key={i}
                    ref={messageRef}
                    className={`
                    chat__message-item 
                    ${
                      message.is_listener === is_listener ? "my-message" : "received-message"
                      }`
                    }
                  >
                    {message.utterance}
                  </li>
                ))}
            </ScrollToBottom>
          </div>
        </section>
        <section className="chat__strategies">
          {show_predictions && is_listener && suggestions.length > 0 && <div className="chat__strategies-container">
            <div className="chat__strategies-group">
              {suggestions.map(i => (<button onClick={() => onSelectSuggestion(i)} className="chat__strategies-button">{i}</button>))}
              {showDialog && (
                <AlertDialog className = "alert-buttons" leastDestructiveRef={cancelRef}>

                  <AlertDialogLabel className = "alert-dialog">{suggestion}: {suggestionMessage}</AlertDialogLabel>
                  <button ref={cancelRef} onClick={close} className="alert_button">
                      Click to continue
                  </button>
                </AlertDialog>
              )}
            </div>
          </div>}
        </section>
        <section className="chat__suggestion">
          {show_predictions && is_listener && predictions.length > 0 && <div className="chat__suggestion-container">
            <div className="chat__suggestion-group">
              {predictions.map(i => (<button onClick={() => onSelectPred(i)} className="chat__suggestion-button">{i}</button>))}
            </div>
          </div>}

        </section>
        <section className="chat__input">
          <div className="chat__input-wrapper">
            <form onSubmit={onSendMessage}>
              <input value={message}
                onChange={onChangeMessage}
                placeholder="Write message..." />
              <button className="submit__icon">
                <img src="/send_button.png" alt="send button" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
    // <div className="chat-room-container">
    //   <h1 className="room-name">Room: {roomId}</h1>
    //   <h1 className="chat-ID">User ID: {userID}</h1>
    //   <div className="messages-container">
    //     <ol className="messages-list">
    // {messages.map((message, i) => (
    //   <li
    //     key={i}
    //     className={`message-item ${
    //       message.ownedByCurrentUser ? "my-message" : "received-message"
    //     }`}
    //   >
    //     {message.body}
    //   </li>
    // ))}
    //     </ol>
    //   </div>
    //   <textarea
    // value={newMessage}
    // onChange={handleNewMessageChange}
    // placeholder="Write message..."
    //     className="new-message-input-field"
    //   />
    //   <button onClick={handleSendMessage} className="send-message-button">
    //     Send
    //   </button>
    // </div>
  );
};

export default ChatRoom;
