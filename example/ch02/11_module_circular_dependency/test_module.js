"use strict";

module.exports = (message) => {
  console.log("関数のエクスポート", message);
};

module.exports.hello = (message) => {
  console.log("副次的なエクスポート", message);
};
