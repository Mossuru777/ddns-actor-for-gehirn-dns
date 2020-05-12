const {GehirnDNS} = require("./lib/gehirn-dns");
const c = require("ansi-colors");
const config = require("./config");

async function test(description, callback) {
    process.stdout.write(`${description} ... `);
    let result = await callback();
    if (!result) throw `${description} error`;
    process.stdout.write(c.bold.green('OK') + "\n");
}
(async () => {
    try {
        console.log(c.bold.underline('DDNS actor for GehirnDNS'));

        console.log(c.underline('### Checking configuration ### '));
        await test('config.auth.token', () => config.auth.token);
        await test('config.auth.secret', () => config.auth.secret);
        await test('config.target.zone', () => config.target.zone);
        await test('config.target.record', () => config.target.record);

        let gehirn = new GehirnDNS(config.auth.token, config.auth.secret);
        await test('GET request to GehirnDNS', async () => {
            let res = await gehirn.get('zones');
            return !!Array.isArray(res);
        });
        process.exit(0);
    }
    catch (e) {
        process.stdout.write(c.bold.red('NG') + "\n");
        process.exit(1);
    }
})();
