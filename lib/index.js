import { serve } from 'https://deno.land/std@0.155.0/http/server.ts';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';
var Mailjs = (function (o) {
    'use strict';
    return class {
        constructor() {
            (this.baseUrl = 'https://api.mail.tm'), (this.token = ''), (this.id = ''), (this.address = '');
        }
        register(t, s) {
            return this.send_('/accounts', 'POST', { address: t, password: s });
        }
        async login(t, s) {
            s = await this.send_('/token', 'POST', { address: t, password: s });
            return s.status && ((this.token = s.data.token), (this.id = s.data.id), (this.address = t)), s;
        }
        async loginWithToken(t) {
            this.token = t;
            t = await this.me();
            if (t.status) return (this.id = t.data.id), (this.address = t.data.address), t;
            throw new Error(t.message);
        }
        me() {
            return this.send_('/me');
        }
        getAccount(t) {
            return this.send_('/accounts/' + t);
        }
        deleteAccount(t) {
            return this.send_('/accounts/' + t, 'DELETE');
        }
        deleteMe() {
            return this.deleteAccount(this.id);
        }
        getDomains() {
            return this.send_('/domains?page=1');
        }
        getDomain(t) {
            return this.send_('/domains/' + t);
        }
        getMessages(t = 1) {
            return this.send_('/messages?page=' + t);
        }
        getMessage(t) {
            return this.send_('/messages/' + t);
        }
        deleteMessage(t) {
            return this.send_('/messages/' + t, 'DELETE');
        }
        setMessageSeen(t, s = !0) {
            return this.send_('/messages/' + t, 'PATCH', { seen: s });
        }
        getSource(t) {
            return this.send_('/sources/' + t);
        }
        async createOneAccount() {
            let t = await this.getDomains();
            if (!t.status) return t;
            t = t.data[0].domain;
            var s = this.makeHash_(5) + '@' + t,
                e = this.makeHash_(8);
            let a = await this.register(s, e);
            if (!a.status) return a;
            a = a.data;
            let n = await this.login(s, e);
            return n.status ? ((n = n.data), { status: !0, data: { username: s, password: e } }) : n;
        }
        makeHash_(t) {
            return Array.from({ length: t }, () => {
                var t = 'abcdefghijklmnopqrstuvwxyz0123456789';
                return t.charAt(Math.floor(Math.random() * t.length));
            }).join('');
        }
        async send_(t, s = 'GET', e) {
            const a = { method: s, headers: { accept: 'application/json', authorization: 'Bearer ' + this.token } };
            if ('POST' === s || 'PATCH' === s) {
                const i = 'PATCH' === s ? 'merge-patch+json' : 'json';
                (a.headers['content-type'] = 'application/' + i), (a.body = JSON.stringify(e));
            }
            const n = await o(this.baseUrl + t, a);
            let r;
            const i = n.headers.get('content-type');
            return (
                (r = null !== i && void 0 !== i && i.startsWith('application/json') ? await n.json() : await n.text()),
                { status: n.ok, message: n.ok ? 'ok' : r.message || r.detail, data: r }
            );
        }
    };
})(fetch);

serve(async (req) => {
    const mailjs = new Mailjs();
    let key = null;

    const createAccount = async () => {
        const accountResponse = await mailjs.createOneAccount();
        if (!accountResponse.status) return await createAccount();
    };

    const checkMessages = async () => {
        const messagesResponse = await mailjs.getMessages();
        if (messagesResponse.status) {
            const messages = messagesResponse.data;
            const novoTechMessages = messages.filter((message) => message.from.address === 'qlm@novotechsoftware.com');
            if (novoTechMessages) {
                novoTechMessages.forEach(async (novoTechMessage) => {
                    const novoTechMessageDetailsResponse = await mailjs.getMessage(novoTechMessage.id);
                    if (novoTechMessageDetailsResponse.status) {
                        const novoTechMessageDetails = novoTechMessageDetailsResponse.data;
                        const activationKeyText = "Your 14-day trial 'activation key' is:";
                        const activationKeyIndex = novoTechMessageDetails.text.indexOf(activationKeyText);

                        key = novoTechMessageDetails.text.substring(
                            activationKeyIndex + activationKeyText.length + 5,
                            activationKeyIndex + activationKeyText.length + 5 + 36
                        );
                    }
                });
            }
        }
        if (key === null) {
            await new Promise((resolve) => {
                setTimeout(async () => {
                    await checkMessages();
                    resolve(true);
                }, 5000);
            });
        }
    };

    await createAccount();

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto('https://qlm1.net/novotech/qlmcustomersite/qlmregistrationform.aspx?is_args=novocpt_demo');

    await page.type('#txtFullName', 'TestUser');

    await page.type('#txtEmail', mailjs.address);

    await page.select('#txtCountry', 'Afghanistan');

    await page.click('#chkMailingList');

    await page.click('#chkConsentPrivacyPolicy');

    await page.click('#btnRegister');

    await checkMessages();

    await browser.close();

    console.log(key);

    return new Response(key);
});
