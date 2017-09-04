const nconf = require('nconf');

let config = nconf
        .argv({
        })
        .env()
        .defaults({
            'NODE_ENV': 'develop'
        });

let env = nconf.get('NODE_ENV');
if (env) {
    nconf.file(`./config.${env}.json`);
}
nconf.file('defaults1', `./config.json`);

function getConfigParam(param) {
    return config.get(param);
}

module.exports = getConfigParam;