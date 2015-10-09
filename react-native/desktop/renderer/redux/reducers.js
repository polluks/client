const savedVolume = parseInt(window.localStorage.getItem('initialVolume'), 10);

const initialState = {
  playlist: [
    // "VJdi9SDlVhU",
    // "h_aKALHPRmU",
    "trvnP7EsAHA"
  ],
  currentVideoId: "trvnP7EsAHA",
  playbackStatus: "PAUSED",
  videoDurations: {}, // id => duration
  volume: Number.isNaN(savedVolume) ? 100 : savedVolume,
};

export function playlistReducer(state = initialState, action) {
  switch (action.type) {
    case "SELECT_VIDEO":
      return {
        ...state,
        currentVideoId: action.videoId
      };
    default:
      return state;
  }
}

export function playbackStateReducer(state = initialState, action) {
   return state;
}
