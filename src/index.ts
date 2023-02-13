import Mailjs from '@cemalgnlts/mailjs';
import puppeteer from 'puppeteer';

(async () => {
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
})();
