function actionCreator(type, ...argNames) {
  return (...args) => {
    const action = argNames.reduce((acc, argName, idx) => {
      acc[argName] = args[idx];
      return acc;
    }, { type: type });
    return action;
  };
}

