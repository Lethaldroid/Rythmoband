/* eslint-disable no-restricted-globals */
// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  self.onmessage = (event) => {
    console.log("Message from main thread: ", event.data);
    postMessage(":(");
  };
};

// onmessage = function (event) {
//   console.log("Received message from main thread:", event.data);

//   // postMessage("hey");
// };
