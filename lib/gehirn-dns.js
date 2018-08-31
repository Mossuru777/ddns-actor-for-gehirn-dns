const request = require('request-promise');
const base64 = require('base-64');

module.exports = class GehirnDNS {
    constructor(access_token, secret, options = {}) {
        this.access_token = access_token;
        this.secret = secret;
        this.domain = options.domain || 'api.gis.gehirn.jp';
        this.base_path = options.base_path || '/dns/v1/';
        this.https = options.https || true;
        this.debug = options.debug ? true : false;
    }

    async get(path, data) {
        return await this.request({
            method: 'GET',
            uri: this.url(path),
            body: data,
            json: true
        });
    }

    async push(path, data) {
        return await this.request({
            method: 'PUSH',
            uri: this.url(path),
            body: data,
            json: true
        });
    }

    async put(path, data) {
        return await this.request({
            method: 'PUT',
            uri: this.url(path),
            body: data,
            json: true
        });
    }

    async delete(path, data) {
        return await this.request({
            method: 'DELETE',
            uri: this.url(path),
            body: data,
            json: true
        });
    }

    url(path) {
        if (path.charAt(0) !== '/') {
            path = this.base_path + path;
        }
        return (this.https ? 'https://' : 'http://') + this.domain + path;
    }

    async request(options = {}) {
        options.headers = {
            Authorization: 'Basic ' + base64.encode(this.access_token + ':' + this.secret)
        };
        if (this.debug) {
            console.log('Request options:');
            console.log(options);
        }
        let response = await request(options)
        .then((res) => {
            if (this.debug) {
                console.log('Success! :');
                console.log(res);
            }
            return res;
        }, (err) => {
            if (this.debug) {
                console.log('Failed... :');
                console.log(err);
            }
            return err;
        });
        return response;
    }
};
