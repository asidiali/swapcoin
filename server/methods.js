Meteor.methods({
    "getAccounts": function () {
        client.getAccounts({}, function(err, accounts) {
          console.log(accounts)
        });
    },
    "sendBitcoin": function (originalAmt, address) {
        check(originalAmt, Number)
        var amtBtc = originalAmt;
        console.log("sending " + amtBtc + " BTC");
        client.getAccount('790a703c-7de7-522e-9c9d-027b15292a73', function(err, account) {
          account.sendMoney({'to': address,
                             'amount': amtBtc,
                             'description': 'Thanks for using Swapcoin!',
                             'currency': 'BTC'}, function (tx) {
                                 console.log("===========");
                                 console.log(tx);
                                 console.log("===========");
                             });
        });
    },

    "getTransactionHistory": function () {
        var getLatestTransactionHistory = new Future();

        client.getAccount('790a703c-7de7-522e-9c9d-027b15292a73', function(err, account) {
            account.getTransactions(null, function(err, txs) { // null will return all history instead of just one ID
                getLatestTransactionHistory.return(txs);
            });
        });

        return getLatestTransactionHistory.wait();
    },

    "getExchange": function (ex) {
        var getExchangeFuture = new Future();

        client.getExchangeRates({"currency": ex}, function (err,rates) {
            getExchangeFuture.return(rates);
        })

        return getExchangeFuture.wait();
    }
})
