const AbortController = require("abort-controller");
const fetch = require("node-fetch");
const libxmljs = require("libxmljs");

class IPGetter {
    async getGlobalIP(timeout) {
        return Promise.reject("Not implemented.");
    }
}

class HTTPBinIPGetter extends IPGetter {
    async getGlobalIP(timeout) {
        const fetch_options = {
            method: "GET"
        }
        if (timeout !== null) {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), timeout);
            fetch_options.signal = controller.signal;
        }
        return fetch('https://httpbin.org/ip', fetch_options)
          .then(async res => {
              if (res.ok) {
                  return (await res.json()).origin;
              } else {
                  return Promise.reject(res);
              }
          });
    }
}

class RS500KIIPGetter extends IPGetter {
    ip_regexp = /^(?:(?:[1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.){3}(?:[1-9]?\d|1\d\d|2[0-4]\d|25[0-5])$/;

    constructor(options) {
        super();
        if (!options || !options.ip || !options.user || !options.password) {
            throw new Error("Invalid Options: RS-500KI");
        }
        this.options = options;
    }

    async getGlobalIP(timeout) {
        const fetch_options = {
            method: "GET",
            headers: {
                Authorization: "Basic " + Buffer.from(`${this.options.user}:${this.options.password}`).toString("base64")
            }
        }
        if (timeout !== null) {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), timeout);
            fetch_options.signal = controller.signal;
        }
        return fetch(`http://${this.options.ip}/ntt/information/fifth/current`, fetch_options)
          .then(async res => {
              if (res.ok) {
                  const doc = libxmljs.parseHtml(await res.text())
                  // メインセッションの接続状況・IPアドレスを取得
                  const status = doc.get("/html/body/div[9]/table/tbody/tr[1]/td").text().trim();
                  if (status === "接続中") {
                      const ip = doc.get("/html/body/div[9]/table/tbody/tr[2]/td").text().trim();
                      if (this.ip_regexp.test(ip)) {
                          return ip;
                      } else {
                          return Promise.reject(`Invalid IP format: ${ip}`)
                      }
                  } else {
                      return Promise.reject(`Not connected detected: ${status}`);
                  }
              } else {
                  return Promise.reject(res.status);
              }
          });
    }
}

module.exports = {
    IPGetter,
    HTTPBinIPGetter,
    RS500KIIPGetter
};
