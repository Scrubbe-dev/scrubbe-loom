let socket: WebSocket | null = null;

export default {
  connect(token: any) {
    socket = new WebSocket(`ws://localhost:5000`);

    socket.onopen = () => {
      // Authenticate
      socket?.send(JSON.stringify({
        type: 'auth',
        token
      }));
    };

    return socket;
  },

  subscribe(room: any) {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'subscribe',
        room
      }));
    }
  },

  onEvent(eventType: any, callback: (arg0: any) => void) {
    if (socket) {
      socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.eventType === eventType) {
          callback(data);
        }
      });
    }
  },

  disconnect() {
    if (socket) {
      socket.close();
    }
  }
};