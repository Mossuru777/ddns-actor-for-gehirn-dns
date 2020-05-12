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

    async get(path, data) {
        return await this.request(path, 'get', data);
    }

    async push(path, data) {
        return await this.request(path, 'PUSH', data);
    }

    async put(path, data) {
        return await this.request(path, 'PUT', data);
    }

    async delete(path, data) {
        return await this.request(path, 'DELETE', data);
    }

    url(path) {
        if (path.charAt(0) !== '/') {
            path = this.base_path + path;
        }
        return (this.https ? 'https://' : 'http://') + this.domain + path;
    }

    async request(path, method, body) {
        const options = {
            method: method,
            body: body,
            headers: {
                Authorization: "Basic " + Buffer.from(`${this.access_token}:${this.secret}`).toString("base64")
            }
        };
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
