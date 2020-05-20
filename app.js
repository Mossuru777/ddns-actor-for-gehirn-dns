const {GehirnDNS} = require("./lib/gehirn-dns");
const {HTTPBinIPGetter, RS500KIIPGetter} = require("./lib/ip-getter");
const c = require("ansi-colors");
const config = require("./config");

const ip_getter = (() => {
    if (config.ip_getter.type === "HTTPBin") {
        return new HTTPBinIPGetter(config.ip_getter.ip_cache_path);
    } else if (config.ip_getter.type === "RS-500KI") {
        return new RS500KIIPGetter(config.ip_getter.ip_cache_path, config.ip_getter.options);
    } else {
        error_process(`Invalid Config: ip_getter.type (Unknown Type) -> ${config.ip_getter.type}`);
    }
})();
const dns = new GehirnDNS(config.auth.token, config.auth.secret, config.option);

const error_process = function (text) {
    console.log(c.bold.red(text));
    process.exit(1);
};

const caching_ip = async ip => {
    process.stdout.write('Caching IP address ... ');
    return ip_getter.setIpToCache(ip)
      .then(() => {
          console.log(c.bold.green('Done'));
      })
      .catch(reason => {
          console.log(c.bold.red(`Failed: ${reason}`));
      });
};

const update_dns_record = async function () {
    console.log(c.bold.underline('DDNS actor for GehirnDNS'));

    process.stdout.write('Checking global ip address ... ');
    let current_ip;
    try {
        // タイムアウト5秒で取得を行う
        current_ip = await ip_getter.getGlobalIP(5000);
        console.log(c.bold.green('Done'));
    } catch (err) {
        error_process(`Error: ${err}`);
    }

    process.stdout.write('Checking cache ip address ... ');
    const cached_ip = await ip_getter.getIpFromCache()
      .then(ip => {
          console.log(c.bold.green('Done'));
          return ip;
      })
      .catch(reason => {
          console.log(c.yellowBright(`Skip: ${reason}`));
          return null;
      });

    if (cached_ip !== null) {
        console.log(`CACHE: ${cached_ip} <=> CURRENT: ${current_ip}`);
        if (cached_ip === current_ip) {
            console.log(c.bold.cyan('Cache is latest IP address.'));
            process.exit(0);
        }
    }

    process.stdout.write('Checking DNS zones ... ');
    let {zone_id, version_id} = await (async () => {
        const zones = await dns.get('zones');
        for (let i = 0; i < zones.length; i++) {
            if (zones[i].name === config.target.zone) {
                const zone_id = zones[i].id;
                const version_id = zones[i].current_version.id;
                return {zone_id, version_id};
            }
        }
        error_process('Not found target zone.');
    })();

    console.log(c.bold.green('Done'));
    console.log('current version ID: ' + version_id);
    process.stdout.write('Checking DNS records... ');

    const records = await dns.get('zones/' + zone_id + '/versions/' + version_id + '/records');
    const target_record = (() => {
        for (let i = 0; i < records.length; i++) {
            if (records[i].name === config.target.record) {
                return records[i];
            }
        }
        error_process('not found target record');
    })();
    console.log(c.bold.green('Done'));

    console.log(`GEHIRN: ${target_record.records[0].address} <=> CURRENT: ${current_ip}`);
    if (target_record.records[0].address === current_ip) {
        console.log(c.bold.cyan('Record is set latest IP address.'));
        if (target_record.records[0].address !== cached_ip) {
            await caching_ip(target_record.records[0].address);
        }
        process.exit(0);
    }

    console.log(c.bold.cyan('Updating DNS record.'));

    target_record.records[0].address = current_ip;

    let version = await dns.get('zones/' + zone_id + '/versions/' + version_id);
    console.log(version);
    if (!version.editable) {
        version = await dns.post('zones/' + zone_id + '/versions', version);
        version_id = version.id;
        console.log('new version id: ' + version.id);
        console.log(version);
    }

    const updated = await dns.put('zones/' + zone_id + '/versions/' + version_id + '/records/' + target_record.id, target_record);
    console.log(target_record);
    console.log(updated);
    if (!updated) {
        error_process('Failed record updated');
    }

    console.log(c.bold.green('Complete!'));
    if (target_record.records[0].address !== cached_ip) {
        await caching_ip(target_record.records[0].address);
    }
    process.exit(0);
};

update_dns_record();
