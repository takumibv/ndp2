"use strict";

function test(modu, exp) {
  exp.key = "hoge";

  console.log(modu);
}

const modu = {
  exp: {
    key: "foo",
  },
};

test(modu, modu.exp);
