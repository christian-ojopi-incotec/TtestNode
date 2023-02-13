var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Mailjs from '@cemalgnlts/mailjs';
import puppeteer from 'puppeteer';
(() => __awaiter(void 0, void 0, void 0, function* () {
    const mailjs = new Mailjs();
    let key = null;
    const createAccount = () => __awaiter(void 0, void 0, void 0, function* () {
        const accountResponse = yield mailjs.createOneAccount();
        if (!accountResponse.status)
            return yield createAccount();
    });
    const checkMessages = () => __awaiter(void 0, void 0, void 0, function* () {
        const messagesResponse = yield mailjs.getMessages();
        if (messagesResponse.status) {
            const messages = messagesResponse.data;
            const novoTechMessages = messages.filter((message) => message.from.address === 'qlm@novotechsoftware.com');
            if (novoTechMessages) {
                novoTechMessages.forEach((novoTechMessage) => __awaiter(void 0, void 0, void 0, function* () {
                    const novoTechMessageDetailsResponse = yield mailjs.getMessage(novoTechMessage.id);
                    if (novoTechMessageDetailsResponse.status) {
                        const novoTechMessageDetails = novoTechMessageDetailsResponse.data;
                        const activationKeyText = "Your 14-day trial 'activation key' is:";
                        const activationKeyIndex = novoTechMessageDetails.text.indexOf(activationKeyText);
                        key = novoTechMessageDetails.text.substring(activationKeyIndex + activationKeyText.length + 5, activationKeyIndex + activationKeyText.length + 5 + 36);
                    }
                }));
            }
        }
        if (key === null) {
            yield new Promise((resolve) => {
                setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    yield checkMessages();
                    resolve(true);
                }), 5000);
            });
        }
    });
    yield createAccount();
    const browser = yield puppeteer.launch();
    const page = yield browser.newPage();
    yield page.setViewport({ width: 1920, height: 1080 });
    yield page.goto('https://qlm1.net/novotech/qlmcustomersite/qlmregistrationform.aspx?is_args=novocpt_demo');
    yield page.type('#txtFullName', 'TestUser');
    yield page.type('#txtEmail', mailjs.address);
    yield page.select('#txtCountry', 'Afghanistan');
    yield page.click('#chkMailingList');
    yield page.click('#chkConsentPrivacyPolicy');
    yield page.click('#btnRegister');
    yield checkMessages();
    yield browser.close();
    console.log(key);
}))();
//# sourceMappingURL=index.js.map