(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.lambda = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEvent = createEvent;
exports.getEvents = getEvents;
exports.createPost = createPost;
exports.getPosts = getPosts;
exports.getAuthor = getAuthor;
exports.getAuthors = getAuthors;
exports.getComments = getComments;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dynamoConfig = {
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION
};
_awsSdk2.default.config.apiVersions = {
  dynamodb: '2012-08-10'
};
var docClient = new _awsSdk2.default.DynamoDB.DocumentClient(dynamoConfig);
var stage = process.env.SERVERLESS_STAGE;
var projectName = process.env.SERVERLESS_PROJECT_NAME;

var postsTable = projectName + '-posts-' + stage;
var authorsTable = projectName + '-authors-' + stage;
var commentsTable = projectName + '-comments-' + stage;
var eventsTable = projectName + '-events-' + stage;

function createEvent(evt) {
  return new _bluebird2.default(function (resolve, reject) {
    var params = {
      TableName: eventsTable,
      Item: evt
    };

    docClient.put(params, function (err, data) {
      if (err) return reject(err);
      return resolve(evt);
    });
  });
}

function getEvents(username, start, end) {
  return new _bluebird2.default(function (resolve, reject) {
    var params = {
      TableName: eventsTable,
      KeyConditionExpression: "username = 'camerooni@gmail.com' and created > 0"
    };

    docClient.query(params, function (err, data) {
      if (err) return reject(err);
      return resolve(data["Items"]);
    });
  });
}

function createPost(post) {
  return new _bluebird2.default(function (resolve, reject) {
    var params = {
      TableName: postsTable,
      Item: post
    };

    docClient.put(params, function (err, data) {
      if (err) return reject(err);
      return resolve(post);
    });
  });
}

function getPosts() {
  return new _bluebird2.default(function (resolve, reject) {
    var params = {
      TableName: postsTable,
      AttributesToGet: ['id', 'title', 'author', 'bodyContent']
    };

    docClient.scan(params, function (err, data) {
      if (err) return reject(err);
      return resolve(data["Items"]);
    });
  });
}

function getAuthor(id) {
  return new _bluebird2.default(function (resolve, reject) {
    var params = {
      TableName: authorsTable,
      Key: {
        id: id
      },
      AttributesToGet: ['id', 'name']
    };

    docClient.get(params, function (err, data) {
      if (err) return reject(err);
      return resolve(data["Item"]);
    });
  });
}

function getAuthors() {
  return new _bluebird2.default(function (resolve, reject) {
    var params = {
      TableName: authorsTable,
      AttributesToGet: ['id', 'name']
    };

    docClient.scan(params, function (err, data) {
      if (err) return reject(err);
      return resolve(data["Items"]);
    });
  });
}

function getComments() {
  return new _bluebird2.default(function (resolve, reject) {
    var params = {
      TableName: commentsTable,
      AttributesToGet: ['id', 'content', 'author']
    };

    docClient.scan(params, function (err, data) {
      if (err) return reject(err);
      return resolve(data["Items"]);
    });
  });
}

},{"aws-sdk":undefined,"bluebird":28}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runGraphQL = runGraphQL;

var _graphql = require('graphql');

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function runGraphQL(event, cb) {

  var query = event.query;

  // patch to allow queries from GraphiQL
  // like the initial introspectionQuery
  if (event.query && event.query.hasOwnProperty('query')) {
    query = event.query.query.replace("\n", ' ', "g");
  }

  (0, _graphql.graphql)(_schema2.default, query).then(function (result) {
    //console.log('RESULT: ', result);
    return cb(null, result);
  });
}

},{"./schema":3,"graphql":157}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

var _graphqlCustomTypes = require('graphql-custom-types');

var _dynamo = require('./dynamo');

var Event = new _graphql.GraphQLObjectType({
  name: "Event",
  description: "User reporting their mood at a specific time",
  fields: function fields() {
    return {
      username: {
        type: _graphql.GraphQLString,
        description: "Email address of the user"
      },
      mood: {
        type: _graphql.GraphQLString,
        description: "The mood the user is in"
      },
      created: {
        type: _graphql.GraphQLInt,
        description: "Creation Timestamp of the event"
      }
    };
  }
});

var Author = new _graphql.GraphQLObjectType({
  name: "Author",
  description: "Author of the blog post",
  fields: function fields() {
    return {
      id: { type: _graphql.GraphQLString },
      name: { type: _graphql.GraphQLString }
    };
  }
});

var Comment = new _graphql.GraphQLObjectType({
  name: "Comment",
  description: "Comment on the blog post",
  fields: function fields() {
    return {
      id: { type: _graphql.GraphQLString },
      content: { type: _graphql.GraphQLString },
      author: {
        type: Author,
        resolve: function resolve(_ref) {
          var author = _ref.author;

          return (0, _dynamo.getAuthor)(author);
        }
      }
    };
  }
});

var Post = new _graphql.GraphQLObjectType({
  name: "Post",
  description: "Blog post content",
  fields: function fields() {
    return {
      id: { type: _graphql.GraphQLString },
      title: { type: _graphql.GraphQLString },
      bodyContent: { type: _graphql.GraphQLString },
      author: {
        type: Author,
        resolve: function resolve(_ref2) {
          var author = _ref2.author;

          return (0, _dynamo.getAuthor)(author);
        }
      },
      comments: {
        type: new _graphql.GraphQLList(Comment),
        resolve: function resolve(post) {
          return (0, _dynamo.getComments)();
        }
      }
    };
  }
});

var Query = new _graphql.GraphQLObjectType({
  name: 'BlogSchema',
  description: "Root of the Blog Schema",
  fields: function fields() {
    return {
      events: {
        type: new _graphql.GraphQLList(Event),
        description: "List of Events",
        args: {
          username: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLString) },
          start: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLInt) },
          end: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLInt) }
        },
        resolve: function resolve(username, start, end) {
          return (0, _dynamo.getEvents)(username, start, end);
        }
      },
      posts: {
        type: new _graphql.GraphQLList(Post),
        description: "List of posts in the blog",
        resolve: function resolve(source, _ref3) {
          var category = _ref3.category;

          return (0, _dynamo.getPosts)();
        }
      },
      authors: {
        type: new _graphql.GraphQLList(Author),
        description: "List of Authors",
        resolve: function resolve() {
          return (0, _dynamo.getAuthors)();
        }
      },
      author: {
        type: Author,
        description: "Get Author by id",
        args: {
          id: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLString) }
        },
        resolve: function resolve(source, _ref4) {
          var id = _ref4.id;

          return (0, _dynamo.getAuthor)(author);
        }
      }
    };
  }
});

var Mutuation = new _graphql.GraphQLObjectType({
  name: 'BlogMutations',
  fields: {
    createEvent: {
      type: Event,
      description: "Add a new timestamped event",
      args: {
        username: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLString) },
        mood: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLString) }
      },
      resolve: function resolve(source, args) {
        var created = new Date().getTime() / 1000;
        args.created = created;
        return (0, _dynamo.createEvent)(args);
      }
    },
    createPost: {
      type: Post,
      description: "Create blog post",
      args: {
        id: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLString) },
        title: { type: new _graphqlCustomTypes.GraphQLLimitedString(10, 30) },
        bodyContent: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLString) },
        author: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLString), description: "Id of the author" }
      },
      resolve: function resolve(source, args) {
        return (0, _dynamo.createPost)(args);
      }
    }
  }
});

var Schema = new _graphql.GraphQLSchema({
  query: Query,
  mutation: Mutuation
});

exports.default = Schema;

},{"./dynamo":1,"graphql":157,"graphql-custom-types":145}],4:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/array/from"), __esModule: true };
},{"core-js/library/fn/array/from":61}],5:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/get-iterator"), __esModule: true };
},{"core-js/library/fn/get-iterator":62}],6:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/is-iterable"), __esModule: true };
},{"core-js/library/fn/is-iterable":63}],7:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/map"), __esModule: true };
},{"core-js/library/fn/map":64}],8:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/assign"), __esModule: true };
},{"core-js/library/fn/object/assign":65}],9:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/create"), __esModule: true };
},{"core-js/library/fn/object/create":66}],10:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/define-property"), __esModule: true };
},{"core-js/library/fn/object/define-property":67}],11:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/get-own-property-descriptor"), __esModule: true };
},{"core-js/library/fn/object/get-own-property-descriptor":68}],12:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/keys"), __esModule: true };
},{"core-js/library/fn/object/keys":69}],13:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/set-prototype-of"), __esModule: true };
},{"core-js/library/fn/object/set-prototype-of":70}],14:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/promise"), __esModule: true };
},{"core-js/library/fn/promise":71}],15:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/set"), __esModule: true };
},{"core-js/library/fn/set":72}],16:[function(require,module,exports){
"use strict";

exports["default"] = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

exports.__esModule = true;
},{}],17:[function(require,module,exports){
"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

exports["default"] = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;

      _Object$defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

exports.__esModule = true;
},{"babel-runtime/core-js/object/define-property":10}],18:[function(require,module,exports){
"use strict";

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

exports["default"] = _Object$assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

exports.__esModule = true;
},{"babel-runtime/core-js/object/assign":8}],19:[function(require,module,exports){
"use strict";

var _Object$getOwnPropertyDescriptor = require("babel-runtime/core-js/object/get-own-property-descriptor")["default"];

exports["default"] = function get(_x, _x2, _x3) {
  var _again = true;

  _function: while (_again) {
    var object = _x,
        property = _x2,
        receiver = _x3;
    _again = false;
    if (object === null) object = Function.prototype;

    var desc = _Object$getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);

      if (parent === null) {
        return undefined;
      } else {
        _x = parent;
        _x2 = property;
        _x3 = receiver;
        _again = true;
        desc = parent = undefined;
        continue _function;
      }
    } else if ("value" in desc) {
      return desc.value;
    } else {
      var getter = desc.get;

      if (getter === undefined) {
        return undefined;
      }

      return getter.call(receiver);
    }
  }
};

exports.__esModule = true;
},{"babel-runtime/core-js/object/get-own-property-descriptor":11}],20:[function(require,module,exports){
"use strict";

var _Object$create = require("babel-runtime/core-js/object/create")["default"];

var _Object$setPrototypeOf = require("babel-runtime/core-js/object/set-prototype-of")["default"];

exports["default"] = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = _Object$create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _Object$setPrototypeOf ? _Object$setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

exports.__esModule = true;
},{"babel-runtime/core-js/object/create":9,"babel-runtime/core-js/object/set-prototype-of":13}],21:[function(require,module,exports){
"use strict";

exports["default"] = function (obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
};

exports.__esModule = true;
},{}],22:[function(require,module,exports){
"use strict";

exports["default"] = function (obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};

    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }

    newObj["default"] = obj;
    return newObj;
  }
};

exports.__esModule = true;
},{}],23:[function(require,module,exports){
"use strict";

var _getIterator = require("babel-runtime/core-js/get-iterator")["default"];

var _isIterable = require("babel-runtime/core-js/is-iterable")["default"];

exports["default"] = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = _getIterator(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (_isIterable(Object(arr))) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
})();

exports.__esModule = true;
},{"babel-runtime/core-js/get-iterator":5,"babel-runtime/core-js/is-iterable":6}],24:[function(require,module,exports){
"use strict";

var _Array$from = require("babel-runtime/core-js/array/from")["default"];

exports["default"] = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return _Array$from(arr);
  }
};

exports.__esModule = true;
},{"babel-runtime/core-js/array/from":4}],25:[function(require,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],26:[function(require,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = require("./schedule");
var Queue = require("./queue");
var util = require("./util");

function Async() {
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._haveDrainedQueues = false;
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule = schedule;
}

Async.prototype.enableTrampoline = function() {
    this._trampolineEnabled = true;
};

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._isTickUsed || this._haveDrainedQueues;
};


Async.prototype.fatalError = function(e, isNode) {
    if (isNode) {
        process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e));
        process.exit(2);
    } else {
        this.throwLater(e);
    }
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._haveDrainedQueues = true;
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = Async;
module.exports.firstLineError = firstLineError;

},{"./queue":50,"./schedule":53,"./util":60}],27:[function(require,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
var calledBind = false;
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (((this._bitField & 50397184) === 0)) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    if (!calledBind) {
        calledBind = true;
        Promise.prototype._propagateFrom = debug.propagateFromFunction();
        Promise.prototype._boundValue = debug.boundValueFunction();
    }
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();
    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, undefined, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, undefined, ret, context);
        ret._setOnCancel(maybePromise);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 2097152;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~2097152);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 2097152) === 2097152;
};

Promise.bind = function (thisArg, value) {
    return Promise.resolve(value).bind(thisArg);
};
};

},{}],28:[function(require,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = require("./promise")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise":46}],29:[function(require,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = require("./util");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!false) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];};
    if (!false) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util":60}],30:[function(require,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray, apiRejection, debug) {
var util = require("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

Promise.prototype["break"] = Promise.prototype.cancel = function() {
    if (!debug.cancellation()) return this._warn("cancellation is disabled");

    var promise = this;
    var child = promise;
    while (promise.isCancellable()) {
        if (!promise._cancelBy(child)) {
            if (child._isFollowing()) {
                child._followee().cancel();
            } else {
                child._cancelBranched();
            }
            break;
        }

        var parent = promise._cancellationParent;
        if (parent == null || !parent.isCancellable()) {
            if (promise._isFollowing()) {
                promise._followee().cancel();
            } else {
                promise._cancelBranched();
            }
            break;
        } else {
            if (promise._isFollowing()) promise._followee().cancel();
            child = promise;
            promise = parent;
        }
    }
};

Promise.prototype._branchHasCancelled = function() {
    this._branchesRemainingToCancel--;
};

Promise.prototype._enoughBranchesHaveCancelled = function() {
    return this._branchesRemainingToCancel === undefined ||
           this._branchesRemainingToCancel <= 0;
};

Promise.prototype._cancelBy = function(canceller) {
    if (canceller === this) {
        this._branchesRemainingToCancel = 0;
        this._invokeOnCancel();
        return true;
    } else {
        this._branchHasCancelled();
        if (this._enoughBranchesHaveCancelled()) {
            this._invokeOnCancel();
            return true;
        }
    }
    return false;
};

Promise.prototype._cancelBranched = function() {
    if (this._enoughBranchesHaveCancelled()) {
        this._cancel();
    }
};

Promise.prototype._cancel = function() {
    if (!this.isCancellable()) return;

    this._setCancelled();
    async.invoke(this._cancelPromises, this, undefined);
};

Promise.prototype._cancelPromises = function() {
    if (this._length() > 0) this._settlePromises();
};

Promise.prototype._unsetOnCancel = function() {
    this._onCancelField = undefined;
};

Promise.prototype.isCancellable = function() {
    return this.isPending() && !this.isCancelled();
};

Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
    if (util.isArray(onCancelCallback)) {
        for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
        }
    } else if (onCancelCallback !== undefined) {
        if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
                var e = tryCatch(onCancelCallback).call(this._boundValue());
                if (e === errorObj) {
                    this._attachExtraTrace(e.e);
                    async.throwLater(e.e);
                }
            }
        } else {
            onCancelCallback._resultCancelled(this);
        }
    }
};

Promise.prototype._invokeOnCancel = function() {
    var onCancelCallback = this._onCancel();
    this._unsetOnCancel();
    async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
};

Promise.prototype._invokeInternalOnCancel = function() {
    if (this.isCancellable()) {
        this._doInvokeOnCancel(this._onCancel(), true);
        this._unsetOnCancel();
    }
};

Promise.prototype._resultCancelled = function() {
    this.cancel();
};

};

},{"./util":60}],31:[function(require,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = require("./util");
var getKeys = require("./es5").keys;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function catchFilter(instances, cb, promise) {
    return function(e) {
        var boundTo = promise._boundValue();
        predicateLoop: for (var i = 0; i < instances.length; ++i) {
            var item = instances[i];

            if (item === Error ||
                (item != null && item.prototype instanceof Error)) {
                if (e instanceof item) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (typeof item === "function") {
                var matchesPredicate = tryCatch(item).call(boundTo, e);
                if (matchesPredicate === errorObj) {
                    return matchesPredicate;
                } else if (matchesPredicate) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (util.isObject(e)) {
                var keys = getKeys(item);
                for (var j = 0; j < keys.length; ++j) {
                    var key = keys[j];
                    if (item[key] != e[key]) {
                        continue predicateLoop;
                    }
                }
                return tryCatch(cb).call(boundTo, e);
            }
        }
        return NEXT_FILTER;
    };
}

return catchFilter;
};

},{"./es5":37,"./util":60}],32:[function(require,module,exports){
"use strict";
module.exports = function(Promise) {
var longStackTraces = false;
var contextStack = [];

Promise.prototype._promiseCreated = function() {};
Promise.prototype._pushContext = function() {};
Promise.prototype._popContext = function() {return null;};
Promise._peekContext = Promise.prototype._peekContext = function() {};

function Context() {
    this._trace = new Context.CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (this._trace !== undefined) {
        this._trace._promiseCreated = null;
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promiseCreated;
        trace._promiseCreated = null;
        return ret;
    }
    return null;
};

function createContext() {
    if (longStackTraces) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}
Context.CapturedTrace = null;
Context.create = createContext;
Context.deactivateLongStackTraces = function() {};
Context.activateLongStackTraces = function() {
    var Promise_pushContext = Promise.prototype._pushContext;
    var Promise_popContext = Promise.prototype._popContext;
    var Promise_PeekContext = Promise._peekContext;
    var Promise_peekContext = Promise.prototype._peekContext;
    var Promise_promiseCreated = Promise.prototype._promiseCreated;
    Context.deactivateLongStackTraces = function() {
        Promise.prototype._pushContext = Promise_pushContext;
        Promise.prototype._popContext = Promise_popContext;
        Promise._peekContext = Promise_PeekContext;
        Promise.prototype._peekContext = Promise_peekContext;
        Promise.prototype._promiseCreated = Promise_promiseCreated;
        longStackTraces = false;
    };
    longStackTraces = true;
    Promise.prototype._pushContext = Context.prototype._pushContext;
    Promise.prototype._popContext = Context.prototype._popContext;
    Promise._peekContext = Promise.prototype._peekContext = peekContext;
    Promise.prototype._promiseCreated = function() {
        var ctx = this._peekContext();
        if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
    };
};
return Context;
};

},{}],33:[function(require,module,exports){
"use strict";
module.exports = function(Promise, Context) {
var getDomain = Promise._getDomain;
var async = Promise._async;
var Warning = require("./errors").Warning;
var util = require("./util");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var printWarning;
var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 &&
                        (false ||
                         util.env("BLUEBIRD_DEBUG") ||
                         util.env("NODE_ENV") === "development"));

var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 &&
    (debugging || util.env("BLUEBIRD_WARNINGS")));

var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 &&
    (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));

var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 &&
    (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));

Promise.prototype.suppressUnhandledRejections = function() {
    var target = this._target();
    target._bitField = ((target._bitField & (~1048576)) |
                      524288);
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 524288) !== 0) return;
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._setReturnedNonUndefined = function() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._returnedNonUndefined = function() {
    return (this._bitField & 268435456) !== 0;
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._settledValue();
        this._setUnhandledRejectionIsNotified();
        fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 262144;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~262144);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 262144) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 1048576;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~1048576);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
    return warn(message, shouldUseOwnTrace, promise || this);
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

var disableLongStackTraces = function() {};
Promise.longStackTraces = function () {
    if (async.haveItemsQueued() && !config.longStackTraces) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (!config.longStackTraces && longStackTracesIsSupported()) {
        var Promise_captureStackTrace = Promise.prototype._captureStackTrace;
        var Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
        config.longStackTraces = true;
        disableLongStackTraces = function() {
            if (async.haveItemsQueued() && !config.longStackTraces) {
                throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
            }
            Promise.prototype._captureStackTrace = Promise_captureStackTrace;
            Promise.prototype._attachExtraTrace = Promise_attachExtraTrace;
            Context.deactivateLongStackTraces();
            async.enableTrampoline();
            config.longStackTraces = false;
        };
        Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
        Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
        Context.activateLongStackTraces();
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return config.longStackTraces && longStackTracesIsSupported();
};

var fireDomEvent = (function() {
    try {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent("testingtheevent", false, true, {});
        util.global.dispatchEvent(event);
        return function(name, event) {
            var domEvent = document.createEvent("CustomEvent");
            domEvent.initCustomEvent(name.toLowerCase(), false, true, event);
            return !util.global.dispatchEvent(domEvent);
        };
    } catch (e) {}
    return function() {
        return false;
    };
})();

var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function() {
            return process.emit.apply(process, arguments);
        };
    } else {
        if (!util.global) {
            return function() {
                return false;
            };
        }
        return function(name) {
            var methodName = "on" + name.toLowerCase();
            var method = util.global[methodName];
            if (!method) return false;
            method.apply(util.global, [].slice.call(arguments, 1));
            return true;
        };
    }
})();

function generatePromiseLifecycleEventObject(name, promise) {
    return {promise: promise};
}

var eventToObjectGenerator = {
    promiseCreated: generatePromiseLifecycleEventObject,
    promiseFulfilled: generatePromiseLifecycleEventObject,
    promiseRejected: generatePromiseLifecycleEventObject,
    promiseResolved: generatePromiseLifecycleEventObject,
    promiseCancelled: generatePromiseLifecycleEventObject,
    promiseChained: function(name, promise, child) {
        return {promise: promise, child: child};
    },
    warning: function(name, warning) {
        return {warning: warning};
    },
    unhandledRejection: function (name, reason, promise) {
        return {reason: reason, promise: promise};
    },
    rejectionHandled: generatePromiseLifecycleEventObject
};

var activeFireEvent = function (name) {
    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent.apply(null, arguments);
    } catch (e) {
        async.throwLater(e);
        globalEventFired = true;
    }

    var domEventFired = false;
    try {
        domEventFired = fireDomEvent(name,
                    eventToObjectGenerator[name].apply(null, arguments));
    } catch (e) {
        async.throwLater(e);
        domEventFired = true;
    }

    return domEventFired || globalEventFired;
};

Promise.config = function(opts) {
    opts = Object(opts);
    if ("longStackTraces" in opts) {
        if (opts.longStackTraces) {
            Promise.longStackTraces();
        } else if (!opts.longStackTraces && Promise.hasLongStackTraces()) {
            disableLongStackTraces();
        }
    }
    if ("warnings" in opts) {
        var warningsOption = opts.warnings;
        config.warnings = !!warningsOption;
        wForgottenReturn = config.warnings;

        if (util.isObject(warningsOption)) {
            if ("wForgottenReturn" in warningsOption) {
                wForgottenReturn = !!warningsOption.wForgottenReturn;
            }
        }
    }
    if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
        if (async.haveItemsQueued()) {
            throw new Error(
                "cannot enable cancellation after promises are in use");
        }
        Promise.prototype._clearCancellationData =
            cancellationClearCancellationData;
        Promise.prototype._propagateFrom = cancellationPropagateFrom;
        Promise.prototype._onCancel = cancellationOnCancel;
        Promise.prototype._setOnCancel = cancellationSetOnCancel;
        Promise.prototype._attachCancellationCallback =
            cancellationAttachCancellationCallback;
        Promise.prototype._execute = cancellationExecute;
        propagateFromFunction = cancellationPropagateFrom;
        config.cancellation = true;
    }
    if ("monitoring" in opts) {
        if (opts.monitoring && !config.monitoring) {
            config.monitoring = true;
            Promise.prototype._fireEvent = activeFireEvent;
        } else if (!opts.monitoring && config.monitoring) {
            config.monitoring = false;
            Promise.prototype._fireEvent = defaultFireEvent;
        }
    }
};

function defaultFireEvent() { return false; }

Promise.prototype._fireEvent = defaultFireEvent;
Promise.prototype._execute = function(executor, resolve, reject) {
    try {
        executor(resolve, reject);
    } catch (e) {
        return e;
    }
};
Promise.prototype._onCancel = function () {};
Promise.prototype._setOnCancel = function (handler) { ; };
Promise.prototype._attachCancellationCallback = function(onCancel) {
    ;
};
Promise.prototype._captureStackTrace = function () {};
Promise.prototype._attachExtraTrace = function () {};
Promise.prototype._clearCancellationData = function() {};
Promise.prototype._propagateFrom = function (parent, flags) {
    ;
    ;
};

function cancellationExecute(executor, resolve, reject) {
    var promise = this;
    try {
        executor(resolve, reject, function(onCancel) {
            if (typeof onCancel !== "function") {
                throw new TypeError("onCancel must be a function, got: " +
                                    util.toString(onCancel));
            }
            promise._attachCancellationCallback(onCancel);
        });
    } catch (e) {
        return e;
    }
}

function cancellationAttachCancellationCallback(onCancel) {
    if (!this.isCancellable()) return this;

    var previousOnCancel = this._onCancel();
    if (previousOnCancel !== undefined) {
        if (util.isArray(previousOnCancel)) {
            previousOnCancel.push(onCancel);
        } else {
            this._setOnCancel([previousOnCancel, onCancel]);
        }
    } else {
        this._setOnCancel(onCancel);
    }
}

function cancellationOnCancel() {
    return this._onCancelField;
}

function cancellationSetOnCancel(onCancel) {
    this._onCancelField = onCancel;
}

function cancellationClearCancellationData() {
    this._cancellationParent = undefined;
    this._onCancelField = undefined;
}

function cancellationPropagateFrom(parent, flags) {
    if ((flags & 1) !== 0) {
        this._cancellationParent = parent;
        var branchesRemainingToCancel = parent._branchesRemainingToCancel;
        if (branchesRemainingToCancel === undefined) {
            branchesRemainingToCancel = 0;
        }
        parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
    }
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}

function bindingPropagateFrom(parent, flags) {
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}
var propagateFromFunction = bindingPropagateFrom;

function boundValueFunction() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
}

function longStackTracesCaptureStackTrace() {
    this._trace = new CapturedTrace(this._peekContext());
}

function longStackTracesAttachExtraTrace(error, ignoreSelf) {
    if (canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
}

function checkForgottenReturns(returnValue, promiseCreated, name, promise,
                               parent) {
    if (returnValue === undefined && promiseCreated !== null &&
        wForgottenReturn) {
        if (parent !== undefined && parent._returnedNonUndefined()) return;

        if (name) name = name + " ";
        var msg = "a promise was created in a " + name +
            "handler but was not returned from it";
        promise._warn(msg, true, promiseCreated);
    }
}

function deprecated(name, replacement) {
    var message = name +
        " is deprecated and will be removed in a future version.";
    if (replacement) message += " Use " + replacement + " instead.";
    return warn(message);
}

function warn(message, shouldUseOwnTrace, promise) {
    if (!config.warnings) return;
    var warning = new Warning(message);
    var ctx;
    if (shouldUseOwnTrace) {
        promise._attachExtraTrace(warning);
    } else if (config.longStackTraces && (ctx = Promise._peekContext())) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }

    if (!activeFireEvent("warning", warning)) {
        formatAndLogError(warning, "", true);
    }
}

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = "    (No stack trace)" === line ||
            stackFramePattern.test(line);
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0) {
        stack = stack.slice(i);
    }
    return stack;
}

function parseStackAndMessage(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: cleanStack(stack)
    };
}

function formatAndLogError(error, title, isSoft) {
    if (typeof console !== "undefined") {
        var message;
        if (util.isObject(error)) {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof printWarning === "function") {
            printWarning(message, isSoft);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
}

function fireRejectionEvent(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    if (name === "unhandledRejection") {
        if (!activeFireEvent(name, reason, promise) && !localEventFired) {
            formatAndLogError(reason, "Unhandled rejection ");
        }
    } else {
        activeFireEvent(name, promise);
    }
}

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj && typeof obj.toString === "function"
            ? obj.toString() : util.toString(obj);
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

function longStackTracesIsSupported() {
    return typeof captureStackTrace === "function";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}

function setBounds(firstLineError, lastLineError) {
    if (!longStackTracesIsSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
}

function CapturedTrace(parent) {
    this._parent = parent;
    this._promisesCreated = 0;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);
Context.CapturedTrace = CapturedTrace;

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit += 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit += 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit -= 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit += 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit -= 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    printWarning = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        printWarning = function(message, isSoft) {
            var color = isSoft ? "\u001b[33m" : "\u001b[31m";
            console.warn(color + message + "\u001b[0m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        printWarning = function(message, isSoft) {
            console.warn("%c" + message,
                        isSoft ? "color: darkorange" : "color: red");
        };
    }
}

var config = {
    warnings: warnings,
    longStackTraces: false,
    cancellation: false,
    monitoring: false
};

if (longStackTraces) Promise.longStackTraces();

return {
    longStackTraces: function() {
        return config.longStackTraces;
    },
    warnings: function() {
        return config.warnings;
    },
    cancellation: function() {
        return config.cancellation;
    },
    monitoring: function() {
        return config.monitoring;
    },
    propagateFromFunction: function() {
        return propagateFromFunction;
    },
    boundValueFunction: function() {
        return boundValueFunction;
    },
    checkForgottenReturns: checkForgottenReturns,
    setBounds: setBounds,
    warn: warn,
    deprecated: deprecated,
    CapturedTrace: CapturedTrace,
    fireDomEvent: fireDomEvent,
    fireGlobalEvent: fireGlobalEvent
};
};

},{"./errors":36,"./util":60}],34:[function(require,module,exports){
"use strict";
module.exports = function(Promise) {
function returner() {
    return this.value;
}
function thrower() {
    throw this.reason;
}

Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value instanceof Promise) value.suppressUnhandledRejections();
    return this._then(
        returner, undefined, undefined, {value: value}, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    return this._then(
        thrower, undefined, undefined, {reason: reason}, undefined);
};

Promise.prototype.catchThrow = function (reason) {
    if (arguments.length <= 1) {
        return this._then(
            undefined, thrower, undefined, {reason: reason}, undefined);
    } else {
        var _reason = arguments[1];
        var handler = function() {throw _reason;};
        return this.caught(reason, handler);
    }
};

Promise.prototype.catchReturn = function (value) {
    if (arguments.length <= 1) {
        if (value instanceof Promise) value.suppressUnhandledRejections();
        return this._then(
            undefined, returner, undefined, {value: value}, undefined);
    } else {
        var _value = arguments[1];
        if (_value instanceof Promise) _value.suppressUnhandledRejections();
        var handler = function() {return _value;};
        return this.caught(value, handler);
    }
};
};

},{}],35:[function(require,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;
var PromiseAll = Promise.all;

function promiseAllThis() {
    return PromiseAll(this);
}

function PromiseMapSeries(promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
}

Promise.prototype.each = function (fn) {
    return this.mapSeries(fn)
            ._then(promiseAllThis, undefined, undefined, this, undefined);
};

Promise.prototype.mapSeries = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseMapSeries(promises, fn)
            ._then(promiseAllThis, undefined, undefined, promises, undefined);
};

Promise.mapSeries = PromiseMapSeries;
};

},{}],36:[function(require,module,exports){
"use strict";
var es5 = require("./es5");
var Objectfreeze = es5.freeze;
var util = require("./util");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    es5.defineProperty(Error, "__BluebirdErrorTypes__", {
        value: errorTypes,
        writable: false,
        enumerable: false,
        configurable: false
    });
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5":37,"./util":60}],37:[function(require,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],38:[function(require,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],39:[function(require,module,exports){
"use strict";
module.exports = function(Promise, tryConvertToPromise) {
var util = require("./util");
var CancellationError = Promise.CancellationError;
var errorObj = util.errorObj;

function PassThroughHandlerContext(promise, type, handler) {
    this.promise = promise;
    this.type = type;
    this.handler = handler;
    this.called = false;
    this.cancelPromise = null;
}

PassThroughHandlerContext.prototype.isFinallyHandler = function() {
    return this.type === 0;
};

function FinallyHandlerCancelReaction(finallyHandler) {
    this.finallyHandler = finallyHandler;
}

FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
    checkCancel(this.finallyHandler);
};

function checkCancel(ctx, reason) {
    if (ctx.cancelPromise != null) {
        if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
        } else {
            ctx.cancelPromise._cancel();
        }
        ctx.cancelPromise = null;
        return true;
    }
    return false;
}

function succeed() {
    return finallyHandler.call(this, this.promise._target()._settledValue());
}
function fail(reason) {
    if (checkCancel(this, reason)) return;
    errorObj.e = reason;
    return errorObj;
}
function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    if (!this.called) {
        this.called = true;
        var ret = this.isFinallyHandler()
            ? handler.call(promise._boundValue())
            : handler.call(promise._boundValue(), reasonOrValue);
        if (ret !== undefined) {
            promise._setReturnedNonUndefined();
            var maybePromise = tryConvertToPromise(ret, promise);
            if (maybePromise instanceof Promise) {
                if (this.cancelPromise != null) {
                    if (maybePromise.isCancelled()) {
                        var reason =
                            new CancellationError("late cancellation observer");
                        promise._attachExtraTrace(reason);
                        errorObj.e = reason;
                        return errorObj;
                    } else if (maybePromise.isPending()) {
                        maybePromise._attachCancellationCallback(
                            new FinallyHandlerCancelReaction(this));
                    }
                }
                return maybePromise._then(
                    succeed, fail, undefined, this, undefined);
            }
        }
    }

    if (promise.isRejected()) {
        checkCancel(this);
        errorObj.e = reasonOrValue;
        return errorObj;
    } else {
        checkCancel(this);
        return reasonOrValue;
    }
}

Promise.prototype._passThrough = function(handler, type, success, fail) {
    if (typeof handler !== "function") return this.then();
    return this._then(success,
                      fail,
                      undefined,
                      new PassThroughHandlerContext(this, type, handler),
                      undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThrough(handler,
                             0,
                             finallyHandler,
                             finallyHandler);
};

Promise.prototype.tap = function (handler) {
    return this._passThrough(handler, 1, finallyHandler);
};

return PassThroughHandlerContext;
};

},{"./util":60}],40:[function(require,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise,
                          Proxyable,
                          debug) {
var errors = require("./errors");
var TypeError = errors.TypeError;
var util = require("./util");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    var promise = this._promise = new Promise(INTERNAL);
    promise._captureStackTrace();
    promise._setOnCancel(this);
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
    this._yieldedPromise = null;
}
util.inherits(PromiseSpawn, Proxyable);

PromiseSpawn.prototype._isResolved = function() {
    return this._promise === null;
};

PromiseSpawn.prototype._cleanup = function() {
    this._promise = this._generator = null;
};

PromiseSpawn.prototype._promiseCancelled = function() {
    if (this._isResolved()) return;
    var implementsReturn = typeof this._generator["return"] !== "undefined";

    var result;
    if (!implementsReturn) {
        var reason = new Promise.CancellationError(
            "generator .return() sentinel");
        Promise.coroutine.returnSentinel = reason;
        this._promise._attachExtraTrace(reason);
        this._promise._pushContext();
        result = tryCatch(this._generator["throw"]).call(this._generator,
                                                         reason);
        this._promise._popContext();
        if (result === errorObj && result.e === reason) {
            result = null;
        }
    } else {
        this._promise._pushContext();
        result = tryCatch(this._generator["return"]).call(this._generator,
                                                          undefined);
        this._promise._popContext();
    }
    var promise = this._promise;
    this._cleanup();
    if (result === errorObj) {
        promise._rejectCallback(result.e, false);
    } else {
        promise.cancel();
    }
};

PromiseSpawn.prototype._promiseFulfilled = function(value) {
    this._yieldedPromise = null;
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._promiseRejected = function(reason) {
    this._yieldedPromise = null;
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._resultCancelled = function() {
    if (this._yieldedPromise instanceof Promise) {
        var promise = this._yieldedPromise;
        this._yieldedPromise = null;
        promise.cancel();
    }
};

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._promiseFulfilled(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    var promise = this._promise;
    if (result === errorObj) {
        this._cleanup();
        return promise._rejectCallback(result.e, false);
    }

    var value = result.value;
    if (result.done === true) {
        this._cleanup();
        return promise._resolveCallback(value);
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._promiseRejected(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise = maybePromise._target();
        var bitField = maybePromise._bitField;
        ;
        if (((bitField & 50397184) === 0)) {
            this._yieldedPromise = maybePromise;
            maybePromise._proxy(this, null);
        } else if (((bitField & 33554432) !== 0)) {
            this._promiseFulfilled(maybePromise._value());
        } else if (((bitField & 16777216) !== 0)) {
            this._promiseRejected(maybePromise._reason());
        } else {
            this._promiseCancelled();
        }
    }
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        var ret = spawn.promise();
        spawn._generator = generator;
        spawn._promiseFulfilled(undefined);
        return ret;
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    debug.deprecated("Promise.spawn()", "Promise.coroutine()");
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors":36,"./util":60}],41:[function(require,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = require("./util");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!false) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var promiseSetter = function(i) {
        return new Function("promise", "holder", "                           \n\
            'use strict';                                                    \n\
            holder.pIndex = promise;                                         \n\
            ".replace(/Index/g, i));
    };

    var generateHolderClass = function(total) {
        var props = new Array(total);
        for (var i = 0; i < props.length; ++i) {
            props[i] = "this.p" + (i+1);
        }
        var assignment = props.join(" = ") + " = null;";
        var cancellationCode= "var promise;\n" + props.map(function(prop) {
            return "                                                         \n\
                promise = " + prop + ";                                      \n\
                if (promise instanceof Promise) {                            \n\
                    promise.cancel();                                        \n\
                }                                                            \n\
            ";
        }).join("\n");
        var passedArguments = props.join(", ");
        var name = "Holder$" + total;


        var code = "return function(tryCatch, errorObj, Promise) {           \n\
            'use strict';                                                    \n\
            function [TheName](fn) {                                         \n\
                [TheProperties]                                              \n\
                this.fn = fn;                                                \n\
                this.now = 0;                                                \n\
            }                                                                \n\
            [TheName].prototype.checkFulfillment = function(promise) {       \n\
                var now = ++this.now;                                        \n\
                if (now === [TheTotal]) {                                    \n\
                    promise._pushContext();                                  \n\
                    var callback = this.fn;                                  \n\
                    var ret = tryCatch(callback)([ThePassedArguments]);      \n\
                    promise._popContext();                                   \n\
                    if (ret === errorObj) {                                  \n\
                        promise._rejectCallback(ret.e, false);               \n\
                    } else {                                                 \n\
                        promise._resolveCallback(ret);                       \n\
                    }                                                        \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype._resultCancelled = function() {              \n\
                [CancellationCode]                                           \n\
            };                                                               \n\
                                                                             \n\
            return [TheName];                                                \n\
        }(tryCatch, errorObj, Promise);                                      \n\
        ";

        code = code.replace(/\[TheName\]/g, name)
            .replace(/\[TheTotal\]/g, total)
            .replace(/\[ThePassedArguments\]/g, passedArguments)
            .replace(/\[TheProperties\]/g, assignment)
            .replace(/\[CancellationCode\]/g, cancellationCode);

        return new Function("tryCatch", "errorObj", "Promise", code)
                           (tryCatch, errorObj, Promise);
    };

    var holderClasses = [];
    var thenCallbacks = [];
    var promiseSetters = [];

    for (var i = 0; i < 8; ++i) {
        holderClasses.push(generateHolderClass(i + 1));
        thenCallbacks.push(thenCallback(i + 1));
        promiseSetters.push(promiseSetter(i + 1));
    }

    reject = function (reason) {
        this._reject(reason);
    };
}}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!false) {
            if (last <= 8 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var HolderClass = holderClasses[last - 1];
                var holder = new HolderClass(fn);
                var callbacks = thenCallbacks;

                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        var bitField = maybePromise._bitField;
                        ;
                        if (((bitField & 50397184) === 0)) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                            promiseSetters[i](maybePromise, holder);
                        } else if (((bitField & 33554432) !== 0)) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else if (((bitField & 16777216) !== 0)) {
                            ret._reject(maybePromise._reason());
                        } else {
                            ret._cancel();
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }
                if (!ret._isFateSealed()) {
                    ret._setAsyncGuaranteed();
                    ret._setOnCancel(holder);
                }
                return ret;
            }
        }
    }
    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];};
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util":60}],42:[function(require,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = require("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    this._init$(undefined, -2);
}
util.inherits(MappingPromiseArray, PromiseArray);

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;

    if (index < 0) {
        index = (index * -1) - 1;
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return true;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return false;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var promise = this._promise;
        var callback = this._callback;
        var receiver = promise._boundValue();
        promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        var promiseCreated = promise._popContext();
        debug.checkForgottenReturns(
            ret,
            promiseCreated,
            preservedValues !== null ? "Promise.filter" : "Promise.map",
            promise
        );
        if (ret === errorObj) {
            this._reject(ret.e);
            return true;
        }

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            var bitField = maybePromise._bitField;
            ;
            if (((bitField & 50397184) === 0)) {
                if (limit >= 1) this._inFlight++;
                values[index] = maybePromise;
                maybePromise._proxy(this, (index + 1) * -1);
                return false;
            } else if (((bitField & 33554432) !== 0)) {
                ret = maybePromise._value();
            } else if (((bitField & 16777216) !== 0)) {
                this._reject(maybePromise._reason());
                return true;
            } else {
                this._cancel();
                return true;
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }
        return true;
    }
    return false;
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var limit = typeof options === "object" && options !== null
        ? options.concurrency
        : 0;
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter).promise();
}

Promise.prototype.map = function (fn, options) {
    return map(this, fn, options, null);
};

Promise.map = function (promises, fn, options, _filter) {
    return map(promises, fn, options, _filter);
};


};

},{"./util":60}],43:[function(require,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
var util = require("./util");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        var promiseCreated = ret._popContext();
        debug.checkForgottenReturns(
            value, promiseCreated, "Promise.method", ret);
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value;
    if (arguments.length > 1) {
        debug.deprecated("calling Promise.try with more than 1 argument");
        var arg = arguments[1];
        var ctx = arguments[2];
        value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg)
                                  : tryCatch(fn).call(ctx, arg);
    } else {
        value = tryCatch(fn)();
    }
    var promiseCreated = ret._popContext();
    debug.checkForgottenReturns(
        value, promiseCreated, "Promise.try", ret);
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util":60}],44:[function(require,module,exports){
"use strict";
var util = require("./util");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = require("./errors");
var OperationalError = errors.OperationalError;
var es5 = require("./es5");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise, multiArgs) {
    return function(err, value) {
        if (promise === null) return;
        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (!multiArgs) {
            promise._fulfill(value);
        } else {
            var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];};
            promise._fulfill(args);
        }
        promise = null;
    };
}

module.exports = nodebackForPromise;

},{"./errors":36,"./es5":37,"./util":60}],45:[function(require,module,exports){
"use strict";
module.exports = function(Promise) {
var util = require("./util");
var async = Promise._async;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var newReason = new Error(reason + "");
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback = Promise.prototype.nodeify = function (nodeback,
                                                                     options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./util":60}],46:[function(require,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var reflectHandler = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
function Proxyable() {}
var UNDEFINED_BINDING = {};
var util = require("./util");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var es5 = require("./es5");
var Async = require("./async");
var async = new Async();
es5.defineProperty(Promise, "_async", {value: async});
var errors = require("./errors");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
var CancellationError = Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {};
var tryConvertToPromise = require("./thenables")(Promise, INTERNAL);
var PromiseArray =
    require("./promise_array")(Promise, INTERNAL,
                               tryConvertToPromise, apiRejection, Proxyable);
var Context = require("./context")(Promise);
 /*jshint unused:false*/
var createContext = Context.create;
var debug = require("./debuggability")(Promise, Context);
var CapturedTrace = debug.CapturedTrace;
var PassThroughHandlerContext =
    require("./finally")(Promise, tryConvertToPromise);
var catchFilter = require("./catch_filter")(NEXT_FILTER);
var nodebackForPromise = require("./nodeback");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function check(self, executor) {
    if (typeof executor !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(executor));
    }
    if (self.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
}

function Promise(executor) {
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    if (executor !== INTERNAL) {
        check(this, executor);
        this._resolveFromExecutor(executor);
    }
    this._promiseCreated();
    this._fireEvent("promiseCreated", this);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return apiRejection("expecting an object but got " + util.classString(item));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        return this.then(undefined, catchFilter(catchInstances, fn, this));
    }
    return this.then(undefined, fn);
};

Promise.prototype.reflect = function () {
    return this._then(reflectHandler,
        reflectHandler, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject) {
    if (debug.warnings() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, undefined, undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject) {
    var promise =
        this._then(didFulfill, didReject, undefined, undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    return this.all()._then(fn, undefined, undefined, APPLY, undefined);
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    if (arguments.length > 0) {
        this._warn(".all() was passed arguments but it does not take any");
    }
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = Promise.fromCallback = function(fn) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs
                                         : false;
    var result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true);
    }
    if (!ret._isFateSealed()) ret._setAsyncGuaranteed();
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._setFulfilled();
        ret._rejectionHandler0 = obj;
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    var prev = async._schedule;
    async._schedule = fn;
    return prev;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    _,    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var promise = haveInternalData ? internalData : new Promise(INTERNAL);
    var target = this._target();
    var bitField = target._bitField;

    if (!haveInternalData) {
        promise._propagateFrom(this, 3);
        promise._captureStackTrace();
        if (receiver === undefined &&
            ((this._bitField & 2097152) !== 0)) {
            if (!((bitField & 50397184) === 0)) {
                receiver = this._boundValue();
            } else {
                receiver = target === this ? undefined : this._boundTo;
            }
        }
        this._fireEvent("promiseChained", this, promise);
    }

    var domain = getDomain();
    if (!((bitField & 50397184) === 0)) {
        var handler, value, settler = target._settlePromiseCtx;
        if (((bitField & 33554432) !== 0)) {
            value = target._rejectionHandler0;
            handler = didFulfill;
        } else if (((bitField & 16777216) !== 0)) {
            value = target._fulfillmentHandler0;
            handler = didReject;
            target._unsetRejectionIsUnhandled();
        } else {
            settler = target._settlePromiseLateCancellationObserver;
            value = new CancellationError("late cancellation observer");
            target._attachExtraTrace(value);
            handler = didReject;
        }

        async.invoke(settler, target, {
            handler: domain === null ? handler
                : (typeof handler === "function" && domain.bind(handler)),
            promise: promise,
            receiver: receiver,
            value: value
        });
    } else {
        target._addCallbacks(didFulfill, didReject, promise, receiver, domain);
    }

    return promise;
};

Promise.prototype._length = function () {
    return this._bitField & 65535;
};

Promise.prototype._isFateSealed = function () {
    return (this._bitField & 117506048) !== 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 67108864) === 67108864;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -65536) |
        (len & 65535);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 33554432;
    this._fireEvent("promiseFulfilled", this);
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 16777216;
    this._fireEvent("promiseRejected", this);
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 67108864;
    this._fireEvent("promiseResolved", this);
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._unsetCancelled = function() {
    this._bitField = this._bitField & (~65536);
};

Promise.prototype._setCancelled = function() {
    this._bitField = this._bitField | 65536;
    this._fireEvent("promiseCancelled", this);
};

Promise.prototype._setAsyncGuaranteed = function() {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0 ? this._receiver0 : this[
            index * 4 - 4 + 3];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return this[
            index * 4 - 4 + 2];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 1];
};

Promise.prototype._boundValue = function() {};

Promise.prototype._migrateCallback0 = function (follower) {
    var bitField = follower._bitField;
    var fulfill = follower._fulfillmentHandler0;
    var reject = follower._rejectionHandler0;
    var promise = follower._promise0;
    var receiver = follower._receiverAt(0);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._migrateCallbackAt = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 65535 - 4) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        this._receiver0 = receiver;
        if (typeof fulfill === "function") {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : domain.bind(reject);
        }
    } else {
        var base = index * 4 - 4;
        this[base + 2] = promise;
        this[base + 3] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : domain.bind(reject);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._proxy = function (proxyable, arg) {
    this._addCallbacks(undefined, undefined, arg, proxyable, null);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (((this._bitField & 117506048) !== 0)) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    if (shouldBind) this._propagateFrom(maybePromise, 2);

    var promise = maybePromise._target();
    var bitField = promise._bitField;
    if (((bitField & 50397184) === 0)) {
        var len = this._length();
        if (len > 0) promise._migrateCallback0(this);
        for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (((bitField & 33554432) !== 0)) {
        this._fulfill(promise._value());
    } else if (((bitField & 16777216) !== 0)) {
        this._reject(promise._reason());
    } else {
        var reason = new CancellationError("late cancellation observer");
        promise._attachExtraTrace(reason);
        this._reject(reason);
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, ignoreNonErrorWarnings) {
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
        var message = "a promise was rejected with a non-error: " +
            util.classString(reason);
        this._warn(message, true);
    }
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason);
};

Promise.prototype._resolveFromExecutor = function (executor) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = this._execute(executor, function(value) {
        promise._resolveCallback(value);
    }, function (reason) {
        promise._rejectCallback(reason, synchronous);
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined) {
        promise._rejectCallback(r, true);
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    var bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY) {
        if (!value || typeof value.length !== "number") {
            x = errorObj;
            x.e = new TypeError("cannot .spread() a non-array: " +
                                    util.classString(value));
        } else {
            x = tryCatch(handler).apply(this._boundValue(), value);
        }
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    var promiseCreated = promise._popContext();
    bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;

    if (x === NEXT_FILTER) {
        promise._reject(value);
    } else if (x === errorObj || x === promise) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false);
    } else {
        debug.checkForgottenReturns(x, promiseCreated, "",  promise, this);
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
    var isPromise = promise instanceof Promise;
    var bitField = this._bitField;
    var asyncGuaranteed = ((bitField & 134217728) !== 0);
    if (((bitField & 65536) !== 0)) {
        if (isPromise) promise._invokeInternalOnCancel();

        if (receiver instanceof PassThroughHandlerContext &&
            receiver.isFinallyHandler()) {
            receiver.cancelPromise = promise;
            if (tryCatch(handler).call(receiver, value) === errorObj) {
                promise._reject(errorObj.e);
            }
        } else if (handler === reflectHandler) {
            promise._fulfill(reflectHandler.call(receiver));
        } else if (receiver instanceof Proxyable) {
            receiver._promiseCancelled(promise);
        } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
        } else {
            receiver.cancel();
        }
    } else if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            if (asyncGuaranteed) promise._setAsyncGuaranteed();
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof Proxyable) {
        if (!receiver._isResolved()) {
            if (((bitField & 33554432) !== 0)) {
                receiver._promiseFulfilled(value, promise);
            } else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (asyncGuaranteed) promise._setAsyncGuaranteed();
        if (((bitField & 33554432) !== 0)) {
            promise._fulfill(value);
        } else {
            promise._reject(value);
        }
    }
};

Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
    var handler = ctx.handler;
    var promise = ctx.promise;
    var receiver = ctx.receiver;
    var value = ctx.value;
    if (typeof handler === "function") {
        if (!(promise instanceof Promise)) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (promise instanceof Promise) {
        promise._reject(value);
    }
};

Promise.prototype._settlePromiseCtx = function(ctx) {
    this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
};

Promise.prototype._settlePromise0 = function(handler, value, bitField) {
    var promise = this._promise0;
    var receiver = this._receiverAt(0);
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settlePromise(promise, handler, receiver, value);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    var base = index * 4 - 4;
    this[base + 2] =
    this[base + 3] =
    this[base + 0] =
    this[base + 1] = undefined;
};

Promise.prototype._fulfill = function (value) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._reject(err);
    }
    this._setFulfilled();
    this._rejectionHandler0 = value;

    if ((bitField & 65535) > 0) {
        if (((bitField & 134217728) !== 0)) {
            this._settlePromises();
        } else {
            async.settlePromises(this);
        }
    }
};

Promise.prototype._reject = function (reason) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    this._setRejected();
    this._fulfillmentHandler0 = reason;

    if (this._isFinal()) {
        return async.fatalError(reason, util.isNode);
    }

    if ((bitField & 65535) > 0) {
        if (((bitField & 134217728) !== 0)) {
            this._settlePromises();
        } else {
            async.settlePromises(this);
        }
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._fulfillPromises = function (len, value) {
    for (var i = 1; i < len; i++) {
        var handler = this._fulfillmentHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, value);
    }
};

Promise.prototype._rejectPromises = function (len, reason) {
    for (var i = 1; i < len; i++) {
        var handler = this._rejectionHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, reason);
    }
};

Promise.prototype._settlePromises = function () {
    var bitField = this._bitField;
    var len = (bitField & 65535);

    if (len > 0) {
        if (((bitField & 16842752) !== 0)) {
            var reason = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, reason, bitField);
            this._rejectPromises(len, reason);
        } else {
            var value = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, value, bitField);
            this._fulfillPromises(len, value);
        }
        this._setLength(0);
    }
    this._clearCancellationData();
};

Promise.prototype._settledValue = function() {
    var bitField = this._bitField;
    if (((bitField & 33554432) !== 0)) {
        return this._rejectionHandler0;
    } else if (((bitField & 16777216) !== 0)) {
        return this._fulfillmentHandler0;
    }
};

function deferResolve(v) {this.promise._resolveCallback(v);}
function deferReject(v) {this.promise._rejectCallback(v, false);}

Promise.defer = Promise.pending = function() {
    debug.deprecated("Promise.defer", "new Promise");
    var promise = new Promise(INTERNAL);
    return {
        promise: promise,
        resolve: deferResolve,
        reject: deferReject
    };
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

require("./method")(Promise, INTERNAL, tryConvertToPromise, apiRejection,
    debug);
require("./bind")(Promise, INTERNAL, tryConvertToPromise, debug);
require("./cancel")(Promise, PromiseArray, apiRejection, debug);
require("./direct_resolve")(Promise);
require("./synchronous_inspection")(Promise);
require("./join")(
    Promise, PromiseArray, tryConvertToPromise, INTERNAL, debug);
Promise.Promise = Promise;
require('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
require('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
require('./timers.js')(Promise, INTERNAL, debug);
require('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
require('./nodeify.js')(Promise);
require('./call_get.js')(Promise);
require('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
require('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
require('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
require('./settle.js')(Promise, PromiseArray, debug);
require('./some.js')(Promise, PromiseArray, apiRejection);
require('./promisify.js')(Promise, INTERNAL);
require('./any.js')(Promise);
require('./each.js')(Promise, INTERNAL);
require('./filter.js')(Promise, INTERNAL);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    debug.setBounds(Async.firstLineError, util.lastLineError);               
    return Promise;                                                          

};

},{"./any.js":25,"./async":26,"./bind":27,"./call_get.js":29,"./cancel":30,"./catch_filter":31,"./context":32,"./debuggability":33,"./direct_resolve":34,"./each.js":35,"./errors":36,"./es5":37,"./filter.js":38,"./finally":39,"./generators.js":40,"./join":41,"./map.js":42,"./method":43,"./nodeback":44,"./nodeify.js":45,"./promise_array":47,"./promisify.js":48,"./props.js":49,"./race.js":51,"./reduce.js":52,"./settle.js":54,"./some.js":55,"./synchronous_inspection":56,"./thenables":57,"./timers.js":58,"./using.js":59,"./util":60}],47:[function(require,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection, Proxyable) {
var util = require("./util");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    if (values instanceof Promise) {
        promise._propagateFrom(values, 3);
    }
    promise._setOnCancel(this);
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
util.inherits(PromiseArray, Proxyable);

PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        var bitField = values._bitField;
        ;
        this._values = values;

        if (((bitField & 50397184) === 0)) {
            this._promise._setAsyncGuaranteed();
            return values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
        } else if (((bitField & 33554432) !== 0)) {
            values = values._value();
        } else if (((bitField & 16777216) !== 0)) {
            return this._reject(values._reason());
        } else {
            return this._cancel();
        }
    }
    values = util.asArray(values);
    if (values === null) {
        var err = apiRejection(
            "expecting an array or an iterable object but got " + util.classString(values)).reason();
        this._promise._rejectCallback(err, false);
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    this._iterate(values);
};

PromiseArray.prototype._iterate = function(values) {
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var result = this._promise;
    var isResolved = false;
    var bitField = null;
    for (var i = 0; i < len; ++i) {
        var maybePromise = tryConvertToPromise(values[i], result);

        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
        } else {
            bitField = null;
        }

        if (isResolved) {
            if (bitField !== null) {
                maybePromise.suppressUnhandledRejections();
            }
        } else if (bitField !== null) {
            if (((bitField & 50397184) === 0)) {
                maybePromise._proxy(this, i);
                this._values[i] = maybePromise;
            } else if (((bitField & 33554432) !== 0)) {
                isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if (((bitField & 16777216) !== 0)) {
                isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
                isResolved = this._promiseCancelled(i);
            }
        } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
        }
    }
    if (!isResolved) result._setAsyncGuaranteed();
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype._cancel = function() {
    if (this._isResolved() || !this._promise.isCancellable()) return;
    this._values = null;
    this._promise._cancel();
};

PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false);
};

PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

PromiseArray.prototype._promiseCancelled = function() {
    this._cancel();
    return true;
};

PromiseArray.prototype._promiseRejected = function (reason) {
    this._totalResolved++;
    this._reject(reason);
    return true;
};

PromiseArray.prototype._resultCancelled = function() {
    if (this._isResolved()) return;
    var values = this._values;
    this._cancel();
    if (values instanceof Promise) {
        values.cancel();
    } else {
        for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise) {
                values[i].cancel();
            }
        }
    }
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util":60}],48:[function(require,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = require("./util");
var nodebackForPromise = require("./nodeback");
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = require("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/MqrFmX\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!false) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn, _, multiArgs) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";
    var body = "'use strict';                                                \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode);
    body = body.replace("Parameters", parameterDeclaration(newParameterCount));
    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL",
                        body)(
                    Promise,
                    fn,
                    receiver,
                    withAppended,
                    maybeWrapAsError,
                    nodebackForPromise,
                    util.tryCatch,
                    util.errorObj,
                    util.notEnumerableProp,
                    INTERNAL);
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise, multiArgs);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        if (!promise._isFateSealed()) promise._setAsyncGuaranteed();
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] =
                makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
        } else {
            var promisified = promisifier(fn, function() {
                return makeNodePromisified(key, THIS, key,
                                           fn, suffix, multiArgs);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
        }
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver, multiArgs) {
    return makeNodePromisified(callback, receiver, undefined,
                                callback, null, multiArgs);
}

Promise.promisify = function (fn, options) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    if (isPromisified(fn)) {
        return fn;
    }
    options = Object(options);
    var receiver = options.context === undefined ? THIS : options.context;
    var multiArgs = !!options.multiArgs;
    var ret = promisify(fn, receiver, multiArgs);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    options = Object(options);
    var multiArgs = !!options.multiArgs;
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier,
                multiArgs);
            promisifyAll(value, suffix, filter, promisifier, multiArgs);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier, multiArgs);
};
};


},{"./errors":36,"./nodeback":44,"./util":60}],49:[function(require,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = require("./util");
var isObject = util.isObject;
var es5 = require("./es5");
var Es6Map;
if (typeof Map === "function") Es6Map = Map;

var mapToEntries = (function() {
    var index = 0;
    var size = 0;

    function extractEntry(value, key) {
        this[index] = value;
        this[index + size] = key;
        index++;
    }

    return function mapToEntries(map) {
        size = map.size;
        index = 0;
        var ret = new Array(map.size * 2);
        map.forEach(extractEntry, ret);
        return ret;
    };
})();

var entriesToMap = function(entries) {
    var ret = new Es6Map();
    var length = entries.length / 2 | 0;
    for (var i = 0; i < length; ++i) {
        var key = entries[length + i];
        var value = entries[i];
        ret.set(key, value);
    }
    return ret;
};

function PropertiesPromiseArray(obj) {
    var isMap = false;
    var entries;
    if (Es6Map !== undefined && obj instanceof Es6Map) {
        entries = mapToEntries(obj);
        isMap = true;
    } else {
        var keys = es5.keys(obj);
        var len = keys.length;
        entries = new Array(len * 2);
        for (var i = 0; i < len; ++i) {
            var key = keys[i];
            entries[i] = obj[key];
            entries[i + len] = key;
        }
    }
    this.constructor$(entries);
    this._isMap = isMap;
    this._init$(undefined, -3);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val;
        if (this._isMap) {
            val = entriesToMap(this._values);
        } else {
            val = {};
            var keyOffset = this.length();
            for (var i = 0, len = this.length(); i < len; ++i) {
                val[this._values[i + keyOffset]] = this._values[i];
            }
        }
        this._resolve(val);
        return true;
    }
    return false;
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 2);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5":37,"./util":60}],50:[function(require,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],51:[function(require,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = require("./util");

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else {
        promises = util.asArray(promises);
        if (promises === null)
            return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 3);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util":60}],52:[function(require,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = require("./util");
var tryCatch = util.tryCatch;

function ReductionPromiseArray(promises, fn, initialValue, _each) {
    this.constructor$(promises);
    var domain = getDomain();
    this._fn = domain === null ? fn : domain.bind(fn);
    if (initialValue !== undefined) {
        initialValue = Promise.resolve(initialValue);
        initialValue._attachCancellationCallback(this);
    }
    this._initialValue = initialValue;
    this._currentCancellable = null;
    this._eachValues = _each === INTERNAL ? [] : undefined;
    this._promise._captureStackTrace();
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._gotAccum = function(accum) {
    if (this._eachValues !== undefined && accum !== INTERNAL) {
        this._eachValues.push(accum);
    }
};

ReductionPromiseArray.prototype._eachComplete = function(value) {
    this._eachValues.push(value);
    return this._eachValues;
};

ReductionPromiseArray.prototype._init = function() {};

ReductionPromiseArray.prototype._resolveEmptyArray = function() {
    this._resolve(this._eachValues !== undefined ? this._eachValues
                                                 : this._initialValue);
};

ReductionPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

ReductionPromiseArray.prototype._resolve = function(value) {
    this._promise._resolveCallback(value);
    this._values = null;
};

ReductionPromiseArray.prototype._resultCancelled = function(sender) {
    if (sender === this._initialValue) return this._cancel();
    if (this._isResolved()) return;
    this._resultCancelled$();
    if (this._currentCancellable instanceof Promise) {
        this._currentCancellable.cancel();
    }
    if (this._initialValue instanceof Promise) {
        this._initialValue.cancel();
    }
};

ReductionPromiseArray.prototype._iterate = function (values) {
    this._values = values;
    var value;
    var i;
    var length = values.length;
    if (this._initialValue !== undefined) {
        value = this._initialValue;
        i = 0;
    } else {
        value = Promise.resolve(values[0]);
        i = 1;
    }

    this._currentCancellable = value;

    if (!value.isRejected()) {
        for (; i < length; ++i) {
            var ctx = {
                accum: null,
                value: values[i],
                index: i,
                length: length,
                array: this
            };
            value = value._then(gotAccum, undefined, undefined, ctx, undefined);
        }
    }

    if (this._eachValues !== undefined) {
        value = value
            ._then(this._eachComplete, undefined, undefined, this, undefined);
    }
    value._then(completed, completed, undefined, value, this);
};

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};

function completed(valueOrReason, array) {
    if (this.isFulfilled()) {
        array._resolve(valueOrReason);
    } else {
        array._reject(valueOrReason);
    }
}

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

function gotAccum(accum) {
    this.accum = accum;
    this.array._gotAccum(accum);
    var value = tryConvertToPromise(this.value, this.array._promise);
    if (value instanceof Promise) {
        this.array._currentCancellable = value;
        return value._then(gotValue, undefined, undefined, this, undefined);
    } else {
        return gotValue.call(this, value);
    }
}

function gotValue(value) {
    var array = this.array;
    var promise = array._promise;
    var fn = tryCatch(array._fn);
    promise._pushContext();
    var ret;
    if (array._eachValues !== undefined) {
        ret = fn.call(promise._boundValue(), value, this.index, this.length);
    } else {
        ret = fn.call(promise._boundValue(),
                              this.accum, value, this.index, this.length);
    }
    if (ret instanceof Promise) {
        array._currentCancellable = ret;
    }
    var promiseCreated = promise._popContext();
    debug.checkForgottenReturns(
        ret,
        promiseCreated,
        array._eachValues !== undefined ? "Promise.each" : "Promise.reduce",
        promise
    );
    return ret;
}
};

},{"./util":60}],53:[function(require,module,exports){
(function (global){
"use strict";
var util = require("./util");
var schedule;
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            window.navigator.standalone)) {
    schedule = (function() {
        var div = document.createElement("div");
        var opts = {attributes: true};
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
            div.classList.toggle("foo");
          toggleScheduled = false;
        });
        o2.observe(div2, opts);

        var scheduleToggle = function() {
            if (toggleScheduled) return;
          toggleScheduled = true;
          div2.classList.toggle("foo");
        };

        return function schedule(fn) {
          var o = new MutationObserver(function() {
            o.disconnect();
            fn();
          });
          o.observe(div, opts);
          scheduleToggle();
        };
    })();
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./util":60}],54:[function(require,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray, debug) {
var PromiseInspection = Promise.PromiseInspection;
var util = require("./util");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 33554432;
    ret._settledValueField = value;
    return this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 16777216;
    ret._settledValueField = reason;
    return this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    debug.deprecated(".settle()", ".reflect()");
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return Promise.settle(this);
};
};

},{"./util":60}],55:[function(require,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = require("./util");
var RangeError = require("./errors").RangeError;
var AggregateError = require("./errors").AggregateError;
var isArray = util.isArray;
var CANCELLATION = {};


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
        return true;
    }
    return false;

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    return this._checkOutcome();
};

SomePromiseArray.prototype._promiseCancelled = function () {
    if (this._values instanceof Promise || this._values == null) {
        return this._cancel();
    }
    this._addRejected(CANCELLATION);
    return this._checkOutcome();
};

SomePromiseArray.prototype._checkOutcome = function() {
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            if (this._values[i] !== CANCELLATION) {
                e.push(this._values[i]);
            }
        }
        if (e.length > 0) {
            this._reject(e);
        } else {
            this._cancel();
        }
        return true;
    }
    return false;
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors":36,"./util":60}],56:[function(require,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValueField = promise._isFateSealed()
            ? promise._settledValue() : undefined;
    }
    else {
        this._bitField = 0;
        this._settledValueField = undefined;
    }
}

PromiseInspection.prototype._settledValue = function() {
    return this._settledValueField;
};

var value = PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var reason = PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
    return (this._bitField & 33554432) !== 0;
};

var isRejected = PromiseInspection.prototype.isRejected = function () {
    return (this._bitField & 16777216) !== 0;
};

var isPending = PromiseInspection.prototype.isPending = function () {
    return (this._bitField & 50397184) === 0;
};

var isResolved = PromiseInspection.prototype.isResolved = function () {
    return (this._bitField & 50331648) !== 0;
};

PromiseInspection.prototype.isCancelled =
Promise.prototype._isCancelled = function() {
    return (this._bitField & 65536) === 65536;
};

Promise.prototype.isCancelled = function() {
    return this._target()._isCancelled();
};

Promise.prototype.isPending = function() {
    return isPending.call(this._target());
};

Promise.prototype.isRejected = function() {
    return isRejected.call(this._target());
};

Promise.prototype.isFulfilled = function() {
    return isFulfilled.call(this._target());
};

Promise.prototype.isResolved = function() {
    return isResolved.call(this._target());
};

Promise.prototype.value = function() {
    return value.call(this._target());
};

Promise.prototype.reason = function() {
    var target = this._target();
    target._unsetRejectionIsUnhandled();
    return reason.call(target);
};

Promise.prototype._value = function() {
    return this._settledValue();
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue();
};

Promise.PromiseInspection = PromiseInspection;
};

},{}],57:[function(require,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = require("./util");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) return obj;
        var then = getThen(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            if (isAnyBluebirdPromise(obj)) {
                var ret = new Promise(INTERNAL);
                obj._then(
                    ret._fulfill,
                    ret._reject,
                    undefined,
                    ret,
                    null
                );
                return ret;
            }
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function doGetThen(obj) {
    return obj.then;
}

function getThen(obj) {
    try {
        return doGetThen(obj);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    return hasProp.call(obj, "_promise0");
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x, resolve, reject);
    synchronous = false;

    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolve(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function reject(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util":60}],58:[function(require,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, debug) {
var util = require("./util");
var TimeoutError = Promise.TimeoutError;

function HandleWrapper(handle)  {
    this.handle = handle;
}

HandleWrapper.prototype._resultCancelled = function() {
    clearTimeout(this.handle);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (ms, value) {
    var ret;
    var handle;
    if (value !== undefined) {
        ret = Promise.resolve(value)
                ._then(afterValue, null, null, ms, undefined);
        if (debug.cancellation() && value instanceof Promise) {
            ret._setOnCancel(value);
        }
    } else {
        ret = new Promise(INTERNAL);
        handle = setTimeout(function() { ret._fulfill(); }, +ms);
        if (debug.cancellation()) {
            ret._setOnCancel(new HandleWrapper(handle));
        }
    }
    ret._setAsyncGuaranteed();
    return ret;
};

Promise.prototype.delay = function (ms) {
    return delay(ms, this);
};

var afterTimeout = function (promise, message, parent) {
    var err;
    if (typeof message !== "string") {
        if (message instanceof Error) {
            err = message;
        } else {
            err = new TimeoutError("operation timed out");
        }
    } else {
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._reject(err);

    if (parent != null) {
        parent.cancel();
    }
};

function successClear(value) {
    clearTimeout(this.handle);
    return value;
}

function failureClear(reason) {
    clearTimeout(this.handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret, parent;

    var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
        if (ret.isPending()) {
            afterTimeout(ret, message, parent);
        }
    }, ms));

    if (debug.cancellation()) {
        parent = this.then();
        ret = parent._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
        ret._setOnCancel(handleWrapper);
    } else {
        ret = this._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
    }

    return ret;
};

};

},{"./util":60}],59:[function(require,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext, INTERNAL, debug) {
    var util = require("./util");
    var TypeError = require("./errors").TypeError;
    var inherits = require("./util").inherits;
    var errorObj = util.errorObj;
    var tryCatch = util.tryCatch;

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = new Promise(INTERNAL);
        function iterator() {
            if (i >= len) return ret._fulfill();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret;
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== null
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    function ResourceList(length) {
        this.length = length;
        this.promise = null;
        this[length-1] = null;
    }

    ResourceList.prototype._resultCancelled = function() {
        var len = this.length;
        for (var i = 0; i < len; ++i) {
            var item = this[i];
            if (item instanceof Promise) {
                item.cancel();
            }
        }
    };

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") {
            return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
            input = arguments[0];
            len = input.length;
            spreadArgs = false;
        } else {
            input = arguments;
            len--;
        }
        var resources = new ResourceList(len);
        for (var i = 0; i < len; ++i) {
            var resource = input[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var reflectedResources = new Array(resources.length);
        for (var i = 0; i < reflectedResources.length; ++i) {
            reflectedResources[i] = Promise.resolve(resources[i]).reflect();
        }

        var resultPromise = Promise.all(reflectedResources)
            .then(function(inspections) {
                for (var i = 0; i < inspections.length; ++i) {
                    var inspection = inspections[i];
                    if (inspection.isRejected()) {
                        errorObj.e = inspection.error();
                        return errorObj;
                    } else if (!inspection.isFulfilled()) {
                        resultPromise.cancel();
                        return;
                    }
                    inspections[i] = inspection.value();
                }
                promise._pushContext();

                fn = tryCatch(fn);
                var ret = spreadArgs
                    ? fn.apply(undefined, inspections) : fn(inspections);
                var promiseCreated = promise._popContext();
                debug.checkForgottenReturns(
                    ret, promiseCreated, "Promise.using", promise);
                return ret;
            });

        var promise = resultPromise.lastly(function() {
            var inspection = new Promise.PromiseInspection(resultPromise);
            return dispose(resources, inspection);
        });
        resources.promise = promise;
        promise._setOnCancel(resources);
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 131072;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 131072) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~131072);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors":36,"./util":60}],60:[function(require,module,exports){
(function (global){
"use strict";
var es5 = require("./es5");
var canEvaluate = typeof navigator == "undefined";

var errorObj = {e: {}};
var tryCatchTarget;
var globalObject = typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window :
    typeof global !== "undefined" ? global :
    this !== undefined ? this : null;

function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return typeof value === "function" ||
           typeof value === "object" && value !== null;
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function FakeConstructor() {}
    FakeConstructor.prototype = obj;
    var l = 8;
    while (l--) new FakeConstructor();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function isError(obj) {
    return obj !== null &&
           typeof obj === "object" &&
           typeof obj.message === "string" &&
           typeof obj.name === "string";
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return isError(obj) && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var asArray = function(v) {
    if (es5.isArray(v)) {
        return v;
    }
    return null;
};

if (typeof Symbol !== "undefined" && Symbol.iterator) {
    var ArrayFrom = typeof Array.from === "function" ? function(v) {
        return Array.from(v);
    } : function(v) {
        var ret = [];
        var it = v[Symbol.iterator]();
        var itResult;
        while (!((itResult = it.next()).done)) {
            ret.push(itResult.value);
        }
        return ret;
    };

    asArray = function(v) {
        if (es5.isArray(v)) {
            return v;
        } else if (v != null && typeof v[Symbol.iterator] === "function") {
            return ArrayFrom(v);
        }
        return null;
    };
}

var isNode = typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]";

function env(key, def) {
    return isNode ? process.env[key] : def;
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    asArray: asArray,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    isError: isError,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: isNode,
    env: env,
    global: globalObject
};
ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./es5":37}],61:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/es6.array.from');
module.exports = require('../../modules/$.core').Array.from;
},{"../../modules/$.core":81,"../../modules/es6.array.from":129,"../../modules/es6.string.iterator":139}],62:[function(require,module,exports){
require('../modules/web.dom.iterable');
require('../modules/es6.string.iterator');
module.exports = require('../modules/core.get-iterator');
},{"../modules/core.get-iterator":127,"../modules/es6.string.iterator":139,"../modules/web.dom.iterable":142}],63:[function(require,module,exports){
require('../modules/web.dom.iterable');
require('../modules/es6.string.iterator');
module.exports = require('../modules/core.is-iterable');
},{"../modules/core.is-iterable":128,"../modules/es6.string.iterator":139,"../modules/web.dom.iterable":142}],64:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.map');
require('../modules/es7.map.to-json');
module.exports = require('../modules/$.core').Map;
},{"../modules/$.core":81,"../modules/es6.map":131,"../modules/es6.object.to-string":136,"../modules/es6.string.iterator":139,"../modules/es7.map.to-json":140,"../modules/web.dom.iterable":142}],65:[function(require,module,exports){
require('../../modules/es6.object.assign');
module.exports = require('../../modules/$.core').Object.assign;
},{"../../modules/$.core":81,"../../modules/es6.object.assign":132}],66:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function create(P, D){
  return $.create(P, D);
};
},{"../../modules/$":103}],67:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function defineProperty(it, key, desc){
  return $.setDesc(it, key, desc);
};
},{"../../modules/$":103}],68:[function(require,module,exports){
var $ = require('../../modules/$');
require('../../modules/es6.object.get-own-property-descriptor');
module.exports = function getOwnPropertyDescriptor(it, key){
  return $.getDesc(it, key);
};
},{"../../modules/$":103,"../../modules/es6.object.get-own-property-descriptor":133}],69:[function(require,module,exports){
require('../../modules/es6.object.keys');
module.exports = require('../../modules/$.core').Object.keys;
},{"../../modules/$.core":81,"../../modules/es6.object.keys":134}],70:[function(require,module,exports){
require('../../modules/es6.object.set-prototype-of');
module.exports = require('../../modules/$.core').Object.setPrototypeOf;
},{"../../modules/$.core":81,"../../modules/es6.object.set-prototype-of":135}],71:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.promise');
module.exports = require('../modules/$.core').Promise;
},{"../modules/$.core":81,"../modules/es6.object.to-string":136,"../modules/es6.promise":137,"../modules/es6.string.iterator":139,"../modules/web.dom.iterable":142}],72:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.set');
require('../modules/es7.set.to-json');
module.exports = require('../modules/$.core').Set;
},{"../modules/$.core":81,"../modules/es6.object.to-string":136,"../modules/es6.set":138,"../modules/es6.string.iterator":139,"../modules/es7.set.to-json":141,"../modules/web.dom.iterable":142}],73:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],74:[function(require,module,exports){
module.exports = function(){ /* empty */ };
},{}],75:[function(require,module,exports){
var isObject = require('./$.is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./$.is-object":96}],76:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./$.cof')
  , TAG = require('./$.wks')('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
},{"./$.cof":77,"./$.wks":125}],77:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],78:[function(require,module,exports){
'use strict';
var $            = require('./$')
  , hide         = require('./$.hide')
  , redefineAll  = require('./$.redefine-all')
  , ctx          = require('./$.ctx')
  , strictNew    = require('./$.strict-new')
  , defined      = require('./$.defined')
  , forOf        = require('./$.for-of')
  , $iterDefine  = require('./$.iter-define')
  , step         = require('./$.iter-step')
  , ID           = require('./$.uid')('id')
  , $has         = require('./$.has')
  , isObject     = require('./$.is-object')
  , setSpecies   = require('./$.set-species')
  , DESCRIPTORS  = require('./$.descriptors')
  , isExtensible = Object.isExtensible || isObject
  , SIZE         = DESCRIPTORS ? '_s' : 'size'
  , id           = 0;

var fastKey = function(it, create){
  // return primitive with prefix
  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if(!$has(it, ID)){
    // can't set id to frozen object
    if(!isExtensible(it))return 'F';
    // not necessary to add id
    if(!create)return 'E';
    // add missing object id
    hide(it, ID, ++id);
  // return object id with prefix
  } return 'O' + it[ID];
};

var getEntry = function(that, key){
  // fast case
  var index = fastKey(key), entry;
  if(index !== 'F')return that._i[index];
  // frozen object case
  for(entry = that._f; entry; entry = entry.n){
    if(entry.k == key)return entry;
  }
};

module.exports = {
  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
    var C = wrapper(function(that, iterable){
      strictNew(that, C, NAME);
      that._i = $.create(null); // index
      that._f = undefined;      // first entry
      that._l = undefined;      // last entry
      that[SIZE] = 0;           // size
      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear(){
        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
          entry.r = true;
          if(entry.p)entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function(key){
        var that  = this
          , entry = getEntry(that, key);
        if(entry){
          var next = entry.n
            , prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if(prev)prev.n = next;
          if(next)next.p = prev;
          if(that._f == entry)that._f = next;
          if(that._l == entry)that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /*, that = undefined */){
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3)
          , entry;
        while(entry = entry ? entry.n : this._f){
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while(entry && entry.r)entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key){
        return !!getEntry(this, key);
      }
    });
    if(DESCRIPTORS)$.setDesc(C.prototype, 'size', {
      get: function(){
        return defined(this[SIZE]);
      }
    });
    return C;
  },
  def: function(that, key, value){
    var entry = getEntry(that, key)
      , prev, index;
    // change existing entry
    if(entry){
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if(!that._f)that._f = entry;
      if(prev)prev.n = entry;
      that[SIZE]++;
      // add to index
      if(index !== 'F')that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function(C, NAME, IS_MAP){
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function(iterated, kind){
      this._t = iterated;  // target
      this._k = kind;      // kind
      this._l = undefined; // previous
    }, function(){
      var that  = this
        , kind  = that._k
        , entry = that._l;
      // revert to the last existing entry
      while(entry && entry.r)entry = entry.p;
      // get next entry
      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if(kind == 'keys'  )return step(0, entry.k);
      if(kind == 'values')return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};
},{"./$":103,"./$.ctx":82,"./$.defined":83,"./$.descriptors":84,"./$.for-of":88,"./$.has":90,"./$.hide":91,"./$.is-object":96,"./$.iter-define":99,"./$.iter-step":101,"./$.redefine-all":109,"./$.set-species":113,"./$.strict-new":117,"./$.uid":124}],79:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var forOf   = require('./$.for-of')
  , classof = require('./$.classof');
module.exports = function(NAME){
  return function toJSON(){
    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
    var arr = [];
    forOf(this, false, arr.push, arr);
    return arr;
  };
};
},{"./$.classof":76,"./$.for-of":88}],80:[function(require,module,exports){
'use strict';
var $              = require('./$')
  , global         = require('./$.global')
  , $export        = require('./$.export')
  , fails          = require('./$.fails')
  , hide           = require('./$.hide')
  , redefineAll    = require('./$.redefine-all')
  , forOf          = require('./$.for-of')
  , strictNew      = require('./$.strict-new')
  , isObject       = require('./$.is-object')
  , setToStringTag = require('./$.set-to-string-tag')
  , DESCRIPTORS    = require('./$.descriptors');

module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
  var Base  = global[NAME]
    , C     = Base
    , ADDER = IS_MAP ? 'set' : 'add'
    , proto = C && C.prototype
    , O     = {};
  if(!DESCRIPTORS || typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function(){
    new C().entries().next();
  }))){
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
  } else {
    C = wrapper(function(target, iterable){
      strictNew(target, C, NAME);
      target._c = new Base;
      if(iterable != undefined)forOf(iterable, IS_MAP, target[ADDER], target);
    });
    $.each.call('add,clear,delete,forEach,get,has,set,keys,values,entries'.split(','),function(KEY){
      var IS_ADDER = KEY == 'add' || KEY == 'set';
      if(KEY in proto && !(IS_WEAK && KEY == 'clear'))hide(C.prototype, KEY, function(a, b){
        if(!IS_ADDER && IS_WEAK && !isObject(a))return KEY == 'get' ? undefined : false;
        var result = this._c[KEY](a === 0 ? 0 : a, b);
        return IS_ADDER ? this : result;
      });
    });
    if('size' in proto)$.setDesc(C.prototype, 'size', {
      get: function(){
        return this._c.size;
      }
    });
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F, O);

  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);

  return C;
};
},{"./$":103,"./$.descriptors":84,"./$.export":86,"./$.fails":87,"./$.for-of":88,"./$.global":89,"./$.hide":91,"./$.is-object":96,"./$.redefine-all":109,"./$.set-to-string-tag":114,"./$.strict-new":117}],81:[function(require,module,exports){
var core = module.exports = {version: '1.2.6'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],82:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./$.a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./$.a-function":73}],83:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],84:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./$.fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./$.fails":87}],85:[function(require,module,exports){
var isObject = require('./$.is-object')
  , document = require('./$.global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./$.global":89,"./$.is-object":96}],86:[function(require,module,exports){
var global    = require('./$.global')
  , core      = require('./$.core')
  , ctx       = require('./$.ctx')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && key in target;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(param){
        return this instanceof C ? new C(param) : C(param);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    if(IS_PROTO)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
  }
};
// type bitmap
$export.F = 1;  // forced
$export.G = 2;  // global
$export.S = 4;  // static
$export.P = 8;  // proto
$export.B = 16; // bind
$export.W = 32; // wrap
module.exports = $export;
},{"./$.core":81,"./$.ctx":82,"./$.global":89}],87:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],88:[function(require,module,exports){
var ctx         = require('./$.ctx')
  , call        = require('./$.iter-call')
  , isArrayIter = require('./$.is-array-iter')
  , anObject    = require('./$.an-object')
  , toLength    = require('./$.to-length')
  , getIterFn   = require('./core.get-iterator-method');
module.exports = function(iterable, entries, fn, that){
  var iterFn = getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    call(iterator, f, step.value, entries);
  }
};
},{"./$.an-object":75,"./$.ctx":82,"./$.is-array-iter":95,"./$.iter-call":97,"./$.to-length":122,"./core.get-iterator-method":126}],89:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],90:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],91:[function(require,module,exports){
var $          = require('./$')
  , createDesc = require('./$.property-desc');
module.exports = require('./$.descriptors') ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./$":103,"./$.descriptors":84,"./$.property-desc":108}],92:[function(require,module,exports){
module.exports = require('./$.global').document && document.documentElement;
},{"./$.global":89}],93:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
},{}],94:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":77}],95:[function(require,module,exports){
// check on default Array iterator
var Iterators  = require('./$.iterators')
  , ITERATOR   = require('./$.wks')('iterator')
  , ArrayProto = Array.prototype;

module.exports = function(it){
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};
},{"./$.iterators":102,"./$.wks":125}],96:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],97:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./$.an-object');
module.exports = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject(ret.call(iterator));
    throw e;
  }
};
},{"./$.an-object":75}],98:[function(require,module,exports){
'use strict';
var $              = require('./$')
  , descriptor     = require('./$.property-desc')
  , setToStringTag = require('./$.set-to-string-tag')
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./$.hide')(IteratorPrototype, require('./$.wks')('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = $.create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};
},{"./$":103,"./$.hide":91,"./$.property-desc":108,"./$.set-to-string-tag":114,"./$.wks":125}],99:[function(require,module,exports){
'use strict';
var LIBRARY        = require('./$.library')
  , $export        = require('./$.export')
  , redefine       = require('./$.redefine')
  , hide           = require('./$.hide')
  , has            = require('./$.has')
  , Iterators      = require('./$.iterators')
  , $iterCreate    = require('./$.iter-create')
  , setToStringTag = require('./$.set-to-string-tag')
  , getProto       = require('./$').getProto
  , ITERATOR       = require('./$.wks')('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , methods, key;
  // Fix native
  if($native){
    var IteratorPrototype = getProto($default.call(new Base));
    // Set @@toStringTag to native iterators
    setToStringTag(IteratorPrototype, TAG, true);
    // FF fix
    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    // fix Array#{values, @@iterator}.name in V8 / FF
    if(DEF_VALUES && $native.name !== VALUES){
      VALUES_BUG = true;
      $default = function values(){ return $native.call(this); };
    }
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES  ? $default : getMethod(VALUES),
      keys:    IS_SET      ? $default : getMethod(KEYS),
      entries: !DEF_VALUES ? $default : getMethod('entries')
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};
},{"./$":103,"./$.export":86,"./$.has":90,"./$.hide":91,"./$.iter-create":98,"./$.iterators":102,"./$.library":104,"./$.redefine":110,"./$.set-to-string-tag":114,"./$.wks":125}],100:[function(require,module,exports){
var ITERATOR     = require('./$.wks')('iterator')
  , SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }

module.exports = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[ITERATOR]();
    iter.next = function(){ safe = true; };
    arr[ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
},{"./$.wks":125}],101:[function(require,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],102:[function(require,module,exports){
module.exports = {};
},{}],103:[function(require,module,exports){
var $Object = Object;
module.exports = {
  create:     $Object.create,
  getProto:   $Object.getPrototypeOf,
  isEnum:     {}.propertyIsEnumerable,
  getDesc:    $Object.getOwnPropertyDescriptor,
  setDesc:    $Object.defineProperty,
  setDescs:   $Object.defineProperties,
  getKeys:    $Object.keys,
  getNames:   $Object.getOwnPropertyNames,
  getSymbols: $Object.getOwnPropertySymbols,
  each:       [].forEach
};
},{}],104:[function(require,module,exports){
module.exports = true;
},{}],105:[function(require,module,exports){
var global    = require('./$.global')
  , macrotask = require('./$.task').set
  , Observer  = global.MutationObserver || global.WebKitMutationObserver
  , process   = global.process
  , Promise   = global.Promise
  , isNode    = require('./$.cof')(process) == 'process'
  , head, last, notify;

var flush = function(){
  var parent, domain, fn;
  if(isNode && (parent = process.domain)){
    process.domain = null;
    parent.exit();
  }
  while(head){
    domain = head.domain;
    fn     = head.fn;
    if(domain)domain.enter();
    fn(); // <- currently we use it only for Promise - try / catch not required
    if(domain)domain.exit();
    head = head.next;
  } last = undefined;
  if(parent)parent.enter();
};

// Node.js
if(isNode){
  notify = function(){
    process.nextTick(flush);
  };
// browsers with MutationObserver
} else if(Observer){
  var toggle = 1
    , node   = document.createTextNode('');
  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
  notify = function(){
    node.data = toggle = -toggle;
  };
// environments with maybe non-completely correct, but existent Promise
} else if(Promise && Promise.resolve){
  notify = function(){
    Promise.resolve().then(flush);
  };
// for other environments - macrotask based on:
// - setImmediate
// - MessageChannel
// - window.postMessag
// - onreadystatechange
// - setTimeout
} else {
  notify = function(){
    // strange IE + webpack dev server bug - use .call(global)
    macrotask.call(global, flush);
  };
}

module.exports = function asap(fn){
  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
  if(last)last.next = task;
  if(!head){
    head = task;
    notify();
  } last = task;
};
},{"./$.cof":77,"./$.global":89,"./$.task":119}],106:[function(require,module,exports){
// 19.1.2.1 Object.assign(target, source, ...)
var $        = require('./$')
  , toObject = require('./$.to-object')
  , IObject  = require('./$.iobject');

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = require('./$.fails')(function(){
  var a = Object.assign
    , A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return a({}, A)[S] != 7 || Object.keys(a({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , $$    = arguments
    , $$len = $$.length
    , index = 1
    , getKeys    = $.getKeys
    , getSymbols = $.getSymbols
    , isEnum     = $.isEnum;
  while($$len > index){
    var S      = IObject($$[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  }
  return T;
} : Object.assign;
},{"./$":103,"./$.fails":87,"./$.iobject":94,"./$.to-object":123}],107:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
var $export = require('./$.export')
  , core    = require('./$.core')
  , fails   = require('./$.fails');
module.exports = function(KEY, exec){
  var fn  = (core.Object || {})[KEY] || Object[KEY]
    , exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
};
},{"./$.core":81,"./$.export":86,"./$.fails":87}],108:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],109:[function(require,module,exports){
var redefine = require('./$.redefine');
module.exports = function(target, src){
  for(var key in src)redefine(target, key, src[key]);
  return target;
};
},{"./$.redefine":110}],110:[function(require,module,exports){
module.exports = require('./$.hide');
},{"./$.hide":91}],111:[function(require,module,exports){
// 7.2.9 SameValue(x, y)
module.exports = Object.is || function is(x, y){
  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
};
},{}],112:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var getDesc  = require('./$').getDesc
  , isObject = require('./$.is-object')
  , anObject = require('./$.an-object');
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = require('./$.ctx')(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
},{"./$":103,"./$.an-object":75,"./$.ctx":82,"./$.is-object":96}],113:[function(require,module,exports){
'use strict';
var core        = require('./$.core')
  , $           = require('./$')
  , DESCRIPTORS = require('./$.descriptors')
  , SPECIES     = require('./$.wks')('species');

module.exports = function(KEY){
  var C = core[KEY];
  if(DESCRIPTORS && C && !C[SPECIES])$.setDesc(C, SPECIES, {
    configurable: true,
    get: function(){ return this; }
  });
};
},{"./$":103,"./$.core":81,"./$.descriptors":84,"./$.wks":125}],114:[function(require,module,exports){
var def = require('./$').setDesc
  , has = require('./$.has')
  , TAG = require('./$.wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./$":103,"./$.has":90,"./$.wks":125}],115:[function(require,module,exports){
var global = require('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":89}],116:[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject  = require('./$.an-object')
  , aFunction = require('./$.a-function')
  , SPECIES   = require('./$.wks')('species');
module.exports = function(O, D){
  var C = anObject(O).constructor, S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};
},{"./$.a-function":73,"./$.an-object":75,"./$.wks":125}],117:[function(require,module,exports){
module.exports = function(it, Constructor, name){
  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
  return it;
};
},{}],118:[function(require,module,exports){
var toInteger = require('./$.to-integer')
  , defined   = require('./$.defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./$.defined":83,"./$.to-integer":120}],119:[function(require,module,exports){
var ctx                = require('./$.ctx')
  , invoke             = require('./$.invoke')
  , html               = require('./$.html')
  , cel                = require('./$.dom-create')
  , global             = require('./$.global')
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listner = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(require('./$.cof')(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listner;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listner, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
},{"./$.cof":77,"./$.ctx":82,"./$.dom-create":85,"./$.global":89,"./$.html":92,"./$.invoke":93}],120:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],121:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./$.iobject')
  , defined = require('./$.defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./$.defined":83,"./$.iobject":94}],122:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./$.to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./$.to-integer":120}],123:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":83}],124:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],125:[function(require,module,exports){
var store  = require('./$.shared')('wks')
  , uid    = require('./$.uid')
  , Symbol = require('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
};
},{"./$.global":89,"./$.shared":115,"./$.uid":124}],126:[function(require,module,exports){
var classof   = require('./$.classof')
  , ITERATOR  = require('./$.wks')('iterator')
  , Iterators = require('./$.iterators');
module.exports = require('./$.core').getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"./$.classof":76,"./$.core":81,"./$.iterators":102,"./$.wks":125}],127:[function(require,module,exports){
var anObject = require('./$.an-object')
  , get      = require('./core.get-iterator-method');
module.exports = require('./$.core').getIterator = function(it){
  var iterFn = get(it);
  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
  return anObject(iterFn.call(it));
};
},{"./$.an-object":75,"./$.core":81,"./core.get-iterator-method":126}],128:[function(require,module,exports){
var classof   = require('./$.classof')
  , ITERATOR  = require('./$.wks')('iterator')
  , Iterators = require('./$.iterators');
module.exports = require('./$.core').isIterable = function(it){
  var O = Object(it);
  return O[ITERATOR] !== undefined
    || '@@iterator' in O
    || Iterators.hasOwnProperty(classof(O));
};
},{"./$.classof":76,"./$.core":81,"./$.iterators":102,"./$.wks":125}],129:[function(require,module,exports){
'use strict';
var ctx         = require('./$.ctx')
  , $export     = require('./$.export')
  , toObject    = require('./$.to-object')
  , call        = require('./$.iter-call')
  , isArrayIter = require('./$.is-array-iter')
  , toLength    = require('./$.to-length')
  , getIterFn   = require('./core.get-iterator-method');
$export($export.S + $export.F * !require('./$.iter-detect')(function(iter){ Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
    var O       = toObject(arrayLike)
      , C       = typeof this == 'function' ? this : Array
      , $$      = arguments
      , $$len   = $$.length
      , mapfn   = $$len > 1 ? $$[1] : undefined
      , mapping = mapfn !== undefined
      , index   = 0
      , iterFn  = getIterFn(O)
      , length, result, step, iterator;
    if(mapping)mapfn = ctx(mapfn, $$len > 2 ? $$[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
        result[index] = mapping ? call(iterator, mapfn, [step.value, index], true) : step.value;
      }
    } else {
      length = toLength(O.length);
      for(result = new C(length); length > index; index++){
        result[index] = mapping ? mapfn(O[index], index) : O[index];
      }
    }
    result.length = index;
    return result;
  }
});

},{"./$.ctx":82,"./$.export":86,"./$.is-array-iter":95,"./$.iter-call":97,"./$.iter-detect":100,"./$.to-length":122,"./$.to-object":123,"./core.get-iterator-method":126}],130:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./$.add-to-unscopables')
  , step             = require('./$.iter-step')
  , Iterators        = require('./$.iterators')
  , toIObject        = require('./$.to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./$.iter-define')(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');
},{"./$.add-to-unscopables":74,"./$.iter-define":99,"./$.iter-step":101,"./$.iterators":102,"./$.to-iobject":121}],131:[function(require,module,exports){
'use strict';
var strong = require('./$.collection-strong');

// 23.1 Map Objects
require('./$.collection')('Map', function(get){
  return function Map(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key){
    var entry = strong.getEntry(this, key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value){
    return strong.def(this, key === 0 ? 0 : key, value);
  }
}, strong, true);
},{"./$.collection":80,"./$.collection-strong":78}],132:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./$.export');

$export($export.S + $export.F, 'Object', {assign: require('./$.object-assign')});
},{"./$.export":86,"./$.object-assign":106}],133:[function(require,module,exports){
// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
var toIObject = require('./$.to-iobject');

require('./$.object-sap')('getOwnPropertyDescriptor', function($getOwnPropertyDescriptor){
  return function getOwnPropertyDescriptor(it, key){
    return $getOwnPropertyDescriptor(toIObject(it), key);
  };
});
},{"./$.object-sap":107,"./$.to-iobject":121}],134:[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./$.to-object');

require('./$.object-sap')('keys', function($keys){
  return function keys(it){
    return $keys(toObject(it));
  };
});
},{"./$.object-sap":107,"./$.to-object":123}],135:[function(require,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = require('./$.export');
$export($export.S, 'Object', {setPrototypeOf: require('./$.set-proto').set});
},{"./$.export":86,"./$.set-proto":112}],136:[function(require,module,exports){

},{}],137:[function(require,module,exports){
'use strict';
var $          = require('./$')
  , LIBRARY    = require('./$.library')
  , global     = require('./$.global')
  , ctx        = require('./$.ctx')
  , classof    = require('./$.classof')
  , $export    = require('./$.export')
  , isObject   = require('./$.is-object')
  , anObject   = require('./$.an-object')
  , aFunction  = require('./$.a-function')
  , strictNew  = require('./$.strict-new')
  , forOf      = require('./$.for-of')
  , setProto   = require('./$.set-proto').set
  , same       = require('./$.same-value')
  , SPECIES    = require('./$.wks')('species')
  , speciesConstructor = require('./$.species-constructor')
  , asap       = require('./$.microtask')
  , PROMISE    = 'Promise'
  , process    = global.process
  , isNode     = classof(process) == 'process'
  , P          = global[PROMISE]
  , Wrapper;

var testResolve = function(sub){
  var test = new P(function(){});
  if(sub)test.constructor = Object;
  return P.resolve(test) === test;
};

var USE_NATIVE = function(){
  var works = false;
  function P2(x){
    var self = new P(x);
    setProto(self, P2.prototype);
    return self;
  }
  try {
    works = P && P.resolve && testResolve();
    setProto(P2, P);
    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
    // actual Firefox has broken subclass support, test that
    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
      works = false;
    }
    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
    if(works && require('./$.descriptors')){
      var thenableThenGotten = false;
      P.resolve($.setDesc({}, 'then', {
        get: function(){ thenableThenGotten = true; }
      }));
      works = thenableThenGotten;
    }
  } catch(e){ works = false; }
  return works;
}();

// helpers
var sameConstructor = function(a, b){
  // library wrapper special case
  if(LIBRARY && a === P && b === Wrapper)return true;
  return same(a, b);
};
var getConstructor = function(C){
  var S = anObject(C)[SPECIES];
  return S != undefined ? S : C;
};
var isThenable = function(it){
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var PromiseCapability = function(C){
  var resolve, reject;
  this.promise = new C(function($$resolve, $$reject){
    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject  = $$reject;
  });
  this.resolve = aFunction(resolve),
  this.reject  = aFunction(reject)
};
var perform = function(exec){
  try {
    exec();
  } catch(e){
    return {error: e};
  }
};
var notify = function(record, isReject){
  if(record.n)return;
  record.n = true;
  var chain = record.c;
  asap(function(){
    var value = record.v
      , ok    = record.s == 1
      , i     = 0;
    var run = function(reaction){
      var handler = ok ? reaction.ok : reaction.fail
        , resolve = reaction.resolve
        , reject  = reaction.reject
        , result, then;
      try {
        if(handler){
          if(!ok)record.h = true;
          result = handler === true ? value : handler(value);
          if(result === reaction.promise){
            reject(TypeError('Promise-chain cycle'));
          } else if(then = isThenable(result)){
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch(e){
        reject(e);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    chain.length = 0;
    record.n = false;
    if(isReject)setTimeout(function(){
      var promise = record.p
        , handler, console;
      if(isUnhandled(promise)){
        if(isNode){
          process.emit('unhandledRejection', value, promise);
        } else if(handler = global.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      } record.a = undefined;
    }, 1);
  });
};
var isUnhandled = function(promise){
  var record = promise._d
    , chain  = record.a || record.c
    , i      = 0
    , reaction;
  if(record.h)return false;
  while(chain.length > i){
    reaction = chain[i++];
    if(reaction.fail || !isUnhandled(reaction.promise))return false;
  } return true;
};
var $reject = function(value){
  var record = this;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  record.v = value;
  record.s = 2;
  record.a = record.c.slice();
  notify(record, true);
};
var $resolve = function(value){
  var record = this
    , then;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  try {
    if(record.p === value)throw TypeError("Promise can't be resolved itself");
    if(then = isThenable(value)){
      asap(function(){
        var wrapper = {r: record, d: false}; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      record.v = value;
      record.s = 1;
      notify(record, false);
    }
  } catch(e){
    $reject.call({r: record, d: false}, e); // wrap
  }
};

// constructor polyfill
if(!USE_NATIVE){
  // 25.4.3.1 Promise(executor)
  P = function Promise(executor){
    aFunction(executor);
    var record = this._d = {
      p: strictNew(this, P, PROMISE),         // <- promise
      c: [],                                  // <- awaiting reactions
      a: undefined,                           // <- checked in isUnhandled reactions
      s: 0,                                   // <- state
      d: false,                               // <- done
      v: undefined,                           // <- value
      h: false,                               // <- handled rejection
      n: false                                // <- notify
    };
    try {
      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
    } catch(err){
      $reject.call(record, err);
    }
  };
  require('./$.redefine-all')(P.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var reaction = new PromiseCapability(speciesConstructor(this, P))
        , promise  = reaction.promise
        , record   = this._d;
      reaction.ok   = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      record.c.push(reaction);
      if(record.a)record.a.push(reaction);
      if(record.s)notify(record, false);
      return promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: P});
require('./$.set-to-string-tag')(P, PROMISE);
require('./$.set-species')(PROMISE);
Wrapper = require('./$.core')[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    var capability = new PromiseCapability(this)
      , $$reject   = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (!USE_NATIVE || testResolve(true)), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
    if(x instanceof P && sameConstructor(x.constructor, this))return x;
    var capability = new PromiseCapability(this)
      , $$resolve  = capability.resolve;
    $$resolve(x);
    return capability.promise;
  }
});
$export($export.S + $export.F * !(USE_NATIVE && require('./$.iter-detect')(function(iter){
  P.all(iter)['catch'](function(){});
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C          = getConstructor(this)
      , capability = new PromiseCapability(C)
      , resolve    = capability.resolve
      , reject     = capability.reject
      , values     = [];
    var abrupt = perform(function(){
      forOf(iterable, false, values.push, values);
      var remaining = values.length
        , results   = Array(remaining);
      if(remaining)$.each.call(values, function(promise, index){
        var alreadyCalled = false;
        C.resolve(promise).then(function(value){
          if(alreadyCalled)return;
          alreadyCalled = true;
          results[index] = value;
          --remaining || resolve(results);
        }, reject);
      });
      else resolve(results);
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C          = getConstructor(this)
      , capability = new PromiseCapability(C)
      , reject     = capability.reject;
    var abrupt = perform(function(){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  }
});
},{"./$":103,"./$.a-function":73,"./$.an-object":75,"./$.classof":76,"./$.core":81,"./$.ctx":82,"./$.descriptors":84,"./$.export":86,"./$.for-of":88,"./$.global":89,"./$.is-object":96,"./$.iter-detect":100,"./$.library":104,"./$.microtask":105,"./$.redefine-all":109,"./$.same-value":111,"./$.set-proto":112,"./$.set-species":113,"./$.set-to-string-tag":114,"./$.species-constructor":116,"./$.strict-new":117,"./$.wks":125}],138:[function(require,module,exports){
'use strict';
var strong = require('./$.collection-strong');

// 23.2 Set Objects
require('./$.collection')('Set', function(get){
  return function Set(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value){
    return strong.def(this, value = value === 0 ? 0 : value, value);
  }
}, strong);
},{"./$.collection":80,"./$.collection-strong":78}],139:[function(require,module,exports){
'use strict';
var $at  = require('./$.string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./$.iter-define')(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"./$.iter-define":99,"./$.string-at":118}],140:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export  = require('./$.export');

$export($export.P, 'Map', {toJSON: require('./$.collection-to-json')('Map')});
},{"./$.collection-to-json":79,"./$.export":86}],141:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export  = require('./$.export');

$export($export.P, 'Set', {toJSON: require('./$.collection-to-json')('Set')});
},{"./$.collection-to-json":79,"./$.export":86}],142:[function(require,module,exports){
require('./es6.array.iterator');
var Iterators = require('./$.iterators');
Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
},{"./$.iterators":102,"./es6.array.iterator":130}],143:[function(require,module,exports){
'use strict'

var fs = require('fs')

module.exports = {
  /*
   * Main entry point into dotenv. Allows configuration before loading .env and .env.$NODE_ENV
   * @param {Object} options - valid options: path ('.env'), encoding ('utf8')
   * @returns {Boolean}
  */
  config: function (options) {
    var path = '.env'
    var encoding = 'utf8'
    var silent = false

    if (options) {
      if (options.silent) {
        silent = options.silent
      }
      if (options.path) {
        path = options.path
      }
      if (options.encoding) {
        encoding = options.encoding
      }
    }

    try {
      // specifying an encoding returns a string instead of a buffer
      var parsedObj = this.parse(fs.readFileSync(path, { encoding: encoding }))

      Object.keys(parsedObj).forEach(function (key) {
        process.env[key] = process.env[key] || parsedObj[key]
      })

      return true
    } catch(e) {
      if (!silent) {
        console.error(e)
      }
      return false
    }
  },

  /*
   * Parses a string or buffer into an object
   * @param {String|Buffer} src - source to be parsed
   * @returns {Object}
  */
  parse: function (src) {
    var obj = {}

    // convert Buffers before splitting into lines and processing
    src.toString().split('\n').forEach(function (line) {
      // matching "KEY' and 'VAL' in 'KEY=VAL'
      var keyValueArr = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)
      // matched?
      if (keyValueArr != null) {
        var key = keyValueArr[1]

        // default undefined or missing values to empty string
        var value = keyValueArr[2] ? keyValueArr[2] : ''

        // expand newlines in quoted values
        var len = value ? value.length : 0
        if (len > 0 && value.charAt(0) === '\"' && value.charAt(len - 1) === '\"') {
          value = value.replace(/\\n/gm, '\n')
        }

        // remove any surrounding quotes and extra spaces
        value = value.replace(/(^['"]|['"]$)/g, '').trim()

        // is this value a variable?
        if (value.charAt(0) === '$') {
          var possibleVar = value.substring(1)
          value = obj[possibleVar] || process.env[possibleVar] || ''
        }
        // varaible can be escaped with a \$
        if (value.substring(0, 2) === '\\$') {
          value = value.substring(1)
        }

        obj[key] = value
      }
    })

    return obj
  }

}

module.exports.load = module.exports.config

},{"fs":undefined}],144:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Factory = undefined;

var _graphql = require('graphql');

var _error = require('graphql/error');

var _language = require('graphql/language');

var _types = require('./types');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Factory = exports.Factory = (function () {
  function Factory() {
    _classCallCheck(this, Factory);
  }

  _createClass(Factory, [{
    key: 'getRegexScalar',
    value: function getRegexScalar(options) {
      var error = options.error || 'Query error: ' + options.name;

      var parser = function parser(ast) {
        if (ast.kind !== _language.Kind.STRING) {
          throw new _error.GraphQLError('Query error: Can only parse strings got a: ' + ast.kind, [ast]);
        }

        var re = options.regex;
        if (!re.test(ast.value)) {
          throw new _error.GraphQLError(error, [ast]);
        }

        return ast.value;
      };

      return this.getCustomScalar(options.name, options.description, parser);
    }
  }, {
    key: 'getCustomScalar',
    value: function getCustomScalar(name, description, parser) {
      return new _types.GraphQLCustomScalarType(name, description, parser);
    }
  }]);

  return Factory;
})();
},{"./types":147,"graphql":157,"graphql/error":150,"graphql/language":163}],145:[function(require,module,exports){
'use strict';

var _scalars = require('./scalars');

module.exports = {
  GraphQLEmail: _scalars.GraphQLEmail,
  GraphQLURL: _scalars.GraphQLURL,
  GraphQLLimitedString: _scalars.GraphQLLimitedString,
  GraphQLPassword: _scalars.GraphQLPassword,
  GraphQLDateTime: _scalars.GraphQLDateTime
};
},{"./scalars":146}],146:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GraphQLDateTime = exports.GraphQLPassword = exports.GraphQLLimitedString = exports.GraphQLURL = exports.GraphQLEmail = undefined;

var _error = require('graphql/error');

var _language = require('graphql/language');

var _factory = require('./factory');

var _types = require('./types');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var factory = new _factory.Factory();

var GraphQLEmail = exports.GraphQLEmail = factory.getRegexScalar({
  name: 'Email',
  regex: /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
  description: 'The Email scalar type represents E-Mail addresses compliant to RFC 822.',
  error: 'Query error: Not a valid Email address'
});

var GraphQLURL = exports.GraphQLURL = factory.getRegexScalar({
  name: 'URL',
  // RegExp taken from https://gist.github.com/dperini/729294
  regex: new RegExp('^(?:(?:https?|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))\\.?)(?::\\d{2,5})?(?:[/?#]\\S*)?$', 'i'),
  description: 'The URL scalar type represents URL addresses.',
  error: 'Query error: Not a valid URL'
});

var stringValidator = function stringValidator(ast) {
  if (ast.kind !== _language.Kind.STRING) {
    throw new _error.GraphQLError('Query error: Can only parse strings got a: ' + ast.kind, [ast]);
  }
};

var lengthValidator = function lengthValidator(ast, min, max) {
  if (ast.value.length < min) {
    throw new _error.GraphQLError('Query error: String not long enough', [ast]);
  }

  if (max && ast.value.length > max) {
    throw new _error.GraphQLError('Query error: String too long', [ast]);
  }
};

var alphabetValidator = function alphabetValidator(ast, alphabet) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = ast.value[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var char = _step.value;

      if (alphabet.indexOf(char) < 0) {
        throw new _error.GraphQLError('Query error: Invalid character found', [ast]);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

var complexityValidator = function complexityValidator(ast, options) {
  var complexity = options || {};
  var alhpaNumericRe = /^(?=.*[0-9])(?=.*[a-zA-Z])(.+)$/;
  var mixedCaseRe = /^(?=.*[a-z])(?=.*[A-Z])(.+)$/;
  var specialCharsRe = /^(?=.*[^a-zA-Z0-9])(.+)$/;

  if (complexity.alphaNumeric && !alhpaNumericRe.test(ast.value)) {
    throw new _error.GraphQLError('Query error: String must contain at least one number and one letter', [ast]);
  }

  if (complexity.mixedCase && !mixedCaseRe.test(ast.value)) {
    throw new _error.GraphQLError('Query error: String must contain at least one uper and one lower case letter', [ast]);
  }

  if (complexity.specialChars && !specialCharsRe.test(ast.value)) {
    throw new _error.GraphQLError('Query error: String must contain at least one special character', [ast]);
  }
};

var limitedStringCounter = 0;

var GraphQLLimitedString = exports.GraphQLLimitedString = (function (_GraphQLCustomScalarT) {
  _inherits(GraphQLLimitedString, _GraphQLCustomScalarT);

  function GraphQLLimitedString() {
    var min = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
    var max = arguments[1];
    var alphabet = arguments[2];

    _classCallCheck(this, GraphQLLimitedString);

    var suffix = limitedStringCounter++ > 0 ? limitedStringCounter : '';
    var name = 'LimitedString' + suffix;
    var description = 'A limited string.';
    if (max) description += ' Has to be between ' + min + ' and ' + max + ' characters long.';else description += ' Has to be at least ' + min + ' characters long.';
    if (alphabet) description += ' May only contain the following characters: ' + alphabet;

    var validator = function validator(ast) {
      stringValidator(ast);
      lengthValidator(ast, min, max);

      if (alphabet) alphabetValidator(ast, alphabet);

      return ast.value;
    };

    return _possibleConstructorReturn(this, Object.getPrototypeOf(GraphQLLimitedString).call(this, name, description, validator));
  }

  return GraphQLLimitedString;
})(_types.GraphQLCustomScalarType);

;

var passwordCounter = 0;

var GraphQLPassword = exports.GraphQLPassword = (function (_GraphQLCustomScalarT2) {
  _inherits(GraphQLPassword, _GraphQLCustomScalarT2);

  function GraphQLPassword() {
    var min = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
    var max = arguments[1];
    var alphabet = arguments[2];
    var complexity = arguments[3];

    _classCallCheck(this, GraphQLPassword);

    var suffix = passwordCounter++ > 0 ? passwordCounter : '';
    var name = 'Password' + suffix;
    var description = 'A password string.';
    if (max) description += ' Has to be between ' + min + ' and ' + max + ' characters long.';else description += ' Has to be at least ' + min + ' characters long.';
    if (alphabet) description += ' May only contain the following characters: ' + alphabet;
    if (complexity) {
      if (complexity.alphaNumeric) description += ' Has to be alpha numeric.';
      if (complexity.mixedCase) description += ' Has to be mixed case.';
      if (complexity.specialChars) description += ' Has to contain special characters.';
    }

    var validator = function validator(ast) {
      stringValidator(ast);
      lengthValidator(ast, min, max);

      if (alphabet) alphabetValidator(ast, alphabet);
      if (complexity) complexityValidator(ast, complexity);

      return ast.value;
    };

    return _possibleConstructorReturn(this, Object.getPrototypeOf(GraphQLPassword).call(this, name, description, validator));
  }

  return GraphQLPassword;
})(_types.GraphQLCustomScalarType);

;

var GraphQLDateTime = exports.GraphQLDateTime = factory.getCustomScalar('DateTime', 'The DateTime scalar type represents date time strings complying to ISO-8601.', function (ast) {
  stringValidator(ast);
  if (!Date.parse(ast.value)) {
    throw new _error.GraphQLError('Query error: String is not a valid date time string', [ast]);
  }

  return ast.value;
});
},{"./factory":144,"./types":147,"graphql/error":150,"graphql/language":163}],147:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GraphQLCustomScalarType = undefined;

var _graphql = require('graphql');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GraphQLCustomScalarType = exports.GraphQLCustomScalarType = (function (_GraphQLScalarType) {
  _inherits(GraphQLCustomScalarType, _GraphQLScalarType);

  function GraphQLCustomScalarType(name, description, parser) {
    _classCallCheck(this, GraphQLCustomScalarType);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(GraphQLCustomScalarType).call(this, {
      name: name,
      description: description,
      serialize: function serialize(value) {
        return value;
      },
      parseValue: function parseValue(value) {
        return value;
      },
      parseLiteral: function parseLiteral(ast) {
        return parser(ast);
      }
    }));
  }

  return GraphQLCustomScalarType;
})(_graphql.GraphQLScalarType);
},{"graphql":157}],148:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _language = require('../language');

var GraphQLError = (function (_Error) {
  _inherits(GraphQLError, _Error);

  function GraphQLError(message,
  // A flow bug keeps us from declaring nodes as an array of Node
  nodes, /* Node */stack, source, positions) {
    _classCallCheck(this, GraphQLError);

    _get(Object.getPrototypeOf(GraphQLError.prototype), 'constructor', this).call(this, message);
    this.message = message;

    Object.defineProperty(this, 'stack', { value: stack || message });
    Object.defineProperty(this, 'nodes', { value: nodes });

    // Note: flow does not yet know about Object.defineProperty with `get`.
    Object.defineProperty(this, 'source', {
      get: function get() {
        if (source) {
          return source;
        }
        if (nodes && nodes.length > 0) {
          var node = nodes[0];
          return node && node.loc && node.loc.source;
        }
      }
    });

    Object.defineProperty(this, 'positions', {
      get: function get() {
        if (positions) {
          return positions;
        }
        if (nodes) {
          var nodePositions = nodes.map(function (node) {
            return node.loc && node.loc.start;
          });
          if (nodePositions.some(function (p) {
            return p;
          })) {
            return nodePositions;
          }
        }
      }
    });

    Object.defineProperty(this, 'locations', {
      get: function get() {
        var _this = this;

        if (this.positions && this.source) {
          return this.positions.map(function (pos) {
            return (0, _language.getLocation)(_this.source, pos);
          });
        }
      }
    });
  }

  return GraphQLError;
})(Error);

exports.GraphQLError = GraphQLError;
},{"../language":163,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/get":19,"babel-runtime/helpers/inherits":20}],149:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Given a GraphQLError, format it according to the rules described by the
 * Response Format, Errors section of the GraphQL Specification.
 */
'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.formatError = formatError;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

function formatError(error) {
  (0, _jsutilsInvariant2['default'])(error, 'Received null or undefined error.');
  return {
    message: error.message,
    locations: error.locations
  };
}
},{"../jsutils/invariant":159,"babel-runtime/helpers/interop-require-default":21}],150:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _GraphQLError = require('./GraphQLError');

Object.defineProperty(exports, 'GraphQLError', {
  enumerable: true,
  get: function get() {
    return _GraphQLError.GraphQLError;
  }
});

var _syntaxError = require('./syntaxError');

Object.defineProperty(exports, 'syntaxError', {
  enumerable: true,
  get: function get() {
    return _syntaxError.syntaxError;
  }
});

var _locatedError = require('./locatedError');

Object.defineProperty(exports, 'locatedError', {
  enumerable: true,
  get: function get() {
    return _locatedError.locatedError;
  }
});

var _formatError = require('./formatError');

Object.defineProperty(exports, 'formatError', {
  enumerable: true,
  get: function get() {
    return _formatError.formatError;
  }
});
},{"./GraphQLError":148,"./formatError":149,"./locatedError":151,"./syntaxError":152}],151:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.locatedError = locatedError;

var _GraphQLError = require('./GraphQLError');

/**
 * Given an arbitrary Error, presumably thrown while attempting to execute a
 * GraphQL operation, produce a new GraphQLError aware of the location in the
 * document responsible for the original Error.
 */

function locatedError(originalError, nodes) {
  var message = originalError ? originalError.message || String(originalError) : 'An unknown error occurred.';
  var stack = originalError ? originalError.stack : null;
  var error = new _GraphQLError.GraphQLError(message, nodes, stack);
  error.originalError = originalError;
  return error;
}
},{"./GraphQLError":148}],152:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.syntaxError = syntaxError;

var _languageLocation = require('../language/location');

var _GraphQLError = require('./GraphQLError');

/**
 * Produces a GraphQLError representing a syntax error, containing useful
 * descriptive information about the syntax error's position in the source.
 */

function syntaxError(source, position, description) {
  var location = (0, _languageLocation.getLocation)(source, position);
  var error = new _GraphQLError.GraphQLError('Syntax Error ' + source.name + ' (' + location.line + ':' + location.column + ') ' + description + '\n\n' + highlightSourceAtLocation(source, location), undefined, undefined, source, [position]);
  return error;
}

/**
 * Render a helpful description of the location of the error in the GraphQL
 * Source document.
 */
function highlightSourceAtLocation(source, location) {
  var line = location.line;
  var prevLineNum = (line - 1).toString();
  var lineNum = line.toString();
  var nextLineNum = (line + 1).toString();
  var padLen = nextLineNum.length;
  var lines = source.body.split(/\r\n|[\n\r]/g);
  return (line >= 2 ? lpad(padLen, prevLineNum) + ': ' + lines[line - 2] + '\n' : '') + lpad(padLen, lineNum) + ': ' + lines[line - 1] + '\n' + Array(2 + padLen + location.column).join(' ') + '^\n' + (line < lines.length ? lpad(padLen, nextLineNum) + ': ' + lines[line] + '\n' : '');
}

function lpad(len, str) {
  return Array(len - str.length + 1).join(' ') + str;
}
},{"../language/location":166,"./GraphQLError":148}],153:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Terminology
 *
 * "Definitions" are the generic name for top-level statements in the document.
 * Examples of this include:
 * 1) Operations (such as a query)
 * 2) Fragments
 *
 * "Operations" are a generic name for requests in the document.
 * Examples of this include:
 * 1) query,
 * 2) mutation
 *
 * "Selections" are the definitions that can appear legally and at
 * single level of the query. These include:
 * 1) field references e.g "a"
 * 2) fragment "spreads" e.g. "...c"
 * 3) inline fragment "spreads" e.g. "...on Type { a }"
 */

/**
 * Data that must be available at all points during query execution.
 *
 * Namely, schema of the type system that is currently executing,
 * and the fragments defined in the query document
 */
'use strict';

/**
 * The result of execution. `data` is the result of executing the
 * query, `errors` is null if no errors occurred, and is a
 * non-empty array if an error occurred.
 */

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.execute = execute;

var _error = require('../error');

var _jsutilsFind = require('../jsutils/find');

var _jsutilsFind2 = _interopRequireDefault(_jsutilsFind);

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _utilitiesTypeFromAST = require('../utilities/typeFromAST');

var _language = require('../language');

var _values = require('./values');

var _typeDefinition = require('../type/definition');

var _typeSchema = require('../type/schema');

var _typeIntrospection = require('../type/introspection');

var _typeDirectives = require('../type/directives');

/**
 * Implements the "Evaluating requests" section of the GraphQL specification.
 *
 * Returns a Promise that will eventually be resolved and never rejected.
 *
 * If the arguments to this function do not result in a legal execution context,
 * a GraphQLError will be thrown immediately explaining the invalid input.
 */

function execute(schema, documentAST, rootValue, variableValues, operationName) {
  (0, _jsutilsInvariant2['default'])(schema, 'Must provide schema');
  (0, _jsutilsInvariant2['default'])(schema instanceof _typeSchema.GraphQLSchema, 'Schema must be an instance of GraphQLSchema. Also ensure that there are ' + 'not multiple versions of GraphQL installed in your node_modules directory.');

  // If a valid context cannot be created due to incorrect arguments,
  // this will throw an error.
  var context = buildExecutionContext(schema, documentAST, rootValue, variableValues, operationName);

  // Return a Promise that will eventually resolve to the data described by
  // The "Response" section of the GraphQL specification.
  //
  // If errors are encountered while executing a GraphQL field, only that
  // field and its descendants will be omitted, and sibling fields will still
  // be executed. An execution which encounters errors will still result in a
  // resolved Promise.
  return new _Promise(function (resolve) {
    resolve(executeOperation(context, context.operation, rootValue));
  })['catch'](function (error) {
    // Errors from sub-fields of a NonNull type may propagate to the top level,
    // at which point we still log the error and null the parent field, which
    // in this case is the entire response.
    context.errors.push(error);
    return null;
  }).then(function (data) {
    if (!context.errors.length) {
      return { data: data };
    }
    return { data: data, errors: context.errors };
  });
}

/**
 * Constructs a ExecutionContext object from the arguments passed to
 * execute, which we will pass throughout the other execution methods.
 *
 * Throws a GraphQLError if a valid execution context cannot be created.
 */
function buildExecutionContext(schema, documentAST, rootValue, rawVariableValues, operationName) {
  var errors = [];
  var operation = undefined;
  var fragments = _Object$create(null);
  documentAST.definitions.forEach(function (definition) {
    switch (definition.kind) {
      case _language.Kind.OPERATION_DEFINITION:
        if (!operationName && operation) {
          throw new _error.GraphQLError('Must provide operation name if query contains multiple operations.');
        }
        if (!operationName || definition.name && definition.name.value === operationName) {
          operation = definition;
        }
        break;
      case _language.Kind.FRAGMENT_DEFINITION:
        fragments[definition.name.value] = definition;
        break;
      default:
        throw new _error.GraphQLError('GraphQL cannot execute a request containing a ' + definition.kind + '.', definition);
    }
  });
  if (!operation) {
    if (!operationName) {
      throw new _error.GraphQLError('Unknown operation named "' + operationName + '".');
    } else {
      throw new _error.GraphQLError('Must provide an operation.');
    }
  }
  var variableValues = (0, _values.getVariableValues)(schema, operation.variableDefinitions || [], rawVariableValues || {});
  var exeContext = { schema: schema, fragments: fragments, rootValue: rootValue, operation: operation, variableValues: variableValues, errors: errors };
  return exeContext;
}

/**
 * Implements the "Evaluating operations" section of the spec.
 */
function executeOperation(exeContext, operation, rootValue) {
  var type = getOperationRootType(exeContext.schema, operation);
  var fields = collectFields(exeContext, type, operation.selectionSet, _Object$create(null), _Object$create(null));

  if (operation.operation === 'mutation') {
    return executeFieldsSerially(exeContext, type, rootValue, fields);
  }
  return executeFields(exeContext, type, rootValue, fields);
}

/**
 * Extracts the root type of the operation from the schema.
 */
function getOperationRootType(schema, operation) {
  switch (operation.operation) {
    case 'query':
      return schema.getQueryType();
    case 'mutation':
      var mutationType = schema.getMutationType();
      if (!mutationType) {
        throw new _error.GraphQLError('Schema is not configured for mutations', [operation]);
      }
      return mutationType;
    case 'subscription':
      var subscriptionType = schema.getSubscriptionType();
      if (!subscriptionType) {
        throw new _error.GraphQLError('Schema is not configured for subscriptions', [operation]);
      }
      return subscriptionType;
    default:
      throw new _error.GraphQLError('Can only execute queries, mutations and subscriptions', [operation]);
  }
}

/**
 * Implements the "Evaluating selection sets" section of the spec
 * for "write" mode.
 */
function executeFieldsSerially(exeContext, parentType, sourceValue, fields) {
  return _Object$keys(fields).reduce(function (prevPromise, responseName) {
    return prevPromise.then(function (results) {
      var fieldASTs = fields[responseName];
      var result = resolveField(exeContext, parentType, sourceValue, fieldASTs);
      if (result === undefined) {
        return results;
      }
      if (isThenable(result)) {
        return result.then(function (resolvedResult) {
          results[responseName] = resolvedResult;
          return results;
        });
      }
      results[responseName] = result;
      return results;
    });
  }, _Promise.resolve({}));
}

/**
 * Implements the "Evaluating selection sets" section of the spec
 * for "read" mode.
 */
function executeFields(exeContext, parentType, sourceValue, fields) {
  var containsPromise = false;

  var finalResults = _Object$keys(fields).reduce(function (results, responseName) {
    var fieldASTs = fields[responseName];
    var result = resolveField(exeContext, parentType, sourceValue, fieldASTs);
    if (result === undefined) {
      return results;
    }
    results[responseName] = result;
    if (isThenable(result)) {
      containsPromise = true;
    }
    return results;
  }, _Object$create(null));

  // If there are no promises, we can just return the object
  if (!containsPromise) {
    return finalResults;
  }

  // Otherwise, results is a map from field name to the result
  // of resolving that field, which is possibly a promise. Return
  // a promise that will return this same map, but with any
  // promises replaced with the values they resolved to.
  return promiseForObject(finalResults);
}

/**
 * Given a selectionSet, adds all of the fields in that selection to
 * the passed in map of fields, and returns it at the end.
 *
 * CollectFields requires the "runtime type" of an object. For a field which
 * returns and Interface or Union type, the "runtime type" will be the actual
 * Object type returned by that field.
 */
function collectFields(exeContext, runtimeType, selectionSet, fields, visitedFragmentNames) {
  for (var i = 0; i < selectionSet.selections.length; i++) {
    var selection = selectionSet.selections[i];
    switch (selection.kind) {
      case _language.Kind.FIELD:
        if (!shouldIncludeNode(exeContext, selection.directives)) {
          continue;
        }
        var name = getFieldEntryKey(selection);
        if (!fields[name]) {
          fields[name] = [];
        }
        fields[name].push(selection);
        break;
      case _language.Kind.INLINE_FRAGMENT:
        if (!shouldIncludeNode(exeContext, selection.directives) || !doesFragmentConditionMatch(exeContext, selection, runtimeType)) {
          continue;
        }
        collectFields(exeContext, runtimeType, selection.selectionSet, fields, visitedFragmentNames);
        break;
      case _language.Kind.FRAGMENT_SPREAD:
        var fragName = selection.name.value;
        if (visitedFragmentNames[fragName] || !shouldIncludeNode(exeContext, selection.directives)) {
          continue;
        }
        visitedFragmentNames[fragName] = true;
        var fragment = exeContext.fragments[fragName];
        if (!fragment || !shouldIncludeNode(exeContext, fragment.directives) || !doesFragmentConditionMatch(exeContext, fragment, runtimeType)) {
          continue;
        }
        collectFields(exeContext, runtimeType, fragment.selectionSet, fields, visitedFragmentNames);
        break;
    }
  }
  return fields;
}

/**
 * Determines if a field should be included based on the @include and @skip
 * directives, where @skip has higher precidence than @include.
 */
function shouldIncludeNode(exeContext, directives) {
  var skipAST = directives && (0, _jsutilsFind2['default'])(directives, function (directive) {
    return directive.name.value === _typeDirectives.GraphQLSkipDirective.name;
  });
  if (skipAST) {
    var _getArgumentValues = (0, _values.getArgumentValues)(_typeDirectives.GraphQLSkipDirective.args, skipAST.arguments, exeContext.variableValues);

    var skipIf = _getArgumentValues['if'];

    return !skipIf;
  }

  var includeAST = directives && (0, _jsutilsFind2['default'])(directives, function (directive) {
    return directive.name.value === _typeDirectives.GraphQLIncludeDirective.name;
  });
  if (includeAST) {
    var _getArgumentValues2 = (0, _values.getArgumentValues)(_typeDirectives.GraphQLIncludeDirective.args, includeAST.arguments, exeContext.variableValues);

    var includeIf = _getArgumentValues2['if'];

    return Boolean(includeIf);
  }

  return true;
}

/**
 * Determines if a fragment is applicable to the given type.
 */
function doesFragmentConditionMatch(exeContext, fragment, type) {
  var typeConditionAST = fragment.typeCondition;
  if (!typeConditionAST) {
    return true;
  }
  var conditionalType = (0, _utilitiesTypeFromAST.typeFromAST)(exeContext.schema, typeConditionAST);
  if (conditionalType === type) {
    return true;
  }
  if ((0, _typeDefinition.isAbstractType)(conditionalType)) {
    return conditionalType.isPossibleType(type);
  }
  return false;
}

/**
 * This function transforms a JS object `{[key: string]: Promise<T>}` into
 * a `Promise<{[key: string]: T}>`
 *
 * This is akin to bluebird's `Promise.props`, but implemented only using
 * `Promise.all` so it will work with any implementation of ES6 promises.
 */
function promiseForObject(object) {
  var keys = _Object$keys(object);
  var valuesAndPromises = keys.map(function (name) {
    return object[name];
  });
  return _Promise.all(valuesAndPromises).then(function (values) {
    return values.reduce(function (resolvedObject, value, i) {
      resolvedObject[keys[i]] = value;
      return resolvedObject;
    }, _Object$create(null));
  });
}

/**
 * Implements the logic to compute the key of a given field’s entry
 */
function getFieldEntryKey(node) {
  return node.alias ? node.alias.value : node.name.value;
}

/**
 * Resolves the field on the given source object. In particular, this
 * figures out the value that the field returns by calling its resolve function,
 * then calls completeValue to complete promises, serialize scalars, or execute
 * the sub-selection-set for objects.
 */
function resolveField(exeContext, parentType, source, fieldASTs) {
  var fieldAST = fieldASTs[0];
  var fieldName = fieldAST.name.value;

  var fieldDef = getFieldDef(exeContext.schema, parentType, fieldName);
  if (!fieldDef) {
    return;
  }

  var returnType = fieldDef.type;
  var resolveFn = fieldDef.resolve || defaultResolveFn;

  // Build a JS object of arguments from the field.arguments AST, using the
  // variables scope to fulfill any variable references.
  // TODO: find a way to memoize, in case this field is within a List type.
  var args = (0, _values.getArgumentValues)(fieldDef.args, fieldAST.arguments, exeContext.variableValues);

  // The resolve function's optional third argument is a collection of
  // information about the current execution state.
  var info = {
    fieldName: fieldName,
    fieldASTs: fieldASTs,
    returnType: returnType,
    parentType: parentType,
    schema: exeContext.schema,
    fragments: exeContext.fragments,
    rootValue: exeContext.rootValue,
    operation: exeContext.operation,
    variableValues: exeContext.variableValues
  };

  // Get the resolve function, regardless of if its result is normal
  // or abrupt (error).
  var result = resolveOrError(resolveFn, source, args, info);

  return completeValueCatchingError(exeContext, returnType, fieldASTs, info, result);
}

// Isolates the "ReturnOrAbrupt" behavior to not de-opt the `resolveField`
// function. Returns the result of resolveFn or the abrupt-return Error object.
function resolveOrError(resolveFn, source, args, info) {
  try {
    return resolveFn(source, args, info);
  } catch (error) {
    // Sometimes a non-error is thrown, wrap it as an Error for a
    // consistent interface.
    return error instanceof Error ? error : new Error(error);
  }
}

// This is a small wrapper around completeValue which detects and logs errors
// in the execution context.
function completeValueCatchingError(exeContext, returnType, fieldASTs, info, result) {
  // If the field type is non-nullable, then it is resolved without any
  // protection from errors.
  if (returnType instanceof _typeDefinition.GraphQLNonNull) {
    return completeValue(exeContext, returnType, fieldASTs, info, result);
  }

  // Otherwise, error protection is applied, logging the error and resolving
  // a null value for this field if one is encountered.
  try {
    var completed = completeValue(exeContext, returnType, fieldASTs, info, result);
    if (isThenable(completed)) {
      // If `completeValue` returned a rejected promise, log the rejection
      // error and resolve to null.
      // Note: we don't rely on a `catch` method, but we do expect "thenable"
      // to take a second callback for the error case.
      return completed.then(undefined, function (error) {
        exeContext.errors.push(error);
        return _Promise.resolve(null);
      });
    }
    return completed;
  } catch (error) {
    // If `completeValue` returned abruptly (threw an error), log the error
    // and return null.
    exeContext.errors.push(error);
    return null;
  }
}

/**
 * Implements the instructions for completeValue as defined in the
 * "Field entries" section of the spec.
 *
 * If the field type is Non-Null, then this recursively completes the value
 * for the inner type. It throws a field error if that completion returns null,
 * as per the "Nullability" section of the spec.
 *
 * If the field type is a List, then this recursively completes the value
 * for the inner type on each item in the list.
 *
 * If the field type is a Scalar or Enum, ensures the completed value is a legal
 * value of the type by calling the `serialize` method of GraphQL type
 * definition.
 *
 * Otherwise, the field type expects a sub-selection set, and will complete the
 * value by evaluating all sub-selections.
 */
function completeValue(exeContext, returnType, fieldASTs, info, result) {
  // If result is a Promise, apply-lift over completeValue.
  if (isThenable(result)) {
    return result.then(
    // Once resolved to a value, complete that value.
    function (resolved) {
      return completeValue(exeContext, returnType, fieldASTs, info, resolved);
    },
    // If rejected, create a located error, and continue to reject.
    function (error) {
      return _Promise.reject((0, _error.locatedError)(error, fieldASTs));
    });
  }

  // If result is an Error, throw a located error.
  if (result instanceof Error) {
    throw (0, _error.locatedError)(result, fieldASTs);
  }

  // If field type is NonNull, complete for inner type, and throw field error
  // if result is null.
  if (returnType instanceof _typeDefinition.GraphQLNonNull) {
    var completed = completeValue(exeContext, returnType.ofType, fieldASTs, info, result);
    if (completed === null) {
      throw new _error.GraphQLError('Cannot return null for non-nullable ' + ('field ' + info.parentType + '.' + info.fieldName + '.'), fieldASTs);
    }
    return completed;
  }

  // If result is null-like, return null.
  if ((0, _jsutilsIsNullish2['default'])(result)) {
    return null;
  }

  // If field type is List, complete each item in the list with the inner type
  if (returnType instanceof _typeDefinition.GraphQLList) {
    var _ret = (function () {
      (0, _jsutilsInvariant2['default'])(Array.isArray(result), 'User Error: expected iterable, but did not find one ' + ('for field ' + info.parentType + '.' + info.fieldName + '.'));

      // This is specified as a simple map, however we're optimizing the path
      // where the list contains no Promises by avoiding creating another Promise.
      var itemType = returnType.ofType;
      var containsPromise = false;
      var completedResults = result.map(function (item) {
        var completedItem = completeValueCatchingError(exeContext, itemType, fieldASTs, info, item);
        if (!containsPromise && isThenable(completedItem)) {
          containsPromise = true;
        }
        return completedItem;
      });

      return {
        v: containsPromise ? _Promise.all(completedResults) : completedResults
      };
    })();

    if (typeof _ret === 'object') return _ret.v;
  }

  // If field type is Scalar or Enum, serialize to a valid value, returning
  // null if serialization is not possible.
  if (returnType instanceof _typeDefinition.GraphQLScalarType || returnType instanceof _typeDefinition.GraphQLEnumType) {
    (0, _jsutilsInvariant2['default'])(returnType.serialize, 'Missing serialize method on type');
    var serializedResult = returnType.serialize(result);
    return (0, _jsutilsIsNullish2['default'])(serializedResult) ? null : serializedResult;
  }

  // Field type must be Object, Interface or Union and expect sub-selections.
  var runtimeType = undefined;

  if (returnType instanceof _typeDefinition.GraphQLObjectType) {
    runtimeType = returnType;
  } else if ((0, _typeDefinition.isAbstractType)(returnType)) {
    var abstractType = returnType;
    runtimeType = abstractType.getObjectType(result, info);
    if (runtimeType && !abstractType.isPossibleType(runtimeType)) {
      throw new _error.GraphQLError('Runtime Object type "' + runtimeType + '" is not a possible type ' + ('for "' + abstractType + '".'), fieldASTs);
    }
  }

  if (!runtimeType) {
    return null;
  }

  // If there is an isTypeOf predicate function, call it with the
  // current result. If isTypeOf returns false, then raise an error rather
  // than continuing execution.
  if (runtimeType.isTypeOf && !runtimeType.isTypeOf(result, info)) {
    throw new _error.GraphQLError('Expected value of type "' + runtimeType + '" but got: ' + result + '.', fieldASTs);
  }

  // Collect sub-fields to execute to complete this value.
  var subFieldASTs = _Object$create(null);
  var visitedFragmentNames = _Object$create(null);
  for (var i = 0; i < fieldASTs.length; i++) {
    var selectionSet = fieldASTs[i].selectionSet;
    if (selectionSet) {
      subFieldASTs = collectFields(exeContext, runtimeType, selectionSet, subFieldASTs, visitedFragmentNames);
    }
  }

  return executeFields(exeContext, runtimeType, result, subFieldASTs);
}

/**
 * If a resolve function is not given, then a default resolve behavior is used
 * which takes the property of the source object of the same name as the field
 * and returns it as the result, or if it's a function, returns the result
 * of calling that function.
 */
function defaultResolveFn(source, args, _ref) {
  var fieldName = _ref.fieldName;

  // ensure source is a value for which property access is acceptable.
  if (typeof source !== 'number' && typeof source !== 'string' && source) {
    var property = source[fieldName];
    return typeof property === 'function' ? property.call(source) : property;
  }
}

/**
 * Checks to see if this object acts like a Promise, i.e. has a "then"
 * function.
 */
function isThenable(value) {
  return typeof value === 'object' && value !== null && typeof value.then === 'function';
}

/**
 * This method looks up the field on the given type defintion.
 * It has special casing for the two introspection fields, __schema
 * and __typename. __typename is special because it can always be
 * queried as a field, even in situations where no other fields
 * are allowed, like on a Union. __schema could get automatically
 * added to the query type, but that would require mutating type
 * definitions, which would cause issues.
 */
function getFieldDef(schema, parentType, fieldName) {
  if (fieldName === _typeIntrospection.SchemaMetaFieldDef.name && schema.getQueryType() === parentType) {
    return _typeIntrospection.SchemaMetaFieldDef;
  } else if (fieldName === _typeIntrospection.TypeMetaFieldDef.name && schema.getQueryType() === parentType) {
    return _typeIntrospection.TypeMetaFieldDef;
  } else if (fieldName === _typeIntrospection.TypeNameMetaFieldDef.name) {
    return _typeIntrospection.TypeNameMetaFieldDef;
  }
  return parentType.getFields()[fieldName];
}
},{"../error":150,"../jsutils/find":158,"../jsutils/invariant":159,"../jsutils/isNullish":160,"../language":163,"../type/definition":171,"../type/directives":172,"../type/introspection":174,"../type/schema":176,"../utilities/typeFromAST":190,"./values":155,"babel-runtime/core-js/object/create":9,"babel-runtime/core-js/object/keys":12,"babel-runtime/core-js/promise":14,"babel-runtime/helpers/interop-require-default":21}],154:[function(require,module,exports){
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _execute = require('./execute');

Object.defineProperty(exports, 'execute', {
  enumerable: true,
  get: function get() {
    return _execute.execute;
  }
});
},{"./execute":153}],155:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Prepares an object map of variableValues of the correct type based on the
 * provided variable definitions and arbitrary input. If the input cannot be
 * parsed to match the variable definitions, a GraphQLError will be thrown.
 */
'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getVariableValues = getVariableValues;
exports.getArgumentValues = getArgumentValues;

var _error = require('../error');

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _jsutilsKeyMap = require('../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _utilitiesTypeFromAST = require('../utilities/typeFromAST');

var _utilitiesValueFromAST = require('../utilities/valueFromAST');

var _utilitiesIsValidJSValue = require('../utilities/isValidJSValue');

var _languagePrinter = require('../language/printer');

var _typeDefinition = require('../type/definition');

function getVariableValues(schema, definitionASTs, inputs) {
  return definitionASTs.reduce(function (values, defAST) {
    var varName = defAST.variable.name.value;
    values[varName] = getVariableValue(schema, defAST, inputs[varName]);
    return values;
  }, {});
}

/**
 * Prepares an object map of argument values given a list of argument
 * definitions and list of argument AST nodes.
 */

function getArgumentValues(argDefs, argASTs, variableValues) {
  if (!argDefs || !argASTs) {
    return {};
  }
  var argASTMap = (0, _jsutilsKeyMap2['default'])(argASTs, function (arg) {
    return arg.name.value;
  });
  return argDefs.reduce(function (result, argDef) {
    var name = argDef.name;
    var valueAST = argASTMap[name] ? argASTMap[name].value : null;
    var value = (0, _utilitiesValueFromAST.valueFromAST)(valueAST, argDef.type, variableValues);
    if ((0, _jsutilsIsNullish2['default'])(value)) {
      value = argDef.defaultValue;
    }
    if (!(0, _jsutilsIsNullish2['default'])(value)) {
      result[name] = value;
    }
    return result;
  }, {});
}

/**
 * Given a variable definition, and any value of input, return a value which
 * adheres to the variable definition, or throw an error.
 */
function getVariableValue(schema, definitionAST, input) {
  var type = (0, _utilitiesTypeFromAST.typeFromAST)(schema, definitionAST.type);
  var variable = definitionAST.variable;
  if (!type || !(0, _typeDefinition.isInputType)(type)) {
    throw new _error.GraphQLError('Variable "$' + variable.name.value + '" expected value of type ' + ('"' + (0, _languagePrinter.print)(definitionAST.type) + '" which cannot be used as an input type.'), [definitionAST]);
  }
  var inputType = type;
  var errors = (0, _utilitiesIsValidJSValue.isValidJSValue)(input, inputType);
  if (!errors.length) {
    if ((0, _jsutilsIsNullish2['default'])(input)) {
      var defaultValue = definitionAST.defaultValue;
      if (defaultValue) {
        return (0, _utilitiesValueFromAST.valueFromAST)(defaultValue, inputType);
      }
    }
    return coerceValue(inputType, input);
  }
  if ((0, _jsutilsIsNullish2['default'])(input)) {
    throw new _error.GraphQLError('Variable "$' + variable.name.value + '" of required type ' + ('"' + (0, _languagePrinter.print)(definitionAST.type) + '" was not provided.'), [definitionAST]);
  }
  var message = errors ? '\n' + errors.join('\n') : '';
  throw new _error.GraphQLError('Variable "$' + variable.name.value + '" got invalid value ' + (JSON.stringify(input) + '.' + message), [definitionAST]);
}

/**
 * Given a type and any value, return a runtime value coerced to match the type.
 */
function coerceValue(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var type = _x,
        value = _x2;
    _value = _ret = _ret2 = parsed = undefined;
    _again = false;

    // Ensure flow knows that we treat function params as const.
    var _value = value;

    if (type instanceof _typeDefinition.GraphQLNonNull) {
      // Note: we're not checking that the result of coerceValue is non-null.
      // We only call this function after calling isValidJSValue.
      _x = type.ofType;
      _x2 = _value;
      _again = true;
      continue _function;
    }

    if ((0, _jsutilsIsNullish2['default'])(_value)) {
      return null;
    }

    if (type instanceof _typeDefinition.GraphQLList) {
      var _ret = (function () {
        var itemType = type.ofType;
        // TODO: support iterable input
        if (Array.isArray(_value)) {
          return {
            v: _value.map(function (item) {
              return coerceValue(itemType, item);
            })
          };
        }
        return {
          v: [coerceValue(itemType, _value)]
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    }

    if (type instanceof _typeDefinition.GraphQLInputObjectType) {
      var _ret2 = (function () {
        if (typeof _value !== 'object' || _value === null) {
          return {
            v: null
          };
        }
        var fields = type.getFields();
        return {
          v: _Object$keys(fields).reduce(function (obj, fieldName) {
            var field = fields[fieldName];
            var fieldValue = coerceValue(field.type, _value[fieldName]);
            if ((0, _jsutilsIsNullish2['default'])(fieldValue)) {
              fieldValue = field.defaultValue;
            }
            if (!(0, _jsutilsIsNullish2['default'])(fieldValue)) {
              obj[fieldName] = fieldValue;
            }
            return obj;
          }, {})
        };
      })();

      if (typeof _ret2 === 'object') return _ret2.v;
    }

    (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLScalarType || type instanceof _typeDefinition.GraphQLEnumType, 'Must be input type');

    var parsed = type.parseValue(_value);
    if (!(0, _jsutilsIsNullish2['default'])(parsed)) {
      return parsed;
    }
  }
}
},{"../error":150,"../jsutils/invariant":159,"../jsutils/isNullish":160,"../jsutils/keyMap":161,"../language/printer":168,"../type/definition":171,"../utilities/isValidJSValue":186,"../utilities/typeFromAST":190,"../utilities/valueFromAST":191,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/interop-require-default":21}],156:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * This is the primary entry point function for fulfilling GraphQL operations
 * by parsing, validating, and executing a GraphQL document along side a
 * GraphQL schema.
 *
 * More sophisticated GraphQL servers, such as those which persist queries,
 * may wish to separate the validation and execution phases to a static time
 * tooling step, and a server runtime step.
 *
 * schema:
 *    The GraphQL type system to use when validating and executing a query.
 * requestString:
 *    A GraphQL language formatted string representing the requested operation.
 * rootValue:
 *    The value provided as the first argument to resolver functions on the top
 *    level type (e.g. the query object type).
 * variableValues:
 *    A mapping of variable name to runtime value to use for all variables
 *    defined in the requestString.
 * operationName:
 *    The name of the operation to use if requestString contains multiple
 *    possible operations. Can be omitted if requestString contains only
 *    one operation.
 */
'use strict';

var _Promise = require('babel-runtime/core-js/promise')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.graphql = graphql;

/**
 * The result of a GraphQL parse, validation and execution.
 *
 * `data` is the result of a successful execution of the query.
 * `errors` is included when any errors occurred as a non-empty array.
 */

var _languageSource = require('./language/source');

var _languageParser = require('./language/parser');

var _validationValidate = require('./validation/validate');

var _executionExecute = require('./execution/execute');

function graphql(schema, requestString, rootValue, variableValues, operationName) {
  return new _Promise(function (resolve) {
    var source = new _languageSource.Source(requestString || '', 'GraphQL request');
    var documentAST = (0, _languageParser.parse)(source);
    var validationErrors = (0, _validationValidate.validate)(schema, documentAST);
    if (validationErrors.length > 0) {
      resolve({ errors: validationErrors });
    } else {
      resolve((0, _executionExecute.execute)(schema, documentAST, rootValue, variableValues, operationName));
    }
  })['catch'](function (error) {
    return { errors: [error] };
  });
}
},{"./execution/execute":153,"./language/parser":167,"./language/source":169,"./validation/validate":218,"babel-runtime/core-js/promise":14}],157:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * GraphQL.js provides a reference implementation for the GraphQL specification
 * but is also a useful utility for operating on GraphQL files and building
 * sophisticated tools.
 *
 * This primary module exports a general purpose function for fulfilling all
 * steps of the GraphQL specification in a single operation, but also includes
 * utilities for every part of the GraphQL specification:
 *
 *   - Parsing the GraphQL language.
 *   - Building a GraphQL type schema.
 *   - Validating a GraphQL request against a type schema.
 *   - Executing a GraphQL request against a type schema.
 *
 * This also includes utility functions for operating on GraphQL types and
 * GraphQL documents to facilitate building tools.
 *
 * You may also import from each sub-directory directly. For example, the
 * following two import statements are equivalent:
 *
 *     import { parse } from 'graphql';
 *     import { parse } from 'graphql/language';
 */

// The primary entry point into fulfilling a GraphQL request.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _graphql = require('./graphql');

Object.defineProperty(exports, 'graphql', {
  enumerable: true,
  get: function get() {
    return _graphql.graphql;
  }
});

// Create and operate on GraphQL type definitions and schema.

var _type = require('./type');

Object.defineProperty(exports, 'GraphQLSchema', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLSchema;
  }
});
Object.defineProperty(exports, 'GraphQLScalarType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLScalarType;
  }
});
Object.defineProperty(exports, 'GraphQLObjectType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLObjectType;
  }
});
Object.defineProperty(exports, 'GraphQLInterfaceType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLInterfaceType;
  }
});
Object.defineProperty(exports, 'GraphQLUnionType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLUnionType;
  }
});
Object.defineProperty(exports, 'GraphQLEnumType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLEnumType;
  }
});
Object.defineProperty(exports, 'GraphQLInputObjectType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLInputObjectType;
  }
});
Object.defineProperty(exports, 'GraphQLList', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLList;
  }
});
Object.defineProperty(exports, 'GraphQLNonNull', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLNonNull;
  }
});
Object.defineProperty(exports, 'GraphQLInt', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLInt;
  }
});
Object.defineProperty(exports, 'GraphQLFloat', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLFloat;
  }
});
Object.defineProperty(exports, 'GraphQLString', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLString;
  }
});
Object.defineProperty(exports, 'GraphQLBoolean', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLBoolean;
  }
});
Object.defineProperty(exports, 'GraphQLID', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLID;
  }
});
Object.defineProperty(exports, 'isType', {
  enumerable: true,
  get: function get() {
    return _type.isType;
  }
});
Object.defineProperty(exports, 'isInputType', {
  enumerable: true,
  get: function get() {
    return _type.isInputType;
  }
});
Object.defineProperty(exports, 'isOutputType', {
  enumerable: true,
  get: function get() {
    return _type.isOutputType;
  }
});
Object.defineProperty(exports, 'isLeafType', {
  enumerable: true,
  get: function get() {
    return _type.isLeafType;
  }
});
Object.defineProperty(exports, 'isCompositeType', {
  enumerable: true,
  get: function get() {
    return _type.isCompositeType;
  }
});
Object.defineProperty(exports, 'isAbstractType', {
  enumerable: true,
  get: function get() {
    return _type.isAbstractType;
  }
});
Object.defineProperty(exports, 'getNullableType', {
  enumerable: true,
  get: function get() {
    return _type.getNullableType;
  }
});
Object.defineProperty(exports, 'getNamedType', {
  enumerable: true,
  get: function get() {
    return _type.getNamedType;
  }
});

// Parse and operate on GraphQL language source files.

var _language = require('./language');

Object.defineProperty(exports, 'Source', {
  enumerable: true,
  get: function get() {
    return _language.Source;
  }
});
Object.defineProperty(exports, 'getLocation', {
  enumerable: true,
  get: function get() {
    return _language.getLocation;
  }
});
Object.defineProperty(exports, 'parse', {
  enumerable: true,
  get: function get() {
    return _language.parse;
  }
});
Object.defineProperty(exports, 'parseValue', {
  enumerable: true,
  get: function get() {
    return _language.parseValue;
  }
});
Object.defineProperty(exports, 'print', {
  enumerable: true,
  get: function get() {
    return _language.print;
  }
});
Object.defineProperty(exports, 'visit', {
  enumerable: true,
  get: function get() {
    return _language.visit;
  }
});
Object.defineProperty(exports, 'Kind', {
  enumerable: true,
  get: function get() {
    return _language.Kind;
  }
});
Object.defineProperty(exports, 'BREAK', {
  enumerable: true,
  get: function get() {
    return _language.BREAK;
  }
});

// Execute GraphQL queries.

var _execution = require('./execution');

Object.defineProperty(exports, 'execute', {
  enumerable: true,
  get: function get() {
    return _execution.execute;
  }
});

// Validate GraphQL queries.

var _validation = require('./validation');

Object.defineProperty(exports, 'validate', {
  enumerable: true,
  get: function get() {
    return _validation.validate;
  }
});
Object.defineProperty(exports, 'specifiedRules', {
  enumerable: true,
  get: function get() {
    return _validation.specifiedRules;
  }
});

// Create and format GraphQL errors.

var _error = require('./error');

Object.defineProperty(exports, 'GraphQLError', {
  enumerable: true,
  get: function get() {
    return _error.GraphQLError;
  }
});
Object.defineProperty(exports, 'formatError', {
  enumerable: true,
  get: function get() {
    return _error.formatError;
  }
});

// Utilities for operating on GraphQL type schema and parsed sources.

var _utilities = require('./utilities');

Object.defineProperty(exports, 'introspectionQuery', {
  enumerable: true,
  get: function get() {
    return _utilities.introspectionQuery;
  }
});
Object.defineProperty(exports, 'getOperationAST', {
  enumerable: true,
  get: function get() {
    return _utilities.getOperationAST;
  }
});
Object.defineProperty(exports, 'buildClientSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.buildClientSchema;
  }
});
Object.defineProperty(exports, 'buildASTSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.buildASTSchema;
  }
});
Object.defineProperty(exports, 'extendSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.extendSchema;
  }
});
Object.defineProperty(exports, 'printSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.printSchema;
  }
});
Object.defineProperty(exports, 'typeFromAST', {
  enumerable: true,
  get: function get() {
    return _utilities.typeFromAST;
  }
});
Object.defineProperty(exports, 'valueFromAST', {
  enumerable: true,
  get: function get() {
    return _utilities.valueFromAST;
  }
});
Object.defineProperty(exports, 'astFromValue', {
  enumerable: true,
  get: function get() {
    return _utilities.astFromValue;
  }
});
Object.defineProperty(exports, 'TypeInfo', {
  enumerable: true,
  get: function get() {
    return _utilities.TypeInfo;
  }
});
Object.defineProperty(exports, 'isValidJSValue', {
  enumerable: true,
  get: function get() {
    return _utilities.isValidJSValue;
  }
});
Object.defineProperty(exports, 'isValidLiteralValue', {
  enumerable: true,
  get: function get() {
    return _utilities.isValidLiteralValue;
  }
});
Object.defineProperty(exports, 'concatAST', {
  enumerable: true,
  get: function get() {
    return _utilities.concatAST;
  }
});
Object.defineProperty(exports, 'isEqualType', {
  enumerable: true,
  get: function get() {
    return _utilities.isEqualType;
  }
});
Object.defineProperty(exports, 'isTypeSubTypeOf', {
  enumerable: true,
  get: function get() {
    return _utilities.isTypeSubTypeOf;
  }
});
Object.defineProperty(exports, 'doTypesOverlap', {
  enumerable: true,
  get: function get() {
    return _utilities.doTypesOverlap;
  }
});

// Definitions

// Scalars

// Predicates

// Un-modifiers

// Parse

// Print

// Visit

// The GraphQL query recommended for a full schema introspection.

// Gets the target Operation from a Document

// Build a GraphQLSchema from an introspection result.

// Build a GraphQLSchema from a parsed GraphQL Schema language AST.

// Extends an existing GraphQLSchema from a parsed GraphQL Schema
// language AST.

// Print a GraphQLSchema to GraphQL Schema language.

// Create a GraphQLType from a GraphQL language AST.

// Create a JavaScript value from a GraphQL language AST.

// Create a GraphQL language AST from a JavaScript value.

// A helper to use within recursive-descent visitors which need to be aware of
// the GraphQL type system.

// Determine if JavaScript values adhere to a GraphQL type.

// Determine if AST values adhere to a GraphQL type.

// Concatenates multiple AST together.

// Comparators for types
},{"./error":150,"./execution":154,"./graphql":156,"./language":163,"./type":173,"./utilities":184,"./validation":192}],158:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = find;

function find(list, predicate) {
  for (var i = 0; i < list.length; i++) {
    if (predicate(list[i])) {
      return list[i];
    }
  }
}

module.exports = exports["default"];
},{}],159:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = invariant;

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

module.exports = exports["default"];
},{}],160:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Returns true if a value is null, undefined, or NaN.
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = isNullish;

function isNullish(value) {
  return value === null || value === undefined || value !== value;
}

module.exports = exports["default"];
},{}],161:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Creates a keyed JS object from an array, given a function to produce the keys
 * for each value in the array.
 *
 * This provides a convenient lookup for the array items if the key function
 * produces unique results.
 *
 *     const phoneBook = [
 *       { name: 'Jon', num: '555-1234' },
 *       { name: 'Jenny', num: '867-5309' }
 *     ]
 *
 *     // { Jon: { name: 'Jon', num: '555-1234' },
 *     //   Jenny: { name: 'Jenny', num: '867-5309' } }
 *     const entriesByName = keyMap(
 *       phoneBook,
 *       entry => entry.name
 *     )
 *
 *     // { name: 'Jenny', num: '857-6309' }
 *     const jennyEntry = entriesByName['Jenny']
 *
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = keyMap;

function keyMap(list, keyFn) {
  return list.reduce(function (map, item) {
    return (map[keyFn(item)] = item, map);
  }, {});
}

module.exports = exports["default"];
},{}],162:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Creates a keyed JS object from an array, given a function to produce the keys
 * and a function to produce the values from each item in the array.
 *
 *     const phoneBook = [
 *       { name: 'Jon', num: '555-1234' },
 *       { name: 'Jenny', num: '867-5309' }
 *     ]
 *
 *     // { Jon: '555-1234', Jenny: '867-5309' }
 *     const phonesByName = keyValMap(
 *       phoneBook,
 *       entry => entry.name,
 *       entry => entry.num
 *     )
 *
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = keyValMap;

function keyValMap(list, keyFn, valFn) {
  return list.reduce(function (map, item) {
    return (map[keyFn(item)] = valFn(item), map);
  }, {});
}

module.exports = exports["default"];
},{}],163:[function(require,module,exports){
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _interopRequireWildcard = require('babel-runtime/helpers/interop-require-wildcard')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _kinds = require('./kinds');

var Kind = _interopRequireWildcard(_kinds);

var _location = require('./location');

Object.defineProperty(exports, 'getLocation', {
  enumerable: true,
  get: function get() {
    return _location.getLocation;
  }
});
exports.Kind = Kind;

var _lexer = require('./lexer');

Object.defineProperty(exports, 'lex', {
  enumerable: true,
  get: function get() {
    return _lexer.lex;
  }
});

var _parser = require('./parser');

Object.defineProperty(exports, 'parse', {
  enumerable: true,
  get: function get() {
    return _parser.parse;
  }
});
Object.defineProperty(exports, 'parseValue', {
  enumerable: true,
  get: function get() {
    return _parser.parseValue;
  }
});

var _printer = require('./printer');

Object.defineProperty(exports, 'print', {
  enumerable: true,
  get: function get() {
    return _printer.print;
  }
});

var _source = require('./source');

Object.defineProperty(exports, 'Source', {
  enumerable: true,
  get: function get() {
    return _source.Source;
  }
});

var _visitor = require('./visitor');

Object.defineProperty(exports, 'visit', {
  enumerable: true,
  get: function get() {
    return _visitor.visit;
  }
});
Object.defineProperty(exports, 'BREAK', {
  enumerable: true,
  get: function get() {
    return _visitor.BREAK;
  }
});
},{"./kinds":164,"./lexer":165,"./location":166,"./parser":167,"./printer":168,"./source":169,"./visitor":170,"babel-runtime/helpers/interop-require-wildcard":22}],164:[function(require,module,exports){
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

// Name

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var NAME = 'Name';

exports.NAME = NAME;
// Document

var DOCUMENT = 'Document';
exports.DOCUMENT = DOCUMENT;
var OPERATION_DEFINITION = 'OperationDefinition';
exports.OPERATION_DEFINITION = OPERATION_DEFINITION;
var VARIABLE_DEFINITION = 'VariableDefinition';
exports.VARIABLE_DEFINITION = VARIABLE_DEFINITION;
var VARIABLE = 'Variable';
exports.VARIABLE = VARIABLE;
var SELECTION_SET = 'SelectionSet';
exports.SELECTION_SET = SELECTION_SET;
var FIELD = 'Field';
exports.FIELD = FIELD;
var ARGUMENT = 'Argument';

exports.ARGUMENT = ARGUMENT;
// Fragments

var FRAGMENT_SPREAD = 'FragmentSpread';
exports.FRAGMENT_SPREAD = FRAGMENT_SPREAD;
var INLINE_FRAGMENT = 'InlineFragment';
exports.INLINE_FRAGMENT = INLINE_FRAGMENT;
var FRAGMENT_DEFINITION = 'FragmentDefinition';

exports.FRAGMENT_DEFINITION = FRAGMENT_DEFINITION;
// Values

var INT = 'IntValue';
exports.INT = INT;
var FLOAT = 'FloatValue';
exports.FLOAT = FLOAT;
var STRING = 'StringValue';
exports.STRING = STRING;
var BOOLEAN = 'BooleanValue';
exports.BOOLEAN = BOOLEAN;
var ENUM = 'EnumValue';
exports.ENUM = ENUM;
var LIST = 'ListValue';
exports.LIST = LIST;
var OBJECT = 'ObjectValue';
exports.OBJECT = OBJECT;
var OBJECT_FIELD = 'ObjectField';

exports.OBJECT_FIELD = OBJECT_FIELD;
// Directives

var DIRECTIVE = 'Directive';

exports.DIRECTIVE = DIRECTIVE;
// Types

var NAMED_TYPE = 'NamedType';
exports.NAMED_TYPE = NAMED_TYPE;
var LIST_TYPE = 'ListType';
exports.LIST_TYPE = LIST_TYPE;
var NON_NULL_TYPE = 'NonNullType';

exports.NON_NULL_TYPE = NON_NULL_TYPE;
// Type Definitions

var OBJECT_TYPE_DEFINITION = 'ObjectTypeDefinition';
exports.OBJECT_TYPE_DEFINITION = OBJECT_TYPE_DEFINITION;
var FIELD_DEFINITION = 'FieldDefinition';
exports.FIELD_DEFINITION = FIELD_DEFINITION;
var INPUT_VALUE_DEFINITION = 'InputValueDefinition';
exports.INPUT_VALUE_DEFINITION = INPUT_VALUE_DEFINITION;
var INTERFACE_TYPE_DEFINITION = 'InterfaceTypeDefinition';
exports.INTERFACE_TYPE_DEFINITION = INTERFACE_TYPE_DEFINITION;
var UNION_TYPE_DEFINITION = 'UnionTypeDefinition';
exports.UNION_TYPE_DEFINITION = UNION_TYPE_DEFINITION;
var SCALAR_TYPE_DEFINITION = 'ScalarTypeDefinition';
exports.SCALAR_TYPE_DEFINITION = SCALAR_TYPE_DEFINITION;
var ENUM_TYPE_DEFINITION = 'EnumTypeDefinition';
exports.ENUM_TYPE_DEFINITION = ENUM_TYPE_DEFINITION;
var ENUM_VALUE_DEFINITION = 'EnumValueDefinition';
exports.ENUM_VALUE_DEFINITION = ENUM_VALUE_DEFINITION;
var INPUT_OBJECT_TYPE_DEFINITION = 'InputObjectTypeDefinition';
exports.INPUT_OBJECT_TYPE_DEFINITION = INPUT_OBJECT_TYPE_DEFINITION;
var TYPE_EXTENSION_DEFINITION = 'TypeExtensionDefinition';
exports.TYPE_EXTENSION_DEFINITION = TYPE_EXTENSION_DEFINITION;
},{}],165:[function(require,module,exports){
/*  /
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * A representation of a lexed Token. Value only appears for non-punctuation
 * tokens: NAME, INT, FLOAT, and STRING.
 */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.lex = lex;
exports.getTokenDesc = getTokenDesc;
exports.getTokenKindDesc = getTokenKindDesc;

var _error = require('../error');

/**
 * Given a Source object, this returns a Lexer for that source.
 * A Lexer is a function that acts like a generator in that every time
 * it is called, it returns the next token in the Source. Assuming the
 * source lexes, the final Token emitted by the lexer will be of kind
 * EOF, after which the lexer will repeatedly return EOF tokens whenever
 * called.
 *
 * The argument to the lexer function is optional, and can be used to
 * rewind or fast forward the lexer to a new position in the source.
 */

function lex(source) {
  var prevPosition = 0;
  return function nextToken(resetPosition) {
    var token = readToken(source, resetPosition === undefined ? prevPosition : resetPosition);
    prevPosition = token.end;
    return token;
  };
}

/**
 * An enum describing the different kinds of tokens that the lexer emits.
 */
var TokenKind = {
  EOF: 1,
  BANG: 2,
  DOLLAR: 3,
  PAREN_L: 4,
  PAREN_R: 5,
  SPREAD: 6,
  COLON: 7,
  EQUALS: 8,
  AT: 9,
  BRACKET_L: 10,
  BRACKET_R: 11,
  BRACE_L: 12,
  PIPE: 13,
  BRACE_R: 14,
  NAME: 15,
  INT: 16,
  FLOAT: 17,
  STRING: 18
};

exports.TokenKind = TokenKind;
/**
 * A helper function to describe a token as a string for debugging
 */

function getTokenDesc(token) {
  return token.value ? getTokenKindDesc(token.kind) + ' "' + token.value + '"' : getTokenKindDesc(token.kind);
}

/**
 * A helper function to describe a token kind as a string for debugging
 */

function getTokenKindDesc(kind) {
  return tokenDescription[kind];
}

var tokenDescription = {};
tokenDescription[TokenKind.EOF] = 'EOF';
tokenDescription[TokenKind.BANG] = '!';
tokenDescription[TokenKind.DOLLAR] = '$';
tokenDescription[TokenKind.PAREN_L] = '(';
tokenDescription[TokenKind.PAREN_R] = ')';
tokenDescription[TokenKind.SPREAD] = '...';
tokenDescription[TokenKind.COLON] = ':';
tokenDescription[TokenKind.EQUALS] = '=';
tokenDescription[TokenKind.AT] = '@';
tokenDescription[TokenKind.BRACKET_L] = '[';
tokenDescription[TokenKind.BRACKET_R] = ']';
tokenDescription[TokenKind.BRACE_L] = '{';
tokenDescription[TokenKind.PIPE] = '|';
tokenDescription[TokenKind.BRACE_R] = '}';
tokenDescription[TokenKind.NAME] = 'Name';
tokenDescription[TokenKind.INT] = 'Int';
tokenDescription[TokenKind.FLOAT] = 'Float';
tokenDescription[TokenKind.STRING] = 'String';

var charCodeAt = String.prototype.charCodeAt;
var slice = String.prototype.slice;

/**
 * Helper function for constructing the Token object.
 */
function makeToken(kind, start, end, value) {
  return { kind: kind, start: start, end: end, value: value };
}

function printCharCode(code) {
  return(
    // NaN/undefined represents access beyond the end of the file.
    isNaN(code) ? '<EOF>' :
    // Trust JSON for ASCII.
    code < 0x007F ? JSON.stringify(String.fromCharCode(code)) :
    // Otherwise print the escaped form.
    '"\\u' + ('00' + code.toString(16).toUpperCase()).slice(-4) + '"'
  );
}

/**
 * Gets the next token from the source starting at the given position.
 *
 * This skips over whitespace and comments until it finds the next lexable
 * token, then lexes punctuators immediately or calls the appropriate helper
 * function for more complicated tokens.
 */
function readToken(source, fromPosition) {
  var body = source.body;
  var bodyLength = body.length;

  var position = positionAfterWhitespace(body, fromPosition);

  if (position >= bodyLength) {
    return makeToken(TokenKind.EOF, position, position);
  }

  var code = charCodeAt.call(body, position);

  // SourceCharacter
  if (code < 0x0020 && code !== 0x0009 && code !== 0x000A && code !== 0x000D) {
    throw (0, _error.syntaxError)(source, position, 'Invalid character ' + printCharCode(code) + '.');
  }

  switch (code) {
    // !
    case 33:
      return makeToken(TokenKind.BANG, position, position + 1);
    // $
    case 36:
      return makeToken(TokenKind.DOLLAR, position, position + 1);
    // (
    case 40:
      return makeToken(TokenKind.PAREN_L, position, position + 1);
    // )
    case 41:
      return makeToken(TokenKind.PAREN_R, position, position + 1);
    // .
    case 46:
      if (charCodeAt.call(body, position + 1) === 46 && charCodeAt.call(body, position + 2) === 46) {
        return makeToken(TokenKind.SPREAD, position, position + 3);
      }
      break;
    // :
    case 58:
      return makeToken(TokenKind.COLON, position, position + 1);
    // =
    case 61:
      return makeToken(TokenKind.EQUALS, position, position + 1);
    // @
    case 64:
      return makeToken(TokenKind.AT, position, position + 1);
    // [
    case 91:
      return makeToken(TokenKind.BRACKET_L, position, position + 1);
    // ]
    case 93:
      return makeToken(TokenKind.BRACKET_R, position, position + 1);
    // {
    case 123:
      return makeToken(TokenKind.BRACE_L, position, position + 1);
    // |
    case 124:
      return makeToken(TokenKind.PIPE, position, position + 1);
    // }
    case 125:
      return makeToken(TokenKind.BRACE_R, position, position + 1);
    // A-Z
    case 65:case 66:case 67:case 68:case 69:case 70:case 71:case 72:
    case 73:case 74:case 75:case 76:case 77:case 78:case 79:case 80:
    case 81:case 82:case 83:case 84:case 85:case 86:case 87:case 88:
    case 89:case 90:
    // _
    case 95:
    // a-z
    case 97:case 98:case 99:case 100:case 101:case 102:case 103:case 104:
    case 105:case 106:case 107:case 108:case 109:case 110:case 111:
    case 112:case 113:case 114:case 115:case 116:case 117:case 118:
    case 119:case 120:case 121:case 122:
      return readName(source, position);
    // -
    case 45:
    // 0-9
    case 48:case 49:case 50:case 51:case 52:
    case 53:case 54:case 55:case 56:case 57:
      return readNumber(source, position, code);
    // "
    case 34:
      return readString(source, position);
  }

  throw (0, _error.syntaxError)(source, position, 'Unexpected character ' + printCharCode(code) + '.');
}

/**
 * Reads from body starting at startPosition until it finds a non-whitespace
 * or commented character, then returns the position of that character for
 * lexing.
 */
function positionAfterWhitespace(body, startPosition) {
  var bodyLength = body.length;
  var position = startPosition;
  while (position < bodyLength) {
    var code = charCodeAt.call(body, position);
    // Skip Ignored
    if (
    // BOM
    code === 0xFEFF ||
    // White Space
    code === 0x0009 || // tab
    code === 0x0020 || // space
    // Line Terminator
    code === 0x000A || // new line
    code === 0x000D || // carriage return
    // Comma
    code === 0x002C) {
      ++position;
      // Skip comments
    } else if (code === 35) {
        // #
        ++position;
        while (position < bodyLength && (code = charCodeAt.call(body, position)) !== null && (
        // SourceCharacter but not LineTerminator
        code > 0x001F || code === 0x0009) && code !== 0x000A && code !== 0x000D) {
          ++position;
        }
      } else {
        break;
      }
  }
  return position;
}

/**
 * Reads a number token from the source file, either a float
 * or an int depending on whether a decimal point appears.
 *
 * Int:   -?(0|[1-9][0-9]*)
 * Float: -?(0|[1-9][0-9]*)(\.[0-9]+)?((E|e)(+|-)?[0-9]+)?
 */
function readNumber(source, start, firstCode) {
  var body = source.body;
  var code = firstCode;
  var position = start;
  var isFloat = false;

  if (code === 45) {
    // -
    code = charCodeAt.call(body, ++position);
  }

  if (code === 48) {
    // 0
    code = charCodeAt.call(body, ++position);
    if (code >= 48 && code <= 57) {
      throw (0, _error.syntaxError)(source, position, 'Invalid number, unexpected digit after 0: ' + printCharCode(code) + '.');
    }
  } else {
    position = readDigits(source, position, code);
    code = charCodeAt.call(body, position);
  }

  if (code === 46) {
    // .
    isFloat = true;

    code = charCodeAt.call(body, ++position);
    position = readDigits(source, position, code);
    code = charCodeAt.call(body, position);
  }

  if (code === 69 || code === 101) {
    // E e
    isFloat = true;

    code = charCodeAt.call(body, ++position);
    if (code === 43 || code === 45) {
      // + -
      code = charCodeAt.call(body, ++position);
    }
    position = readDigits(source, position, code);
  }

  return makeToken(isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, slice.call(body, start, position));
}

/**
 * Returns the new position in the source after reading digits.
 */
function readDigits(source, start, firstCode) {
  var body = source.body;
  var position = start;
  var code = firstCode;
  if (code >= 48 && code <= 57) {
    // 0 - 9
    do {
      code = charCodeAt.call(body, ++position);
    } while (code >= 48 && code <= 57); // 0 - 9
    return position;
  }
  throw (0, _error.syntaxError)(source, position, 'Invalid number, expected digit but got: ' + printCharCode(code) + '.');
}

/**
 * Reads a string token from the source file.
 *
 * "([^"\\\u000A\u000D]|(\\(u[0-9a-fA-F]{4}|["\\/bfnrt])))*"
 */
function readString(source, start) {
  var body = source.body;
  var position = start + 1;
  var chunkStart = position;
  var code = 0;
  var value = '';

  while (position < body.length && (code = charCodeAt.call(body, position)) !== null &&
  // not LineTerminator
  code !== 0x000A && code !== 0x000D &&
  // not Quote (")
  code !== 34) {
    // SourceCharacter
    if (code < 0x0020 && code !== 0x0009) {
      throw (0, _error.syntaxError)(source, position, 'Invalid character within String: ' + printCharCode(code) + '.');
    }

    ++position;
    if (code === 92) {
      // \
      value += slice.call(body, chunkStart, position - 1);
      code = charCodeAt.call(body, position);
      switch (code) {
        case 34:
          value += '"';break;
        case 47:
          value += '\/';break;
        case 92:
          value += '\\';break;
        case 98:
          value += '\b';break;
        case 102:
          value += '\f';break;
        case 110:
          value += '\n';break;
        case 114:
          value += '\r';break;
        case 116:
          value += '\t';break;
        case 117:
          // u
          var charCode = uniCharCode(charCodeAt.call(body, position + 1), charCodeAt.call(body, position + 2), charCodeAt.call(body, position + 3), charCodeAt.call(body, position + 4));
          if (charCode < 0) {
            throw (0, _error.syntaxError)(source, position, 'Invalid character escape sequence: ' + ('\\u' + body.slice(position + 1, position + 5) + '.'));
          }
          value += String.fromCharCode(charCode);
          position += 4;
          break;
        default:
          throw (0, _error.syntaxError)(source, position, 'Invalid character escape sequence: \\' + String.fromCharCode(code) + '.');
      }
      ++position;
      chunkStart = position;
    }
  }

  if (code !== 34) {
    // quote (")
    throw (0, _error.syntaxError)(source, position, 'Unterminated string.');
  }

  value += slice.call(body, chunkStart, position);
  return makeToken(TokenKind.STRING, start, position + 1, value);
}

/**
 * Converts four hexidecimal chars to the integer that the
 * string represents. For example, uniCharCode('0','0','0','f')
 * will return 15, and uniCharCode('0','0','f','f') returns 255.
 *
 * Returns a negative number on error, if a char was invalid.
 *
 * This is implemented by noting that char2hex() returns -1 on error,
 * which means the result of ORing the char2hex() will also be negative.
 */
function uniCharCode(a, b, c, d) {
  return char2hex(a) << 12 | char2hex(b) << 8 | char2hex(c) << 4 | char2hex(d);
}

/**
 * Converts a hex character to its integer value.
 * '0' becomes 0, '9' becomes 9
 * 'A' becomes 10, 'F' becomes 15
 * 'a' becomes 10, 'f' becomes 15
 *
 * Returns -1 on error.
 */
function char2hex(a) {
  return a >= 48 && a <= 57 ? a - 48 : // 0-9
  a >= 65 && a <= 70 ? a - 55 : // A-F
  a >= 97 && a <= 102 ? a - 87 : // a-f
  -1;
}

/**
 * Reads an alphanumeric + underscore name from the source.
 *
 * [_A-Za-z][_0-9A-Za-z]*
 */
function readName(source, position) {
  var body = source.body;
  var bodyLength = body.length;
  var end = position + 1;
  var code = 0;
  while (end !== bodyLength && (code = charCodeAt.call(body, end)) !== null && (code === 95 || // _
  code >= 48 && code <= 57 || // 0-9
  code >= 65 && code <= 90 || // A-Z
  code >= 97 && code <= 122) // a-z
  ) {
    ++end;
  }
  return makeToken(TokenKind.NAME, position, end, slice.call(body, position, end));
}
},{"../error":150}],166:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Represents a location in a Source.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getLocation = getLocation;

/**
 * Takes a Source and a UTF-8 character offset, and returns the corresponding
 * line and column as a SourceLocation.
 */

function getLocation(source, position) {
  var lineRegexp = /\r\n|[\n\r]/g;
  var line = 1;
  var column = position + 1;
  var match = undefined;
  while ((match = lineRegexp.exec(source.body)) && match.index < position) {
    line += 1;
    column = position + 1 - (match.index + match[0].length);
  }
  return { line: line, column: column };
}
},{}],167:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * Configuration options to control parser behavior
 */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.parse = parse;
exports.parseValue = parseValue;
exports.parseConstValue = parseConstValue;
exports.parseType = parseType;
exports.parseNamedType = parseNamedType;

var _source = require('./source');

var _error = require('../error');

var _lexer = require('./lexer');

var _kinds = require('./kinds');

/**
 * Given a GraphQL source, parses it into a Document.
 * Throws GraphQLError if a syntax error is encountered.
 */

function parse(source, options) {
  var sourceObj = source instanceof _source.Source ? source : new _source.Source(source);
  var parser = makeParser(sourceObj, options || {});
  return parseDocument(parser);
}

/**
 * Given a string containing a GraphQL value, parse the AST for that value.
 * Throws GraphQLError if a syntax error is encountered.
 *
 * This is useful within tools that operate upon GraphQL Values directly and
 * in isolation of complete GraphQL documents.
 */

function parseValue(source, options) {
  var sourceObj = source instanceof _source.Source ? source : new _source.Source(source);
  var parser = makeParser(sourceObj, options || {});
  return parseValueLiteral(parser, false);
}

/**
 * Converts a name lex token into a name parse node.
 */
function parseName(parser) {
  var token = expect(parser, _lexer.TokenKind.NAME);
  return {
    kind: _kinds.NAME,
    value: token.value,
    loc: loc(parser, token.start)
  };
}

// Implements the parsing rules in the Document section.

/**
 * Document : Definition+
 */
function parseDocument(parser) {
  var start = parser.token.start;

  var definitions = [];
  do {
    definitions.push(parseDefinition(parser));
  } while (!skip(parser, _lexer.TokenKind.EOF));

  return {
    kind: _kinds.DOCUMENT,
    definitions: definitions,
    loc: loc(parser, start)
  };
}

/**
 * Definition :
 *   - OperationDefinition
 *   - FragmentDefinition
 *   - TypeDefinition
 *   - TypeExtensionDefinition
 */
function parseDefinition(parser) {
  if (peek(parser, _lexer.TokenKind.BRACE_L)) {
    return parseOperationDefinition(parser);
  }

  if (peek(parser, _lexer.TokenKind.NAME)) {
    switch (parser.token.value) {
      case 'query':
      case 'mutation':
      // Note: subscription is an experimental non-spec addition.
      case 'subscription':
        return parseOperationDefinition(parser);

      case 'fragment':
        return parseFragmentDefinition(parser);

      case 'type':
      case 'interface':
      case 'union':
      case 'scalar':
      case 'enum':
      case 'input':
        return parseTypeDefinition(parser);
      case 'extend':
        return parseTypeExtensionDefinition(parser);
    }
  }

  throw unexpected(parser);
}

// Implements the parsing rules in the Operations section.

/**
 * OperationDefinition :
 *  - SelectionSet
 *  - OperationType Name? VariableDefinitions? Directives? SelectionSet
 *
 * OperationType : one of query mutation
 */
function parseOperationDefinition(parser) {
  var start = parser.token.start;
  if (peek(parser, _lexer.TokenKind.BRACE_L)) {
    return {
      kind: _kinds.OPERATION_DEFINITION,
      operation: 'query',
      name: null,
      variableDefinitions: null,
      directives: [],
      selectionSet: parseSelectionSet(parser),
      loc: loc(parser, start)
    };
  }
  var operationToken = expect(parser, _lexer.TokenKind.NAME);
  var operation = operationToken.value === 'mutation' ? 'mutation' : operationToken.value === 'subscription' ? 'subscription' : operationToken.value === 'query' ? 'query' : (function () {
    throw unexpected(parser, operationToken);
  })();
  var name = undefined;
  if (peek(parser, _lexer.TokenKind.NAME)) {
    name = parseName(parser);
  }
  return {
    kind: _kinds.OPERATION_DEFINITION,
    operation: operation,
    name: name,
    variableDefinitions: parseVariableDefinitions(parser),
    directives: parseDirectives(parser),
    selectionSet: parseSelectionSet(parser),
    loc: loc(parser, start)
  };
}

/**
 * VariableDefinitions : ( VariableDefinition+ )
 */
function parseVariableDefinitions(parser) {
  return peek(parser, _lexer.TokenKind.PAREN_L) ? many(parser, _lexer.TokenKind.PAREN_L, parseVariableDefinition, _lexer.TokenKind.PAREN_R) : [];
}

/**
 * VariableDefinition : Variable : Type DefaultValue?
 */
function parseVariableDefinition(parser) {
  var start = parser.token.start;
  return {
    kind: _kinds.VARIABLE_DEFINITION,
    variable: parseVariable(parser),
    type: (expect(parser, _lexer.TokenKind.COLON), parseType(parser)),
    defaultValue: skip(parser, _lexer.TokenKind.EQUALS) ? parseValueLiteral(parser, true) : null,
    loc: loc(parser, start)
  };
}

/**
 * Variable : $ Name
 */
function parseVariable(parser) {
  var start = parser.token.start;
  expect(parser, _lexer.TokenKind.DOLLAR);
  return {
    kind: _kinds.VARIABLE,
    name: parseName(parser),
    loc: loc(parser, start)
  };
}

/**
 * SelectionSet : { Selection+ }
 */
function parseSelectionSet(parser) {
  var start = parser.token.start;
  return {
    kind: _kinds.SELECTION_SET,
    selections: many(parser, _lexer.TokenKind.BRACE_L, parseSelection, _lexer.TokenKind.BRACE_R),
    loc: loc(parser, start)
  };
}

/**
 * Selection :
 *   - Field
 *   - FragmentSpread
 *   - InlineFragment
 */
function parseSelection(parser) {
  return peek(parser, _lexer.TokenKind.SPREAD) ? parseFragment(parser) : parseField(parser);
}

/**
 * Field : Alias? Name Arguments? Directives? SelectionSet?
 *
 * Alias : Name :
 */
function parseField(parser) {
  var start = parser.token.start;

  var nameOrAlias = parseName(parser);
  var alias = undefined;
  var name = undefined;
  if (skip(parser, _lexer.TokenKind.COLON)) {
    alias = nameOrAlias;
    name = parseName(parser);
  } else {
    alias = null;
    name = nameOrAlias;
  }

  return {
    kind: _kinds.FIELD,
    alias: alias,
    name: name,
    arguments: parseArguments(parser),
    directives: parseDirectives(parser),
    selectionSet: peek(parser, _lexer.TokenKind.BRACE_L) ? parseSelectionSet(parser) : null,
    loc: loc(parser, start)
  };
}

/**
 * Arguments : ( Argument+ )
 */
function parseArguments(parser) {
  return peek(parser, _lexer.TokenKind.PAREN_L) ? many(parser, _lexer.TokenKind.PAREN_L, parseArgument, _lexer.TokenKind.PAREN_R) : [];
}

/**
 * Argument : Name : Value
 */
function parseArgument(parser) {
  var start = parser.token.start;
  return {
    kind: _kinds.ARGUMENT,
    name: parseName(parser),
    value: (expect(parser, _lexer.TokenKind.COLON), parseValueLiteral(parser, false)),
    loc: loc(parser, start)
  };
}

// Implements the parsing rules in the Fragments section.

/**
 * Corresponds to both FragmentSpread and InlineFragment in the spec.
 *
 * FragmentSpread : ... FragmentName Directives?
 *
 * InlineFragment : ... TypeCondition? Directives? SelectionSet
 */
function parseFragment(parser) {
  var start = parser.token.start;
  expect(parser, _lexer.TokenKind.SPREAD);
  if (peek(parser, _lexer.TokenKind.NAME) && parser.token.value !== 'on') {
    return {
      kind: _kinds.FRAGMENT_SPREAD,
      name: parseFragmentName(parser),
      directives: parseDirectives(parser),
      loc: loc(parser, start)
    };
  }
  var typeCondition = null;
  if (parser.token.value === 'on') {
    advance(parser);
    typeCondition = parseNamedType(parser);
  }
  return {
    kind: _kinds.INLINE_FRAGMENT,
    typeCondition: typeCondition,
    directives: parseDirectives(parser),
    selectionSet: parseSelectionSet(parser),
    loc: loc(parser, start)
  };
}

/**
 * FragmentDefinition :
 *   - fragment FragmentName on TypeCondition Directives? SelectionSet
 *
 * TypeCondition : NamedType
 */
function parseFragmentDefinition(parser) {
  var start = parser.token.start;
  expectKeyword(parser, 'fragment');
  return {
    kind: _kinds.FRAGMENT_DEFINITION,
    name: parseFragmentName(parser),
    typeCondition: (expectKeyword(parser, 'on'), parseNamedType(parser)),
    directives: parseDirectives(parser),
    selectionSet: parseSelectionSet(parser),
    loc: loc(parser, start)
  };
}

/**
 * FragmentName : Name but not `on`
 */
function parseFragmentName(parser) {
  if (parser.token.value === 'on') {
    throw unexpected(parser);
  }
  return parseName(parser);
}

// Implements the parsing rules in the Values section.

/**
 * Value[Const] :
 *   - [~Const] Variable
 *   - IntValue
 *   - FloatValue
 *   - StringValue
 *   - BooleanValue
 *   - EnumValue
 *   - ListValue[?Const]
 *   - ObjectValue[?Const]
 *
 * BooleanValue : one of `true` `false`
 *
 * EnumValue : Name but not `true`, `false` or `null`
 */
function parseValueLiteral(parser, isConst) {
  var token = parser.token;
  switch (token.kind) {
    case _lexer.TokenKind.BRACKET_L:
      return parseList(parser, isConst);
    case _lexer.TokenKind.BRACE_L:
      return parseObject(parser, isConst);
    case _lexer.TokenKind.INT:
      advance(parser);
      return {
        kind: _kinds.INT,
        value: token.value,
        loc: loc(parser, token.start)
      };
    case _lexer.TokenKind.FLOAT:
      advance(parser);
      return {
        kind: _kinds.FLOAT,
        value: token.value,
        loc: loc(parser, token.start)
      };
    case _lexer.TokenKind.STRING:
      advance(parser);
      return {
        kind: _kinds.STRING,
        value: token.value,
        loc: loc(parser, token.start)
      };
    case _lexer.TokenKind.NAME:
      if (token.value === 'true' || token.value === 'false') {
        advance(parser);
        return {
          kind: _kinds.BOOLEAN,
          value: token.value === 'true',
          loc: loc(parser, token.start)
        };
      } else if (token.value !== 'null') {
        advance(parser);
        return {
          kind: _kinds.ENUM,
          value: token.value,
          loc: loc(parser, token.start)
        };
      }
      break;
    case _lexer.TokenKind.DOLLAR:
      if (!isConst) {
        return parseVariable(parser);
      }
      break;
  }
  throw unexpected(parser);
}

function parseConstValue(parser) {
  return parseValueLiteral(parser, true);
}

function parseValueValue(parser) {
  return parseValueLiteral(parser, false);
}

/**
 * ListValue[Const] :
 *   - [ ]
 *   - [ Value[?Const]+ ]
 */
function parseList(parser, isConst) {
  var start = parser.token.start;
  var item = isConst ? parseConstValue : parseValueValue;
  return {
    kind: _kinds.LIST,
    values: any(parser, _lexer.TokenKind.BRACKET_L, item, _lexer.TokenKind.BRACKET_R),
    loc: loc(parser, start)
  };
}

/**
 * ObjectValue[Const] :
 *   - { }
 *   - { ObjectField[?Const]+ }
 */
function parseObject(parser, isConst) {
  var start = parser.token.start;
  expect(parser, _lexer.TokenKind.BRACE_L);
  var fields = [];
  while (!skip(parser, _lexer.TokenKind.BRACE_R)) {
    fields.push(parseObjectField(parser, isConst));
  }
  return {
    kind: _kinds.OBJECT,
    fields: fields,
    loc: loc(parser, start)
  };
}

/**
 * ObjectField[Const] : Name : Value[?Const]
 */
function parseObjectField(parser, isConst) {
  var start = parser.token.start;
  return {
    kind: _kinds.OBJECT_FIELD,
    name: parseName(parser),
    value: (expect(parser, _lexer.TokenKind.COLON), parseValueLiteral(parser, isConst)),
    loc: loc(parser, start)
  };
}

// Implements the parsing rules in the Directives section.

/**
 * Directives : Directive+
 */
function parseDirectives(parser) {
  var directives = [];
  while (peek(parser, _lexer.TokenKind.AT)) {
    directives.push(parseDirective(parser));
  }
  return directives;
}

/**
 * Directive : @ Name Arguments?
 */
function parseDirective(parser) {
  var start = parser.token.start;
  expect(parser, _lexer.TokenKind.AT);
  return {
    kind: _kinds.DIRECTIVE,
    name: parseName(parser),
    arguments: parseArguments(parser),
    loc: loc(parser, start)
  };
}

// Implements the parsing rules in the Types section.

/**
 * Type :
 *   - NamedType
 *   - ListType
 *   - NonNullType
 */

function parseType(parser) {
  var start = parser.token.start;
  var type = undefined;
  if (skip(parser, _lexer.TokenKind.BRACKET_L)) {
    type = parseType(parser);
    expect(parser, _lexer.TokenKind.BRACKET_R);
    type = {
      kind: _kinds.LIST_TYPE,
      type: type,
      loc: loc(parser, start)
    };
  } else {
    type = parseNamedType(parser);
  }
  if (skip(parser, _lexer.TokenKind.BANG)) {
    return {
      kind: _kinds.NON_NULL_TYPE,
      type: type,
      loc: loc(parser, start)
    };
  }
  return type;
}

/**
 * NamedType : Name
 */

function parseNamedType(parser) {
  var start = parser.token.start;
  return {
    kind: _kinds.NAMED_TYPE,
    name: parseName(parser),
    loc: loc(parser, start)
  };
}

// Implements the parsing rules in the Type Definition section.

/**
 * TypeDefinition :
 *   - ObjectTypeDefinition
 *   - InterfaceTypeDefinition
 *   - UnionTypeDefinition
 *   - ScalarTypeDefinition
 *   - EnumTypeDefinition
 *   - InputObjectTypeDefinition
 */
function parseTypeDefinition(parser) {
  if (!peek(parser, _lexer.TokenKind.NAME)) {
    throw unexpected(parser);
  }
  switch (parser.token.value) {
    case 'type':
      return parseObjectTypeDefinition(parser);
    case 'interface':
      return parseInterfaceTypeDefinition(parser);
    case 'union':
      return parseUnionTypeDefinition(parser);
    case 'scalar':
      return parseScalarTypeDefinition(parser);
    case 'enum':
      return parseEnumTypeDefinition(parser);
    case 'input':
      return parseInputObjectTypeDefinition(parser);
    default:
      throw unexpected(parser);
  }
}

/**
 * ObjectTypeDefinition : type Name ImplementsInterfaces? { FieldDefinition+ }
 */
function parseObjectTypeDefinition(parser) {
  var start = parser.token.start;
  expectKeyword(parser, 'type');
  var name = parseName(parser);
  var interfaces = parseImplementsInterfaces(parser);
  var fields = any(parser, _lexer.TokenKind.BRACE_L, parseFieldDefinition, _lexer.TokenKind.BRACE_R);
  return {
    kind: _kinds.OBJECT_TYPE_DEFINITION,
    name: name,
    interfaces: interfaces,
    fields: fields,
    loc: loc(parser, start)
  };
}

/**
 * ImplementsInterfaces : implements NamedType+
 */
function parseImplementsInterfaces(parser) {
  var types = [];
  if (parser.token.value === 'implements') {
    advance(parser);
    do {
      types.push(parseNamedType(parser));
    } while (!peek(parser, _lexer.TokenKind.BRACE_L));
  }
  return types;
}

/**
 * FieldDefinition : Name ArgumentsDefinition? : Type
 */
function parseFieldDefinition(parser) {
  var start = parser.token.start;
  var name = parseName(parser);
  var args = parseArgumentDefs(parser);
  expect(parser, _lexer.TokenKind.COLON);
  var type = parseType(parser);
  return {
    kind: _kinds.FIELD_DEFINITION,
    name: name,
    arguments: args,
    type: type,
    loc: loc(parser, start)
  };
}

/**
 * ArgumentsDefinition : ( InputValueDefinition+ )
 */
function parseArgumentDefs(parser) {
  if (!peek(parser, _lexer.TokenKind.PAREN_L)) {
    return [];
  }
  return many(parser, _lexer.TokenKind.PAREN_L, parseInputValueDef, _lexer.TokenKind.PAREN_R);
}

/**
 * InputValueDefinition : Name : Type DefaultValue?
 */
function parseInputValueDef(parser) {
  var start = parser.token.start;
  var name = parseName(parser);
  expect(parser, _lexer.TokenKind.COLON);
  var type = parseType(parser);
  var defaultValue = null;
  if (skip(parser, _lexer.TokenKind.EQUALS)) {
    defaultValue = parseConstValue(parser);
  }
  return {
    kind: _kinds.INPUT_VALUE_DEFINITION,
    name: name,
    type: type,
    defaultValue: defaultValue,
    loc: loc(parser, start)
  };
}

/**
 * InterfaceTypeDefinition : interface Name { FieldDefinition+ }
 */
function parseInterfaceTypeDefinition(parser) {
  var start = parser.token.start;
  expectKeyword(parser, 'interface');
  var name = parseName(parser);
  var fields = any(parser, _lexer.TokenKind.BRACE_L, parseFieldDefinition, _lexer.TokenKind.BRACE_R);
  return {
    kind: _kinds.INTERFACE_TYPE_DEFINITION,
    name: name,
    fields: fields,
    loc: loc(parser, start)
  };
}

/**
 * UnionTypeDefinition : union Name = UnionMembers
 */
function parseUnionTypeDefinition(parser) {
  var start = parser.token.start;
  expectKeyword(parser, 'union');
  var name = parseName(parser);
  expect(parser, _lexer.TokenKind.EQUALS);
  var types = parseUnionMembers(parser);
  return {
    kind: _kinds.UNION_TYPE_DEFINITION,
    name: name,
    types: types,
    loc: loc(parser, start)
  };
}

/**
 * UnionMembers :
 *   - NamedType
 *   - UnionMembers | NamedType
 */
function parseUnionMembers(parser) {
  var members = [];
  do {
    members.push(parseNamedType(parser));
  } while (skip(parser, _lexer.TokenKind.PIPE));
  return members;
}

/**
 * ScalarTypeDefinition : scalar Name
 */
function parseScalarTypeDefinition(parser) {
  var start = parser.token.start;
  expectKeyword(parser, 'scalar');
  var name = parseName(parser);
  return {
    kind: _kinds.SCALAR_TYPE_DEFINITION,
    name: name,
    loc: loc(parser, start)
  };
}

/**
 * EnumTypeDefinition : enum Name { EnumValueDefinition+ }
 */
function parseEnumTypeDefinition(parser) {
  var start = parser.token.start;
  expectKeyword(parser, 'enum');
  var name = parseName(parser);
  var values = many(parser, _lexer.TokenKind.BRACE_L, parseEnumValueDefinition, _lexer.TokenKind.BRACE_R);
  return {
    kind: _kinds.ENUM_TYPE_DEFINITION,
    name: name,
    values: values,
    loc: loc(parser, start)
  };
}

/**
 * EnumValueDefinition : EnumValue
 *
 * EnumValue : Name
 */
function parseEnumValueDefinition(parser) {
  var start = parser.token.start;
  var name = parseName(parser);
  return {
    kind: _kinds.ENUM_VALUE_DEFINITION,
    name: name,
    loc: loc(parser, start)
  };
}

/**
 * InputObjectTypeDefinition : input Name { InputValueDefinition+ }
 */
function parseInputObjectTypeDefinition(parser) {
  var start = parser.token.start;
  expectKeyword(parser, 'input');
  var name = parseName(parser);
  var fields = any(parser, _lexer.TokenKind.BRACE_L, parseInputValueDef, _lexer.TokenKind.BRACE_R);
  return {
    kind: _kinds.INPUT_OBJECT_TYPE_DEFINITION,
    name: name,
    fields: fields,
    loc: loc(parser, start)
  };
}

/**
 * TypeExtensionDefinition : extend ObjectTypeDefinition
 */
function parseTypeExtensionDefinition(parser) {
  var start = parser.token.start;
  expectKeyword(parser, 'extend');
  var definition = parseObjectTypeDefinition(parser);
  return {
    kind: _kinds.TYPE_EXTENSION_DEFINITION,
    definition: definition,
    loc: loc(parser, start)
  };
}

// Core parsing utility functions

/**
 * Returns the parser object that is used to store state throughout the
 * process of parsing.
 */
function makeParser(source, options) {
  var _lexToken = (0, _lexer.lex)(source);
  return {
    _lexToken: _lexToken,
    source: source,
    options: options,
    prevEnd: 0,
    token: _lexToken()
  };
}

/**
 * Returns a location object, used to identify the place in
 * the source that created a given parsed object.
 */
function loc(parser, start) {
  if (parser.options.noLocation) {
    return null;
  }
  if (parser.options.noSource) {
    return { start: start, end: parser.prevEnd };
  }
  return { start: start, end: parser.prevEnd, source: parser.source };
}

/**
 * Moves the internal parser object to the next lexed token.
 */
function advance(parser) {
  var prevEnd = parser.token.end;
  parser.prevEnd = prevEnd;
  parser.token = parser._lexToken(prevEnd);
}

/**
 * Determines if the next token is of a given kind
 */
function peek(parser, kind) {
  return parser.token.kind === kind;
}

/**
 * If the next token is of the given kind, return true after advancing
 * the parser. Otherwise, do not change the parser state and return false.
 */
function skip(parser, kind) {
  var match = parser.token.kind === kind;
  if (match) {
    advance(parser);
  }
  return match;
}

/**
 * If the next token is of the given kind, return that token after advancing
 * the parser. Otherwise, do not change the parser state and throw an error.
 */
function expect(parser, kind) {
  var token = parser.token;
  if (token.kind === kind) {
    advance(parser);
    return token;
  }
  throw (0, _error.syntaxError)(parser.source, token.start, 'Expected ' + (0, _lexer.getTokenKindDesc)(kind) + ', found ' + (0, _lexer.getTokenDesc)(token));
}

/**
 * If the next token is a keyword with the given value, return that token after
 * advancing the parser. Otherwise, do not change the parser state and return
 * false.
 */
function expectKeyword(parser, value) {
  var token = parser.token;
  if (token.kind === _lexer.TokenKind.NAME && token.value === value) {
    advance(parser);
    return token;
  }
  throw (0, _error.syntaxError)(parser.source, token.start, 'Expected "' + value + '", found ' + (0, _lexer.getTokenDesc)(token));
}

/**
 * Helper function for creating an error when an unexpected lexed token
 * is encountered.
 */
function unexpected(parser, atToken) {
  var token = atToken || parser.token;
  return (0, _error.syntaxError)(parser.source, token.start, 'Unexpected ' + (0, _lexer.getTokenDesc)(token));
}

/**
 * Returns a possibly empty list of parse nodes, determined by
 * the parseFn. This list begins with a lex token of openKind
 * and ends with a lex token of closeKind. Advances the parser
 * to the next lex token after the closing token.
 */
function any(parser, openKind, parseFn, closeKind) {
  expect(parser, openKind);
  var nodes = [];
  while (!skip(parser, closeKind)) {
    nodes.push(parseFn(parser));
  }
  return nodes;
}

/**
 * Returns a non-empty list of parse nodes, determined by
 * the parseFn. This list begins with a lex token of openKind
 * and ends with a lex token of closeKind. Advances the parser
 * to the next lex token after the closing token.
 */
function many(parser, openKind, parseFn, closeKind) {
  expect(parser, openKind);
  var nodes = [parseFn(parser)];
  while (!skip(parser, closeKind)) {
    nodes.push(parseFn(parser));
  }
  return nodes;
}

/**
 * By default, the parser creates AST nodes that know the location
 * in the source that they correspond to. This configuration flag
 * disables that behavior for performance or testing.
 */

/**
 * By default, the parser creates AST nodes that contain a reference
 * to the source that they were created from. This configuration flag
 * disables that behavior for performance or testing.
 */
},{"../error":150,"./kinds":164,"./lexer":165,"./source":169}],168:[function(require,module,exports){
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.print = print;

var _visitor = require('./visitor');

/**
 * Converts an AST into a string, using one set of reasonable
 * formatting rules.
 */

function print(ast) {
  return (0, _visitor.visit)(ast, { leave: printDocASTReducer });
}

var printDocASTReducer = {
  Name: function Name(node) {
    return node.value;
  },
  Variable: function Variable(node) {
    return '$' + node.name;
  },

  // Document

  Document: function Document(node) {
    return join(node.definitions, '\n\n') + '\n';
  },

  OperationDefinition: function OperationDefinition(node) {
    var op = node.operation;
    var name = node.name;
    var varDefs = wrap('(', join(node.variableDefinitions, ', '), ')');
    var directives = join(node.directives, ' ');
    var selectionSet = node.selectionSet;
    // Anonymous queries with no directives or variable definitions can use
    // the query short form.
    return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
  },

  VariableDefinition: function VariableDefinition(_ref) {
    var variable = _ref.variable;
    var type = _ref.type;
    var defaultValue = _ref.defaultValue;
    return variable + ': ' + type + wrap(' = ', defaultValue);
  },

  SelectionSet: function SelectionSet(_ref2) {
    var selections = _ref2.selections;
    return block(selections);
  },

  Field: function Field(_ref3) {
    var alias = _ref3.alias;
    var name = _ref3.name;
    var args = _ref3.arguments;
    var directives = _ref3.directives;
    var selectionSet = _ref3.selectionSet;
    return join([wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], ' ');
  },

  Argument: function Argument(_ref4) {
    var name = _ref4.name;
    var value = _ref4.value;
    return name + ': ' + value;
  },

  // Fragments

  FragmentSpread: function FragmentSpread(_ref5) {
    var name = _ref5.name;
    var directives = _ref5.directives;
    return '...' + name + wrap(' ', join(directives, ' '));
  },

  InlineFragment: function InlineFragment(_ref6) {
    var typeCondition = _ref6.typeCondition;
    var directives = _ref6.directives;
    var selectionSet = _ref6.selectionSet;
    return join(['...', wrap('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
  },

  FragmentDefinition: function FragmentDefinition(_ref7) {
    var name = _ref7.name;
    var typeCondition = _ref7.typeCondition;
    var directives = _ref7.directives;
    var selectionSet = _ref7.selectionSet;
    return 'fragment ' + name + ' on ' + typeCondition + ' ' + wrap('', join(directives, ' '), ' ') + selectionSet;
  },

  // Value

  IntValue: function IntValue(_ref8) {
    var value = _ref8.value;
    return value;
  },
  FloatValue: function FloatValue(_ref9) {
    var value = _ref9.value;
    return value;
  },
  StringValue: function StringValue(_ref10) {
    var value = _ref10.value;
    return JSON.stringify(value);
  },
  BooleanValue: function BooleanValue(_ref11) {
    var value = _ref11.value;
    return JSON.stringify(value);
  },
  EnumValue: function EnumValue(_ref12) {
    var value = _ref12.value;
    return value;
  },
  ListValue: function ListValue(_ref13) {
    var values = _ref13.values;
    return '[' + join(values, ', ') + ']';
  },
  ObjectValue: function ObjectValue(_ref14) {
    var fields = _ref14.fields;
    return '{' + join(fields, ', ') + '}';
  },
  ObjectField: function ObjectField(_ref15) {
    var name = _ref15.name;
    var value = _ref15.value;
    return name + ': ' + value;
  },

  // Directive

  Directive: function Directive(_ref16) {
    var name = _ref16.name;
    var args = _ref16.arguments;
    return '@' + name + wrap('(', join(args, ', '), ')');
  },

  // Type

  NamedType: function NamedType(_ref17) {
    var name = _ref17.name;
    return name;
  },
  ListType: function ListType(_ref18) {
    var type = _ref18.type;
    return '[' + type + ']';
  },
  NonNullType: function NonNullType(_ref19) {
    var type = _ref19.type;
    return type + '!';
  },

  // Type Definitions

  ObjectTypeDefinition: function ObjectTypeDefinition(_ref20) {
    var name = _ref20.name;
    var interfaces = _ref20.interfaces;
    var fields = _ref20.fields;
    return 'type ' + name + ' ' + wrap('implements ', join(interfaces, ', '), ' ') + block(fields);
  },

  FieldDefinition: function FieldDefinition(_ref21) {
    var name = _ref21.name;
    var args = _ref21.arguments;
    var type = _ref21.type;
    return name + wrap('(', join(args, ', '), ')') + ': ' + type;
  },

  InputValueDefinition: function InputValueDefinition(_ref22) {
    var name = _ref22.name;
    var type = _ref22.type;
    var defaultValue = _ref22.defaultValue;
    return name + ': ' + type + wrap(' = ', defaultValue);
  },

  InterfaceTypeDefinition: function InterfaceTypeDefinition(_ref23) {
    var name = _ref23.name;
    var fields = _ref23.fields;
    return 'interface ' + name + ' ' + block(fields);
  },

  UnionTypeDefinition: function UnionTypeDefinition(_ref24) {
    var name = _ref24.name;
    var types = _ref24.types;
    return 'union ' + name + ' = ' + join(types, ' | ');
  },

  ScalarTypeDefinition: function ScalarTypeDefinition(_ref25) {
    var name = _ref25.name;
    return 'scalar ' + name;
  },

  EnumTypeDefinition: function EnumTypeDefinition(_ref26) {
    var name = _ref26.name;
    var values = _ref26.values;
    return 'enum ' + name + ' ' + block(values);
  },

  EnumValueDefinition: function EnumValueDefinition(_ref27) {
    var name = _ref27.name;
    return name;
  },

  InputObjectTypeDefinition: function InputObjectTypeDefinition(_ref28) {
    var name = _ref28.name;
    var fields = _ref28.fields;
    return 'input ' + name + ' ' + block(fields);
  },

  TypeExtensionDefinition: function TypeExtensionDefinition(_ref29) {
    var definition = _ref29.definition;
    return 'extend ' + definition;
  }
};

/**
 * Given maybeArray, print an empty string if it is null or empty, otherwise
 * print all items together separated by separator if provided
 */
function join(maybeArray, separator) {
  return maybeArray ? maybeArray.filter(function (x) {
    return x;
  }).join(separator || '') : '';
}

/**
 * Given maybeArray, print an empty string if it is null or empty, otherwise
 * print each item on its own line, wrapped in an indented "{ }" block.
 */
function block(maybeArray) {
  return length(maybeArray) ? indent('{\n' + join(maybeArray, '\n')) + '\n}' : '';
}

/**
 * If maybeString is not null or empty, then wrap with start and end, otherwise
 * print an empty string.
 */
function wrap(start, maybeString, end) {
  return maybeString ? start + maybeString + (end || '') : '';
}

function indent(maybeString) {
  return maybeString && maybeString.replace(/\n/g, '\n  ');
}

function length(maybeArray) {
  return maybeArray ? maybeArray.length : 0;
}
},{"./visitor":170}],169:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * A representation of source input to GraphQL. The name is optional,
 * but is mostly useful for clients who store GraphQL documents in
 * source files; for example, if the GraphQL input is in a file Foo.graphql,
 * it might be useful for name to be "Foo.graphql".
 */
'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var Source = function Source(body, name) {
  _classCallCheck(this, Source);

  this.body = body;
  this.name = name || 'GraphQL';
};

exports.Source = Source;
},{"babel-runtime/helpers/class-call-check":16}],170:[function(require,module,exports){
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.visit = visit;
exports.visitInParallel = visitInParallel;
exports.visitWithTypeInfo = visitWithTypeInfo;
var QueryDocumentKeys = {
  Name: [],

  Document: ['definitions'],
  OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
  VariableDefinition: ['variable', 'type', 'defaultValue'],
  Variable: ['name'],
  SelectionSet: ['selections'],
  Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
  Argument: ['name', 'value'],

  FragmentSpread: ['name', 'directives'],
  InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
  FragmentDefinition: ['name', 'typeCondition', 'directives', 'selectionSet'],

  IntValue: [],
  FloatValue: [],
  StringValue: [],
  BooleanValue: [],
  EnumValue: [],
  ListValue: ['values'],
  ObjectValue: ['fields'],
  ObjectField: ['name', 'value'],

  Directive: ['name', 'arguments'],

  NamedType: ['name'],
  ListType: ['type'],
  NonNullType: ['type'],

  ObjectTypeDefinition: ['name', 'interfaces', 'fields'],
  FieldDefinition: ['name', 'arguments', 'type'],
  InputValueDefinition: ['name', 'type', 'defaultValue'],
  InterfaceTypeDefinition: ['name', 'fields'],
  UnionTypeDefinition: ['name', 'types'],
  ScalarTypeDefinition: ['name'],
  EnumTypeDefinition: ['name', 'values'],
  EnumValueDefinition: ['name'],
  InputObjectTypeDefinition: ['name', 'fields'],
  TypeExtensionDefinition: ['definition']
};

exports.QueryDocumentKeys = QueryDocumentKeys;
var BREAK = {};

exports.BREAK = BREAK;
/**
 * visit() will walk through an AST using a depth first traversal, calling
 * the visitor's enter function at each node in the traversal, and calling the
 * leave function after visiting that node and all of its child nodes.
 *
 * By returning different values from the enter and leave functions, the
 * behavior of the visitor can be altered, including skipping over a sub-tree of
 * the AST (by returning false), editing the AST by returning a value or null
 * to remove the value, or to stop the whole traversal by returning BREAK.
 *
 * When using visit() to edit an AST, the original AST will not be modified, and
 * a new version of the AST with the changes applied will be returned from the
 * visit function.
 *
 *     const editedAST = visit(ast, {
 *       enter(node, key, parent, path, ancestors) {
 *         // @return
 *         //   undefined: no action
 *         //   false: skip visiting this node
 *         //   visitor.BREAK: stop visiting altogether
 *         //   null: delete this node
 *         //   any value: replace this node with the returned value
 *       },
 *       leave(node, key, parent, path, ancestors) {
 *         // @return
 *         //   undefined: no action
 *         //   false: no action
 *         //   visitor.BREAK: stop visiting altogether
 *         //   null: delete this node
 *         //   any value: replace this node with the returned value
 *       }
 *     });
 *
 * Alternatively to providing enter() and leave() functions, a visitor can
 * instead provide functions named the same as the kinds of AST nodes, or
 * enter/leave visitors at a named key, leading to four permutations of
 * visitor API:
 *
 * 1) Named visitors triggered when entering a node a specific kind.
 *
 *     visit(ast, {
 *       Kind(node) {
 *         // enter the "Kind" node
 *       }
 *     })
 *
 * 2) Named visitors that trigger upon entering and leaving a node of
 *    a specific kind.
 *
 *     visit(ast, {
 *       Kind: {
 *         enter(node) {
 *           // enter the "Kind" node
 *         }
 *         leave(node) {
 *           // leave the "Kind" node
 *         }
 *       }
 *     })
 *
 * 3) Generic visitors that trigger upon entering and leaving any node.
 *
 *     visit(ast, {
 *       enter(node) {
 *         // enter any node
 *       },
 *       leave(node) {
 *         // leave any node
 *       }
 *     })
 *
 * 4) Parallel visitors for entering and leaving nodes of a specific kind.
 *
 *     visit(ast, {
 *       enter: {
 *         Kind(node) {
 *           // enter the "Kind" node
 *         }
 *       },
 *       leave: {
 *         Kind(node) {
 *           // leave the "Kind" node
 *         }
 *       }
 *     })
 */

function visit(root, visitor, keyMap) {
  var visitorKeys = keyMap || QueryDocumentKeys;

  var stack = undefined;
  var inArray = Array.isArray(root);
  var keys = [root];
  var index = -1;
  var edits = [];
  var parent = undefined;
  var path = [];
  var ancestors = [];
  var newRoot = root;

  do {
    index++;
    var isLeaving = index === keys.length;
    var key = undefined;
    var node = undefined;
    var isEdited = isLeaving && edits.length !== 0;
    if (isLeaving) {
      key = ancestors.length === 0 ? undefined : path.pop();
      node = parent;
      parent = ancestors.pop();
      if (isEdited) {
        if (inArray) {
          node = node.slice();
        } else {
          var clone = {};
          for (var k in node) {
            if (node.hasOwnProperty(k)) {
              clone[k] = node[k];
            }
          }
          node = clone;
        }
        var editOffset = 0;
        for (var ii = 0; ii < edits.length; ii++) {
          var _edits$ii = _slicedToArray(edits[ii], 1);

          var editKey = _edits$ii[0];

          var _edits$ii2 = _slicedToArray(edits[ii], 2);

          var editValue = _edits$ii2[1];

          if (inArray) {
            editKey -= editOffset;
          }
          if (inArray && editValue === null) {
            node.splice(editKey, 1);
            editOffset++;
          } else {
            node[editKey] = editValue;
          }
        }
      }
      index = stack.index;
      keys = stack.keys;
      edits = stack.edits;
      inArray = stack.inArray;
      stack = stack.prev;
    } else {
      key = parent ? inArray ? index : keys[index] : undefined;
      node = parent ? parent[key] : newRoot;
      if (node === null || node === undefined) {
        continue;
      }
      if (parent) {
        path.push(key);
      }
    }

    var result = undefined;
    if (!Array.isArray(node)) {
      if (!isNode(node)) {
        throw new Error('Invalid AST Node: ' + JSON.stringify(node));
      }
      var visitFn = getVisitFn(visitor, node.kind, isLeaving);
      if (visitFn) {
        result = visitFn.call(visitor, node, key, parent, path, ancestors);

        if (result === BREAK) {
          break;
        }

        if (result === false) {
          if (!isLeaving) {
            path.pop();
            continue;
          }
        } else if (result !== undefined) {
          edits.push([key, result]);
          if (!isLeaving) {
            if (isNode(result)) {
              node = result;
            } else {
              path.pop();
              continue;
            }
          }
        }
      }
    }

    if (result === undefined && isEdited) {
      edits.push([key, node]);
    }

    if (!isLeaving) {
      stack = { inArray: inArray, index: index, keys: keys, edits: edits, prev: stack };
      inArray = Array.isArray(node);
      keys = inArray ? node : visitorKeys[node.kind] || [];
      index = -1;
      edits = [];
      if (parent) {
        ancestors.push(parent);
      }
      parent = node;
    }
  } while (stack !== undefined);

  if (edits.length !== 0) {
    newRoot = edits[0][1];
  }

  return newRoot;
}

function isNode(maybeNode) {
  return maybeNode && typeof maybeNode.kind === 'string';
}

/**
 * Creates a new visitor instance which delegates to many visitors to run in
 * parallel. Each visitor will be visited for each node before moving on.
 *
 * If a prior visitor edits a node, no following visitors will see that node.
 */

function visitInParallel(visitors) {
  var skipping = new Array(visitors.length);

  return {
    enter: function enter(node) {
      for (var i = 0; i < visitors.length; i++) {
        if (!skipping[i]) {
          var fn = getVisitFn(visitors[i], node.kind, /* isLeaving */false);
          if (fn) {
            var result = fn.apply(visitors[i], arguments);
            if (result === false) {
              skipping[i] = node;
            } else if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== undefined) {
              return result;
            }
          }
        }
      }
    },
    leave: function leave(node) {
      for (var i = 0; i < visitors.length; i++) {
        if (!skipping[i]) {
          var fn = getVisitFn(visitors[i], node.kind, /* isLeaving */true);
          if (fn) {
            var result = fn.apply(visitors[i], arguments);
            if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== undefined && result !== false) {
              return result;
            }
          }
        } else if (skipping[i] === node) {
          skipping[i] = null;
        }
      }
    }
  };
}

/**
 * Creates a new visitor instance which maintains a provided TypeInfo instance
 * along with visiting visitor.
 */

function visitWithTypeInfo(typeInfo, visitor) {
  return {
    enter: function enter(node) {
      typeInfo.enter(node);
      var fn = getVisitFn(visitor, node.kind, /* isLeaving */false);
      if (fn) {
        var result = fn.apply(visitor, arguments);
        if (result !== undefined) {
          typeInfo.leave(node);
          if (isNode(result)) {
            typeInfo.enter(result);
          }
        }
        return result;
      }
    },
    leave: function leave(node) {
      var fn = getVisitFn(visitor, node.kind, /* isLeaving */true);
      var result = undefined;
      if (fn) {
        result = fn.apply(visitor, arguments);
      }
      typeInfo.leave(node);
      return result;
    }
  };
}

/**
 * Given a visitor instance, if it is leaving or not, and a node kind, return
 * the function the visitor runtime should call.
 */
function getVisitFn(visitor, kind, isLeaving) {
  var kindVisitor = visitor[kind];
  if (kindVisitor) {
    if (!isLeaving && typeof kindVisitor === 'function') {
      // { Kind() {} }
      return kindVisitor;
    }
    var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;
    if (typeof kindSpecificVisitor === 'function') {
      // { Kind: { enter() {}, leave() {} } }
      return kindSpecificVisitor;
    }
  } else {
    var specificVisitor = isLeaving ? visitor.leave : visitor.enter;
    if (specificVisitor) {
      if (typeof specificVisitor === 'function') {
        // { enter() {}, leave() {} }
        return specificVisitor;
      }
      var specificKindVisitor = specificVisitor[kind];
      if (typeof specificKindVisitor === 'function') {
        // { enter: { Kind() {} }, leave: { Kind() {} } }
        return specificKindVisitor;
      }
    }
  }
}
},{"babel-runtime/helpers/sliced-to-array":23}],171:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

// Predicates

/**
 * These are all of the possible kinds of types.
 */
'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _Map = require('babel-runtime/core-js/map')['default'];

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isType = isType;

/**
 * These types may be used as input types for arguments and directives.
 */
exports.isInputType = isInputType;

/**
 * These types may be used as output types as the result of fields.
 */
exports.isOutputType = isOutputType;

/**
 * These types may describe types which may be leaf values.
 */
exports.isLeafType = isLeafType;

/**
 * These types may describe the parent context of a selection set.
 */
exports.isCompositeType = isCompositeType;

/**
 * These types may describe the parent context of a selection set.
 */
exports.isAbstractType = isAbstractType;

/**
 * These types can all accept null as a value.
 */
exports.getNullableType = getNullableType;

/**
 * These named types do not include modifiers like List or NonNull.
 */
exports.getNamedType = getNamedType;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _jsutilsKeyMap = require('../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _languageKinds = require('../language/kinds');

function isType(type) {
  return type instanceof GraphQLScalarType || type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType || type instanceof GraphQLUnionType || type instanceof GraphQLEnumType || type instanceof GraphQLInputObjectType || type instanceof GraphQLList || type instanceof GraphQLNonNull;
}

function isInputType(type) {
  var namedType = getNamedType(type);
  return namedType instanceof GraphQLScalarType || namedType instanceof GraphQLEnumType || namedType instanceof GraphQLInputObjectType;
}

function isOutputType(type) {
  var namedType = getNamedType(type);
  return namedType instanceof GraphQLScalarType || namedType instanceof GraphQLObjectType || namedType instanceof GraphQLInterfaceType || namedType instanceof GraphQLUnionType || namedType instanceof GraphQLEnumType;
}

function isLeafType(type) {
  var namedType = getNamedType(type);
  return namedType instanceof GraphQLScalarType || namedType instanceof GraphQLEnumType;
}

function isCompositeType(type) {
  return type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType || type instanceof GraphQLUnionType;
}

function isAbstractType(type) {
  return type instanceof GraphQLInterfaceType || type instanceof GraphQLUnionType;
}

function getNullableType(type) {
  return type instanceof GraphQLNonNull ? type.ofType : type;
}

function getNamedType(type) {
  var unmodifiedType = type;
  while (unmodifiedType instanceof GraphQLList || unmodifiedType instanceof GraphQLNonNull) {
    unmodifiedType = unmodifiedType.ofType;
  }
  return unmodifiedType;
}

/**
 * Scalar Type Definition
 *
 * The leaf values of any request and input values to arguments are
 * Scalars (or Enums) and are defined with a name and a series of functions
 * used to parse input from ast or variables and to ensure validity.
 *
 * Example:
 *
 *     const OddType = new GraphQLScalarType({
 *       name: 'Odd',
 *       serialize(value) {
 *         return value % 2 === 1 ? value : null;
 *       }
 *     });
 *
 */

var GraphQLScalarType = (function () {
  function GraphQLScalarType(config) {
    _classCallCheck(this, GraphQLScalarType);

    (0, _jsutilsInvariant2['default'])(config.name, 'Type must be named.');
    assertValidName(config.name);
    this.name = config.name;
    this.description = config.description;
    (0, _jsutilsInvariant2['default'])(typeof config.serialize === 'function', this + ' must provide "serialize" function. If this custom Scalar is ' + 'also used as an input type, ensure "parseValue" and "parseLiteral" ' + 'functions are also provided.');
    if (config.parseValue || config.parseLiteral) {
      (0, _jsutilsInvariant2['default'])(typeof config.parseValue === 'function' && typeof config.parseLiteral === 'function', this + ' must provide both "parseValue" and "parseLiteral" functions.');
    }
    this._scalarConfig = config;
  }

  _createClass(GraphQLScalarType, [{
    key: 'serialize',
    value: function serialize(value) {
      var serializer = this._scalarConfig.serialize;
      return serializer(value);
    }
  }, {
    key: 'parseValue',
    value: function parseValue(value) {
      var parser = this._scalarConfig.parseValue;
      return parser ? parser(value) : null;
    }
  }, {
    key: 'parseLiteral',
    value: function parseLiteral(valueAST) {
      var parser = this._scalarConfig.parseLiteral;
      return parser ? parser(valueAST) : null;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.name;
    }
  }]);

  return GraphQLScalarType;
})();

exports.GraphQLScalarType = GraphQLScalarType;

/**
 * Object Type Definition
 *
 * Almost all of the GraphQL types you define will be object types. Object types
 * have a name, but most importantly describe their fields.
 *
 * Example:
 *
 *     const AddressType = new GraphQLObjectType({
 *       name: 'Address',
 *       fields: {
 *         street: { type: GraphQLString },
 *         number: { type: GraphQLInt },
 *         formatted: {
 *           type: GraphQLString,
 *           resolve(obj) {
 *             return obj.number + ' ' + obj.street
 *           }
 *         }
 *       }
 *     });
 *
 * When two types need to refer to each other, or a type needs to refer to
 * itself in a field, you can use a function expression (aka a closure or a
 * thunk) to supply the fields lazily.
 *
 * Example:
 *
 *     const PersonType = new GraphQLObjectType({
 *       name: 'Person',
 *       fields: () => ({
 *         name: { type: GraphQLString },
 *         bestFriend: { type: PersonType },
 *       })
 *     });
 *
 */

var GraphQLObjectType = (function () {
  function GraphQLObjectType(config) {
    _classCallCheck(this, GraphQLObjectType);

    (0, _jsutilsInvariant2['default'])(config.name, 'Type must be named.');
    assertValidName(config.name);
    this.name = config.name;
    this.description = config.description;
    if (config.isTypeOf) {
      (0, _jsutilsInvariant2['default'])(typeof config.isTypeOf === 'function', this + ' must provide "isTypeOf" as a function.');
    }
    this.isTypeOf = config.isTypeOf;
    this._typeConfig = config;
    addImplementationToInterfaces(this);
  }

  _createClass(GraphQLObjectType, [{
    key: 'getFields',
    value: function getFields() {
      return this._fields || (this._fields = defineFieldMap(this, this._typeConfig.fields));
    }
  }, {
    key: 'getInterfaces',
    value: function getInterfaces() {
      return this._interfaces || (this._interfaces = defineInterfaces(this, this._typeConfig.interfaces));
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.name;
    }
  }]);

  return GraphQLObjectType;
})();

exports.GraphQLObjectType = GraphQLObjectType;

function resolveMaybeThunk(thingOrThunk) {
  return typeof thingOrThunk === 'function' ? thingOrThunk() : thingOrThunk;
}

function defineInterfaces(type, interfacesOrThunk) {
  var interfaces = resolveMaybeThunk(interfacesOrThunk);
  if (!interfaces) {
    return [];
  }
  (0, _jsutilsInvariant2['default'])(Array.isArray(interfaces), type + ' interfaces must be an Array or a function which returns an Array.');
  interfaces.forEach(function (iface) {
    (0, _jsutilsInvariant2['default'])(iface instanceof GraphQLInterfaceType, type + ' may only implement Interface types, it cannot ' + ('implement: ' + iface + '.'));
    if (typeof iface.resolveType !== 'function') {
      (0, _jsutilsInvariant2['default'])(typeof type.isTypeOf === 'function', 'Interface Type ' + iface + ' does not provide a "resolveType" function ' + ('and implementing Type ' + type + ' does not provide a "isTypeOf" ') + 'function. There is no way to resolve this implementing type ' + 'during execution.');
    }
  });
  return interfaces;
}

function defineFieldMap(type, fields) {
  var fieldMap = resolveMaybeThunk(fields);
  (0, _jsutilsInvariant2['default'])(isPlainObj(fieldMap), type + ' fields must be an object with field names as keys or a ' + 'function which returns such an object.');

  var fieldNames = _Object$keys(fieldMap);
  (0, _jsutilsInvariant2['default'])(fieldNames.length > 0, type + ' fields must be an object with field names as keys or a ' + 'function which returns such an object.');

  var resultFieldMap = {};
  fieldNames.forEach(function (fieldName) {
    assertValidName(fieldName);
    var field = _extends({}, fieldMap[fieldName], {
      name: fieldName
    });
    (0, _jsutilsInvariant2['default'])(!field.hasOwnProperty('isDeprecated'), type + '.' + fieldName + ' should provide "deprecationReason" instead ' + 'of "isDeprecated".');
    (0, _jsutilsInvariant2['default'])(isOutputType(field.type), type + '.' + fieldName + ' field type must be Output Type but ' + ('got: ' + field.type + '.'));
    if (!field.args) {
      field.args = [];
    } else {
      (0, _jsutilsInvariant2['default'])(isPlainObj(field.args), type + '.' + fieldName + ' args must be an object with argument names ' + 'as keys.');
      field.args = _Object$keys(field.args).map(function (argName) {
        assertValidName(argName);
        var arg = field.args[argName];
        (0, _jsutilsInvariant2['default'])(isInputType(arg.type), type + '.' + fieldName + '(' + argName + ':) argument type must be ' + ('Input Type but got: ' + arg.type + '.'));
        return {
          name: argName,
          description: arg.description === undefined ? null : arg.description,
          type: arg.type,
          defaultValue: arg.defaultValue === undefined ? null : arg.defaultValue
        };
      });
    }
    resultFieldMap[fieldName] = field;
  });
  return resultFieldMap;
}

function isPlainObj(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Update the interfaces to know about this implementation.
 * This is an rare and unfortunate use of mutation in the type definition
 * implementations, but avoids an expensive "getPossibleTypes"
 * implementation for Interface types.
 */
function addImplementationToInterfaces(impl) {
  impl.getInterfaces().forEach(function (type) {
    type._implementations.push(impl);
  });
}

/**
 * Interface Type Definition
 *
 * When a field can return one of a heterogeneous set of types, a Interface type
 * is used to describe what types are possible, what fields are in common across
 * all types, as well as a function to determine which type is actually used
 * when the field is resolved.
 *
 * Example:
 *
 *     const EntityType = new GraphQLInterfaceType({
 *       name: 'Entity',
 *       fields: {
 *         name: { type: GraphQLString }
 *       }
 *     });
 *
 */

var GraphQLInterfaceType = (function () {
  function GraphQLInterfaceType(config) {
    _classCallCheck(this, GraphQLInterfaceType);

    (0, _jsutilsInvariant2['default'])(config.name, 'Type must be named.');
    assertValidName(config.name);
    this.name = config.name;
    this.description = config.description;
    if (config.resolveType) {
      (0, _jsutilsInvariant2['default'])(typeof config.resolveType === 'function', this + ' must provide "resolveType" as a function.');
    }
    this.resolveType = config.resolveType;
    this._typeConfig = config;
    this._implementations = [];
  }

  _createClass(GraphQLInterfaceType, [{
    key: 'getFields',
    value: function getFields() {
      return this._fields || (this._fields = defineFieldMap(this, this._typeConfig.fields));
    }
  }, {
    key: 'getPossibleTypes',
    value: function getPossibleTypes() {
      return this._implementations;
    }
  }, {
    key: 'isPossibleType',
    value: function isPossibleType(type) {
      var possibleTypes = this._possibleTypes || (this._possibleTypes = (0, _jsutilsKeyMap2['default'])(this.getPossibleTypes(), function (possibleType) {
        return possibleType.name;
      }));
      return Boolean(possibleTypes[type.name]);
    }
  }, {
    key: 'getObjectType',
    value: function getObjectType(value, info) {
      var resolver = this.resolveType;
      return resolver ? resolver(value, info) : getTypeOf(value, info, this);
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.name;
    }
  }]);

  return GraphQLInterfaceType;
})();

exports.GraphQLInterfaceType = GraphQLInterfaceType;

function getTypeOf(value, info, abstractType) {
  var possibleTypes = abstractType.getPossibleTypes();
  for (var i = 0; i < possibleTypes.length; i++) {
    var _type = possibleTypes[i];
    if (typeof _type.isTypeOf === 'function' && _type.isTypeOf(value, info)) {
      return _type;
    }
  }
}

/**
 * Union Type Definition
 *
 * When a field can return one of a heterogeneous set of types, a Union type
 * is used to describe what types are possible as well as providing a function
 * to determine which type is actually used when the field is resolved.
 *
 * Example:
 *
 *     const PetType = new GraphQLUnionType({
 *       name: 'Pet',
 *       types: [ DogType, CatType ],
 *       resolveType(value) {
 *         if (value instanceof Dog) {
 *           return DogType;
 *         }
 *         if (value instanceof Cat) {
 *           return CatType;
 *         }
 *       }
 *     });
 *
 */

var GraphQLUnionType = (function () {
  function GraphQLUnionType(config) {
    var _this = this;

    _classCallCheck(this, GraphQLUnionType);

    (0, _jsutilsInvariant2['default'])(config.name, 'Type must be named.');
    assertValidName(config.name);
    this.name = config.name;
    this.description = config.description;
    if (config.resolveType) {
      (0, _jsutilsInvariant2['default'])(typeof config.resolveType === 'function', this + ' must provide "resolveType" as a function.');
    }
    this.resolveType = config.resolveType;
    (0, _jsutilsInvariant2['default'])(Array.isArray(config.types) && config.types.length > 0, 'Must provide Array of types for Union ' + config.name + '.');
    config.types.forEach(function (type) {
      (0, _jsutilsInvariant2['default'])(type instanceof GraphQLObjectType, _this + ' may only contain Object types, it cannot contain: ' + type + '.');
      if (typeof _this.resolveType !== 'function') {
        (0, _jsutilsInvariant2['default'])(typeof type.isTypeOf === 'function', 'Union Type ' + _this + ' does not provide a "resolveType" function ' + ('and possible Type ' + type + ' does not provide a "isTypeOf" ') + 'function. There is no way to resolve this possible type ' + 'during execution.');
      }
    });
    this._types = config.types;
    this._typeConfig = config;
  }

  _createClass(GraphQLUnionType, [{
    key: 'getPossibleTypes',
    value: function getPossibleTypes() {
      return this._types;
    }
  }, {
    key: 'isPossibleType',
    value: function isPossibleType(type) {
      var possibleTypeNames = this._possibleTypeNames;
      if (!possibleTypeNames) {
        this._possibleTypeNames = possibleTypeNames = this.getPossibleTypes().reduce(function (map, possibleType) {
          return (map[possibleType.name] = true, map);
        }, {});
      }
      return possibleTypeNames[type.name] === true;
    }
  }, {
    key: 'getObjectType',
    value: function getObjectType(value, info) {
      var resolver = this._typeConfig.resolveType;
      return resolver ? resolver(value, info) : getTypeOf(value, info, this);
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.name;
    }
  }]);

  return GraphQLUnionType;
})();

exports.GraphQLUnionType = GraphQLUnionType;

/**
 * Enum Type Definition
 *
 * Some leaf values of requests and input values are Enums. GraphQL serializes
 * Enum values as strings, however internally Enums can be represented by any
 * kind of type, often integers.
 *
 * Example:
 *
 *     const RGBType = new GraphQLEnumType({
 *       name: 'RGB',
 *       values: {
 *         RED: { value: 0 },
 *         GREEN: { value: 1 },
 *         BLUE: { value: 2 }
 *       }
 *     });
 *
 * Note: If a value is not provided in a definition, the name of the enum value
 * will be used as its internal value.
 */

var GraphQLEnumType /* <T> */ = (function () {
  function GraphQLEnumType(config /* <T> */) {
    _classCallCheck(this, GraphQLEnumType);

    this.name = config.name;
    assertValidName(config.name);
    this.description = config.description;
    this._values = defineEnumValues(this, config.values);
    this._enumConfig = config;
  }

  _createClass(GraphQLEnumType, [{
    key: 'getValues',
    value: function getValues() /* <T> */{
      return this._values;
    }
  }, {
    key: 'serialize',
    value: function serialize(value /* T */) {
      var enumValue = this._getValueLookup().get(value);
      return enumValue ? enumValue.name : null;
    }
  }, {
    key: 'parseValue',
    value: function parseValue(value) /* T */{
      if (typeof value === 'string') {
        var enumValue = this._getNameLookup()[value];
        if (enumValue) {
          return enumValue.value;
        }
      }
    }
  }, {
    key: 'parseLiteral',
    value: function parseLiteral(valueAST) /* T */{
      if (valueAST.kind === _languageKinds.ENUM) {
        var enumValue = this._getNameLookup()[valueAST.value];
        if (enumValue) {
          return enumValue.value;
        }
      }
    }
  }, {
    key: '_getValueLookup',
    value: function _getValueLookup() {
      var _this2 = this;

      if (!this._valueLookup) {
        (function () {
          var lookup = new _Map();
          _this2.getValues().forEach(function (value) {
            lookup.set(value.value, value);
          });
          _this2._valueLookup = lookup;
        })();
      }
      return this._valueLookup;
    }
  }, {
    key: '_getNameLookup',
    value: function _getNameLookup() {
      var _this3 = this;

      if (!this._nameLookup) {
        (function () {
          var lookup = _Object$create(null);
          _this3.getValues().forEach(function (value) {
            lookup[value.name] = value;
          });
          _this3._nameLookup = lookup;
        })();
      }
      return this._nameLookup;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.name;
    }
  }]);

  return GraphQLEnumType;
})();

exports.GraphQLEnumType = GraphQLEnumType;

function defineEnumValues(type, valueMap /* <T> */
) /* <T> */{
  (0, _jsutilsInvariant2['default'])(isPlainObj(valueMap), type + ' values must be an object with value names as keys.');
  var valueNames = _Object$keys(valueMap);
  (0, _jsutilsInvariant2['default'])(valueNames.length > 0, type + ' values must be an object with value names as keys.');
  return valueNames.map(function (valueName) {
    assertValidName(valueName);
    var value = valueMap[valueName];
    (0, _jsutilsInvariant2['default'])(isPlainObj(value), type + '.' + valueName + ' must refer to an object with a "value" key ' + ('representing an internal value but got: ' + value + '.'));
    (0, _jsutilsInvariant2['default'])(!value.hasOwnProperty('isDeprecated'), type + '.' + valueName + ' should provide "deprecationReason" instead ' + 'of "isDeprecated".');
    return {
      name: valueName,
      description: value.description,
      deprecationReason: value.deprecationReason,
      value: (0, _jsutilsIsNullish2['default'])(value.value) ? valueName : value.value
    };
  });
}

/* <T> */ /* T */

/**
 * Input Object Type Definition
 *
 * An input object defines a structured collection of fields which may be
 * supplied to a field argument.
 *
 * Using `NonNull` will ensure that a value must be provided by the query
 *
 * Example:
 *
 *     const GeoPoint = new GraphQLInputObjectType({
 *       name: 'GeoPoint',
 *       fields: {
 *         lat: { type: new GraphQLNonNull(GraphQLFloat) },
 *         lon: { type: new GraphQLNonNull(GraphQLFloat) },
 *         alt: { type: GraphQLFloat, defaultValue: 0 },
 *       }
 *     });
 *
 */

var GraphQLInputObjectType = (function () {
  function GraphQLInputObjectType(config) {
    _classCallCheck(this, GraphQLInputObjectType);

    (0, _jsutilsInvariant2['default'])(config.name, 'Type must be named.');
    assertValidName(config.name);
    this.name = config.name;
    this.description = config.description;
    this._typeConfig = config;
  }

  _createClass(GraphQLInputObjectType, [{
    key: 'getFields',
    value: function getFields() {
      return this._fields || (this._fields = this._defineFieldMap());
    }
  }, {
    key: '_defineFieldMap',
    value: function _defineFieldMap() {
      var _this4 = this;

      var fieldMap = resolveMaybeThunk(this._typeConfig.fields);
      (0, _jsutilsInvariant2['default'])(isPlainObj(fieldMap), this + ' fields must be an object with field names as keys or a ' + 'function which returns such an object.');
      var fieldNames = _Object$keys(fieldMap);
      (0, _jsutilsInvariant2['default'])(fieldNames.length > 0, this + ' fields must be an object with field names as keys or a ' + 'function which returns such an object.');
      var resultFieldMap = {};
      fieldNames.forEach(function (fieldName) {
        assertValidName(fieldName);
        var field = _extends({}, fieldMap[fieldName], {
          name: fieldName
        });
        (0, _jsutilsInvariant2['default'])(isInputType(field.type), _this4 + '.' + fieldName + ' field type must be Input Type but ' + ('got: ' + field.type + '.'));
        resultFieldMap[fieldName] = field;
      });
      return resultFieldMap;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.name;
    }
  }]);

  return GraphQLInputObjectType;
})();

exports.GraphQLInputObjectType = GraphQLInputObjectType;

/**
 * List Modifier
 *
 * A list is a kind of type marker, a wrapping type which points to another
 * type. Lists are often created within the context of defining the fields of
 * an object type.
 *
 * Example:
 *
 *     const PersonType = new GraphQLObjectType({
 *       name: 'Person',
 *       fields: () => ({
 *         parents: { type: new GraphQLList(Person) },
 *         children: { type: new GraphQLList(Person) },
 *       })
 *     })
 *
 */

var GraphQLList = (function () {
  function GraphQLList(type) {
    _classCallCheck(this, GraphQLList);

    (0, _jsutilsInvariant2['default'])(isType(type), 'Can only create List of a GraphQLType but got: ' + type + '.');
    this.ofType = type;
  }

  /**
   * Non-Null Modifier
   *
   * A non-null is a kind of type marker, a wrapping type which points to another
   * type. Non-null types enforce that their values are never null and can ensure
   * an error is raised if this ever occurs during a request. It is useful for
   * fields which you can make a strong guarantee on non-nullability, for example
   * usually the id field of a database row will never be null.
   *
   * Example:
   *
   *     const RowType = new GraphQLObjectType({
   *       name: 'Row',
   *       fields: () => ({
   *         id: { type: new GraphQLNonNull(GraphQLString) },
   *       })
   *     })
   *
   * Note: the enforcement of non-nullability occurs within the executor.
   */

  _createClass(GraphQLList, [{
    key: 'toString',
    value: function toString() {
      return '[' + String(this.ofType) + ']';
    }
  }]);

  return GraphQLList;
})();

exports.GraphQLList = GraphQLList;

var GraphQLNonNull = (function () {
  function GraphQLNonNull(type) {
    _classCallCheck(this, GraphQLNonNull);

    (0, _jsutilsInvariant2['default'])(isType(type) && !(type instanceof GraphQLNonNull), 'Can only create NonNull of a Nullable GraphQLType but got: ' + type + '.');
    this.ofType = type;
  }

  _createClass(GraphQLNonNull, [{
    key: 'toString',
    value: function toString() {
      return this.ofType.toString() + '!';
    }
  }]);

  return GraphQLNonNull;
})();

exports.GraphQLNonNull = GraphQLNonNull;

var NAME_RX = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

// Helper to assert that provided names are valid.
function assertValidName(name) {
  (0, _jsutilsInvariant2['default'])(NAME_RX.test(name), 'Names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/ but "' + name + '" does not.');
}

/**
 * Optionally provide a custom type resolver function. If one is not provided,
 * the default implementation will call `isTypeOf` on each implementing
 * Object type.
 */

/**
 * Optionally provide a custom type resolver function. If one is not provided,
 * the default implementation will call `isTypeOf` on each implementing
 * Object type.
 */
/* <T> */ /* <T> */ /* T */ /* T */ /* <T> */ /* <T> */ /* <T> */ /* <T> */ /* T */ /* <T> */
},{"../jsutils/invariant":159,"../jsutils/isNullish":160,"../jsutils/keyMap":161,"../language/kinds":164,"babel-runtime/core-js/map":7,"babel-runtime/core-js/object/create":9,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/extends":18,"babel-runtime/helpers/interop-require-default":21}],172:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _definition = require('./definition');

var _scalars = require('./scalars');

/**
 * Directives are used by the GraphQL runtime as a way of modifying execution
 * behavior. Type system creators will usually not create these directly.
 */

var GraphQLDirective = function GraphQLDirective(config) {
  _classCallCheck(this, GraphQLDirective);

  this.name = config.name;
  this.description = config.description;
  this.args = config.args || [];
  this.onOperation = Boolean(config.onOperation);
  this.onFragment = Boolean(config.onFragment);
  this.onField = Boolean(config.onField);
};

exports.GraphQLDirective = GraphQLDirective;

/**
 * Used to conditionally include fields or fragments
 */
var GraphQLIncludeDirective = new GraphQLDirective({
  name: 'include',
  description: 'Directs the executor to include this field or fragment only when ' + 'the `if` argument is true.',
  args: [{ name: 'if',
    type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
    description: 'Included when true.' }],
  onOperation: false,
  onFragment: true,
  onField: true
});

exports.GraphQLIncludeDirective = GraphQLIncludeDirective;
/**
 * Used to conditionally skip (exclude) fields or fragments
 */
var GraphQLSkipDirective = new GraphQLDirective({
  name: 'skip',
  description: 'Directs the executor to skip this field or fragment when the `if` ' + 'argument is true.',
  args: [{ name: 'if',
    type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
    description: 'Skipped when true.' }],
  onOperation: false,
  onFragment: true,
  onField: true
});
exports.GraphQLSkipDirective = GraphQLSkipDirective;
},{"./definition":171,"./scalars":175,"babel-runtime/helpers/class-call-check":16}],173:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

// GraphQL Schema definition
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _schema = require('./schema');

Object.defineProperty(exports, 'GraphQLSchema', {
  enumerable: true,
  get: function get() {
    return _schema.GraphQLSchema;
  }
});

var _definition = require('./definition');

Object.defineProperty(exports, 'isType', {
  enumerable: true,
  get: function get() {
    return _definition.isType;
  }
});
Object.defineProperty(exports, 'isInputType', {
  enumerable: true,
  get: function get() {
    return _definition.isInputType;
  }
});
Object.defineProperty(exports, 'isOutputType', {
  enumerable: true,
  get: function get() {
    return _definition.isOutputType;
  }
});
Object.defineProperty(exports, 'isLeafType', {
  enumerable: true,
  get: function get() {
    return _definition.isLeafType;
  }
});
Object.defineProperty(exports, 'isCompositeType', {
  enumerable: true,
  get: function get() {
    return _definition.isCompositeType;
  }
});
Object.defineProperty(exports, 'isAbstractType', {
  enumerable: true,
  get: function get() {
    return _definition.isAbstractType;
  }
});
Object.defineProperty(exports, 'getNullableType', {
  enumerable: true,
  get: function get() {
    return _definition.getNullableType;
  }
});
Object.defineProperty(exports, 'getNamedType', {
  enumerable: true,
  get: function get() {
    return _definition.getNamedType;
  }
});
Object.defineProperty(exports, 'GraphQLScalarType', {
  enumerable: true,
  get: function get() {
    return _definition.GraphQLScalarType;
  }
});
Object.defineProperty(exports, 'GraphQLObjectType', {
  enumerable: true,
  get: function get() {
    return _definition.GraphQLObjectType;
  }
});
Object.defineProperty(exports, 'GraphQLInterfaceType', {
  enumerable: true,
  get: function get() {
    return _definition.GraphQLInterfaceType;
  }
});
Object.defineProperty(exports, 'GraphQLUnionType', {
  enumerable: true,
  get: function get() {
    return _definition.GraphQLUnionType;
  }
});
Object.defineProperty(exports, 'GraphQLEnumType', {
  enumerable: true,
  get: function get() {
    return _definition.GraphQLEnumType;
  }
});
Object.defineProperty(exports, 'GraphQLInputObjectType', {
  enumerable: true,
  get: function get() {
    return _definition.GraphQLInputObjectType;
  }
});
Object.defineProperty(exports, 'GraphQLList', {
  enumerable: true,
  get: function get() {
    return _definition.GraphQLList;
  }
});
Object.defineProperty(exports, 'GraphQLNonNull', {
  enumerable: true,
  get: function get() {
    return _definition.GraphQLNonNull;
  }
});

// Common built-in scalar instances.

var _scalars = require('./scalars');

Object.defineProperty(exports, 'GraphQLInt', {
  enumerable: true,
  get: function get() {
    return _scalars.GraphQLInt;
  }
});
Object.defineProperty(exports, 'GraphQLFloat', {
  enumerable: true,
  get: function get() {
    return _scalars.GraphQLFloat;
  }
});
Object.defineProperty(exports, 'GraphQLString', {
  enumerable: true,
  get: function get() {
    return _scalars.GraphQLString;
  }
});
Object.defineProperty(exports, 'GraphQLBoolean', {
  enumerable: true,
  get: function get() {
    return _scalars.GraphQLBoolean;
  }
});
Object.defineProperty(exports, 'GraphQLID', {
  enumerable: true,
  get: function get() {
    return _scalars.GraphQLID;
  }
});

// Predicates

// Un-modifiers

// Definitions
},{"./definition":171,"./scalars":175,"./schema":176}],174:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _utilitiesAstFromValue = require('../utilities/astFromValue');

var _languagePrinter = require('../language/printer');

var _definition = require('./definition');

var _scalars = require('./scalars');

var __Schema = new _definition.GraphQLObjectType({
  name: '__Schema',
  description: 'A GraphQL Schema defines the capabilities of a GraphQL server. It ' + 'exposes all available types and directives on the server, as well as ' + 'the entry points for query, mutation, and subscription operations.',
  fields: function fields() {
    return {
      types: {
        description: 'A list of all types supported by this server.',
        type: new _definition.GraphQLNonNull(new _definition.GraphQLList(new _definition.GraphQLNonNull(__Type))),
        resolve: function resolve(schema) {
          var typeMap = schema.getTypeMap();
          return _Object$keys(typeMap).map(function (key) {
            return typeMap[key];
          });
        }
      },
      queryType: {
        description: 'The type that query operations will be rooted at.',
        type: new _definition.GraphQLNonNull(__Type),
        resolve: function resolve(schema) {
          return schema.getQueryType();
        }
      },
      mutationType: {
        description: 'If this server supports mutation, the type that ' + 'mutation operations will be rooted at.',
        type: __Type,
        resolve: function resolve(schema) {
          return schema.getMutationType();
        }
      },
      subscriptionType: {
        description: 'If this server support subscription, the type that ' + 'subscription operations will be rooted at.',
        type: __Type,
        resolve: function resolve(schema) {
          return schema.getSubscriptionType();
        }
      },
      directives: {
        description: 'A list of all directives supported by this server.',
        type: new _definition.GraphQLNonNull(new _definition.GraphQLList(new _definition.GraphQLNonNull(__Directive))),
        resolve: function resolve(schema) {
          return schema.getDirectives();
        }
      }
    };
  }
});

exports.__Schema = __Schema;
var __Directive = new _definition.GraphQLObjectType({
  name: '__Directive',
  description: 'A Directive provides a way to describe alternate runtime execution and ' + 'type validation behavior in a GraphQL document.' + '\n\nIn some cases, you need to provide options to alter GraphQL’s ' + 'execution behavior in ways field arguments will not suffice, such as ' + 'conditionally including or skipping a field. Directives provide this by ' + 'describing additional information to the executor.',
  fields: function fields() {
    return {
      name: { type: new _definition.GraphQLNonNull(_scalars.GraphQLString) },
      description: { type: _scalars.GraphQLString },
      args: {
        type: new _definition.GraphQLNonNull(new _definition.GraphQLList(new _definition.GraphQLNonNull(__InputValue))),
        resolve: function resolve(directive) {
          return directive.args || [];
        }
      },
      onOperation: { type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean) },
      onFragment: { type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean) },
      onField: { type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean) }
    };
  }
});

var __Type = new _definition.GraphQLObjectType({
  name: '__Type',
  description: 'The fundamental unit of any GraphQL Schema is the type. There are ' + 'many kinds of types in GraphQL as represented by the `__TypeKind` enum.' + '\n\nDepending on the kind of a type, certain fields describe ' + 'information about that type. Scalar types provide no information ' + 'beyond a name and description, while Enum types provide their values. ' + 'Object and Interface types provide the fields they describe. Abstract ' + 'types, Union and Interface, provide the Object types possible ' + 'at runtime. List and NonNull types compose other types.',
  fields: function fields() {
    return {
      kind: {
        type: new _definition.GraphQLNonNull(__TypeKind),
        resolve: function resolve(type) {
          if (type instanceof _definition.GraphQLScalarType) {
            return TypeKind.SCALAR;
          } else if (type instanceof _definition.GraphQLObjectType) {
            return TypeKind.OBJECT;
          } else if (type instanceof _definition.GraphQLInterfaceType) {
            return TypeKind.INTERFACE;
          } else if (type instanceof _definition.GraphQLUnionType) {
            return TypeKind.UNION;
          } else if (type instanceof _definition.GraphQLEnumType) {
            return TypeKind.ENUM;
          } else if (type instanceof _definition.GraphQLInputObjectType) {
            return TypeKind.INPUT_OBJECT;
          } else if (type instanceof _definition.GraphQLList) {
            return TypeKind.LIST;
          } else if (type instanceof _definition.GraphQLNonNull) {
            return TypeKind.NON_NULL;
          }
          throw new Error('Unknown kind of type: ' + type);
        }
      },
      name: { type: _scalars.GraphQLString },
      description: { type: _scalars.GraphQLString },
      fields: {
        type: new _definition.GraphQLList(new _definition.GraphQLNonNull(__Field)),
        args: {
          includeDeprecated: { type: _scalars.GraphQLBoolean, defaultValue: false }
        },
        resolve: function resolve(type, _ref) {
          var includeDeprecated = _ref.includeDeprecated;

          if (type instanceof _definition.GraphQLObjectType || type instanceof _definition.GraphQLInterfaceType) {
            var _ret = (function () {
              var fieldMap = type.getFields();
              var fields = _Object$keys(fieldMap).map(function (fieldName) {
                return fieldMap[fieldName];
              });
              if (!includeDeprecated) {
                fields = fields.filter(function (field) {
                  return !field.deprecationReason;
                });
              }
              return {
                v: fields
              };
            })();

            if (typeof _ret === 'object') return _ret.v;
          }
          return null;
        }
      },
      interfaces: {
        type: new _definition.GraphQLList(new _definition.GraphQLNonNull(__Type)),
        resolve: function resolve(type) {
          if (type instanceof _definition.GraphQLObjectType) {
            return type.getInterfaces();
          }
        }
      },
      possibleTypes: {
        type: new _definition.GraphQLList(new _definition.GraphQLNonNull(__Type)),
        resolve: function resolve(type) {
          if (type instanceof _definition.GraphQLInterfaceType || type instanceof _definition.GraphQLUnionType) {
            return type.getPossibleTypes();
          }
        }
      },
      enumValues: {
        type: new _definition.GraphQLList(new _definition.GraphQLNonNull(__EnumValue)),
        args: {
          includeDeprecated: { type: _scalars.GraphQLBoolean, defaultValue: false }
        },
        resolve: function resolve(type, _ref2) {
          var includeDeprecated = _ref2.includeDeprecated;

          if (type instanceof _definition.GraphQLEnumType) {
            var values = type.getValues();
            if (!includeDeprecated) {
              values = values.filter(function (value) {
                return !value.deprecationReason;
              });
            }
            return values;
          }
        }
      },
      inputFields: {
        type: new _definition.GraphQLList(new _definition.GraphQLNonNull(__InputValue)),
        resolve: function resolve(type) {
          if (type instanceof _definition.GraphQLInputObjectType) {
            var _ret2 = (function () {
              var fieldMap = type.getFields();
              return {
                v: _Object$keys(fieldMap).map(function (fieldName) {
                  return fieldMap[fieldName];
                })
              };
            })();

            if (typeof _ret2 === 'object') return _ret2.v;
          }
        }
      },
      ofType: { type: __Type }
    };
  }
});

var __Field = new _definition.GraphQLObjectType({
  name: '__Field',
  description: 'Object and Interface types are described by a list of Fields, each of ' + 'which has a name, potentially a list of arguments, and a return type.',
  fields: function fields() {
    return {
      name: { type: new _definition.GraphQLNonNull(_scalars.GraphQLString) },
      description: { type: _scalars.GraphQLString },
      args: {
        type: new _definition.GraphQLNonNull(new _definition.GraphQLList(new _definition.GraphQLNonNull(__InputValue))),
        resolve: function resolve(field) {
          return field.args || [];
        }
      },
      type: { type: new _definition.GraphQLNonNull(__Type) },
      isDeprecated: {
        type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
        resolve: function resolve(field) {
          return !(0, _jsutilsIsNullish2['default'])(field.deprecationReason);
        }
      },
      deprecationReason: {
        type: _scalars.GraphQLString
      }
    };
  }
});

var __InputValue = new _definition.GraphQLObjectType({
  name: '__InputValue',
  description: 'Arguments provided to Fields or Directives and the input fields of an ' + 'InputObject are represented as Input Values which describe their type ' + 'and optionally a default value.',
  fields: function fields() {
    return {
      name: { type: new _definition.GraphQLNonNull(_scalars.GraphQLString) },
      description: { type: _scalars.GraphQLString },
      type: { type: new _definition.GraphQLNonNull(__Type) },
      defaultValue: {
        type: _scalars.GraphQLString,
        description: 'A GraphQL-formatted string representing the default value for this ' + 'input value.',
        resolve: function resolve(inputVal) {
          return (0, _jsutilsIsNullish2['default'])(inputVal.defaultValue) ? null : (0, _languagePrinter.print)((0, _utilitiesAstFromValue.astFromValue)(inputVal.defaultValue, inputVal));
        }
      }
    };
  }
});

var __EnumValue = new _definition.GraphQLObjectType({
  name: '__EnumValue',
  description: 'One possible value for a given Enum. Enum values are unique values, not ' + 'a placeholder for a string or numeric value. However an Enum value is ' + 'returned in a JSON response as a string.',
  fields: function fields() {
    return {
      name: { type: new _definition.GraphQLNonNull(_scalars.GraphQLString) },
      description: { type: _scalars.GraphQLString },
      isDeprecated: {
        type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
        resolve: function resolve(enumValue) {
          return !(0, _jsutilsIsNullish2['default'])(enumValue.deprecationReason);
        }
      },
      deprecationReason: {
        type: _scalars.GraphQLString
      }
    };
  }
});

var TypeKind = {
  SCALAR: 'SCALAR',
  OBJECT: 'OBJECT',
  INTERFACE: 'INTERFACE',
  UNION: 'UNION',
  ENUM: 'ENUM',
  INPUT_OBJECT: 'INPUT_OBJECT',
  LIST: 'LIST',
  NON_NULL: 'NON_NULL'
};

exports.TypeKind = TypeKind;
var __TypeKind = new _definition.GraphQLEnumType({
  name: '__TypeKind',
  description: 'An enum describing what kind of type a given `__Type` is.',
  values: {
    SCALAR: {
      value: TypeKind.SCALAR,
      description: 'Indicates this type is a scalar.'
    },
    OBJECT: {
      value: TypeKind.OBJECT,
      description: 'Indicates this type is an object. ' + '`fields` and `interfaces` are valid fields.'
    },
    INTERFACE: {
      value: TypeKind.INTERFACE,
      description: 'Indicates this type is an interface. ' + '`fields` and `possibleTypes` are valid fields.'
    },
    UNION: {
      value: TypeKind.UNION,
      description: 'Indicates this type is a union. ' + '`possibleTypes` is a valid field.'
    },
    ENUM: {
      value: TypeKind.ENUM,
      description: 'Indicates this type is an enum. ' + '`enumValues` is a valid field.'
    },
    INPUT_OBJECT: {
      value: TypeKind.INPUT_OBJECT,
      description: 'Indicates this type is an input object. ' + '`inputFields` is a valid field.'
    },
    LIST: {
      value: TypeKind.LIST,
      description: 'Indicates this type is a list. ' + '`ofType` is a valid field.'
    },
    NON_NULL: {
      value: TypeKind.NON_NULL,
      description: 'Indicates this type is a non-null. ' + '`ofType` is a valid field.'
    }
  }
});

/**
 * Note that these are GraphQLFieldDefinition and not GraphQLFieldConfig,
 * so the format for args is different.
 */

var SchemaMetaFieldDef = {
  name: '__schema',
  type: new _definition.GraphQLNonNull(__Schema),
  description: 'Access the current type schema of this server.',
  args: [],
  resolve: function resolve(source, args, _ref3) {
    var schema = _ref3.schema;
    return schema;
  }
};

exports.SchemaMetaFieldDef = SchemaMetaFieldDef;
var TypeMetaFieldDef = {
  name: '__type',
  type: __Type,
  description: 'Request the type information of a single type.',
  args: [{ name: 'name', type: new _definition.GraphQLNonNull(_scalars.GraphQLString) }],
  resolve: function resolve(source, _ref4, _ref5) {
    var name = _ref4.name;
    var schema = _ref5.schema;
    return (function () {
      return schema.getType(name);
    })();
  }
};

exports.TypeMetaFieldDef = TypeMetaFieldDef;
var TypeNameMetaFieldDef = {
  name: '__typename',
  type: new _definition.GraphQLNonNull(_scalars.GraphQLString),
  description: 'The name of the current Object type at runtime.',
  args: [],
  resolve: function resolve(source, args, _ref6) {
    var parentType = _ref6.parentType;
    return parentType.name;
  }
};
exports.TypeNameMetaFieldDef = TypeNameMetaFieldDef;
},{"../jsutils/isNullish":160,"../language/printer":168,"../utilities/astFromValue":178,"./definition":171,"./scalars":175,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/interop-require-default":21}],175:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _definition = require('./definition');

var _language = require('../language');

// As per the GraphQL Spec, Integers are only treated as valid when a valid
// 32-bit signed integer, providing the broadest support across platforms.
//
// n.b. JavaScript's integers are safe between -(2^53 - 1) and 2^53 - 1 because
// they are internally represented as IEEE 754 doubles.
var MAX_INT = 2147483647;
var MIN_INT = -2147483648;

function coerceInt(value) {
  var num = Number(value);
  if (num === num && num <= MAX_INT && num >= MIN_INT) {
    return (num < 0 ? Math.ceil : Math.floor)(num);
  }
  return null;
}

var GraphQLInt = new _definition.GraphQLScalarType({
  name: 'Int',
  description: 'The `Int` scalar type represents non-fractional signed whole numeric ' + 'values. Int can represent values between -(2^31) and 2^31 - 1. ',
  serialize: coerceInt,
  parseValue: coerceInt,
  parseLiteral: function parseLiteral(ast) {
    if (ast.kind === _language.Kind.INT) {
      var num = parseInt(ast.value, 10);
      if (num <= MAX_INT && num >= MIN_INT) {
        return num;
      }
    }
    return null;
  }
});

exports.GraphQLInt = GraphQLInt;
function coerceFloat(value) {
  var num = Number(value);
  return num === num ? num : null;
}

var GraphQLFloat = new _definition.GraphQLScalarType({
  name: 'Float',
  description: 'The `Float` scalar type represents signed double-precision fractional ' + 'values as specified by ' + '[IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point). ',
  serialize: coerceFloat,
  parseValue: coerceFloat,
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === _language.Kind.FLOAT || ast.kind === _language.Kind.INT ? parseFloat(ast.value) : null;
  }
});

exports.GraphQLFloat = GraphQLFloat;
var GraphQLString = new _definition.GraphQLScalarType({
  name: 'String',
  description: 'The `String` scalar type represents textual data, represented as UTF-8 ' + 'character sequences. The String type is most often used by GraphQL to ' + 'represent free-form human-readable text.',
  serialize: String,
  parseValue: String,
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === _language.Kind.STRING ? ast.value : null;
  }
});

exports.GraphQLString = GraphQLString;
var GraphQLBoolean = new _definition.GraphQLScalarType({
  name: 'Boolean',
  description: 'The `Boolean` scalar type represents `true` or `false`.',
  serialize: Boolean,
  parseValue: Boolean,
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === _language.Kind.BOOLEAN ? ast.value : null;
  }
});

exports.GraphQLBoolean = GraphQLBoolean;
var GraphQLID = new _definition.GraphQLScalarType({
  name: 'ID',
  description: 'The `ID` scalar type represents a unique identifier, often used to ' + 'refetch an object or as key for a cache. The ID type appears in a JSON ' + 'response as a String; however, it is not intended to be human-readable. ' + 'When expected as an input type, any string (such as `"4"`) or integer ' + '(such as `4`) input value will be accepted as an ID.',
  serialize: String,
  parseValue: String,
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === _language.Kind.STRING || ast.kind === _language.Kind.INT ? ast.value : null;
  }
});
exports.GraphQLID = GraphQLID;
},{"../language":163,"./definition":171}],176:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _definition = require('./definition');

var _directives = require('./directives');

var _introspection = require('./introspection');

var _jsutilsFind = require('../jsutils/find');

var _jsutilsFind2 = _interopRequireDefault(_jsutilsFind);

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _utilitiesTypeComparators = require('../utilities/typeComparators');

/**
 * Schema Definition
 *
 * A Schema is created by supplying the root types of each type of operation,
 * query and mutation (optional). A schema definition is then supplied to the
 * validator and executor.
 *
 * Example:
 *
 *     const MyAppSchema = new GraphQLSchema({
 *       query: MyAppQueryRootType
 *       mutation: MyAppMutationRootType
 *     });
 *
 */

var GraphQLSchema = (function () {
  function GraphQLSchema(config) {
    var _this = this;

    _classCallCheck(this, GraphQLSchema);

    (0, _jsutilsInvariant2['default'])(typeof config === 'object', 'Must provide configuration object.');

    (0, _jsutilsInvariant2['default'])(config.query instanceof _definition.GraphQLObjectType, 'Schema query must be Object Type but got: ' + config.query + '.');
    this._queryType = config.query;

    (0, _jsutilsInvariant2['default'])(!config.mutation || config.mutation instanceof _definition.GraphQLObjectType, 'Schema mutation must be Object Type if provided but ' + ('got: ' + config.mutation + '.'));
    this._mutationType = config.mutation;

    (0, _jsutilsInvariant2['default'])(!config.subscription || config.subscription instanceof _definition.GraphQLObjectType, 'Schema subscription must be Object Type if provided but ' + ('got: ' + config.subscription + '.'));
    this._subscriptionType = config.subscription;

    (0, _jsutilsInvariant2['default'])(!config.directives || Array.isArray(config.directives) && config.directives.every(function (directive) {
      return directive instanceof _directives.GraphQLDirective;
    }), 'Schema directives must be Array<GraphQLDirective> if provided but ' + ('got: ' + config.directives + '.'));
    // Provide `@include() and `@skip()` directives by default.
    this._directives = config.directives || [_directives.GraphQLIncludeDirective, _directives.GraphQLSkipDirective];

    // Build type map now to detect any errors within this schema.
    this._typeMap = [this.getQueryType(), this.getMutationType(), this.getSubscriptionType(), _introspection.__Schema].reduce(typeMapReducer, {});

    // Enforce correct interface implementations
    _Object$keys(this._typeMap).forEach(function (typeName) {
      var type = _this._typeMap[typeName];
      if (type instanceof _definition.GraphQLObjectType) {
        type.getInterfaces().forEach(function (iface) {
          return assertObjectImplementsInterface(type, iface);
        });
      }
    });
  }

  _createClass(GraphQLSchema, [{
    key: 'getQueryType',
    value: function getQueryType() {
      return this._queryType;
    }
  }, {
    key: 'getMutationType',
    value: function getMutationType() {
      return this._mutationType;
    }
  }, {
    key: 'getSubscriptionType',
    value: function getSubscriptionType() {
      return this._subscriptionType;
    }
  }, {
    key: 'getTypeMap',
    value: function getTypeMap() {
      return this._typeMap;
    }
  }, {
    key: 'getType',
    value: function getType(name) {
      return this.getTypeMap()[name];
    }
  }, {
    key: 'getDirectives',
    value: function getDirectives() {
      return this._directives;
    }
  }, {
    key: 'getDirective',
    value: function getDirective(name) {
      return (0, _jsutilsFind2['default'])(this.getDirectives(), function (directive) {
        return directive.name === name;
      });
    }
  }]);

  return GraphQLSchema;
})();

exports.GraphQLSchema = GraphQLSchema;

function typeMapReducer(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var map = _x,
        type = _x2;
    reducedMap = undefined;
    _again = false;

    if (!type) {
      return map;
    }
    if (type instanceof _definition.GraphQLList || type instanceof _definition.GraphQLNonNull) {
      _x = map;
      _x2 = type.ofType;
      _again = true;
      continue _function;
    }
    if (map[type.name]) {
      (0, _jsutilsInvariant2['default'])(map[type.name] === type, 'Schema must contain unique named types but contains multiple ' + ('types named "' + type + '".'));
      return map;
    }
    map[type.name] = type;

    var reducedMap = map;

    if (type instanceof _definition.GraphQLUnionType || type instanceof _definition.GraphQLInterfaceType) {
      reducedMap = type.getPossibleTypes().reduce(typeMapReducer, reducedMap);
    }

    if (type instanceof _definition.GraphQLObjectType) {
      reducedMap = type.getInterfaces().reduce(typeMapReducer, reducedMap);
    }

    if (type instanceof _definition.GraphQLObjectType || type instanceof _definition.GraphQLInterfaceType || type instanceof _definition.GraphQLInputObjectType) {
      (function () {
        var fieldMap = type.getFields();
        _Object$keys(fieldMap).forEach(function (fieldName) {
          var field = fieldMap[fieldName];

          if (field.args) {
            var fieldArgTypes = field.args.map(function (arg) {
              return arg.type;
            });
            reducedMap = fieldArgTypes.reduce(typeMapReducer, reducedMap);
          }
          reducedMap = typeMapReducer(reducedMap, field.type);
        });
      })();
    }

    return reducedMap;
  }
}

function assertObjectImplementsInterface(object, iface) {
  var objectFieldMap = object.getFields();
  var ifaceFieldMap = iface.getFields();

  // Assert each interface field is implemented.
  _Object$keys(ifaceFieldMap).forEach(function (fieldName) {
    var objectField = objectFieldMap[fieldName];
    var ifaceField = ifaceFieldMap[fieldName];

    // Assert interface field exists on object.
    (0, _jsutilsInvariant2['default'])(objectField, '"' + iface + '" expects field "' + fieldName + '" but "' + object + '" does not ' + 'provide it.');

    // Assert interface field type is satisfied by object field type, by being
    // a valid subtype. (covariant)
    (0, _jsutilsInvariant2['default'])((0, _utilitiesTypeComparators.isTypeSubTypeOf)(objectField.type, ifaceField.type), iface + '.' + fieldName + ' expects type "' + ifaceField.type + '" but ' + (object + '.' + fieldName + ' provides type "' + objectField.type + '".'));

    // Assert each interface field arg is implemented.
    ifaceField.args.forEach(function (ifaceArg) {
      var argName = ifaceArg.name;
      var objectArg = (0, _jsutilsFind2['default'])(objectField.args, function (arg) {
        return arg.name === argName;
      });

      // Assert interface field arg exists on object field.
      (0, _jsutilsInvariant2['default'])(objectArg, iface + '.' + fieldName + ' expects argument "' + argName + '" but ' + (object + '.' + fieldName + ' does not provide it.'));

      // Assert interface field arg type matches object field arg type.
      // (invariant)
      (0, _jsutilsInvariant2['default'])((0, _utilitiesTypeComparators.isEqualType)(ifaceArg.type, objectArg.type), iface + '.' + fieldName + '(' + argName + ':) expects type "' + ifaceArg.type + '" ' + ('but ' + object + '.' + fieldName + '(' + argName + ':) provides ') + ('type "' + objectArg.type + '".'));
    });

    // Assert additional arguments must not be required.
    objectField.args.forEach(function (objectArg) {
      var argName = objectArg.name;
      var ifaceArg = (0, _jsutilsFind2['default'])(ifaceField.args, function (arg) {
        return arg.name === argName;
      });
      if (!ifaceArg) {
        (0, _jsutilsInvariant2['default'])(!(objectArg.type instanceof _definition.GraphQLNonNull), object + '.' + fieldName + '(' + argName + ':) is of required type ' + ('"' + objectArg.type + '" but is not also provided by the ') + ('interface ' + iface + '.' + fieldName + '.'));
      }
    });
  });
}
},{"../jsutils/find":158,"../jsutils/invariant":159,"../utilities/typeComparators":189,"./definition":171,"./directives":172,"./introspection":174,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/interop-require-default":21}],177:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireWildcard = require('babel-runtime/helpers/interop-require-wildcard')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _languageKinds = require('../language/kinds');

var Kind = _interopRequireWildcard(_languageKinds);

var _typeDefinition = require('../type/definition');

var _typeIntrospection = require('../type/introspection');

var _typeFromAST = require('./typeFromAST');

var _jsutilsFind = require('../jsutils/find');

var _jsutilsFind2 = _interopRequireDefault(_jsutilsFind);

/**
 * TypeInfo is a utility class which, given a GraphQL schema, can keep track
 * of the current field and type definitions at any point in a GraphQL document
 * AST during a recursive descent by calling `enter(node)` and `leave(node)`.
 */

var TypeInfo = (function () {
  function TypeInfo(schema,
  // NOTE: this experimental optional second parameter is only needed in order
  // to support non-spec-compliant codebases. You should never need to use it.
  getFieldDefFn) {
    _classCallCheck(this, TypeInfo);

    this._schema = schema;
    this._typeStack = [];
    this._parentTypeStack = [];
    this._inputTypeStack = [];
    this._fieldDefStack = [];
    this._directive = null;
    this._argument = null;
    this._getFieldDef = getFieldDefFn || getFieldDef;
  }

  /**
   * Not exactly the same as the executor's definition of getFieldDef, in this
   * statically evaluated environment we do not always have an Object type,
   * and need to handle Interface and Union types.
   */

  _createClass(TypeInfo, [{
    key: 'getType',
    value: function getType() {
      if (this._typeStack.length > 0) {
        return this._typeStack[this._typeStack.length - 1];
      }
    }
  }, {
    key: 'getParentType',
    value: function getParentType() {
      if (this._parentTypeStack.length > 0) {
        return this._parentTypeStack[this._parentTypeStack.length - 1];
      }
    }
  }, {
    key: 'getInputType',
    value: function getInputType() {
      if (this._inputTypeStack.length > 0) {
        return this._inputTypeStack[this._inputTypeStack.length - 1];
      }
    }
  }, {
    key: 'getFieldDef',
    value: function getFieldDef() {
      if (this._fieldDefStack.length > 0) {
        return this._fieldDefStack[this._fieldDefStack.length - 1];
      }
    }
  }, {
    key: 'getDirective',
    value: function getDirective() {
      return this._directive;
    }
  }, {
    key: 'getArgument',
    value: function getArgument() {
      return this._argument;
    }

    // Flow does not yet handle this case.
  }, {
    key: 'enter',
    value: function enter(node /* Node */) {
      var schema = this._schema;
      switch (node.kind) {
        case Kind.SELECTION_SET:
          var namedType = (0, _typeDefinition.getNamedType)(this.getType());
          var compositeType = undefined;
          if ((0, _typeDefinition.isCompositeType)(namedType)) {
            // isCompositeType is a type refining predicate, so this is safe.
            compositeType = namedType;
          }
          this._parentTypeStack.push(compositeType);
          break;
        case Kind.FIELD:
          var parentType = this.getParentType();
          var fieldDef = undefined;
          if (parentType) {
            fieldDef = this._getFieldDef(schema, parentType, node);
          }
          this._fieldDefStack.push(fieldDef);
          this._typeStack.push(fieldDef && fieldDef.type);
          break;
        case Kind.DIRECTIVE:
          this._directive = schema.getDirective(node.name.value);
          break;
        case Kind.OPERATION_DEFINITION:
          var type = undefined;
          if (node.operation === 'query') {
            type = schema.getQueryType();
          } else if (node.operation === 'mutation') {
            type = schema.getMutationType();
          } else if (node.operation === 'subscription') {
            type = schema.getSubscriptionType();
          }
          this._typeStack.push(type);
          break;
        case Kind.INLINE_FRAGMENT:
        case Kind.FRAGMENT_DEFINITION:
          var typeConditionAST = node.typeCondition;
          var outputType = typeConditionAST ? (0, _typeFromAST.typeFromAST)(schema, typeConditionAST) : this.getType();
          this._typeStack.push(outputType);
          break;
        case Kind.VARIABLE_DEFINITION:
          var inputType = (0, _typeFromAST.typeFromAST)(schema, node.type);
          this._inputTypeStack.push(inputType);
          break;
        case Kind.ARGUMENT:
          var argDef = undefined;
          var argType = undefined;
          var fieldOrDirective = this.getDirective() || this.getFieldDef();
          if (fieldOrDirective) {
            argDef = (0, _jsutilsFind2['default'])(fieldOrDirective.args, function (arg) {
              return arg.name === node.name.value;
            });
            if (argDef) {
              argType = argDef.type;
            }
          }
          this._argument = argDef;
          this._inputTypeStack.push(argType);
          break;
        case Kind.LIST:
          var listType = (0, _typeDefinition.getNullableType)(this.getInputType());
          this._inputTypeStack.push(listType instanceof _typeDefinition.GraphQLList ? listType.ofType : undefined);
          break;
        case Kind.OBJECT_FIELD:
          var objectType = (0, _typeDefinition.getNamedType)(this.getInputType());
          var fieldType = undefined;
          if (objectType instanceof _typeDefinition.GraphQLInputObjectType) {
            var inputField = objectType.getFields()[node.name.value];
            fieldType = inputField ? inputField.type : undefined;
          }
          this._inputTypeStack.push(fieldType);
          break;
      }
    }
  }, {
    key: 'leave',
    value: function leave(node) {
      switch (node.kind) {
        case Kind.SELECTION_SET:
          this._parentTypeStack.pop();
          break;
        case Kind.FIELD:
          this._fieldDefStack.pop();
          this._typeStack.pop();
          break;
        case Kind.DIRECTIVE:
          this._directive = null;
          break;
        case Kind.OPERATION_DEFINITION:
        case Kind.INLINE_FRAGMENT:
        case Kind.FRAGMENT_DEFINITION:
          this._typeStack.pop();
          break;
        case Kind.VARIABLE_DEFINITION:
          this._inputTypeStack.pop();
          break;
        case Kind.ARGUMENT:
          this._argument = null;
          this._inputTypeStack.pop();
          break;
        case Kind.LIST:
        case Kind.OBJECT_FIELD:
          this._inputTypeStack.pop();
          break;
      }
    }
  }]);

  return TypeInfo;
})();

exports.TypeInfo = TypeInfo;
function getFieldDef(schema, parentType, fieldAST) {
  var name = fieldAST.name.value;
  if (name === _typeIntrospection.SchemaMetaFieldDef.name && schema.getQueryType() === parentType) {
    return _typeIntrospection.SchemaMetaFieldDef;
  }
  if (name === _typeIntrospection.TypeMetaFieldDef.name && schema.getQueryType() === parentType) {
    return _typeIntrospection.TypeMetaFieldDef;
  }
  if (name === _typeIntrospection.TypeNameMetaFieldDef.name && (parentType instanceof _typeDefinition.GraphQLObjectType || parentType instanceof _typeDefinition.GraphQLInterfaceType || parentType instanceof _typeDefinition.GraphQLUnionType)) {
    return _typeIntrospection.TypeNameMetaFieldDef;
  }
  if (parentType instanceof _typeDefinition.GraphQLObjectType || parentType instanceof _typeDefinition.GraphQLInterfaceType) {
    return parentType.getFields()[name];
  }
}
// It may disappear in the future.
},{"../jsutils/find":158,"../language/kinds":164,"../type/definition":171,"../type/introspection":174,"./typeFromAST":190,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/interop-require-default":21,"babel-runtime/helpers/interop-require-wildcard":22}],178:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.astFromValue = astFromValue;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _languageKinds = require('../language/kinds');

var _typeDefinition = require('../type/definition');

var _typeScalars = require('../type/scalars');

/**
 * Produces a GraphQL Value AST given a JavaScript value.
 *
 * Optionally, a GraphQL type may be provided, which will be used to
 * disambiguate between value primitives.
 *
 * | JSON Value    | GraphQL Value        |
 * | ------------- | -------------------- |
 * | Object        | Input Object         |
 * | Array         | List                 |
 * | Boolean       | Boolean              |
 * | String        | String / Enum Value  |
 * | Number        | Int / Float          |
 *
 */

function astFromValue(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var value = _x,
        type = _x2;
    _value = _ret = stringNum = isIntValue = fields = undefined;
    _again = false;

    // Ensure flow knows that we treat function params as const.
    var _value = value;

    if (type instanceof _typeDefinition.GraphQLNonNull) {
      // Note: we're not checking that the result is non-null.
      // This function is not responsible for validating the input value.
      _x = _value;
      _x2 = type.ofType;
      _again = true;
      continue _function;
    }

    if ((0, _jsutilsIsNullish2['default'])(_value)) {
      return null;
    }

    // Convert JavaScript array to GraphQL list. If the GraphQLType is a list, but
    // the value is not an array, convert the value using the list's item type.
    if (Array.isArray(_value)) {
      var _ret = (function () {
        var itemType = type instanceof _typeDefinition.GraphQLList ? type.ofType : null;
        return {
          v: {
            kind: _languageKinds.LIST,
            values: _value.map(function (item) {
              var itemValue = astFromValue(item, itemType);
              (0, _jsutilsInvariant2['default'])(itemValue, 'Could not create AST item.');
              return itemValue;
            })
          }
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    } else if (type instanceof _typeDefinition.GraphQLList) {
      // Because GraphQL will accept single values as a "list of one" when
      // expecting a list, if there's a non-array value and an expected list type,
      // create an AST using the list's item type.
      _x = _value;
      _x2 = type.ofType;
      _again = true;
      continue _function;
    }

    if (typeof _value === 'boolean') {
      return { kind: _languageKinds.BOOLEAN, value: _value };
    }

    // JavaScript numbers can be Float or Int values. Use the GraphQLType to
    // differentiate if available, otherwise prefer Int if the value is a
    // valid Int.
    if (typeof _value === 'number') {
      var stringNum = String(_value);
      var isIntValue = /^[0-9]+$/.test(stringNum);
      if (isIntValue) {
        if (type === _typeScalars.GraphQLFloat) {
          return { kind: _languageKinds.FLOAT, value: stringNum + '.0' };
        }
        return { kind: _languageKinds.INT, value: stringNum };
      }
      return { kind: _languageKinds.FLOAT, value: stringNum };
    }

    // JavaScript strings can be Enum values or String values. Use the
    // GraphQLType to differentiate if possible.
    if (typeof _value === 'string') {
      if (type instanceof _typeDefinition.GraphQLEnumType && /^[_a-zA-Z][_a-zA-Z0-9]*$/.test(_value)) {
        return { kind: _languageKinds.ENUM, value: _value };
      }
      // Use JSON stringify, which uses the same string encoding as GraphQL,
      // then remove the quotes.
      return { kind: _languageKinds.STRING, value: JSON.stringify(_value).slice(1, -1) };
    }

    // last remaining possible typeof
    (0, _jsutilsInvariant2['default'])(typeof _value === 'object' && _value !== null);

    // Populate the fields of the input object by creating ASTs from each value
    // in the JavaScript object.
    var fields = [];
    _Object$keys(_value).forEach(function (fieldName) {
      var fieldType = undefined;
      if (type instanceof _typeDefinition.GraphQLInputObjectType) {
        var fieldDef = type.getFields()[fieldName];
        fieldType = fieldDef && fieldDef.type;
      }
      var fieldValue = astFromValue(_value[fieldName], fieldType);
      if (fieldValue) {
        fields.push({
          kind: _languageKinds.OBJECT_FIELD,
          name: { kind: _languageKinds.NAME, value: fieldName },
          value: fieldValue
        });
      }
    });
    return { kind: _languageKinds.OBJECT, fields: fields };
  }
}
},{"../jsutils/invariant":159,"../jsutils/isNullish":160,"../language/kinds":164,"../type/definition":171,"../type/scalars":175,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/interop-require-default":21}],179:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.buildASTSchema = buildASTSchema;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsKeyMap = require('../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _jsutilsKeyValMap = require('../jsutils/keyValMap');

var _jsutilsKeyValMap2 = _interopRequireDefault(_jsutilsKeyValMap);

var _valueFromAST = require('./valueFromAST');

var _languageKinds = require('../language/kinds');

var _type = require('../type');

function buildWrappedType(innerType, inputTypeAST) {
  if (inputTypeAST.kind === _languageKinds.LIST_TYPE) {
    return new _type.GraphQLList(buildWrappedType(innerType, inputTypeAST.type));
  }
  if (inputTypeAST.kind === _languageKinds.NON_NULL_TYPE) {
    var wrappedType = buildWrappedType(innerType, inputTypeAST.type);
    (0, _jsutilsInvariant2['default'])(!(wrappedType instanceof _type.GraphQLNonNull), 'No nesting nonnull.');
    return new _type.GraphQLNonNull(wrappedType);
  }
  return innerType;
}

function getNamedTypeAST(typeAST) {
  var namedType = typeAST;
  while (namedType.kind === _languageKinds.LIST_TYPE || namedType.kind === _languageKinds.NON_NULL_TYPE) {
    namedType = namedType.type;
  }
  return namedType;
}

/**
 * This takes the ast of a schema document produced by parseSchema in
 * src/language/schema/parser.js.
 *
 * Given that AST it constructs a GraphQLSchema. As constructed
 * they are not particularly useful for non-introspection queries
 * since they have no resolve methods.
 */

function buildASTSchema(ast, queryTypeName, mutationTypeName, subscriptionTypeName) {
  if (!ast) {
    throw new Error('must pass in ast');
  }

  if (!queryTypeName) {
    throw new Error('must pass in query type');
  }

  var typeDefs = [];
  for (var i = 0; i < ast.definitions.length; i++) {
    var d = ast.definitions[i];
    switch (d.kind) {
      case _languageKinds.OBJECT_TYPE_DEFINITION:
      case _languageKinds.INTERFACE_TYPE_DEFINITION:
      case _languageKinds.ENUM_TYPE_DEFINITION:
      case _languageKinds.UNION_TYPE_DEFINITION:
      case _languageKinds.SCALAR_TYPE_DEFINITION:
      case _languageKinds.INPUT_OBJECT_TYPE_DEFINITION:
        typeDefs.push(d);
    }
  }

  var astMap = (0, _jsutilsKeyMap2['default'])(typeDefs, function (d) {
    return d.name.value;
  });

  if (!astMap[queryTypeName]) {
    throw new Error('Specified query type ' + queryTypeName + ' not found in document.');
  }

  if (mutationTypeName && !astMap[mutationTypeName]) {
    throw new Error('Specified mutation type ' + mutationTypeName + ' not found in document.');
  }

  if (subscriptionTypeName && !astMap[subscriptionTypeName]) {
    throw new Error('Specified subscription type ' + subscriptionTypeName + ' not found in document.');
  }

  var innerTypeMap = {
    String: _type.GraphQLString,
    Int: _type.GraphQLInt,
    Float: _type.GraphQLFloat,
    Boolean: _type.GraphQLBoolean,
    ID: _type.GraphQLID
  };

  typeDefs.forEach(function (def) {
    return typeDefNamed(def.name.value);
  });

  return new _type.GraphQLSchema({
    query: getObjectType(astMap[queryTypeName]),
    mutation: mutationTypeName ? getObjectType(astMap[mutationTypeName]) : null,
    subscription: subscriptionTypeName ? getObjectType(astMap[subscriptionTypeName]) : null
  });

  function getObjectType(typeAST) {
    var type = typeDefNamed(typeAST.name.value);
    (0, _jsutilsInvariant2['default'])(type instanceof _type.GraphQLObjectType, 'AST must provide object type.');
    return type;
  }

  function produceTypeDef(typeAST) {
    var typeName = getNamedTypeAST(typeAST).name.value;
    var typeDef = typeDefNamed(typeName);
    return buildWrappedType(typeDef, typeAST);
  }

  function typeDefNamed(typeName) {
    if (innerTypeMap[typeName]) {
      return innerTypeMap[typeName];
    }

    if (!astMap[typeName]) {
      throw new Error('Type ' + typeName + ' not found in document');
    }

    var innerTypeDef = makeSchemaDef(astMap[typeName]);
    if (!innerTypeDef) {
      throw new Error('Nothing constructed for ' + typeName);
    }
    innerTypeMap[typeName] = innerTypeDef;
    return innerTypeDef;
  }

  function makeSchemaDef(def) {
    if (!def) {
      throw new Error('def must be defined');
    }
    switch (def.kind) {
      case _languageKinds.OBJECT_TYPE_DEFINITION:
        return makeTypeDef(def);
      case _languageKinds.INTERFACE_TYPE_DEFINITION:
        return makeInterfaceDef(def);
      case _languageKinds.ENUM_TYPE_DEFINITION:
        return makeEnumDef(def);
      case _languageKinds.UNION_TYPE_DEFINITION:
        return makeUnionDef(def);
      case _languageKinds.SCALAR_TYPE_DEFINITION:
        return makeScalarDef(def);
      case _languageKinds.INPUT_OBJECT_TYPE_DEFINITION:
        return makeInputObjectDef(def);
      default:
        throw new Error(def.kind + ' not supported');
    }
  }

  function makeTypeDef(def) {
    var typeName = def.name.value;
    var config = {
      name: typeName,
      fields: function fields() {
        return makeFieldDefMap(def);
      },
      interfaces: function interfaces() {
        return makeImplementedInterfaces(def);
      }
    };
    return new _type.GraphQLObjectType(config);
  }

  function makeFieldDefMap(def) {
    return (0, _jsutilsKeyValMap2['default'])(def.fields, function (field) {
      return field.name.value;
    }, function (field) {
      return {
        type: produceTypeDef(field.type),
        args: makeInputValues(field.arguments)
      };
    });
  }

  function makeImplementedInterfaces(def) {
    return def.interfaces.map(function (inter) {
      return produceTypeDef(inter);
    });
  }

  function makeInputValues(values) {
    return (0, _jsutilsKeyValMap2['default'])(values, function (value) {
      return value.name.value;
    }, function (value) {
      var type = produceTypeDef(value.type);
      return { type: type, defaultValue: (0, _valueFromAST.valueFromAST)(value.defaultValue, type) };
    });
  }

  function makeInterfaceDef(def) {
    var typeName = def.name.value;
    var config = {
      name: typeName,
      resolveType: function resolveType() {
        return null;
      },
      fields: function fields() {
        return makeFieldDefMap(def);
      }
    };
    return new _type.GraphQLInterfaceType(config);
  }

  function makeEnumDef(def) {
    var enumType = new _type.GraphQLEnumType({
      name: def.name.value,
      values: (0, _jsutilsKeyValMap2['default'])(def.values, function (v) {
        return v.name.value;
      }, function () {
        return {};
      })
    });

    return enumType;
  }

  function makeUnionDef(def) {
    return new _type.GraphQLUnionType({
      name: def.name.value,
      resolveType: function resolveType() {
        return null;
      },
      types: def.types.map(function (t) {
        return produceTypeDef(t);
      })
    });
  }

  function makeScalarDef(def) {
    return new _type.GraphQLScalarType({
      name: def.name.value,
      serialize: function serialize() {
        return null;
      },
      // Note: validation calls the parse functions to determine if a
      // literal value is correct. Returning null would cause use of custom
      // scalars to always fail validation. Returning false causes them to
      // always pass validation.
      parseValue: function parseValue() {
        return false;
      },
      parseLiteral: function parseLiteral() {
        return false;
      }
    });
  }

  function makeInputObjectDef(def) {
    return new _type.GraphQLInputObjectType({
      name: def.name.value,
      fields: function fields() {
        return makeInputValues(def.fields);
      }
    });
  }
}
},{"../jsutils/invariant":159,"../jsutils/keyMap":161,"../jsutils/keyValMap":162,"../language/kinds":164,"../type":173,"./valueFromAST":191,"babel-runtime/helpers/interop-require-default":21}],180:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Build a GraphQLSchema for use by client tools.
 *
 * Given the result of a client running the introspection query, creates and
 * returns a GraphQLSchema instance which can be then used with all graphql-js
 * tools, but cannot be used to execute a query, as introspection does not
 * represent the "resolver", "parse" or "serialize" functions or any other
 * server-internal mechanisms.
 */
'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.buildClientSchema = buildClientSchema;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsKeyMap = require('../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _jsutilsKeyValMap = require('../jsutils/keyValMap');

var _jsutilsKeyValMap2 = _interopRequireDefault(_jsutilsKeyValMap);

var _valueFromAST = require('./valueFromAST');

var _languageParser = require('../language/parser');

var _typeSchema = require('../type/schema');

var _typeDefinition = require('../type/definition');

var _typeScalars = require('../type/scalars');

var _typeDirectives = require('../type/directives');

var _typeIntrospection = require('../type/introspection');

function buildClientSchema(introspection) {

  // Get the schema from the introspection result.
  var schemaIntrospection = introspection.__schema;

  // Converts the list of types into a keyMap based on the type names.
  var typeIntrospectionMap = (0, _jsutilsKeyMap2['default'])(schemaIntrospection.types, function (type) {
    return type.name;
  });

  // A cache to use to store the actual GraphQLType definition objects by name.
  // Initialize to the GraphQL built in scalars. All functions below are inline
  // so that this type def cache is within the scope of the closure.
  var typeDefCache = {
    String: _typeScalars.GraphQLString,
    Int: _typeScalars.GraphQLInt,
    Float: _typeScalars.GraphQLFloat,
    Boolean: _typeScalars.GraphQLBoolean,
    ID: _typeScalars.GraphQLID
  };

  // Given a type reference in introspection, return the GraphQLType instance.
  // preferring cached instances before building new instances.
  function getType(typeRef) {
    if (typeRef.kind === _typeIntrospection.TypeKind.LIST) {
      var itemRef = typeRef.ofType;
      if (!itemRef) {
        throw new Error('Decorated type deeper than introspection query.');
      }
      return new _typeDefinition.GraphQLList(getType(itemRef));
    }
    if (typeRef.kind === _typeIntrospection.TypeKind.NON_NULL) {
      var nullableRef = typeRef.ofType;
      if (!nullableRef) {
        throw new Error('Decorated type deeper than introspection query.');
      }
      var nullableType = getType(nullableRef);
      (0, _jsutilsInvariant2['default'])(!(nullableType instanceof _typeDefinition.GraphQLNonNull), 'No nesting nonnull.');
      return new _typeDefinition.GraphQLNonNull(nullableType);
    }
    return getNamedType(typeRef.name);
  }

  function getNamedType(typeName) {
    if (typeDefCache[typeName]) {
      return typeDefCache[typeName];
    }
    var typeIntrospection = typeIntrospectionMap[typeName];
    if (!typeIntrospection) {
      throw new Error('Invalid or incomplete schema, unknown type: ' + typeName + '. Ensure ' + 'that a full introspection query is used in order to build a ' + 'client schema.');
    }
    var typeDef = buildType(typeIntrospection);
    typeDefCache[typeName] = typeDef;
    return typeDef;
  }

  function getInputType(typeRef) {
    var type = getType(typeRef);
    (0, _jsutilsInvariant2['default'])((0, _typeDefinition.isInputType)(type), 'Introspection must provide input type for arguments.');
    return type;
  }

  function getOutputType(typeRef) {
    var type = getType(typeRef);
    (0, _jsutilsInvariant2['default'])((0, _typeDefinition.isOutputType)(type), 'Introspection must provide output type for fields.');
    return type;
  }

  function getObjectType(typeRef) {
    var type = getType(typeRef);
    (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLObjectType, 'Introspection must provide object type for possibleTypes.');
    return type;
  }

  function getInterfaceType(typeRef) {
    var type = getType(typeRef);
    (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLInterfaceType, 'Introspection must provide interface type for interfaces.');
    return type;
  }

  // Given a type's introspection result, construct the correct
  // GraphQLType instance.
  function buildType(type) {
    switch (type.kind) {
      case _typeIntrospection.TypeKind.SCALAR:
        return buildScalarDef(type);
      case _typeIntrospection.TypeKind.OBJECT:
        return buildObjectDef(type);
      case _typeIntrospection.TypeKind.INTERFACE:
        return buildInterfaceDef(type);
      case _typeIntrospection.TypeKind.UNION:
        return buildUnionDef(type);
      case _typeIntrospection.TypeKind.ENUM:
        return buildEnumDef(type);
      case _typeIntrospection.TypeKind.INPUT_OBJECT:
        return buildInputObjectDef(type);
      default:
        throw new Error('Invalid or incomplete schema, unknown kind: ' + type.kind + '. Ensure ' + 'that a full introspection query is used in order to build a ' + 'client schema.');
    }
  }

  function buildScalarDef(scalarIntrospection) {
    return new _typeDefinition.GraphQLScalarType({
      name: scalarIntrospection.name,
      description: scalarIntrospection.description,
      serialize: function serialize() {
        return null;
      },
      // Note: validation calls the parse functions to determine if a
      // literal value is correct. Returning null would cause use of custom
      // scalars to always fail validation. Returning false causes them to
      // always pass validation.
      parseValue: function parseValue() {
        return false;
      },
      parseLiteral: function parseLiteral() {
        return false;
      }
    });
  }

  function buildObjectDef(objectIntrospection) {
    return new _typeDefinition.GraphQLObjectType({
      name: objectIntrospection.name,
      description: objectIntrospection.description,
      interfaces: objectIntrospection.interfaces.map(getInterfaceType),
      fields: function fields() {
        return buildFieldDefMap(objectIntrospection);
      }
    });
  }

  function buildInterfaceDef(interfaceIntrospection) {
    return new _typeDefinition.GraphQLInterfaceType({
      name: interfaceIntrospection.name,
      description: interfaceIntrospection.description,
      fields: function fields() {
        return buildFieldDefMap(interfaceIntrospection);
      },
      resolveType: function resolveType() {
        throw new Error('Client Schema cannot be used for execution.');
      }
    });
  }

  function buildUnionDef(unionIntrospection) {
    return new _typeDefinition.GraphQLUnionType({
      name: unionIntrospection.name,
      description: unionIntrospection.description,
      types: unionIntrospection.possibleTypes.map(getObjectType),
      resolveType: function resolveType() {
        throw new Error('Client Schema cannot be used for execution.');
      }
    });
  }

  function buildEnumDef(enumIntrospection) {
    return new _typeDefinition.GraphQLEnumType({
      name: enumIntrospection.name,
      description: enumIntrospection.description,
      values: (0, _jsutilsKeyValMap2['default'])(enumIntrospection.enumValues, function (valueIntrospection) {
        return valueIntrospection.name;
      }, function (valueIntrospection) {
        return {
          description: valueIntrospection.description,
          deprecationReason: valueIntrospection.deprecationReason
        };
      })
    });
  }

  function buildInputObjectDef(inputObjectIntrospection) {
    return new _typeDefinition.GraphQLInputObjectType({
      name: inputObjectIntrospection.name,
      description: inputObjectIntrospection.description,
      fields: function fields() {
        return buildInputValueDefMap(inputObjectIntrospection.inputFields);
      }
    });
  }

  function buildFieldDefMap(typeIntrospection) {
    return (0, _jsutilsKeyValMap2['default'])(typeIntrospection.fields, function (fieldIntrospection) {
      return fieldIntrospection.name;
    }, function (fieldIntrospection) {
      return {
        description: fieldIntrospection.description,
        deprecationReason: fieldIntrospection.deprecationReason,
        type: getOutputType(fieldIntrospection.type),
        args: buildInputValueDefMap(fieldIntrospection.args),
        resolve: function resolve() {
          throw new Error('Client Schema cannot be used for execution.');
        }
      };
    });
  }

  function buildInputValueDefMap(inputValueIntrospections) {
    return (0, _jsutilsKeyValMap2['default'])(inputValueIntrospections, function (inputValue) {
      return inputValue.name;
    }, buildInputValue);
  }

  function buildInputValue(inputValueIntrospection) {
    var type = getInputType(inputValueIntrospection.type);
    var defaultValue = inputValueIntrospection.defaultValue ? (0, _valueFromAST.valueFromAST)((0, _languageParser.parseValue)(inputValueIntrospection.defaultValue), type) : null;
    return {
      name: inputValueIntrospection.name,
      description: inputValueIntrospection.description,
      type: type,
      defaultValue: defaultValue
    };
  }

  function buildDirective(directiveIntrospection) {
    return new _typeDirectives.GraphQLDirective({
      name: directiveIntrospection.name,
      description: directiveIntrospection.description,
      args: directiveIntrospection.args.map(buildInputValue),
      onOperation: directiveIntrospection.onOperation,
      onFragment: directiveIntrospection.onFragment,
      onField: directiveIntrospection.onField
    });
  }

  // Iterate through all types, getting the type definition for each, ensuring
  // that any type not directly referenced by a field will get created.
  schemaIntrospection.types.forEach(function (typeIntrospection) {
    return getNamedType(typeIntrospection.name);
  });

  // Get the root Query, Mutation, and Subscription types.
  var queryType = getObjectType(schemaIntrospection.queryType);

  var mutationType = schemaIntrospection.mutationType ? getObjectType(schemaIntrospection.mutationType) : null;

  var subscriptionType = schemaIntrospection.subscriptionType ? getObjectType(schemaIntrospection.subscriptionType) : null;

  // Get the directives supported by Introspection, assuming empty-set if
  // directives were not queried for.
  var directives = schemaIntrospection.directives ? schemaIntrospection.directives.map(buildDirective) : [];

  // Then produce and return a Schema with these types.
  return new _typeSchema.GraphQLSchema({
    query: queryType,
    mutation: mutationType,
    subscription: subscriptionType,
    directives: directives
  });
}
},{"../jsutils/invariant":159,"../jsutils/keyMap":161,"../jsutils/keyValMap":162,"../language/parser":167,"../type/definition":171,"../type/directives":172,"../type/introspection":174,"../type/scalars":175,"../type/schema":176,"./valueFromAST":191,"babel-runtime/helpers/interop-require-default":21}],181:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Provided a collection of ASTs, presumably each from different files,
 * concatenate the ASTs together into batched AST, useful for validating many
 * GraphQL source files which together represent one conceptual application.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.concatAST = concatAST;

function concatAST(asts) {
  var batchDefinitions = [];
  for (var i = 0; i < asts.length; i++) {
    var definitions = asts[i].definitions;
    for (var j = 0; j < definitions.length; j++) {
      batchDefinitions.push(definitions[j]);
    }
  }
  return {
    kind: 'Document',
    definitions: batchDefinitions
  };
}
},{}],182:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Produces a new schema given an existing schema and a document which may
 * contain GraphQL type extensions and definitions. The original schema will
 * remain unaltered.
 *
 * Because a schema represents a graph of references, a schema cannot be
 * extended without effectively making an entire copy. We do not know until it's
 * too late if subgraphs remain unchanged.
 *
 * This algorithm copies the provided schema, applying extensions while
 * producing the copy. The original schema remains unaltered.
 */
'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.extendSchema = extendSchema;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsKeyMap = require('../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _jsutilsKeyValMap = require('../jsutils/keyValMap');

var _jsutilsKeyValMap2 = _interopRequireDefault(_jsutilsKeyValMap);

var _valueFromAST = require('./valueFromAST');

var _errorGraphQLError = require('../error/GraphQLError');

var _typeSchema = require('../type/schema');

var _typeDefinition = require('../type/definition');

var _typeScalars = require('../type/scalars');

var _languageKinds = require('../language/kinds');

function extendSchema(schema, documentAST) {
  (0, _jsutilsInvariant2['default'])(schema instanceof _typeSchema.GraphQLSchema, 'Must provide valid GraphQLSchema');

  (0, _jsutilsInvariant2['default'])(documentAST && documentAST.kind === _languageKinds.DOCUMENT, 'Must provide valid Document AST');

  // Collect the type definitions and extensions found in the document.
  var typeDefinitionMap = {};
  var typeExtensionsMap = {};

  for (var i = 0; i < documentAST.definitions.length; i++) {
    var def = documentAST.definitions[i];
    switch (def.kind) {
      case _languageKinds.OBJECT_TYPE_DEFINITION:
      case _languageKinds.INTERFACE_TYPE_DEFINITION:
      case _languageKinds.ENUM_TYPE_DEFINITION:
      case _languageKinds.UNION_TYPE_DEFINITION:
      case _languageKinds.SCALAR_TYPE_DEFINITION:
      case _languageKinds.INPUT_OBJECT_TYPE_DEFINITION:
        // Sanity check that none of the defined types conflict with the
        // schema's existing types.
        var typeName = def.name.value;
        if (schema.getType(typeName)) {
          throw new _errorGraphQLError.GraphQLError('Type "' + typeName + '" already exists in the schema. It cannot also ' + 'be defined in this type definition.', [def]);
        }
        typeDefinitionMap[typeName] = def;
        break;
      case _languageKinds.TYPE_EXTENSION_DEFINITION:
        // Sanity check that this type extension exists within the
        // schema's existing types.
        var extendedTypeName = def.definition.name.value;
        var existingType = schema.getType(extendedTypeName);
        if (!existingType) {
          throw new _errorGraphQLError.GraphQLError('Cannot extend type "' + extendedTypeName + '" because it does not ' + 'exist in the existing schema.', [def.definition]);
        }
        if (!(existingType instanceof _typeDefinition.GraphQLObjectType)) {
          throw new _errorGraphQLError.GraphQLError('Cannot extend non-object type "' + extendedTypeName + '".', [def.definition]);
        }
        var extensions = typeExtensionsMap[extendedTypeName];
        if (extensions) {
          extensions.push(def);
        } else {
          extensions = [def];
        }
        typeExtensionsMap[extendedTypeName] = extensions;
        break;
    }
  }

  // If this document contains no new types, then return the same unmodified
  // GraphQLSchema instance.
  if (_Object$keys(typeExtensionsMap).length === 0 && _Object$keys(typeDefinitionMap).length === 0) {
    return schema;
  }

  // A cache to use to store the actual GraphQLType definition objects by name.
  // Initialize to the GraphQL built in scalars. All functions below are inline
  // so that this type def cache is within the scope of the closure.
  var typeDefCache = {
    String: _typeScalars.GraphQLString,
    Int: _typeScalars.GraphQLInt,
    Float: _typeScalars.GraphQLFloat,
    Boolean: _typeScalars.GraphQLBoolean,
    ID: _typeScalars.GraphQLID
  };

  // Get the root Query, Mutation, and Subscription types.
  var queryType = getTypeFromDef(schema.getQueryType());

  var existingMutationType = schema.getMutationType();
  var mutationType = existingMutationType ? getTypeFromDef(existingMutationType) : null;

  var existingSubscriptionType = schema.getSubscriptionType();
  var subscriptionType = existingSubscriptionType ? getTypeFromDef(existingSubscriptionType) : null;

  // Iterate through all types, getting the type definition for each, ensuring
  // that any type not directly referenced by a field will get created.
  _Object$keys(schema.getTypeMap()).forEach(function (typeName) {
    return getTypeFromDef(schema.getType(typeName));
  });

  // Do the same with new types.
  _Object$keys(typeDefinitionMap).forEach(function (typeName) {
    return getTypeFromAST(typeDefinitionMap[typeName]);
  });

  // Then produce and return a Schema with these types.
  return new _typeSchema.GraphQLSchema({
    query: queryType,
    mutation: mutationType,
    subscription: subscriptionType,
    // Copy directives.
    directives: schema.getDirectives()
  });

  // Below are functions used for producing this schema that have closed over
  // this scope and have access to the schema, cache, and newly defined types.

  function getTypeFromDef(typeDef) {
    var type = _getNamedType(typeDef.name);
    (0, _jsutilsInvariant2['default'])(type, 'Invalid schema');
    return type;
  }

  function getTypeFromAST(astNode) {
    var type = _getNamedType(astNode.name.value);
    if (!type) {
      throw new _errorGraphQLError.GraphQLError('Unknown type: "' + astNode.name.value + '". Ensure that this type exists ' + 'either in the original schema, or is added in a type definition.', [astNode]);
    }
    return type;
  }

  // Given a name, returns a type from either the existing schema or an
  // added type.
  function _getNamedType(typeName) {
    var cachedTypeDef = typeDefCache[typeName];
    if (cachedTypeDef) {
      return cachedTypeDef;
    }

    var existingType = schema.getType(typeName);
    if (existingType) {
      var typeDef = extendType(existingType);
      typeDefCache[typeName] = typeDef;
      return typeDef;
    }

    var typeAST = typeDefinitionMap[typeName];
    if (typeAST) {
      var typeDef = buildType(typeAST);
      typeDefCache[typeName] = typeDef;
      return typeDef;
    }
  }

  // Given a type's introspection result, construct the correct
  // GraphQLType instance.
  function extendType(type) {
    if (type instanceof _typeDefinition.GraphQLObjectType) {
      return extendObjectType(type);
    }
    if (type instanceof _typeDefinition.GraphQLInterfaceType) {
      return extendInterfaceType(type);
    }
    if (type instanceof _typeDefinition.GraphQLUnionType) {
      return extendUnionType(type);
    }
    return type;
  }

  function extendObjectType(type) {
    return new _typeDefinition.GraphQLObjectType({
      name: type.name,
      description: type.description,
      interfaces: function interfaces() {
        return extendImplementedInterfaces(type);
      },
      fields: function fields() {
        return extendFieldMap(type);
      }
    });
  }

  function extendInterfaceType(type) {
    return new _typeDefinition.GraphQLInterfaceType({
      name: type.name,
      description: type.description,
      fields: function fields() {
        return extendFieldMap(type);
      },
      resolveType: throwClientSchemaExecutionError
    });
  }

  function extendUnionType(type) {
    return new _typeDefinition.GraphQLUnionType({
      name: type.name,
      description: type.description,
      types: type.getPossibleTypes().map(getTypeFromDef),
      resolveType: throwClientSchemaExecutionError
    });
  }

  function extendImplementedInterfaces(type) {
    var interfaces = type.getInterfaces().map(getTypeFromDef);

    // If there are any extensions to the interfaces, apply those here.
    var extensions = typeExtensionsMap[type.name];
    if (extensions) {
      extensions.forEach(function (extension) {
        extension.definition.interfaces.forEach(function (namedType) {
          var interfaceName = namedType.name.value;
          if (interfaces.some(function (def) {
            return def.name === interfaceName;
          })) {
            throw new _errorGraphQLError.GraphQLError('\'Type "' + type.name + '" already implements "' + interfaceName + '". ' + 'It cannot also be implemented in this type extension.', [namedType]);
          }
          interfaces.push(getTypeFromAST(namedType));
        });
      });
    }

    return interfaces;
  }

  function extendFieldMap(type) {
    var newFieldMap = {};
    var oldFieldMap = type.getFields();
    _Object$keys(oldFieldMap).forEach(function (fieldName) {
      var field = oldFieldMap[fieldName];
      newFieldMap[fieldName] = {
        description: field.description,
        deprecationReason: field.deprecationReason,
        type: extendFieldType(field.type),
        args: (0, _jsutilsKeyMap2['default'])(field.args, function (arg) {
          return arg.name;
        }),
        resolve: throwClientSchemaExecutionError
      };
    });

    // If there are any extensions to the fields, apply those here.
    var extensions = typeExtensionsMap[type.name];
    if (extensions) {
      extensions.forEach(function (extension) {
        extension.definition.fields.forEach(function (field) {
          var fieldName = field.name.value;
          if (oldFieldMap[fieldName]) {
            throw new _errorGraphQLError.GraphQLError('Field "' + type.name + '.' + fieldName + '" already exists in the ' + 'schema. It cannot also be defined in this type extension.', [field]);
          }
          newFieldMap[fieldName] = {
            type: buildFieldType(field.type),
            args: buildInputValues(field.arguments),
            resolve: throwClientSchemaExecutionError
          };
        });
      });
    }

    return newFieldMap;
  }

  function extendFieldType(type) {
    if (type instanceof _typeDefinition.GraphQLList) {
      return new _typeDefinition.GraphQLList(extendFieldType(type.ofType));
    }
    if (type instanceof _typeDefinition.GraphQLNonNull) {
      return new _typeDefinition.GraphQLNonNull(extendFieldType(type.ofType));
    }
    return getTypeFromDef(type);
  }

  function buildType(typeAST) {
    switch (typeAST.kind) {
      case _languageKinds.OBJECT_TYPE_DEFINITION:
        return buildObjectType(typeAST);
      case _languageKinds.INTERFACE_TYPE_DEFINITION:
        return buildInterfaceType(typeAST);
      case _languageKinds.UNION_TYPE_DEFINITION:
        return buildUnionType(typeAST);
      case _languageKinds.SCALAR_TYPE_DEFINITION:
        return buildScalarType(typeAST);
      case _languageKinds.ENUM_TYPE_DEFINITION:
        return buildEnumType(typeAST);
      case _languageKinds.INPUT_OBJECT_TYPE_DEFINITION:
        return buildInputObjectType(typeAST);
    }
  }

  function buildObjectType(typeAST) {
    return new _typeDefinition.GraphQLObjectType({
      name: typeAST.name.value,
      interfaces: function interfaces() {
        return buildImplementedInterfaces(typeAST);
      },
      fields: function fields() {
        return buildFieldMap(typeAST);
      }
    });
  }

  function buildInterfaceType(typeAST) {
    return new _typeDefinition.GraphQLInterfaceType({
      name: typeAST.name.value,
      fields: function fields() {
        return buildFieldMap(typeAST);
      },
      resolveType: throwClientSchemaExecutionError
    });
  }

  function buildUnionType(typeAST) {
    return new _typeDefinition.GraphQLUnionType({
      name: typeAST.name.value,
      types: typeAST.types.map(getTypeFromAST),
      resolveType: throwClientSchemaExecutionError
    });
  }

  function buildScalarType(typeAST) {
    return new _typeDefinition.GraphQLScalarType({
      name: typeAST.name.value,
      serialize: function serialize() {
        return null;
      },
      // Note: validation calls the parse functions to determine if a
      // literal value is correct. Returning null would cause use of custom
      // scalars to always fail validation. Returning false causes them to
      // always pass validation.
      parseValue: function parseValue() {
        return false;
      },
      parseLiteral: function parseLiteral() {
        return false;
      }
    });
  }

  function buildEnumType(typeAST) {
    return new _typeDefinition.GraphQLEnumType({
      name: typeAST.name.value,
      values: (0, _jsutilsKeyValMap2['default'])(typeAST.values, function (v) {
        return v.name.value;
      }, function () {
        return {};
      })
    });
  }

  function buildInputObjectType(typeAST) {
    return new _typeDefinition.GraphQLInputObjectType({
      name: typeAST.name.value,
      fields: function fields() {
        return buildInputValues(typeAST.fields);
      }
    });
  }

  function buildImplementedInterfaces(typeAST) {
    return typeAST.interfaces.map(getTypeFromAST);
  }

  function buildFieldMap(typeAST) {
    return (0, _jsutilsKeyValMap2['default'])(typeAST.fields, function (field) {
      return field.name.value;
    }, function (field) {
      return {
        type: buildFieldType(field.type),
        args: buildInputValues(field.arguments),
        resolve: throwClientSchemaExecutionError
      };
    });
  }

  function buildInputValues(values) {
    return (0, _jsutilsKeyValMap2['default'])(values, function (value) {
      return value.name.value;
    }, function (value) {
      var type = buildFieldType(value.type);
      return {
        type: type,
        defaultValue: (0, _valueFromAST.valueFromAST)(value.defaultValue, type)
      };
    });
  }

  function buildFieldType(typeAST) {
    if (typeAST.kind === _languageKinds.LIST_TYPE) {
      return new _typeDefinition.GraphQLList(buildFieldType(typeAST.type));
    }
    if (typeAST.kind === _languageKinds.NON_NULL_TYPE) {
      return new _typeDefinition.GraphQLNonNull(buildFieldType(typeAST.type));
    }
    return getTypeFromAST(typeAST);
  }
}

function throwClientSchemaExecutionError() {
  throw new Error('Client Schema cannot be used for execution.');
}
},{"../error/GraphQLError":148,"../jsutils/invariant":159,"../jsutils/keyMap":161,"../jsutils/keyValMap":162,"../language/kinds":164,"../type/definition":171,"../type/scalars":175,"../type/schema":176,"./valueFromAST":191,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/interop-require-default":21}],183:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Returns an operation AST given a document AST and optionally an operation
 * name. If a name is not provided, an operation is only returned if only one is
 * provided in the document.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getOperationAST = getOperationAST;

var _languageKinds = require('../language/kinds');

function getOperationAST(documentAST, operationName) {
  var operation = null;
  for (var i = 0; i < documentAST.definitions.length; i++) {
    var definition = documentAST.definitions[i];
    if (definition.kind === _languageKinds.OPERATION_DEFINITION) {
      if (!operationName) {
        // If no operation name was provided, only return an Operation if there
        // is one defined in the document. Upon encountering the second, return
        // null.
        if (operation) {
          return null;
        }
        operation = definition;
      } else if (definition.name && definition.name.value === operationName) {
        return definition;
      }
    }
  }
  return operation;
}
},{"../language/kinds":164}],184:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

// The GraphQL query recommended for a full schema introspection.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _introspectionQuery = require('./introspectionQuery');

Object.defineProperty(exports, 'introspectionQuery', {
  enumerable: true,
  get: function get() {
    return _introspectionQuery.introspectionQuery;
  }
});

// Gets the target Operation from a Document

var _getOperationAST = require('./getOperationAST');

Object.defineProperty(exports, 'getOperationAST', {
  enumerable: true,
  get: function get() {
    return _getOperationAST.getOperationAST;
  }
});

// Build a GraphQLSchema from an introspection result.

var _buildClientSchema = require('./buildClientSchema');

Object.defineProperty(exports, 'buildClientSchema', {
  enumerable: true,
  get: function get() {
    return _buildClientSchema.buildClientSchema;
  }
});

// Build a GraphQLSchema from a parsed GraphQL Schema language AST.

var _buildASTSchema = require('./buildASTSchema');

Object.defineProperty(exports, 'buildASTSchema', {
  enumerable: true,
  get: function get() {
    return _buildASTSchema.buildASTSchema;
  }
});

// Extends an existing GraphQLSchema from a parsed GraphQL Schema language AST.

var _extendSchema = require('./extendSchema');

Object.defineProperty(exports, 'extendSchema', {
  enumerable: true,
  get: function get() {
    return _extendSchema.extendSchema;
  }
});

// Print a GraphQLSchema to GraphQL Schema language.

var _schemaPrinter = require('./schemaPrinter');

Object.defineProperty(exports, 'printSchema', {
  enumerable: true,
  get: function get() {
    return _schemaPrinter.printSchema;
  }
});
Object.defineProperty(exports, 'printIntrospectionSchema', {
  enumerable: true,
  get: function get() {
    return _schemaPrinter.printIntrospectionSchema;
  }
});

// Create a GraphQLType from a GraphQL language AST.

var _typeFromAST = require('./typeFromAST');

Object.defineProperty(exports, 'typeFromAST', {
  enumerable: true,
  get: function get() {
    return _typeFromAST.typeFromAST;
  }
});

// Create a JavaScript value from a GraphQL language AST.

var _valueFromAST = require('./valueFromAST');

Object.defineProperty(exports, 'valueFromAST', {
  enumerable: true,
  get: function get() {
    return _valueFromAST.valueFromAST;
  }
});

// Create a GraphQL language AST from a JavaScript value.

var _astFromValue = require('./astFromValue');

Object.defineProperty(exports, 'astFromValue', {
  enumerable: true,
  get: function get() {
    return _astFromValue.astFromValue;
  }
});

// A helper to use within recursive-descent visitors which need to be aware of
// the GraphQL type system.

var _TypeInfo = require('./TypeInfo');

Object.defineProperty(exports, 'TypeInfo', {
  enumerable: true,
  get: function get() {
    return _TypeInfo.TypeInfo;
  }
});

// Determine if JavaScript values adhere to a GraphQL type.

var _isValidJSValue = require('./isValidJSValue');

Object.defineProperty(exports, 'isValidJSValue', {
  enumerable: true,
  get: function get() {
    return _isValidJSValue.isValidJSValue;
  }
});

// Determine if AST values adhere to a GraphQL type.

var _isValidLiteralValue = require('./isValidLiteralValue');

Object.defineProperty(exports, 'isValidLiteralValue', {
  enumerable: true,
  get: function get() {
    return _isValidLiteralValue.isValidLiteralValue;
  }
});

// Concatenates multiple AST together.

var _concatAST = require('./concatAST');

Object.defineProperty(exports, 'concatAST', {
  enumerable: true,
  get: function get() {
    return _concatAST.concatAST;
  }
});

// Comparators for types

var _typeComparators = require('./typeComparators');

Object.defineProperty(exports, 'isEqualType', {
  enumerable: true,
  get: function get() {
    return _typeComparators.isEqualType;
  }
});
Object.defineProperty(exports, 'isTypeSubTypeOf', {
  enumerable: true,
  get: function get() {
    return _typeComparators.isTypeSubTypeOf;
  }
});
Object.defineProperty(exports, 'doTypesOverlap', {
  enumerable: true,
  get: function get() {
    return _typeComparators.doTypesOverlap;
  }
});
},{"./TypeInfo":177,"./astFromValue":178,"./buildASTSchema":179,"./buildClientSchema":180,"./concatAST":181,"./extendSchema":182,"./getOperationAST":183,"./introspectionQuery":185,"./isValidJSValue":186,"./isValidLiteralValue":187,"./schemaPrinter":188,"./typeComparators":189,"./typeFromAST":190,"./valueFromAST":191}],185:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var introspectionQuery = '\n  query IntrospectionQuery {\n    __schema {\n      queryType { name }\n      mutationType { name }\n      subscriptionType { name }\n      types {\n        ...FullType\n      }\n      directives {\n        name\n        description\n        args {\n          ...InputValue\n        }\n        onOperation\n        onFragment\n        onField\n      }\n    }\n  }\n\n  fragment FullType on __Type {\n    kind\n    name\n    description\n    fields(includeDeprecated: true) {\n      name\n      description\n      args {\n        ...InputValue\n      }\n      type {\n        ...TypeRef\n      }\n      isDeprecated\n      deprecationReason\n    }\n    inputFields {\n      ...InputValue\n    }\n    interfaces {\n      ...TypeRef\n    }\n    enumValues(includeDeprecated: true) {\n      name\n      description\n      isDeprecated\n      deprecationReason\n    }\n    possibleTypes {\n      ...TypeRef\n    }\n  }\n\n  fragment InputValue on __InputValue {\n    name\n    description\n    type { ...TypeRef }\n    defaultValue\n  }\n\n  fragment TypeRef on __Type {\n    kind\n    name\n    ofType {\n      kind\n      name\n      ofType {\n        kind\n        name\n        ofType {\n          kind\n          name\n        }\n      }\n    }\n  }\n';

exports.introspectionQuery = introspectionQuery;
},{}],186:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Given a JavaScript value and a GraphQL type, determine if the value will be
 * accepted for that type. This is primarily useful for validating the
 * runtime values of query variables.
 */
'use strict';

var _toConsumableArray = require('babel-runtime/helpers/to-consumable-array')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isValidJSValue = isValidJSValue;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _typeDefinition = require('../type/definition');

function isValidJSValue(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var value = _x,
        type = _x2;
    _ret = fields = errors = _iteratorNormalCompletion = _didIteratorError = _iteratorError = _iteratorNormalCompletion2 = _didIteratorError2 = _iteratorError2 = parseResult = undefined;
    _again = false;

    // A value must be provided if the type is non-null.
    if (type instanceof _typeDefinition.GraphQLNonNull) {
      if ((0, _jsutilsIsNullish2['default'])(value)) {
        if (type.ofType.name) {
          return ['Expected "' + type.ofType.name + '!", found null.'];
        }
        return ['Expected non-null value, found null.'];
      }
      _x = value;
      _x2 = type.ofType;
      _again = true;
      continue _function;
    }

    if ((0, _jsutilsIsNullish2['default'])(value)) {
      return [];
    }

    // Lists accept a non-list value as a list of one.
    if (type instanceof _typeDefinition.GraphQLList) {
      var _ret = (function () {
        var itemType = type.ofType;
        if (Array.isArray(value)) {
          return {
            v: value.reduce(function (acc, item, index) {
              var errors = isValidJSValue(item, itemType);
              return acc.concat(errors.map(function (error) {
                return 'In element #' + index + ': ' + error;
              }));
            }, [])
          };
        }
        return {
          v: isValidJSValue(value, itemType)
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    }

    // Input objects check each defined field.
    if (type instanceof _typeDefinition.GraphQLInputObjectType) {
      if (typeof value !== 'object' || value === null) {
        return ['Expected "' + type.name + '", found not an object.'];
      }
      var fields = type.getFields();

      var errors = [];

      // Ensure every provided field is defined.
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = _getIterator(_Object$keys(value)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var providedField = _step.value;

          if (!fields[providedField]) {
            errors.push('In field "' + providedField + '": Unknown field.');
          }
        }

        // Ensure every defined field is valid.
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        var _loop = function () {
          var fieldName = _step2.value;

          var newErrors = isValidJSValue(value[fieldName], fields[fieldName].type);
          errors.push.apply(errors, _toConsumableArray(newErrors.map(function (error) {
            return 'In field "' + fieldName + '": ' + error;
          })));
        };

        for (var _iterator2 = _getIterator(_Object$keys(fields)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2['return']) {
            _iterator2['return']();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return errors;
    }

    (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLScalarType || type instanceof _typeDefinition.GraphQLEnumType, 'Must be input type');

    // Scalar/Enum input checks to ensure the type can parse the value to
    // a non-null value.
    var parseResult = type.parseValue(value);
    if ((0, _jsutilsIsNullish2['default'])(parseResult)) {
      return ['Expected type "' + type.name + '", found ' + JSON.stringify(value) + '.'];
    }

    return [];
  }
}
},{"../jsutils/invariant":159,"../jsutils/isNullish":160,"../type/definition":171,"babel-runtime/core-js/get-iterator":5,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/interop-require-default":21,"babel-runtime/helpers/to-consumable-array":24}],187:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _toConsumableArray = require('babel-runtime/helpers/to-consumable-array')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isValidLiteralValue = isValidLiteralValue;

var _languagePrinter = require('../language/printer');

var _languageKinds = require('../language/kinds');

var _typeDefinition = require('../type/definition');

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsKeyMap = require('../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

/**
 * Utility for validators which determines if a value literal AST is valid given
 * an input type.
 *
 * Note that this only validates literal values, variables are assumed to
 * provide values of the correct type.
 */

function isValidLiteralValue(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var type = _x,
        valueAST = _x2;
    _ret = fields = errors = fieldASTs = _iteratorNormalCompletion = _didIteratorError = _iteratorError = fieldASTMap = _iteratorNormalCompletion2 = _didIteratorError2 = _iteratorError2 = parseResult = undefined;
    _again = false;

    // A value must be provided if the type is non-null.
    if (type instanceof _typeDefinition.GraphQLNonNull) {
      if (!valueAST) {
        if (type.ofType.name) {
          return ['Expected "' + type.ofType.name + '!", found null.'];
        }
        return ['Expected non-null value, found null.'];
      }
      _x = type.ofType;
      _x2 = valueAST;
      _again = true;
      continue _function;
    }

    if (!valueAST) {
      return [];
    }

    // This function only tests literals, and assumes variables will provide
    // values of the correct type.
    if (valueAST.kind === _languageKinds.VARIABLE) {
      return [];
    }

    // Lists accept a non-list value as a list of one.
    if (type instanceof _typeDefinition.GraphQLList) {
      var _ret = (function () {
        var itemType = type.ofType;
        if (valueAST.kind === _languageKinds.LIST) {
          return {
            v: valueAST.values.reduce(function (acc, itemAST, index) {
              var errors = isValidLiteralValue(itemType, itemAST);
              return acc.concat(errors.map(function (error) {
                return 'In element #' + index + ': ' + error;
              }));
            }, [])
          };
        }
        return {
          v: isValidLiteralValue(itemType, valueAST)
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    }

    // Input objects check each defined field and look for undefined fields.
    if (type instanceof _typeDefinition.GraphQLInputObjectType) {
      if (valueAST.kind !== _languageKinds.OBJECT) {
        return ['Expected "' + type.name + '", found not an object.'];
      }
      var fields = type.getFields();

      var errors = [];

      // Ensure every provided field is defined.
      var fieldASTs = valueAST.fields;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = _getIterator(fieldASTs), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var providedFieldAST = _step.value;

          if (!fields[providedFieldAST.name.value]) {
            errors.push('In field "' + providedFieldAST.name.value + '": Unknown field.');
          }
        }

        // Ensure every defined field is valid.
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var fieldASTMap = (0, _jsutilsKeyMap2['default'])(fieldASTs, function (fieldAST) {
        return fieldAST.name.value;
      });
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        var _loop = function () {
          var fieldName = _step2.value;

          var result = isValidLiteralValue(fields[fieldName].type, fieldASTMap[fieldName] && fieldASTMap[fieldName].value);
          errors.push.apply(errors, _toConsumableArray(result.map(function (error) {
            return 'In field "' + fieldName + '": ' + error;
          })));
        };

        for (var _iterator2 = _getIterator(_Object$keys(fields)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2['return']) {
            _iterator2['return']();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return errors;
    }

    (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLScalarType || type instanceof _typeDefinition.GraphQLEnumType, 'Must be input type');

    // Scalar/Enum input checks to ensure the type can parse the value to
    // a non-null value.
    var parseResult = type.parseLiteral(valueAST);
    if ((0, _jsutilsIsNullish2['default'])(parseResult)) {
      return ['Expected type "' + type.name + '", found ' + (0, _languagePrinter.print)(valueAST) + '.'];
    }

    return [];
  }
}
},{"../jsutils/invariant":159,"../jsutils/isNullish":160,"../jsutils/keyMap":161,"../language/kinds":164,"../language/printer":168,"../type/definition":171,"babel-runtime/core-js/get-iterator":5,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/interop-require-default":21,"babel-runtime/helpers/to-consumable-array":24}],188:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.printSchema = printSchema;
exports.printIntrospectionSchema = printIntrospectionSchema;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _utilitiesAstFromValue = require('../utilities/astFromValue');

var _languagePrinter = require('../language/printer');

var _typeDefinition = require('../type/definition');

function printSchema(schema) {
  return printFilteredSchema(schema, isDefinedType);
}

function printIntrospectionSchema(schema) {
  return printFilteredSchema(schema, isIntrospectionType);
}

function isDefinedType(typename) {
  return !isIntrospectionType(typename) && !isBuiltInScalar(typename);
}

function isIntrospectionType(typename) {
  return typename.indexOf('__') === 0;
}

function isBuiltInScalar(typename) {
  return typename === 'String' || typename === 'Boolean' || typename === 'Int' || typename === 'Float' || typename === 'ID';
}

function printFilteredSchema(schema, typeFilter) {
  var typeMap = schema.getTypeMap();
  var types = _Object$keys(typeMap).filter(typeFilter).sort(function (name1, name2) {
    return name1.localeCompare(name2);
  }).map(function (typeName) {
    return typeMap[typeName];
  });
  return types.map(printType).join('\n\n') + '\n';
}

function printType(type) {
  if (type instanceof _typeDefinition.GraphQLScalarType) {
    return printScalar(type);
  } else if (type instanceof _typeDefinition.GraphQLObjectType) {
    return printObject(type);
  } else if (type instanceof _typeDefinition.GraphQLInterfaceType) {
    return printInterface(type);
  } else if (type instanceof _typeDefinition.GraphQLUnionType) {
    return printUnion(type);
  } else if (type instanceof _typeDefinition.GraphQLEnumType) {
    return printEnum(type);
  }
  (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLInputObjectType);
  return printInputObject(type);
}

function printScalar(type) {
  return 'scalar ' + type.name;
}

function printObject(type) {
  var interfaces = type.getInterfaces();
  var implementedInterfaces = interfaces.length ? ' implements ' + interfaces.map(function (i) {
    return i.name;
  }).join(', ') : '';
  return 'type ' + type.name + implementedInterfaces + ' {\n' + printFields(type) + '\n' + '}';
}

function printInterface(type) {
  return 'interface ' + type.name + ' {\n' + printFields(type) + '\n' + '}';
}

function printUnion(type) {
  return 'union ' + type.name + ' = ' + type.getPossibleTypes().join(' | ');
}

function printEnum(type) {
  var values = type.getValues();
  return 'enum ' + type.name + ' {\n' + values.map(function (v) {
    return '  ' + v.name;
  }).join('\n') + '\n' + '}';
}

function printInputObject(type) {
  var fieldMap = type.getFields();
  var fields = _Object$keys(fieldMap).map(function (fieldName) {
    return fieldMap[fieldName];
  });
  return 'input ' + type.name + ' {\n' + fields.map(function (f) {
    return '  ' + printInputValue(f);
  }).join('\n') + '\n' + '}';
}

function printFields(type) {
  var fieldMap = type.getFields();
  var fields = _Object$keys(fieldMap).map(function (fieldName) {
    return fieldMap[fieldName];
  });
  return fields.map(function (f) {
    return '  ' + f.name + printArgs(f) + ': ' + f.type;
  }).join('\n');
}

function printArgs(field) {
  if (field.args.length === 0) {
    return '';
  }
  return '(' + field.args.map(printInputValue).join(', ') + ')';
}

function printInputValue(arg) {
  var argDecl = arg.name + ': ' + arg.type;
  if (!(0, _jsutilsIsNullish2['default'])(arg.defaultValue)) {
    argDecl += ' = ' + (0, _languagePrinter.print)((0, _utilitiesAstFromValue.astFromValue)(arg.defaultValue, arg.type));
  }
  return argDecl;
}
},{"../jsutils/invariant":159,"../jsutils/isNullish":160,"../language/printer":168,"../type/definition":171,"../utilities/astFromValue":178,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/interop-require-default":21}],189:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Provided two types, return true if the types are equal (invariant).
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isEqualType = isEqualType;
exports.isTypeSubTypeOf = isTypeSubTypeOf;
exports.doTypesOverlap = doTypesOverlap;

var _typeDefinition = require('../type/definition');

function isEqualType(_x, _x2) {
  var _again = true;

  _function: while (_again) {
    var typeA = _x,
        typeB = _x2;
    _again = false;

    // Equivalent types are equal.
    if (typeA === typeB) {
      return true;
    }

    // If either type is non-null, the other must also be non-null.
    if (typeA instanceof _typeDefinition.GraphQLNonNull && typeB instanceof _typeDefinition.GraphQLNonNull) {
      _x = typeA.ofType;
      _x2 = typeB.ofType;
      _again = true;
      continue _function;
    }

    // If either type is a list, the other must also be a list.
    if (typeA instanceof _typeDefinition.GraphQLList && typeB instanceof _typeDefinition.GraphQLList) {
      _x = typeA.ofType;
      _x2 = typeB.ofType;
      _again = true;
      continue _function;
    }

    // Otherwise the types are not equal.
    return false;
  }
}

/**
 * Provided a type and a super type, return true if the first type is either
 * equal or a subset of the second super type (covariant).
 */

function isTypeSubTypeOf(_x3, _x4) {
  var _again2 = true;

  _function2: while (_again2) {
    var maybeSubType = _x3,
        superType = _x4;
    _again2 = false;

    // Equivalent type is a valid subtype
    if (maybeSubType === superType) {
      return true;
    }

    // If superType is non-null, maybeSubType must also be nullable.
    if (superType instanceof _typeDefinition.GraphQLNonNull) {
      if (maybeSubType instanceof _typeDefinition.GraphQLNonNull) {
        _x3 = maybeSubType.ofType;
        _x4 = superType.ofType;
        _again2 = true;
        continue _function2;
      }
      return false;
    } else if (maybeSubType instanceof _typeDefinition.GraphQLNonNull) {
      // If superType is nullable, maybeSubType may be non-null.
      _x3 = maybeSubType.ofType;
      _x4 = superType;
      _again2 = true;
      continue _function2;
    }

    // If superType type is a list, maybeSubType type must also be a list.
    if (superType instanceof _typeDefinition.GraphQLList) {
      if (maybeSubType instanceof _typeDefinition.GraphQLList) {
        _x3 = maybeSubType.ofType;
        _x4 = superType.ofType;
        _again2 = true;
        continue _function2;
      }
      return false;
    } else if (maybeSubType instanceof _typeDefinition.GraphQLList) {
      // If superType is not a list, maybeSubType must also be not a list.
      return false;
    }

    // If superType type is an abstract type, maybeSubType type may be a currently
    // possible object type.
    if ((0, _typeDefinition.isAbstractType)(superType) && maybeSubType instanceof _typeDefinition.GraphQLObjectType && superType.isPossibleType(maybeSubType)) {
      return true;
    }

    // Otherwise, the child type is not a valid subtype of the parent type.
    return false;
  }
}

/**
 * Provided two composite types, determine if they "overlap". Two composite
 * types overlap when the Sets of possible concrete types for each intersect.
 *
 * This is often used to determine if a fragment of a given type could possibly
 * be visited in a context of another type.
 *
 * This function is commutative.
 */

function doTypesOverlap(typeA, typeB) {
  // So flow is aware this is constant
  var _typeB = typeB;

  // Equivalent types overlap
  if (typeA === _typeB) {
    return true;
  }

  if (typeA instanceof _typeDefinition.GraphQLInterfaceType || typeA instanceof _typeDefinition.GraphQLUnionType) {
    if (_typeB instanceof _typeDefinition.GraphQLInterfaceType || _typeB instanceof _typeDefinition.GraphQLUnionType) {
      // If both types are abstract, then determine if there is any intersection
      // between possible concrete types of each.
      return typeA.getPossibleTypes().some(function (type) {
        return _typeB.isPossibleType(type);
      });
    }
    // Determine if the latter type is a possible concrete type of the former.
    return typeA.isPossibleType(_typeB);
  }

  if (_typeB instanceof _typeDefinition.GraphQLInterfaceType || _typeB instanceof _typeDefinition.GraphQLUnionType) {
    // Determine if the former type is a possible concrete type of the latter.
    return _typeB.isPossibleType(typeA);
  }

  // Otherwise the types do not overlap.
  return false;
}
},{"../type/definition":171}],190:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.typeFromAST = typeFromAST;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _languageKinds = require('../language/kinds');

var _typeDefinition = require('../type/definition');

function typeFromAST(schema, inputTypeAST) {
  var innerType = undefined;
  if (inputTypeAST.kind === _languageKinds.LIST_TYPE) {
    innerType = typeFromAST(schema, inputTypeAST.type);
    return innerType && new _typeDefinition.GraphQLList(innerType);
  }
  if (inputTypeAST.kind === _languageKinds.NON_NULL_TYPE) {
    innerType = typeFromAST(schema, inputTypeAST.type);
    return innerType && new _typeDefinition.GraphQLNonNull(innerType);
  }
  (0, _jsutilsInvariant2['default'])(inputTypeAST.kind === _languageKinds.NAMED_TYPE, 'Must be a named type.');
  return schema.getType(inputTypeAST.name.value);
}
},{"../jsutils/invariant":159,"../language/kinds":164,"../type/definition":171,"babel-runtime/helpers/interop-require-default":21}],191:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Produces a JavaScript value given a GraphQL Value AST.
 *
 * A GraphQL type must be provided, which will be used to interpret different
 * GraphQL Value literals.
 *
 * | GraphQL Value        | JSON Value    |
 * | -------------------- | ------------- |
 * | Input Object         | Object        |
 * | List                 | Array         |
 * | Boolean              | Boolean       |
 * | String / Enum Value  | String        |
 * | Int / Float          | Number        |
 *
 */
'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _interopRequireWildcard = require('babel-runtime/helpers/interop-require-wildcard')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.valueFromAST = valueFromAST;

var _jsutilsKeyMap = require('../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _jsutilsIsNullish = require('../jsutils/isNullish');

var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);

var _languageKinds = require('../language/kinds');

var Kind = _interopRequireWildcard(_languageKinds);

var _typeDefinition = require('../type/definition');

function valueFromAST(_x, _x2, _x3) {
  var _again = true;

  _function: while (_again) {
    var valueAST = _x,
        type = _x2,
        variables = _x3;
    variableName = _ret = _ret2 = parsed = undefined;
    _again = false;

    if (type instanceof _typeDefinition.GraphQLNonNull) {
      // Note: we're not checking that the result of valueFromAST is non-null.
      // We're assuming that this query has been validated and the value used
      // here is of the correct type.
      _x = valueAST;
      _x2 = type.ofType;
      _x3 = variables;
      _again = true;
      continue _function;
    }

    if (!valueAST) {
      return null;
    }

    if (valueAST.kind === Kind.VARIABLE) {
      var variableName = valueAST.name.value;
      if (!variables || !variables.hasOwnProperty(variableName)) {
        return null;
      }
      // Note: we're not doing any checking that this variable is correct. We're
      // assuming that this query has been validated and the variable usage here
      // is of the correct type.
      return variables[variableName];
    }

    if (type instanceof _typeDefinition.GraphQLList) {
      var _ret = (function () {
        var itemType = type.ofType;
        if (valueAST.kind === Kind.LIST) {
          return {
            v: valueAST.values.map(function (itemAST) {
              return valueFromAST(itemAST, itemType, variables);
            })
          };
        }
        return {
          v: [valueFromAST(valueAST, itemType, variables)]
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    }

    if (type instanceof _typeDefinition.GraphQLInputObjectType) {
      var _ret2 = (function () {
        var fields = type.getFields();
        if (valueAST.kind !== Kind.OBJECT) {
          return {
            v: null
          };
        }
        var fieldASTs = (0, _jsutilsKeyMap2['default'])(valueAST.fields, function (field) {
          return field.name.value;
        });
        return {
          v: _Object$keys(fields).reduce(function (obj, fieldName) {
            var field = fields[fieldName];
            var fieldAST = fieldASTs[fieldName];
            var fieldValue = valueFromAST(fieldAST && fieldAST.value, field.type, variables);
            if ((0, _jsutilsIsNullish2['default'])(fieldValue)) {
              fieldValue = field.defaultValue;
            }
            if (!(0, _jsutilsIsNullish2['default'])(fieldValue)) {
              obj[fieldName] = fieldValue;
            }
            return obj;
          }, {})
        };
      })();

      if (typeof _ret2 === 'object') return _ret2.v;
    }

    (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLScalarType || type instanceof _typeDefinition.GraphQLEnumType, 'Must be input type');

    var parsed = type.parseLiteral(valueAST);
    if (!(0, _jsutilsIsNullish2['default'])(parsed)) {
      return parsed;
    }
  }
}
},{"../jsutils/invariant":159,"../jsutils/isNullish":160,"../jsutils/keyMap":161,"../language/kinds":164,"../type/definition":171,"babel-runtime/core-js/object/keys":12,"babel-runtime/helpers/interop-require-default":21,"babel-runtime/helpers/interop-require-wildcard":22}],192:[function(require,module,exports){
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _validate = require('./validate');

Object.defineProperty(exports, 'validate', {
  enumerable: true,
  get: function get() {
    return _validate.validate;
  }
});

var _specifiedRules = require('./specifiedRules');

Object.defineProperty(exports, 'specifiedRules', {
  enumerable: true,
  get: function get() {
    return _specifiedRules.specifiedRules;
  }
});
},{"./specifiedRules":217,"./validate":218}],193:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.badValueMessage = badValueMessage;
exports.ArgumentsOfCorrectType = ArgumentsOfCorrectType;

var _error = require('../../error');

var _languagePrinter = require('../../language/printer');

var _utilitiesIsValidLiteralValue = require('../../utilities/isValidLiteralValue');

function badValueMessage(argName, type, value, verboseErrors) {
  var message = verboseErrors ? '\n' + verboseErrors.join('\n') : '';
  return 'Argument "' + argName + '" has invalid value ' + value + '.' + message;
}

/**
 * Argument values of correct type
 *
 * A GraphQL document is only valid if all field argument literal values are
 * of the type expected by their position.
 */

function ArgumentsOfCorrectType(context) {
  return {
    Argument: function Argument(argAST) {
      var argDef = context.getArgument();
      if (argDef) {
        var errors = (0, _utilitiesIsValidLiteralValue.isValidLiteralValue)(argDef.type, argAST.value);
        if (errors && errors.length > 0) {
          context.reportError(new _error.GraphQLError(badValueMessage(argAST.name.value, argDef.type, (0, _languagePrinter.print)(argAST.value), errors), [argAST.value]));
        }
      }
      return false;
    }
  };
}
},{"../../error":150,"../../language/printer":168,"../../utilities/isValidLiteralValue":187}],194:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.defaultForNonNullArgMessage = defaultForNonNullArgMessage;
exports.badValueForDefaultArgMessage = badValueForDefaultArgMessage;
exports.DefaultValuesOfCorrectType = DefaultValuesOfCorrectType;

var _error = require('../../error');

var _languagePrinter = require('../../language/printer');

var _typeDefinition = require('../../type/definition');

var _utilitiesIsValidLiteralValue = require('../../utilities/isValidLiteralValue');

function defaultForNonNullArgMessage(varName, type, guessType) {
  return 'Variable "$' + varName + '" of type "' + type + '" is required and will not ' + ('use the default value. Perhaps you meant to use type "' + guessType + '".');
}

function badValueForDefaultArgMessage(varName, type, value, verboseErrors) {
  var message = verboseErrors ? '\n' + verboseErrors.join('\n') : '';
  return 'Variable "$' + varName + ' has invalid default value ' + value + '.' + message;
}

/**
 * Variable default values of correct type
 *
 * A GraphQL document is only valid if all variable default values are of the
 * type expected by their definition.
 */

function DefaultValuesOfCorrectType(context) {
  return {
    VariableDefinition: function VariableDefinition(varDefAST) {
      var name = varDefAST.variable.name.value;
      var defaultValue = varDefAST.defaultValue;
      var type = context.getInputType();
      if (type instanceof _typeDefinition.GraphQLNonNull && defaultValue) {
        context.reportError(new _error.GraphQLError(defaultForNonNullArgMessage(name, type, type.ofType), [defaultValue]));
      }
      if (type && defaultValue) {
        var errors = (0, _utilitiesIsValidLiteralValue.isValidLiteralValue)(type, defaultValue);
        if (errors && errors.length > 0) {
          context.reportError(new _error.GraphQLError(badValueForDefaultArgMessage(name, type, (0, _languagePrinter.print)(defaultValue), errors), [defaultValue]));
        }
      }
      return false;
    },
    SelectionSet: function SelectionSet() {
      return false;
    },
    FragmentDefinition: function FragmentDefinition() {
      return false;
    }
  };
}
},{"../../error":150,"../../language/printer":168,"../../type/definition":171,"../../utilities/isValidLiteralValue":187}],195:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.undefinedFieldMessage = undefinedFieldMessage;
exports.FieldsOnCorrectType = FieldsOnCorrectType;

var _error = require('../../error');

var _typeDefinition = require('../../type/definition');

function undefinedFieldMessage(fieldName, type, suggestedTypes) {
  var message = 'Cannot query field "' + fieldName + '" on type "' + type + '".';
  var MAX_LENGTH = 5;
  if (suggestedTypes.length !== 0) {
    var suggestions = suggestedTypes.slice(0, MAX_LENGTH).map(function (t) {
      return '"' + t + '"';
    }).join(', ');
    if (suggestedTypes.length > MAX_LENGTH) {
      suggestions += ', and ' + (suggestedTypes.length - MAX_LENGTH) + ' other types';
    }
    message += ' However, this field exists on ' + suggestions + '.';
    message += ' Perhaps you meant to use an inline fragment?';
  }
  return message;
}

/**
 * Fields on correct type
 *
 * A GraphQL document is only valid if all fields selected are defined by the
 * parent type, or are an allowed meta field such as __typenamme
 */

function FieldsOnCorrectType(context) {
  return {
    Field: function Field(node) {
      var type = context.getParentType();
      if (type) {
        var fieldDef = context.getFieldDef();
        if (!fieldDef) {
          // This isn't valid. Let's find suggestions, if any.
          var suggestedTypes = [];
          if ((0, _typeDefinition.isAbstractType)(type)) {
            suggestedTypes = getSiblingInterfacesIncludingField(type, node.name.value);
            suggestedTypes = suggestedTypes.concat(getImplementationsIncludingField(type, node.name.value));
          }
          context.reportError(new _error.GraphQLError(undefinedFieldMessage(node.name.value, type.name, suggestedTypes), [node]));
        }
      }
    }
  };
}

/**
 * Return implementations of `type` that include `fieldName` as a valid field.
 */
function getImplementationsIncludingField(type, fieldName) {
  return type.getPossibleTypes().filter(function (t) {
    return t.getFields()[fieldName] !== undefined;
  }).map(function (t) {
    return t.name;
  }).sort();
}

/**
 * Go through all of the implementations of type, and find other interaces
 * that they implement. If those interfaces include `field` as a valid field,
 * return them, sorted by how often the implementations include the other
 * interface.
 */
function getSiblingInterfacesIncludingField(type, fieldName) {
  var implementingObjects = type.getPossibleTypes().filter(function (t) {
    return t instanceof _typeDefinition.GraphQLObjectType;
  });

  var suggestedInterfaces = implementingObjects.reduce(function (acc, t) {
    t.getInterfaces().forEach(function (i) {
      if (i.getFields()[fieldName] === undefined) {
        return;
      }
      if (acc[i.name] === undefined) {
        acc[i.name] = 0;
      }
      acc[i.name] += 1;
    });
    return acc;
  }, {});
  return _Object$keys(suggestedInterfaces).sort(function (a, b) {
    return suggestedInterfaces[b] - suggestedInterfaces[a];
  });
}
},{"../../error":150,"../../type/definition":171,"babel-runtime/core-js/object/keys":12}],196:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.inlineFragmentOnNonCompositeErrorMessage = inlineFragmentOnNonCompositeErrorMessage;
exports.fragmentOnNonCompositeErrorMessage = fragmentOnNonCompositeErrorMessage;
exports.FragmentsOnCompositeTypes = FragmentsOnCompositeTypes;

var _error = require('../../error');

var _languagePrinter = require('../../language/printer');

var _typeDefinition = require('../../type/definition');

function inlineFragmentOnNonCompositeErrorMessage(type) {
  return 'Fragment cannot condition on non composite type "' + type + '".';
}

function fragmentOnNonCompositeErrorMessage(fragName, type) {
  return 'Fragment "' + fragName + '" cannot condition on non composite ' + ('type "' + type + '".');
}

/**
 * Fragments on composite type
 *
 * Fragments use a type condition to determine if they apply, since fragments
 * can only be spread into a composite type (object, interface, or union), the
 * type condition must also be a composite type.
 */

function FragmentsOnCompositeTypes(context) {
  return {
    InlineFragment: function InlineFragment(node) {
      var type = context.getType();
      if (node.typeCondition && type && !(0, _typeDefinition.isCompositeType)(type)) {
        context.reportError(new _error.GraphQLError(inlineFragmentOnNonCompositeErrorMessage((0, _languagePrinter.print)(node.typeCondition)), [node.typeCondition]));
      }
    },
    FragmentDefinition: function FragmentDefinition(node) {
      var type = context.getType();
      if (type && !(0, _typeDefinition.isCompositeType)(type)) {
        context.reportError(new _error.GraphQLError(fragmentOnNonCompositeErrorMessage(node.name.value, (0, _languagePrinter.print)(node.typeCondition)), [node.typeCondition]));
      }
    }
  };
}
},{"../../error":150,"../../language/printer":168,"../../type/definition":171}],197:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.unknownArgMessage = unknownArgMessage;
exports.unknownDirectiveArgMessage = unknownDirectiveArgMessage;
exports.KnownArgumentNames = KnownArgumentNames;

var _error = require('../../error');

var _jsutilsFind = require('../../jsutils/find');

var _jsutilsFind2 = _interopRequireDefault(_jsutilsFind);

var _jsutilsInvariant = require('../../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _languageKinds = require('../../language/kinds');

function unknownArgMessage(argName, fieldName, type) {
  return 'Unknown argument "' + argName + '" on field "' + fieldName + '" of ' + ('type "' + type + '".');
}

function unknownDirectiveArgMessage(argName, directiveName) {
  return 'Unknown argument "' + argName + '" on directive "@' + directiveName + '".';
}

/**
 * Known argument names
 *
 * A GraphQL field is only valid if all supplied arguments are defined by
 * that field.
 */

function KnownArgumentNames(context) {
  return {
    Argument: function Argument(node, key, parent, path, ancestors) {
      var argumentOf = ancestors[ancestors.length - 1];
      if (argumentOf.kind === _languageKinds.FIELD) {
        var fieldDef = context.getFieldDef();
        if (fieldDef) {
          var fieldArgDef = (0, _jsutilsFind2['default'])(fieldDef.args, function (arg) {
            return arg.name === node.name.value;
          });
          if (!fieldArgDef) {
            var parentType = context.getParentType();
            (0, _jsutilsInvariant2['default'])(parentType);
            context.reportError(new _error.GraphQLError(unknownArgMessage(node.name.value, fieldDef.name, parentType.name), [node]));
          }
        }
      } else if (argumentOf.kind === _languageKinds.DIRECTIVE) {
        var directive = context.getDirective();
        if (directive) {
          var directiveArgDef = (0, _jsutilsFind2['default'])(directive.args, function (arg) {
            return arg.name === node.name.value;
          });
          if (!directiveArgDef) {
            context.reportError(new _error.GraphQLError(unknownDirectiveArgMessage(node.name.value, directive.name), [node]));
          }
        }
      }
    }
  };
}
},{"../../error":150,"../../jsutils/find":158,"../../jsutils/invariant":159,"../../language/kinds":164,"babel-runtime/helpers/interop-require-default":21}],198:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.unknownDirectiveMessage = unknownDirectiveMessage;
exports.misplacedDirectiveMessage = misplacedDirectiveMessage;
exports.KnownDirectives = KnownDirectives;

var _error = require('../../error');

var _jsutilsFind = require('../../jsutils/find');

var _jsutilsFind2 = _interopRequireDefault(_jsutilsFind);

var _languageKinds = require('../../language/kinds');

function unknownDirectiveMessage(directiveName) {
  return 'Unknown directive "' + directiveName + '".';
}

function misplacedDirectiveMessage(directiveName, placement) {
  return 'Directive "' + directiveName + '" may not be used on "' + placement + '".';
}

/**
 * Known directives
 *
 * A GraphQL document is only valid if all `@directives` are known by the
 * schema and legally positioned.
 */

function KnownDirectives(context) {
  return {
    Directive: function Directive(node, key, parent, path, ancestors) {
      var directiveDef = (0, _jsutilsFind2['default'])(context.getSchema().getDirectives(), function (def) {
        return def.name === node.name.value;
      });
      if (!directiveDef) {
        context.reportError(new _error.GraphQLError(unknownDirectiveMessage(node.name.value), [node]));
        return;
      }
      var appliedTo = ancestors[ancestors.length - 1];
      switch (appliedTo.kind) {
        case _languageKinds.OPERATION_DEFINITION:
          if (!directiveDef.onOperation) {
            context.reportError(new _error.GraphQLError(misplacedDirectiveMessage(node.name.value, 'operation'), [node]));
          }
          break;
        case _languageKinds.FIELD:
          if (!directiveDef.onField) {
            context.reportError(new _error.GraphQLError(misplacedDirectiveMessage(node.name.value, 'field'), [node]));
          }
          break;
        case _languageKinds.FRAGMENT_SPREAD:
        case _languageKinds.INLINE_FRAGMENT:
        case _languageKinds.FRAGMENT_DEFINITION:
          if (!directiveDef.onFragment) {
            context.reportError(new _error.GraphQLError(misplacedDirectiveMessage(node.name.value, 'fragment'), [node]));
          }
          break;
      }
    }
  };
}
},{"../../error":150,"../../jsutils/find":158,"../../language/kinds":164,"babel-runtime/helpers/interop-require-default":21}],199:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.unknownFragmentMessage = unknownFragmentMessage;
exports.KnownFragmentNames = KnownFragmentNames;

var _error = require('../../error');

function unknownFragmentMessage(fragName) {
  return 'Unknown fragment "' + fragName + '".';
}

/**
 * Known fragment names
 *
 * A GraphQL document is only valid if all `...Fragment` fragment spreads refer
 * to fragments defined in the same document.
 */

function KnownFragmentNames(context) {
  return {
    FragmentSpread: function FragmentSpread(node) {
      var fragmentName = node.name.value;
      var fragment = context.getFragment(fragmentName);
      if (!fragment) {
        context.reportError(new _error.GraphQLError(unknownFragmentMessage(fragmentName), [node.name]));
      }
    }
  };
}
},{"../../error":150}],200:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.unknownTypeMessage = unknownTypeMessage;
exports.KnownTypeNames = KnownTypeNames;

var _error = require('../../error');

function unknownTypeMessage(type) {
  return 'Unknown type "' + type + '".';
}

/**
 * Known type names
 *
 * A GraphQL document is only valid if referenced types (specifically
 * variable definitions and fragment conditions) are defined by the type schema.
 */

function KnownTypeNames(context) {
  return {
    // TODO: when validating IDL, re-enable these. Experimental version does not
    // add unreferenced types, resulting in false-positive errors. Squelched
    // errors for now.
    ObjectTypeDefinition: function ObjectTypeDefinition() {
      return false;
    },
    InterfaceTypeDefinition: function InterfaceTypeDefinition() {
      return false;
    },
    UnionTypeDefinition: function UnionTypeDefinition() {
      return false;
    },
    InputObjectTypeDefinition: function InputObjectTypeDefinition() {
      return false;
    },
    NamedType: function NamedType(node) {
      var typeName = node.name.value;
      var type = context.getSchema().getType(typeName);
      if (!type) {
        context.reportError(new _error.GraphQLError(unknownTypeMessage(typeName), [node]));
      }
    }
  };
}
},{"../../error":150}],201:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.anonOperationNotAloneMessage = anonOperationNotAloneMessage;
exports.LoneAnonymousOperation = LoneAnonymousOperation;

var _error = require('../../error');

var _languageKinds = require('../../language/kinds');

function anonOperationNotAloneMessage() {
  return 'This anonymous operation must be the only defined operation.';
}

/**
 * Lone anonymous operation
 *
 * A GraphQL document is only valid if when it contains an anonymous operation
 * (the query short-hand) that it contains only that one operation definition.
 */

function LoneAnonymousOperation(context) {
  var operationCount = 0;
  return {
    Document: function Document(node) {
      operationCount = node.definitions.filter(function (definition) {
        return definition.kind === _languageKinds.OPERATION_DEFINITION;
      }).length;
    },
    OperationDefinition: function OperationDefinition(node) {
      if (!node.name && operationCount > 1) {
        context.reportError(new _error.GraphQLError(anonOperationNotAloneMessage(), [node]));
      }
    }
  };
}
},{"../../error":150,"../../language/kinds":164}],202:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.cycleErrorMessage = cycleErrorMessage;
exports.NoFragmentCycles = NoFragmentCycles;

var _error = require('../../error');

function cycleErrorMessage(fragName, spreadNames) {
  var via = spreadNames.length ? ' via ' + spreadNames.join(', ') : '';
  return 'Cannot spread fragment "' + fragName + '" within itself' + via + '.';
}

function NoFragmentCycles(context) {
  // Tracks already visited fragments to maintain O(N) and to ensure that cycles
  // are not redundantly reported.
  var visitedFrags = _Object$create(null);

  // Array of AST nodes used to produce meaningful errors
  var spreadPath = [];

  // Position in the spread path
  var spreadPathIndexByName = _Object$create(null);

  return {
    OperationDefinition: function OperationDefinition() {
      return false;
    },
    FragmentDefinition: function FragmentDefinition(node) {
      if (!visitedFrags[node.name.value]) {
        detectCycleRecursive(node);
      }
      return false;
    }
  };

  // This does a straight-forward DFS to find cycles.
  // It does not terminate when a cycle was found but continues to explore
  // the graph to find all possible cycles.
  function detectCycleRecursive(fragment) {
    var fragmentName = fragment.name.value;
    visitedFrags[fragmentName] = true;

    var spreadNodes = context.getFragmentSpreads(fragment);
    if (spreadNodes.length === 0) {
      return;
    }

    spreadPathIndexByName[fragmentName] = spreadPath.length;

    for (var i = 0; i < spreadNodes.length; i++) {
      var spreadNode = spreadNodes[i];
      var spreadName = spreadNode.name.value;
      var cycleIndex = spreadPathIndexByName[spreadName];

      if (cycleIndex === undefined) {
        spreadPath.push(spreadNode);
        if (!visitedFrags[spreadName]) {
          var spreadFragment = context.getFragment(spreadName);
          if (spreadFragment) {
            detectCycleRecursive(spreadFragment);
          }
        }
        spreadPath.pop();
      } else {
        var cyclePath = spreadPath.slice(cycleIndex);
        context.reportError(new _error.GraphQLError(cycleErrorMessage(spreadName, cyclePath.map(function (s) {
          return s.name.value;
        })), cyclePath.concat(spreadNode)));
      }
    }

    spreadPathIndexByName[fragmentName] = undefined;
  }
}
},{"../../error":150,"babel-runtime/core-js/object/create":9}],203:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.undefinedVarMessage = undefinedVarMessage;
exports.NoUndefinedVariables = NoUndefinedVariables;

var _error = require('../../error');

function undefinedVarMessage(varName, opName) {
  return opName ? 'Variable "$' + varName + '" is not defined by operation "' + opName + '".' : 'Variable "$' + varName + '" is not defined.';
}

/**
 * No undefined variables
 *
 * A GraphQL operation is only valid if all variables encountered, both directly
 * and via fragment spreads, are defined by that operation.
 */

function NoUndefinedVariables(context) {
  var variableNameDefined = _Object$create(null);

  return {
    OperationDefinition: {
      enter: function enter() {
        variableNameDefined = _Object$create(null);
      },
      leave: function leave(operation) {
        var usages = context.getRecursiveVariableUsages(operation);

        usages.forEach(function (_ref) {
          var node = _ref.node;

          var varName = node.name.value;
          if (variableNameDefined[varName] !== true) {
            context.reportError(new _error.GraphQLError(undefinedVarMessage(varName, operation.name && operation.name.value), [node, operation]));
          }
        });
      }
    },
    VariableDefinition: function VariableDefinition(varDefAST) {
      variableNameDefined[varDefAST.variable.name.value] = true;
    }
  };
}
},{"../../error":150,"babel-runtime/core-js/object/create":9}],204:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.unusedFragMessage = unusedFragMessage;
exports.NoUnusedFragments = NoUnusedFragments;

var _error = require('../../error');

function unusedFragMessage(fragName) {
  return 'Fragment "' + fragName + '" is never used.';
}

/**
 * No unused fragments
 *
 * A GraphQL document is only valid if all fragment definitions are spread
 * within operations, or spread within other fragments spread within operations.
 */

function NoUnusedFragments(context) {
  var operationDefs = [];
  var fragmentDefs = [];

  return {
    OperationDefinition: function OperationDefinition(node) {
      operationDefs.push(node);
      return false;
    },
    FragmentDefinition: function FragmentDefinition(node) {
      fragmentDefs.push(node);
      return false;
    },
    Document: {
      leave: function leave() {
        var fragmentNameUsed = _Object$create(null);
        operationDefs.forEach(function (operation) {
          context.getRecursivelyReferencedFragments(operation).forEach(function (fragment) {
            fragmentNameUsed[fragment.name.value] = true;
          });
        });

        fragmentDefs.forEach(function (fragmentDef) {
          var fragName = fragmentDef.name.value;
          if (fragmentNameUsed[fragName] !== true) {
            context.reportError(new _error.GraphQLError(unusedFragMessage(fragName), [fragmentDef]));
          }
        });
      }
    }
  };
}
},{"../../error":150,"babel-runtime/core-js/object/create":9}],205:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.unusedVariableMessage = unusedVariableMessage;
exports.NoUnusedVariables = NoUnusedVariables;

var _error = require('../../error');

function unusedVariableMessage(varName, opName) {
  return opName ? 'Variable "$' + varName + '" is never used in operation "' + opName + '".' : 'Variable "$' + varName + '" is never used.';
}

/**
 * No unused variables
 *
 * A GraphQL operation is only valid if all variables defined by an operation
 * are used, either directly or within a spread fragment.
 */

function NoUnusedVariables(context) {
  var variableDefs = [];

  return {
    OperationDefinition: {
      enter: function enter() {
        variableDefs = [];
      },
      leave: function leave(operation) {
        var variableNameUsed = _Object$create(null);
        var usages = context.getRecursiveVariableUsages(operation);
        var opName = operation.name ? operation.name.value : null;

        usages.forEach(function (_ref) {
          var node = _ref.node;

          variableNameUsed[node.name.value] = true;
        });

        variableDefs.forEach(function (variableDef) {
          var variableName = variableDef.variable.name.value;
          if (variableNameUsed[variableName] !== true) {
            context.reportError(new _error.GraphQLError(unusedVariableMessage(variableName, opName), [variableDef]));
          }
        });
      }
    },
    VariableDefinition: function VariableDefinition(def) {
      variableDefs.push(def);
    }
  };
}
},{"../../error":150,"babel-runtime/core-js/object/create":9}],206:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _Map = require('babel-runtime/core-js/map')['default'];

var _Set = require('babel-runtime/core-js/set')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.fieldsConflictMessage = fieldsConflictMessage;
exports.OverlappingFieldsCanBeMerged = OverlappingFieldsCanBeMerged;

// Field name and reason.

// Reason is a string, or a nested list of conflicts.

// Tuple defining an AST in a context

// Map of array of those.

var _error = require('../../error');

var _jsutilsFind = require('../../jsutils/find');

var _jsutilsFind2 = _interopRequireDefault(_jsutilsFind);

var _languageKinds = require('../../language/kinds');

var _languagePrinter = require('../../language/printer');

var _typeDefinition = require('../../type/definition');

var _utilitiesTypeComparators = require('../../utilities/typeComparators');

var _utilitiesTypeFromAST = require('../../utilities/typeFromAST');

function fieldsConflictMessage(responseName, reason) {
  return 'Fields "' + responseName + '" conflict because ' + reasonMessage(reason) + '.';
}

function reasonMessage(reason) {
  if (Array.isArray(reason)) {
    return reason.map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var responseName = _ref2[0];
      var subreason = _ref2[1];
      return 'subfields "' + responseName + '" conflict because ' + reasonMessage(subreason);
    }).join(' and ');
  }
  return reason;
}

/**
 * Overlapping fields can be merged
 *
 * A selection set is only valid if all fields (including spreading any
 * fragments) either correspond to distinct response names or can be merged
 * without ambiguity.
 */

function OverlappingFieldsCanBeMerged(context) {
  var comparedSet = new PairSet();

  function findConflicts(fieldMap) {
    var conflicts = [];
    _Object$keys(fieldMap).forEach(function (responseName) {
      var fields = fieldMap[responseName];
      if (fields.length > 1) {
        for (var i = 0; i < fields.length; i++) {
          for (var j = i; j < fields.length; j++) {
            var conflict = findConflict(responseName, fields[i], fields[j]);
            if (conflict) {
              conflicts.push(conflict);
            }
          }
        }
      }
    });
    return conflicts;
  }

  function findConflict(responseName, field1, field2) {
    var _field1 = _slicedToArray(field1, 3);

    var parentType1 = _field1[0];
    var ast1 = _field1[1];
    var def1 = _field1[2];

    var _field2 = _slicedToArray(field2, 3);

    var parentType2 = _field2[0];
    var ast2 = _field2[1];
    var def2 = _field2[2];

    // Not a pair.
    if (ast1 === ast2) {
      return;
    }

    // If the statically known parent types could not possibly apply at the same
    // time, then it is safe to permit them to diverge as they will not present
    // any ambiguity by differing.
    // It is known that two parent types could never overlap if they are
    // different Object types. Interface or Union types might overlap - if not
    // in the current state of the schema, then perhaps in some future version,
    // thus may not safely diverge.
    if (parentType1 !== parentType2 && parentType1 instanceof _typeDefinition.GraphQLObjectType && parentType2 instanceof _typeDefinition.GraphQLObjectType) {
      return;
    }

    // Memoize, do not report the same issue twice.
    if (comparedSet.has(ast1, ast2)) {
      return;
    }
    comparedSet.add(ast1, ast2);

    var name1 = ast1.name.value;
    var name2 = ast2.name.value;
    if (name1 !== name2) {
      return [[responseName, name1 + ' and ' + name2 + ' are different fields'], [ast1], [ast2]];
    }

    var type1 = def1 && def1.type;
    var type2 = def2 && def2.type;
    if (type1 && type2 && !(0, _utilitiesTypeComparators.isEqualType)(type1, type2)) {
      return [[responseName, 'they return differing types ' + type1 + ' and ' + type2], [ast1], [ast2]];
    }

    if (!sameArguments(ast1.arguments || [], ast2.arguments || [])) {
      return [[responseName, 'they have differing arguments'], [ast1], [ast2]];
    }

    var selectionSet1 = ast1.selectionSet;
    var selectionSet2 = ast2.selectionSet;
    if (selectionSet1 && selectionSet2) {
      var visitedFragmentNames = {};
      var subfieldMap = collectFieldASTsAndDefs(context, (0, _typeDefinition.getNamedType)(type1), selectionSet1, visitedFragmentNames);
      subfieldMap = collectFieldASTsAndDefs(context, (0, _typeDefinition.getNamedType)(type2), selectionSet2, visitedFragmentNames, subfieldMap);
      var conflicts = findConflicts(subfieldMap);
      if (conflicts.length > 0) {
        return [[responseName, conflicts.map(function (_ref3) {
          var _ref32 = _slicedToArray(_ref3, 1);

          var reason = _ref32[0];
          return reason;
        })], conflicts.reduce(function (allFields, _ref4) {
          var _ref42 = _slicedToArray(_ref4, 2);

          var fields1 = _ref42[1];
          return allFields.concat(fields1);
        }, [ast1]), conflicts.reduce(function (allFields, _ref5) {
          var _ref52 = _slicedToArray(_ref5, 3);

          var fields2 = _ref52[2];
          return allFields.concat(fields2);
        }, [ast2])];
      }
    }
  }

  return {
    SelectionSet: {
      // Note: we validate on the reverse traversal so deeper conflicts will be
      // caught first, for clearer error messages.
      leave: function leave(selectionSet) {
        var fieldMap = collectFieldASTsAndDefs(context, context.getParentType(), selectionSet);
        var conflicts = findConflicts(fieldMap);
        conflicts.forEach(function (_ref6) {
          var _ref62 = _slicedToArray(_ref6, 3);

          var _ref62$0 = _slicedToArray(_ref62[0], 2);

          var responseName = _ref62$0[0];
          var reason = _ref62$0[1];
          var fields1 = _ref62[1];
          var fields2 = _ref62[2];
          return context.reportError(new _error.GraphQLError(fieldsConflictMessage(responseName, reason), fields1.concat(fields2)));
        });
      }
    }
  };
}

function sameArguments(arguments1, arguments2) {
  if (arguments1.length !== arguments2.length) {
    return false;
  }
  return arguments1.every(function (argument1) {
    var argument2 = (0, _jsutilsFind2['default'])(arguments2, function (argument) {
      return argument.name.value === argument1.name.value;
    });
    if (!argument2) {
      return false;
    }
    return sameValue(argument1.value, argument2.value);
  });
}

function sameValue(value1, value2) {
  return !value1 && !value2 || (0, _languagePrinter.print)(value1) === (0, _languagePrinter.print)(value2);
}

/**
 * Given a selectionSet, adds all of the fields in that selection to
 * the passed in map of fields, and returns it at the end.
 *
 * Note: This is not the same as execution's collectFields because at static
 * time we do not know what object type will be used, so we unconditionally
 * spread in all fragments.
 */
function collectFieldASTsAndDefs(context, parentType, selectionSet, visitedFragmentNames, astAndDefs) {
  var _visitedFragmentNames = visitedFragmentNames || {};
  var _astAndDefs = astAndDefs || {};
  for (var i = 0; i < selectionSet.selections.length; i++) {
    var selection = selectionSet.selections[i];
    switch (selection.kind) {
      case _languageKinds.FIELD:
        var fieldName = selection.name.value;
        var fieldDef = undefined;
        if (parentType instanceof _typeDefinition.GraphQLObjectType || parentType instanceof _typeDefinition.GraphQLInterfaceType) {
          fieldDef = parentType.getFields()[fieldName];
        }
        var responseName = selection.alias ? selection.alias.value : fieldName;
        if (!_astAndDefs[responseName]) {
          _astAndDefs[responseName] = [];
        }
        _astAndDefs[responseName].push([parentType, selection, fieldDef]);
        break;
      case _languageKinds.INLINE_FRAGMENT:
        var typeCondition = selection.typeCondition;
        var inlineFragmentType = typeCondition ? (0, _utilitiesTypeFromAST.typeFromAST)(context.getSchema(), selection.typeCondition) : parentType;
        _astAndDefs = collectFieldASTsAndDefs(context, inlineFragmentType, selection.selectionSet, _visitedFragmentNames, _astAndDefs);
        break;
      case _languageKinds.FRAGMENT_SPREAD:
        var fragName = selection.name.value;
        if (_visitedFragmentNames[fragName]) {
          continue;
        }
        _visitedFragmentNames[fragName] = true;
        var fragment = context.getFragment(fragName);
        if (!fragment) {
          continue;
        }
        var fragmentType = (0, _utilitiesTypeFromAST.typeFromAST)(context.getSchema(), fragment.typeCondition);
        _astAndDefs = collectFieldASTsAndDefs(context, fragmentType, fragment.selectionSet, _visitedFragmentNames, _astAndDefs);
        break;
    }
  }
  return _astAndDefs;
}

/**
 * A way to keep track of pairs of things when the ordering of the pair does
 * not matter. We do this by maintaining a sort of double adjacency sets.
 */

var PairSet = (function () {
  function PairSet() {
    _classCallCheck(this, PairSet);

    this._data = new _Map();
  }

  _createClass(PairSet, [{
    key: 'has',
    value: function has(a, b) {
      var first = this._data.get(a);
      return first && first.has(b);
    }
  }, {
    key: 'add',
    value: function add(a, b) {
      _pairSetAdd(this._data, a, b);
      _pairSetAdd(this._data, b, a);
    }
  }]);

  return PairSet;
})();

function _pairSetAdd(data, a, b) {
  var set = data.get(a);
  if (!set) {
    set = new _Set();
    data.set(a, set);
  }
  set.add(b);
}
},{"../../error":150,"../../jsutils/find":158,"../../language/kinds":164,"../../language/printer":168,"../../type/definition":171,"../../utilities/typeComparators":189,"../../utilities/typeFromAST":190,"babel-runtime/core-js/map":7,"babel-runtime/core-js/object/keys":12,"babel-runtime/core-js/set":15,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/interop-require-default":21,"babel-runtime/helpers/sliced-to-array":23}],207:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.typeIncompatibleSpreadMessage = typeIncompatibleSpreadMessage;
exports.typeIncompatibleAnonSpreadMessage = typeIncompatibleAnonSpreadMessage;
exports.PossibleFragmentSpreads = PossibleFragmentSpreads;

var _error = require('../../error');

var _utilitiesTypeComparators = require('../../utilities/typeComparators');

var _utilitiesTypeFromAST = require('../../utilities/typeFromAST');

function typeIncompatibleSpreadMessage(fragName, parentType, fragType) {
  return 'Fragment "' + fragName + '" cannot be spread here as objects of ' + ('type "' + parentType + '" can never be of type "' + fragType + '".');
}

function typeIncompatibleAnonSpreadMessage(parentType, fragType) {
  return 'Fragment cannot be spread here as objects of ' + ('type "' + parentType + '" can never be of type "' + fragType + '".');
}

/**
 * Possible fragment spread
 *
 * A fragment spread is only valid if the type condition could ever possibly
 * be true: if there is a non-empty intersection of the possible parent types,
 * and possible types which pass the type condition.
 */

function PossibleFragmentSpreads(context) {
  return {
    InlineFragment: function InlineFragment(node) {
      var fragType = context.getType();
      var parentType = context.getParentType();
      if (fragType && parentType && !(0, _utilitiesTypeComparators.doTypesOverlap)(fragType, parentType)) {
        context.reportError(new _error.GraphQLError(typeIncompatibleAnonSpreadMessage(parentType, fragType), [node]));
      }
    },
    FragmentSpread: function FragmentSpread(node) {
      var fragName = node.name.value;
      var fragType = getFragmentType(context, fragName);
      var parentType = context.getParentType();
      if (fragType && parentType && !(0, _utilitiesTypeComparators.doTypesOverlap)(fragType, parentType)) {
        context.reportError(new _error.GraphQLError(typeIncompatibleSpreadMessage(fragName, parentType, fragType), [node]));
      }
    }
  };
}

function getFragmentType(context, name) {
  var frag = context.getFragment(name);
  return frag && (0, _utilitiesTypeFromAST.typeFromAST)(context.getSchema(), frag.typeCondition);
}
},{"../../error":150,"../../utilities/typeComparators":189,"../../utilities/typeFromAST":190}],208:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.missingFieldArgMessage = missingFieldArgMessage;
exports.missingDirectiveArgMessage = missingDirectiveArgMessage;
exports.ProvidedNonNullArguments = ProvidedNonNullArguments;

var _error = require('../../error');

var _jsutilsKeyMap = require('../../jsutils/keyMap');

var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);

var _typeDefinition = require('../../type/definition');

function missingFieldArgMessage(fieldName, argName, type) {
  return 'Field "' + fieldName + '" argument "' + argName + '" of type "' + type + '" ' + 'is required but not provided.';
}

function missingDirectiveArgMessage(directiveName, argName, type) {
  return 'Directive "@' + directiveName + '" argument "' + argName + '" of type ' + ('"' + type + '" is required but not provided.');
}

/**
 * Provided required arguments
 *
 * A field or directive is only valid if all required (non-null) field arguments
 * have been provided.
 */

function ProvidedNonNullArguments(context) {
  return {
    Field: {
      // Validate on leave to allow for deeper errors to appear first.
      leave: function leave(fieldAST) {
        var fieldDef = context.getFieldDef();
        if (!fieldDef) {
          return false;
        }
        var argASTs = fieldAST.arguments || [];

        var argASTMap = (0, _jsutilsKeyMap2['default'])(argASTs, function (arg) {
          return arg.name.value;
        });
        fieldDef.args.forEach(function (argDef) {
          var argAST = argASTMap[argDef.name];
          if (!argAST && argDef.type instanceof _typeDefinition.GraphQLNonNull) {
            context.reportError(new _error.GraphQLError(missingFieldArgMessage(fieldAST.name.value, argDef.name, argDef.type), [fieldAST]));
          }
        });
      }
    },

    Directive: {
      // Validate on leave to allow for deeper errors to appear first.
      leave: function leave(directiveAST) {
        var directiveDef = context.getDirective();
        if (!directiveDef) {
          return false;
        }
        var argASTs = directiveAST.arguments || [];

        var argASTMap = (0, _jsutilsKeyMap2['default'])(argASTs, function (arg) {
          return arg.name.value;
        });
        directiveDef.args.forEach(function (argDef) {
          var argAST = argASTMap[argDef.name];
          if (!argAST && argDef.type instanceof _typeDefinition.GraphQLNonNull) {
            context.reportError(new _error.GraphQLError(missingDirectiveArgMessage(directiveAST.name.value, argDef.name, argDef.type), [directiveAST]));
          }
        });
      }
    }
  };
}
},{"../../error":150,"../../jsutils/keyMap":161,"../../type/definition":171,"babel-runtime/helpers/interop-require-default":21}],209:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.noSubselectionAllowedMessage = noSubselectionAllowedMessage;
exports.requiredSubselectionMessage = requiredSubselectionMessage;
exports.ScalarLeafs = ScalarLeafs;

var _error = require('../../error');

var _typeDefinition = require('../../type/definition');

function noSubselectionAllowedMessage(field, type) {
  return 'Field "' + field + '" of type "' + type + '" must not have a sub selection.';
}

function requiredSubselectionMessage(field, type) {
  return 'Field "' + field + '" of type "' + type + '" must have a sub selection.';
}

/**
 * Scalar leafs
 *
 * A GraphQL document is valid only if all leaf fields (fields without
 * sub selections) are of scalar or enum types.
 */

function ScalarLeafs(context) {
  return {
    Field: function Field(node) {
      var type = context.getType();
      if (type) {
        if ((0, _typeDefinition.isLeafType)(type)) {
          if (node.selectionSet) {
            context.reportError(new _error.GraphQLError(noSubselectionAllowedMessage(node.name.value, type), [node.selectionSet]));
          }
        } else if (!node.selectionSet) {
          context.reportError(new _error.GraphQLError(requiredSubselectionMessage(node.name.value, type), [node]));
        }
      }
    }
  };
}
},{"../../error":150,"../../type/definition":171}],210:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.duplicateArgMessage = duplicateArgMessage;
exports.UniqueArgumentNames = UniqueArgumentNames;

var _error = require('../../error');

function duplicateArgMessage(argName) {
  return 'There can be only one argument named "' + argName + '".';
}

/**
 * Unique argument names
 *
 * A GraphQL field or directive is only valid if all supplied arguments are
 * uniquely named.
 */

function UniqueArgumentNames(context) {
  var knownArgNames = _Object$create(null);
  return {
    Field: function Field() {
      knownArgNames = _Object$create(null);
    },
    Directive: function Directive() {
      knownArgNames = _Object$create(null);
    },
    Argument: function Argument(node) {
      var argName = node.name.value;
      if (knownArgNames[argName]) {
        context.reportError(new _error.GraphQLError(duplicateArgMessage(argName), [knownArgNames[argName], node.name]));
      } else {
        knownArgNames[argName] = node.name;
      }
      return false;
    }
  };
}
},{"../../error":150,"babel-runtime/core-js/object/create":9}],211:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.duplicateFragmentNameMessage = duplicateFragmentNameMessage;
exports.UniqueFragmentNames = UniqueFragmentNames;

var _error = require('../../error');

function duplicateFragmentNameMessage(fragName) {
  return 'There can only be one fragment named "' + fragName + '".';
}

/**
 * Unique fragment names
 *
 * A GraphQL document is only valid if all defined fragments have unique names.
 */

function UniqueFragmentNames(context) {
  var knownFragmentNames = _Object$create(null);
  return {
    OperationDefinition: function OperationDefinition() {
      return false;
    },
    FragmentDefinition: function FragmentDefinition(node) {
      var fragmentName = node.name.value;
      if (knownFragmentNames[fragmentName]) {
        context.reportError(new _error.GraphQLError(duplicateFragmentNameMessage(fragmentName), [knownFragmentNames[fragmentName], node.name]));
      } else {
        knownFragmentNames[fragmentName] = node.name;
      }
      return false;
    }
  };
}
},{"../../error":150,"babel-runtime/core-js/object/create":9}],212:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.duplicateInputFieldMessage = duplicateInputFieldMessage;
exports.UniqueInputFieldNames = UniqueInputFieldNames;

var _error = require('../../error');

function duplicateInputFieldMessage(fieldName) {
  return 'There can be only one input field named "' + fieldName + '".';
}

/**
 * Unique input field names
 *
 * A GraphQL input object value is only valid if all supplied fields are
 * uniquely named.
 */

function UniqueInputFieldNames(context) {
  var knownNameStack = [];
  var knownNames = _Object$create(null);

  return {
    ObjectValue: {
      enter: function enter() {
        knownNameStack.push(knownNames);
        knownNames = _Object$create(null);
      },
      leave: function leave() {
        knownNames = knownNameStack.pop();
      }
    },
    ObjectField: function ObjectField(node) {
      var fieldName = node.name.value;
      if (knownNames[fieldName]) {
        context.reportError(new _error.GraphQLError(duplicateInputFieldMessage(fieldName), [knownNames[fieldName], node.name]));
      } else {
        knownNames[fieldName] = node.name;
      }
      return false;
    }
  };
}
},{"../../error":150,"babel-runtime/core-js/object/create":9}],213:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.duplicateOperationNameMessage = duplicateOperationNameMessage;
exports.UniqueOperationNames = UniqueOperationNames;

var _error = require('../../error');

function duplicateOperationNameMessage(operationName) {
  return 'There can only be one operation named "' + operationName + '".';
}

/**
 * Unique operation names
 *
 * A GraphQL document is only valid if all defined operations have unique names.
 */

function UniqueOperationNames(context) {
  var knownOperationNames = _Object$create(null);
  return {
    OperationDefinition: function OperationDefinition(node) {
      var operationName = node.name;
      if (operationName) {
        if (knownOperationNames[operationName.value]) {
          context.reportError(new _error.GraphQLError(duplicateOperationNameMessage(operationName.value), [knownOperationNames[operationName.value], operationName]));
        } else {
          knownOperationNames[operationName.value] = operationName;
        }
      }
      return false;
    },
    FragmentDefinition: function FragmentDefinition() {
      return false;
    }
  };
}
},{"../../error":150,"babel-runtime/core-js/object/create":9}],214:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.duplicateVariableMessage = duplicateVariableMessage;
exports.UniqueVariableNames = UniqueVariableNames;

var _error = require('../../error');

function duplicateVariableMessage(variableName) {
  return 'There can be only one variable named "' + variableName + '".';
}

/**
 * Unique variable names
 *
 * A GraphQL operation is only valid if all its variables are uniquely named.
 */

function UniqueVariableNames(context) {
  var knownVariableNames = _Object$create(null);
  return {
    OperationDefinition: function OperationDefinition() {
      knownVariableNames = _Object$create(null);
    },
    VariableDefinition: function VariableDefinition(node) {
      var variableName = node.variable.name.value;
      if (knownVariableNames[variableName]) {
        context.reportError(new _error.GraphQLError(duplicateVariableMessage(variableName), [knownVariableNames[variableName], node.variable.name]));
      } else {
        knownVariableNames[variableName] = node.variable.name;
      }
    }
  };
}
},{"../../error":150,"babel-runtime/core-js/object/create":9}],215:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.nonInputTypeOnVarMessage = nonInputTypeOnVarMessage;
exports.VariablesAreInputTypes = VariablesAreInputTypes;

var _error = require('../../error');

var _languagePrinter = require('../../language/printer');

var _typeDefinition = require('../../type/definition');

var _utilitiesTypeFromAST = require('../../utilities/typeFromAST');

function nonInputTypeOnVarMessage(variableName, typeName) {
  return 'Variable "$' + variableName + '" cannot be non-input type "' + typeName + '".';
}

/**
 * Variables are input types
 *
 * A GraphQL operation is only valid if all the variables it defines are of
 * input types (scalar, enum, or input object).
 */

function VariablesAreInputTypes(context) {
  return {
    VariableDefinition: function VariableDefinition(node) {
      var type = (0, _utilitiesTypeFromAST.typeFromAST)(context.getSchema(), node.type);

      // If the variable type is not an input type, return an error.
      if (type && !(0, _typeDefinition.isInputType)(type)) {
        var variableName = node.variable.name.value;
        context.reportError(new _error.GraphQLError(nonInputTypeOnVarMessage(variableName, (0, _languagePrinter.print)(node.type)), [node.type]));
      }
    }
  };
}
},{"../../error":150,"../../language/printer":168,"../../type/definition":171,"../../utilities/typeFromAST":190}],216:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.badVarPosMessage = badVarPosMessage;
exports.VariablesInAllowedPosition = VariablesInAllowedPosition;

var _error = require('../../error');

var _typeDefinition = require('../../type/definition');

var _utilitiesTypeComparators = require('../../utilities/typeComparators');

var _utilitiesTypeFromAST = require('../../utilities/typeFromAST');

function badVarPosMessage(varName, varType, expectedType) {
  return 'Variable "$' + varName + '" of type "' + varType + '" used in position ' + ('expecting type "' + expectedType + '".');
}

/**
 * Variables passed to field arguments conform to type
 */

function VariablesInAllowedPosition(context) {
  var varDefMap = _Object$create(null);

  return {
    OperationDefinition: {
      enter: function enter() {
        varDefMap = _Object$create(null);
      },
      leave: function leave(operation) {
        var usages = context.getRecursiveVariableUsages(operation);

        usages.forEach(function (_ref) {
          var node = _ref.node;
          var type = _ref.type;

          var varName = node.name.value;
          var varDef = varDefMap[varName];
          if (varDef && type) {
            // A var type is allowed if it is the same or more strict (e.g. is
            // a subtype of) than the expected type. It can be more strict if
            // the variable type is non-null when the expected type is nullable.
            // If both are list types, the variable item type can be more strict
            // than the expected item type (contravariant).
            var varType = (0, _utilitiesTypeFromAST.typeFromAST)(context.getSchema(), varDef.type);
            if (varType && !(0, _utilitiesTypeComparators.isTypeSubTypeOf)(effectiveType(varType, varDef), type)) {
              context.reportError(new _error.GraphQLError(badVarPosMessage(varName, varType, type), [varDef, node]));
            }
          }
        });
      }
    },
    VariableDefinition: function VariableDefinition(varDefAST) {
      varDefMap[varDefAST.variable.name.value] = varDefAST;
    }
  };
}

// If a variable definition has a default value, it's effectively non-null.
function effectiveType(varType, varDef) {
  return !varDef.defaultValue || varType instanceof _typeDefinition.GraphQLNonNull ? varType : new _typeDefinition.GraphQLNonNull(varType);
}
},{"../../error":150,"../../type/definition":171,"../../utilities/typeComparators":189,"../../utilities/typeFromAST":190,"babel-runtime/core-js/object/create":9}],217:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

// Spec Section: "Operation Name Uniqueness"

/**
 * This set includes all validation rules defined by the GraphQL spec.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _rulesUniqueOperationNames = require('./rules/UniqueOperationNames');

// Spec Section: "Lone Anonymous Operation"

var _rulesLoneAnonymousOperation = require('./rules/LoneAnonymousOperation');

// Spec Section: "Fragment Spread Type Existence"

var _rulesKnownTypeNames = require('./rules/KnownTypeNames');

// Spec Section: "Fragments on Composite Types"

var _rulesFragmentsOnCompositeTypes = require('./rules/FragmentsOnCompositeTypes');

// Spec Section: "Variables are Input Types"

var _rulesVariablesAreInputTypes = require('./rules/VariablesAreInputTypes');

// Spec Section: "Leaf Field Selections"

var _rulesScalarLeafs = require('./rules/ScalarLeafs');

// Spec Section: "Field Selections on Objects, Interfaces, and Unions Types"

var _rulesFieldsOnCorrectType = require('./rules/FieldsOnCorrectType');

// Spec Section: "Fragment Name Uniqueness"

var _rulesUniqueFragmentNames = require('./rules/UniqueFragmentNames');

// Spec Section: "Fragment spread target defined"

var _rulesKnownFragmentNames = require('./rules/KnownFragmentNames');

// Spec Section: "Fragments must be used"

var _rulesNoUnusedFragments = require('./rules/NoUnusedFragments');

// Spec Section: "Fragment spread is possible"

var _rulesPossibleFragmentSpreads = require('./rules/PossibleFragmentSpreads');

// Spec Section: "Fragments must not form cycles"

var _rulesNoFragmentCycles = require('./rules/NoFragmentCycles');

// Spec Section: "Variable Uniqueness"

var _rulesUniqueVariableNames = require('./rules/UniqueVariableNames');

// Spec Section: "All Variable Used Defined"

var _rulesNoUndefinedVariables = require('./rules/NoUndefinedVariables');

// Spec Section: "All Variables Used"

var _rulesNoUnusedVariables = require('./rules/NoUnusedVariables');

// Spec Section: "Directives Are Defined"

var _rulesKnownDirectives = require('./rules/KnownDirectives');

// Spec Section: "Argument Names"

var _rulesKnownArgumentNames = require('./rules/KnownArgumentNames');

// Spec Section: "Argument Uniqueness"

var _rulesUniqueArgumentNames = require('./rules/UniqueArgumentNames');

// Spec Section: "Argument Values Type Correctness"

var _rulesArgumentsOfCorrectType = require('./rules/ArgumentsOfCorrectType');

// Spec Section: "Argument Optionality"

var _rulesProvidedNonNullArguments = require('./rules/ProvidedNonNullArguments');

// Spec Section: "Variable Default Values Are Correctly Typed"

var _rulesDefaultValuesOfCorrectType = require('./rules/DefaultValuesOfCorrectType');

// Spec Section: "All Variable Usages Are Allowed"

var _rulesVariablesInAllowedPosition = require('./rules/VariablesInAllowedPosition');

// Spec Section: "Field Selection Merging"

var _rulesOverlappingFieldsCanBeMerged = require('./rules/OverlappingFieldsCanBeMerged');

// Spec Section: "Input Object Field Uniqueness"

var _rulesUniqueInputFieldNames = require('./rules/UniqueInputFieldNames');

var specifiedRules = [_rulesUniqueOperationNames.UniqueOperationNames, _rulesLoneAnonymousOperation.LoneAnonymousOperation, _rulesKnownTypeNames.KnownTypeNames, _rulesFragmentsOnCompositeTypes.FragmentsOnCompositeTypes, _rulesVariablesAreInputTypes.VariablesAreInputTypes, _rulesScalarLeafs.ScalarLeafs, _rulesFieldsOnCorrectType.FieldsOnCorrectType, _rulesUniqueFragmentNames.UniqueFragmentNames, _rulesKnownFragmentNames.KnownFragmentNames, _rulesNoUnusedFragments.NoUnusedFragments, _rulesPossibleFragmentSpreads.PossibleFragmentSpreads, _rulesNoFragmentCycles.NoFragmentCycles, _rulesUniqueVariableNames.UniqueVariableNames, _rulesNoUndefinedVariables.NoUndefinedVariables, _rulesNoUnusedVariables.NoUnusedVariables, _rulesKnownDirectives.KnownDirectives, _rulesKnownArgumentNames.KnownArgumentNames, _rulesUniqueArgumentNames.UniqueArgumentNames, _rulesArgumentsOfCorrectType.ArgumentsOfCorrectType, _rulesProvidedNonNullArguments.ProvidedNonNullArguments, _rulesDefaultValuesOfCorrectType.DefaultValuesOfCorrectType, _rulesVariablesInAllowedPosition.VariablesInAllowedPosition, _rulesOverlappingFieldsCanBeMerged.OverlappingFieldsCanBeMerged, _rulesUniqueInputFieldNames.UniqueInputFieldNames];
exports.specifiedRules = specifiedRules;
},{"./rules/ArgumentsOfCorrectType":193,"./rules/DefaultValuesOfCorrectType":194,"./rules/FieldsOnCorrectType":195,"./rules/FragmentsOnCompositeTypes":196,"./rules/KnownArgumentNames":197,"./rules/KnownDirectives":198,"./rules/KnownFragmentNames":199,"./rules/KnownTypeNames":200,"./rules/LoneAnonymousOperation":201,"./rules/NoFragmentCycles":202,"./rules/NoUndefinedVariables":203,"./rules/NoUnusedFragments":204,"./rules/NoUnusedVariables":205,"./rules/OverlappingFieldsCanBeMerged":206,"./rules/PossibleFragmentSpreads":207,"./rules/ProvidedNonNullArguments":208,"./rules/ScalarLeafs":209,"./rules/UniqueArgumentNames":210,"./rules/UniqueFragmentNames":211,"./rules/UniqueInputFieldNames":212,"./rules/UniqueOperationNames":213,"./rules/UniqueVariableNames":214,"./rules/VariablesAreInputTypes":215,"./rules/VariablesInAllowedPosition":216}],218:[function(require,module,exports){

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Map = require('babel-runtime/core-js/map')['default'];

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _interopRequireWildcard = require('babel-runtime/helpers/interop-require-wildcard')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.validate = validate;
exports.visitUsingRules = visitUsingRules;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _error = require('../error');

var _languageVisitor = require('../language/visitor');

var _languageKinds = require('../language/kinds');

var Kind = _interopRequireWildcard(_languageKinds);

var _typeSchema = require('../type/schema');

var _utilitiesTypeInfo = require('../utilities/TypeInfo');

var _specifiedRules = require('./specifiedRules');

/**
 * Implements the "Validation" section of the spec.
 *
 * Validation runs synchronously, returning an array of encountered errors, or
 * an empty array if no errors were encountered and the document is valid.
 *
 * A list of specific validation rules may be provided. If not provided, the
 * default list of rules defined by the GraphQL specification will be used.
 *
 * Each validation rules is a function which returns a visitor
 * (see the language/visitor API). Visitor methods are expected to return
 * GraphQLErrors, or Arrays of GraphQLErrors when invalid.
 */

function validate(schema, ast, rules) {
  (0, _jsutilsInvariant2['default'])(schema, 'Must provide schema');
  (0, _jsutilsInvariant2['default'])(ast, 'Must provide document');
  (0, _jsutilsInvariant2['default'])(schema instanceof _typeSchema.GraphQLSchema, 'Schema must be an instance of GraphQLSchema. Also ensure that there are ' + 'not multiple versions of GraphQL installed in your node_modules directory.');
  var typeInfo = new _utilitiesTypeInfo.TypeInfo(schema);
  return visitUsingRules(schema, typeInfo, ast, rules || _specifiedRules.specifiedRules);
}

/**
 * This uses a specialized visitor which runs multiple visitors in parallel,
 * while maintaining the visitor skip and break API.
 *
 * @internal
 */

function visitUsingRules(schema, typeInfo, documentAST, rules) {
  var context = new ValidationContext(schema, documentAST, typeInfo);
  var visitors = rules.map(function (rule) {
    return rule(context);
  });
  // Visit the whole document with each instance of all provided rules.
  (0, _languageVisitor.visit)(documentAST, (0, _languageVisitor.visitWithTypeInfo)(typeInfo, (0, _languageVisitor.visitInParallel)(visitors)));
  return context.getErrors();
}

/**
 * An instance of this class is passed as the "this" context to all validators,
 * allowing access to commonly useful contextual information from within a
 * validation rule.
 */

var ValidationContext = (function () {
  function ValidationContext(schema, ast, typeInfo) {
    _classCallCheck(this, ValidationContext);

    this._schema = schema;
    this._ast = ast;
    this._typeInfo = typeInfo;
    this._errors = [];
    this._fragmentSpreads = new _Map();
    this._recursivelyReferencedFragments = new _Map();
    this._variableUsages = new _Map();
    this._recursiveVariableUsages = new _Map();
  }

  _createClass(ValidationContext, [{
    key: 'reportError',
    value: function reportError(error) {
      this._errors.push(error);
    }
  }, {
    key: 'getErrors',
    value: function getErrors() {
      return this._errors;
    }
  }, {
    key: 'getSchema',
    value: function getSchema() {
      return this._schema;
    }
  }, {
    key: 'getDocument',
    value: function getDocument() {
      return this._ast;
    }
  }, {
    key: 'getFragment',
    value: function getFragment(name) {
      var fragments = this._fragments;
      if (!fragments) {
        this._fragments = fragments = this.getDocument().definitions.reduce(function (frags, statement) {
          if (statement.kind === Kind.FRAGMENT_DEFINITION) {
            frags[statement.name.value] = statement;
          }
          return frags;
        }, {});
      }
      return fragments[name];
    }
  }, {
    key: 'getFragmentSpreads',
    value: function getFragmentSpreads(node) {
      var spreads = this._fragmentSpreads.get(node);
      if (!spreads) {
        spreads = [];
        var setsToVisit = [node.selectionSet];
        while (setsToVisit.length !== 0) {
          var set = setsToVisit.pop();
          for (var i = 0; i < set.selections.length; i++) {
            var selection = set.selections[i];
            if (selection.kind === Kind.FRAGMENT_SPREAD) {
              spreads.push(selection);
            } else if (selection.selectionSet) {
              setsToVisit.push(selection.selectionSet);
            }
          }
        }
        this._fragmentSpreads.set(node, spreads);
      }
      return spreads;
    }
  }, {
    key: 'getRecursivelyReferencedFragments',
    value: function getRecursivelyReferencedFragments(operation) {
      var fragments = this._recursivelyReferencedFragments.get(operation);
      if (!fragments) {
        fragments = [];
        var collectedNames = _Object$create(null);
        var nodesToVisit = [operation];
        while (nodesToVisit.length !== 0) {
          var _node = nodesToVisit.pop();
          var spreads = this.getFragmentSpreads(_node);
          for (var i = 0; i < spreads.length; i++) {
            var fragName = spreads[i].name.value;
            if (collectedNames[fragName] !== true) {
              collectedNames[fragName] = true;
              var fragment = this.getFragment(fragName);
              if (fragment) {
                fragments.push(fragment);
                nodesToVisit.push(fragment);
              }
            }
          }
        }
        this._recursivelyReferencedFragments.set(operation, fragments);
      }
      return fragments;
    }
  }, {
    key: 'getVariableUsages',
    value: function getVariableUsages(node) {
      var _this = this;

      var usages = this._variableUsages.get(node);
      if (!usages) {
        (function () {
          var newUsages = [];
          var typeInfo = new _utilitiesTypeInfo.TypeInfo(_this._schema);
          (0, _languageVisitor.visit)(node, (0, _languageVisitor.visitWithTypeInfo)(typeInfo, {
            VariableDefinition: function VariableDefinition() {
              return false;
            },
            Variable: function Variable(variable) {
              newUsages.push({ node: variable, type: typeInfo.getInputType() });
            }
          }));
          usages = newUsages;
          _this._variableUsages.set(node, usages);
        })();
      }
      return usages;
    }
  }, {
    key: 'getRecursiveVariableUsages',
    value: function getRecursiveVariableUsages(operation) {
      var usages = this._recursiveVariableUsages.get(operation);
      if (!usages) {
        usages = this.getVariableUsages(operation);
        var fragments = this.getRecursivelyReferencedFragments(operation);
        for (var i = 0; i < fragments.length; i++) {
          Array.prototype.push.apply(usages, this.getVariableUsages(fragments[i]));
        }
        this._recursiveVariableUsages.set(operation, usages);
      }
      return usages;
    }
  }, {
    key: 'getType',
    value: function getType() {
      return this._typeInfo.getType();
    }
  }, {
    key: 'getParentType',
    value: function getParentType() {
      return this._typeInfo.getParentType();
    }
  }, {
    key: 'getInputType',
    value: function getInputType() {
      return this._typeInfo.getInputType();
    }
  }, {
    key: 'getFieldDef',
    value: function getFieldDef() {
      return this._typeInfo.getFieldDef();
    }
  }, {
    key: 'getDirective',
    value: function getDirective() {
      return this._typeInfo.getDirective();
    }
  }, {
    key: 'getArgument',
    value: function getArgument() {
      return this._typeInfo.getArgument();
    }
  }]);

  return ValidationContext;
})();

exports.ValidationContext = ValidationContext;
},{"../error":150,"../jsutils/invariant":159,"../language/kinds":164,"../language/visitor":170,"../type/schema":176,"../utilities/TypeInfo":177,"./specifiedRules":217,"babel-runtime/core-js/map":7,"babel-runtime/core-js/object/create":9,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/interop-require-default":21,"babel-runtime/helpers/interop-require-wildcard":22}],219:[function(require,module,exports){
'use strict';

/**
 * Find closest .env file. Need to do this because .env is not always at root of project (like during local testing)
 */

var path = require('path'),
    fs   = require('fs');

function fileExistsSync(path) {
  try {
    var stats = fs.lstatSync(path);
    return stats.isFile();
  }
  catch (e) {
    return false;
  }
}

var dirName = eval('__dirname'),
    i       = 0;

while (i < 6) {
  if (fileExistsSync(path.join(dirName, '.env'))) {
    break;
  }

  dirName = path.join(dirName, '..');
  ++i;
}

require('dotenv').config({path: path.join(dirName, '.env'), silent: true});
},{"dotenv":143,"fs":undefined,"path":undefined}],220:[function(require,module,exports){
/**
 * Serverless Helpers JS
 */


var ServerlessHelpers = {

  // Load Environment Variables
  loadEnv: function() {
    require('./env');
  }

};

// Export
module.exports = ServerlessHelpers;
},{"./env":219}],221:[function(require,module,exports){
'use strict';

/**
 * Serverless Module: Lambda Handler
 * - Your lambda functions should be a thin wrapper around your own separate
 * modules, to keep your code testable, reusable and AWS independent
 * - 'serverless-helpers-js' module is required for Serverless ENV var support.  Hopefully, AWS will add ENV support to Lambda soon :)
 */

// Require Serverless ENV vars

var ServerlessHelpers = require('serverless-helpers-js').loadEnv();

// Require Logic
var lib = require('../../lib');

// Lambda Handler
module.exports.handler = function (event, context) {

  lib.runGraphQL(event, function (error, response) {
    return context.done(error, response);
  });
};

},{"../../lib":2,"serverless-helpers-js":220}]},{},[221])(221)
});