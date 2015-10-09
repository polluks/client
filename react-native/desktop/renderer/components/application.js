import React from "react";
import { autobind } from "core-decorators";
import { connect } from "react-redux";

import * as actions from "../redux/actions";

@connect(state => ({
  ...state,
  isPlaying: state.playbackStatus === "PLAYING",
  currentVideoDuration: state.videoDurations[state.currentVideoId] || 0
}), actions)
export default class Application extends React.Component {
  constructor(props) {
    super(props);
    window.props = props;
    this.state = {
      currentTime: 0
    };
  }

  render() {
    return (
      <div><p>hello</p></div>
    )
  }
}
