import "./style.css";
import {
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

import * as StellarSdk from "@stellar/stellar-sdk";

document.querySelector("#app").innerHTML = `
<h1>Stellar White Belt</h1>
<p>Stellar Testnet'e Hoş Geldiniz!</p>

<button id="connectWallet">
Cüzdanı Bağla
</button>

<p id="walletAddress"></p>

<button id="disconnectWallet">
Bağlantıyı Kes
</button>
<br><br>

<input id="destination" placeholder="Alıcı Stellar adresi">

<br><br>

<input id="amount" placeholder="XLM miktarı">

<br><br>

<button id="sendXLM">
XLM Gönder
</button>

<p id="transactionResult"></p>
`;

const button = document.querySelector("#connectWallet");
const disconnectButton = document.querySelector("#disconnectWallet");

button.addEventListener("click", async () => {
  try {
    await requestAccess();

    const address = await getAddress();

    const response = await fetch(
      `https://horizon-testnet.stellar.org/accounts/${address.address}`
    );

    const account = await response.json();

    const xlm = account.balances.find(
      (b) => b.asset_type === "native"
    ).balance;

    document.querySelector("#walletAddress").innerHTML =
      `Bağlandı: ${address.address}<br><br>XLM Bakiyesi: ${xlm}`;

  } catch (error) {
    console.error(error);
  }
});

disconnectButton.addEventListener("click", () => {
  document.querySelector("#walletAddress").innerHTML =
    "Cüzdan bağlantısı kesildi.";
});
const sendButton = document.querySelector("#sendXLM");

sendButton.addEventListener("click", async () => {
  try {
    const sender = await getAddress();

    const destination = document.querySelector("#destination").value;
    const amount = document.querySelector("#amount").value;

    const server = new StellarSdk.Horizon.Server(
      "https://horizon-testnet.stellar.org"
    );

    const sourceAccount = await server.loadAccount(sender.address);

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destination,
          asset: StellarSdk.Asset.native(),
          amount: amount,
        })
      )
      .setTimeout(180)
      .build();

    const signed = await signTransaction(
      transaction.toXDR(),
      {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      }
    );

    const result = await server.submitTransaction(
      StellarSdk.TransactionBuilder.fromXDR(
        signed.signedTxXdr,
        StellarSdk.Networks.TESTNET
      )
    );

    document.querySelector("#transactionResult").innerHTML =
      "Başarılı! İşlem Hash: " + result.hash;

  } catch (error) {
    console.error(error);

    document.querySelector("#transactionResult").innerHTML =
      "İşlem başarısız.";
  }
});