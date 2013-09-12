/*
  comments
  go
  here
*/


/*
  comments
  go
  here
abc
*/


/*  comments2  go  here*/


/*
  comments
#  go
  here
*/


/*  A Connection wraps a persistant BC connection to a sharejs server.*/


/**/


/*  This class implements the client side of the protocol defined here:*/


/*  https://github.com/josephg/ShareJS/wiki/Wire-Protocol*/


/**/


/*  The equivalent server code is in src/server/browserchannel.coffee.*/


/**/


/*  This file is a bit of a mess. I'm dreadfully sorry about that. It passes all the tests,*/


/*  so I have hope that its *correct* even if its not clean.*/


/**/


/*  Most of Connection exists to support the open() method, which creates a new document*/


/*  reference.*/


(function() {
  var BCSocket, Connection, Doc, MicroEvent, SockJS, WebSocket, socketImpl, types;

  if (typeof WEB !== "undefined" && WEB !== null) {
    types = exports.types;
    BCSocket = window.BCSocket, SockJS = window.SockJS, WebSocket = window.WebSocket;
    if (BCSocket) {
      socketImpl = 'channel';
    } else {
      if (SockJS) {
        socketImpl = 'sockjs';
      } else {
        socketImpl = 'websocket';
      }
    }
  } else {
    types = require('../types');
    BCSocket = require('browserchannel').BCSocket;
    Doc = require('./doc').Doc;
    WebSocket = require('ws');
    socketImpl = null;
  }

  Connection = (function() {
    function Connection(host, authentication) {
      var _this = this;
      this.docs = {};
      this.state = 'connecting';
      if (socketImpl == null) {
        if (host.match(/^ws:/)) {
          socketImpl = 'websocket';
        }
      }
      this.socket = (function() {
        switch (socketImpl) {
          case 'channel':
            return new BCSocket(host, {
              reconnect: true
            });
          case 'sockjs':
            return new ReconnectingWebSocket(host, SockJS);
          case 'websocket':
            return new ReconnectingWebSocket(host);
          default:
            return new BCSocket(host, {
              reconnect: true
            });
        }
      })();
      this.socket.onmessage = function(msg) {
        var docName;
        if (socketImpl === 'sockjs' || socketImpl === 'websocket') {
          msg = JSON.parse(msg.data);
        }
        if (msg.auth === null) {
          _this.lastError = msg.error;
          _this.disconnect();
          return _this.emit('connect failed', msg.error);
        } else if (msg.auth) {
          _this.id = msg.auth;
          _this.setState('ok');
          return;
        }
        docName = msg.doc;
        if (docName !== void 0) {
          _this.lastReceivedDoc = docName;
        } else {
          msg.doc = docName = _this.lastReceivedDoc;
        }
        if (_this.docs[docName]) {
          return _this.docs[docName]._onMessage(msg);
        } else {
          return typeof console !== "undefined" && console !== null ? console.error('Unhandled message', msg) : void 0;
        }
      };
      this.connected = false;
      this.socket.onclose = function(reason) {
        _this.setState('disconnected', reason);
        if (reason === 'Closed' || reason === 'Stopped by server') {
          return _this.setState('stopped', _this.lastError || reason);
        }
      };
      this.socket.onerror = function(e) {
        return _this.emit('error', e);
      };
      this.socket.onopen = function() {
        _this.send({
          auth: authentication ? authentication : null
        });
        _this.lastError = _this.lastReceivedDoc = _this.lastSentDoc = null;
        return _this.setState('handshaking');
      };
      this.socket.onconnecting = function() {
        return _this.setState('connecting');
      };
    }

    Connection.prototype.setState = function(state, data) {
      var doc, docName, _ref, _results;
      if (this.state === state) {
        return;
      }
      this.state = state;
      if (state === 'disconnected') {
        delete this.id;
      }
      this.emit(state, data);
      _ref = this.docs;
      _results = [];
      for (docName in _ref) {
        doc = _ref[docName];
        _results.push(doc._connectionStateChanged(state, data));
      }
      return _results;
    };

    Connection.prototype.send = function(data) {
      var docName;
      if (data.doc) {
        docName = data.doc;
        if (docName === this.lastSentDoc) {
          delete data.doc;
        } else {
          this.lastSentDoc = docName;
        }
      }
      if (socketImpl === 'sockjs' || socketImpl === 'websocket') {
        data = JSON.stringify(data);
      }
      return this.socket.send(data);
    };

    Connection.prototype.disconnect = function() {
      return this.socket.close();
    };

    Connection.prototype.makeDoc = function(name, data, callback) {
      var doc,
        _this = this;
      if (this.docs[name]) {
        throw new Error("Doc " + name + " already open");
      }
      doc = new Doc(this, name, data);
      this.docs[name] = doc;
      return doc.open(function(error) {
        if (error) {
          delete _this.docs[name];
        }
        if (!error) {
          doc.on('closed', function() {
            if (!doc.autoOpen) {
              return delete _this.docs[name];
            }
          });
        }
        return callback(error, (!error ? doc : void 0));
      });
    };

    Connection.prototype.openExisting = function(docName, callback) {
      var doc;
      if (this.state === 'stopped') {
        return callback('connection closed');
      }
      if (this.docs[docName]) {
        return this._ensureOpenState(this.docs[docName], callback);
      }
      return doc = this.makeDoc(docName, {}, callback);
    };

    Connection.prototype.open = function(docName, type, callback) {
      var doc;
      if (this.state === 'stopped') {
        return callback('connection closed');
      }
      if (this.state === 'connecting') {
        this.on('handshaking', function() {
          this.open(docName, type, callback);
          return callback = null;
        });
        return;
      }
      if (typeof type === 'function') {
        callback = type;
        type = 'text';
      }
      callback || (callback = function() {});
      if (typeof type === 'string') {
        type = types[type];
      }
      if (!type) {
        throw new Error("OT code for document type missing");
      }
      if (docName == null) {
        throw new Error('Server-generated random doc names are not currently supported');
      }
      if (this.docs[docName]) {
        doc = this.docs[docName];
        if (doc.type === type) {
          this._ensureOpenState(doc, callback);
        } else {
          callback('Type mismatch', doc);
        }
        return;
      }
      return this.makeDoc(docName, {
        create: true,
        type: type.name
      }, callback);
    };

    Connection.prototype._ensureOpenState = function(doc, callback) {
      switch (doc.state) {
        case 'open':
          callback(null, doc);
          break;
        case 'opening':
          this.on('open', function() {
            return callback(null, doc);
          });
          break;
        case 'closed':
          doc.open(function(error) {
            return callback(error, (!error ? doc : void 0));
          });
      }
    };

    return Connection;

  })();

  /*  Not currently working.*/


  /*   create: (type, callback) ->*/


  /*     open null, type, callback*/


  /*  Make connections event emitters.*/


  if (typeof WEB === "undefined" || WEB === null) {
    MicroEvent = require('./microevent');
  }

  MicroEvent.mixin(Connection);

  exports.Connection = Connection;

}).call(this);
