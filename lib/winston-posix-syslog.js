var util = require('util')
  , winston = require('winston')
  , posix = require('posix')
  ;

var syslogLevels = {
  debug: 'debug',
  info: 'info',
  notice: 'notice',
  warning: 'warning',
  error: 'err',
  crit: 'crit',
  alert: 'alert',
  emerg: 'emerg'
};

var getMasks = function() {
  var masks = {};

  for (var level in syslogLevels) {
    var mask = syslogLevels[level];
    masks[mask] = true;
  }

  return masks;
}

var PosixSyslog = winston.transports.PosixSyslog = function (options) {
  winston.Transport.call(this, options);
  options = options || {};

  this.identity = options.identity || process.title;
  this.facility = options.facility || 'local0';

  this.openLogOptions = {
    cons: options.cons || true,
    ndelay: options.ndelay || true,
    pid: options.pid || true,
    nowait: options.nowait || true,
    odelay: options.odelay || false
  }
};

var buildMessage = function(msg, meta, level) {
  if (typeof(meta) == 'object' && meta && Object.keys(meta).length && 'program' in meta) {
    return util.format("%s %s %s", meta.program, level.toUpperCase(), msg);
  } else {
    return util.format("%s %s", level.toUpperCase(), msg);
  }
};

util.inherits(PosixSyslog, winston.Transport);

PosixSyslog.prototype.name = 'posixSyslog';

PosixSyslog.prototype.log = function (level, msg, meta, callback) {
  var self = this;

  // We ignore any incompatible levels
  if (level in syslogLevels) {
    posix.openlog(self.identity, self.openLogOptions, self.facility);
    posix.setlogmask(getMasks());
    posix.syslog(syslogLevels[level], buildMessage(msg, meta, level));
    posix.closelog();
    self.emit('logged');
  }

  callback(null, true);
};

exports.PosixSyslog = PosixSyslog;
