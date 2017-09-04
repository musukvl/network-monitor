const StatusDbClient = require('node-statusdb-client');
const config = require('./config');

module.exports = new StatusDbClient(config('status-db-url'), config('api-key'));
