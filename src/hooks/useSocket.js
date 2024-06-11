import { io } from 'socket.io-client';
import {useEffect, useState} from "react";
const HOST = 'https://demo.iztalk.ai';
// const HOST = 'http://127.0.0.1:65432';

function initEventSocket(socket) {
  socket.on('connect', async () => {
    console.info(`socket connected`);
  });

  socket.on('disconnect', () => {
    console.info(`socket disconnected`);
  });

  socket.on('connect_error', (error) => {
    console.info(`socket connect_error: error:${error}`);
  });
}
export async function initSocket() {
  // @ts-ignore
  const socket = io.connect(HOST,{
    extraHeaders:{
      // 'language':'en_us',
      'language':'vi_VN',
      'APPID':'ga3371f8',
      'APIKey':'50a9574ec6f5d7992ecbbe1f76e313d8',
      'APISecret':'37a9a3df4b64d5504c103a42353a9ec8',

    }
  });


  initEventSocket(socket);

  return socket;
}


export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!socket) {
      const initializeSocket = async () => {
        const _socket = await initSocket({});
        setSocket(_socket);
      };
      initializeSocket();
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);


  return {
    socket,
  }
};
