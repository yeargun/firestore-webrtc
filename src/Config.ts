export const RTCconfig = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

export const CHUNK_SIZE = 5000;

export const dataChannelOptions = {
  ordered: true,
  reliable: true,
};
