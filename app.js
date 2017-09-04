const nmap = require('node-nmap');
const config = require('./config/config');
const fs = require('fs');
const log = require("./config/log")("network-site");
const statusDbClient = require("./config/statusDbClient");

class NetworkScanner {

    constructor(networkState){
        this._networkState = this.loadNetworkState();
    }

    compareStates(a, b) {
        a = a.map(x => x.mac).sort();
        b = b.map(x => x.mac).sort();
        return JSON.stringify(a) == JSON.stringify(b);
    }

    async scanNetwork() {
        let result = await this.runScan(this._networkState);
        result = result.filter(x => x.mac).map(x => {
            return {
                hostname: x.hostname,
                ip: x.ip,
                mac: x.mac,
                vendor: x.vendor
            }});
        if (this.compareStates(this._networkState, result)) {
            return;
        }

        log.debug('Change network');
        let turnedOffHosts = this._networkState
            .filter(host => {
                return !result.find(x => host.mac == x.mac);
            });

        let statuses = result
            .map(host => {
                let status = statusDbClient.buildStatusObject(config("namespace"), host.mac, "ON", host);
                return status;
            });

        for (let host of turnedOffHosts) {
            let status = statusDbClient.buildStatusObject(config("namespace"), host.mac, "OFF", host);
            statuses.push(status);
        }

        this._networkState = result;
        await this.saveNetworkstate(result);
        try {
            await
            statusDbClient.sendStatus(statuses);
        } catch (e) {
            log.error(e.message);
        }
    }

    async runScan() {
        let quickscan = new nmap.QuickScan(config('network-mask'));
        return new Promise((resolve) => {
            quickscan.on('complete', resolve);
        });
    }

    loadNetworkState() {
        try {
            let value = fs.readFileSync(config('state-file'));
            return JSON.parse(value);
        }
        catch (e) {
            return [];
        }
        return [];
    }

    saveNetworkstate(state) {
        return fs.writeFileSync(config('state-file'), JSON.stringify(state));
    }
}

async function main() {

    log.info(`App started with env=${config('NODE_ENV')}`);

    nmap.nmapLocation = 'nmap'; //default
    let networkScanner = new NetworkScanner();

    let timerId = setTimeout(async function tick() {
        let result = await networkScanner.scanNetwork();
        timerId = setTimeout(tick, config("check-period"));
    }, config("check-period"));
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

main();


