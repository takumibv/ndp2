"use strict";
exports.__esModule = true;
var TaskQueue = /** @class */ (function () {
    function TaskQueue(concurrency) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }
    TaskQueue.prototype.pushTask = function (task) {
        this.queue.push(task);
        this.next();
    };
    TaskQueue.prototype.next = function () {
        var _this = this;
        while (this.running < this.concurrency && this.queue.length) {
            var task = this.queue.shift();
            task(function () {
                _this.running--;
                _this.next();
            });
            this.running++;
        }
    };
    return TaskQueue;
}());
exports["default"] = TaskQueue;
;
