const GehirnDNS = require('./lib/gehirn-dns');
const request = require('request-promise');
const config = require('./config.js');
const c = require('ansi-colors');

var dns = new GehirnDNS(config.auth.token, config.auth.secret, config.option);

var error_process = function(text) {
    console.log(c.bold.red(text));
    process.exit(1);
};

var update_dns_record = async function() {
    var zone_id, version_id, target_record, current_ip;

    console.log(c.bold.underline('DDNS actor for GehirnDNS'));
    process.stdout.write('Checking DNS zones ... ');
    var zones = await dns.get('zones');
    for (var i = 0; i < zones.length; i++) {
        if (zones[i].name === config.target.zone) {
            zone_id = zones[i].id;
            version_id = zones[i].current_version.id;
            break;
        }
    }

    if (!zone_id) {
        error_process('Not found target zone.');
    }

    console.log(c.bold.green('Done'));
    console.log('current version ID: ' + version_id);
    process.stdout.write('Checking DNS records... ');

    var records = await dns.get('zones/' + zone_id + '/versions/' + version_id + '/records');

    for (var i = 0; i < records.length; i++) {
        if (records[i].name === config.target.record) {
            target_record = records[i];
            break;
        }
    }

    if (!target_record) {
        error_process('not found target record');
    }

    console.log(c.bold.green('Done'));
    process.stdout.write('Checking global ip address ... ');

    current_ip = await request.get({
        method: 'GET',
        uri: 'https://httpbin.org/ip',
        json: true
    });

    console.log(c.bold.green('Done'));
    console.log(`GHRN: ${target_record.records[0].address} <=> GLOB: ${current_ip.origin}`);

    if (target_record.records[0].address === current_ip.origin) {
        console.log(c.bold.cyan('Record is set latest IPaddress.'));
        process.exit(0);
    }

    console.log(c.bold.cyan('Updating DNS record.'));

    target_record.records[0].address = current_ip.origin;

    var version_org = await dns.get('zones/' + zone_id + '/versions/' + version_id);
    var version_new;

    console.log(version_org);

    if (!version_org.editable) {
        version_org.editable = true;
        version_org.id = undefined;
        version_new = await dns.push('zones/' + zone_id + '/versions', version);
        version_id = version_new.id;
        console.log(version_new);
    }

    var updated = await dns.put('zones/' + zone_id + '/versions/' + version_id + '/records/' + target_record.id, target_record);
    console.log(target_record);
    console.log(updated);

    if (!updated) {
        error_process('Failed record updated');
    }

    console.log(c.bold.green('Complete!'));
    process.exit(0);
};

update_dns_record();
