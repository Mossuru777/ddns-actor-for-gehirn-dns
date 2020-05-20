const fetch = require("node-fetch");

class GehirnDNS {
    constructor(access_token, secret, options = {}) {
        this.access_token = access_token;
        this.secret = secret;
        this.domain = options.domain || 'api.gis.gehirn.jp';
        this.base_path = options.base_path || '/dns/v1/';
        this.https = options.https || true;
        this.debug = !!options.debug;
    }

    async get(path) {
        return await this.request(path, {
            method: 'GET'
        });
    }

    async post(path, data) {
        const options = {
            method: 'POST'
        };
        if (data !== undefined) {
            options.body = JSON.stringify(data);
            options.headers = { 'Content-Type': 'application/json' };
        }
        return await this.request(path, options);
    }

    async put(path, data) {
        const options = {
            method: 'PUT'
        };
        if (data !== undefined) {
            options.body = JSON.stringify(data);
            options.headers = { 'Content-Type': 'application/json' };
        }
        return await this.request(path, options);
    }

    async delete(path, data) {
        const options = {
            method: 'DELETE'
        };
        if (data !== undefined) {
            options.body = JSON.stringify(data);
            options.headers = { 'Content-Type': 'application/json' };
        }
        return await this.request(path, options);
    }

    url(path) {
        if (path.charAt(0) !== '/') {
            path = this.base_path + path;
        }
        return (this.https ? 'https://' : 'http://') + this.domain + path;
    }

    async request(path, options = {}) {
        if (!("headers" in options)) {
            options.headers = {};
        }
        options.headers.Authorization = "Basic " + Buffer.from(`${this.access_token}:${this.secret}`).toString("base64");
        if (this.debug) {
            console.log('Request options:');
            console.log(options);
        }
        return await fetch(this.url(path), options)
          .then(res => {
              if (this.debug) {
                  console.log(res.ok ? 'Success! :' : 'Failed... :');
                  console.log(res);
              }
              return res.json();
          });
    }
}

module.exports = {
    GehirnDNS
};
