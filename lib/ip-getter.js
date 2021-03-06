const AbortController = require("abort-controller");
const fetch = require("node-fetch");
const libxmljs = require("libxmljs");
const fs = require("fs").promises;

class IPGetter {
    ip_regexp = /^(?:(?:[1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.){3}(?:[1-9]?\d|1\d\d|2[0-4]\d|25[0-5])$/;

    constructor(ip_cache_path) {
        if (typeof ip_cache_path !== "string" && ip_cache_path !== null) {
            throw new Error("Invalid Config: ip_getter.ip_cache_path");
        }
        this.ip_cache_path = ip_cache_path;
    }

    async getIpFromCache() {
        if (this.ip_cache_path === null) {
            return Promise.reject("ip_getter.ip_cache_path === null.");
        }
        return fs.readFile(this.ip_cache_path, "utf-8")
          .then(ip => {
              return this.ip_regexp.test(ip) ? ip : Promise.reject("cached IP format is invalid.");
          });
    }

    async setIpToCache(ip) {
        return fs.writeFile(this.ip_cache_path, ip, "utf-8");
    }

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
    constructor(ip_cache_path, options) {
        super(ip_cache_path);
        if (!options || !options.ip || !options.user || !options.password
            || !options.session || options.session < 1 || options.session > 5
        ) {
            throw new Error("Invalid Options: RS-500KI");
        }
        this.options = options;
    }

    async getGlobalIP(timeout) {
        const status_elem_num = (this.options.session - 1) * 4 + 1;
        const wan_ip_elem_num = status_elem_num + 1;
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
                  const status = doc.get(`/html/body/div[9]/table/tbody/tr[${status_elem_num}]/td`).text().trim();
                  if (status === "接続中") {
                      const ip = doc.get(`/html/body/div[9]/table/tbody/tr[${wan_ip_elem_num}]/td`).text().trim();
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
